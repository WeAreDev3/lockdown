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
// Sign in the user
.post(function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) {
            // 500 (Internal Server Error)
            return res.send(500, err);
        }

        if (!user) {
            // Credentials not correct, send 401 (Unauthorized)
            return res.send(401, info);
        }

        req.logIn(user, function(err) {
            if (err) {
                // 500 (Internal Server Error)
                return res.send(500, err);
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
// Get a list of all the users
.get(auth.ensureAuthenticated, function(req, res) {
    User.orderBy({
        index: 'username'
    }).run().then(function(users) {
        res.json(users);
    }, function(err) {
        res.json(err);
    });
})
// Create a new user
.post(function(req, res) {
    User.getAll(req.body.username, {
        index: 'username'
    }).run().then(function(dupeUser) {
        if (dupeUser.length) {
            console.log('Username "%s" already exits, %s %s', req.body.userame, req.body.firstName, req.body.lastName);

            // Username already exits, send 409 (Conflict)
            res.status(409);
            return res.send({
                message: 'Can not use that username'
            });
        }

        user = new User(req.body);
        user.save().then(function(user) {
            console.log('User %s %s added to the database.', user.firstName, user.lastName);

            res.status(201);
            res.send(user.id);
        }, function(err) {
            console.log('User %s %s NOT created', user.firstName, user.lastName);
            console.log(err.toString());

            res.status(400);
            res.send({
                message: err.toString()
            });
        });
    });
});

app.route('/users/:id')
    .delete(auth.ensureAuthenticated, function(req, res) {
        var id = req.params.id;

        // Only allow people to delete themselves 
        if (id === req.user.id) {
            User.get(req.params.id).run().then(function(user) {
                user.delete().then(function(user) {
                    console.log('User %s %s removed from the database.', user.firstName, user.lastName);

                    res.status(204);
                    res.send();
                });
            });
        } else {
            // Trying to delete other user, send 401 (Unauthorized)
            res.status(401);
            res.send({
                message: 'Not authorized'
            });
        }
    });

app.listen(config.port, function() {
    console.log('App listening on port %d', config.port);
});
