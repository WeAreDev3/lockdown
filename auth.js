var LocalStrategy = require('passport-local').Strategy;

module.exports = function(passport, models) {
    var User = models.User;

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.get(id).run().then(function(user) {
            done(null, user);
        }, function(err) {
            done(err);
        });
    });

    passport.use(new LocalStrategy({
        usernameField: 'username',
        passwordField: 'passHash'
    }, function(username, passHash, done) {
        User.getAll(username, {
            index: 'username'
        }).run().then(function(user) {
            user = user[0];
            
            console.log(passHash, user.passHash);

            if (passHash === user.passHash) {
                return done(null, user);
            }

            return done(null, false, {
                message: 'Not correct!'
            });
        }, function(err) {
            return done(err, false, {
                message: 'Not correct!'
            });
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
