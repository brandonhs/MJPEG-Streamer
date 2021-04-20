const path = require('path');

module.exports = (env, argv) => {
    const conf = {
        mode: 'production',
        entry: {
            'stream-client': ['./lib/client.js'],
        },
        output: {
            path: path.join(__dirname, '/dist'),
            filename: `[name].js`,
            library: 'node-camera-stream',
            libraryExport: 'streamer',
            libraryTarget: 'umd',
            globalObject: 'this',
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /(node_modules|bower_components)/,
                    use: [
                        {
                            loader: 'babel-loader',
                        },
                    ],
                },
            ],
        },
    };

    return conf;
};
