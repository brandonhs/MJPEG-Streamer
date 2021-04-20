var broswer = typeof window !== 'undefined';

if (!broswer) {
    /**
     *
     * @param {string} base64
     * @returns
     */
    global.base64ToArrayBuffer = (base64) => {
        return new Uint8Array(Buffer.from(base64, 'base64'));
    };

    /**
     *
     * @param {Uint8Array} buffer
     * @returns
     */
    global.arrayBufferToBase64 = (buffer) => {
        return Buffer.from(buffer).toString('base64');
    };
} else {
    /**
     *
     * @param {string} base64
     * @returns
     */
    window.base64ToArrayBuffer = (base64) => {
        var binary_string = window.atob(base64);
        var len = binary_string.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    };

    /**
     *
     * @param {Uint8Array} buffer
     * @returns
     */
    window.arrayBufferToBase64 = (buffer) => {
        var binary = '';
        var bytes = [].slice.call(new Uint8Array(buffer));
        bytes.forEach((b) => (binary += String.fromCharCode(b)));
        return window.btoa(binary);
    };
}

/**
 *
 * @param {Object} [config]
 * @param {string} [config.url]
 */
var DataClient = ((window || global).DataClient = function (config = {}) {
    this.url = config.url || 'ws://localhost:9000/';

    this.client = new WebSocket(this.url);

    this.client.onmessage = (e) => {
        e.data.arrayBuffer().then((buf) => {
            if (this.ondata) this.ondata(new Uint8Array(buf));
        });
    };
});

DataClient.prototype.onopen = function () {};

DataClient.prototype.ondata = function (data) {};

DataClient.prototype.close = function () {
    this.client.close();
    this.ondata = null;
};

/**
 *
 * @param {Function} [onFrameComplete]
 * @param {Function} [onSocketHeader]
 */
var CameraClient = (window.CameraClient = function (onFrameComplete, onSocketHeader) {
    this.chunks = [];
    this.width = 1080;
    this.height = 1920;
    this.onFrameComplete =
        onFrameComplete ||
        function () {
            console.warn('No callback specified for CameraClient.onFrameComplete.');
        };
    this.onSocketHeader =
        onSocketHeader ||
        function () {
            console.warn('No callback specified for CameraClient.onSocketHeader.');
        };
});

CameraClient.SOI = new Uint8Array([0xff, 0xd8]);
CameraClient.EOI = new Uint8Array([0xff, 0xd9]);
CameraClient.HEADER_BYTES = 'mjpg';

/**
 *
 * @param {Uint8Array} chunk
 * @param {Uint8Array} arr
 * @returns
 */
const indexOf = (chunk, arr) => {
    var validIndices = [];
    chunk.forEach((item, i) => {
        if (i === chunk.length - 1) return;
        if (item === arr[0] && chunk[i + 1] === arr[1]) validIndices.push(i);
    });
    if (validIndices.length > 0) return validIndices[0];
    return -1;
};

/**
 *
 * @param {Uint8Array} chunk
 * @returns
 */
CameraClient.prototype.isSocketHeader = function (chunk) {
    // prettier-ignore
    if (chunk[0] === CameraClient.HEADER_BYTES.charCodeAt(0) && 
        chunk[1] === CameraClient.HEADER_BYTES.charCodeAt(1) && 
        chunk[2] === CameraClient.HEADER_BYTES.charCodeAt(2) && 
        chunk[3] === CameraClient.HEADER_BYTES.charCodeAt(3)) {
            return true;
        }
    return false;
};

/**
 *
 * @param {Uint8Array} chunk
 */
CameraClient.prototype.readSocketHeader = function (chunk) {
    // TODO: Add more data to header
};

/**
 *
 * @param {Uint8Array} chunk
 */
CameraClient.prototype.handleChunk = function (chunk) {
    const eoiPos = indexOf(chunk, CameraClient.EOI);
    const soiPos = indexOf(chunk, CameraClient.SOI);

    if (this.isSocketHeader(chunk)) {
        this.readSocketHeader(chunk);
        this.onSocketHeader(chunk);
    } else {
        if (eoiPos === -1) {
            this.chunks.push(chunk);
        } else {
            const part1 = chunk.slice(0, eoiPos + 2);
            if (part1.length > 0) {
                this.chunks.push(part1);
            }
            if (this.chunks.length > 0) {
                this.writeFrame(this.chunks);
            }
        }
        if (soiPos > -1) {
            this.chunks = [];
            const part2 = chunk.slice(soiPos);
            this.chunks.push(part2);
        }
    }
};

/**
 *
 * @param {Uint8Array[]} chunks
 */
CameraClient.prototype.writeFrame = function (chunks) {
    let length = 0;
    chunks.forEach((item) => {
        length += item.length;
    });
    let bufferData = new Uint8Array(length);
    let offset = 0;
    chunks.forEach((item) => {
        bufferData.set(item, offset);
        offset += item.length;
    });
    const base64Data = arrayBufferToBase64(bufferData);
    const imageSrc = `data:image/jpeg;base64,${base64Data}`;
    this.onFrameComplete(imageSrc);
    this.chunks = [];
};
