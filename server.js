var app = require('express')(),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    crypto = require('crypto'),
    scrypt = require('scrypt'),
    os = require('os'),
    numCPUtoFork = os.cpus().length,
    cluster = require('cluster'),

    db = require('./db'),
    User = db.User,

    passport = require('passport'),
    auth = require('./auth')(passport, db),

    config = require('./config');

if (numCPUtoFork >= 12) {
    numCPUtoFork = 10;
} else if (numCPUtoFork >= 8){
    numCPUtoFork = numCPUtoFork -2;
} else if (numCPUtoFork > 1) {
    numCPUtoFork--;
}
if (cluster.isWorker) {
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
        User.getAll(req.body.username.toLowerCase(), {
            index: 'username'
        }).run().then(function(dupeUser) {
            if (dupeUser.length) {
                console.log('Username "%s" already exits, %s %s', req.body.username, req.body.firstName, req.body.lastName);

                // Username already exits, send 409 (Conflict)
                res.status(409);
                return res.send({
                    message: 'Can not use that username'
                });
            }

            newUser = {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                displayUsername: req.body.username,
                username: req.body.username.toLowerCase(),
                passIter: config.crypt.iterations,
                passHashSize: config.crypt.hashSize,
            };

            crypto.randomBytes(config.crypt.saltLength, function (er, randomBytes) {
                if (er) {
                    
                } else {
                    salt = randomBytes.toString('base64');
                    newUser.passSalt = salt;
                    crypto.pbkdf2(new Buffer(req.body.password), salt, config.crypt.iterations,
                        config.crypt.hashSize, function (er, hash) {
                            if (er) {

                            } else {
                                hash = hash.toString('base64');
                                scrypt.passwordHash(hash, config.crypt.scryptParameters, function (er, finalHash) {
                                    if (er) {

                                    } else {
                                        newUser.passHash = finalHash;
                                        user = new User(newUser);
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
                                    }
                                });
                            }
                        });
                }
            });
        });
    });

    app.route('/users/:username')
        .delete(auth.ensureAuthenticated, function(req, res) {
            var username = req.params.username;

            // Only allow people to delete themselves 
            if (username === req.user.username) {
                User.getAll(username, {index:'username'}).run().then(function(user) {
                    user[0].delete().then(function(user) {
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
} else {
    // master process runs this
    for (var i = 0; i < numCPUtoFork; i++) {
        cluster.fork();
    }
}