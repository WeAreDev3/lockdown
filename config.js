var scrypt = require('scrypt');

module.exports = {
    crypt: {
        iterations: 1000,
        saltLength: 32,
        hashSize: 512,
        scryptParameters: scrypt.params(0.1)
    },
    port: process.env.PORT || 3000
}