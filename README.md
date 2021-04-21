# MJPEG Streamer

## About The Project

This repo contains a custom library for streaming high quality, compressed video, over a websocket protocol.

### Built With

-   [npmjs](https://www.npmjs.com/) - package management
-   [nodejs](https://nodejs.org/en/) - demo websocket connection
-   [webpack](https://crossbar.io/) - building the client
-   [ffmpeg](https://www.ffmpeg.org/) - running the video stream

## Getting Started

To get a local copy up and running, run, `git clone https://github.com/Advent-Industries/MJPEG-Streamer.git`

### Prerequisites

Required dev tools

-   npm

    ```sh
    npm install npm@latest -g
    ```

### Running the test program

1.  Clone the repo
    ```sh
    git clone https://github.com/Advent-Industries/MJPEG-Streamer.git
    ```
2.  Install dependencies

    ```sh
    npm install --production=false
    ```

3.  Run

    First run,

    ```sh
    # note the extra "--"
    npm test -- -h
    ```

    You should get an output similar to:

    ```
    Node Camera Stream interactive test script

    optional arguments:
    -h, --help          show this help message and exit
    -v, --version       show program's version number and exit
    -i {0,1,2,3,4}, --index {0,1,2,3,4}
                        the input device index
                        ---------------------------------
                        Device 0: HD Webcam
                        Device 1: ...
                        ---------------------------------
    -q QUALITY, --quality QUALITY
                        the quality of the input feed (from 2-31, with 2 being the best)
    --width WIDTH       the width, in pixels, of the camera stream.
    --height HEIGHT     the height, in pixels, of the camera stream.

    ```

    Select a device and resolution to run the program.

    ```sh
    npm test -- -i 1 --width 1920 --height 1080 -q 5
    ```

4.  Navigate to [http://localhost:4000/](http://localhost:4000/)

### Library Example

```js
var streamer = require('./index');
var stream = new streamer.CameraStream({
    streamUrl: 'http://localhost:8082/stream.mjpeg',
    width: 1920,
    height: 1080,
});
stream.listen(() => {
    var socketProtocol = new streamer.CameraSocketProtocol({
        cameraStream: stream,
        url: 'ws://localhost:9000/',
    });
    socketProtocol.start();
});
```

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Document</title>
    </head>
    <body>
        <script src="dist/stream-client.js"></script>
        <img src="" alt="" id="img" />
        <script>
            var image = document.getElementById('img');
            var player = new CameraClient(
                (data) => {
                    image.src = data;
                },
                (chunk) => console.log(String.fromCharCode.apply(null, chunk))
            );

            var client = new DataClient({ url: 'ws://localhost:9000/' });
            client.ondata = (buf) => {
                player.handleChunk(buf);
            };
        </script>
    </body>
</html>
```

```sh
# Note: Replace HD Pro Webcam C920 with the name of your webcam
# If you are having difficulty finding your exact camera name, run the test script with the -h option, as seen above.

# TODO: Add a lib function to list devices
ffmpeg -f dshow -video_size 1280x720 -framerate 30 -rtbufsize 100M -i video="HD Pro Webcam C920" -movflags faststart -framerate 30 -vcodec mjpeg \
-preset veryfast -maxrate 1000000k -b:v 2M -bufsize 2M -f mjpeg -q 5 http://localhost:8082/stream.mjpeg -y -hide_banner -loglevel error
```
