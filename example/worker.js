
'use strict';

const { WorkerFromManager } = require('./workerManager');

const fn = n => (n <= 1 ? n : fn(n - 1) + fn(n - 2));

const description = worker => {
  worker.on('message', (message) => {
    if (message.data === 'start')
      console.log(`Worker ${message.id} is started`);
  });
};
const worker = new WorkerFromManager(description);
worker.setFn(fn);

