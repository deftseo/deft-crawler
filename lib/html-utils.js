

function parseSrcsetToList(srcset, baseSrc) {
    var items = srcset.split(',').map(function(str){
        var imgset =  str.trim().split(/\s+/);
        var imgWidth = parseInt(imgset[1], 10);
        var imgSrc = imgset[0];

        return {
            width: imgWidth,
            src: imgSrc
        };
    });
    return items;
};



module.exports = {
    parseSrcsetToList: parseSrcsetToList
};
