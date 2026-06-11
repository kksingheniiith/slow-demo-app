// ---------------------------------------------------------------
// Performance issue #1: 10-second synchronous block on page load.
// This freezes the main thread so nothing renders until it ends.
// ---------------------------------------------------------------
(function blockMainThread() {
  const start = Date.now();
  let x = 0;
  while (Date.now() - start < 10000) {
    // Busy work — wasted CPU, blocks paint, blocks input.
    x += Math.sqrt(Math.random() * 99999);
  }
  // Use the value so the loop isn't optimized away.
  window.__warmup = x;
})();

// After the block finishes, reveal the UI.
document.getElementById('status').textContent =
  'Loaded after a 10-second main-thread block.';
document.getElementById('app').style.display = 'block';

// ---------------------------------------------------------------
// Performance issue #2: long synchronous task on click.
// ---------------------------------------------------------------
document.getElementById('btn-long-task').addEventListener('click', () => {
  const start = Date.now();
  let n = 0;
  // ~3 seconds of busy work — UI is unresponsive during this.
  while (Date.now() - start < 3000) {
    for (let i = 0; i < 1e5; i++) n += Math.sqrt(i);
  }
  alert('Long task done. n=' + n.toFixed(0));
});

// ---------------------------------------------------------------
// Performance issue #3: memory leak via unbounded growth + closures.
// setInterval is never cleared and keeps pushing into a global array.
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
// Performance issue #4: layout thrashing — read/write/read/write
// in a loop forces synchronous reflow on every iteration.
// ---------------------------------------------------------------
document.getElementById('btn-thrash').addEventListener('click', () => {
  const box = document.getElementById('box');
  for (let i = 0; i < 500; i++) {
    // Read offsetWidth, then write style — forces reflow each pass.
    const w = box.offsetWidth;
    box.style.width = (w + 1) + 'px';
    const h = box.offsetHeight;
    box.style.height = (h + 1) + 'px';
  }
});

// ---------------------------------------------------------------
// Performance issue #5: inefficient DOM rendering — innerHTML
// concatenation in a loop, no DocumentFragment, repeated reflows.
// ---------------------------------------------------------------
document.getElementById('btn-render-big').addEventListener('click', () => {
  const list = document.getElementById('list');
  list.innerHTML = '';
  for (let i = 0; i < 50000; i++) {
    // innerHTML += inside a loop reparses the entire list every time.
    list.innerHTML += '<div class="row">Row ' + i + ' — ' + Math.random() + '</div>';
  }
});
