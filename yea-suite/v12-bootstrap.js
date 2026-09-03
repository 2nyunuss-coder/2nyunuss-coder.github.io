'use strict';
(()=>{
  const base=document.createElement('script');base.src='./v11-bootstrap.js';document.head.appendChild(base);
  const wait=()=>{if(typeof renderV10==='function'&&typeof buildDailyPlanV11==='function'&&document.querySelector('#appView')&&document.querySelector('#v11PlanResult'))setup();else setTimeout(wait,45)};
  function setup(){
    if(window.__YEA_V12_BOOTED)return;window.__YEA_V12_BOOTED=true;
    document.title='YEA Suite V1.2';
    document.querySelectorAll('.eyebrow').forEach(e=>e.textContent='YEA SUITE • V1.2 CLOUD');
    const footer=document.querySelector('footer');if(footer)footer.textContent='YEA Suite V1.2 • Hızlı günlük kullanım • RPYS’den bağımsız';

    const tabs=document.querySelector('#tabs');
    const calendarBtn=tabs?.querySelector('[data-tab="calendar"]');
    if(calendarBtn&&!tabs.querySelector('[data-tab="week"]'))calendarBtn.insertAdjacentHTML('afterend','<button data-tab="week">Hafta</button>');

    const home=document.querySelector('[data-page="home"]');
    if(home&&!document.querySelector('#v12HomeQuick'))home.insertAdjacentHTML('afterbegin',`
      <section id="v12HomeQuick" class="v12HomeQuick">
        <div class="v12HomeQuickHead"><div><b>⚡ Hızlı Merkez</b><span>En sık yaptığın işlemlere tek dokunuş.</span></div><button id="v12OpenQuick" type="button">+ Hızlı Ekle</button></div>
        <div class="v12QuickChips"><button data-v12-quick="task">✅ Görev</button><button data-v12-quick="expense">💸 Gider</button><button data-v12-quick="project">🧩 Proje</button><button data-v12-quick="vehicle">🚗 Araç</button><button data-go="today">☀️ Bugün</button><button data-go="week">📆 Bu Hafta</button></div>
        <div class="v12Recent"><b>Son kullandıkların</b><div id="v12RecentModules" class="v12RecentModules"><span>Henüz kullanım yok.</span></div></div>
      </section>`);

    const calendar=document.querySelector('[data-page="calendar"]');
    if(calendar&&!document.querySelector('[data-page="week"]'))calendar.insertAdjacentHTML('afterend',`
      <section data-page="week" class="panel hidden">
        <div class="sectionHead split"><div><h2>📆 Haftalık Görünüm</h2><p>Yedi günü görev, proje, araç ve rutinlerle birlikte gör.</p></div><div class="v12WeekNav"><button id="v12PrevWeek" type="button" class="ghost">← Önceki</button><button id="v12ThisWeek" type="button">Bu Hafta</button><button id="v12NextWeek" type="button" class="ghost">Sonraki →</button></div></div>
        <div id="v12WeekTitle" class="v12WeekTitle"></div>
        <div id="v12WeekGrid" class="v12WeekGrid"></div>
        <div class="v12WeekReportHead"><div><h3>📋 Bu hafta ne yaptım?</h3><p>Haftalık tamamlanan işler ve para hareketleri.</p></div><div><button id="v12CopyWeek" type="button" class="ghost">Raporu Kopyala</button></div></div>
        <div id="v12WeekReport" class="aiResult v12WeekReport"></div>
      </section>`);

    const settings=document.querySelector('[data-page="settings"]');
    const restore=settings?.querySelector('.v11Restore');
    if(settings&&!document.querySelector('#v12Personalize')){
      const html=`<div id="v12Personalize" class="v12Personalize"><h3>🎛 Ana Ekranı Kişiselleştir</h3><p class="tiny">İstemediğin kartları gizle. Tercih sadece bu cihazda tutulur.</p><div id="v12WidgetChoices" class="v12WidgetChoices"></div><div class="formActions"><button id="v12SortFrequent" type="button">Sık Kullanılanları Üste Al</button><button id="v12ResetHome" type="button" class="ghost">Varsayılana Dön</button></div><label class="v12StatToggle"><input id="v12ShowStats" type="checkbox" checked /> Ana sayfa sayaçlarını göster</label></div>`;
      if(restore)restore.insertAdjacentHTML('beforebegin',html);else settings.insertAdjacentHTML('beforeend',html);
    }

    if(!document.querySelector('#v12Fab'))document.body.insertAdjacentHTML('beforeend','<button id="v12Fab" type="button" aria-label="Hızlı ekle">＋</button>');
    if(!document.querySelector('#v12QuickModal'))document.body.insertAdjacentHTML('beforeend',`
      <div id="v12QuickModal" class="v12Modal hidden" role="dialog" aria-modal="true">
        <div class="v12ModalCard">
          <div class="v12ModalHead"><div><b>⚡ Hızlı Ekle</b><span id="v12QuickSub">Bir kayıt türü seç.</span></div><button id="v12QuickClose" type="button" class="ghost">✕</button></div>
          <div class="v12QuickTabs"><button data-v12-qtab="task" class="active">Görev</button><button data-v12-qtab="expense">Gider</button><button data-v12-qtab="project">Proje</button><button data-v12-qtab="vehicle">Araç</button></div>
          <form id="v12QuickTask" data-v12-qform="task"><input id="v12TaskTitle" maxlength="180" placeholder="Ne yapman gerekiyor?" required /><div class="formGrid three"><input id="v12TaskDue" type="datetime-local" /><select id="v12TaskPriority"><option value="1">Yüksek</option><option value="2" selected>Normal</option><option value="3">Düşük</option></select><input id="v12TaskNote" maxlength="500" placeholder="Kısa not" /></div><div class="formActions"><button>Görevi Ekle</button></div></form>
          <form id="v12QuickExpense" data-v12-qform="expense" class="hidden"><div class="formGrid three"><input id="v12ExpenseDate" type="date" required /><input id="v12ExpenseAmount" type="number" min="0" step="0.01" placeholder="Tutar" required /><select id="v12ExpenseCat"><option value="home">Ev</option><option value="vehicle">Araç</option><option value="food">Yeme-İçme</option><option value="bill">Fatura</option><option value="health">Sağlık</option><option value="education">Eğitim</option><option value="other">Diğer</option></select></div><input id="v12ExpenseNote" maxlength="300" placeholder="Açıklama" /><div class="formActions"><button>Gideri Ekle</button></div></form>
          <form id="v12QuickProject" data-v12-qform="project" class="hidden"><input id="v12ProjectTitle" maxlength="180" placeholder="Proje adı" required /><div class="formGrid two"><input id="v12ProjectDue" type="date" /><input id="v12ProjectNext" maxlength="500" placeholder="İlk sonraki adım" /></div><div class="formActions"><button>Projeyi Ekle</button></div></form>
          <form id="v12QuickVehicle" data-v12-qform="vehicle" class="hidden"><input id="v12VehicleTitle" maxlength="160" placeholder="Araç işi / bakım" required /><div class="formGrid three"><input id="v12VehicleDate" type="date" required /><select id="v12VehicleType"><option value="maintenance">Bakım</option><option value="repair">Onarım</option><option value="bodywork">Kaporta/Kozmetik</option><option value="inspection">Muayene</option><option value="insurance">Sigorta</option><option value="fuel">Yakıt</option><option value="other">Diğer</option></select><input id="v12VehicleCost" type="number" min="0" step="0.01" placeholder="Masraf" /></div><div class="formGrid two"><input id="v12VehicleNext" type="date" /><input id="v12VehicleNote" maxlength="400" placeholder="Not" /></div><div class="formActions"><button>Araç Kaydını Ekle</button></div></form>
          <div id="v12QuickMsg" class="tiny"></div>
        </div>
      </div>`);

    const x=document.createElement('script');x.src='./v12-core.js';document.head.appendChild(x);
  }
  wait();
})();
