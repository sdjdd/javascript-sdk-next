const LC = require('../core');

LC.use(require('../auth'));
LC.use(require('../search'));
LC.use(require('../cloud'));

module.exports = LC;
