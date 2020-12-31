import 'should';
import './init';
import * as LC from '..';
import { getAppConfig } from './utils';

describe('查询(Query)', () => {
  const app = LC.init(getAppConfig());
  const db = app.database();
  const timestamp = Date.now();
  let objects: LC.LCObject[];

  before(async () => {
    objects = await Promise.all([
      db.class('Test').add({ num: timestamp, str: '1' }),
      db.class('Test').add({ num: timestamp, str: '2' }),
      db.class('Test').add({ num: timestamp, str: '3' }),
    ]);
  });

  describe('查询条件', () => {
    it('等于(==)', async () => {
      const objs = await db.query('Test').where('num', '==', timestamp).find();
      objs
        .map((o) => o.id)
        .sort()
        .should.eql(objects.map((o) => o.id).sort());
    });

    it('不等于(!=)', async () => {
      const objs = await db
        .query('Test')
        .where('num', '==', timestamp)
        .where('str', '!=', '1')
        .find();
      objs
        .map((o) => o.id)
        .sort()
        .should.eql(
          objects
            .slice(1)
            .map((o) => o.id)
            .sort()
        );
    });
  });
});
