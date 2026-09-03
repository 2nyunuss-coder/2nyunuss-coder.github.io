(() => {
  'use strict';

  const frame = document.getElementById('rpysFrame');
  const loading = document.getElementById('loading');
  const loadingText = document.getElementById('loadingText');
  const loader = document.getElementById('loader');
  const error = document.getElementById('error');
  const retry = document.getElementById('retry');
  const buttons = [...document.querySelectorAll('.nav-btn')];
  let ready = false;
  let checks = 0;
  let readinessTimer;

  function setOnlineState() {
    document.body.classList.toggle('is-offline', !navigator.onLine);
  }

  function getInnerDocument() {
    try {
      return frame.contentDocument || frame.contentWindow.document;
    } catch (_) {
      return null;
    }
  }

  function injectMobileSafety(doc) {
    if (doc.getElementById('rpys-cep-shell-style')) return;
    const style = doc.createElement('style');
    style.id = 'rpys-cep-shell-style';
    style.textContent = `
      @media(max-width:900px){
        body{padding-bottom:72px!important}
        .main{padding-bottom:88px!important}
        .rpysFixedTools{bottom:76px!important}
        button,.btn,a.nav{touch-action:manipulation}
      }
    `;
    doc.head.appendChild(style);
  }

  function finishLoading(doc) {
    injectMobileSafety(doc);
    ready = true;
    clearInterval(readinessTimer);
    loading.style.display = 'none';
    restoreLastPage();
  }

  function showFailure(message) {
    clearInterval(readinessTimer);
    loadingText.textContent = 'RPYS Cep açılamadı.';
    loader.style.display = 'none';
    error.style.display = 'block';
    retry.style.display = 'block';
    error.textContent = message;
  }

  function checkReady() {
    checks += 1;
    const doc = getInnerDocument();
    if (doc && doc.querySelector('main.main') && doc.querySelector('.sidebar')) {
      finishLoading(doc);
      return;
    }
    if (checks > 120) showFailure('Bağlantıyı kontrol edip Tekrar Dene düğmesine basın.');
  }

  function startReadinessCheck() {
    ready = false;
    checks = 0;
    clearInterval(readinessTimer);
    readinessTimer = setInterval(checkReady, 500);
    checkReady();
  }

  function findPageButton(doc, page) {
    return doc.querySelector(`.sidebar .nav[data-p="${page}"]`)
      || doc.querySelector(`[data-p="${page}"]`)
      || doc.querySelector(`a[href="#${page}"]`);
  }

  function setActive(page) {
    buttons.forEach((button) => button.classList.toggle('active', button.dataset.page === page));
  }

  function openPage(page, remember = true) {
    const doc = getInnerDocument();
    if (!ready || !doc) return;
    const target = findPageButton(doc, page);
    if (!target) {
      if (page === 'dashboard') {
        const first = doc.querySelector('.sidebar .nav[data-p]');
        if (first) first.click();
      }
      return;
    }
    target.click();
    setActive(page);
    if (remember) {
      try { localStorage.setItem('rpys_cep_last_page', page); } catch (_) {}
    }
    frame.focus();
  }

  function restoreLastPage() {
    let page = 'dashboard';
    try { page = localStorage.getItem('rpys_cep_last_page') || page; } catch (_) {}
    setTimeout(() => openPage(page, false), 120);
  }

  function toggleInnerMenu() {
    const doc = getInnerDocument();
    if (!ready || !doc) return;
    const menuButton = doc.getElementById('rpysMobileMenuBtn') || doc.querySelector('.rpysMobileMenuBtn');
    if (menuButton) menuButton.click();
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.action === 'menu') toggleInnerMenu();
      else openPage(button.dataset.page);
    });
  });

  retry.addEventListener('click', () => {
    loadingText.textContent = 'Güncel ve güvenli RPYS açılıyor…';
    loader.style.display = 'block';
    error.style.display = 'none';
    retry.style.display = 'none';
    frame.src = `../?rpys_mobile_shell=1&t=${Date.now()}`;
    startReadinessCheck();
  });

  window.addEventListener('online', setOnlineState);
  window.addEventListener('offline', setOnlineState);
  frame.addEventListener('load', startReadinessCheck);
  setOnlineState();
  startReadinessCheck();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();
