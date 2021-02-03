const LC = require('../sdk/index.cjs');
const adapters = require('@leancloud/platform-adapters-node');

LC.setAdapters(adapters);

module.exports = LC;
