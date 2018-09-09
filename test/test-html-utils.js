var assert = require('assert');
var HtmlUtils = require('../lib/html-utils.js');


describe('parseSrcSetToList()', function() {
    var srcset = "/sites/default/files/imagecache/200-width/images/print-edition/20180901_LDD001_0.jpg 200w, /sites/default/files/imagecache/300-width/images/print-edition/20180901_LDD001_0.jpg 300w, /sites/default/files/imagecache/400-width/images/print-edition/20180901_LDD001_0.jpg 400w, /sites/default/files/imagecache/640-width/images/print-edition/20180901_LDD001_0.jpg 640w, /sites/default/files/imagecache/800-width/images/print-edition/20180901_LDD001_0.jpg 800w, /sites/default/files/imagecache/1000-width/images/print-edition/20180901_LDD001_0.jpg 1000w, /sites/default/files/imagecache/1200-width/images/print-edition/20180901_LDD001_0.jpg 1200w, /sites/default/files/imagecache/1280-width/images/print-edition/20180901_LDD001_0.jpg 1280w, /sites/default/files/imagecache/1600-width/images/print-edition/20180901_LDD001_0.jpg 1600w";

    it('should return a list from an @srcset value', function() {
        var images = HtmlUtils.parseSrcsetToList(srcset);

        assert.ok(Array.isArray(images), "Returns a list");
        assert.equal(images.length, 9, "Returns 9 images");
        images.forEach(function(image) {
            assert.ok(image.hasOwnProperty('width'), "image has a @width");
            assert.ok(Number.isInteger(image.width), "image @width is an intager");
            assert.ok(image.hasOwnProperty('src'), "image has a @src");
        });
    });

    it('should normalise @src when base url supplied', function() {
        var images = HtmlUtils.parseSrcsetToList(srcset, "https://example.com/hello");
        var image = images[3];

        assert.ok(image.src.match(/example\.com/));
    });
});
