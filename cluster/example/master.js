'use strict';

const WorkerManager = require('../worker_manager');

const task = new Array(10000000).fill(0).map(() => 10);
const workersAmount = 4;

const description = worker => {
  worker.on('exit', () => {
    console.log(`Worker ${worker.process.pid} was killed`);
  });

  worker.on('message', () => {
    console.log(`Master recieved a result from Worker ${worker.process.pid}`);
  });
  return worker;
};

const wm = new WorkerManager(workersAmount, description);
wm.setTask(task);
wm.runTask((result) => {
  console.log(result);
});
