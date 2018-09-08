var assert = require('assert');

var isSameDomain = require('../lib/url-utils').isSameDomain;
var url = require('url');


describe('isSameDomain()', function() {
    var links = [
        "http://example.com/",
        "http://example.com/",
        "http://example.com/hello",
        "https://example.com/hello",
        "http://example.org/",
        "http://www.example.org/",
        "http://mail.example.org/",
        url.parse('http://example.com/urlobj'),
        url.parse('http://example.org/urlobj'),
        ""
    ];

    it('should equate URLs with same domain', function() {
        assert.ok(isSameDomain(links[0], links[0]), "Same URL matches");
        assert.ok(isSameDomain(links[0], links[1]), "Identical URL matches");
        assert.ok(isSameDomain(links[0], links[2]), "URLs from same domain match");
        assert.ok(isSameDomain(links[0], links[3]), "same domain, different protocol matches");
    });

    it("shouldn't match different domains", function() {
        assert.ok(!isSameDomain(links[0], links[4]), "different domains");
        assert.ok(!isSameDomain(links[7], links[8]), "different domains");
    });

    it("shouldn't match sub-domains", function() {
        assert.ok(!isSameDomain(links[4], links[5]), "compare subdomain with root domain");
        assert.ok(!isSameDomain(links[5], links[6]), "compare two subdomains");
    });

    it("should match same domain parsed URLs", function() {
        assert.ok(isSameDomain(links[7], links[7]), "match same parsed URL");
    });

    it("should match string and parsed urls", function() {
        assert.ok(isSameDomain(links[0], links[7]), "match string and parsed URLs");
        assert.ok(isSameDomain(links[7], links[1]), "match string and parsed URLs");
    });
});
