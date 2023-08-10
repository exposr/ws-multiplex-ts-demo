# Demo of the ws-multiplex package

This demo showcases the ws-multiplex package by creating 
a websocket server and websocket client, and opening a channel multiplexer
on the open websocket.

The server component also creates a plain HTTP server than accepts
incoming connections. Each HTTP request is forwarded over the channel multiplexer.

The client component proxies each multiplexed channel to a different HTTP server. 

## How to run

Install dependencies and build project

    > yarn install
    > yarn build

Run the server and client part

    > node dist/server.js
    Listening for websocket connections on 30000
    Listening for HTTP request on 8080

    > node dist/client.js
    HTTP echo server listening on 20000
    Connected to websocket server

You can now perform a HTTP request towards localhost on port 8080.
The server establishes a new multiplex channel, proxies the HTTP
request over the new channel. The client accepts the request and
proxies it to the HTTP echo server. 

    curl -v --data "hello" http://localhost:8080
    *   Trying 127.0.0.1:8080...
    * Connected to localhost (127.0.0.1) port 8080 (#0)
    > POST / HTTP/1.1
    > Host: localhost:8080
    > User-Agent: curl/8.1.2
    > Accept: */*
    > Content-Length: 5
    > Content-Type: application/x-www-form-urlencoded
    >
    < HTTP/1.1 200 OK
    < date: Thu, 10 Aug 2023 11:27:50 GMT
    < connection: close
    < content-length: 5
    <
    * Closing connection 0
    hello

