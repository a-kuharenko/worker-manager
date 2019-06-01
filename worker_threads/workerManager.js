'use strict';

const threads = require('worker_threads');
const { Worker } = threads;

class WorkerManager {
  constructor(workersAmount, description = () => new Worker('./worker.js')) {
    this.workersAmount = workersAmount;
    this._createWorkers(description);
    this.finished = 0;
  }

  sendData(task) {
    this._createBuffers(task);
    this.workers.forEach((worker, index) => {
      worker.postMessage({ workerData: { bufferData: this._bufferData,
        bufferLock: this._bufferLock, id: index  } });
    });
  }
  _createWorkers(description) {
    this.workers = new Array(this.workersAmount).fill(0)
      .map(() => description(new Worker('./worker.js')));
  }

  _createBuffers(task) {
    const bytes = task.length * 4;
    const UNLOCKED = 1;
    this._bufferData = new SharedArrayBuffer(bytes);
    this._bufferLock = new SharedArrayBuffer(bytes);
    this.array = new Int32Array(this._bufferData);
    new Int32Array(this._bufferLock).fill(UNLOCKED);
    task.forEach((value, index) => {
      this.array[index] = value;
    });
  }

  runTask(callback) {
    this.workers.forEach((worker, index) => {
      worker.postMessage({ data: 'start', id: index });
      worker.on('message',  message => {
        if (message.data === 'done' &&
            ++this.finished === this.workersAmount)
          callback(this.array);
      });
    });
  }

  killWorkers() {
    this.workers.map(worker => {
      worker.terminate();
    });
  }
}

class WmWorker {
  constructor(fn, description = () => {}) {
    this.fn = fn;
    description(threads.parentPort);
    this._setDefaultDescription();
  }

  _setDefaultDescription() {
    const LOCKED = 0;
    const UNLOCKED = 1;
    threads.parentPort.on('message', message => {
      if (message.workerData) {
        const { bufferData, bufferLock, id } = message.workerData;
        this.array = new Int32Array(bufferData);
        this.lock = new Int32Array(bufferLock);
        this.id = id;
      } else if (message.data === 'start') {
        this.array.map((value, index) =>
          (Atomics.compareExchange(this.lock, index,
            UNLOCKED, LOCKED) === 1 ?
            Atomics.store(this.array, index, this.fn(value)) : 0));
        threads.parentPort.postMessage({ data: 'done', id: this.id });
      }
    });
  }
}

module.exports = { WorkerManager, WmWorker };
