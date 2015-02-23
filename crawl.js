var events = require('events');


function Crawler() {
    var self = this;
    if (!(this instanceof Crawler)) {
        return new Crawler();
    }

    events.EventEmitter.call(self);

    process.nextTick(function() {
        self.start();
    });
}

Crawler.prototype.__proto__ = events.EventEmitter.prototype;

Crawler.prototype.startUrl = function(startUrl) {
    this.startUrl = startUrl;
    return this;
}

Crawler.prototype.start = function() {
    console.log("Starting crawler");

    // Testing event emitters are working as expected
    this.emit('externalLink', {href: 'http://www.google.com/'});
    this.emit('internalLink', {href: 'http://www.mainlytea.com/'});
}


module.exports = {
    Crawler: function() {
        return new Crawler();
    }
}