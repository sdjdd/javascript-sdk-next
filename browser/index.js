const LC = require('../core/browser');

LC.use(require('../auth'));
LC.use(require('../search'));
LC.use(require('../cloud'));
LC.use(require('../storage'));
LC.use(require('../live-query'));

module.exports = LC;
