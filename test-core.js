const LC = require('./core');
const adapters = require('@leancloud/platform-adapters-node');
const debug = require('./debug');
const search = require('./search');
const storage = require('./storage');
const liveQuery = require('./live-query');

LC.setAdapters(adapters);
LC.use(require('./auth'));
LC.use(debug);
LC.use(search);
LC.use(storage);
LC.use(liveQuery);
debug.enable('LC*');

const app = LC.init({
  appId: 'oY2aqSxhKvtL2URCcKNehatA-gzGzoHsz',
  appKey: 'yr6xMoCYahu75yy1uRug7Vmv',
  serverURL: 'https://lc-api.sdjdd.com',
  masterKey: 'YhXo7F8eGd1Dji6NePLBSlRi',
});

app.useMasterKey = true;

const db = app.database();

db.query('Person').where('a', 'or', 1, 2, 3);
