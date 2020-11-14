let jwt = require('jwt-simple');
let url = require('url');
let jwtBlacklist = [];
let jwtTokenSecret = 'secret-value';

module.exports.jwtTokenSecret = jwtTokenSecret;

module.exports.auth = function (req, res, next) {
    // parse the URL
    let parsed_url = url.parse(req.url, true);

    // Take the token from:
    // - the POST value access_token
    // - the GET parameter access_token
    // - the x-access-token header
    // ... in that order
    let token = (req.body && req.body.access_token) || parsed_url.query.access_token || req.headers['x-access-token'];
    if (token && !jwtBlacklist.includes(token)) {
        try {
            let decoded = jwt.decode(token, jwtTokenSecret);
            if (decoded.exp <= Date.now()) {
                res.end('Access token has expired', 400);
            } else {
                req.user = {
                    username: decoded.iss,
                    password: decoded.iss
                };
                return next();
            }
        } catch (err) {
            return next();
        }
    } else {
        next();
    }
};

module.exports.logout = function (req, res, next) {
    // parse the URL
    let parsed_url = url.parse(req.url, true);
    // Take the token from:
    // - the POST value access_token
    // - the GET parameter access_token
    // - the x-access-token header
    // ... in that order
    let token = (req.body && req.body.access_token) || parsed_url.query.access_token || req.headers['x-access-token'];
    if (token) {
        jwtBlacklist.push(token);
    }
    return res.send(204);
};