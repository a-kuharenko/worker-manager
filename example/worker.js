
'use strict';

const threads = require('worker_threads');

const { bufferData, bufferLock, id } = threads.workerData;
const array = new Int32Array(bufferData);
const lock = new Int32Array(bufferLock);
const locked = 0;
const unlocked = 1;

const fn = n => (n <= 1 ? n : fn(n - 1) + fn(n - 2));

threads.parentPort.on('message', (message) => {
  if (message.data === 'start') {
    console.log(`Worker ${id} was started`);
    array.map((value, index) => {
      if (Atomics.compareExchange(lock, index, unlocked, locked) === 1) {
        const res = fn(value);
        Atomics.store(array, index, res);
      }
    });
    threads.parentPort.postMessage({ data: 'done', id });
  }
});

