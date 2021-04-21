var utils = require('./utils');

var { CameraSocketProtocol } = require('./protocol');

const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;
const DEFAULT_STREAM_URL = 'http://localhost:8080/stream.mjpeg';

/**
 *
 * @param {Object} config
 * @returns {CameraStream}
 */
var CameraStream = function (config) {
    if (!(this instanceof CameraStream)) return new CameraStream(config);

    var streamUrl = config.streamUrl || DEFAULT_STREAM_URL;
    var width = config.width || DEFAULT_WIDTH;
    var height = config.height || DEFAULT_HEIGHT;

    var parsedUrl = utils._parseUrl(streamUrl);
    var port = parsedUrl.port;
    var hostname = parsedUrl.hostname;
    var path = parsedUrl.pathname;

    this.protocols = [];

    if (parsedUrl.password || parsedUrl.username) {
        throw { name: 'NotImplementedError', message: 'Username/Password have not yet been implemented in node-camera-streamer.' };
    }

    this.width = width;
    this.height = height;
    this.port = port;
    this.host = hostname;

    this.server = require('http').createServer((req, res) => {
        utils._debugPrint(`Stream connected: ${req.socket.remoteAddress}:${req.socket.remotePort}`);

        var header = Buffer.alloc(4);
        header.write('mjpg');
        for (let protocol of this.protocols) protocol.sendChunk(header);

        req.on('data', (data) => {
            for (let protocol of this.protocols) protocol.sendChunk(data);
        });
    });
};

CameraStream.prototype.listen = function (fn) {
    this.server.listen(this.port, () => {
        utils._debugPrint(`Stream server listening at ${this.host}:${this.port}`);
        fn();
    });
    return this;
};

CameraStream.prototype.addListener = function (protocol) {
    this.protocols.push(protocol);
    return this;
};

module.exports = { CameraStream, CameraSocketProtocol };
