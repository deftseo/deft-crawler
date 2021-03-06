var Crawler = require('../');

var args = process.argv.slice(2);
var scrapeUrl = (args.length) ? args[0] : "http://example.com/";

Crawler.scrape(scrapeUrl, function($page, pageUrl) {
    var title = $page('head title').text().trim();
    console.log("In callback for:", pageUrl);
    console.log("Title:", title);

    $page('a[href]').each(function() {
        var $link = $page(this);
        var linkUrl = $link.attr('href');
        var linkText = $link.text().trim();

        console.log("[LINK]", linkUrl, "-", linkText);
    });    
});

