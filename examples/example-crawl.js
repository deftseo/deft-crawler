var Crawler = require('../Crawler'),
    crawler = Crawler.Crawler(),
    startUrl = 'http://mainlytea.com/';

crawler
    .startUrl(startUrl)
    .on('link.internal', function(link) {
        console.log("[INTER] " + link.href)
    })
    .on('link.external', function(link) {
        console.log("[EXTER] " + link.href);
    })
    .on('link.error', function(link) {
        console.log("[-" + link.statusCode + "-] " + link.href);
    });

