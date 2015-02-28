var crawl = require('./crawl'),
    crawler = crawl.Crawler(),
    startUrl = 'http://mainlytea.com/';

crawler
    .startUrl(startUrl)
    .on('internalLink', function(link) {
        console.log("[INTER] " + link.href)
    })
    .on('externalLink', function(link) {
        console.log("[EXTER] " + link.href);
    })
    .on('linkNotFound', function(link) {
        console.log("[-" + link.statusCode + "-] " + link.href);
    });

