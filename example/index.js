'use strict';

const WorkerManager = require('./workerManager');

const task = new Array(10000000).fill(0).map(() => 10);

const wm = new WorkerManager(8);

wm.runTask(task, array => {
  console.log(array);
});

