var url = require('url'),
    events = require('events'),
    crypto = require('crypto'),
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
    this.startUrl = url.parse(startUrl);
    this.addUrl(startUrl);
    return this;
}

Crawler.prototype.addUrl = function(url, fromUrl) {
    var hash = crypto.createHash('sha1').update(url).digest('hex');

    if (this.urlCache.indexOf(hash) === -1) {
        this.queue.push({
            'url': url, 'fromUrl': fromUrl
        });
        this.urlCache.push(hash);
    }

    return this;
}

Crawler.prototype.start = function() {
    var self = this;
    console.log("[INIT-] Starting crawler");

    process.nextTick(function() {
        self._crawl();
    });
}

Crawler.prototype._crawl = function() {
    var self = this,
        nextUrl = self.queue.shift();

    self._getUrl(nextUrl, function() {
        if (self.queue.length) {
            process.nextTick(function() {
                self._crawl();
            })
        } else {
            console.log("[QUEUE] Empty. Complete");
        }
    });
}

Crawler.prototype._getUrl = function(pageUrl, callback) {
    var self = this;

    request(pageUrl, function(error, response, html) {
        var $, $links;

        if (!error) {
            $ = cheerio.load(html);
            $links = $('a[href]');

            console.log("[CRAWL] " + pageUrl + " (" + $links.length + " links)");

            $links.each(function(index) {
                var $link = $(this),
                    href = $link.attr('href'),
                    link,
                    is_external = (
                           href.indexOf('http') === 0
                        || href.indexOf('//') === 0
                    );

                link = {
                    'base': pageUrl,
                    'href': is_external ? href : url.resolve(pageUrl, href),
                    'text': $link.text()
                };

                if (!is_external) {
                    self.addUrl(link.href);
                }

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