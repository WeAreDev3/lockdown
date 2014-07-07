var scrypt = require('scrypt'),
    cluster = require('cluster'),
    colors = require('colors');

def = {
    crypt: {
        iterations: 5000,
        saltLength: 64,
        hashSize: 512,
        scryptParameters: scrypt.params(0.1)
    },
    port: process.env.PORT || 3000,
    logging: function() {
        console._log = console.log;
        if (cluster.isMaster) {
            return function() {
                var logs = Array.prototype.slice.call(arguments),
                    logTag = '[M] ',
                    logMessage = [logTag['green'] + logs[0]].concat(logs.slice(1));
                console._log.apply(console, logMessage);
            };
        } else {
            return function() {
                var logs = Array.prototype.slice.call(arguments),
                    logTag = '[W (' + cluster.worker.id + ')] ',
                    logMessage = [logTag['cyan'] + logs[0]].concat(logs.slice(1));
                console._log.apply(console, logMessage);
            };
        }
    }
};

console.log = def.logging();
module.exports = def;
