import { createServer } from 'http';

import { type AddressInfo, type WebSocket, WebSocketServer } from 'ws';

interface WaitHandleIncomingMessage {
  action: 'wait' | 'release';
  id: string;
}

interface WaitHandleOutgoingMessage {
  action: 'released';
  id: string;
}

export class WaitHandleServer {
  public readonly port: number;
  private socketServer: WebSocketServer;
  private connections: Map<number, WebSocket>;
  private subscribedSockets: Map<string, number[]>;
  private webSocketIdValue: number = 0;

  constructor() {
    this.connections = new Map();
    this.subscribedSockets = new Map();

    const httpServer = createServer();
    this.socketServer = new WebSocketServer({ server: httpServer });

    const generateWebSocketId = () => {
      this.webSocketIdValue += 1;
      return this.webSocketIdValue;
    };

    this.socketServer.on('connection', (ws) => {
      const socketId = generateWebSocketId();

      ws.on('message', (data: Buffer | Buffer[]) => {
        const incomingMessage = JSON.parse(
          data.toString()
        ) as WaitHandleIncomingMessage;

        const { id } = incomingMessage;

        if (incomingMessage.action === 'wait') {
          if (this.subscribedSockets.has(id)) {
            this.subscribedSockets.get(id)!.push(socketId);
          } else {
            this.subscribedSockets.set(id, [socketId]);
          }
        }

        if (incomingMessage.action === 'release') {
          if (!this.subscribedSockets.has(id)) {
            return;
          }

          const subscribedSocketIds = this.subscribedSockets.get(id)!;

          for (const subscribedSocketId of subscribedSocketIds) {
            if (!this.connections.has(subscribedSocketId)) {
              // eslint-disable-next-line no-continue
              continue;
            }

            const socket = this.connections.get(socketId)!;

            const outgoingMessage = {
              action: 'released',
              id,
            } as WaitHandleOutgoingMessage;

            socket.send(JSON.stringify(outgoingMessage));
          }

          // we clear the wait collection
          this.subscribedSockets.delete(id);
        }
      });

      this.connections.set(socketId, ws);

      ws.on('close', () => {
        this.connections.delete(socketId);
      });
    });

    httpServer.listen();

    // we assume its TCP
    const address = httpServer.address() as AddressInfo;

    this.port = address.port;
  }
}
