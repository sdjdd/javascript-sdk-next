const LC = require('./core');
const adapters = require('@leancloud/platform-adapters-node');
const debug = require('./debug');

LC.setAdapters(adapters);
LC.use(require('./auth'));
LC.use(debug);
debug.debug.enable('LC*');

const app = LC.init({
  appId: 'oY2aqSxhKvtL2URCcKNehatA-gzGzoHsz',
  appKey: 'yr6xMoCYahu75yy1uRug7Vmv',
  serverURL: 'https://lc-api.sdjdd.com',
  masterKey: 'YhXo7F8eGd1Dji6NePLBSlRi',
});

app.useMasterKey = true;

const db = app.database();
const auth = app.auth();

auth
  .queryRole()
  .where({ name: 'admin' })
  .first()
  .then((role) => {
    role.getRoles().then(console.log);
  });
