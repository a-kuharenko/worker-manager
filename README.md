# Worker-Manager
## **Worker-manager based on worker_threads.**
This facade above 'worker_threads' allows to run parallel calculations with avoiding work with sharedArray and Atomics.
General idea:
![Screenshot](./worker_threads/scheme.jpeg)
### Documentation:  
*./master.js*
```js
const { WorkerManager } = require('./workerManager');
const wm = new WorkerManager(workersAmount, path, description);
```  
      workersAmount:         Number{number of workers}
      path:                  String{path to worker}
      description(optional): Function{set events handlers for workers}
                              args: worker
                                worker: Class{worker from worker_threads}
                              returns: worker
      
      properties:
          wm.workers:         Array{array of workers}
          wm.workerAmount:    Number{number of workers}
          wm.array:           Int32Array{array from buffer with data}
          wm.finished:        Number{number of workers that finished their task}
     
      methods:
          wm.sendData(task)
              arguments:
                  task: Array{array with data for processing by workers}
              
              returns: 
                  Void
                
              does: 
                  creates buffer with data from array and bufferLock. Send for each worker
                  postMessage with workerData.
              
           wm.runTask(callback)
               arguments:
                  callback: Function{what gets called when task is completed}
                      args: data
                          data: Returns{workers result}
                      
               returns: 
                   Void
                  
               does: 
                   Send for each worker message with data: 'start' and set event handler
                   on event 'message' with data: 'done', which increases wm.finished and
                   calls callback, when wm.finished === wm.workersAmount
                   
            wm.killWorkers()
                does:
                    Terminate all workers.
                    
*./worker.js*   
```js
const { WmWorker } = require('./workerManager');
const worker = new WmWorker(fn, description);
````

      fn:                    Function{function which will applied for every element of task}
      description(optional): Function{set events handlers for parentPort}
                              args: parentPort
                              
      properties:
          worker.id:       Number{id of WmWorker}
          worker.array:    Int32Array{array from buffer with data}
          worker.fn:       Function{function which will applied for every element of task}
          worker.lock      Int32Array{array from buffer which contains lock/unlocked flags of task}
                              
      does: WmWorker processes task array with other WmWorkers and sends postMessage to 
      parentPort with data: 'done', when WmWorker finished his work.
      
### Using 
*./master.js* 
```js
'use strict';

const { WorkerManager } = require('./workerManager');

const task = new Array(10000000).fill(0).map(() => 10);
const description = worker => {
  worker.on('message', (message) => {
    if (message.data === 'done')
      console.log(`Worker ${message.id} is done`);
  });

  worker.on('error', err => {
    console.log(err);
  });

  worker.on('exit', code => {
    console.dir({ code });
  });
  return worker;
};

const wm = new WorkerManager(4, './worker.js', description);
wm.sendData(task);
wm.runTask(res => {
  console.log(res);
  wm.killWorkers();
});
```
*./worker.js*
```js
'use strict';

const { WmWorker } = require('./workerManager');

const fn = x => parseInt(Math.pow(x, x) /
  Math.log10(x) * Math.tan(x * Math.random()));

const description = worker => {
  worker.on('message', (message) => {
    if (message.data === 'start')
      console.log(`Worker ${message.id} is started`);
  });
};
new WmWorker(fn, description);
```

## **Worker-manager based on cluster.**
This facade above 'cluster' allows to split up the task between workers and put together the results of their parallel work. 
General idea:
![Screenshot](./cluster/scheme.jpeg)
### Documentation:  
*./master.js*
```js
const WorkerManager = require('./worker_manager');
const wm = new WorkerManager(workersAmount, description);
```  
      workersAmount:         Number{number of workers}
      description(optional): Function{set events handlers for workers}
                              args: worker
                              returns: worker
      
      properties:
          wm.workers:         Array{array of workers}
          wm.partsAmount:     Number{number of active subarrays with task for workers}
          wm.tasks:           Array{array with subarrays for every worker}
     
      methods:
          wm.setTask(task)
              arguments:
                  task: Array{array with data for processing by workers}
              
              returns: 
                  Void
                
              does: 
                  Split up the task on subarrays for every worker
              
           wm.runTask(callback)
               arguments:
                  callback: Function{what gets called when task is completed}
                      args: data
                          data: Returns{workers result}
                      
               returns: 
                   Void
                  
               does: 
                   Send task for each worker and set event handler
                   on event 'message', which collects result of work and
                   calls callback, when active tasks ran out.
                   
            wm.killWorkers()
                does:
                    Terminate all workers.
                    
### Using 
*./multicore.js* 
```js
'use strict';

const cluster = require('cluster');

if (cluster.isMaster) {
  require('./master.js');
} else {
  require('./worker');
}
```
*./master.js* 
```js
'use strict';

const WorkerManager = require('../worker_manager');

const task = new Array(10000000).fill(0).map(() => 10);
const workersAmount = 4;

const description = worker => {
  worker.on('exit', () => {
    console.log(`Worker ${worker.process.pid} was killed`);
  });

  worker.on('message', () => {
    console.log(`Master recieved a result from Worker ${worker.process.pid}`);
  });
  return worker;
};

const wm = new WorkerManager(workersAmount, description);
wm.setTask(task);
wm.runTask((result) => {
  console.log(result);
});
```
*./worker.js*
```js
'use strict';

const fn = x => parseInt(Math.pow(x, x) /
  Math.log10(x) * Math.tan(x * Math.random()));

process.on('message', message => {
  const result = message.task.map(fn);
  process.send({ result, id: message.id });
});
```