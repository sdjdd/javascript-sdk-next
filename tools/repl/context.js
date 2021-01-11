const LC = require('../..');
const adapters = require('@leancloud/platform-adapters-node');
const debug = require('../../debug');

LC.setAdapters(adapters);
LC.use(debug);

debug.enable('LC:*');

const app = LC.init(require('../../env').cn_n1);

module.exports = {
  LC,
  app,
  db: app.database(),
  auth: app.auth(),
};
