"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wss = require("./WebSocketShell");
const path = require("path");
const url_1 = require("url");
exports.WebSocketShell = wss.WebSocketShell;
if (require.main === module) {
    ExecServer();
}
function ExecServer() {
    function ToAbsolutePath(nowpath) {
        return path.isAbsolute(nowpath) ? nowpath : path.join(process.cwd(), nowpath);
    }
    const Config = (() => { try {
        return require(ToAbsolutePath(process.argv[2] || './config.json'));
    }
    catch (error) { } return {}; })();
    if (Config.debug === undefined) {
        Config.debug = process.env.NODE_ENV === 'debug';
    }
    function RandString(length = 8) {
        const r = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";
        let str = "";
        for (let i = length; 0 < i; --i) {
            str += r[Math.floor(Math.random() * r.length)];
        }
        return str;
    }
    class Authorization {
        constructor() {
            this.key = '';
        }
        issueKey(request) {
            if (request.url === '/shell') {
                this.key = RandString(64);
                return Promise.resolve(JSON.stringify({ key: this.key }));
            }
            return Promise.reject(new Error('No issue key api.'));
        }
        authenticate(request) {
            if (!this.key || new url_1.URLSearchParams((request.url || '').split('?')[1] || '').get('key') !== this.key) {
                throw new Error('Invalid key.');
            }
            this.key = '';
            return Promise.resolve();
        }
    }
    const config = {};
    config.auth = new Authorization();
    if (Config.debug) {
        config.logger =
            {
                log: (...messages) => { console.log(new Date(), ...messages); },
                error: (...messages) => { console.error(new Date(), ...messages); },
            };
    }
    const server = new wss.WebSocketShell(config);
    server.start(Config.port);
}
