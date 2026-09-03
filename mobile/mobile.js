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
  let authenticated = false;
  let restoredForSession = false;
  let checks = 0;
  let readinessTimer;
  let sessionTimer;

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
    startSessionSync();
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
    authenticated = false;
    restoredForSession = false;
    checks = 0;
    clearInterval(readinessTimer);
    clearInterval(sessionTimer);
    readinessTimer = setInterval(checkReady, 500);
    checkReady();
  }

  function loginIsVisible(doc) {
    const overlay = doc.getElementById('loginOverlay');
    if (!overlay) return false;
    try { return frame.contentWindow.getComputedStyle(overlay).display !== 'none'; }
    catch (_) { return overlay.style.display !== 'none'; }
  }

  function canOpenPage(doc, page) {
    if (loginIsVisible(doc)) return false;
    try {
      const checker = frame.contentWindow.userCan;
      if (typeof checker === 'function') return Boolean(checker(page));
    } catch (_) {}
    const target = findPageButton(doc, page);
    return Boolean(target && target.style.display !== 'none' && !target.hidden);
  }

  function firstAllowedPage(doc) {
    const preferred = ['dashboard', 'nobet', 'saymanlik', 'izin'];
    const preferredPage = preferred.find((page) => canOpenPage(doc, page));
    if (preferredPage) return preferredPage;
    const first = [...doc.querySelectorAll('.sidebar .nav[data-p]')]
      .find((button) => canOpenPage(doc, button.dataset.p));
    return first ? first.dataset.p : null;
  }

  function syncQuickNavigation(doc) {
    let visibleCount = 1;
    buttons.forEach((button) => {
      if (!button.dataset.page) return;
      const allowed = canOpenPage(doc, button.dataset.page);
      button.hidden = !allowed;
      if (allowed) visibleCount += 1;
    });
    document.querySelector('.bottom-nav').style.setProperty('--nav-count', String(visibleCount));
  }

  function syncSession() {
    const doc = getInnerDocument();
    if (!ready || !doc) return;
    const signedIn = !loginIsVisible(doc);
    if (!signedIn) {
      authenticated = false;
      restoredForSession = false;
      buttons.forEach((button) => { if (button.dataset.page) button.hidden = true; });
      document.querySelector('.bottom-nav').style.setProperty('--nav-count', '1');
      return;
    }
    authenticated = true;
    syncQuickNavigation(doc);
    if (!restoredForSession) {
      restoredForSession = true;
      restoreLastPage();
    }
  }

  function startSessionSync() {
    clearInterval(sessionTimer);
    sessionTimer = setInterval(syncSession, 500);
    syncSession();
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
    if (!ready || !authenticated || !doc || !canOpenPage(doc, page)) return;
    const target = findPageButton(doc, page);
    if (!target) {
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
    const doc = getInnerDocument();
    if (!doc) return;
    if (!canOpenPage(doc, page)) page = firstAllowedPage(doc);
    if (page) setTimeout(() => openPage(page, false), 120);
  }

  function toggleInnerMenu() {
    const doc = getInnerDocument();
    if (!ready || !authenticated || !doc) return;
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
