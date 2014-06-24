var thinky = require('thinky')({
        db: 'lockdown'
    }),
    r = thinky.r;


var User = thinky.createModel('Users', {
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
});

User.ensureIndex('username');

module.exports.User = User;
module.exports.r = thinky.r;