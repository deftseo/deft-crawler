var assert = require('assert');
var isSameDomain = require('../lib/url-utils').isSameDomain;

describe('isSameDomain()', function() {
    it('should compare two urls', function() {
        var link1 = "http://example.com/";

        assert.ok(isSameDomain(link1, link1));
    });
});
