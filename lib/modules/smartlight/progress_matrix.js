'use strict';

var _ = require('lodash');

var ProgressMatrix = function(opt) {
    this.opt = _.extend({
        size: 8,
        colors: [
            {r: 15, g: 0, b: 0},
            {r: 0, g: 15, b: 0},
            {r: 0, g: 0, b: 15},
            {r: 15, g: 15, b: 0},
            {r: 15, g: 0, b: 15},
            {r: 0, g: 15, b: 15},
            {r: 15, g: 7, b: 0},
            {r: 15, g: 15, b: 15}
        ],
        bgColor: {r: 0, g: 0, b: 0},
        emptyForZero: false,
        randomColor: true
    }, opt);

    this.colorIndexes = {};
};

ProgressMatrix.prototype.getMatrix = function(values) {
    if (! values.length) {
        return _.fill(
            new Array(this.opt.size * this.opt.size),
            this.opt.bgColor
        );
    }

    var size = Math.min(this.opt.size, values.length),
        widths = this._getWidths(size),
        matrices = [],
        colorIndex = 0,
        valueHash = {};

    if (this.opt.randomColor) {
        colorIndex = Math.floor(Math.random() * this.opt.colors.length);
    }

    for (var i=0; i<size; i++) {
        var value = values[i];
        if (isNaN(value)) {
            valueHash[value.id] = 1;
            if (value.id in this.colorIndexes) {
                colorIndex = this.colorIndexes[value.id];
            }
            this.colorIndexes[value.id] = colorIndex;
            value = value.value;
        }
        matrices.push(
            this._buildSubMatrix(
                value,
                widths[i],
                this.opt.colors[colorIndex]
            )
        );
        colorIndex = (colorIndex+1) % this.opt.colors.length;
    }

    for (var id in this.colorIndexes) {
        if (! (id in valueHash)) {
            delete this.colorIndexes[id];
        }
    }

    return this._buildMatrix(matrices);
};

ProgressMatrix.prototype._buildSubMatrix = function(value, width, fgColor) {
    value = Math.min(value, 1);
    value = Math.max(value, 0);

    var length = this.opt.size * width,
        fgCount = Math.round(value * length);

    if (! this.opt.emptyForZero) {
        fgCount = Math.max(fgCount, 1);
    }

    var bgCount = length - fgCount;

    return _.chunk(
        [].concat(
            _.fill(new Array(bgCount), this.opt.bgColor),
            _.fill(new Array(fgCount), fgColor)
        ),
        width
    );
};

ProgressMatrix.prototype._buildMatrix = function(matrices) {
    var result = [], i, values;

    while (true) {
        for (i=0; i<matrices.length; i++) {
            values = matrices[i].shift();

            if (typeof values === 'undefined') {
                return result;
            }

            result = result.concat(values);
        }
    }
};

ProgressMatrix.prototype._getWidths = function(count) {
    var size = this.opt.size,
        result,
        i;

    result = _.fill(new Array(count), Math.floor(size / count));

    for (i=0; i<size%count; i++) {
        result[i] += 1;
    }

    return result;
};

module.exports = ProgressMatrix;
