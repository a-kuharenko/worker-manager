'use strict';

const fn = x => parseInt(
  Math.pow(x, x) / Math.log10(x) * Math.tan(x * Math.random())
);

process.on('message', message => {
  const result = message.task.map(fn);
  process.send({ result, id: message.id });
});
