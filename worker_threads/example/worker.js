
'use strict';

const { WmWorker } = require('../workerManager');

const fib = n => (n <= 1 ? n : fib(n - 1) + fib(n - 2));
const description = worker => {
  worker.on('message', (message) => {
    if (message.data === 'start')
      console.log(`Worker ${message.id} is started`);
  });
};
new WmWorker(fib, description);

