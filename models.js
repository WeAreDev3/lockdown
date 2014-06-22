module.exports = function(thinky) {
    var User = thinky.createModel('User', {
        id: String,
        firstName: String,
        lastName: String
    });

    User.ensureIndex('firstName');

    return {
        User: User
    };
};