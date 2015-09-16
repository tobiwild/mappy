'use strict';

var RandomSelector = function(elements, chance) {
    this.elements = elements;
    this.chance = chance;
};

RandomSelector.prototype.select = function(cb) {
    if (Math.random() >= this.chance) {
        return;
    }

    var length = this.elements.length;
    var index = Math.floor(Math.random() * length);

    cb(this.elements[index]);
};

module.exports = RandomSelector;
