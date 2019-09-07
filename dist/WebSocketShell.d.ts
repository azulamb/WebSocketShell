/// <reference types="node" />
import * as http from 'http';
export interface Logger {
    log(...messages: any[]): void;
    error(...messages: any[]): void;
}
export declare type Request = http.IncomingMessage;
export interface Authorization {
    issueKey(request: Request): Promise<Buffer | string>;
    authenticate(request: Request): Promise<void>;
}
export interface WebSocketShellConfig {
    server?: http.Server;
    auth?: Authorization;
    logger?: Logger;
}
export declare class WebSocketShell {
    private auth;
    private server;
    private logger;
    constructor(config: WebSocketShellConfig);
    start(port?: number): void;
    private onConnect;
}
