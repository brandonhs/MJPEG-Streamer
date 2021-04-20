var streamer = require('../index');
var express = require('express');
var path = require('path');

var stream = new streamer.CameraStream({
    streamUrl: 'http://localhost:8082/stream.mjpeg',
});

var app = express();
app.use(express.static(path.resolve(__dirname, '.')));
app.use('/dist', express.static(path.resolve(__dirname, '../dist')));

app.listen(4000);

stream.listen(() => {
    var socketProtocol = new streamer.CameraSocketProtocol({ cameraStream: stream });
    socketProtocol.start();
});
