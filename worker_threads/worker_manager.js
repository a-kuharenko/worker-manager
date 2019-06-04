'use strict';

const threads = require('worker_threads');
const { Worker } = threads;

const UNLOCKED = 1;
const LOCKED = 0;
const id = x => x;

class WorkerManager {
  constructor(workersAmount, path, setHandlers = id) {
    this.workersAmount = workersAmount;
    this.workers = new Array(this.workersAmount)
      .fill(0)
      .map(() => setHandlers(new Worker(path)));
  }

  sendData(task) {
    this._createBuffers(task);
    this.workers.forEach((worker, id) => {
      worker.postMessage({
        workerData: {
          bufferData: this._bufferData,
          bufferLock: this._bufferLock,
          id
        }
      });
    });
  }

  _createBuffers(task) {
    const bytesLock = task.length;
    const bytesData = bytesLock * Int32Array.BYTES_PER_ELEMENT;
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
    const { workersAmount } = this;
    this.workers.forEach((worker, id) => {
      worker.postMessage({ data: 'start', id });
      worker.on('message', message => {
        finished++;
        const { data } = message;
        if (data === 'done' && finished === workersAmount) {
          callback(this.array);
        }
      });
    });
  }

  killWorkers() {
    this.workers.forEach(worker => {
      worker.terminate();
    });
  }
}

class WmWorker {
  constructor(fn, setHandlers) {
    this.fn = fn;
    if (setHandlers) {
      setHandlers(threads.parentPort);
    }
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
    this.array.forEach((value, index) => {
      const prev = Atomics.compareExchange(this.lock, index, UNLOCKED, LOCKED);
      if (prev === UNLOCKED) {
        Atomics.store(this.array, index, this.fn(value));
      }
    });
  }
}

module.exports = { WorkerManager, WmWorker };
