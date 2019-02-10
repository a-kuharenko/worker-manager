'use strict';

const WorkerManager = require('../worker_manager');

const task = new Array(100).fill(0).map((value, index) => value + index);
const workersAmount = 5;
const partsAmount = 10;

const wm = new WorkerManager(task, workersAmount, partsAmount);

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
