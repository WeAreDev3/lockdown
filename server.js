var app = require('express')(),
    bodyParser = require('body-parser'),
    session = require('express-session'),

    models = require('./models'),
    User = models.User,

    passport = require('passport'),
    auth = require('./auth')(passport, models),

    config = {
        port: process.env.PORT || 3000
    };

app.use(bodyParser.json());
app.use(session({
    secret: 'much secret. very hidden. wow.'
}));

app.use(passport.initialize());
app.use(passport.session());

app.route('/').get(function(req, res) {
    res.json({
        main: 'It works!'
    });
});

app.route('/signin')
    .post(function(req, res, next) {
        passport.authenticate('local', function(err, user, info) {
            if (err) {
                return next(err);
            }

            if (!user) {
                req.session.messages = [info.message];

                // Credentials not correct, send 401 (Unauthorized)
                return res.send(401);
            }

            req.logIn(user, function(err) {
                if (err) {
                    return next(err);
                }

                res.send(200);
            });
        })(req, res, next);
    });


app.route('/session')
    // Delete the users's session, i.e. sign them out
    .delete(function(req, res) {
        req.logout();
        res.send(204);
    });

app.route('/users')
    .get(auth.ensureAuthenticated, function(req, res) {
        User.orderBy({
            index: 'username'
        }).run().then(function(users) {
            res.json(users);
        }, function(err) {
            res.json(err);
        });
    })
    .post(function(req, res) {
        User.run().then(function(users) {
            var i = users.length,
                user;

            while (i--) {
                if (req.body.username === users[i].username) {
                    console.log('User %s %s was NOT created', req.body.firstName, req.body.lastName);

                    // Username aleady exits, send 409 (Conflict)
                    res.status(409);
                    return res.send({
                        message: 'A user with that username already exists'
                    });
                }
            }

            user = new User(req.body);
            user.save().then(function(user) {
                console.log('User %s %s added to the database.', user.firstName, user.lastName);

                res.status(201);
                res.send(user.id);
            }, function(err) {
                console.log('User %s %s was NOT created', user.firstName, user.lastName);
                console.log(err.toString());

                res.status(401);
                res.send({
                    message: err.toString()
                });
            });
        });
    });

app.route('/users/:id')
    .delete(function(req, res) {
        User.get(req.params.id).run().then(function(user) {
            user.delete().then(function(user) {
                console.log('User %s %s removed from the database.', user.firstName, user.lastName);
                res.status(204);
                res.send();
            });
        });
    });

app.listen(config.port, function() {
    console.log('App listening on port %d', config.port);
});
