'use strict';

const WorkerManager = require('../worker_manager');

const task = new Array(10000000).fill(0).map(() => 10);
const task1 = new Array(10000000).fill(0).map(() => 9);
const workersAmount = 4;
const partsAmount = 8;

const wm = new WorkerManager(workersAmount);

const description = worker => {
  worker.on('exit', () => {
    console.log(`Worker ${worker.process.pid} was killed`);
  });

  worker.on('message', () => {
    console.log(`Master recieved a result from Worker ${worker.process.pid}`);
  });
  return worker;
};

wm.setDescription(description);
wm.setTask(task, partsAmount);

wm.runTask((result) => {
  console.log(result);
  wm.setTask(task1, partsAmount);
  wm.runTask(res => {
    console.log(res);
    wm.killWorkers();
  });
});
