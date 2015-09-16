'use strict';

var util = require('util');

var config = require('app/config/global.json');

config.modules.forEach(function(module) {
    console.log('load module %s', module);
    require(util.format('./lib/modules/%s/controller', module))
        .run();
});
