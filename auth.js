var LocalStrategy = require('passport-local').Strategy;

module.exports = function(passport) {
    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    passport.deserializeUser(function(id, done) {
        done(null, user);
    });

    passport.use(new LocalStrategy(function(username, password, done) {
        done(null, {
            username: username,
            password: password
        });
    }));

    return {
        ensureAuthenticated: function(req, res, next) {
            if (req.isAuthenticated()) {
                return next();
            }

            // Not signed in, send 403 (Forbidden)
            res.send(403);
        }
    };
};
