const LC = require('../core');

LC.use(require('../auth').authModule);
LC.use(require('../cloud').cloudModule);
LC.use(require('../live-query').liveQueryModule);
LC.use(require('../search').searchModule);
LC.use(require('../storage').storageModule);

module.exports = LC;
