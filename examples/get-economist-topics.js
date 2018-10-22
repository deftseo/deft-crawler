var Crawler = require('../');
var crawler = Crawler.Crawler();
var url = require('url');

var args = process.argv.slice(2);

var startUrl = (args.length)? args[0] : 'http://www.economist.com/topics/a';
var baseUrl = 'http://www.economist.com/topics/';
var topicBase = '/topics/';

crawler
    .startUrl(startUrl)
    .follow(function(nextUrl, fromUrl) {
        // Follow any URL under /topics*
        return nextUrl.startsWith(baseUrl);
    })
    .on('page', function(link, $page) {
        console.log("[PAGE-]", link.href);
        $page('div.ec-glossary-columns li a[href]').each(function() {
            var $link = $page(this),
                linkUrl = url.parse(
                    Crawler.normaliseUrl($link.attr('href'), startUrl)
                ),
                topicSlug = linkUrl.pathname.slice(topicBase.length),
                topicTitle = $link.text().trim();

            console.log('[TOPIC]', topicSlug, topicTitle);
        });
    })
    .on('link.internal', function(link) {
        console.log("[INTER] " + link.href)
    })
    .on('link.error', function(link) {
        console.log("[-" + link.statusCode + "-]", link.href);
    });

