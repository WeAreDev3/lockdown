var thinky = require('thinky')({
        db: 'lockdown'
    }),
    r = thinky.r;

def = {
    User: thinky.createModel('Users', {
        id: String,
        firstName: String,
        lastName: String,
        username: String,
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
        displayUsername: String,
        sites: Array,
        clientCrypt: {
            hashSize: Number,
            iter: Number,
            salt: String
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