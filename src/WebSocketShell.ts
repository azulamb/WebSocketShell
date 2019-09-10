import * as WebSocket from 'websocket'
import * as http from 'http'
import * as path from 'path'
import * as fs from 'fs'
import { exec } from 'child_process'
import { Writable } from 'stream'

export interface Logger
{
	log( ... messages: any[] ): void;
	error( ... messages: any[] ): void;
}

function DefaultRequest( request: http.IncomingMessage, logger: Logger ): Promise<Buffer|string>
{
	logger.log( ' Received request for ' + request.url );
	const url = ( request.url || '' ).split( '?' )[ 0 ];

	const basepath = path.join( __dirname, '../docs' );
	let filepath = path.join( basepath, url || '' );

	if ( filepath.match( /\/$/ ) ) { filepath += 'index.html'; }

	if ( filepath.indexOf( basepath ) !== 0 )
	{
		return Promise.reject( new Error( 'Invalid path.' ) );
	}

	return fs.promises.readFile( filepath );
}

function DefaultServer( auth: Authorization, logger: Logger )
{
	const server = http.createServer( ( request, response ) =>
	{
		auth.issueKey( request ).catch( () =>
		{
			return DefaultRequest( request, logger );
		} ).then( ( result ) =>
		{
			response.writeHead( 200 );
			response.write( result );
			response.end();
		} ).catch( ( error ) =>
		{
			logger.error( error );
			response.writeHead( 404 );
			response.end();
		} );
	} );

	return server;
}

export type Request = http.IncomingMessage;

export interface Authorization
{
	issueKey( request: Request ): Promise<Buffer|string>;
	authenticate( request: Request ): Promise<void>;
}

class DefaultAuthorization implements Authorization
{
	public issueKey( request: Request ) { return Promise.reject( new Error( 'No issue key api.' ) ); }

	public authenticate( request: Request ) { return Promise.resolve(); }
}

class SendBrowser extends Writable
{
	private connection: WebSocket.connection;

	public setConnection( connection: WebSocket.connection ) { return this.connection = connection; }

	public _write( chunk: string|Buffer, enc: string, next: () => void )
	{
		this.connection.sendUTF( chunk.toString() );
		//this.connection.sendBytes( chunk );
		next();
	}
}

export interface WebSocketShellConfig
{
	server?: http.Server;
	auth?: Authorization;
	logger?: Logger;
}

export class WebSocketShell
{
	private auth: Authorization;
	private server: http.Server;
	private logger: Logger;

	constructor( config: WebSocketShellConfig )
	{
		this.logger = config.logger || { log: () => {}, error: () => {} };
		this.auth = config.auth || new DefaultAuthorization();
		this.server = config.server || DefaultServer( this.auth, this.logger );

		
		const wsServer = new WebSocket.server(
		{
			httpServer: this.server,
			autoAcceptConnections: false,
		} );
	
		wsServer.on( 'request', ( request ) =>
		{
			this.auth.authenticate( request.httpRequest ).then( () =>
			{
				this.onConnect( request );
			} ).catch( ( error ) =>
			{
				request.reject();
				this.logger.log( ' Connection from origin ' + request.origin + ' rejected.' );
				throw error;
			} );
		} );
	}

	public start( port?: number, hostname?: string, backlog?: number )
	{
		return new Promise<void>( ( resolve ) =>
		{
			this.server.listen( port, hostname, backlog, resolve );
		} );
	}

	private onConnect( request: WebSocket.request )
	{
		this.logger.log( ' Connection accepted.' );
		const browser = new SendBrowser();
		const connection = browser.setConnection( request.accept( 'shell', request.origin ) );

		const sh = exec( '/bin/sh', () => { this.logger.log( 'Exit' ); connection.close(); } );
		if ( sh.stdout ) { sh.stdout.pipe( browser ); }
		if ( sh.stderr ) { sh.stderr.pipe( browser ); }
		
		const write = <Writable>sh.stdin;

		connection.on( 'message', ( message ) =>
		{
			write.write( message.utf8Data );
		} );

		connection.on( 'close', ( reasonCode, description ) =>
		{
			this.logger.log( ' Peer ' + connection.remoteAddress + ' disconnected.' );
		} );
	}

}
