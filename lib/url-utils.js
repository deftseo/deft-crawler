var url = require('url');


function urlAsObj(urlRef) {
    return (typeof urlRef === "string") ? url.parse(urlRef) : urlRef;
};


function isSameDomain(url1, url2) {
    url1 = urlAsObj(url1);
    url2 = urlAsObj(url2);
    return url1.host == url2.host;
};


module.exports = {
    isSameDomain: isSameDomain
};
