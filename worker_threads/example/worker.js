'use strict';

const { WmWorker } = require('../worker_manager');
const fs = require('fs');

const fn = id => {
  const data = fs.readFileSync(`${__dirname}/source/file_${id}.txt`);
  // TODO: better use for
  const matches = data.toString().match(/2/g);
  return matches !== null ? matches.length : 0;
};

const setHandlers = worker => {
  worker.on('message', message => {
    if (message.data === 'start') {
      console.log(`Worker ${message.id} is started`);
    }
  });
};

new WmWorker(fn, setHandlers);
