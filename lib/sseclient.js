var Options = require('options'),
  util = require('util')
  , events = require('events');

function SSEClient(id, req, res) {
  this.id = id;
  this.req = req;
  this.res = res;
  this.isLegacy = req.headers['user-agent'] && (/^Opera[^\/]*\/9/).test(req.headers['user-agent']);
  var self = this;
  res.on('close', function() {
    self.emit('close');
  });
}

/**
 * Inherits from EventEmitter.
 */

util.inherits(SSEClient, events.EventEmitter);

SSEClient.prototype.initialize = function() {
  this.req.socket.setNoDelay(true);
  if (this.isLegacy) {
    this.res.writeHead(200, {'Content-Type': 'text/x-dom-event-stream'});
  }
  else this.res.writeHead(200, {'Content-Type': 'text/event-stream'});
  this.res.write(':ok\n\n');
};

SSEClient.prototype.send = function(options) {
  options = new Options({
    id: null,
    event: null,
    data: null,
    retry: 10000
  }).merge(options);

  if (options.value.data === null && options.value.event === null) return;

  if (this.isLegacy) {
    this.res.write('Event: data\n');
  }
  else {
    if (options.value.id !== null) this.res.write('id:' + options.value.id + '\n');
    if (options.value.event !== null) this.res.write('event:' + options.value.event + '\n');
    if (options.value.retry !== null) this.res.write('retry:' + options.value.retry + '\n');
  }

  if (options.value.data !== null) {
    data = options.value.data.replace(/(\r\n|\r|\n)/g, '\n');
    var dataLines = data.split(/\n/);
    for (var i = 0, l = dataLines.length; i < l; ++i) {
      var line = dataLines[i];
      this.res.write('data:' + (this.isLegacy ? ' ' : '') + line + '\n');
    }
  } else {
    this.res.write('data:\n')
  }
  this.res.write('\n');
}

SSEClient.prototype.close = function() {
  this.res.end();
}

module.exports = SSEClient;
