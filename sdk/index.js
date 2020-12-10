const LC = require('../core');

LC.use(require('../database'));
LC.use(require('../auth'));

module.exports = LC;
