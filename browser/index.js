const LC = require('../core/browser.js');
const { authModule } = require('../auth');
const { cloudModule } = require('../cloud');
const { liveQueryModule } = require('../live-query');
const { searchModule } = require('../search');
const { storageModule } = require('../storage');
const { leaderboardModule } = require('../leaderboard');

LC.use(authModule);
LC.use(cloudModule);
LC.use(liveQueryModule);
LC.use(searchModule);
LC.use(storageModule);
LC.use(leaderboardModule);

module.exports = LC;
