const LC = require('../core');

LC.use(require('../auth'));
LC.use(require('../search'));
LC.use(require('../cloud'));
LC.use(require('../storage'));

module.exports = LC;
