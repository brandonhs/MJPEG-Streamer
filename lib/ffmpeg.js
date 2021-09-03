var { parse } = require('ffmpeg-device-list-parser');

/**
 *
 * @param {Object} config
 * @param {} config.path
 * @param {} config.device
 * @param {} config.width
 * @param {} config.height
 * @param {} config.quality
 * @param {} config.streamUrl
 */
var ffmpeg = function (config = {}) {
    ffmpeg.path = config.path || 'ffmpeg';
    ffmpeg.device = config.device || null;
    ffmpeg.width = config.width || 1920;
    ffmpeg.height = config.height || 1080;
    ffmpeg.quality = config.quality || 5;
    ffmpeg.streamUrl = config.streamUrl || 'http://localhost:8082/stream.mjpeg';
    return ffmpeg;
};

ffmpeg.path = 'ffmpeg';

ffmpeg.run = () => {
    if (ffmpeg.device == null) {
        console.log('No device specified as an input to ffmpeg!');
        return;
    }
    const { spawn } = require('child_process');
    // prettier-ignore
    var params = [
        '-f', 'dshow',
        '-video_size', `${ffmpeg.width}x${ffmpeg.height}`,
        '-framerate', '30',
        '-rtbufsize', '200M',
        '-i', `video=${ffmpeg.device}`,
        '-movflags', 'faststart',
        '-framerate', '30',
        '-vcodec', 'mjpeg',
        '-preset', 'veryfast',
        '-b:v', '2M',
        '-f', 'mjpeg',
        '-q', ffmpeg.quality,
        ffmpeg.streamUrl, 
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
        console.log(`Exited with error code ${code}`);
    });
};

ffmpeg.listDevices = (callback = null) => {
    parse({
        ffmpegPath: ffmpeg.path,
    }).then((result) => {
        let devices = [];
        let message = [];
        let indices = [];
        let messageBar = 0;
        for (let i = 0; i < result.videoDevices.length; i++) {
            let device = result.videoDevices[i];
            let line = `Device ${i}: ${device.name}`;
            messageBar = Math.max(messageBar, line.length);
            message.push(line);
            indices.push(i);
            devices.push({ name: device.name, id: i });
        }
        let bar = '-'.repeat(messageBar);
        message.unshift(bar);
        message.push(bar);
        if (callback) callback(message, devices, indices);
    });
};

module.exports = ffmpeg;
