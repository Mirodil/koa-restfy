'use strict';

var ActionType = require('./action-types');
var Action = require('./action');
var executeAsync = require('./helpers').executeAsync;
var dummyFn = require('./helpers').dummyFn;


const HANDLER_TYPES = {
    DELETE: 'delete',
    DELETED: 'deleted'
};

/**
 * for delete request
 */
class DELETEAction extends Action {

    constructor(url) {
        if (!url)
            throw new Error('Missing parameter: `url`');

        let ops = { url: url };
        super(ops);

        this.addOnce(ActionType.HANDLER, ctx => {
            let preQuery = this.actions.get(HANDLER_TYPES.QUERY) || dummyFn;
            let preDelete = this.actions.get(HANDLER_TYPES.DELETE) || dummyFn;
            let postDelete = this.actions.get(HANDLER_TYPES.DELETED);
            let query = Object.assign({}, ctx.query, ctx.params);

            /// steps:
            /// 1. find document

            return executeAsync(preQuery, this, ctx, query)
                .then(r => {
                    return executeAsync(this.dataSource.selectOne, this.dataSource, r || query);
                })
                .then(doc => {
                    /// 2. check document to null, if null though exption
                    if (!doc)
                        return Promise.reject(new Error(`Docuemnt not found:${query}`));//throw new Error(`Docuemnt not found:${query}`);
                    /// 3. call 'before delete'
                    return executeAsync(preDelete, this, ctx, doc)
                        .then(() => doc);
                })
                .then(doc => {
                    /// 5. call delete document
                    return executeAsync(this.dataSource.delete, this.dataSource, doc)
                        .then(data => data || doc);
                })
                .then(doc => {
                    /// 6. call 'after delete'
                    /// 7. return deleted document
                    if (postDelete && typeof postDelete === 'function')
                        return executeAsync(postDelete, this, ctx, doc)
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
     * add method before delete operation
     * @param fn {Function} (req, doc)=>{ return Promise.reslove(doc) }
     * @example
     * (req, doc)=>{ return Promise.reslove(doc) }
     */
    delete(fn) {
        this.addOnce(HANDLER_TYPES.DELETE, fn);
        return this;
    }

    /**
     * add method after delete operation
     * @param fn {Function} (req, res, doc)=>{ return Promise.reslove(doc) }
     * @example
     * (req, res, doc)=>{ return Promise.reslove(doc) }
     */
    deleted(fn) {
        this.addOnce(HANDLER_TYPES.DELETED, fn);
        return this;
    }

    addTo(route) {
        // route.delete(this.url, this.execute.bind(this));
        // return this;

        let that = this;
        route.del(this.url, function* (next) {
            yield that.execute(this, next);
            that = null;
        });
        return this;

    }
}

module.exports = DELETEAction;