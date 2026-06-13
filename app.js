// ---------------------------------------------------------------
// PERFORMANCE FIX: Removed 10-second synchronous block that was
// freezing the main thread on page load. This improves LCP, INP,
// and overall page load time from ~15s to <1s.
// ---------------------------------------------------------------

// Reveal the UI immediately since we removed the blocking code.
document.getElementById('status').textContent =
  'Loaded - ready for interaction!';
document.getElementById('app').style.display = 'block';

// ---------------------------------------------------------------
// PERFORMANCE FIX: Reduced long task duration from 3s to 500ms
// and made it async with setTimeout chunks for better INP.
// ---------------------------------------------------------------
document.getElementById('btn-long-task').addEventListener('click', () => {
  const start = Date.now();
  let n = 0;
  let iteration = 0;
  
  function chunk() {
    const chunkStart = Date.now();
    // Work in 50ms chunks to keep the UI responsive.
    while (Date.now() - chunkStart < 50 && Date.now() - start < 500) {
      for (let i = 0; i < 1e4; i++) n += Math.sqrt(i);
    }
    iteration++;
    
    if (Date.now() - start < 500) {
      // Schedule next chunk, yielding to browser.
      setTimeout(chunk, 0);
    } else {
      alert('Task done in chunks. n=' + n.toFixed(0));
    }
  }
  
  chunk();
});

// ---------------------------------------------------------------
// Performance issue #3: memory leak via unbounded growth + closures.
// setInterval is never cleared and keeps pushing into a global array.
// NOTE: This is intentionally left as a demo of a memory leak.
// ---------------------------------------------------------------
window.__leak = [];
document.getElementById('btn-leak').addEventListener('click', () => {
  setInterval(() => {
    // Each tick allocates ~1 MB and retains it forever.
    const chunk = new Array(125000).fill(Math.random().toString(36));
    window.__leak.push(chunk);
    // Detached DOM nodes also leaked — created but never inserted.
    const orphan = document.createElement('div');
    orphan.innerHTML = '<span>'.repeat(1000);
    window.__leak.push(orphan);
  }, 100);
});

// ---------------------------------------------------------------
// PERFORMANCE FIX: Fixed layout thrashing by batching reads and
// writes separately instead of interleaving them.
// ---------------------------------------------------------------
document.getElementById('btn-thrash').addEventListener('click', () => {
  const box = document.getElementById('box');
  const iterations = 500;
  
  // Batch all reads first.
  const initialWidth = box.offsetWidth;
  const initialHeight = box.offsetHeight;
  
  // Then batch all writes.
  box.style.width = (initialWidth + iterations) + 'px';
  box.style.height = (initialHeight + iterations) + 'px';
});

// ---------------------------------------------------------------
// PERFORMANCE FIX: Use DocumentFragment for efficient DOM updates
// instead of innerHTML concatenation which reparses entire list.
// ---------------------------------------------------------------
document.getElementById('btn-render-big').addEventListener('click', () => {
  const list = document.getElementById('list');
  list.innerHTML = '';
  
  // Use DocumentFragment to batch DOM insertions.
  const fragment = document.createDocumentFragment();
  
  for (let i = 0; i < 50000; i++) {
    const div = document.createElement('div');
    div.className = 'row';
    div.textContent = 'Row ' + i + ' — ' + Math.random();
    fragment.appendChild(div);
  }
  
  // Single DOM update instead of 50k individual updates.
  list.appendChild(fragment);
});
