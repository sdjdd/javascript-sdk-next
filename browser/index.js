const LC = require('../core');
const { authModule } = require('../auth');
const { cloudModule } = require('../cloud');
const { liveQueryModule } = require('../live-query');
const { searchModule } = require('../search');
const { storageModule } = require('../storage');

LC.use(authModule);
LC.use(cloudModule);
LC.use(liveQueryModule);
LC.use(searchModule);
LC.use(storageModule);

module.exports = LC;
