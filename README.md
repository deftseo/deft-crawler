node-crawler
============

An event-based crawler implementation for building specialised Web crawlers. Also containsa single-page Scraper for one-off page processing.

Both use [cheerio](https://github.com/cheeriojs/cheerio) which offers a jQuery-like interface to navigating and extracting information from the retrieved document.


Crawler
-------


### Example: Finding external links:

```javascript
var Crawler = require('../Crawler');
var crawler = Crawler.Crawler();
var args = process.argv.slice(2);
var startUrl = (args.length)? args[0] : 'http://example.com/';

crawler
    .quiet()
    .startUrl(startUrl)
    .follow(function(nextUrl, fromUrl) {
        // If the nextUrl is linked to from the start domain, we are interested.
        return crawler.isStartDomain(fromUrl);
    })
    .on('link.external', function(link) {
        console.log("External link: ", link.href);
    })
    .on('link.error', function(link) {
        console.log("[-" + link.statusCode + "-] " + link.href);
    });
```


