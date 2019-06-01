'use strict';

//console.log(`Worker ${process.pid} ready`);

const fn = n => (n <= 1 ? n : fn(n - 1) + fn(n - 2));

process.on('message', message => {
  const result = message.task.map(fn);
  //console.log(`Worker ${process.pid} has a result`);
  process.send({ result, id: message.id });
});
