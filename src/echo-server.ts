import * as http from 'node:http';

export const createEchoHttpServer = async (port = 20000) => {
    const requestHandler = (request: http.IncomingMessage, response: http.ServerResponse) => {
        let body: Array<Buffer> = [];
        request.on('data', (chunk: Buffer) => {
            body.push(chunk);
        }).on('end', () => {
            const buf = Buffer.concat(body).toString();
            response.statusCode = 200;
            response.end(buf);
        });
    }
    const server = http.createServer(requestHandler);
    server.listen(port);
    return {
        destroy: () => {
            server.removeAllListeners('request');
            server.close();
        }
    };
};