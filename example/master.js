'use strict';

const WorkerManager = require('../worker_manager');

const task = new Array(100).fill(10);
const workerCount = 5;
const partsCount = 10;

const wm = new WorkerManager(task, workerCount, partsCount);
wm.workers.forEach(worker => {

  worker.on('exit', () => {
    console.log(`Worker ${worker.process.pid} hasn\`t any work. It was killed`);
  });

  worker.on('message', () => {
    console.log(`Master recieved a result from Worker ${worker.process.pid}`);
  });
});

console.log('Tasks for Workers: ');
console.log(wm.tasks);

wm.runTask((result) => {
  console.log(`Workers ended their work: ${result}`);
});
