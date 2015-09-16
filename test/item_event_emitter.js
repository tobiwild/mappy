'use strict';

var sinon = require('sinon');

var ItemEventEmitter = require('app/item_event_emitter');

describe('ItemEventEmitter', function() {

    var eventEmitter, clock;

    beforeEach(function() {
        clock = sinon.useFakeTimers();
        eventEmitter = new ItemEventEmitter({
            lastingEventAfter: 100,
            getItemId: function(item) {
                return item.id;
            }
        });
    });

    afterEach(function() {
        clock.restore();
    });

    it('should notify about newly added items', function() {
        var items = [{
            id: 'item1'
        }];

        var callback = sinon.spy();
        eventEmitter.on('new', callback);

        eventEmitter.update(items);
        eventEmitter.update(items);

        sinon.assert.calledOnce(callback);
        sinon.assert.calledWith(callback, items[0]);
    });

    it('should notify about items which are gone', function() {
        var items = [{
            id: 'item1'
        }];

        var callback = sinon.spy();
        eventEmitter.on('gone', callback);

        eventEmitter.update(items);
        sinon.assert.notCalled(callback);

        eventEmitter.update([]);
        sinon.assert.calledOnce(callback);
        sinon.assert.calledWith(callback, items[0]);
    });

    it('should notify about lasting items', function() {
        var items = [{
            id: 'item1'
        }];

        var callback = sinon.spy();
        eventEmitter.on('lasting', callback);

        eventEmitter.update(items);
        sinon.assert.notCalled(callback);

        clock.tick(100 * 1000 - 1);
        eventEmitter.update(items);
        sinon.assert.notCalled(callback);

        clock.tick(1);
        eventEmitter.update(items);
        sinon.assert.calledOnce(callback);
        sinon.assert.calledWith(callback, items[0]);
    });
    
    it('should notify when item list gets empty', function() {
        var callback = sinon.spy();
        eventEmitter.on('allGone', callback);

        eventEmitter.update([]);
        sinon.assert.notCalled(callback);

        eventEmitter.update([
            { id: 'item1' },
            { id: 'item2' }
        ]);
        sinon.assert.notCalled(callback);

        eventEmitter.update([
            { id: 'item2' }
        ]);
        sinon.assert.notCalled(callback);

        eventEmitter.update([]);
        sinon.assert.calledOnce(callback);
    });

    it('should identify items by checksum when no id function is specified', function() {
        var eventEmitter = new ItemEventEmitter();

        var callback = sinon.spy();
        eventEmitter.on('gone', callback);
        
        var items = [
            { id: 'item1' },
            { id: 'item2' }
        ];

        eventEmitter.update(items);

        eventEmitter.update([
            { id: 'item2' }
        ]);

        sinon.assert.calledWith(callback, items[0]);
    });

    it('emits change event when something changes after update call', function() {
        var callback = sinon.spy();
        eventEmitter.on('change', callback);

        eventEmitter.update([]);
        sinon.assert.notCalled(callback);

        eventEmitter.update([
            { id: 'item1' },
            { id: 'item2' }
        ]);
        sinon.assert.calledOnce(callback);

        eventEmitter.update([]);
        sinon.assert.calledTwice(callback);

        eventEmitter.update([]);
        sinon.assert.calledTwice(callback);
    });
});
