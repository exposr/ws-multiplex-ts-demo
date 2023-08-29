import net from 'node:net';
import { WebSocket } from "ws";
import { createEchoHttpServer } from "./echo-server";
import WebSocketMultiplex, { WebSocketMultiplexSocket } from "@exposr/ws-multiplex";

const connect = (port: number): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
        let sock: WebSocket;
        sock = new WebSocket(`ws://127.0.0.1:${port}`);
        sock.once('error', reject);
        sock.once('open', () => {
            sock.off('error', reject);
            resolve(sock);
        });
    });
};

(async () => {
    const echoServer = createEchoHttpServer();
    console.log("HTTP echo server listening on 20000");

    const ws = await connect(30000);
    console.log("Connected to websocket server");

    const wsm = new WebSocketMultiplex(ws);
    wsm.on("connection", (sock: WebSocketMultiplexSocket) => {
        const targetSock = new net.Socket();
        targetSock.connect({
            host: 'localhost',
            port: 20000
        }, () => {
            targetSock.pipe(sock);
            sock.pipe(targetSock);
        });

        const close = () => {
            targetSock.unpipe(sock);
            sock.unpipe(targetSock);
            sock.destroy();
            targetSock.destroy();
        };

        targetSock.on('close', close);
        sock.on('close', close);
        sock.on('error', () => {
            close();
        });
        targetSock.on('error', () => {
            close();
        });
    });

    wsm.on('close', () => {
        wsm.destroy();
        ws.terminate();
    });

    process.on('SIGUSR1', () => {
        const diag = wsm.diagnostics();
        const mem = process.memoryUsage();
        console.log(`open_chan=${diag.openChannels} read=${diag.bytesRead} written=${diag.bytesWritten}`);
        console.log(`rss=${mem.rss} arrayBuffers=${mem.arrayBuffers}`);
    });

})();