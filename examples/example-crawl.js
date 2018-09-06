var Crawler = require('../Crawler'),
    crawler = Crawler.Crawler(),
    args = process.argv.slice(2),
    startUrl = (args.length)? args[0] : 'http://example.com/';

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
        console.log("[EXTER] " + link.href);
    })
    .on('link.error', function(link) {
        console.log("[-" + link.statusCode + "-] " + link.href);
    });

