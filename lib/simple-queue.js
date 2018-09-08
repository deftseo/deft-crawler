

/**********************************************************************
*
* SimpleQueue -- a simple wrapper around an array
*
**********************************************************************/
function SimpleQueue() {
    var self = this;
    if (!(this instanceof SimpleQueue)) {
        return new SimpleQueue();
    }
};

SimpleQueue.prototype.__proto__ = Array.prototype;

SimpleQueue.prototype.next = function() {
    return this.shift();
};

SimpleQueue.prototype.add = function(item) {
    this.push(item);
}

SimpleQueue.prototype.empty = function(item) {
    this.splice(0);
}

SimpleQueue.prototype.queueLength = function() {
    return this.length;
}


module.exports = {
    Queue: function() {
        return new SimpleQueue();
    }
};
