// core
var app = require('express')(),
    bodyParser = require('body-parser'),

    // cryptography
    crypto = require('crypto'),
    scrypt = require('scrypt'),

    // helpers
    Promise = require('bluebird'),
    db = require('./db'),
    User = db.User,
    r = db.r,
    config = require('./config'),

    // clustering
    os = require('os'),
    cluster = require('cluster'),
    numCPUtoFork = os.cpus().length,

    // Authentication
    passport = require('passport'),
    auth = require('./auth')(passport, db);

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

    app.use(passport.initialize());

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

            console.log('Signing in', user);

            req.logIn(user, function(err) {
                if (err) {
                    // 500 (Internal Server Error)
                    return res.send(500, err);
                }

                res.send({
                    username: user.displayUsername
                });
            });
        })(req, res, next);
    });

    app.route('/users')
    // Create a new user
    .post(function(req, res) {
        var newUser;

        User.getAll(req.body.username.toLowerCase(), {
            index: 'username'
        }).run().then(function(dupeUser) {
            if (dupeUser.length) {
                console.log('Username "%s" already exits', req.body.username);

                // Username already exits, send 409 (Conflict)
                res.status(409);
                return res.send({
                    message: 'Can not use that username'
                });
            }

            newUser = {
                displayUsername: req.body.username,
                username: req.body.username.toLowerCase(),
                passIter: config.crypt.iterations,
                passHashSize: config.crypt.hashSize,
                email: req.body.email
            };

            return crypto.randomBytes(config.crypt.saltLength);
        }).then(function(randomBytes) {
            var salt = randomBytes.toString('base64');

            newUser.passSalt = salt;

            return crypto.pbkdf2(req.body.clientHash, newUser.passSalt,
                config.crypt.iterations, config.crypt.hashSize);
        }).then(function(pbkdf2Hash) {
            pbkdf2Hash = pbkdf2Hash.toString('base64');

            return scrypt.passwordHash(pbkdf2Hash, config.crypt.scryptParameters);
        }).then(function(finalHash) {
            newUser.passHash = finalHash;
            console.dir(newUser);
            var user = new User(newUser);

            return user.save();
        }).then(function(user) {
            console.log('User %s added to the database.', user.displayUsername);

            res.status(201);
        }, function(err) {
            console.log('User %s NOT added to the database.', req.body.username);
            console.log(err.toString());

            res.status(400);
            res.send({
                message: err.toString()
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
                        console.log('User %s removed from the database.', user.displayUsername);

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
    var restarter = 0,
        spawnedForks = 0;
    for (var i = 0; i < numCPUtoFork; i++) {
        cluster.fork();
    }
    console.log('App listening on port %d', config.port);

    // Cluster helpers
    cluster.on('exit', function(worker, code, signal) {
        // when a worker dies
        console.log('worker %d died (%s).', worker.process.pid, signal || code);
        if (restarter) {
            restarter--;
            console.log('Replacing a dead fork...');
            cluster.fork();
        }
    });
    cluster.on('online', function(worker) {
        // when a worker is successfully spawned
        spawnedForks++;
        if (spawnedForks > numCPUtoFork) {
            console.log("Replacement successful.");
        }
    });
}
