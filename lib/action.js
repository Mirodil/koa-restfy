
'use strict';

var ActionType = require('./action-types');
var DataSource = require('./ds/data-source');
var executeSequence = require('./helpers').executeSequence;
var dummyFn = require('./helpers').dummyFn;
var toJSON = require('./helpers').errorToJSON;
var co = require('co');

/**
 * base action
 */
class Action {
    constructor(ops) {
        ops = ops || {};
        this.actions = new Map();
        this.url = ops.url;
        let executions = ops.executions || [];
        this.formats = {
            //'*/json': this.send,
            'default': (ctx) => {
                ctx.body = ctx.state.api.data;
            }
        };
        // override
        //executions.splice(0, 0, ActionType.pre);
        //executions.splice(executions.length, 0, ActionType.POST);
        //executions.splice(executions.length, 0, ActionType.SEND);
        this.executions = executions;

        // add send method
        //this.addOnce(ActionType.SEND, this.send);

        this.addOnce(ActionType.ERROR, (error, ctx) => {
            ctx.state.api.error = error;
            return false;// if not handled
        });
    }

    /**
     * set data source
     * @param dataSource {DataSource} model object
     */
    setDataSource(dataSource) {
        if (!dataSource)
            throw new Error('Missing parameter: `dataSource`');

        if (!(dataSource instanceof DataSource))
            throw new Error('Invalid parameter: `dataSource`. Should be instance of DataSource');

        // if (!model.select)
        //     throw new Error('Invalid argument: model does not implement: `select`');

        // if (!model.save)
        //     throw new Error('Invalid argument: model does not implement: `save`');

        // if (!model.delete)
        //     throw new Error('Invalid argument: model does not implement: `delete`');

        this.dataSource = dataSource;
        return this;
    }

    /**
     * direct middleware to express
     * @param req {IncomingRequest}
     * @param res {ServerResponse}
     */
    execute(ctx, next) {
        // main entrance of the request
        ctx.state.api = {};
        let preArray = this.actions.get(ActionType.PRE) || [];
        let postArray = this.actions.get(ActionType.POST) || [];
        let onError = this.actions.get(ActionType.ERROR) || dummyFn;
        let handler = this.actions.get(ActionType.HANDLER) || dummyFn;

        // return co(function* () {

        //     // 1. pre conditions
        //     let asyncArray = preArray.map(pre => {
        //         return executeAsync(pre, this, ctx);
        //     });

        //     yield asyncArray;

        //     // 2. handler executions
        //     let data = yield executeAsync(handler, this, ctx);
        //     ctx.state.api.data = data;

        //     // 3. post conditions

        //     asyncArray = null;
        //     asyncArray = postArray.map(post => {
        //         return executeAsync(post, this, ctx);
        //     });
        //     yield asyncArray;

        //     res.format(this.formats);

        // })
        //     .catch(error => {
        //         return executeAsync(onError, this, error, ctx)
        //             .then(() => {
        //                 return res.format(this.formats);
        //             });
        //     })
        //     .then(() => {
        //         preArray = null;
        //         postArray = null;
        //         asyncArray = null;
        //     });

        // let asyncArray = preArray.map(pre => {
        //     //return executeAsync(pre, this, ctx);
        //     return co(pre, ctx);
        // });

        // pre conditions
        return executeSequence(preArray, ctx)//Promise.all(asyncArray)
            // handler executions
            .then(() => {
                return co(handler, ctx); //executeAsync(handler, this, ctx);
            })
            // post conditions
            .then(data => {
                ctx.state.api.data = data;
                // asyncArray = null;
                // asyncArray = postArray.map(post => {
                //     return co(post, ctx); //executeAsync(post, this, ctx);
                // });
                return executeSequence(postArray, ctx);
            })
            .then(() => {
                return this.send(ctx);
            })
            .catch(error => {
                return co(onError, error, ctx) //executeAsync(onError, this, error, ctx)
                    .then(handled => {
                        return !handled && this.send(ctx);
                    });
            })
            .catch(error => {
                ctx.throw(500, error);
            })
            .then(() => {
                preArray = null;
                postArray = null;
                //asyncArray = null;
            });
    }

    /**
     * adds methods to BeginRequest stack
     * @param fn {Function} the function should return Promise object
     * @returns {Action}
     */
    pre(fn) {
        this.add(ActionType.PRE, fn);
        return this;
    }

    /**
     * adds methods to EndRequest stack
     * @param fn {Function} the function should return Promise object
     * @returns {Action}
     */
    post(fn) {
        this.add(ActionType.POST, fn);
        return this;
    }

    /**
     * adds methods to OnError stack
     * @param fn {Function} the function should return Promise object
     * @returns {Action}
     */
    error(fn) {
        this.add(ActionType.ERROR, fn);
        return this;
    }

    /**
     * override main handler of this action
     * @param fn {Function} the function should to accept `req` and `res` and return Promise object 
     */
    handler(fn) {
        this.addOnce(ActionType.HANDLER, fn);
        return this;
    }

    /**
     * send reponse
     * @param req {IncomingRequest}
     * @param res {ServerResponse}
     * @param status {Integer} http status code
     */
    send(ctx) {
        // TODO: needs to check ctx.body if it is not empty, we doesn't have to handle the reponse 

        if (ctx.state.api.error) {
            let body = toJSON(ctx.state.api.error);
            ctx.response.status = ctx.state.api.error.httpStatusCode || ctx.state.api.error.httpCode || ctx.state.api.error.httpStatus || 500;
            ctx.body = body;
            return false;
        }

        let keys = Object.keys(this.formats);
        let key = keys.find(key => ctx.request.is(key)) || 'default';
        if (ctx.request.is(key))
            ctx.response.type = ctx.request.is(key);// return text/html, json, xml
        this.formats[key].call(this, ctx);
        keys = null;
    }

    /**
     * adds methods to stack
     * @param name {String} fn name
     * @param fn {Function} function it self
     */
    add(name, fn) {
        if (!(fn && typeof (fn) === 'function'))
            return;
        let arr = [];
        if (this.actions.has(name)) {
            arr = this.actions.get(name);

            if (!Array.isArray(arr))
                throw new Error('arr must be array');
        }
        arr.push(fn.bind(this));
        this.actions.set(name, arr);
    }

    /**
     * adds method to a stack and replace old one with new one
     * @param name {String} fn name
     * @param fn {Function} function it self
     */
    addOnce(name, fn) {
        if (!(fn && typeof (fn) === 'function'))
            return;

        if (this.actions.has(name)) {
            let arr = this.actions.get(name);

            if (!Array.isArray(arr))
                throw new Error('arr must be array');
        }
        this.actions.set(name, fn.bind(this));
    }

    /**
     * adds method to route
     * @param {Object} route
     */
    addTo(route, method) {
        let that = this;
        let exec = function* (next) {
            yield that.execute(this, next);
            that = null;
        };

        if (!route) {
            return exec;
        } else {
            method = method || 'get';
            route[method].call(route, this.url, exec);
        }
        //throw new Error('Not implimented error: ${route}');
        return this;
    }

    /**
     * Performs content-negotiation on the Accept HTTP header on the request object, when present. 
     * It uses req.accepts() to select a handler for the request, based on the acceptable types ordered by their quality values.
     * Default is JSON response for every request. 
     * more: http://expressjs.com/en/4x/api.html#res.format
     * @param formatters {Object}
     */
    format(formatters) {
        if (typeof (formatters) !== 'object')
            throw new Error('Invalid parameter :formatters in format');

        this.formats = Object.assign(this.formats, formatters);
        return this;
    }
}


module.exports = Action;