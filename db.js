var thinky = require('thinky')({
        db: 'lockdown',
        min: 10
    }),
    r = thinky.r,
    validator = require('validator'),
    config = require('./config');

def = {
    User: thinky.createModel('Users', {
        id: String,
        username: {
            _type: String,
            validator: function(username) {
                return validator.isLength(username, 3, 64) && validator.isAlphanumeric(username) && validator.isLowercase(username);
            }
        },
        displayUsername: {
            _type: String,
            validator: function(username) {
                return validator.isLength(username, 3, 64) && validator.isAlphanumeric(username);
            }
        },
        passHash: {
            _type: String,
            validator: function(hash) {
                return validator.isLength(hash, 128);
            }
        },
        passSalt: {
            _type: String,
            validator: function(salt) {
                salt = salt.replace(/=/g, '');

                return validator.isLength(salt, Math.ceil(config.crypt.saltLength * 4 / 3));
            }
        },
        passIter: Number,
        passHashSize: Number,
        passHashVersion: {
            _type: Number,
            default: 1
        },
        timestamp: {
            _type: Date,
            default: r.now(),
            options: {
                enforce_extra: false
            }
        },
        sites: {
            _type: Object,
            default: {},
            schema: {
                username: String,
                password: String,
                domain: String,
                url: String,
                program: String,
                type: String
            }
        },
        email: {
            _type: String,
            validator: function(email) {
                return validator.isEmail(email);
            }
        },
        userValidation: {
            _type: Object,
            schema: {
                confirmed: {
                    _type: Boolean,
                    default: false
                },
                token: {
                    _type: String,
                    validator: function(tkn) {
                        return tkn.length === 4;
                    },
                    default: (Math.floor(Math.random() * 9000) + 1000).toString()
                },
                link: {
                    _type: String,
                    validator: function(link) {
                        return validator.isAlphanumeric(link) && link.length === 64;
                    },
                    default: 'xxxxxxxx'.replace(/x/g, function(c) {
                        return (Math.random() * 1e16).toString(36).slice(0, 8);
                    })
                }
            },
            options: {
                enforce_type: 'loose'
            }
        },
        settings: {
            _type: Object, // more to come later
            schema: {
                passwordReminder: String
            },
            enforce_missing: false
        }
    }, {
        enforce_type: 'strict', // Do not allow null to be a valid value
        enforce_extra: true // do not allow extra data
    }),

    Stats: thinky.createModel('Stats', {
        id: String,
        stat: String,
        timestamp: {
            _type: Date,
            default: r.now()
        }
    }),

    Config: thinky.createModel('Config', {
        id: String,
        timestamp: {
            _type: Date,
            default: r.now(),
            options: {
                enforce_extra: false
            }
        }
    }),

    r: r
};
def.User.ensureIndex('username');
module.exports = def;
