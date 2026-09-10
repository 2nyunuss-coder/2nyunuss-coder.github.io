'use strict';
(() => {
  const base = document.createElement('script');
  base.src = './v17-bootstrap.js?hp=2';
  document.head.appendChild(base);
  window.YeaBoot.waitUntil(() => window.__YEA_V17_BOOTED && window.v13AppOpen && document.querySelector('[data-page="history"]'), () => {
    if (window.__YEA_V18_BOOTED) return;
    window.__YEA_V18_BOOTED = true;
    document.title = 'YEA Suite V1.8 Mobil';
    document.querySelectorAll('.eyebrow').forEach(el => { el.textContent = 'YEA SUITE · 1.8'; });
    const core = document.createElement('script');
    core.src = './v18-mobile.js';
    document.head.appendChild(core);
  });
})();
