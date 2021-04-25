import 'should';
import './init';
import * as LC from '..';
import { getAppConfig } from './utils';

describe('Class', () => {
  const app = LC.init(getAppConfig());
  const db = app.database();

  it('add', async () => {
    const data = {
      str: 'Hello world!',
      num: 2021,
      arr: ['666', 666],
      obj: {
        key: 'value',
      },
    };
    const obj = await db.class('Test').add(data, { fetchData: true });
    obj.data.should.containEql(data);
  });
});
