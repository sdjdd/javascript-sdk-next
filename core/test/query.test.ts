import * as should from 'should';
import { v4 as uuid_v4 } from 'uuid';
import './init';
import * as LC from '..';
import { getAppConfig } from './utils';

describe('Query', () => {
  const app = LC.init(getAppConfig());
  const db = app.database();

  describe('query condition', () => {
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

    it('startsWith', async () => {
      const uuid = uuid_v4();
      const [, obj] = await Promise.all([
        db.class('Test').add({ uuid, str: 'HelloWorld!' }),
        db.class('Test').add({ uuid, str: '_prefix_HelloWorld!' }),
      ]);
      const objs = await db
        .class('Test')
        .where('uuid', '==', uuid)
        .where('str', 'starts-with', '_prefix_')
        .find();
      objs.length.should.eql(1);
      objs[0].id.should.eql(obj.id);
    });

    it('endsWith', async () => {
      const uuid = uuid_v4();
      const [, obj] = await Promise.all([
        db.class('Test').add({ uuid, str: 'HelloWorld!' }),
        db.class('Test').add({ uuid, str: 'HelloWorld!_suffix_' }),
      ]);
      const objs = await db
        .class('Test')
        .where('uuid', '==', uuid)
        .where('str', 'ends-with', '_suffix_')
        .find();
      objs.length.should.eql(1);
      objs[0].id.should.eql(obj.id);
    });

    describe('in', () => {
      it('Array contain any element', async () => {
        const uuid = uuid_v4();
        const [obj1, obj2] = await Promise.all([
          db.class('Test').add({ uuid, arr: [1, 2, 3] }),
          db.class('Test').add({ uuid, arr: [4, 5, 6] }),
          db.class('Test').add({ uuid, arr: [7, 8, 9] }),
        ]);
        const objs = await db
          .class('Test')
          .where('uuid', '==', uuid)
          .where('arr', 'in', [3, 5])
          .find();
        objs.length.should.eql(2);
        objs
          .map((o) => o.id)
          .sort()
          .should.eql([obj1.id, obj2.id].sort());
      });
    });

    it('limit & skip & first', async () => {
      const uuid = uuid_v4();
      const p = db.pipeline();
      p.add('Test', { uuid }).add('Test', { uuid });
      const { results } = await p.commit();
      const ids = results.map((obj) => obj.id);

      let objs = await db.class('Test').where({ uuid }).limit(1).find();
      objs.length.should.eql(1);
      ids.includes(objs[0].id);

      objs = await db.class('Test').where({ uuid }).skip(1).find();
      objs.length.should.eql(1);
      ids.includes(objs[0].id);

      const obj = await db.class('Test').where({ uuid }).first();
      should.exists(obj);
      ids.includes(obj.id);
    });

    it('orderBy', async () => {
      const uuid = uuid_v4();
      const p = db.pipeline();
      p.add('Test', { uuid, num: 1 }).add('Test', { uuid, num: 2 });
      await p.commit();
      const [asc, desc] = await Promise.all([
        db.class('Test').where({ uuid }).orderBy('num', 'asc').find(),
        db.class('Test').where({ uuid }).orderBy('num', 'desc').find(),
      ]);
      asc.length.should.eql(2);
      desc.length.should.eql(2);
      asc[0].data.num.should.lessThan(asc[1].data.num);
      desc[0].data.num.should.greaterThan(desc[1].data.num);
    });
  });

  describe('#findWithCount', () => {
    it('should return both count and results', async () => {
      const uuid = uuid_v4();
      const object = await db.class('Test').add({ uuid });
      const { count, results } = await db.query('Test').where({ uuid }).findWithCount();
      count.should.eql(1);
      results.length.should.eql(1);
      results[0].id.should.eql(object.id);
    });
  });
});
