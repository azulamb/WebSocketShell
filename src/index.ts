import * as wss from './WebSocketShell'
import { URLSearchParams } from 'url'

export const WebSocketShell = wss.WebSocketShell;

if ( require.main === module ) { ExecServer() }

interface ServerConfig
{
	port?: number;
	debug?: boolean;
}

function ExecServer()
{
	const Config: ServerConfig = ( () => { try { return require( './config.json' ); } catch( error ) {} return {}; } )();
	if ( Config.debug === undefined ) { Config.debug = process.env.NODE_ENV === 'debug'; }

	function RandString( length = 8 )
	{
		const r = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";
		let str = "";
		for ( let i = length ; 0 < i ; --i )
		{
			str += r[ Math.floor( Math.random() * r.length ) ];
		}
		return str;
	}

	class Authorization implements wss.Authorization
	{
		private key = '';

		public issueKey( request: wss.Request )
		{
			if ( request.url === '/shell' )
			{
				this.key = RandString( 64 );
				return Promise.resolve( JSON.stringify( { key: this.key } ) );
			}
			return Promise.reject( new Error( 'No issue key api.' ) );
		}

		public authenticate( request: wss.Request )
		{
			if ( !this.key || new URLSearchParams( ( request.url || '' ).split( '?' )[ 1 ] || '' ).get( 'key' ) !== this.key )
			{
				throw new Error( 'Invalid key.' );
			}
			this.key = '';
			return Promise.resolve();
		}
	}

	const config: wss.WebSocketShellConfig = {};
	config.auth = new Authorization();
	if ( Config.debug )
	{
		config.logger =
		{
			log: ( ... messages: any[] ) => { console.log( new Date(), ...messages ); },
			error: ( ... messages: any[] ) => { console.error( new Date(), ...messages ); },
		};
	}

	const server = new wss.WebSocketShell( config );
	server.start( Config.port );
}
