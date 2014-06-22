var app = require('express')(),
    bodyParser = require('body-parser'),
    session = require('express-session'),

    thinky = require('thinky')({
        db: 'password_manager'
    }),
    models = require('./models')(thinky),
    User = models.User,

    passport = require('passport'),
    auth = require('./auth')(passport),

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
    .post(function(req, res) {

    });

app.route('/users')
    .get(function(req, res) {
        User.orderBy({
            index: 'firstName'
        }).run().then(function(users) {
            res.json(users);
        });
    })
    .post(function(req, res) {
        var user = new User(req.body);
        user.save().then(function(user) {
            console.log('User %s %s added to the database.', user.firstName, user.lastName);
            res.status(201);
            res.send(user.id);
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
