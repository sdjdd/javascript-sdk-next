const LC = require('../../core');
const adapters = require('@leancloud/platform-adapters-node');
const debug = require('../../debug');

LC.setAdapters(adapters);
LC.use(debug);

debug.debug.enable('leancloud:*');

const app = LC.init({
  appId: 'oY2aqSxhKvtL2URCcKNehatA-gzGzoHsz',
  appKey: 'yr6xMoCYahu75yy1uRug7Vmv',
  serverURL: 'https://lc-api.sdjdd.com',
});

module.exports = {
  LC,
  app,
  db: app.database(),
};
