'use strict';

const threads = require('worker_threads');
const { Worker } = threads;

class WorkerManager {
  constructor(workersAmount, path, description = worker => worker) {
    this.workersAmount = workersAmount;
    this.workers = new Array(this.workersAmount).fill(0)
      .map(() => description(new Worker(path)));
  }

  sendData(task) {
    this._createBuffers(task);
    this.workers.forEach((worker, id) => {
      worker.postMessage({ workerData: { bufferData: this._bufferData,
        bufferLock: this._bufferLock, id } });
    });
  }

  _createBuffers(task) {
    const bytesLock = task.length;
    const bytesData = bytesLock * 4;
    const UNLOCKED = 1;
    this._bufferData = new SharedArrayBuffer(bytesData);
    this._bufferLock = new SharedArrayBuffer(bytesLock);
    this.array = new Int32Array(this._bufferData);
    new Uint8Array(this._bufferLock).fill(UNLOCKED);
    task.forEach((value, index) => {
      this.array[index] = value;
    });
  }

  runTask(callback) {
    let finished = 0;
    this.workers.forEach((worker, id) => {
      worker.postMessage({ data: 'start', id });
      worker.on('message',  message => {
        if (message.data === 'done' &&
            ++finished === this.workersAmount)
          callback(this.array);
      });
    });
  }

  killWorkers() {
    this.workers.forEach(worker => worker.terminate());
  }
}

class WmWorker {
  constructor(fn, description = () => {}) {
    this.fn = fn;
    description(threads.parentPort);
    threads.parentPort.on('message', message => {
      if (message.workerData) {
        this._setBuffers(message.workerData);
      } else if (message.data === 'start') {
        this._runTask();
        threads.parentPort.postMessage({ data: 'done', id: this.id });
      }
    });
  }

  _setBuffers(workerData) {
    const { bufferData, bufferLock, id } = workerData;
    this.array = new Int32Array(bufferData);
    this.lock = new Uint8Array(bufferLock);
    this.id = id;
  }

  _runTask() {
    const LOCKED = 0;
    const UNLOCKED = 1;
    this.array.forEach((value, index) =>
      (Atomics.compareExchange(this.lock, index, UNLOCKED, LOCKED) === 1 ?
        Atomics.store(this.array, index, this.fn(value)) : 0));
  }
}

module.exports = { WorkerManager, WmWorker };
