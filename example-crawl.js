var crawl = require('./crawl'),
    crawler = crawl.Crawler();

crawler
    .startUrl('http://mainlytea.com/')
    .on('externalLink', function(link) {
        console.log("External Link: " + link.href);
    });

console.log("Crawler configured");
