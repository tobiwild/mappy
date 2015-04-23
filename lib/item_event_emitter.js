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
    var items = {};

    for (var i=0; i<itemArray.length; i++) {
        var id = this.opts.getItemId(itemArray[i]);
        items[id] = itemArray[i];
    }

    this.resultSet = {
        'new': [],
        'gone': [],
        'lasting': []
    };

    this._handleMissingItems(items);
    this._handleNewItems(items);
    this._emitEvents();
};

ItemEventEmitter.prototype._emitEvents = function() {
    var itemArray = Object.keys(this.items).map(function(key) {
        return this.items[key].item;
    }.bind(this));

    if (
        this.resultSet.new.length ||
        this.resultSet.gone.length ||
        this.resultSet.lasting.length
    ) {
        this.emit('change', this.resultSet, itemArray);
    }

    for (var evName in this.resultSet) {
        for (var i=0; i<this.resultSet[evName].length; i++) {
            this.emit(evName, this.resultSet[evName][i]);
        }
    }

    if (this.resultSet.gone.length && itemArray.length === 0) {
        this.emit('allGone');
    }
};

ItemEventEmitter.prototype._handleMissingItems = function(items) {
    for (var id in this.items) {
        if (id in items) {
            continue;
        }

        this.resultSet.gone.push(this.items[id].item);
        delete this.items[id];
    }
};

ItemEventEmitter.prototype._handleNewItems = function(items) {
    var now = (new Date()).getTime();

    for (var id in items) {
        if (id in this.items) {
            if (now >= this.items[id].timestamp + this.opts.lastingEventAfter * 1000) {
                this.resultSet.lasting.push(this.items[id].item);
                this.items[id].timestamp = now;
            }

            continue;
        }

        this.resultSet.new.push(items[id]);

        this.items[id] = {
            item: items[id],
            timestamp: now
        };
    }
};

module.exports = ItemEventEmitter;
