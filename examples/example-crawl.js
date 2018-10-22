var crawler = require('../').Crawler();
var args = process.argv.slice(2);
var startUrl = (args.length)? args[0] : 'http://example.com/';

crawler
    .quiet()
    .startUrl(startUrl)
    .follow(function(nextUrl, fromUrl) {
        // If the nextUrl is linked to from the start domain, we are interested.
        return crawler.isStartDomain(fromUrl);
    })
    .on('link.internal', function(link) {
        // console.log("[INTER] " + link.href)
    })
    .on('link.external', function(link) {
        console.log("External link:", link.href);
    })
    .on('link.error', function(link) {
        console.error("[-" + link.statusCode + "-] " + link.href);
    });

