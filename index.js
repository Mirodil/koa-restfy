'use strict';

var GET = require('./lib/get');
var POST = require('./lib/post');
var PUT = require('./lib/put');
var DELETE = require('./lib/delete');
var DataSource = require('./lib/ds/data-source');

class API {
    /**
     * create a get request for model
     * @param url {String} url for method
     */
    static get(url) {
        return new GET(url);
    }

    /**
     * create a post request for model
     * @param url {String} url for method
     */
    static post(url) {
        return new POST(url);
    }

    /**
     * create a put request for model
     * @param url {String} url for method
     */
    static put(url) {
        return new PUT(url);
    }

    static delete(url) {
        return new DELETE(url);
    }
}

module.exports = API;

module.exports.DataSource = DataSource;