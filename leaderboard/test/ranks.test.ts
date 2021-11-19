import 'should';
import { v4 as uuid } from 'uuid';
import * as should from 'should';
import * as LC from '../..';
import { appConfig } from './utils';

const statisticName = 'score';
const objectId = '5b38544f2f301e00359f16d9';

const app = LC.init(appConfig);
const score = app.leaderboard(statisticName);

describe('ranks', () => {
  it('get ranks', async () => {
    const limit = 1;
    const { results, count } = await score.getResults(
      {
        count: 1,
        limit,
      },
      { useMasterKey: false }
    );

    count.should.is.Number();
    results.length.should.equalOneOf(0, limit);
  });

  it('get non-existent ranks', async () => {
    const name = uuid();
    try {
      await app.leaderboard(name).getResults();
      throw new Error(`leaderboard: ${name} doesn't exist`);
    } catch (error) {
      should(error).is.not.null();
    }
  });

  it('get user rank', async () => {
    const limit = 3;
    const { results } = await app.leaderboard('score').getResults({
      skip: 1,
      limit,
      selectKeys: ['username'],
    });
    if (results.length > 0) {
      results.length.should.equalOneOf(3, 0);
      results[0].rank.should.equal(1);
    }
  });

  it('get around', async () => {
    const { results } = await app.leaderboard('score').getResults({
      limit: 1,
      around: objectId,
    });
    if (results.length) {
      results.length.should.equal(1);
      results[0].user.objectId.should.equal(objectId);
    }
  });
});
