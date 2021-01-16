import 'should';
import { v4 as uuid_v4 } from 'uuid';
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

    it('小于(<)', async () => {
      const uuid = uuid_v4();
      const [obj] = await Promise.all([
        db.class('Test').add({ uuid, num: 100 }),
        db.class('Test').add({ uuid, num: 101 }),
      ]);
      const objs = await db.query('Test').where('uuid', '==', uuid).where('num', '<', 101).find();
      objs.length.should.eql(1);
      objs[0].id.should.eql(obj.id);
    });

    it('小于等于(<=)', async () => {
      const uuid = uuid_v4();
      const [o99, o100] = await Promise.all([
        db.class('Test').add({ uuid, num: 99 }),
        db.class('Test').add({ uuid, num: 100 }),
        db.class('Test').add({ uuid, num: 101 }),
      ]);
      const objs = await db.query('Test').where('uuid', '==', uuid).where('num', '<=', 100).find();
      objs.length.should.eql(2);
      objs
        .map((o) => o.id)
        .sort()
        .should.eql([o99.id, o100.id].sort());
    });
  });
});
