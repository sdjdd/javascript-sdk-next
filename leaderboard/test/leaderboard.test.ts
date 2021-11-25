import 'should';
import * as should from 'should';
import * as LC from '../..';
import { appConfig } from './utils';

const app = LC.init(appConfig);
const name = `test_${Date.now()}`;
console.log(name);
const memberType = '_User';

describe('leaderboard', () => {
  after(() => {
    app.leaderboard(name).destroy();
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

  it('get attributes', async () => {
    const instance = app.leaderboard(name);
    const info = await instance.getAttributes();
    info.statisticName.should.equal(name);
    instance.statisticName.should.equal(name);
    instance.memberType.should.is.String();
  });

  it('get archive', async () => {
    const { count, results } = await app.leaderboard(name).getArchives({ count: 1 });
    count.should.equal(0);
    results.should.is.Array();
  });

  it('update', async () => {
    const updateStrategy = 'sum';
    const versionChangeInterval = 'day';
    const data = await app
      .leaderboard()
      .updateLeaderBoard(name, { updateStrategy, versionChangeInterval });
    data.updateStrategy.should.equal(updateStrategy);
    data.versionChangeInterval.should.equal(versionChangeInterval);
    const instance = await app.leaderboard(name).update({ updateStrategy });
    instance.updateStrategy.should.equal(updateStrategy);
  });

  it('reset', async () => {
    await app.leaderboard(name).reset();
    const { count } = await app.leaderboard(name).getArchives({ count: 1 });
    count.should.equal(1);
  });

  it('delete', async () => {
    return app.leaderboard(name).destroy();
  });
});
