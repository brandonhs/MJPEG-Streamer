/**
 *
 * @param {string} url
 * @returns
 */
var _parseUrl = function (url) {
    var { URL } = require('url');
    var parsedUrl = new URL(url);
    return parsedUrl;
};

/**
 *
 * @param  {...any} message
 */
var _debugPrint = function (...message) {
    var debug = !process.env.NODE_ENV;
    if (debug) console.log(...message);
};

module.exports = { _parseUrl, _debugPrint };
