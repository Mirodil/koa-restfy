'use strict';

class DataSource {
    constructor(model) {
        if (!model)
            throw new Error('Missing parameter: `model`');

        this.model = model;
    }

    /**
     * select query
     * @param query {Object} e.g: {where:{}, limit: 0, offset:0}
     * @returns should return Promise
     */
    select(query) {
        throw new Error('Not implemented: `select`');
    }

    selectOne(query) {
        throw new Error('Not implemented: `selectOne`');
    }

    create(doc) {
        throw new Error('Not implemented: `create`');
    }

    update(doc) {
        throw new Error('Not implemented: `update`');
    }

    delete(doc) {
        throw new Error('Not implemented: `delete`');
    }

    getFields() {
        throw new Error('Not implemented: `getFields`');
    }


    normalize(filter, root) {
        if (!root)
            root = this.getFields();

        Object.keys(filter).forEach(key => {
            var path = root[key];
            var typeName = path.type.name;
            // it's embedded document
            if (path.schema) {
                // TODO: needs to figure it out
                this.normalize(filter[key], path);
            } else if (typeName === 'Date' && typeof (filter[key]) === 'string') {
                filter[key] = new Date(filter[key]);
            } else if (typeName === 'Boolean' && typeof (filter[key]) === 'string') {
                filter[key] = /true/i.test(filter[key]);
            } if (typeName === 'Number') {
                filter[key] = Number(filter[key]);
            }
        });
    }

    assign(target, source) {
        //TODO: needs to rewrite to inner/sub documents and array
        Object.keys(source)
            .forEach(key => {
                target[key] = source[key];
            });
        return target;
    }
}

// _buildQ = function _buildQ(qFields, q) {
//   var qExpr = [];
//   _.forEach(qFields, function (qField) {
//     var obj = {};
//     obj[qField] = {$regex: '.*' + q + '.*', $options: 'i'};
//     qExpr.push(obj);
//   });
//   return qExpr;
// };

// function _normalize(filter, root) {
//   _.forEach(_.keys(filter), function (key) {
//     var path = root.schema.paths[key];
//     // if it's an operator
//     if (key.substr(0, 1) === '$') {
//       // increase the level without changing the root
//       this._normalizeFilter(filter[key], root);
//     } else if (path) {
//       var typeName = path.options.type.name;
//       // it's embedded document
//       if (!_.isUndefined(path.schema)) {
//         this._normalizeFilter(filter[key], root.schema.paths[key]);
//       } else if (typeName === 'ObjectId') {
//         if (typeof(filter[key]) === 'string') {
//           filter[key] = ObjectID(filter[key]);
//         }
//       } else if (typeName === 'Date') {
//         if (typeof(filter[key]) === 'string') {
//           filter[key] = new Date(filter[key]);
//         }
//         else if (typeof(filter[key]) === 'object') {
//           _.forOwn(filter[key], function (value, innerKey) {
//             if (typeof(value) === 'string') {
//               filter[key][innerKey] = new Date(value);
//             }
//           });
//         }
//       }
//     }
//   }, this);
// };

module.exports = DataSource;