var co = require('co');

function executeAsync(fn, target, ...args) {
    return new Promise((resolve, reject) => {
        process.nextTick(() => {
            try {
                Promise.resolve(fn.apply(target, args))
                    .then(resolve)
                    .catch(reject);
            } catch (error) {
                reject(error);
            }

        });
    });
}

function dummyFn(params) {
    // return new Promise((resolve) => {
    //     resolve(params);
    // });
    return Promise.resolve();
}


function errorToJSON(error) {
    var alt = {};

    Object.getOwnPropertyNames(error).forEach(key => {
        alt[key] = error[key];
    });

    return alt;
}

var GeneratorFunction = (function* () { }).constructor;

function isGeneratorFunction(fn) {
    return fn && (fn instanceof GeneratorFunction);
}

/**
 * execute functions in sequence order
 * @param {Array<function>} tasks
 */
function executeSequence(tasks) {
    if (!tasks && tasks.length == 0)
        return Promise.resolve();

    return tasks.reduce((current, next) => {

        let args = Array.prototype.slice.call(arguments, 1);
        args.splice(0, 0, next);

        return current.then(() => {
            return co.apply(this, args);
        });
    }, Promise.resolve());
}

// TODO: needs to add generator base controll follow to Promise, Callback, and Generator function

module.exports = {
    executeAsync,
    dummyFn,
    errorToJSON,
    isGeneratorFunction,
    executeSequence
};