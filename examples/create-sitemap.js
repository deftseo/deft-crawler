var Crawler = require('../Crawler'),
    fs = require('fs'),
    crawler = Crawler.Crawler(),
    args = process.argv.slice(2),
    startUrl = (args.length)? args[0] : 'http://example.com/';

var sitemap = [];

crawler
    .startUrl(startUrl)
    .on('link.internal', function(link) {

        if (link.statusCode === 200) {
            console.log("[-MAP-] " + link.href);
            sitemap.push(link.href);
        } else {
            console.log("\t[-" + link.statusCode + "-] " + link.href);
        }
    })
    .on('link.error', function(link) {
        console.log("[-" + link.statusCode + "-] " + link.href);
    })
    .on('end', function() {
        console.log("[-END-] " + sitemap.length + " site pages found.");

        // TODO: Create a sitemap.xml from this
        console.log(sitemap);
        createSiteMap(sitemap);
    });


function createSiteMap(siteLinks, filename, frequency) {
    var buffer = [],
        xmlDoc;

    frequency = frequency || 'daily';
    filename = filename || 'sitemap.xml';

    siteLinks.forEach(function(link) {
        buffer.push("<url>\n"
            + "\t<loc>" + link + "</loc>\n"
            + "\t<changefreq>" + frequency + "</changefreq>\n"
            + "</url>\n"
        );
    });

    xmlDoc = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n'
        + buffer.join('')
        + '</urlset>\n';

    console.log('Writing', siteLinks.length, 'sitemap links to:', filename);
    fs.writeFileSync(filename, xmlDoc, 'utf-8');
}
