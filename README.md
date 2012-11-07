sse.js: a server-sent events implementation for node.js
===========================

The [HTML5 Server-Sent Events specification](http://dev.w3.org/html5/eventsource/)
is introduced "to enable servers to push data to Web pages over HTTP or using
dedicated server-push protocols".



# Introduction

Server-Sent Events (SSE) enables servers to push data from the server to a client.
A client is normally a web browser but can also be a another server supporting
the Event-Source specification.


## SSE vs. WebSockets

SSE is [half-duplex](http://en.wikipedia.org/wiki/Duplex_(telecommunications)#Half-duplex)
and is intended to send data only from the server to the client. WebSockets is
[full-duplex](http://en.wikipedia.org/wiki/Duplex_(telecommunications)#Full-duplex)
and can send data both ways between the server and browser.

There is some differences in the protocols. SSE rely on holding a plain http
connection and sending fragments of data (events) to the client. SSE can be
looked upon as [long polling](http://en.wikipedia.org/wiki/Push_technology#Long_polling)
but implemented by the browser. A WebSocket does an upgrade of the http protocol.
Both SSE and WebSockets is new features to the web world and this hits WebSockets
a bit. In the infrastructure there might be proxy servers and other applications
we do not have control over which does not support the upgrade of WebSockets and
WebSockets will fail working. Since SSE rely on plain http, SSE is not affectable
by old intrastructure such as WebSockets.

SSE does have a built in reconnect feature. If the connection between the server
and a client is terminated without intention (ex; network failure) the client
will try to reconnect again until it can. WebSockets has no such feature and must
be handeled in the client implementation.

SSE also has a optional index feature where each message can have an index. In
the case of a dissconnect and reconnect this index can be used by the client to
get information that it has lost events during the connection outage.
WebSockets does not have such a feature.

WebSockets has only one onMessage event where all messages is emitted. On each
emit one have to check the data emitted to see what kind of data it contains.
In SSE it is possible to send custom events. It is in other words possible to
have a onNewsUpdate event and a onStockUpdate event and send data on each of the
event types accordingly.

Later versions of the WebSocket specification does have support for sending
binary data. SSE is not able to send binary data in any other form than a
[base64](http://en.wikipedia.org/wiki/Base64) encoded string.

There are many occations where one only need to send data from the server to the
client and not the other way. A stock ticker is a good example. There is also
many occations where the full duplex of a WebSocket can be replased with SSE from
the server to the client and the communication from the client to the server
is done by traditional XHR requests.

Choose wisly!


## Support in browsers

Please see [Can I Use](http://caniuse.com/eventsource) for a detailed overview
of which browsers support SSE.



# Usage

## Installing

`npm install sse`


## Basic server

```js
var SSE 	= require('sse'),
	http 	= require('http');

var server = http.createServer(function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('okay');
});

server.listen(8080, '127.0.0.1', function() {
  var sse = new SSE(server);
  sse.on('connection', function(client) {
    client.send({data : 'Boy howdy!'});
  });
});
```

Client code for the above server:

```js
var es = new EventSource("/sse");
es.onmessage = function (event) {
  console.log(event.data);
};
```

## SSE(httpServer, options)

Create a new SSE server. `httpServer` takes a web server object which the SSE
server will be attached too. `options` is a configuration object with the
following possible properties:

* `path`: Path the SSE stream should be exposed on. Defaults to `/SSE`.
* `verifyRequest`: A function to verify if the request shall be granted access
to the SSE stream. The function must return `true` if the request should be
granted access and `false` if not. The the http `request` object is passed as the
first attribute to the function.

### Example on setting a custom path:

```js
var sse = new SSE(server, {path : '/api/stream'});
sse.on('connection', function(client) {
  client.send({data : 'Boy howdy!'});
});
```

In the client this SSE stream is now available as follow:

```js
var es = new EventSource("/api/stream");
```

### Example on appending a verification function:

```js
var auth = function(req) {
  var grantAccess = false;
  // Do some auth magic that sets grantAccess to true or false
  return grantAccess;
}

var sse = new SSE(server, {verifyRequest : auth});
sse.on('connection', function(client) {
  client.send({data : 'Yay! Granted access!'});
});
```