import 'should';
import { v4 as uuid_v4 } from 'uuid';
import './init';
import * as LC from '..';
import { getAppConfig } from './utils';

describe('查询(Query)', () => {
  const app = LC.init(getAppConfig());
  const db = app.database();

  describe('查询条件', () => {
    it('等于(==)', async () => {
      const uuid = uuid_v4();
      const obj = await db.class('Test').add({ uuid });
      const objs = await db.class('Test').where('uuid', '==', uuid).find();
      objs.length.should.eql(1);
      objs[0].id.should.eql(obj.id);
    });

    it('不等于(!=)', async () => {
      const uuid = uuid_v4();
      const [obj] = await Promise.all([
        db.class('Test').add({ uuid, str: 'LeanCloud' }),
        db.class('Test').add({ uuid, str: 'LeanCl0ud' }),
      ]);
      const objs = await db
        .class('Test')
        .where('uuid', '==', uuid)
        .where('str', '!=', 'LeanCl0ud')
        .find();
      objs.length.should.eql(1);
      objs[0].id.should.eql(obj.id);
    });

    it('小于(<)', async () => {
      const uuid = uuid_v4();
      const [obj] = await Promise.all([
        db.class('Test').add({ uuid, num: 100 }),
        db.class('Test').add({ uuid, num: 101 }),
      ]);
      const objs = await db.class('Test').where('uuid', '==', uuid).where('num', '<', 101).find();
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
      const objs = await db.class('Test').where('uuid', '==', uuid).where('num', '<=', 100).find();
      objs.length.should.eql(2);
      objs
        .map((o) => o.id)
        .sort()
        .should.eql([o99.id, o100.id].sort());
    });

    it('大于(>)', async () => {
      const uuid = uuid_v4();
      const [, obj] = await Promise.all([
        db.class('Test').add({ uuid, num: 100 }),
        db.class('Test').add({ uuid, num: 101 }),
      ]);
      const objs = await db.class('Test').where('uuid', '==', uuid).where('num', '>', 100).find();
      objs.length.should.eql(1);
      objs[0].id.should.eql(obj.id);
    });

    it('大于等于(>=)', async () => {
      const uuid = uuid_v4();
      const [, o100, o101] = await Promise.all([
        db.class('Test').add({ uuid, num: 99 }),
        db.class('Test').add({ uuid, num: 100 }),
        db.class('Test').add({ uuid, num: 101 }),
      ]);
      const objs = await db.class('Test').where('uuid', '==', uuid).where('num', '>=', 100).find();
      objs.length.should.eql(2);
      objs
        .map((o) => o.id)
        .sort()
        .should.eql([o100.id, o101.id].sort());
    });
  });
});
