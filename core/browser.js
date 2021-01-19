const LC = require('./dist/index.cjs');
LC.setAdapters(require('@leancloud/platform-adapters-browser'));
module.exports = LC;
