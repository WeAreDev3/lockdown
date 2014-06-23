var thinky = require('thinky')({
    db: 'password_manager'
});


var User = thinky.createModel('Users', {
    firstName: String,
    lastName: String,
    username: String,
    passHash: String,
    passSalt: String
}, {
    enforce_type: 'strict' // Do not allow null to be a valid value
});

User.ensureIndex('username');

module.exports.User = User;
