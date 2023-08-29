import http, { RequestOptions } from 'node:http';
import { WebSocketServer } from 'ws';
import WebSocketMultiplex from '@exposr/ws-multiplex';
import { Socket } from 'node:net';

let wsm: WebSocketMultiplex | undefined;

const requestHandler = (request: http.IncomingMessage, response: http.ServerResponse) => {

    if (wsm == undefined) {
        response.statusCode = 502;
        response.end("Not connected to websocket peer");
        return;
    }

    const headers = { ...request.headers };
    delete headers['host'];

    const requestOptions: RequestOptions = {
        path: request.url,
        method: request.method,
        headers: request.headers,
        createConnection: (options: object, callback: (err: Error, sock: Socket) => void): Socket => {
            const sock = (<any>wsm).createConnection({}, callback);
            sock.on('error', () => {
                sock.destroy();
            });
            return sock;
        }
    };

    const clientReq = http.request(requestOptions, (res) => {
        response.writeHead(<number>res.statusCode, res.headers);
        res.pipe(response);
    });
    clientReq.setTimeout(5000);

    clientReq.on('error', (err: Error) => {
        console.log(err)
        response.end();
    });

    clientReq.on('timeout', () => {
        response.end();
        clientReq.destroy();
    });

    request.pipe(clientReq);
}

const httpServer = http.createServer(requestHandler);
httpServer.listen(8080, () => {
    console.log("Listening for HTTP request on 8080");
});

const wss = new WebSocketServer({port: 30000});
wss.on('connection', (sock) => {
    console.log("Accepted websocket connection");
    wsm = new WebSocketMultiplex(sock);
});
console.log("Listening for websocket connections on 30000");

process.on('SIGUSR1', () => {
    const diag = wsm?.diagnostics();
    const mem = process.memoryUsage();
    console.log(`open_chan=${diag?.openChannels} read=${diag?.bytesRead} written=${diag?.bytesWritten}`);
    console.log(`rss=${mem.rss} arrayBuffers=${mem.arrayBuffers}`);
});