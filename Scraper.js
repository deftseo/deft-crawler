// var events = require('events');
var url = require('url');
var request = require('request');
var cheerio = require('cheerio');


var REQ_TIMEOUT = 10 * 1000; //Timeout in milliseconds


/**********************************************************************
*
* Scraper -- a one page scraper.
*
**********************************************************************/
function Scraper(pageUrl, callback) {
    var self = this;
    if (!(this instanceof Scraper)) {
        return new Scraper(pageUrl, callback);
    }

    process.nextTick(function() {
        self.scrape(pageUrl, callback);
    });
}

// Scraper.prototype.__proto__ = events.EventEmitter.prototype;


Scraper.prototype.scrape = function(pageUrl, callback) {
    var self = this;

    request(
        {
            uri: pageUrl,
            timeout: REQ_TIMEOUT
        },
        function(error, response, html) {
            var $page;

            if (error) {
                self.error("[ERROR]", pageUrl, error.message);
            
            } else if (response.statusCode === 200) {
                $page = cheerio.load(html);
                if (callback) {
                    callback($page, pageUrl);
                }

            } else {
                // TODO: how to handle redirects?
                // TODO: Break down different types of errors. 500? 409? 401?
                self.error("[-" + response.statusCode + "-] " + pageUrl);
            }

        }
    );
}


Scraper.prototype.log = function() {
    console.log.apply(null, arguments);
}


Scraper.prototype.error = function() {
    var self = this;
    console.error.apply(null, arguments);
}


module.exports = {
    Scraper: function(pageUrl, callback) {
        return new Scraper(pageUrl, callback);
    }
};
