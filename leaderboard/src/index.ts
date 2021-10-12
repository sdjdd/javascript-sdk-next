import type { Runtime } from '../../core';
import { Leaderboard, LeaderboardManager, LeaderboardInfo } from './leaderboard';

declare module '../../core' {
  interface App {
    leaderboard(): LeaderboardManager;
    leaderboard(name: LeaderboardInfo['statisticName']): Leaderboard;
  }
}
export * from './leaderboard';
export const leaderboardModule = {
  name: 'leaderboard',
  components: { LeaderboardManager: Leaderboard },
  onLoad: (runtime: Runtime) => {
    const App = runtime.modules.core.components?.App;
    App.prototype.leaderboard = function (statisticName?: LeaderboardInfo['statisticName']) {
      return statisticName
        ? new Leaderboard(this, { statisticName })
        : new LeaderboardManager(this);
    };
  },
};
