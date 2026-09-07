/* Shared startup guard. It never clears local records or changes sign-in state. */
(() => {
  'use strict';
  if (window.YeaBoot) return;
  let failed = false;
  const pending = new Set();
  function fail() {
    if (failed) return;
    failed = true;
    pending.forEach(clearTimeout);
    pending.clear();
    const show = () => {
      if (document.getElementById('yeaBootError')) return;
      const box = document.createElement('div');
      box.id = 'yeaBootError';
      box.setAttribute('role', 'alert');
      box.style.cssText = 'position:fixed;z-index:2147483647;inset:16px 16px auto;padding:20px;background:#15243d;color:#fff;border:1px solid #9ab9e9;border-radius:12px;font:16px system-ui;box-shadow:0 8px 32px #0006';
      const text = document.createElement('p');
      text.textContent = 'YEA açılışı tamamlanamadı. Bağlantını kontrol edip tekrar dene. Cihazındaki kayıtlar korunur.';
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Tekrar Dene';
      button.style.cssText = 'padding:12px 20px;font:inherit;cursor:pointer';
      button.addEventListener('click', () => location.reload());
      box.append(text, button);
      document.body.appendChild(box);
    };
    if (document.body) show();
    else document.addEventListener('DOMContentLoaded', show, {once: true});
  }
  function waitUntil(check, start, timeout = 45000) {
    const deadline = Date.now() + timeout;
    function checkNow() {
      if (failed) return;
      try {
        if (check()) { start(); return; }
      } catch (_) { fail(); return; }
      if (Date.now() >= deadline) { fail(); return; }
      const timer = setTimeout(() => { pending.delete(timer); checkNow(); }, 50);
      pending.add(timer);
    }
    checkNow();
  }
  window.YeaBoot = {waitUntil, fail};
  // Watch required local scripts; optional PDF/CDN failures do not block the app.
  window.addEventListener('error', event => {
    const target = event.target;
    if (target?.tagName !== 'SCRIPT' || !target.src) return;
    const url = new URL(target.src, location.href);
    if (url.origin === location.origin && url.pathname.startsWith(new URL('./', location.href).pathname)) fail();
  }, true);
})();
