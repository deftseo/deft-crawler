Crawler
=======

An event-based crawler implementation for building specialised Web crawlers.



Example: Finding external links:
--------------------------------

    var Crawler = require('../Crawler'),
        crawler = Crawler.Crawler(),
        args = process.argv.slice(2),
        startUrl = (args.length)? args[0] : 'http://example.com/';

    crawler
        .startUrl(startUrl)
        .follow(function(nextUrl, fromUrl) {
            // If the nextUrl is linked to from the start domain, we are interested.
            return crawler.isStartDomain(fromUrl);
        })
        .on('link.external', function(link) {
            console.log("[EXTER] " + link.href);
        })
        .on('link.error', function(link) {
            console.log("[-" + link.statusCode + "-] " + link.href);
        });

