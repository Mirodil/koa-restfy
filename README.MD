# koa-restfy
Database agnostic/independent koa restfy module 

# API

## Datasource
```javascript

class MongooseDataSource extends API.DataSource {
    constructor(model) {
        super(model);
    }

    /**
     * sould return Promise object for below query
     * query {
     *  where:{},
     *  limit: Number
     *  offset: Number
     * }
     */
    select(query) {
        return this.model.find(query.where, null, { limit: query.limit, skip: query.offset }).exec();
    }

    /**
     * what is comes from request query string and parameters
     * sould return Promise object for below query
     */
    selectOne(query) {
        return this.model.findById(query._id).exec();
    }

    /**
     * sould return Promise object
     * @param doc {Object} raw js object
     */
    create(doc) {
        return this.model.create(doc);
    }

    /**
     * sould return Promise object
     * @param doc {Object} is object retruned by selectOne and with new values
     */
    update(doc) {
        return doc.save();
    }

    /**
     * sould return Promise object
     * @param doc {Object} is object retruned by selectOne
     */
    delete(doc) {
        return doc.remove();
    }

    /**
     * sould return fields information
     */
    getFields() {
        return this.model.paths;
    }
}


module.exports = MongooseDataSource;
```

## GET
```javascript
API.get('/products')
    .select((ctx, query)=>{ 
        // before document select
        return Promise.reslove(query);
    })
    .selected((ctx, docs)=>{
        // after document select 
        return Promise.reslove(docs);
    })
    .addTo(router);
```
it will accable to `GET /products`

## POST
```javascript
API.post('/products')
    .create((ctx, raw)=>{ 
        // before creating object
        // raw - is object from ctx.request.body
        return Promise.reslove(raw); 
    })
    .created((ctx, doc)=>{
        // after creating document inside database, `doc` is object returned from database throw DataSource
        return Promise.reslove(doc);
    })
    .addTo(router);
```
it will accable to `POST /products`

## PUT
```javascript
API.put('/products/:id')
    .query((ctx, query)=> { 
        // before calling selectOne function, this allow to change `query` parameter
        return Promise.resolve(query); 
    })
    .update((ctx, raw)=>{ 
        // before update object, raw - is object from ctx.request.body
        return Promise.reslove(raw); 
    })
    .updated((ctx, doc)=>{
        // after update document inside database, `doc` is object returned from database throw DataSource
        return Promise.reslove(doc);
    })
    .addTo(router);
```
it will accable to `PUT /products/10`

## Delete
```javascript
API.put('/products/:id')
    .query((ctx, query)=> { 
        // before calling selectOne function, this allow to change `query` parameter
        return Promise.resolve(query); 
    })
    .delete((ctx, doc)=>{ 
        // before delete object
        // raw - is object from ctx.request.body
        return Promise.reslove(doc); 
    })
    .deleted((ctx, doc)=>{
        // after delete document inside database, `doc` is object returned from database throw DataSource
        return Promise.reslove(doc);
    })
    .addTo(router);
```
it will accable to `DELETE /products/10`

## Common methods
```javascript
API[.get|.post|.put|.delete]
    .pre(ctx=>{ }) // adds methods to BeginRequest stack, more then one
    .post(ctx=>{ }) // adds methods to EndRequest stack, more then one
    .error((err, ctx)=>{ }) //adds methods to OnError stack, more then one
    .format({...}) // Performs content-negotiation on the Accept HTTP header on the request object, when present, part of expressjs
    .addTo(router) // adds method to route, only once.
```


## Round Map
- integration instractions to fields
- integration socket.io