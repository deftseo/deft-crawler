var Crawler = require('../Crawler'),
    crawler = Crawler.Crawler(),
    args = process.argv.slice(2),
    startUrl = (args.length)? args[0] : 'http://example.com/';

var sitemap = [];

crawler
    .startUrl(startUrl)
    .on('link.internal', function(link) {

        if (link.statusCode === 200) {
            console.log("[-MAP-] " + link.href);
            sitemap.push(link.href);
        } else {
            console.log("\t[-" + link.statusCode + "-] " + link.href);
        }
    })
    .on('link.error', function(link) {
        console.log("[-" + link.statusCode + "-] " + link.href);
    })
    .on('end', function() {
        console.log("[-END-] " + sitemap.length + " site pages found.");

        // TODO: Create a sitemap.xml from this
        console.log(sitemap);
    });

