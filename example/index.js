'use strict';

const { WorkerManager } = require('./workerManager');

const task = new Array(10000000).fill(0).map(() => 10);

const description = worker => {
  worker.on('message', (message) => {
    if (message.data === 'done')
      console.log(`Worker ${message.id} was done`);
  });
  return worker;
};
const wm = new WorkerManager(4, description);
wm.sendData(task);

wm.runTask(array => {
  console.log(array);
});

