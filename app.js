// ---------------------------------------------------------------
// PERFORMANCE OPTIMIZED VERSION
// All blocking operations removed or refactored to be non-blocking.
// ---------------------------------------------------------------

// Removed: 10-second synchronous block that was freezing the main thread.
// The UI now loads instantly without artificial delays.

// Initialize UI immediately
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('status').textContent = 'App loaded successfully! ⚡';
  document.getElementById('app').style.display = 'block';
});

// ---------------------------------------------------------------
// FIX #1: Long task refactored to be non-blocking with chunked processing.
// ---------------------------------------------------------------
document.getElementById('btn-long-task').addEventListener('click', () => {
  const status = document.getElementById('status');
  status.textContent = 'Processing in background...';
  
  let n = 0;
  let iterations = 0;
  const totalIterations = 30; // Split into 30 chunks
  
  function processChunk() {
    const chunkStart = Date.now();
    // Process for ~100ms per chunk to keep UI responsive
    while (Date.now() - chunkStart < 100 && iterations < totalIterations) {
      for (let i = 0; i < 1e5; i++) n += Math.sqrt(i);
      iterations++;
    }
    
    if (iterations < totalIterations) {
      // Schedule next chunk
      requestAnimationFrame(processChunk);
      status.textContent = `Processing... ${Math.round(iterations/totalIterations*100)}%`;
    } else {
      status.textContent = 'Long task completed! ✓';
      alert('Long task done (non-blocking). n=' + n.toFixed(0));
    }
  }
  
  requestAnimationFrame(processChunk);
});

// ---------------------------------------------------------------
// FIX #2: Memory leak fixed with cleanup mechanism.
// ---------------------------------------------------------------
let leakIntervalId = null;
let isLeaking = false;

document.getElementById('btn-leak').addEventListener('click', () => {
  if (isLeaking) {
    // Stop the leak
    clearInterval(leakIntervalId);
    leakIntervalId = null;
    isLeaking = false;
    document.getElementById('btn-leak').textContent = 'Start Memory Leak';
    document.getElementById('status').textContent = 'Memory leak stopped. ✓';
    // Clear the leak array
    if (window.__leak) window.__leak.length = 0;
  } else {
    // Start controlled allocation with automatic cleanup
    window.__leak = [];
    let tickCount = 0;
    const maxTicks = 50; // Limit to 50 iterations (5 seconds)
    
    leakIntervalId = setInterval(() => {
      tickCount++;
      
      if (tickCount > maxTicks) {
        clearInterval(leakIntervalId);
        isLeaking = false;
        document.getElementById('btn-leak').textContent = 'Start Memory Leak';
        document.getElementById('status').textContent = 'Memory allocation completed with auto-cleanup. ✓';
        return;
      }
      
      // Smaller allocations to demonstrate without crashing browser
      const chunk = new Array(1000).fill(Math.random().toString(36));
      window.__leak.push(chunk);
      document.getElementById('status').textContent = `Allocating memory... ${tickCount}/${maxTicks}`;
    }, 100);
    
    isLeaking = true;
    document.getElementById('btn-leak').textContent = 'Stop Memory Leak';
  }
});

// ---------------------------------------------------------------
// FIX #3: Layout thrashing fixed by batching reads and writes.
// ---------------------------------------------------------------
document.getElementById('btn-thrash').addEventListener('click', () => {
  const box = document.getElementById('box');
  
  // Read all dimensions first (single reflow)
  const currentWidth = box.offsetWidth;
  const currentHeight = box.offsetHeight;
  
  // Calculate new dimensions
  const newWidth = currentWidth + 500;
  const newHeight = currentHeight + 500;
  
  // Write all at once (single reflow)
  box.style.width = newWidth + 'px';
  box.style.height = newHeight + 'px';
  
  document.getElementById('status').textContent = 
    `Box resized to ${newWidth}x${newHeight}px (optimized, no thrashing). ✓`;
});

// ---------------------------------------------------------------
// FIX #4: Efficient DOM rendering using DocumentFragment.
// Reduced from O(n²) to O(n) complexity.
// ---------------------------------------------------------------
document.getElementById('btn-render-big').addEventListener('click', () => {
  const list = document.getElementById('list');
  const status = document.getElementById('status');
  
  status.textContent = 'Rendering 50,000 rows efficiently...';
  
  // Use requestAnimationFrame to avoid blocking
  requestAnimationFrame(() => {
    const startTime = performance.now();
    
    // Clear existing content
    list.textContent = '';
    
    // Use DocumentFragment for efficient batch insertion
    const fragment = document.createDocumentFragment();
    
    for (let i = 0; i < 50000; i++) {
      const div = document.createElement('div');
      div.className = 'row';
      div.textContent = `Row ${i} — ${Math.random().toFixed(6)}`;
      fragment.appendChild(div);
    }
    
    // Single DOM insertion (one reflow)
    list.appendChild(fragment);
    
    const endTime = performance.now();
    status.textContent = 
      `Rendered 50,000 rows in ${(endTime - startTime).toFixed(0)}ms (optimized). ✓`;
  });
});
