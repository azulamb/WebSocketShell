"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = require("websocket");
const http = require("http");
const path = require("path");
const fs = require("fs");
const child_process_1 = require("child_process");
const stream_1 = require("stream");
function DefaultRequest(request, logger) {
    logger.log(' Received request for ' + request.url);
    const url = (request.url || '').split('?')[0];
    const basepath = path.join(__dirname, '../docs');
    let filepath = path.join(basepath, url || '');
    if (filepath.match(/\/$/)) {
        filepath += 'index.html';
    }
    if (filepath.indexOf(basepath) !== 0) {
        return Promise.reject(new Error('Invalid path.'));
    }
    return fs.promises.readFile(filepath);
}
function DefaultServer(auth, logger) {
    const server = http.createServer((request, response) => {
        auth.issueKey(request).catch(() => {
            return DefaultRequest(request, logger);
        }).then((result) => {
            response.writeHead(200);
            response.write(result);
            response.end();
        }).catch((error) => {
            logger.error(error);
            response.writeHead(404);
            response.end();
        });
    });
    return server;
}
class DefaultAuthorization {
    issueKey(request) { return Promise.reject(new Error('No issue key api.')); }
    authenticate(request) { return Promise.resolve(); }
}
class SendBrowser extends stream_1.Writable {
    setConnection(connection) { return this.connection = connection; }
    _write(chunk, enc, next) {
        this.connection.sendUTF(chunk.toString());
        next();
    }
}
class WebSocketShell {
    constructor(config) {
        this.logger = config.logger || { log: () => { }, error: () => { } };
        this.auth = config.auth || new DefaultAuthorization();
        this.server = config.server || DefaultServer(this.auth, this.logger);
    }
    start(port, hostname, backlog) {
        return new Promise((resolve) => {
            const wsServer = new WebSocket.server({
                httpServer: this.server,
                autoAcceptConnections: false,
            });
            wsServer.on('request', (request) => {
                this.auth.authenticate(request.httpRequest).catch(() => {
                    request.reject();
                    this.logger.log(' Connection from origin ' + request.origin + ' rejected.');
                }).then(() => { this.onConnect(request); });
            });
            this.server.listen(port, hostname, backlog, resolve);
        });
    }
    onConnect(request) {
        this.logger.log(' Connection accepted.');
        const browser = new SendBrowser();
        const connection = browser.setConnection(request.accept('shell', request.origin));
        const sh = child_process_1.exec('/bin/sh', () => { this.logger.log('Exit'); connection.close(); });
        if (sh.stdout) {
            sh.stdout.pipe(browser);
        }
        if (sh.stderr) {
            sh.stderr.pipe(browser);
        }
        const write = sh.stdin;
        connection.on('message', (message) => {
            write.write(message.utf8Data);
        });
        connection.on('close', (reasonCode, description) => {
            this.logger.log(' Peer ' + connection.remoteAddress + ' disconnected.');
        });
    }
}
exports.WebSocketShell = WebSocketShell;
