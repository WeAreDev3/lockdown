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
            validator: function (name) {
                return validator.isLength(name, 3, 128)
                && validator.isAlphanumeric(name)
                && validator.isLowercase(name);
            }
        },
        passHash: {
            _type: String,
            validator: function (hash) {
                return hash.length === 128;
            }
        },
        passSalt: String,
        passIter: Number,
        passHashSize: Number,
        timestamp: {
            _type: Date,
            default: r.now(),
            options: {
                enforce_extra: false
            }
        },
        displayUsername: {
            _type: String,
            validator: function (username) {
                return validator.isLength(username, 3, 64)
                && validator.isAlphanumeric(username);
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
        clientCrypt: {
            _type: Object,
            schema: {
                keyLength: Number,
                iter: Number,
                salt: {
                    _type: String,
                    validator: function (salt) {
                        return salt.length === 44;
                    }
                }
            },
            options: {
                enforce_type: 'strict'
            }
        },
        email: {
            _type: String,
            validator: function (email) {
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
                        return validator.isAlphanumeric(link)
                        && link.length === 64;
                    },
                    default: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
                        .replace(/[xy]/g, function(c) {
                        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                        return v.toString(16);
                    });
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
        stat: {
            _type: String,
            options: {
                enforce_missing: true
            }
        },
        timestamp: {
            _type: Date,
            default: r.now(),
            options: {
                enforce_extra: false
            }
        }
    }, {
        enforce_extra: true,
        enforce_type: 'strict'
    }),

    Config: thinky.createModel('Config', {
        id: String,
        timestamp: {
            _type: Date,
            default: r.now(),
            options: {
                enforce_extra: false
            }
        },
        sessonSecret: {
            _type: String,
            validator: function(secret) {
                return validator.isLength(secret, 64, 128)
                && validator.isAlphanumeric(secret);
            }
        }
    }),

    r: r
}
def.User.ensureIndex('username');
module.exports = def;