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

    const sock = wsm.createConnection({}, () => {
        const headers = { ...request.headers };
        delete headers['host'];

        const requestOptions: RequestOptions = {
            path: request.url,
            method: request.method,
            headers: request.headers,
            createConnection: (): Socket => {
                return <Socket>sock;
            }
        };

        const clientReq = http.request(requestOptions, (res) => {
            response.writeHead(<number>res.statusCode, res.headers);
            res.pipe(response);
        });

        request.pipe(clientReq);
    });

    sock.on('error', (err: Error) => {
        response.statusCode = 502;
        response.end(err.message);
    });
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