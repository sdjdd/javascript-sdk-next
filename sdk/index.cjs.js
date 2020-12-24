const LC = require('../core');

LC.use(require('../auth'));
LC.use(require('../search'));

module.exports = LC;
