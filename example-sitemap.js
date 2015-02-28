var crawl = require('./crawl'),
    crawler = crawl.Crawler(),
    startUrl = 'http://mainlytea.com/';

var sitemap = [];

crawler
    .startUrl(startUrl)
    .on('internalLink', function(link) {

        if (link.statusCode === 200) {
            console.log("[-MAP-] " + link.href);
            sitemap.push(link.href);
        } else {
            console.log("\t[-" + link.statusCode + "-] " + link.href);
        }
    })
    .on('linkError', function(link) {
        console.log("[-" + link.statusCode + "-] " + link.href);
    })
    .on('end', function() {
        console.log("[-END-] " + sitemap.length + " site pages found.");
    });

