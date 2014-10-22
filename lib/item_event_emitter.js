'use strict';

var events = require('events');
var util = require('util');

var ItemEventEmitter = function(opts) {
    events.EventEmitter.call(this);

    this.opts = util._extend({
        lastingEventAfter: 3600, // 3600s = 1 hour
        getItemId: function(item) {
            return require('crypto')
                .createHash('md5')
                .update(JSON.stringify(item))
                .digest('hex');
        }
    }, opts || {});

    this.items = {};
};

util.inherits(ItemEventEmitter, events.EventEmitter);

ItemEventEmitter.prototype.update = function(itemArray) {
    var itemCount = Object.keys(this.items).length;

    var items = {};

    for (var i=0; i<itemArray.length; i++) {
        var id = this.opts.getItemId(itemArray[i]);
        items[id] = itemArray[i];
    }

    this._handleMissingItems(items);
    this._handleNewItems(items);

    if (itemCount > 0 && Object.keys(this.items).length === 0) {
        this.emit('allGone');
    }

};

ItemEventEmitter.prototype._handleMissingItems = function(items) {
    for (var id in this.items) {
        if (id in items) {
            continue;
        }

        this.emit('gone', this.items[id].item);
        delete this.items[id];
    }
};

ItemEventEmitter.prototype._handleNewItems = function(items) {
    var now = (new Date()).getTime();

    for (var id in items) {
        if (id in this.items) {
            if (now >= this.items[id].timestamp + this.opts.lastingEventAfter * 1000) {
                this.emit('lasting', this.items[id].item);
                this.items[id].timestamp = now;
            }

            continue;
        }

        this.emit('new', items[id]);

        this.items[id] = {
            item: items[id],
            timestamp: now
        };
    }
};

module.exports = ItemEventEmitter;
