const LC = require('../..');
const adapters = require('@leancloud/platform-adapters-node');
const debug = require('../../debug');
const env = require('../../env');

LC.setAdapters(adapters);
LC.use(debug);

debug.enable('LC:*');

const app = LC.init(env.cn_n1);

module.exports = {
  env,
  LC,
  app,
  db: app.database(),
  auth: app.auth(),
};
