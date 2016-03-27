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
    self.domainConfig = {};

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


Crawler.prototype.addDomainConfig = function(domain, config) {
    this.domainConfig[domain] = config;
    return this;
}


/**********************************************************************
*
* Crawler public interface
*
**********************************************************************/

Crawler.prototype.start = function() {
    var self = this;
    console.log("[START] Starting crawler at " + url.format(self.startUrl));

    process.nextTick(function() {
        self._crawl();
    });
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
            console.log("[EMPTY] Crawl queue empty. Complete");
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

    //console.log("[CRAWL] " + pageUrl);

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

    request(pageUrl, function(error, response, html) {
        var $page;

        if (error) {
            console.log(error);

        } else if (response.statusCode === 200) {
            self._logCrawlResponse(pageUrl, fromUrl, response.statusCode);

            // Process html page
            $page = cheerio.load(html);
            self._followPageLinks($page, pageUrl);


        } else {
            // TODO: how to handle redirects?
            // TODO: Break down different types of errors. 500? 409? 401?
            self.emit('link.error', {
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