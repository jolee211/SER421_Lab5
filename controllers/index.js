let auth = require('./auth.js');

module.exports.set = function (app) {
    auth.set(app);
}