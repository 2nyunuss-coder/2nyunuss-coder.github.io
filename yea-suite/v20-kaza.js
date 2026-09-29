'use strict';
(() => {
  const PRAYERS = [
    { id: 'sabah', name: 'Sabah', icon: '◒' },
    { id: 'ogle', name: 'Öğle', icon: '☀' },
    { id: 'ikindi', name: 'İkindi', icon: '◐' },
    { id: 'aksam', name: 'Akşam', icon: '◓' },
    { id: 'yatsi', name: 'Yatsı', icon: '☾' }
  ];
  const q = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const trNumber = value => Number(value || 0).toLocaleString('tr-TR');
  const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Istanbul' }).format(new Date());
  const emptyState = () => ({ version: 1, debts: Object.fromEntries(PRAYERS.map(p => [p.id, 0])), entries: [] });
  let activeKey = '';
  let state = emptyState();

  function userId() {
    try { return typeof session !== 'undefined' && session?.user?.id ? session.user.id : 'device'; }
    catch (_) { return 'device'; }
  }

  function storageKey() { return `yea_v20_kaza_${userId()}`; }

  function normalize(raw) {
    const clean = emptyState();
    if (!raw || typeof raw !== 'object') return clean;
    PRAYERS.forEach(p => {
      const amount = Math.floor(Number(raw.debts?.[p.id] || 0));
      clean.debts[p.id] = Number.isFinite(amount) ? Math.max(0, Math.min(amount, 99999)) : 0;
    });
    clean.entries = Array.isArray(raw.entries) ? raw.entries.filter(entry =>
      PRAYERS.some(p => p.id === entry?.prayer) && Number(entry?.count) > 0 && /^\d{4}-\d{2}-\d{2}$/.test(String(entry?.date || ''))
    ).slice(-5000).map(entry => ({
      id: String(entry.id || `${Date.now()}-${Math.random()}`),
      prayer: entry.prayer,
      count: Math.max(1, Math.min(Math.floor(Number(entry.count)), 500)),
      date: entry.date,
      createdAt: entry.createdAt || new Date().toISOString()
    })) : [];
    return clean;
  }

  function load() {
    const key = storageKey();
    if (activeKey === key) return;
    activeKey = key;
    try { state = normalize(JSON.parse(localStorage.getItem(key))); }
    catch (_) { state = emptyState(); }
  }

  function save() {
    try {
      localStorage.setItem(activeKey || storageKey(), JSON.stringify(state));
      return true;
    } catch (_) {
      message('Kayıt cihazına yazılamadı. Tarayıcı depolamasını kontrol et.', 'err');
      return false;
    }
  }

  function completed(prayer) {
    return state.entries.filter(entry => entry.prayer === prayer).reduce((sum, entry) => sum + entry.count, 0);
  }

  function remaining(prayer) { return Math.max(0, state.debts[prayer] - completed(prayer)); }

  function message(text, type = 'ok') {
    const box = q('#kazaMessage');
    if (!box) return;
    box.textContent = text;
    box.className = `kazaMessage ${type}`;
    clearTimeout(message.timer);
    message.timer = setTimeout(() => { box.textContent = ''; box.className = 'kazaMessage'; }, 4000);
  }

  function formatDate(date) {
    try { return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`)); }
    catch (_) { return date; }
  }

  function render() {
    load();
    const initial = PRAYERS.reduce((sum, p) => sum + state.debts[p.id], 0);
    const done = PRAYERS.reduce((sum, p) => sum + Math.min(state.debts[p.id], completed(p.id)), 0);
    const left = Math.max(0, initial - done);
    const todayDone = state.entries.filter(entry => entry.date === today()).reduce((sum, entry) => sum + entry.count, 0);
    const percent = initial ? Math.min(100, Math.round(done / initial * 100)) : 0;
    q('#kazaRemaining').textContent = trNumber(left);
    q('#kazaDone').textContent = trNumber(done);
    q('#kazaToday').textContent = trNumber(todayDone);
    q('#kazaPercent').textContent = `%${percent}`;
    q('#kazaProgress').style.setProperty('--progress', `${percent * 3.6}deg`);
    q('#kazaProgress').setAttribute('aria-valuenow', String(percent));

    q('#kazaPrayerCards').innerHTML = PRAYERS.map(prayer => {
      const debt = state.debts[prayer.id];
      const doneForPrayer = Math.min(debt, completed(prayer.id));
      const leftForPrayer = Math.max(0, debt - doneForPrayer);
      const prayerPercent = debt ? Math.min(100, Math.round(doneForPrayer / debt * 100)) : 0;
      return `<article class="kazaPrayerCard">
        <div class="kazaPrayerTitle"><span>${prayer.icon}</span><div><b>${prayer.name}</b><small>${debt ? `${trNumber(doneForPrayer)} / ${trNumber(debt)} tamamlandı` : 'Başlangıç borcu girilmedi'}</small></div></div>
        <div class="kazaPrayerCount"><strong>${trNumber(leftForPrayer)}</strong><span>kalan</span></div>
        <div class="kazaBar"><i style="width:${prayerPercent}%"></i></div>
        <button type="button" data-kaza-add="${prayer.id}" ${leftForPrayer ? '' : 'disabled'}>+ 1 kıldım</button>
      </article>`;
    }).join('');

    q('#kazaDebtInputs').innerHTML = PRAYERS.map(prayer => `<label>${prayer.name}<input name="${prayer.id}" type="number" min="0" max="99999" inputmode="numeric" value="${state.debts[prayer.id]}" required/></label>`).join('');

    const prayerMap = Object.fromEntries(PRAYERS.map(p => [p.id, p]));
    const history = [...state.entries].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 50);
    q('#kazaHistory').innerHTML = history.length ? history.map(entry => `<div class="kazaHistoryRow">
      <span class="kazaHistoryIcon">${prayerMap[entry.prayer].icon}</span>
      <div><b>${esc(prayerMap[entry.prayer].name)} · ${trNumber(entry.count)} adet</b><small>${esc(formatDate(entry.date))}</small></div>
      <button type="button" data-kaza-undo="${esc(entry.id)}">Geri al</button>
    </div>`).join('') : '<div class="empty">Henüz kılındı kaydı yok.</div>';
  }

  function addEntry(prayerId, requestedCount, date) {
    load();
    const prayer = PRAYERS.find(p => p.id === prayerId);
    if (!prayer) return;
    const left = remaining(prayerId);
    if (!state.debts[prayerId]) return message(`Önce ${prayer.name} için başlangıç borcunu gir.`, 'warn');
    if (!left) return message(`${prayer.name} için kalan borç görünmüyor.`, 'warn');
    const asked = Math.max(1, Math.min(Math.floor(Number(requestedCount) || 1), 500));
    const count = Math.min(asked, left);
    state.entries.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      prayer: prayerId,
      count,
      date: date || today(),
      createdAt: new Date().toISOString()
    });
    if (!save()) return;
    render();
    message(asked > count ? `${prayer.name} için kalan ${count} adet kaydedildi.` : `${prayer.name}: ${count} adet kaydedildi.`);
  }

  q('#kazaDate').value = today();
  q('#kazaAddForm').addEventListener('submit', event => {
    event.preventDefault();
    addEntry(q('#kazaPrayer').value, q('#kazaCount').value, q('#kazaDate').value);
    q('#kazaCount').value = '1';
  });

  q('#kazaDebtForm').addEventListener('submit', event => {
    event.preventDefault();
    load();
    const form = new FormData(event.currentTarget);
    PRAYERS.forEach(prayer => {
      state.debts[prayer.id] = Math.max(0, Math.min(Math.floor(Number(form.get(prayer.id)) || 0), 99999));
    });
    if (!save()) return;
    render();
    message('Başlangıç borçları kaydedildi.');
  });

  q('#kazaPrayerCards').addEventListener('click', event => {
    const button = event.target.closest('[data-kaza-add]');
    if (button) addEntry(button.dataset.kazaAdd, 1, today());
  });

  q('#kazaHistory').addEventListener('click', event => {
    const button = event.target.closest('[data-kaza-undo]');
    if (!button) return;
    load();
    const entry = state.entries.find(item => item.id === button.dataset.kazaUndo);
    if (!entry) return;
    const prayer = PRAYERS.find(p => p.id === entry.prayer);
    if (!confirm(`${prayer.name} için ${entry.count} adetlik kayıt geri alınsın mı?`)) return;
    state.entries = state.entries.filter(item => item.id !== entry.id);
    if (!save()) return;
    render();
    message('Kayıt geri alındı.');
  });

  q('#tabs [data-tab="kaza"]')?.addEventListener('click', () => { window.v13AppOpen('kaza'); setTimeout(render, 0); });
  q('#v20StartKaza')?.addEventListener('click', () => { window.v13AppOpen('kaza'); setTimeout(render, 0); });
  document.addEventListener('click', event => {
    if (event.target.closest('[data-v18-open="kaza"]')) setTimeout(render, 0);
  });
  addEventListener('storage', event => { if (event.key === storageKey()) { activeKey = ''; render(); } });
  render();
})();
