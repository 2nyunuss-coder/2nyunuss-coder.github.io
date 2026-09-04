'use strict';
(()=>{
  const base=document.createElement('script');base.src='./v15-bootstrap.js';document.head.appendChild(base);
  const wait=()=>{if(window.__YEA_V15_BOOTED&&window.v13AppOpen&&document.querySelector('#v13Taskbar')&&document.querySelector('[data-page="finance"]'))setup();else setTimeout(wait,50)};
  function setup(){
    if(window.__YEA_V16_BOOTED)return;window.__YEA_V16_BOOTED=true;
    document.title='YEA Suite V1.6 Desktop';
    document.querySelectorAll('.eyebrow').forEach(e=>e.textContent='YEA SUITE • V1.6 DESKTOP');
    const footer=document.querySelector('footer');if(footer)footer.textContent='YEA Suite V1.6 • Akıllı bildirimler • Bütçe • Araç sayaçları • RPYS’den bağımsız';
    const taskbar=document.querySelector('#v13Taskbar');
    if(taskbar&&!document.querySelector('#v16NotifyBtn'))taskbar.querySelector('.v13TaskbarSpacer')?.insertAdjacentHTML('beforebegin','<button id="v16CommandBtn" type="button" title="Komut Paleti (Alt+Boşluk)">⌘</button><button id="v16NotifyBtn" type="button" title="Bildirim Merkezi">🔔<em id="v16NotifyBadge" class="hidden"></em></button>');
    const start=document.querySelector('#v13StartMenu .v13StartApps');
    if(start&&!document.querySelector('#v16StartNotify'))start.insertAdjacentHTML('beforeend','<button id="v16StartNotify" type="button">🔔 Bildirim Merkezi</button><button id="v16StartCommand" type="button">⌘ Komut Paleti</button>');
    const financePage=document.querySelector('[data-page="finance"]');
    if(financePage&&!document.querySelector('#v16BudgetPanel'))financePage.insertAdjacentHTML('afterbegin',`<div id="v16BudgetPanel" class="panel v16BudgetPanel"><div class="sectionHead split"><div><h2>🎯 Aylık Bütçe Hedefi</h2><p>Bu hedef yalnız cihazında tutulur; mevcut finans kayıtlarınla otomatik karşılaştırılır.</p></div><button id="v16BudgetEdit" type="button" class="ghost">Hedefi Ayarla</button></div><div class="v16BudgetStats"><div><span>Bütçe</span><b id="v16BudgetLimit">—</b></div><div><span>Harcama</span><b id="v16BudgetSpent">—</b></div><div><span>Kalan</span><b id="v16BudgetLeft">—</b></div><div><span>Kullanım</span><b id="v16BudgetPct">—</b></div></div><div class="v16BudgetBar"><span id="v16BudgetBarFill"></span></div><div id="v16BudgetHint" class="tiny"></div></div>`);
    const vehiclePage=document.querySelector('[data-page="vehicle"]');
    if(vehiclePage&&!document.querySelector('#v16VehicleCounters'))vehiclePage.insertAdjacentHTML('afterbegin',`<div id="v16VehicleCounters" class="panel v16VehicleCounters"><div class="sectionHead"><div><h2>🚗 Araç Bakım Sayaçları</h2><p>Mevcut araç kayıtlarından yaklaşan tarih ve kilometreleri otomatik bulur.</p></div></div><div id="v16VehicleCounterGrid" class="v16CounterGrid"></div></div>`);
    const todayPage=document.querySelector('[data-page="today"]')||document.querySelector('[data-page="home"]');
    if(todayPage&&!document.querySelector('#v16DailyBrief'))todayPage.insertAdjacentHTML('afterbegin',`<div id="v16DailyBrief" class="panel v16DailyBrief"><div class="sectionHead split"><div><h2>🧭 Günlük YEA Özeti</h2><p id="v16BriefDate"></p></div><button id="v16BriefRefresh" type="button" class="ghost">↻ Yenile</button></div><div id="v16BriefCards" class="v16BriefCards"></div><div id="v16BriefFocus" class="v16BriefFocus"></div></div>`);
    if(!document.querySelector('#v16NotifyWindow'))document.body.insertAdjacentHTML('beforeend',`
      <div id="v16NotifyWindow" class="v14Window v16NotifyWindow hidden" data-v14-window="notify"><div class="v14WinBar"><b>🔔 Bildirim Merkezi</b><div><button data-v14-min="notify">—</button><button data-v14-max="notify">□</button><button data-v14-close="notify">✕</button></div></div><div class="v14WinBody"><div class="v16NotifyToolbar"><button id="v16NotifyRefresh" type="button">↻ Yenile</button><button id="v16NotifyMuteToday" type="button" class="ghost">Bugün Sessize Al</button></div><div id="v16NotifyList" class="v16NotifyList"></div></div><div class="v14Resize"></div></div>
      <div id="v16Command" class="v16Command hidden"><div class="v16CommandBox"><div class="v16CommandInputWrap"><span>⌘</span><input id="v16CommandInput" autocomplete="off" placeholder="Bir şey yaz: görevler, PDF, finans, araç…" /><kbd>Esc</kbd></div><div id="v16CommandList" class="v16CommandList"></div></div></div>
      <div id="v16BudgetModal" class="v13Modal hidden"><div class="v13ModalCard"><div class="v13WinTitle"><b>Aylık Bütçe Hedefi</b><button id="v16BudgetClose" type="button">✕</button></div><form id="v16BudgetForm"><label>Aylık toplam gider hedefi (₺)<input id="v16BudgetInput" type="number" min="0" step="100" placeholder="Örn. 25000" /></label><label>Uyarı eşiği<select id="v16BudgetWarn"><option value="70">%70</option><option value="80" selected>%80</option><option value="90">%90</option></select></label><div class="formActions"><button>Kaydet</button></div></form></div></div>`);
    const x=document.createElement('script');x.src='./v16-core.js';document.head.appendChild(x);
  }
  wait();
})();
