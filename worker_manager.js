'use strict';

const cluster = require('cluster');

class WorkerManager {
  constructor(task, workersAmount, partsAmount) {

    workersAmount = require('os').cpus() < workersAmount ?
      require('os').cpus() : workersAmount;

    this.task = task;

    this.workers = new Array(workersAmount).fill(0)
      .map(() => cluster.fork());

    this.tasks = new Array(partsAmount).fill(0);

    this.partsAmount = partsAmount;

    const partLength = task.length % partsAmount === 0 ?
      task.length / partsAmount :
      Math.trunc(task.length / partsAmount) + 1;

    let startIndex = 0;

    this.tasks = this.tasks.map(value => {
      value = task.slice(startIndex, startIndex + partLength);
      startIndex += partLength;
      return value;
    });

  }

  runTask(callback) {

    let result = [];

    const sendTask = worker => {
      const task = this.tasks.pop();
      if (task) {
        worker.send({ task, id: this.tasks.length, });
      } else
        worker.kill();
    };
    this.workers.forEach(worker => {
      worker.on('message', message => {
        this.partsAmount--;
        result[message.id] = message.result;
        sendTask(worker);
        if (this.partsAmount === 0) {
          result = result.reduce((accumulator, currentValue) =>
            accumulator.concat(currentValue));
          callback(result);
        }
      });
      sendTask(worker);
    });
  }
}

module.exports = WorkerManager;
