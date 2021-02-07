import 'should';
import { omit } from 'lodash';
import './init';
import * as LC from '..';
import { getAppConfig } from './utils';

describe('LCObject', () => {
  const app = LC.init(getAppConfig());
  const db = app.database();
  const data = {
    str: 'Hello world!',
  };

  it('create', async () => {
    const obj = await db.class('Test').add(data, { fetchData: true });
    obj.data.should.containEql(data);
  });

  describe('get', () => {
    let objectId: string;
    before(async () => {
      objectId = (await db.class('Test').add(data)).id;
    });

    it('get directly', async () => {
      const obj = await db.class('Test').object(objectId).get();
      obj.data.should.containEql(data);
    });

    it('get with keys', async () => {
      const obj = await db
        .class('Test')
        .object(objectId)
        .get({ keys: ['str'] });
      omit(obj.data, ['objectId', 'createdAt', 'updatedAt']).should.eql({ str: data.str });
    });
  });

  it('update', async () => {
    const objectId = (await db.class('Test').add(data)).id;
    const str = 'HELLO WORLD';
    const obj = await db.class('Test').object(objectId).update({ str }, { fetchUpdatedData: true });
    obj.data.str.should.eql(str);
  });

  it('delete', async () => {
    const objectId = (await db.class('Test').add(data)).id;
    await db.class('Test').object(objectId).delete();
    return db
      .class('Test')
      .object(objectId)
      .get()
      .should.rejectedWith(`不存在 objectId 为 ${objectId} 的对象`);
  });

  it('basic data type', async () => {
    const data = {
      str: 'LeanCloud',
      num: 2021,
      bool: true,
      date: new Date(),
      obj: {
        str: 'LeanCloud',
        num: 2021,
      },
      arr: ['LeanCloud', 2021],
    };
    const obj = await db.class('Test').add(data, { fetchData: true });
    obj.data.should.containEql(data);
  });

  describe('pipline', () => {
    it('create', async () => {
      const { results, errors } = await db.pipeline().add('Test', data).commit();
      errors.should.empty();
      results.length.should.eql(1);
      results.forEach((result) => result.should.instanceof(LC.LCObject));
    });

    it('get', async () => {
      let result = await db.pipeline().add('Test', data).commit();
      result.errors.should.empty();
      result.results.length.should.eql(1);
      result = await db.pipeline().get('Test', result.results[0].id).commit();
      result.errors.should.empty();
      result.results.length.should.eql(1);
      result.results[0].data.should.containEql(data);
    });

    it('delete', async () => {
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
    it('save pointer', async () => {
      const obj1 = await db.class('Test').add(data);
      const obj2 = await db.class('Test').add({ ptr: obj1 }, { fetchData: true });
      const { ptr } = obj2.data;
      ptr.should.instanceof(LC.LCObject);
      ptr.className.should.eql('Test');
      ptr.id.should.eql(obj1.id);
    });
  });
});
