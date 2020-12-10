import LC from './core';
import database from './database';
import authModule from './auth';
import * as adapters from '@leancloud/platform-adapters-node';

LC.use(database);
LC.use(authModule);

LC.setAdapters(adapters);

const app = LC.init({
  appId: 'oY2aqSxhKvtL2URCcKNehatA-gzGzoHsz',
  appKey: 'yr6xMoCYahu75yy1uRug7Vmv',
  serverURL: 'https://lc-api.sdjdd.com',
});

const db = app.database();
db.class('Test').object('5f2cf99009f8190008d5ae49').delete();
