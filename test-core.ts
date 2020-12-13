import * as LC from '.';

const app = LC.init({
  appId: 'oY2aqSxhKvtL2URCcKNehatA-gzGzoHsz',
  appKey: 'yr6xMoCYahu75yy1uRug7Vmv',
  serverURL: 'https://lc-api.sdjdd.com',
});

const db = app.database();

db.class('Test').where({
  name: db.queryCommand.or(1, 2, 3),
});

app.auth().signUpOrLoginWithMobilePhone(
  {
    aa: 1,
    mobilePhoneNumber: '11',
  },
  ''
);
