var assert = require('assert');

var normaliseUrl = require('../lib/url-utils').normaliseUrl;


describe('normaliseUrl()', function() {
    var baseUrl = "http://example.com/hello/";
    it('should normalise relative urls', function() {
        assert.equal(normaliseUrl("world", baseUrl), "http://example.com/hello/world");
    });

    it('should normalise fixed from root urls', function() {
        assert.equal(normaliseUrl("/world", baseUrl), "http://example.com/world");
    });

    it('should normalise dot-relative urls', function() {
        assert.equal(normaliseUrl("", baseUrl), "http://example.com/hello/");
        assert.equal(normaliseUrl(".", baseUrl), "http://example.com/hello/");
        assert.equal(normaliseUrl("./world", baseUrl), "http://example.com/hello/world");
        assert.equal(normaliseUrl("../world", baseUrl), "http://example.com/world");
        assert.equal(normaliseUrl("../../world", baseUrl), "http://example.com/world");
    });

    it('should return fully-qualified urls unchanged', function() {
        assert.equal(normaliseUrl("http://example.org/world", baseUrl), "http://example.org/world");
    });
});
