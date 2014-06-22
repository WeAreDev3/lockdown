var thinky = require('thinky')({db: 'password_manager'}),
    app = require('express')(),
    bodyParser = require('body-parser'),
    r = thinky.r;
    passport = require('passport'),
    auth = require('./auth')(passport),

app.use(bodyParser.json());

var config = {
    port: process.env.PORT || 3000
};
app.use(passport.initialize());
app.use(passport.session());

var User = thinky.createModel('User', {
    id: String,
    firstName: String,
    lastName: String
});

User.ensureIndex('firstName');

app.route('/').get(function (req, res) {
    res.json({main: 'It works!'});
});

app.route('/users')
    .get(function (req, res) {
        User.orderBy({index: 'firstName'}).run().then(function (users) {
            res.json(users);
        });
    })
    .post(function (req, res) {
        var user = new User(req.body);
        user.save().then(function (user) {
            console.log('User %s %s added to the database.', user.firstName, user.lastName);
            res.status(201);
            res.send(user.id);
        });
    });

app.route('/users/:id')
    .delete(function (req, res) {
        User.get(req.params.id).run().then(function (user) {
            user.delete().then(function (user) {
                console.log('User %s %s removed from the database.', user.firstName, user.lastName);
                res.status(204);
                res.send();
            });
        });
    });

app.listen(config.port);
console.log('App listening on port %d', config.port);