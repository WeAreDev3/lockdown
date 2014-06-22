var thinky = require('thinky')({
    db: 'password_manager'
});


var User = thinky.createModel('User', {
    id: String,
    firstName: String,
    lastName: String,
    username: String,
    passHash: String
}, {
    enforce_type: 'strict' // Do not allow null to be a valid value
});

User.ensureIndex('username');

module.exports.User = User;
