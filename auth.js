var LocalStrategy = require('passport-local').Strategy,
    Promise = require('bluebird'),
    scrypt = require('scrypt'),
    crypto = require('crypto'),
    scryptParameters = scrypt.params(0.1),
    config = require('./config');

// promisify
crypto.pbkdf2 = Promise.promisify(crypto.pbkdf2);

module.exports = function(passport, db) {
    var User = db.User;

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.get(id).run().then(function(user) {
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
        var user;

        User.getAll(username, {
            index: 'username'
        }).pluck('passHash', 'passSalt', 'passIter', 'passHashSize', 'displayUsername', 'id')
            .execute().then(function(cursor) {
                return cursor.next();
            }).then(function(data) {
                user = data;

                return crypto.pbkdf2(clientHash, user.passSalt, user.passIter, user.passHashSize);
            }, function(err) {
                done(null, false, {
                    // Invalid username
                    // TODO: Change to more ambiguous text
                    message: 'No user found'
                });
            }).then(function(hash) {
                // Can't find a way to convert scrypt.verifyHash into a promise
                scrypt.verifyHash(user.passHash, hash.toString('base64'), function(err, isValid) {
                    // err_code 4 means invalid password
                    if (err && err.err_code !== 4) {
                        done(err, false);
                    } else if (isValid) {
                        done(null, user);
                    } else {
                        done(null, false, {
                            // Incorrect password
                            // TODO: Change to more ambiguous text
                            message: 'Invalid password'
                        });
                    }
                });
            }, function(err) {
                done(err);
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
