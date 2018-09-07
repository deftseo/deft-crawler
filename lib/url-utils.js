var url = require('url');


function urlAsObj(urlRef) {
    return (typeof urlRef === "string") ? url.parse(urlRef) : urlRef;
};


function isSameDomain(url1, url2) {
    url1 = urlAsObj(url1);
    url2 = urlAsObj(url2);
    return url1.host == url2.host;
};


function normaliseUrl(newUrl, baseUrl) {
    var link = url.parse(url.resolve(baseUrl, newUrl));
    if (link.hash) { link.hash = null; }
    return url.format(link);
}


module.exports = {
    isSameDomain: isSameDomain,
    normaliseUrl: normaliseUrl
};
