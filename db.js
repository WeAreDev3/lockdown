var thinky = require('thinky')({
        db: 'lockdown',
        min: 10
    }),
    r = thinky.r,
    validator = require('validator');

def = {
    User: thinky.createModel('Users', {
        id: String,
        firstName: {
            _type: String,
            validator: function (name) {
                return validator.isLength(username, 3, 64);
            }
        },
        lastName: {
            _type: String,
            validator: function (name) {
                return validator.isLength(username, 3, 64);
            }
        },
        username: {
            _type: String,
            validator: function (name) {
                return validator.isLength(username, 3, 128);
            }
        },
        passHash: String,
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
                return validator.isLength(username, 3, 64);
            }
        },
        sites: {
            _type: Array,
            default: [],
        },
        clientCrypt: {
            hashSize: Number,
            iter: Number,
            salt: String
        },
        clientCrypt: {
            _type: Object,
            schema: {
                hashSize: Number,
                iter: Number,
                salt: String
            },
            options: {
                enforce_type: 'strict',
                enforce_missing: false
            }
        },
        email: {
            _type: String,
            validator: function (email) {
                return validator.isEmail(email);
            }
        }
    }, {
        enforce_type: 'strict', // Do not allow null to be a valid value
        enforce_extra: true // do not allow extra data
    }),

    Stats: thinky.createModel('Stats', {
        id: String
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
        sessonSecret: String
    }),

    r: thinky.r
}
def.User.ensureIndex('username');
module.exports = def;