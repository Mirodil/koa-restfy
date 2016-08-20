var request = require('supertest');
var should = require('chai').should();
var koa = require('koa');
var koaRouter = require('koa-router');
var API = require('../index');


describe('DELETE', function () {

    var app;
    var router;

    beforeEach(function () {
        app = koa();

        router = koaRouter();

        app
            // .use(function* (next) {
            //     if ('PUT' != this.method)
            //         return yield next;
            //     let body = yield parse(this, { limit: '1kb' });
            //     this.request.body = body;
            //     return yield next;
            // })
            .use(router.routes())
            .use(router.allowedMethods());
    });

    describe('constructor()', function () {
        it('should throw an error if `url` is missing', function () {
            try {
                API.delete();

                should.fail();
            } catch (e) {
                e.message.should.equal('Missing parameter: `url`');
            }
        });

        it('should set the `put`', function () {
            var api = API.delete('/tests');

            api.should.be.an.instanceOf(require('../lib/delete'));
        });
    });



    describe('setDataSource', function () {

        it('should throw an error if `dataSource` is missing', () => {
            try {
                API.delete('/tests')
                    .setDataSource(null);

                should.fail();
            } catch (e) {
                e.message.should.equal('Missing parameter: `dataSource`');
            }

        });

        it('should set model', () => {

            API.delete('/tests')
                .setDataSource(new Mock({}));

        });
    });

    describe('delete integration', function () {

        it('should throw an error if data source does not implement: `selectOne`', (done) => {
            API.delete('/tests')
                .setDataSource(new Mock({}))
                .addTo(router);

            request(app.listen())
                .delete('/tests')
                .expect(500)
                .expect(res => {
                    res.body.message.should.equal('Not implemented: `selectOne`');
                })
                .end(done);
        });

        it('should throw an error if data source does not implement: `delete`', (done) => {
            Mock.prototype.selectOne = () => {
                return {};
            };

            API.delete('/tests')
                .setDataSource(new Mock({}))
                .addTo(router);

            request(app.listen())
                .delete('/tests')
                .expect(500)
                .expect(res => {
                    res.body.message.should.equal('Not implemented: `delete`');
                })
                .end(done);
        });


        it('check DataSource.selectOne and DataSource.delete', (done) => {
            var data = { title: 'title', description: 'description' };
            Mock.prototype.selectOne = (query) => {
                query.should.be.deep.equal({ id: '777' });
                return data;
            };

            Mock.prototype.delete = (doc) => {
                doc.should.be.deep.equal(data);
                return doc;
            };

            API.delete('/tests/:id')
                .setDataSource(new Mock({}))
                .addTo(router);

            request(app.listen())
                .delete('/tests/777')
                .send(data)
                .expect(200)
                .expect(data)
                .end(done);
        });


        it('check pre conditions', done => {
            var data = { title: 'title', description: 'description' };
            Mock.prototype.selectOne = (query) => {
                query.should.be.deep.equal({ id: '777' });
                return data;
            };

            Mock.prototype.delete = (doc) => {
                doc.should.be.deep.equal(data);
                return doc;
            };

            API.delete('/tests/:id')
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
                .delete('/tests/777')
                .expect(200)
                .expect(data)
                .end(done);
        });

        it('check post conditions', done => {
            var data = { title: 'title', description: 'description' };
            Mock.prototype.selectOne = (query) => {
                query.should.be.deep.equal({ id: '777' });
                return data;
            };

            Mock.prototype.delete = (doc) => {
                doc.should.be.deep.equal(data);
                return doc;
            };

            API.delete('/tests/:id')
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
                .delete('/tests/777')
                .expect(200)
                .expect(data)
                .end(done);
        });

        it('check pre and post conditions', done => {
            var data = { title: 'title', description: 'description' };
            Mock.prototype.selectOne = (query) => {
                query.should.be.deep.equal({ id: '777' });
                return data;
            };

            Mock.prototype.delete = (doc) => {
                doc.should.be.deep.equal(data);
                return doc;
            };

            API.delete('/tests/:id')
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
                .delete('/tests/777')
                .expect(200)
                .expect(data)
                .end(done);
        });

        it('check API.query', done => {
            var data = { title: 'title', description: 'description' };
            Mock.prototype.selectOne = (query) => {
                query.should.be.deep.equal({ id: '777', _id: 777 });
                return data;
            };

            Mock.prototype.delete = (doc) => {
                doc.should.be.deep.equal(data);
                return doc;
            };

            API.delete('/tests/:id')
                .setDataSource(new Mock({}))
                .pre(ctx => {
                    ctx.state.api.index = 0;
                    return true;
                })
                .query((ctx, query) => {
                    ctx.state.api.index.should.be.equal(0);
                    ctx.state.api.index += 1;
                    query.should.be.deep.equal({ id: '777' });
                    query._id = 777;
                    return query;
                })
                .post(ctx => {
                    ctx.state.api.index.should.be.equal(1);
                    ctx.state.api.data.should.be.deep.equal(data);
                    return true;
                })
                .addTo(router);

            request(app.listen())
                .delete('/tests/777')
                .expect(200)
                .expect(data)
                .end(done);
        });

        it('check API.delete', done => {
            var data = { title: 'title', description: 'description' };
            Mock.prototype.selectOne = (query) => {
                query.should.be.deep.equal({ id: '777' });
                return data;
            };

            Mock.prototype.delete = (doc) => {
                doc.should.be.deep.equal(data);
                return doc;
            };

            API.delete('/tests/:id')
                .setDataSource(new Mock({}))
                .pre(ctx => {
                    ctx.state.api.index = 0;
                    return true;
                })
                .delete((ctx, doc) => {
                    ctx.state.api.index.should.be.equal(0);
                    ctx.state.api.index += 1;
                    doc.should.be.deep.equal(data);
                    return true;
                })
                .post(ctx => {
                    ctx.state.api.index.should.be.equal(1);
                    ctx.state.api.data.should.be.deep.equal(data);
                    return true;
                })
                .addTo(router);

            request(app.listen())
                .delete('/tests/777')
                .expect(200)
                .expect(data)
                .end(done);
        });

        it('check API.deleted', done => {
            var data = { title: 'title', description: 'description' };
            Mock.prototype.selectOne = (query) => {
                query.should.be.deep.equal({ id: '777' });
                return data;
            };

            Mock.prototype.delete = (doc) => {
                doc.should.be.deep.equal(data);
                return doc;
            };

            API.delete('/tests/:id')
                .setDataSource(new Mock({}))
                .pre(ctx => {
                    ctx.state.api.index = 0;
                    return true;
                })
                .delete((ctx, doc) => {
                    ctx.state.api.index.should.be.equal(0);
                    ctx.state.api.index += 1;
                    doc.should.be.deep.equal(data);
                    return true;
                })
                .deleted((ctx, doc) => {
                    ctx.state.api.index.should.be.equal(1);
                    ctx.state.api.index += 1;
                    doc.should.be.deep.equal(data);
                })
                .post(ctx => {
                    ctx.state.api.index.should.be.equal(2);
                    ctx.state.api.data.should.be.deep.equal(data);
                    return true;
                })
                .addTo(router);

            request(app.listen())
                .delete('/tests/777')
                .expect(200)
                .expect(data)
                .end(done);
        });

    });
});

class Mock extends API.DataSource { }