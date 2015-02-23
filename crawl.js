var url = require('url'),
    events = require('events'),
    request = require('request'),
    cheerio = require('cheerio');


function Crawler() {
    var self = this;
    if (!(this instanceof Crawler)) {
        return new Crawler();
    }

    events.EventEmitter.call(self);
    self.config = {};

    self.queue    = [];
    self.urlCache = [];

    process.nextTick(function() {
        self.start();
    });
}

Crawler.prototype.__proto__ = events.EventEmitter.prototype;

Crawler.prototype.startUrl = function(startUrl) {
    this.startUrl = startUrl;
    this.queue.push(startUrl);
    return this;
}

Crawler.prototype.addUrl = function(url) {
    if (this.urlCache.indexOf(url) === -1) {
        this.queue.push(url);
        this.urlCache.push(url);
    }

    return this;
}

Crawler.prototype.start = function() {
    var self = this;
    console.log("Starting crawler");
    console.log("Queue length: " + this.queue.length)

    // // Testing event emitters are working as expected
    // this.emit('externalLink', {href: 'http://www.google.com/'});
    // this.emit('internalLink', {href: 'http://www.mainlytea.com/'});

    process.nextTick(function() {
        self._crawl();
    });
}

Crawler.prototype._crawl = function() {
    var self = this,
        nextUrl = self.queue.shift();

    self._getUrl(nextUrl, function() {
        console.log("Fetched: " + nextUrl);

        // Next URL
        if (self.queue.length) {
            process.nextTick(function() {
                self._crawl();
            })
        } else {
            console.log("Queue empty. Complete");
        }
    });
}

Crawler.prototype._getUrl = function(pageUrl, callback) {
    var self = this;

    request(pageUrl, function(error, response, html) {
        var $, links = [];

        if (!error) {
            $ = cheerio.load(html);
            $('a[href]').each(function(index) {
                var $link = $(this),
                    link,
                    href = $link.attr('href');

                is_external = (href.indexOf('http') === 0 || href.indexOf('//') === 0);
                link = {
                    'base': pageUrl,
                    'href': is_external ? href : url.resolve(pageUrl, href),
                    'text': $link.text()
                };

                process.nextTick(function() {
                    linkType = is_external ? 'externalLink' : 'internalLink';
                    self.emit(linkType, link);
                });
            });
        }

        process.nextTick(function() {
            callback();
        });
    });
}



module.exports = {
    Crawler: function() {
        return new Crawler();
    }
}