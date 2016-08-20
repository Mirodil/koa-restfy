var request = require('supertest');
var should = require('chai').should();
var expect = require('chai').expect;
var koa = require('koa');
var koaRouter = require('koa-router');
var API = require('../index');

let foo = 'hello';
foo.should.be.a('string');

describe('GET', function () {

    var app;
    var router;

    beforeEach(function () {
        app = koa();

        router = koaRouter();

        app
            .use(router.routes())
            .use(router.allowedMethods());

        // API.get('/users')
        //     .setModel({
        //         GET    
        //         select(model, query) { 
        //            return model.find(query.where, {limit: query.limit, offset: query.offset});
        //         },
        //         POST, PUT
        //         save(model, doc) { 
        //            return doc.save() or model.create(doc);
        //         },
        //         update(model, id, doc){
        //            return model.update(id, doc);
        //         }
        //         delete(model, doc) {
        //            return model.delete(doc);
        //         }
        //     })
        //     .pre((req, res) => {

        //     })
        //     .pre((req, res) => {

        //     })
        //     .select((req, query, model) => {

        //     })
        //     .post((req, res, rows) => {

        //     })
        //     .error((err, req, res) => {

        //     })
        //     .addTo(router);


    });

    describe('constructor()', function () {
        it('should throw an error if `url` is missing', function () {
            try {
                API.get();

                should.fail();
            } catch (e) {
                e.message.should.equal('Missing parameter: `url`');
            }
        });

        it('should set the `get`', function () {
            var getApi = API.get('/tests');

            getApi.should.be.an.instanceOf(require('../lib/get'));
        });
    });


    describe('setDataSource', function () {


        it('should throw an error if `dataSource` is missing', () => {
            try {
                API.get('/tests')
                    .setDataSource(null);

                should.fail();
            } catch (e) {
                e.message.should.equal('Missing parameter: `dataSource`');
            }

        });

        // it('should throw an error if model does not implement: `select`', () => {
        //     try {
        //         API.get('/tests')
        //             .setDataSource({});

        //         should.fail();
        //     } catch (e) {
        //         e.message.should.equal('Invalid parameter: `dataSource`. Should be instance of DataSource');
        //     }
        // });

        it('should set model', () => {

            API.get('/tests')
                .setDataSource(new Mock({}));

        });
    });

    describe('get integration', function () {

        it('should throw an error if data source does not implement: `select`', (done) => {
            API.get('/tests')
                .setDataSource(new Mock({}))
                .addTo(router);

            request(app.listen())
                .get('/tests')
                .expect(500)
                .expect(res => {
                    res.body.message.should.equal('Not implemented: `select`');
                })
                .end(done);

        });


        it('check DataSource.select to empty query', (done) => {
            Mock.prototype.select = (query) => {
                expect(query).to.be.empty; // query.should.be.empty;
                return {};
            };

            API.get('/tests')
                .setDataSource(new Mock({}))
                .addTo(router);

            request(app.listen())
                .get('/tests')
                .expect(200)
                .expect({})
                .end(done);
        });

        it('check DataSource.select to query', (done) => {
            Mock.prototype.select = (query) => {
                expect(query).to.have.property('offset', 0);
                expect(query).to.have.property('limit', 10);
                expect(query).to.be.deep.equal({ filter: { name: true }, offset: 0, limit: 10 });
                return {};
            };

            API.get('/tests')
                .setDataSource(new Mock({}))
                .addTo(router);

            request(app.listen())
                .get('/tests?offset=0&limit=10&filter={"name":true}')
                .expect(200)
                .expect({})
                .end(done);
        });

        it('check pre conditions', done => {
            Mock.prototype.select = () => {
                return {};
            };

            API.get('/tests')
                .setDataSource(new Mock({}))
                .pre(ctx => {
                    ctx.state.api.index = 0;
                    return true;
                })
                .pre(ctx => {
                    ctx.state.api.index.should.be.equal(0);
                    ctx.state.api.index += 1;
                    return true;
                })
                .pre(ctx => {
                    ctx.state.api.index.should.be.equal(1);
                    return true;
                })
                .addTo(router);

            request(app.listen())
                .get('/tests')
                .expect(200)
                .expect({})
                .end(done);
        });

        it('check post conditions', done => {
            Mock.prototype.select = () => {
                return {};
            };

            API.get('/tests')
                .setDataSource(new Mock({}))
                .post(ctx => {
                    ctx.state.api.index = 0;
                    ctx.state.api.data.should.be.deep.equal({});
                    return true;
                })
                .post(ctx => {
                    ctx.state.api.index.should.be.equal(0);
                    ctx.state.api.index += 1;
                    return true;
                })
                .post(ctx => {
                    ctx.state.api.index.should.be.equal(1);
                    return true;
                })
                .addTo(router);

            request(app.listen())
                .get('/tests')
                .expect(200)
                .expect({})
                .end(done);
        });

        it('check pre and post conditions', done => {
            Mock.prototype.select = () => {
                return {};
            };

            API.get('/tests')
                .setDataSource(new Mock({}))
                .pre(ctx => {
                    ctx.state.api.index = 0;
                    return true;
                })
                .post(ctx => {
                    ctx.state.api.index.should.be.equal(0);
                    ctx.state.api.data.should.be.deep.equal({});
                    return true;
                })
                .addTo(router);

            request(app.listen())
                .get('/tests')
                .expect(200)
                .expect({})
                .end(done);
        });

        it('check API.select', done => {
            Mock.prototype.select = () => {
                return {};
            };

            API.get('/tests')
                .setDataSource(new Mock({}))
                .pre(ctx => {
                    ctx.state.api.index = 0;
                    return true;
                })
                .select((ctx, query) => {
                    ctx.state.api.index.should.be.equal(0);
                    ctx.state.api.index += 1;
                    expect(query).to.be.deep.empty;
                    return true;
                })
                .post(ctx => {
                    ctx.state.api.index.should.be.equal(1);
                    ctx.state.api.data.should.be.deep.equal({});
                    return true;
                })
                .addTo(router);

            request(app.listen())
                .get('/tests')
                .expect(200)
                .expect({})
                .end(done);
        });

        it('check API.selected', done => {
            Mock.prototype.select = () => {
                return {};
            };

            API.get('/tests')
                .setDataSource(new Mock({}))
                .pre(ctx => {
                    ctx.state.api.index = 0;
                    return true;
                })
                .select((ctx, query) => {
                    ctx.state.api.index.should.be.equal(0);
                    ctx.state.api.index += 1;
                    expect(query).to.be.deep.empty;
                    return true;
                })
                .selected((ctx, docs) => {
                    ctx.state.api.index.should.be.equal(1);
                    ctx.state.api.index += 1;
                    expect(docs).to.be.deep.empty;
                })
                .post(ctx => {
                    ctx.state.api.index.should.be.equal(2);
                    ctx.state.api.data.should.be.deep.equal({});
                    return true;
                })
                .addTo(router);

            request(app.listen())
                .get('/tests')
                .expect(200)
                .expect({})
                .end(done);
        });

        it('check API.select and API.selected', done => {
            Mock.prototype.select = () => {
                return {};
            };

            API.get('/tests')
                .setDataSource(new Mock({}))
                .pre(ctx => {
                    ctx.state.api.index = 0;
                    return true;
                })
                .selected((ctx, docs) => {
                    ctx.state.api.index.should.be.equal(0);
                    ctx.state.api.index += 1;
                    expect(docs).to.be.deep.empty;
                })
                .post(ctx => {
                    ctx.state.api.index.should.be.equal(1);
                    ctx.state.api.data.should.be.deep.equal({});
                    return true;
                })
                .addTo(router);

            request(app.listen())
                .get('/tests')
                .expect(200)
                .expect({})
                .end(done);
        });

        it('check generator functions', done => {

            API.get('/tests')
                .setDataSource(new Mock({}))
                .pre(function* (ctx) {
                    let a = yield Promise.resolve(0);
                    a.should.be.equal(0);
                    ctx.state.api.a = yield Promise.resolve(++a);
                })
                .pre(function* (ctx) {
                    let a = yield Promise.resolve(0);
                    ctx.state.api.a.should.be.equal(1);
                })
                .addTo(router);

            request(app.listen())
                .get('/tests')
                .expect(200)
                .end(done);
        });


    });


});


class Mock extends API.DataSource { }