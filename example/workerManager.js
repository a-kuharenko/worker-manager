'use strict';

const threads = require('worker_threads');
const { Worker } = threads;

class WorkerManager {
  constructor(workersAmount) {
    this.workersAmount = workersAmount;
  }

  _createWorkers() {
    this.workers = new Array(this.workersAmount).fill(0)
      .map((_, index) => new Worker('./worker.js',
        { workerData: { bufferData: this.bufferData,
          bufferLock: this.bufferLock, id: index  } }
      ));
  }

  _createBuffers(task) {
    const bytes = task.length * 32 / 8;
    const unlocked = 1;
    this.bufferData = new SharedArrayBuffer(bytes);
    this.bufferLock = new SharedArrayBuffer(bytes);
    this.array = new Int32Array(this.bufferData);
    this.lock = new Int32Array(this.bufferLock).fill(unlocked);
    task.forEach((value, index) => {
      this.array[index] = value;
    });
  }

  runTask(task, callback) {
    this._createBuffers(task);
    this._createWorkers();
    this.finished = 0;
    this.workers.forEach(worker => {
      worker.postMessage({ data: 'start' });
      worker.on('message', message => {
        if (message.data === 'done') {
          this.finished++ === this.workersAmount - 1 ?
            callback(this.array) : this.finished;
          worker.terminate(() => console.log(`Worker ${message.id} is done`));
        }
      });
    });
  }
}

module.exports = WorkerManager;
