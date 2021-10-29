import 'should';
import { v4 as uuid } from 'uuid';
import * as should from 'should';
import * as LC from '../..';
import { appConfig } from './utils';

const app = LC.init(appConfig);
const name = uuid();
const memberType = '_User';

describe('leaderboard', () => {
  after(() => {
    app.leaderboard(name).delete();
  });

  it('create', async () => {
    const instance = await app.leaderboard(name).create({ memberType });
    instance.memberType.should.equal(memberType);
    instance.statisticName.should.equal(name);
  });

  it('create witout masterkey', async () => {
    const app = LC.init({ ...appConfig, masterKey: undefined, useMasterKey: false });
    try {
      await app.leaderboard().createLeaderboard({ statisticName: 'xxx', memberType: '_User' });
    } catch (error) {
      should(error.message.includes('masterKey')).equal(true);
    }
  });

  it('update', async () => {
    const updateStrategy = 'sum';
    const instance = await app.leaderboard(name).update({ updateStrategy });
    instance.updateStrategy.should.equal(updateStrategy);
  });

  it('reset', async () => {
    return await app.leaderboard(name).reset();
  });

  it('get info', async () => {
    const score = app.leaderboard('score');
    const info = await score.getInfo();
    info.statisticName.should.equal('score');
    score.memberType.should.is.String();
  });

  it('get archive', async () => {
    const res = (await app.leaderboard(name).getArchives()) as any;
    should.not.exist(res.count);
    const { count, results } = await app.leaderboard(name).getArchives({ count: 1 });
    count.should.is.Number();
    results.should.is.Array();
  });

  it('delete', async () => {
    return app.leaderboard(name).delete();
  });
});
