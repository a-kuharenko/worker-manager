'use strict';

const cluster = require('cluster');
const CPUS = require('os').cpus().length;

const join = arrays => arrays
  .reduce((array, subarray) => [...array, ...subarray]);

class WorkerManager {
  constructor(workersAmount, setHandlers = worker => worker) {
    const amount = Math.min(CPUS, workersAmount);
    this.partsAmount = amount;
    this.workers = new Array(amount)
      .fill(0)
      .map(() => setHandlers(cluster.fork()));
  }

  setTask(task) {
    const partLength = task.length % this.partsAmount === 0 ?
      task.length / this.partsAmount :
      Math.trunc(task.length / this.partsAmount) + 1;

    this.tasks = new Array(this.partsAmount);
    for (let i = 0, j = 0; i < task.length; i += partLength, j++) {
      this.tasks[j] = task.slice(i, i + partLength);
    }
  }

  runTask(callback) {
    const result = new Array(this.workers.length);
    this.workers.forEach(worker => {
      worker.on('message', message => {
        result[message.id] = message.result;
        this.partsAmount--;
        if (this.partsAmount === 0) {
          callback(join(result));
        }
      });
      this._sendTaskToWorker(worker);
    });
  }

  killWorkers() {
    this.workers.forEach(worker => {
      worker.kill();
    });
  }

  _sendTaskToWorker(worker) {
    const task = this.tasks.pop();
    if (task) {
      worker.send({ task, id: this.tasks.length });
    }
  }
}

module.exports = WorkerManager;
