import 'should';
import { v4 as uuid } from 'uuid';
import * as should from 'should';
import * as LC from '../..';
import { appConfig } from './utils';

const statisticName = 'score';

const app = LC.init(appConfig);
const score = app.leaderboard(statisticName);

describe('ranks', () => {
  it('get ranks', async () => {
    const maxResultsCount = 1;
    const { results, count } = await score.getResults(
      {
        count: 1,
        maxResultsCount,
      },
      { useMasterKey: false }
    );

    count.should.is.Number();
    results.length.should.equalOneOf(0, maxResultsCount);
  });

  it('get nonexistent ranks', async () => {
    const name = uuid();
    try {
      await app.leaderboard(name).getResults();
      throw new Error(`leaderboard: ${name} doesn't exist`);
    } catch (error) {
      should(error).is.not.null();
    }
  });

  it('get user rank', async () => {
    const { results } = await app.leaderboard('score').getResults({
      maxResultsCount: 1,
      objectId: '5b3853909f54540035868fe2',
    });
    results.length.should.equalOneOf(1, 0);
    if (results.length > 0) {
      results[0].rank.should.is.Number();
    }
  });
});
