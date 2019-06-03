'use strict';

const { WorkerManager } = require('../worker_manager');

const task = new Array(100000).fill(0).map((value, index) => value + index);
const description = worker => {
  worker.on('message', message => {
    if (message.data === 'done')
      console.log(`Worker ${message.id} is done`);
  });

  worker.on('error', err => {
    console.log(err);
  });

  worker.on('exit', code => {
    console.dir({ code });
  });
  return worker;
};

const wm = new WorkerManager(4, './worker.js', description);

wm.sendData(task);
wm.runTask(res => {
  console.log(res);
  wm.killWorkers();
});
