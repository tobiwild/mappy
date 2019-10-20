/* eslint "import/no-dynamic-require": 0 */
/* eslint "global-require": 0 */
const util = require('util');

const config = require('./lib/config/global.json');

config.modules.forEach(module => {
  console.log('load module %s', module);
  require(util.format('./lib/modules/%s/controller', module)).run();
});
