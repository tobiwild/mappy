const events = require('events');
const debug = require('debug')('item_event_emitter');
const crypto = require('crypto');

class ItemEventEmitter extends events.EventEmitter {
  constructor(opts = {}) {
    super();

    this.opts = {
      lastingEventAfter: 3600, // 3600s = 1 hour
      getItemId(item) {
        return crypto
          .createHash('md5')
          .update(JSON.stringify(item))
          .digest('hex');
      },
      filter() {
        return true;
      },
      newItemFilter() {
        return true;
      },
      ...opts
    };

    this.neverUpdated = true;
    this.items = {};
  }

  update(itemArray) {
    const items = {};

    for (let i = 0; i < itemArray.length; i += 1) {
      if (this.opts.filter(itemArray[i])) {
        const id = this.opts.getItemId(itemArray[i]);
        items[id] = itemArray[i];
      }
    }

    this.resultSet = {
      new: [],
      gone: [],
      lasting: []
    };

    this.handleMissingItems(items);
    this.handleNewItems(items);
    this.emitEvents();
    this.neverUpdated = false;
  }

  emitEvents() {
    const itemArray = Object.keys(this.items).map(key => this.items[key].item);

    if (
      itemArray.length > 0 &&
      itemArray.length === this.resultSet.new.length &&
      this.resultSet.gone.length === 0
    ) {
      this.emit('first');
    }

    if (this.resultSet.new.length || this.resultSet.gone.length || this.resultSet.lasting.length) {
      this.emit('change', this.resultSet, itemArray);
    }

    this.emitItemEvents();

    if (this.neverUpdated && itemArray.length === 0) {
      this.emit('empty');
    } else if (this.resultSet.gone.length && itemArray.length === 0) {
      this.emit('empty');
      this.emit('allGone');
    }
  }

  emitItemEvents() {
    Object.keys(this.resultSet).forEach(evName => {
      this.resultSet[evName].forEach(item => {
        this.emitItem(evName, item);
      });
    });
  }

  emitItem(evName, item) {
    debug(`emit event "${evName}" for item "${this.opts.getItemId(item)}"`);
    this.emit(evName, item);
  }

  handleMissingItems(items) {
    Object.keys(this.items).forEach(id => {
      if (id in items) {
        return;
      }

      this.resultSet.gone.push(this.items[id].item);
      delete this.items[id];
    });
  }

  handleNewItems(items) {
    const now = new Date().getTime();

    Object.keys(items).forEach(id => {
      if (id in this.items) {
        if (now >= this.items[id].timestamp + this.opts.lastingEventAfter * 1000) {
          this.resultSet.lasting.push(this.items[id].item);
          this.items[id].timestamp = now;
        }

        return;
      }

      if (!this.opts.newItemFilter(items[id])) {
        return;
      }

      this.resultSet.new.push(items[id]);

      this.items[id] = {
        item: items[id],
        timestamp: now
      };
    });
  }
}

module.exports = ItemEventEmitter;
