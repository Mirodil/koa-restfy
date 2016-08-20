'use strict';

var ActionType = require('./action-types');
var Action = require('./action');
var executeAsync = require('./helpers').executeAsync;
var dummyFn = require('./helpers').dummyFn;

/**
 * handler for GET requests
 */
class GETAction extends Action {
    /**
     * @param url {String}
     */
    constructor(url) {
        if (!url)
            throw new Error('Missing parameter: `url`');

        let ops = { url: url };
        super(ops);

        // add query parser
        this.add(ActionType.PRE, (ctx) => {
            try {
                if (ctx.query.filter && typeof ctx.query.filter === 'string') {
                    let filter = JSON.parse(ctx.query.filter);
                    ctx.query.filter = null;
                    ctx.query.filter = filter;
                }

                if (ctx.query.limit && typeof ctx.query.limit !== 'number') {
                    ctx.query.limit = parseInt(ctx.query.limit);
                }

                if (ctx.query.offset && typeof ctx.query.offset !== 'number') {
                    ctx.query.offset = parseInt(ctx.query.offset);
                }

                return Promise.resolve(ctx.query);
            } catch (error) {
                return Promise.reject(error);
            }
        });

        this.addOnce(ActionType.HANDLER, (ctx) => {
            let select = this.actions.get('select') || dummyFn;
            let selected = this.actions.get('selected');
            let query = ctx.query;

            return executeAsync(select, this, ctx, query)
                .then(() => {
                    let ops = {};
                    if (query.filter)
                        ops.where = query.filter;
                    if (query.limit)
                        ops.limit = query.limit;
                    if (query.offset)
                        ops.offset = query.offset;

                    return this.dataSource.select(query);
                })
                .then(docs => {
                    if (selected && typeof selected === 'function')
                        return executeAsync(selected, this, ctx, docs)
                            .then(data => {
                                return data ? data : docs;
                            });
                    else
                        return docs;
                });
        });
    }

    /**
     * add method before select operation
     * @param fn {Function} (req, query)=>{ return Promise.reslove(query) }
     * @example
     * (req, query)=>{ return Promise.reslove(query) }
     */
    select(fn) {
        this.addOnce('select', fn);
        return this;
    }

    /**
     * add method after select operation
     * @param fn {Function} (req, res, docs)=>{ return Promise.reslove(docs) }
     * @example
     * (req, res, docs)=>{ return Promise.reslove(docs) }
     */
    selected(fn) {
        this.addOnce('selected', fn);
        return this;
    }

    addTo(route) {
        // var that = this;
        // route.get(this.url, function* (next) {
        //     yield that.execute(this, next);
        // });
        // return this;
        return super.addTo(route, 'get');
    }
}


module.exports = GETAction;