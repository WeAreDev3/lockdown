var app = require('express')(),
    bodyParser = require('body-parser'),
    Promise = require('bluebird'),
    session = require('cookie-session'),
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
} else if (numCPUtoFork >= 8) {
    numCPUtoFork = numCPUtoFork - 2;
} else if (numCPUtoFork > 1) {
    numCPUtoFork--;
}

if (cluster.isWorker) {
    // promisify functions here
    crypto.randomBytes = Promise.promisify(crypto.randomBytes);
    crypto.pbkdf2 = Promise.promisify(crypto.pbkdf2);
    scrypt.passwordHash = Promise.promisify(scrypt.passwordHash);

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
        .get(function(req, res, next) {
            User.getAll(req.query.username.toLowerCase(), {
                index: 'username'
            }).run().then(function(clientCrypt) {
                console.log(clientCrypt);
                if (clientCrypt.length) {
                    res.send(clientCrypt[0].clientCrypt);
                }
            });
        })
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

            var newUser = {
                displayUsername: req.body.username,
                username: req.body.username.toLowerCase(),
                passIter: config.crypt.iterations,
                passHashSize: config.crypt.hashSize,
                email: req.body.email,
                clientCrypt: {
                    keyLength: req.body.keyLength,
                    iter: req.body.iter,
                    salt: req.body.salt
                }
            };

            crypto.randomBytes(config.crypt.saltLength)
                .then(function(randomBytes) {
                    var salt = randomBytes.toString('base64');
                    newUser.passSalt = salt;

                    return crypto.pbkdf2(new Buffer(req.body.hash), salt,
                        config.crypt.iterations, config.crypt.hashSize);
                })
                .then(function(hash) {
                    hash = hash.toString('base64');

                    return scrypt.passwordHash(hash, config.crypt.scryptParameters);
                })
                .then(function(finalHash) {
                    newUser.passHash = finalHash;
                    var user = new User(newUser);

                    return user.save();
                })
                .then(function(user) {
                    console.log('User %s added to the database.', user.displayUsername);

                    res.status(201);
                    res.send(user.id);
                }, function(err) {
                    console.log('User %s NOT added to the database.', newUser.displayUsername);
                    console.log(err.toString());

                    res.status(400);
                    res.send({
                        message: err.toString()
                    });
                });
        }, function (err) {
            console.log(err.toString());

            res.status(400);
            res.send({
                message: "Database error. Try again"
            });
        });
    });

    app.route('/users/:username')
        .delete(auth.ensureAuthenticated, function(req, res) {
            var username = req.params.username;

            // Only allow people to delete themselves 
            if (username === req.user.username) {
                User.getAll(username, {
                    index: 'username'
                }).run().then(function(user) {
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

    app.listen(config.port);
} else {
    // master process runs this
    for (var i = 0; i < numCPUtoFork; i++) {
        cluster.fork();
    }
    console.log('App listening on port %d', config.port);

    // Cluster helpers
    cluster.on('exit', function(worker, code, signal) {
        // when a worker dies
        console.log('worker %d died (%s). restarting...', worker.process.pid, signal || code);
        cluster.fork();
    });
    cluster.on('online', function(worker) {
        // when a worker is succcessfully spawned
        console.log("Yay, the worker responded after it was forked");
    });
}
