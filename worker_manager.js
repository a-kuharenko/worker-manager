'use strict';

const cluster = require('cluster');

class WorkerManager {
  constructor(task, workerCount, partsCount) {

    workerCount = require('os').cpus() < workerCount ?
      require('os').cpus() : workerCount;

    this.task = task;

    this.workers = new Array(workerCount).fill(0)
      .map(() => cluster.fork());

    this.tasks = new Array(partsCount).fill(0);

    this.partsCount = partsCount;

    const partLength = task.length % partsCount === 0 ?
      task.length / partsCount :
      Math.trunc(task.length / partsCount) + 1;

    let start = 0;

    this.tasks = this.tasks.map(value => {
      value = task.slice(start, start + partLength);
      start += partLength;
      return value;
    });

  }

  runTask(callback) {

    let id = 1;
    let counter = 1;
    let result = [];

    const sendTask = worker => {
      const task = this.tasks.shift();
      if (task) {
        worker.send({ task, id });
        id++;
      } else
        worker.destroy();
    };
    this.workers.forEach(worker => {
      worker.on('message', message => {
        result[message.id] = message.result;
        sendTask(worker);
        if (counter === this.partsCount) {
          result = result.reduce((arr1, arr2) => arr1.concat(arr2));
          callback(result);
        }
        counter++;
      });
      sendTask(worker);
    });
  }
}

module.exports = WorkerManager;
