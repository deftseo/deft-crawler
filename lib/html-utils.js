

function parseSrcsetToList(srcset) {
    var items = srcset.split(',').map(function(str){
        var imgset =  str.trim().split(/\s+/);
        return {
            width: parseInt(imgset[1], 10),
            src: imgset[0]
        };
    });
    return items;
};



module.exports = {
    parseSrcsetToList: parseSrcsetToList
};
