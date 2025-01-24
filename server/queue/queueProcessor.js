// Import the processQueue function from requestQueue.js
const { processQueue } = require('./requestQueue');

// Process the queue every 5 minutes (300000ms)
setInterval(() => {
  console.log('Processing queue...');
  processQueue();
}, 300000); // 5 minutes


// WALA PANI NA INTEGRATE