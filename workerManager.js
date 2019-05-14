'use strict';

const threads = require('worker_threads');
const { Worker } = threads;

class WorkerManager {
  constructor(workersAmount, description) {
    this.workersAmount = workersAmount;
    this.createWorkers(description);
  }

  sendData(task) {
    this._createBuffers(task);
    this.workers.forEach((worker, index) => {
      worker.postMessage({ workerData: { bufferData: this.bufferData,
        bufferLock: this.bufferLock, id: index  } });
    });
  }
  createWorkers(description) {
    this.workers = new Array(this.workersAmount).fill(0)
      .map(() => description(new Worker('./worker.js')));
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

  runTask(callback) {
    this.finished = 0;
    this.workers.forEach((worker, index) => {
      worker.postMessage({ data: 'start', id: index });
      worker.on('message', message => {
        if (message.data === 'done') {
          this.finished++ === this.workersAmount - 1 ?
            callback(this.array) : this.finished;
          //worker.terminate();
        }
      });
    });
  }
}

class WorkerFromManager {
  constructor(description) {

    const locked = 0;
    const unlocked = 1;
    this.fn = () => {};
    description(threads.parentPort);
    threads.parentPort.on('message', message => {
      if (message.workerData) {
        const { bufferData, bufferLock, id } = message.workerData;
        this.array = new Int32Array(bufferData);
        this.lock = new Int32Array(bufferLock);
        this.id = id;
      }
      if (message.data === 'start') {
        this.array.map((value, index) =>
          (Atomics.compareExchange(this.lock, index,
            unlocked, locked) === 1 ?
            Atomics.store(this.array, index, this.fn(value)) : 0));
        threads.parentPort.postMessage({ data: 'done', id: this.id });
      }
    });
  }

  setFn(fn) {
    this.fn = fn;
  }
}

module.exports = { WorkerManager, WorkerFromManager };
