var { streamer, ffmpeg } = require('../index');
var express = require('express');
var path = require('path');

var { ArgumentParser, RawTextHelpFormatter } = require('argparse');
var { version } = require('../package.json');

var app = express();
app.use(express.static(path.resolve(__dirname, '.')));
app.use('/dist', express.static(path.resolve(__dirname, '../dist')));
app.listen(4000);

ffmpeg({ path: 'ffmpeg' }).listDevices((message, devices, availableIndices) => {
    const parser = new ArgumentParser({ description: 'Node Camera Stream interactive test script', formatter_class: RawTextHelpFormatter });
    parser.add_argument('-v', '--version', { action: 'version', version });
    parser.add_argument('-i', '--index', { help: 'the input device index\n' + message.join('\n'), choices: availableIndices, type: Number, required: true });
    parser.add_argument('-q', '--quality', { help: 'the quality of the input feed (from 2-31, with 2 being the best)', type: Number, default: 5 });
    parser.add_argument('--width', { help: 'the width, in pixels, of the camera stream.\n', type: Number, default: 1920 });
    parser.add_argument('--height', { help: 'the height, in pixels, of the camera stream.', type: Number, default: 1080 });

    var { width, height, index, quality } = parser.parse_args();

    let device = devices[index];
    console.log(`Device ${device.id}, "${device.name}" selected`);

    ffmpeg.width = width;
    ffmpeg.height = height;
    ffmpeg.quality = quality;
    ffmpeg.device = device.name;

    var stream = new streamer.CameraStream(ffmpeg).listen(() => {
        ffmpeg.run();
        var socketProtocol = new streamer.CameraSocketProtocol({ cameraStream: stream });
        socketProtocol.start();
    });
});
