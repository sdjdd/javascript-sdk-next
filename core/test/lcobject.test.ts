import 'should';
import { omit } from 'lodash';
import './init';
import * as LC from '..';
import { getAppConfig } from './utils';

describe('对象(LCObject)', () => {
  const app = LC.init(getAppConfig());
  const db = app.database();
  const data = {
    str: 'hello world',
    num: Date.now(),
    obj: {
      slogan: '为开发加速',
    },
    arr: [1.1, 2, '3'],
  };

  it('保存对象到云端', async () => {
    const obj = await db.class('Test').add(data, { fetchData: true });
    obj.data.should.containEql(data);
  });

  describe('从云端获取对象', () => {
    let objectId: string;
    before(async () => {
      objectId = (await db.class('Test').add(data)).id;
    });

    it('通过对象引用获取', async () => {
      const obj = await db.class('Test').object(objectId).get();
      obj.data.should.containEql(data);
    });

    it('获取时指定 keys', async () => {
      const obj = await db
        .class('Test')
        .object(objectId)
        .get({ keys: ['str'] });
      omit(obj.data, ['objectId', 'createdAt', 'updatedAt']).should.eql({ str: data.str });
    });
  });

  it('更新对象', async () => {
    const objectId = (await db.class('Test').add(data)).id;
    const str = 'HELLO WORLD';
    const obj = await db.class('Test').object(objectId).update({ str }, { fetchUpdatedData: true });
    obj.data.str.should.eql(str);
  });

  it('删除对象', async () => {
    const objectId = (await db.class('Test').add(data)).id;
    await db.class('Test').object(objectId).delete();
    return db
      .class('Test')
      .object(objectId)
      .get()
      .should.rejectedWith(`不存在 objectId 为 ${objectId} 的对象`);
  });

  describe('批量操作', () => {
    it('批量创建', async () => {
      const { results, errors } = await db.pipeline().add('Test', data).commit();
      errors.should.empty();
      results.length.should.eql(1);
      results.forEach((result) => result.should.instanceof(LC.LCObject));
    });

    it('批量获取', async () => {
      let result = await db.pipeline().add('Test', data).commit();
      result.errors.should.empty();
      result.results.length.should.eql(1);
      result = await db.pipeline().get('Test', result.results[0].id).commit();
      result.errors.should.empty();
      result.results.length.should.eql(1);
      result.results[0].data.should.containEql(data);
    });

    it('批量删除', async () => {
      let result = await db.pipeline().add('Test', data).commit();
      result.errors.should.empty();
      result.results.length.should.eql(1);
      const objectId = result.results[0].id;

      result = await db.pipeline().delete('Test', result.results[0].id).commit();
      result.errors.should.empty();
      result.results.length.should.eql(1);

      return db
        .class('Test')
        .object(objectId)
        .get()
        .should.rejectedWith(`不存在 objectId 为 ${objectId} 的对象`);
    });
  });

  describe('Pointer', () => {
    it('保存 Pointer', async () => {
      const obj1 = await db.class('Test').add(data);
      const obj2 = await db
        .class('Test')
        .add({ ptr: obj1, str: '测试 Pointer' }, { fetchData: true });
      const { ptr } = obj2.data;
      ptr.should.instanceof(LC.LCObject);
      ptr.className.should.eql('Test');
      ptr.id.should.eql(obj1.id);
    });
  });
});
