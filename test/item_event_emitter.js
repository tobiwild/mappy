const sinon = require('sinon');

const ItemEventEmitter = require('../lib/item_event_emitter');

describe('ItemEventEmitter', () => {
  let eventEmitter;
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    eventEmitter = new ItemEventEmitter({
      lastingEventAfter: 100,
      getItemId({ id }) {
        return id;
      }
    });
  });

  afterEach(() => {
    clock.restore();
  });

  it('should notify about newly added items', () => {
    const items = [
      {
        id: 'item1'
      }
    ];

    const callback = sinon.spy();
    eventEmitter.on('new', callback);

    eventEmitter.update(items);
    eventEmitter.update(items);

    sinon.assert.calledOnce(callback);
    sinon.assert.calledWith(callback, items[0]);
  });

  it('should notify about first item', () => {
    const callback = sinon.spy();
    eventEmitter.on('first', callback);

    eventEmitter.update([{ id: 'item1' }]);
    sinon.assert.calledOnce(callback);

    eventEmitter.update([{ id: 'item2' }]);
    sinon.assert.calledOnce(callback);
  });

  it('should notify about items which are gone', () => {
    const items = [
      {
        id: 'item1'
      }
    ];

    const callback = sinon.spy();
    eventEmitter.on('gone', callback);

    eventEmitter.update(items);
    sinon.assert.notCalled(callback);

    eventEmitter.update([]);
    sinon.assert.calledOnce(callback);
    sinon.assert.calledWith(callback, items[0]);
  });

  it('should notify about lasting items', () => {
    const items = [
      {
        id: 'item1'
      }
    ];

    const callback = sinon.spy();
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

  it('should notify when item are gone', () => {
    const callback = sinon.spy();
    eventEmitter.on('allGone', callback);

    eventEmitter.update([]);
    sinon.assert.notCalled(callback);

    eventEmitter.update([{ id: 'item1' }, { id: 'item2' }]);
    sinon.assert.notCalled(callback);

    eventEmitter.update([{ id: 'item2' }]);
    sinon.assert.notCalled(callback);

    eventEmitter.update([]);
    sinon.assert.calledOnce(callback);
  });

  it('should notify when item list is empty', () => {
    const callback = sinon.spy();
    eventEmitter.on('empty', callback);

    eventEmitter.update([]);
    eventEmitter.update([]);
    sinon.assert.calledOnce(callback);

    eventEmitter.update([{ id: 'item1' }, { id: 'item2' }]);
    sinon.assert.calledOnce(callback);

    eventEmitter.update([{ id: 'item2' }]);
    sinon.assert.calledOnce(callback);

    eventEmitter.update([]);
    sinon.assert.calledTwice(callback);
  });

  it('should identify items by checksum when no id function is specified', () => {
    eventEmitter = new ItemEventEmitter();

    const callback = sinon.spy();
    eventEmitter.on('gone', callback);

    const items = [{ id: 'item1' }, { id: 'item2' }];

    eventEmitter.update(items);

    eventEmitter.update([{ id: 'item2' }]);

    sinon.assert.calledWith(callback, items[0]);
  });

  it('emits change event when something changes after update call', () => {
    const callback = sinon.spy();
    eventEmitter.on('change', callback);

    eventEmitter.update([]);
    sinon.assert.notCalled(callback);

    eventEmitter.update([{ id: 'item1' }, { id: 'item2' }]);
    sinon.assert.calledOnce(callback);

    eventEmitter.update([]);
    sinon.assert.calledTwice(callback);

    eventEmitter.update([]);
    sinon.assert.calledTwice(callback);
  });
});
