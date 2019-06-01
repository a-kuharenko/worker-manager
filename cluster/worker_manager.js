'use strict';

const cluster = require('cluster');
const CPUS = require('os').cpus();

class WorkerManager {
  constructor(workersAmount) {
    workersAmount = CPUS < workersAmount ?
      CPUS : workersAmount;

    this.workers = new Array(workersAmount).fill(0)
      .map(() => cluster.fork());
  }

  setDescription(description) {
    this.workers = this.workers.map(description);
  }

  setTask(task, partsAmount) {
    this.task = task;
    this.partsAmount = partsAmount;

    const partLength = task.length % partsAmount === 0 ?
      task.length / partsAmount :
      Math.trunc(task.length / partsAmount) + 1;

    let startIndex = 0;
    this.tasks = new Array(partsAmount).fill(0)
      .map(value => {
        value = task.slice(startIndex, startIndex + partLength);
        startIndex += partLength;
        return value;
      });
  }

  runTask(callback) {
    let result = [];
    this.workers.forEach(worker => {
      worker.on('message', message => {
        this.partsAmount--;
        result[message.id] = message.result;
        this._sendTaskToWorker(worker);
        if (this.partsAmount === 0) {
          result = result.reduce((accumulator, currentValue) =>
            [...accumulator, ...currentValue]);
          callback(result);
        }
      });
      this._sendTaskToWorker(worker);
    });
  }

  killWorkers() {
    this.workers.forEach(worker => worker.kill());
  }

  _sendTaskToWorker(worker) {
    const task = this.tasks.pop();
    if (task)
      worker.send({ task, id: this.tasks.length });
  };
}

module.exports = WorkerManager;
