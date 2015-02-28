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

Crawler.prototype.canFollowLink = function(nextLink, currentLink) {
    // TODO: Put a filter in here
    var nextUrl = url.parse(nextLink);
    return nextUrl.host === this.startUrl.host;
}

Crawler.prototype.isExternalLink = function(nextUrl, fromUrl) {
    nextUrl = url.parse(nextUrl);
    fromUrl = (fromUrl) ? url.parse(fromUrl) : nextUrl;
    return (nextUrl.hostname !== fromUrl.hostname);
}

Crawler.prototype._crawl = function() {
    var self = this,
        nextUrl = self.queue.shift();

    self._getUrl(nextUrl.url, nextUrl.fromUrl, function() {
        if (self.queue.length) {
            process.nextTick(function() {
                self._crawl();
            })
        } else {
            console.log("[QUEUE] Empty. Complete");
        }
    });
}

Crawler.prototype._getUrl = function(pageUrl, fromUrl, callback) {
    var self = this;

    request(pageUrl, function(error, response, html) {
        var $, $links,
            link,
            isExternal = self.isExternalLink(pageUrl, fromUrl);

        if (error) {
            console.log(error);
        } else if (response.statusCode === 200) {
            link = {
                'href': pageUrl,
                'statusCode': response.statusCode
            }

            // Fire internal/external events for this page
            process.nextTick(function() {
                linkType = isExternal ? 'externalLink' : 'internalLink';
                self.emit(linkType, link);
            });


            // Find more links to crawl
            $ = cheerio.load(html);
            $links = $('a[href]');

            console.log("[CRAWL] " + response.statusCode + ": " + pageUrl + " (" + $links.length + " links)");

            $links.each(function(index) {
                var $link = $(this),
                    href = $link.attr('href'),
                    link = url.resolve(pageUrl, href);

                //console.log("\t[FOUND] " + link);

                if (self.canFollowLink(link, pageUrl)) {
                    self.addUrl(link, pageUrl);
                }
            });
        } else {
            self.emit('linkNotFound', {
                'href': pageUrl,
                'statusCode': response.statusCode
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