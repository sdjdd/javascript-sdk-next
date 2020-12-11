const LC = require('./core');
const adapters = require('@leancloud/platform-adapters-node');
const debug = require('./debug');

LC.setAdapters(adapters);

const app = LC.init({
  appId: 'oY2aqSxhKvtL2URCcKNehatA-gzGzoHsz',
  appKey: 'yr6xMoCYahu75yy1uRug7Vmv',
  serverURL: 'https://lc-api.sdjdd.com',
});

const db = app.database();

const Test = db.class('Test');

LC.use(debug);
debug.debug.enable('leancloud:*');

Test.object('5f40e085edbb9745553065d5').get().then(console.log);
