const LC = require('.');
const adapters = require('@leancloud/platform-adapters-node');

LC.setAdapters(adapters);

const app = LC.init({
  appId: 'oY2aqSxhKvtL2URCcKNehatA-gzGzoHsz',
  appKey: 'yr6xMoCYahu75yy1uRug7Vmv',
  serverURL: 'https://lc-api.sdjdd.com',
});

const db = app.database();
const auth = app.auth();

const Test = db.class('Test');

auth.login('sdjdd', '1234567').then((user) => {
  Test.object('5fcf9fb3ffce32297fa40cca').get().then(console.log);
});
