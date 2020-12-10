const { LC } = require('./core');
const dbModule = require('./database');
const authModule = require('./auth');
const adapters = require('@leancloud/platform-adapters-node');

setAdapters(adapters);
use(dbModule);
use(authModule);

const app = new App({
  appId: 'oY2aqSxhKvtL2URCcKNehatA-gzGzoHsz',
  appKey: 'yr6xMoCYahu75yy1uRug7Vmv',
  serverURL: 'https://lc-api.sdjdd.com',
});

const db = app.database();

const cmd = db.queryCommand;
const query = db.class('Test').where(
  cmd.or([
    {
      key: cmd.eq('value1'),
    },
    {
      key: cmd.eq('value2'),
    },
  ])
);

console.dir(query, { depth: null });
