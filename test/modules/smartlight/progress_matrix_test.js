'use strict';

require('chai').should();
var ProgressMatrix = require('app/modules/smartlight/progress_matrix');

describe('ProgressMatrix', function() {

    var progressMatrix,
        c1 = {r: 15, g: 0, b: 0},
        c2 = {r: 0, g: 15, b: 0},
        c3 = {r: 0, g: 0, b: 15},
        bg = {r: 0, g: 0, b: 0};

    beforeEach(function() {
        progressMatrix = new ProgressMatrix({
            size: 3,
            colors: [c1, c2, c3],
            bgColor: bg,
            emptyForZero: true,
            randomColor: false
        });
    });

    it('creates matrix for single value', function() {
        var matrix = progressMatrix.getMatrix([ 0.5 ]);

        matrix.should.eql([
            bg, bg, bg,
            bg, c1, c1,
            c1, c1, c1
        ]);
    });

    it('does not increase matrix size for values > 1', function() {
        var matrix = progressMatrix.getMatrix([ 1.1 ]);

        matrix.should.eql([
            c1, c1, c1,
            c1, c1, c1,
            c1, c1, c1
        ]);
    });

    it('creates empty matrix for zero', function() {
        var matrix = progressMatrix.getMatrix([0]);

        matrix.should.eql([
            bg, bg, bg,
            bg, bg, bg,
            bg, bg, bg
        ]);
    });

    it('creates no empty matrix for zero', function() {
        progressMatrix.opt.emptyForZero = false;
        var matrix = progressMatrix.getMatrix([0]);

        matrix.should.eql([
            bg, bg, bg,
            bg, bg, bg,
            bg, bg, c1
        ]);
    });

    it('can handle negative values', function() {
        var matrix = progressMatrix.getMatrix([ -0.1 ]);

        matrix.should.eql([
            bg, bg, bg,
            bg, bg, bg,
            bg, bg, bg
        ]);
    });

    it('creates matrix for multiple values', function() {
        var matrix = progressMatrix.getMatrix([ 0.5, 1 ]);

        matrix.should.eql([
            bg, bg, c2,
            bg, c1, c2,
            c1, c1, c2
        ]);

        matrix = progressMatrix.getMatrix([ 1, 0.3, 0.5 ]);

        matrix.should.eql([
            c1, bg, bg,
            c1, bg, c3,
            c1, c2, c3
        ]);
    });

    it('creates bgColor matrix for empty values', function() {
        var matrix = progressMatrix.getMatrix([]);

        matrix.should.eql([
            bg, bg, bg,
            bg, bg, bg,
            bg, bg, bg
        ]);
    });

    it('ignores values that exceed matrix size', function() {
        var matrix = progressMatrix.getMatrix([ 1, 1, 1, 0.5 ]);

        matrix.should.eql([
            c1, c2, c3,
            c1, c2, c3,
            c1, c2, c3
        ]);
    });

    it('reuses colors if color count is smaller than matrix size', function() {
        progressMatrix.opt.colors = [ c1, c2 ];
        var matrix = progressMatrix.getMatrix([ 1, 1, 1 ]);

        matrix.should.eql([
            c1, c2, c1,
            c1, c2, c1,
            c1, c2, c1
        ]);
    });

    it('allows values with ids to assign same color', function() {
        var matrix = progressMatrix.getMatrix([
            { id: 'id1', value: 1 },
            { id: 'id2', value: 1 }
        ]);

        matrix.should.eql([
            c1, c1, c2,
            c1, c1, c2,
            c1, c1, c2
        ]);

        matrix = progressMatrix.getMatrix([
            { id: 'id2', value: 1 }
        ]);

        matrix.should.eql([
            c2, c2, c2,
            c2, c2, c2,
            c2, c2, c2
        ]);
    });

    it('resets color when id is omitted', function() {
        progressMatrix.getMatrix([
            { id: 'id1', value: 1 },
            { id: 'id2', value: 1 }
        ]);

        progressMatrix.getMatrix([
            { id: 'id1', value: 1 }
        ]);

        var matrix = progressMatrix.getMatrix([
            { id: 'id2', value: 1 }
        ]);

        matrix.should.eql([
            c1, c1, c1,
            c1, c1, c1,
            c1, c1, c1
        ]);
    });
});
