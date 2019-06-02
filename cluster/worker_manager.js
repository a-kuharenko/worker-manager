'use strict';

const cluster = require('cluster');
const CPUS = require('os').cpus();

class WorkerManager {
  constructor(workersAmount, description = worker => worker) {
    workersAmount = CPUS < workersAmount ?
      CPUS : workersAmount;
    this.partsAmount = workersAmount;
    this.workers = new Array(workersAmount).fill(0)
      .map(() => description(cluster.fork()));
  }

  setTask(task) {
    const partLength = task.length % this.partsAmount === 0 ?
      task.length / this.partsAmount :
      Math.trunc(task.length / this.partsAmount) + 1;

    let startIndex = 0;

    this.tasks = new Array(this.partsAmount).fill(0)
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
        result[message.id] = message.result;
        this.partsAmount--;
        if (this.partsAmount === 0) {
          result = result.reduce((array, subarray) =>
            [...array, ...subarray]);
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
