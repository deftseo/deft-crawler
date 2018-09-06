var url = require('url');
var events = require('events');
var crypto = require('crypto');
var request = require('request');
var cheerio = require('cheerio');
var bloom = require('bloomfilter');

var REQ_TIMEOUT = 10 * 1000; //Timeout in milliseconds

/**********************************************************************
*
* SimpleQueue -- a simple wrapper around an array
*
**********************************************************************/
function SimpleQueue() {
    var self = this;
    if (!(this instanceof SimpleQueue)) {
        return new SimpleQueue();
    }
};

SimpleQueue.prototype.__proto__ = Array.prototype;

SimpleQueue.prototype.next = function() {
    return this.shift();
};

SimpleQueue.prototype.add = function(item) {
    this.push(item);
}

SimpleQueue.prototype.empty = function(item) {
    this.splice(0);
}

SimpleQueue.prototype.queueLength = function() {
    return this.length;
}


/**********************************************************************
*
* PaginatedQueue -- a paginated queue so it can be persisted to disk
*
**********************************************************************/
function PaginatedQueue() {
    var self = this;
    if (!(this instanceof PaginatedQueue)) {
        return new PaginatedQueue();
    }

    this.items = [];
    this.headIdx = 0;
    this.tailIdx = 0;
};

PaginatedQueue.prototype.next = function() {
    var item = this.items[this.headIdx];
    this.items[this.headIdx] = null;
    this.headIdx++;
    return item;
};

PaginatedQueue.prototype.add = function(item) {
    this.items[this.tailIdx] = item;
    this.tailIdx++;
}

PaginatedQueue.prototype.queueLength = function() {
    return this.tailIdx - this.headIdx;
}


/**********************************************************************
*
* Crawler -- the main class to Crawl urls from a start point.
*
**********************************************************************/
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

    self.queue    = new SimpleQueue();
    //self.queue    = new PaginatedQueue();
    self.urlCache = new bloom.BloomFilter(14377588, 17);
    self.urlCacheLen = 0;
    self.crawlLen = 0;
    self.errorLen = 0;
    self.isVerbose = true;

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


Crawler.prototype.stop = function() {
    self.log("[STOP] Stopping crawler");
    this.queue.empty();
}


Crawler.prototype.isStartDomain = function(testUrl) {
    var testUrl = url.parse(testUrl);
    return this.startUrl.host == testUrl.host;
}


Crawler.prototype.normaliseUrl = function(pageUrl, fromUrl) {
    var link = url.parse(url.resolve(fromUrl, pageUrl));
    if (link.hash) { link.hash = null; }
    return url.format(link);
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
    nextUrl = url.parse(nextUrl);
    fromUrl = (fromUrl) ? url.parse(fromUrl) : nextUrl;
    return (nextUrl.hostname !== fromUrl.hostname);
}


Crawler.prototype._crawl = function() {
    var self = this,
        nextUrl = self.queue.next();

    self._getUrl(nextUrl.url, nextUrl.fromUrl, function() {
        if (self.queue.queueLength()) {
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
            link = self.normaliseUrl(href, pageUrl);

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
                self.log("[ERROR]", pageUrl, error);
            
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
    Crawler: function() {
        return new Crawler();
    }
}
