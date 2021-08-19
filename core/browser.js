const adapters = require('@leancloud/platform-adapters-browser');

const LC = require('./dist/index.js');

LC.setAdapters(adapters);

module.exports = LC;
