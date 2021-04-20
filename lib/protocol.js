var utils = require('./utils');

const DEFAULT_SOCKET_URL = 'ws://localhost:9000/';

/**
 *
 * @param {Object} [config]
 * @param {string} [config.url] websocket url
 * @param {CameraStream} [config.cameraStream] camera stream
 */
var CameraSocketProtocol = function (config = {}) {
    if (!(this instanceof CameraSocketProtocol)) return new CameraSocketProtocol(config);

    var url = config.url || DEFAULT_SOCKET_URL;
    var cameraStream = config.cameraStream || null;

    if (cameraStream) {
        cameraStream.addListener(this);
    }

    var parsedUrl = utils._parseUrl(url);
    var port = parsedUrl.port;
    var hostname = parsedUrl.hostname;
    var path = parsedUrl.pathname;

    this.port = port;
    this.host = hostname;
};

/**
 *
 */
CameraSocketProtocol.prototype.start = function () {
    this.server = new (require('ws').Server)({ port: this.port, host: this.host });
    this.server.on('connection', (socket) => {
        utils._debugPrint(`New Websocket Connection (${this.server.clients.size} total)`);

        this.writeHeader(socket);
        socket.on('close', (code, message) => {
            utils._debugPrint(`Disconnected Websocket: '${message}' with code ${code} (${this.server.clients.size} total)`);
        });
    });
};

/**
 *
 * @param {WebSocket} socket websocket to write the header to
 */
CameraSocketProtocol.prototype.writeHeader = function (socket) {
    // TODO: add more data to header
    var socketHeader = Buffer.alloc(4);
    socketHeader.write('mjpg');
    socket.send(socketHeader, { binary: true });
};

/**
 *
 * @param {Buffer} data data to be broadcasted to all connected clients
 * @param {Object} opts websocket options
 * @param {boolean} [opts.mask]
 * @param {boolean} [opts.binary]
 * @param {boolean} [opts.compress]
 * @param {boolean} [opts.fin]
 */
CameraSocketProtocol.prototype.broadcast = function (data, opts = { binary: true }) {
    this.server.clients.forEach((client) => {
        if (client.readyState === 1) {
            client.send(data, opts);
        }
    });
};

/**
 *
 * @param {Buffer} data chunk to be broadcasted
 */
CameraSocketProtocol.prototype.sendChunk = function (data) {
    this.broadcast(data, { binary: true });
};

module.exports = { CameraSocketProtocol };
