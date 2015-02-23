var crawl = require('./crawl'),
    crawler = crawl.Crawler();

crawler
    .startUrl('http://mainlytea.com/')
    .on('externalLink', function(link) {
        console.log("[LINK-] External: " + link.href);
    });

