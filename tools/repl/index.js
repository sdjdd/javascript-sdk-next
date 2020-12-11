const repl = require('repl');
const path = require('path');

const historyPath = path.resolve(__dirname, '.history');

const server = repl.start('leancloud > ');
server.setupHistory(historyPath, function (err) {
  if (err) {
    console.error(err);
    process.exit(-1);
  }
});
Object.assign(server.context, require('./context'));
