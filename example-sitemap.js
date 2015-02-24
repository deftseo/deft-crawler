var crawl = require('./crawl'),
    crawler = crawl.Crawler();

crawler
    .startUrl('http://lotsofyoga.com/')
    .on('internalLink', function(link) {
        console.log(" * Internal: " + link.href);
    });

