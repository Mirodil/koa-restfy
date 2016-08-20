'use strict';

var ActionType = require('./action-types');
var Action = require('./action');
var executeAsync = require('./helpers').executeAsync;
var dummyFn = require('./helpers').dummyFn;


const HANDLER_TYPES = {
    UPDATE: 'update',
    UPDATED: 'updated',
    QUERY: 'query'
};


/**
 * for put request
 */
class PUTAction extends Action {
    /**
     * @param url {String}
     */
    constructor(url) {
        if (!url)
            throw new Error('Missing parameter: `url`');

        let ops = { url: url };
        super(ops);

        this.addOnce(ActionType.HANDLER, ctx => {
            let preQuery = this.actions.get(HANDLER_TYPES.QUERY) || dummyFn;
            let preUpdate = this.actions.get(HANDLER_TYPES.UPDATE) || dummyFn;
            let postUpdate = this.actions.get(HANDLER_TYPES.UPDATED);
            let query = Object.assign({}, ctx.query, ctx.params);
            let raw = ctx.request.body || {};
            // TODO: check to white-list fields
            //this.dataSource.normalize(raw);

            /// steps:
            /// 1. find document

            return executeAsync(preQuery, this, ctx, query)
                .then(r => {
                    return executeAsync(this.dataSource.selectOne, this.dataSource, r || query);
                })
                .then(doc => {
                    /// 2. check document to null, if null though exption
                    if (!doc)
                        return Promise.reject(new Error(`Docuemnt not found:${query}`));// throw new Error(`Docuemnt not found:${query}`);
                    /// 3. call 'before update'
                    return executeAsync(preUpdate, this, ctx, doc, raw)
                        .then(data => {
                            /// 4. assing new values to document
                            raw = data && typeof (data) === 'object' ? data : raw;
                            return this.dataSource.assign(doc, raw);
                        });
                })
                .then(doc => {
                    /// 5. call save document
                    return executeAsync(this.dataSource.update, this.dataSource, doc)
                        .then(data => data || doc);
                })
                .then(doc => {
                    /// 6. call 'after update'
                    /// 7. return new saved document
                    if (postUpdate && typeof postUpdate === 'function')
                        return executeAsync(postUpdate, this, ctx, doc)
                            .then(data => {
                                return data ? data : doc;
                            });
                    else
                        return doc;
                });
        });
    }

    /**
     * before calling selectOne function, this allow to change `query` parameter
     * @param fn {Function} (req, query)=> { return Promise.resolve(query); }
     */
    query(fn) {
        this.addOnce(HANDLER_TYPES.QUERY, fn);
        return this;
    }
    /**
     * before update
     * @param fn {Function} (req, raw)=>{ return Promise.resolve(raw) }
     * @examples
     * (req, raw)=>{ return Promise.resolve(raw) }
     */
    update(fn) {
        this.addOnce(HANDLER_TYPES.UPDATE, fn);
        return this;
    }

    /**
     * after update
     * @param fn {Function} (req, res, doc)=>{ return Promise.resolve(doc) }
     * @example
     * (req, res, doc)=>{ return Promise.resolve(doc) }
     */
    updated(fn) {
        this.addOnce(HANDLER_TYPES.UPDATED, fn);
        return this;
    }

    /**
     * adds method to route 
     */
    addTo(route) {
        // route.put(this.url, this.execute.bind(this));
        // return this;

        let that = this;
        route.put(this.url, function* (next) {
            yield that.execute(this, next);
            that = null;
        });
        return this;
    }
}

module.exports = PUTAction;