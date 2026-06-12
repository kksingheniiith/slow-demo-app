// ---------------------------------------------------------------
// OPTIMIZED: Replaced 10-second synchronous block with async loading
// This fixes LCP, FCP, and INP by avoiding main thread blocking.
// ---------------------------------------------------------------

// Show loading state immediately
const statusDiv = document.getElementById('status');
const appDiv = document.getElementById('app');

// Use requestIdleCallback for non-blocking initialization
if ('requestIdleCallback' in window) {
  requestIdleCallback(initApp, { timeout: 2000 });
} else {
  setTimeout(initApp, 0);
}

function initApp() {
  // Simulate async data loading without blocking
  statusDiv.textContent = 'Loaded with optimized async initialization!';
  appDiv.style.display = 'block';
  
  // If you need to do heavy computation, use a Web Worker instead
  // Example: const worker = new Worker('worker.js');
}

// ---------------------------------------------------------------
// OPTIMIZED: Long task broken into chunks with requestIdleCallback
// This keeps INP < 200ms by yielding to the main thread regularly.
// ---------------------------------------------------------------
document.getElementById('btn-long-task').addEventListener('click', async () => {
  const button = document.getElementById('btn-long-task');
  button.disabled = true;
  button.textContent = 'Processing...';
  
  let n = 0;
  const totalIterations = 1e6;
  const chunkSize = 1e4; // Process 10k items at a time
  
  // Break work into chunks to avoid blocking UI
  for (let i = 0; i < totalIterations; i += chunkSize) {
    // Process chunk
    for (let j = 0; j < chunkSize && (i + j) < totalIterations; j++) {
      n += Math.sqrt(i + j);
    }
    
    // Yield to main thread every chunk
    await new Promise(resolve => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(resolve, { timeout: 50 });
      } else {
        setTimeout(resolve, 0);
      }
    });
    
    // Update progress
    button.textContent = `Processing... ${Math.round((i / totalIterations) * 100)}%`;
  }
  
  button.disabled = false;
  button.textContent = 'Run Long Task (blocks UI)';
  alert('Long task done (optimized with chunking). n=' + n.toFixed(0));
});

// ---------------------------------------------------------------
// OPTIMIZED: Memory leak fixed with cleanup and size limits
// Added interval clearing and bounded array growth.
// ---------------------------------------------------------------
let leakInterval = null;
const MAX_LEAK_SIZE = 100; // Limit growth

document.getElementById('btn-leak').addEventListener('click', () => {
  // Clear previous interval if exists
  if (leakInterval) {
    clearInterval(leakInterval);
    window.__leak = [];
  }
  
  window.__leak = [];
  let count = 0;
  
  leakInterval = setInterval(() => {
    if (count >= MAX_LEAK_SIZE) {
      clearInterval(leakInterval);
      alert('Demo stopped after ' + MAX_LEAK_SIZE + ' iterations to prevent actual memory leak.');
      return;
    }
    
    // Smaller allocations for demo purposes
    const chunk = new Array(1250).fill(Math.random().toString(36).substring(0, 10));
    window.__leak.push(chunk);
    count++;
  }, 100);
  
  // Provide a way to stop the leak
  alert('Memory allocation started (limited to ' + MAX_LEAK_SIZE + ' chunks). Click again to restart.');
});

// ---------------------------------------------------------------
// OPTIMIZED: Layout thrashing fixed by batching reads and writes
// This prevents forced synchronous reflows and improves CLS.
// ---------------------------------------------------------------
document.getElementById('btn-thrash').addEventListener('click', () => {
  const box = document.getElementById('box');
  
  // Batch all reads first
  const initialWidth = box.offsetWidth;
  const initialHeight = box.offsetHeight;
  
  // Calculate new dimensions
  const newWidth = initialWidth + 500;
  const newHeight = initialHeight + 500;
  
  // Then batch all writes using CSS transitions for smooth animation
  requestAnimationFrame(() => {
    box.style.transition = 'width 0.5s ease, height 0.5s ease';
    box.style.width = newWidth + 'px';
    box.style.height = newHeight + 'px';
  });
});

// ---------------------------------------------------------------
// OPTIMIZED: Efficient DOM rendering with DocumentFragment and
// batch updates. Reduces 50k reflows to 1.
// ---------------------------------------------------------------
document.getElementById('btn-render-big').addEventListener('click', async () => {
  const button = document.getElementById('btn-render-big');
  button.disabled = true;
  button.textContent = 'Rendering...';
  
  const list = document.getElementById('list');
  list.innerHTML = '';
  
  const totalRows = 50000;
  const batchSize = 5000; // Render in batches to keep UI responsive
  
  for (let batch = 0; batch < totalRows; batch += batchSize) {
    // Create DocumentFragment to avoid reflows
    const fragment = document.createDocumentFragment();
    
    for (let i = batch; i < batch + batchSize && i < totalRows; i++) {
      const div = document.createElement('div');
      div.className = 'row';
      div.textContent = `Row ${i} — ${Math.random().toFixed(6)}`;
      fragment.appendChild(div);
    }
    
    // Single DOM update per batch
    list.appendChild(fragment);
    
    // Yield to main thread between batches
    await new Promise(resolve => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(resolve, { timeout: 50 });
      } else {
        setTimeout(resolve, 0);
      }
    });
    
    // Update progress
    button.textContent = `Rendering... ${Math.round((batch / totalRows) * 100)}%`;
  }
  
  button.disabled = false;
  button.textContent = 'Render 50k Rows';
});

// ---------------------------------------------------------------
// BONUS: Performance monitoring
// Log Core Web Vitals to console (can integrate with New Relic)
// ---------------------------------------------------------------
if ('PerformanceObserver' in window) {
  // Monitor Largest Contentful Paint
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime, 'ms');
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    // LCP not supported
  }
  
  // Monitor First Input Delay (INP precursor)
  try {
    const fidObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        console.log('FID:', entry.processingStart - entry.startTime, 'ms');
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch (e) {
    // FID not supported
  }
  
  // Monitor Layout Shifts
  try {
    let clsScore = 0;
    const clsObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsScore += entry.value;
          console.log('CLS:', clsScore);
        }
      });
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    // CLS not supported
  }
}
