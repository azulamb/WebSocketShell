self.addEventListener( 'push', ( event ) =>
{
	console.log( event );
	const data = event.data.json();
	console.log( data.data );

	event.waitUntil(
		self.registration.showNotification( data.data.title,
		{
			body: data.data.body,
		} )
	);
} );

importScripts( 'https://www.gstatic.com/firebasejs/6.5.0/firebase-app.js' );
importScripts( 'https://www.gstatic.com/firebasejs/6.5.0/firebase-messaging.js' );

const PARAMS = new URLSearchParams( location.search );

firebase.initializeApp( { messagingSenderId: PARAMS.messagingSenderId } );

const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler( ( payload ) =>
{
	console.log( payload );
	const notificationTitle = payload.notification.title;
	const notificationOptions =
	{
		body: payload.notification.body,
	};
	return self.registration.showNotification( notificationTitle, notificationOptions );
} );
