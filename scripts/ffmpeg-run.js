const { parse } = require('ffmpeg-device-list-parser');

const options = {
    ffmpegPath: 'ffmpeg',
};

parse(options, (result) => {
    let videoDevices = result.videoDevices;
    let video = [];
    let i = 0;
    for (let device of videoDevices) {
        process.stdout.write(`Device ${i}: ${device.name}\n`);
        video.push({
            name: device.name,
            id: i++,
        });
    }
    process.stdout.write('\n');

    const readline = require('readline');

    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
    });

    var data = {
        index: {
            data: null,
            message: 'Please enter a device index: ',
        },
        width: {
            data: null,
            message: 'Please enter an input width: ',
        },
        height: {
            data: null,
            message: 'Please enter an input height: ',
        },
        oncomplete: function () {
            try {
                let index = parseInt(this.index.data);
                if (index >= video.length || index < 0) throw new Error();
                process.stdout.write(`Device selected: Device ${video[index].id}, ${video[index].name}\n`);

                let width = this.width.data;
                let height = this.height.data;

                rl.close();

                const { spawn } = require('child_process');
                // prettier-ignore
                var params = [
                    '-f', 'dshow',
                    '-video_size', `${width}x${height}`,
                    '-framerate', '30',
                    '-rtbufsize', '100M',
                    '-i', `video=${video[index].name}`,
                    '-movflags', 'faststart',
                    '-framerate', '30',
                    '-vcodec', 'mjpeg',
                    '-preset', 'veryfast',
                    '-maxrate', '1000000k',
                    '-b:v', '2M',
                    '-bufsize', '2M',
                    '-f', 'mjpeg',
                    '-q', '5',
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
            } catch (e) {
                process.stdout.write('Invalid index given.');
                n = 0;
                key = keys[n++];
                message = data[key].message;
                process.stdout.write(message);
            }
        },
    };

    let keys = Object.keys(data);
    let n = 0;
    let key = keys[n++];
    let message = data[key].message;
    process.stdout.write(message);

    rl.on('line', (line) => {
        data[key].data = line;
        if (n === keys.length - 1) {
            data.oncomplete();
            return;
        }
        key = keys[n++];
        message = data[key].message;
        process.stdout.write(message);
    });
});
