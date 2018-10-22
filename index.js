var crawler = require('./Crawler');
var scraper = require('./Scraper');
var UrlUtils = require('./lib/url-utils');

module.exports = {
    Crawler: crawler.Crawler,
    Scraper: scraper.Scraper,
    scrape: function(scrapeUrl, scrapeFn) {
        return this.Scraper(scrapeUrl, scrapeFn);
    },
    isSameDomain: UrlUtils.isSameDomain,
    normaliseUrl: UrlUtils.normaliseUrl    
};
