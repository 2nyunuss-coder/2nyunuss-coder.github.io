'use strict';
(()=>{
  const base=document.createElement('script');base.src='./v10-bootstrap.js';document.head.appendChild(base);
  const wait=()=>{if(typeof renderV10==='function'&&document.querySelector('#appView')&&document.querySelector('#calendarGrid'))setup();else setTimeout(wait,40)};
  function setup(){
    if(window.__YEA_V11_BOOTED)return;window.__YEA_V11_BOOTED=true;
    document.title='YEA Suite V1.1';
    document.querySelectorAll('.eyebrow').forEach(e=>e.textContent='YEA SUITE • V1.1 CLOUD');
    const footer=document.querySelector('footer');if(footer)footer.textContent='YEA Suite V1.1 • RPYS’den bağımsız • Kompakt depolama';
    const todayHero=document.querySelector('#todayHero');
    todayHero?.insertAdjacentHTML('afterend',`
      <div class="v11Planner"><div class="v11PlannerHead"><div><b>🧭 Günlük Plan</b><span>Önceliklere göre zaman blokları oluştur.</span></div></div><div class="v11PlannerControls"><label>Başlangıç <input id="v11PlanStart" type="time" /></label><label>Süre <select id="v11PlanMinutes"><option value="30">30 dk</option><option value="60" selected>60 dk</option><option value="90">90 dk</option><option value="120">120 dk</option><option value="180">180 dk</option></select></label><button id="v11BuildPlan" type="button">Plan Oluştur</button><button id="v11CopyPlan" type="button" class="ghost">Kopyala</button></div><div id="v11PlanResult" class="aiResult v11PlanResult">Plan oluşturmak için süre seç.</div></div>`);
    const cal=document.querySelector('#calendarGrid');
    cal?.insertAdjacentHTML('afterend',`
      <form id="v11QuickTaskForm" class="v11QuickTask hidden"><div class="v11QuickHead"><b>➕ <span id="v11QuickDateLabel">Takvime görev ekle</span></b><button id="v11QuickClose" type="button" class="ghost">Kapat</button></div><div class="formGrid four"><input id="v11QuickTitle" maxlength="180" placeholder="Görev adı" required /><input id="v11QuickTime" type="time" value="09:00" required /><select id="v11QuickPriority"><option value="1">Yüksek</option><option value="2" selected>Normal</option><option value="3">Düşük</option></select><select id="v11QuickReminder"><option value="">Hatırlatma yok</option><option value="0">Tam saatinde</option><option value="15">15 dk önce</option><option value="60">1 saat önce</option><option value="1440">1 gün önce</option></select></div><div class="formGrid one"><input id="v11QuickNotes" maxlength="500" placeholder="Kısa not" /></div><div class="formActions"><button>Seçili Güne Ekle</button></div></form>`);
    const recActions=document.querySelector('#recurringForm .formActions');
    if(recActions){const create=recActions.querySelector('button');if(create){create.id='recCreateBtn';create.type='submit'}recActions.insertAdjacentHTML('beforeend','<button id="recUpdateBtn" type="button" class="hidden">Değişiklikleri Kaydet</button><button id="recCancelEditV11" type="button" class="ghost hidden">Düzenlemeyi İptal</button>');}
    const settings=document.querySelector('[data-page="settings"] .formActions');
    settings?.insertAdjacentHTML('beforebegin',`
      <div class="v11Restore"><h3>🛟 Yedek Geri Yükleme</h3><p class="tiny">JSON yedeğini önce doğrular ve özetler. Dosya sınırı 5 MB.</p><div class="v11RestoreControls"><input id="v11BackupFile" type="file" accept=".json,application/json" /><select id="v11RestoreMode"><option value="merge">Birleştir — mevcut kayıtları koru</option><option value="replace">Değiştir — mevcut YEA kayıtlarını sil</option></select><button id="v11RestoreBtn" type="button" disabled>Geri Yükle</button></div><div id="v11BackupPreview" class="aiResult v11BackupPreview">Henüz yedek seçilmedi.</div></div>`);
    const x=document.createElement('script');x.src='./v11-core.js';document.head.appendChild(x);
  }
  wait();
})();