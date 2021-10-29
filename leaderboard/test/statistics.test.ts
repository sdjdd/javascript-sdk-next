import 'should';
import 'should';
import * as LC from '../..';
import { appConfig } from './utils';

const statisticName = 'score';
const statisticValue = 1000;

const userId = '5b38544f2f301e00359f16d9';

const app = LC.init(appConfig);
const score = app.leaderboard(statisticName);

describe('statistics', () => {
  it('delete', async () => {
    const { count } = await score.getResults({ count: 1 });
    await score.deleteStatistics({
      type: 'user',
      objectId: userId,
      statisticNames: [statisticName],
    });
    const { count: newCount } = await score.getResults({ count: 1 });
    newCount.should.equal(count - 1);
  });

  it('update ', async () => {
    const { results } = await app.leaderboard().updateStatistics({
      type: 'user',
      objectId: userId,
      statistics: [{ statisticName, statisticValue }],
    });
    results[0].statisticValue === statisticValue;
  });

  it('get', async () => {
    const {
      results: [data],
    } = await score.getStatistics(
      {
        type: 'user',
        objectId: userId,
        statisticNames: [statisticName],
      },
      { useMasterKey: false }
    );
    if (!data) {
      return;
    }
    data.statisticName.should.equal(statisticName);
    data.statisticValue.should.equal(statisticValue);
  });

  it('get multiple', async () => {
    const { results } = await score.getMultipleStatistics(
      {
        type: 'user',
        statisticName: 'score',
        target: [userId, userId],
      },
      { useMasterKey: false }
    );
    results.length.should.equal(2);
    results[0].statisticName.should.equal('score');
  });
});
