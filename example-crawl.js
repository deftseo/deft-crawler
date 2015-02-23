var crawl = require('./crawl'),
    crawler = crawl.Crawler();



crawler
    .startUrl('http://mainlytea.com/')
    .on('externalLink', function(link) {
        console.log("External Link: " + link.href);
    })
    .on('internalLink', function(link) {
        console.log("Internal Link: " + link.href);
    });

console.log("Crawler configured");
