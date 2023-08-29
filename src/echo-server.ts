import * as http from 'node:http';
import * as url from 'node:url';

export const createEchoHttpServer = async (port = 20000) => {

    const echoRequest = (request: http.IncomingMessage, response: http.ServerResponse) => {
        let body: Array<Buffer> = [];
        request.on('data', (chunk: Buffer) => {
            body.push(chunk);
        }).on('end', () => {
            const buf = Buffer.concat(body).toString();
            response.statusCode = 200;
            response.end(buf);
        });
    };

    const fileGenerator = (size: number, chunkSize: number, response: http.ServerResponse) => {
        let sentBytes: number = 0;

        response.statusCode = 200;
        response.setHeader("Content-Type", "application/octet-stream");
        response.setHeader('Content-Disposition', 'attachment; filename="file.bin"');
        response.setHeader("Content-Length", size);

        const writeChunk = () => {
            if (sentBytes < size) {
                const remainingBytes = size - sentBytes;
                const chunkToSend = Math.min(chunkSize, remainingBytes);

                const buffer = Buffer.alloc(chunkToSend);
                response.write(buffer);

                sentBytes += chunkToSend;

                setTimeout(writeChunk, 0);
            } else {
                response.end();
            }
        }

        writeChunk();
    };

    const requestHandler = (request: http.IncomingMessage, response: http.ServerResponse) => {

        const parsedUrl = url.parse(<string>request.url, true)

        if (request.method == "GET" && parsedUrl.pathname == '/file') {
            const size = Number(parsedUrl.query["size"] || "32");
            const chunkSize = Number(parsedUrl.query["chunk"] || "262144");
            return fileGenerator(size, chunkSize, response);
        } else {
            return echoRequest(request, response);
        }
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