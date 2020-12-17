import * as LC from '.';
import * as adapters from '@leancloud/platform-adapters-node';
import * as debug from './debug';

LC.setAdapters(adapters);
LC.use(debug);
debug.debug.enable('*');

const app = LC.init({
  appId: 'oY2aqSxhKvtL2URCcKNehatA-gzGzoHsz',
  appKey: 'yr6xMoCYahu75yy1uRug7Vmv',
  serverURL: 'https://lc-api.sdjdd.com',
  masterKey: 'YhXo7F8eGd1Dji6NePLBSlRi',
});

app.useMasterKey = true;

const db = app.database();

const auth = app.auth();
