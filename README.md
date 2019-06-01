# Worker-Manager
## **Worker-manager based on worker_threads.**
### Documentation:  
*./master.js*
```js
const { WorkerManager } = require('./workerManager');
const wm = new WorkerManager(workersAmount, description);
```  
      workersAmount:         Number{number of workers}
      description(optional): Function{set events handlers for workers}
                              args: worker
                                worker: Class{worker from worker_threads}
      
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

const wm = new WorkerManager(4, description);
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

const fib = n => (n <= 1 ? n : fib(n - 1) + fib(n - 2));
const description = worker => {
  worker.on('message', (message) => {
    if (message.data === 'start')
      console.log(`Worker ${message.id} is started`);
  });
};
new WmWorker(fib, description);
```