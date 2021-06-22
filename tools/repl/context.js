const LC = require('../..');
const { debugModule } = require('../../debug');
const env = require('../../env');

LC.use(debugModule);

debugModule.enable('LC:*');

const app = LC.init(env.cn_n1);

module.exports = {
  env,
  LC,
  app,
  db: app.database(),
  auth: app.auth(),
  cloud: app.cloud(),
  storage: app.storage(),
};
