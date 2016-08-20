var request = require('supertest');
var should = require('chai').should();
var expect = require('chai').expect;
var koa = require('koa');
var koaRouter = require('koa-router');
var parse = require('co-body');
var API = require('../index');


describe('POST', function () {

    var app;
    var router;

    beforeEach(function () {
        app = koa();

        router = koaRouter();

        app
            .use(function* (next) {
                if ('POST' != this.method)
                    return yield next;
                let body = yield parse(this, { limit: '1kb' });
                this.request.body = body;
                return yield next;
            })
            .use(router.routes())
            .use(router.allowedMethods());

    });

    describe('constructor()', function () {
        it('should throw an error if `url` is missing', function () {
            try {
                API.post();

                should.fail();
            } catch (e) {
                e.message.should.equal('Missing parameter: `url`');
            }
        });

        it('should set the `post`', function () {
            var api = API.post('/tests');

            api.should.be.an.instanceOf(require('../lib/post'));
        });
    });

    describe('setDataSource', function () {


        it('should throw an error if `dataSource` is missing', () => {
            try {
                API.post('/tests')
                    .setDataSource(null);

                should.fail();
            } catch (e) {
                e.message.should.equal('Missing parameter: `dataSource`');
            }

        });

        it('should set model', () => {

            API.post('/tests')
                .setDataSource(new Mock({}));

        });
    });

    describe('post integration', function () {

        it('should throw an error if data source does not implement: `create`', (done) => {
            API.post('/tests')
                .setDataSource(new Mock({}))
                .addTo(router);

            request(app.listen())
                .post('/tests')
                .set('Content-Type', 'application/json')
                .expect(500)
                .expect(res => {
                    expect(res.body.message).to.be.equal('Not implemented: `create`');
                })
                .end(done);
        });


        it('check DataSource.create', (done) => {
            var data = { title: 'title', description: 'description' };
            Mock.prototype.create = (raw) => {
                expect(raw).to.be.deep.equal(data);
                return raw;
            };

            API.post('/tests')
                .setDataSource(new Mock({}))
                //.pre(parse)
                .addTo(router);

            request(app.listen())
                .post('/tests')
                .send(data)
                .expect(200)
                .expect(data)
                .end(done);
        });


        it('check pre conditions', done => {
            var data = { title: 'title', description: 'description' };
            Mock.prototype.create = (raw) => {
                raw.should.be.deep.equal(data);
                return raw;
            };

            API.post('/tests')
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
                .post('/tests')
                .send(data)
                .expect(200)
                .expect(data)
                .end(done);
        });

        it('check post conditions', done => {
            var data = { title: 'title', description: 'description' };
            Mock.prototype.create = (raw) => {
                raw.should.be.deep.equal(data);
                return raw;
            };

            API.post('/tests')
                .setDataSource(new Mock({}))
                .post(ctx => {
                    ctx.state.api.index = 0;
                    ctx.state.api.data.should.be.deep.equal(data);
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
                .post('/tests')
                .send(data)
                .expect(200)
                .expect(data)
                .end(done);
        });

        it('check pre and post conditions', done => {
            var data = { title: 'title', description: 'description' };
            Mock.prototype.create = (raw) => {
                raw.should.be.deep.equal(data);
                return raw;
            };

            API.post('/tests')
                .setDataSource(new Mock({}))
                .pre(ctx => {
                    ctx.state.api.index = 0;
                    return true;
                })
                .post(ctx => {
                    ctx.state.api.index.should.be.equal(0);
                    ctx.state.api.data.should.be.deep.equal(data);
                    return true;
                })
                .addTo(router);

            request(app.listen())
                .post('/tests')
                .send(data)
                .expect(200)
                .expect(data)
                .end(done);
        });

        it('check API.create', done => {
            var data = { title: 'title', description: 'description' };
            Mock.prototype.create = (raw) => {
                raw.should.be.deep.equal(data);
                return raw;
            };

            API.post('/tests')
                .setDataSource(new Mock({}))
                .pre(ctx => {
                    ctx.state.api.index = 0;
                    return true;
                })
                .create((ctx, raw) => {
                    ctx.state.api.index.should.be.equal(0);
                    ctx.state.api.index += 1;
                    raw.should.be.deep.equal(data);
                    return true;
                })
                .post(ctx => {
                    ctx.state.api.index.should.be.equal(1);
                    ctx.state.api.data.should.be.deep.equal(data);
                    return true;
                })
                .addTo(router);

            request(app.listen())
                .post('/tests')
                .send(data)
                .expect(200)
                .expect(data)
                .end(done);
        });

        it('check API.created', done => {
            var data = { title: 'title', description: 'description' };
            Mock.prototype.create = (raw) => {
                raw.should.be.deep.equal(data);
                return raw;
            };

            API.post('/tests')
                .setDataSource(new Mock({}))
                .pre(ctx => {
                    ctx.state.api.index = 0;
                    return true;
                })
                .create((ctx, raw) => {
                    ctx.state.api.index.should.be.equal(0);
                    ctx.state.api.index += 1;
                    raw.should.be.deep.equal(data);
                    return true;
                })
                .created((ctx, raw) => {
                    ctx.state.api.index.should.be.equal(1);
                    ctx.state.api.index += 1;
                    raw.should.be.deep.equal(data);
                })
                .post(ctx => {
                    ctx.state.api.index.should.be.equal(2);
                    ctx.state.api.data.should.be.deep.equal(data);
                    return true;
                })
                .addTo(router);

            request(app.listen())
                .post('/tests')
                .send(data)
                .expect(200)
                .expect(data)
                .end(done);
        });

    });
});

class Mock extends API.DataSource { }