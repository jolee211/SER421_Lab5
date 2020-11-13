let express = require('express');
const { User } = require('../User.js');
let jwt = require('jwt-simple');
let moment = require('moment');
let bodyParser = require('body-parser');
let urlencodedParser = bodyParser.urlencoded({ extended: false });

module.exports.set = function (app) {
    app.get('/login', urlencodedParser, function (req, res) {
        if (req.headers.username && req.headers.password) {
            // match the username and password
            user = new User(req.headers.username);
            user.comparePassword(req.headers.password, function (isMatch) {
                if (isMatch) {
                    // user has successfully authenticated, so we can generate and send back a token
                    let expires = moment().add('days', 7).valueOf();
                    let token = jwt.encode(
                        {
                            iss: user.username,
                            exp: expires
                        },
                        app.get('jwtTokenSecret')
                    );
                    res.json({
                        token: token,
                        expires: expires,
                        user: user.toJSON()
                    });
                } else {
                    // the password is wrong...
                    res.send('Authentication error', 401);
                }
            });
        } else {
            // no username provided, or invalid POST request
            res.send('Authentication error', 401);
        }
    });
};