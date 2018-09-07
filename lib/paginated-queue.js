

/**********************************************************************
*
* PaginatedQueue -- a paginated queue so it can be persisted to disk
*
**********************************************************************/
function PaginatedQueue() {
    var self = this;
    if (!(this instanceof PaginatedQueue)) {
        return new PaginatedQueue();
    }

    this.items = [];
    this.headIdx = 0;
    this.tailIdx = 0;
};

PaginatedQueue.prototype.next = function() {
    var item = this.items[this.headIdx];
    this.items[this.headIdx] = null;
    this.headIdx++;
    return item;
};

PaginatedQueue.prototype.add = function(item) {
    this.items[this.tailIdx] = item;
    this.tailIdx++;
}

PaginatedQueue.prototype.queueLength = function() {
    return this.tailIdx - this.headIdx;
}


module.exports = {
    Queue: function() {
        return new PaginatedQueue();
    }
};
