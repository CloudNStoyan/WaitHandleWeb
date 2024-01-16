import { WebSocket } from 'ws';

interface WaitHandleIncomingMessage {
  action: 'released';
  id: string;
}

interface WaitHandleOutgoingMessage {
  action: 'wait' | 'release';
  id: string;
}

export class WaitHandleClient {
  private socketConnection: WebSocket;
  private resolveCollection: Map<string, (() => void)[]>;

  constructor(url: string) {
    this.socketConnection = new WebSocket(url);
    this.resolveCollection = new Map();

    this.socketConnection.on('open', () => {
      this.socketConnection.on('message', (data: Buffer | Buffer[]) => {
        const incomingMessage = JSON.parse(
          data.toString()
        ) as WaitHandleIncomingMessage;

        if (incomingMessage.action === 'released') {
          const { id } = incomingMessage;

          if (!this.resolveCollection.has(id)) {
            return;
          }

          const resolves = this.resolveCollection.get(id)!;

          for (const resolve of resolves) {
            resolve();
          }

          this.resolveCollection.delete(id);
        }
      });
    });
  }

  private async waitForConnection() {
    if (this.socketConnection.readyState === WebSocket.OPEN) {
      return;
    }

    await new Promise<void>((resolve, _reject) => {
      // typescript doesn't let me to pass only the resolve
      // because it doesn't accept event arg
      this.socketConnection.addEventListener('open', () => resolve());
    });
  }

  public async wait(id: string): Promise<void> {
    await this.waitForConnection();

    return new Promise((resolve, _reject) => {
      const outgoingMessage = {
        action: 'wait',
        id,
      } as WaitHandleOutgoingMessage;

      this.socketConnection.send(JSON.stringify(outgoingMessage));

      if (this.resolveCollection.has(id)) {
        this.resolveCollection.get(id)!.push(resolve);
      } else {
        this.resolveCollection.set(id, [resolve]);
      }
    });
  }

  public async release(id: string): Promise<void> {
    await this.waitForConnection();

    return new Promise((resolve, _reject) => {
      const outgoingMessage = {
        action: 'release',
        id,
      } as WaitHandleOutgoingMessage;

      this.socketConnection.send(JSON.stringify(outgoingMessage));

      resolve();
    });
  }
}
