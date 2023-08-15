import http, { RequestOptions } from 'node:http';
import { WebSocketServer } from 'ws';
import WebSocketMultiplex from '@exposr/ws-multiplex';
import { Socket } from 'node:net';
import { Duplex } from 'node:stream';

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
            return (<any>wsm).createConnection({}, (err: Error, sock: Duplex) => {
                callback(<any>err, <Socket>sock);
            });
        }
    };

    const clientReq = http.request(requestOptions, (res) => {
        response.writeHead(<number>res.statusCode, res.headers);
        res.pipe(response);
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