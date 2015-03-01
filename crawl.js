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
    self.filters = {
        'follow': []
    };

    self.queue    = [];
    self.urlCache = [];

    process.nextTick(function() {
        self.start();
    });
}

Crawler.prototype.__proto__ = events.EventEmitter.prototype;


/**********************************************************************
*
* Configuration
*
**********************************************************************/

Crawler.prototype.startUrl = function(startUrl) {
    this.startUrl = url.parse(startUrl);
    this._addUrl(startUrl);
    return this;
}


Crawler.prototype.follow = function(followFn) {
    this.filters.follow.push(followFn);
    return this;
}


/**********************************************************************
*
* Crawler public interface
*
**********************************************************************/

Crawler.prototype.start = function() {
    var self = this;
    console.log("[START] Starting crawler");

    process.nextTick(function() {
        self._crawl();
    });
}


/**********************************************************************
*
* Crawler implementation
*
**********************************************************************/

Crawler.prototype._addUrl = function(url, fromUrl) {
    var hash = crypto.createHash('sha1').update(url).digest('hex');

    if (this.urlCache.indexOf(hash) === -1) {
        this.queue.push({
            'url': url, 'fromUrl': fromUrl
        });
        this.urlCache.push(hash);
    }

    return this;
}


Crawler.prototype._canFollowLink = function(nextLink, currentLink) {
    var nextUrl;

    if (this.filters.follow.length) {
        canFollow = this._filterFollowLinks(nextLink, currentLink);
    } else {
        nextUrl = url.parse(nextLink)
        canFollow = (nextUrl.host === this.startUrl.host);
    }

    return canFollow;
}


Crawler.prototype._filterFollowLinks = function(nextLink, currentLink) {
    var canFollow = false,
        filter, i, j;

    for(i = 0, j = this.filters.follow.length; i < j; i++) {
        filter = this.filters.follow[i];
        if (filter instanceof Function) {
            canFollow = filter(nextLink, currentLink);
            if (canFollow) {
                break;
            }
        }
    }

    return canFollow;
}


Crawler.prototype._isExternalLink = function(nextUrl, fromUrl) {
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
            console.log("[FINIS] Empty. Complete");
            process.nextTick(function() {
                self.emit('end');
            })
        }
    });
}


Crawler.prototype._getUrl = function(pageUrl, fromUrl, callback) {
    var self = this;

    request(pageUrl, function(error, response, html) {
        var $, $links,
            link, isExternal;

        if (error) {
            console.log(error);

        } else if (response.statusCode === 200) {
            isExternal = self._isExternalLink(pageUrl, fromUrl);
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

                if (self._canFollowLink(link, pageUrl)) {
                    self._addUrl(link, pageUrl);
                }
            });
        } else {
            // TODO: how to handle redirects?
            // TODO: Break down different types of errors. 500? 409? 401?
            self.emit('linkError', {
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