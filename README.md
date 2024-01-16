# WaitHandleWeb

A WebSocket powered WaitHandle that allows you to have the WaitHandle functionality over the internet

## WaitHandleClient.ts

The client side of the WaitHandle

```javascript
const waitHandleClient = new WaitHandleClient(`ws://<WaitHandleServerIp>:<WaitHandleServerPort>`);

await waitHandleClient.wait('for-something-to-happen'); // this resolves when the websocket server 
                                                        // receives 'release' message with the same id 'for-something-to-happen'

// do stuff after the release message

// ##################################################################

// on some other process with some other instance of WaitHandleClient
waitHandleClient.release('for-something-to-happen');
```

## WaitHandleServer.ts

The server side of the WaitHandle

```javascript
const waitHandleServer = new WaitHandleServer();

// waitHandleServer.port -- the port that is automatically assigned 
//                          to the websocket that is used on the client side
```
