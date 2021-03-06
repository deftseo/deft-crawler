var queue = require('./lib/simple-queue');
// var queue = require('./lib/paginated-queue');
var url = require('url');
var events = require('events');
var crypto = require('crypto');
var request = require('request');
var cheerio = require('cheerio');
var bloom = require('bloomfilter');
var urlUtils = require('./lib/url-utils');

var REQ_TIMEOUT = 10 * 1000; //Timeout in milliseconds


/**********************************************************************
*
* Crawler -- the main class to Crawl urls from a start point.
*
**********************************************************************/
function Crawler(args) {
    var self = this;
    if (!(this instanceof Crawler)) {
        return new Crawler(args);
    }

    args = args || {};

    events.EventEmitter.call(self);
    self.config = {};
    self.filters = {
        'follow': []
    };

    self.queue    = queue.Queue();
    self.urlCache = new bloom.BloomFilter(14377588, 17);
    self.urlCacheLen = 0;
    self.crawlLen = 0;
    self.errorLen = 0;
    self.isVerbose = args.hasOwnProperty('verbose')
        ? args.verbose : true;
    
    self.isActive = true;

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


Crawler.prototype.quiet = function() {
    this.isVerbose = false;
    return this;
}


/**********************************************************************
*
* Crawler public interface
*
**********************************************************************/

Crawler.prototype.start = function() {
    var self = this;
    self.log("[START] Starting crawler at " + url.format(self.startUrl));

    process.nextTick(function() {
        self._crawl();
    });
}


Crawler.prototype.log = function() {
    var self = this;
    if (self.isVerbose) {
        console.log.apply(null, arguments);
    }
}


Crawler.prototype.error = function() {
    var self = this;

    console.error.apply(null, arguments);
}


Crawler.prototype.stop = function() {
    var self = this;
    self.log("[STOP] Stopping crawler");
    self.queue.empty();
    self.isActive = false;
}


Crawler.prototype.isStartDomain = function(testUrl) {
    return urlUtils.isSameDomain(this.startUrl, testUrl);
}


/**********************************************************************
*
* Crawler implementation
*
**********************************************************************/

Crawler.prototype._addUrl = function(url, fromUrl) {
    if (!this.urlCache.test(url)) {
        this.queue.add({
            'url': url, 'fromUrl': fromUrl
        });
        this.urlCache.add(url);
        this.urlCacheLen++;
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
    return fromUrl && !urlUtils.isSameDomain(nextUrl, fromUrl);
}


Crawler.prototype._crawl = function() {
    var self = this,
        nextUrl = self.queue.next();

    self._getUrl(nextUrl.url, nextUrl.fromUrl, function() {
        if (self.isActive && self.queue.queueLength()) {
            process.nextTick(function() {
                self._crawl();
            })
        } else {
            self.log("[EMPTY] Crawl queue empty. Complete");
            process.nextTick(function() {
                self.emit('end');
            })
        }
    });
}


Crawler.prototype._logCrawlResponse = function(pageUrl, fromUrl, statusCode) {
    var self = this,
        isExternal = self._isExternalLink(pageUrl, fromUrl),
        link = {
            'href': pageUrl,
            'statusCode': statusCode
        }

    self.log("[CRAWL] [" + self.crawlLen + "|" + self.queue.queueLength() + "|" + self.urlCacheLen + "] " + pageUrl);

    // Fire internal/external events for this page
    process.nextTick(function() {
        var linkType = isExternal ? 'link.external' : 'link.internal';
        self.emit(linkType, link);
    });
}


Crawler.prototype._followPageLinks = function($page, pageUrl) {
    var self = this;

    $page('a[href]').each(function(index) {
        var $link = $page(this),
            href = $link.attr('href'),
            link = urlUtils.normaliseUrl(href, pageUrl);

        if (self._canFollowLink(link, pageUrl)) {
            self._addUrl(link, pageUrl);
        }
    });
}


Crawler.prototype._getUrl = function(pageUrl, fromUrl, callback) {
    var self = this;

    request(
        {
            uri: pageUrl,
            timeout: REQ_TIMEOUT
        },
        function(error, response, html) {
            var $page;

            if (error) {
                self.errorLen++;
                self.error("[ERROR]", pageUrl, error.message);
            
            } else if (response.statusCode === 200) {
                self.crawlLen++;
                self._logCrawlResponse(pageUrl, fromUrl, response.statusCode);

                // Process html page
                $page = cheerio.load(html);
                self.emit('page', {'href': pageUrl}, $page);
                self._followPageLinks($page, pageUrl);

            } else {
                // TODO: how to handle redirects?
                // TODO: Break down different types of errors. 500? 409? 401?
                self.errorLen++;
                self.emit('link.error', {
                    'href': pageUrl,
                    'statusCode': response.statusCode
                });
            }

            process.nextTick(function() {
                callback();
            });

        }
    );
}



module.exports = {
    Crawler: function(args) {
        return new Crawler(args);
    }
}
