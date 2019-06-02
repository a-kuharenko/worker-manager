
'use strict';

const { WmWorker } = require('../worker_manager');

const fn = x => parseInt(Math.pow(x, x) /
  Math.log10(x) * Math.tan(x * Math.random()));

const description = worker => {
  worker.on('message', (message) => {
    if (message.data === 'start')
      console.log(`Worker ${message.id} is started`);
  });
};
new WmWorker(fn, description);

