'use strict';

var ActionType = require('./action-types');
var Action = require('./action');
var executeAsync = require('./helpers').executeAsync;
var dummyFn = require('./helpers').dummyFn;


const HANDLER_TYPES = {
    CREATE: 'create',
    CREATED: 'created'
};

class POSTAction extends Action {
    /**
     * @param url {String}
     */
    constructor(url) {
        if (!url)
            throw new Error('Missing parameter: `url`');

        let ops = { url: url };
        super(ops);

        this.addOnce(ActionType.HANDLER, ctx => {
            let preCreate = this.actions.get(HANDLER_TYPES.CREATE) || dummyFn;
            let postCreate = this.actions.get(HANDLER_TYPES.CREATED);
            let raw = ctx.request.body;
            // TODO: check to white-list fields

            return executeAsync(preCreate, this, ctx, raw)
                .then(data => {
                    raw = data && typeof (data) === 'object' ? data : raw;
                    return this.dataSource.create(raw);
                })
                .then(doc => {
                    if (postCreate && typeof postCreate === 'function')
                        return executeAsync(postCreate, this, ctx, doc)
                            .then(data => {
                                return data ? data : doc;
                            });
                    else
                        return doc;
                });
        });
    }

    /**
     * before create
     * @param fn {Function} (req, raw)=>{ return Promise.reslove(raw) }
     * @examples
     * (req, raw)=>{ return Promise.reslove(raw) }
     */
    create(fn) {
        this.addOnce(HANDLER_TYPES.CREATE, fn);
        return this;
    }

    /**
     * after created
     * @param fn {Function} (req, res, doc)=>{ return Promise.reslove(doc) }
     * @example
     * (req, res, doc)=>{ return Promise.reslove(doc) }
     */
    created(fn) {
        this.addOnce(HANDLER_TYPES.CREATED, fn);
        return this;
    }

    addTo(route) {
        // let that = this;
        // route.post(this.url, function* (next) {
        //     yield that.execute(this, next);
        //     that = null;
        // });
        // return this;
        return super.addTo(route, 'post');
    }
}


module.exports = POSTAction;