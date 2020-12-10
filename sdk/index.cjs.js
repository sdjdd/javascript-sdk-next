const LC = require('../core');

LC.use(require('../auth'));
LC.use(require('../database'));

module.exports = LC;
