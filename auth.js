var LocalStrategy = require('passport-local').Strategy,
    Promise = require('bluebird'),
    scrypt = require('scrypt'),
    crypto = require('crypto'),
    scryptParameters = scrypt.params(0.1);

// promisify
crypto.pbkdf2 = Promise.promisify(crypto.pbkdf2);
scrypt.verifyHash = Promise.promisify(scrypt.verifyHash);

module.exports = function(passport, db) {
    var User = db.User;

    passport.serializeUser(function(user, done) {
        done(null, user.username);
    });

    passport.deserializeUser(function(username, done) {
        User.getAll(username, {
            index: 'username'
        })
            .run().then(function(user) {
                user = user[0];
                done(null, user);
            }, function(err) {
                done(err);
            });
    });

    passport.use(new LocalStrategy({
        usernameField: 'username',
        passwordField: 'clientHash'
    }, function(username, clientHash, done) {
        User.getAll(username, {
            index: 'username'
        })
            .pluck('passHash', 'passSalt', 'passIter', 'passHashSize', 'username')
            .run().then(function(user) {
                user = user[0];

            if (user) {
                crypto.pbkdf2(new Buffer(clientHash), new Buffer(user.passSalt), user.passIter, user.passHashSize)
                .then(function (hash) {
                    return scrypt.verifyHash(user.passHash, hash.toString('base64');
                }).then(function (isValid) {
                    if (isValid) {
                        return done(null, user);
                    } else {
                        return done(null, false, {
                            // Incorrect password
                            // TODO: Change to more ambiguous text
                            message: 'Invalid password'
                        });
                    }
                }, function (err) {
                    return done(err);
                })
            } else {
                return done(null, false, {
                    // Invalid username
                    // TODO: Change to more ambiguous text
                    message: 'No user found'
                });
            }
        }, function(err) {
            return done(err, false);
        });
    }));

    return {
        ensureAuthenticated: function(req, res, next) {
            if (req.isAuthenticated()) {
                return next();
            }

            // Not signed in, send 401 (Unauthorized)
            res.send(401);
        }
    };
};
