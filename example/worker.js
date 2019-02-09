'use strict';

console.log(`Worker ${process.pid} ready`);

const fn = x => x * 10;

process.on('message', message => {
  const result = message.task.map(fn);
  console.log(`Worker ${process.pid} has a result`);
  process.send({ result, id: message.id });
});
