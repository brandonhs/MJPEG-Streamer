var streamer = require('../index');
var express = require('express');
var path = require('path');

var { ArgumentParser, RawTextHelpFormatter } = require('argparse');
var { version } = require('../package.json');

var app = express();
app.use(express.static(path.resolve(__dirname, '.')));
app.use('/dist', express.static(path.resolve(__dirname, '../dist')));
app.listen(4000);

var ffmpegStream = (width, height, quality, webcam) => {
    const { spawn } = require('child_process');
    // prettier-ignore
    var params = [
        '-f', 'dshow',
        '-video_size', `${width}x${height}`,
        '-framerate', '30',
        '-rtbufsize', '200M',
        '-i', `video=${webcam}`,
        '-movflags', 'faststart',
        '-framerate', '30',
        '-vcodec', 'mjpeg',
        '-preset', 'veryfast',
        '-b:v', '2M',
        '-f', 'mjpeg',
        '-q', quality,
        'http://localhost:8082/stream.mjpeg', 
        '-y', '-hide_banner', 
        '-loglevel', 'error',
    ];
    var proc = spawn('ffmpeg', params);
    proc.stdout.on('data', (data) => {
        process.stdout.write(data);
    });
    proc.stderr.setEncoding('utf8');
    proc.stderr.on('data', (err) => {
        process.stderr.write(err);
    });
    proc.on('close', function (code) {
        console.log(`Exitede with error code ${code}`);
    });
};

require('ffmpeg-device-list-parser').parse(
    {
        ffmpegPath: 'ffmpeg',
    },
    (result) => {
        let videoDevices = result.videoDevices;
        let video = [];
        let i = 0;
        var videoHelp = [];
        var availableIndices = [];
        videoHelp.push('');
        let maxLen = 0;
        for (let device of videoDevices) {
            let help = `Device ${i}: ${device.name}`;
            if (help.length > maxLen) {
                maxLen = help.length;
            }
            videoHelp.push(help);
            availableIndices.push(i);
            video.push({
                name: device.name,
                id: i++,
            });
        }
        let startbar = '';
        for (let j = 0; j < maxLen + 5; j++) {
            startbar += '-';
        }
        videoHelp[0] = startbar;
        videoHelp.push(startbar);

        const parser = new ArgumentParser({
            description: 'Node Camera Stream interactive test script',
            formatter_class: RawTextHelpFormatter,
        });
        parser.add_argument('-v', '--version', { action: 'version', version });
        parser.add_argument('-i', '--index', {
            help: 'the input device index\n' + videoHelp.join('\n'),
            choices: availableIndices,
            type: Number,
            required: true,
        });
        parser.add_argument('-q', '--quality', {
            help: 'the quality of the input feed (from 2-31, with 2 being the best)',
            type: Number,
            default: 5,
        });
        parser.add_argument('--width', {
            help: 'the width, in pixels, of the camera stream.\n',
            type: Number,
            default: 1280,
        });
        parser.add_argument('--height', {
            help: 'the height, in pixels, of the camera stream.',
            type: Number,
            default: 720,
        });

        var { width, height, index, quality } = parser.parse_args();

        let device = video[index];
        console.log(`Device ${device.id}, "${device.name}" selected`);
        ffmpegStream(width, height, quality, device.name);

        var stream = new streamer.CameraStream({
            streamUrl: 'http://localhost:8082/stream.mjpeg',
            width: width,
            height: height,
        });

        stream.listen(() => {
            var socketProtocol = new streamer.CameraSocketProtocol({ cameraStream: stream });
            socketProtocol.start();
        });
    }
);
