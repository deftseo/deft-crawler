var Scraper = require('../Scraper');
var scrapeUrl = "http://example.com/";

Scraper.Scraper(scrapeUrl, function($page, pageUrl) {
    var title = $page('head title').text().trim();
    console.log("In callback for:", pageUrl);
    console.log("Title:", title);

    $page('a[href]').each(function() {
        var $link = $page(this);
        var linkUrl = $link.attr('href');
        var linkText = $link.text().trim();

        console.log(linkUrl, "-", linkText);
    });    
});

