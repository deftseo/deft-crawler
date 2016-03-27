var Crawler = require('../Crawler')
    url = require('url'),
    crawler = Crawler.Crawler(),
    args = process.argv.slice(2),
    startUrl = (args.length)? args[0] : 'http://www.economist.com/topics/a',
    baseUrl = 'http://www.economist.com/topics/',
    topicBase = '/topics/';

crawler
    .startUrl(startUrl)
    .addDomainConfig('www.economist.com', {
        canonicalise: function(url) {
            return url;
        }
    })
    .follow(function(nextUrl, fromUrl) {
        // Follow any URL under /topics*
        return nextUrl.startsWith(baseUrl);
    })
    .on('page', function(link, $page) {
        console.log("[PAGE-]", link.href);
        $page('div.ec-glossary-columns li a[href]').each(function() {
            var $link = $page(this),
                linkUrl = url.parse(
                    crawler.normaliseUrl($link.attr('href'), startUrl)
                ),
                topicSlug = linkUrl.pathname.slice(topicBase.length),
                topicTitle = $link.text().trim();

            console.log('[TOPIC]', topicSlug, topicTitle);
        });
    })
    .on('link.internal', function(link) {
        console.log("[INTER] " + link.href)
    })
    // .on('link.external', function(link) {
    //     console.log("[EXTER] " + link.href);
    // })
    .on('link.error', function(link) {
        console.log("[-" + link.statusCode + "-]", link.href);
    });

