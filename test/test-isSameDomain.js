var assert = require('assert');
var isSameDomain = require('../lib/url-utils').isSameDomain;

describe('isSameDomain()', function() {
    var links = [
        "http://example.com/",
        "http://example.com/",
        "http://example.com/hello",
        "https://example.com/hello",
        "http://microsoft.org/",
        ""
    ];

    it('should compare two urls', function() {
        assert.ok(isSameDomain(links[0], links[0], "same url matches"));
    });
});
