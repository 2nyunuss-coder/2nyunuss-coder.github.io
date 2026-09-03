'use strict';
(async()=>{
  try{
    const r=await fetch('./v09.html',{cache:'no-store'}); if(!r.ok) throw new Error('V0.9 tabanı alınamadı.');
    const text=await r.text(); const old=new DOMParser().parseFromString(text,'text/html');
    old.querySelectorAll('script').forEach(s=>s.remove());
    old.querySelectorAll('link[rel="stylesheet"]').forEach(l=>{if(!document.querySelector(`link[href="${l.getAttribute('href')}"]`)){document.head.appendChild(l.cloneNode(true));}});
    document.body.innerHTML=old.body.innerHTML;
    document.title='YEA Suite V1.0';
    document.querySelectorAll('.eyebrow').forEach(e=>e.textContent='YEA SUITE • V1.0 CLOUD');
    const footer=document.querySelector('footer'); if(footer) footer.textContent='YEA Suite V1.0 • RPYS’den bağımsız • Kompakt depolama';
    const tabs=document.querySelector('#tabs');
    if(tabs){
      const first=tabs.querySelector('button');
      first?.insertAdjacentHTML('beforebegin','<button data-tab="today">Bugün</button><button data-tab="calendar">Takvim</button><button data-tab="reminders">Hatırlatmalar</button><button data-tab="search">Ara</button>');
      const taskBtn=tabs.querySelector('[data-tab="tasks"]'); taskBtn?.insertAdjacentHTML('afterend','<button data-tab="recurring">Tekrarlayan</button>');
    }
    const home=document.querySelector('[data-page="home"]');
    home?.insertAdjacentHTML('beforebegin',`
<section data-page="today" class="panel hidden"><div class="sectionHead"><div><h2>☀️ Bugün</h2><p>Günün kritik işlerini tek ekranda gör.</p></div><button id="todayRefresh" type="button" class="ghost">Yenile</button></div><div id="todayHero" class="todayHero"></div><div class="todayCols"><div><h3>Görevler</h3><div id="todayTasks" class="list"></div></div><div><h3>Yaklaşanlar</h3><div id="todayUpcoming" class="list"></div></div></div></section>
<section data-page="calendar" class="panel hidden"><div class="sectionHead split"><div><h2>📅 Takvim</h2><p>Görev, proje, araç ve tekrar eden işleri aylık görünümde izle.</p></div><div class="monthPicker"><label>Ay<input id="calendarMonth" type="month" /></label></div></div><div class="calendarLegend"><span>● Görev</span><span>◆ Proje</span><span>▲ Araç</span><span>↻ Tekrar</span></div><div id="calendarGrid" class="calendarGrid"></div><div id="calendarDayDetail" class="aiResult">Bir güne dokunarak ayrıntıları gör.</div></section>
<section data-page="reminders" class="panel hidden"><div class="sectionHead"><div><h2>🔔 Hatırlatma Merkezi</h2><p>Geciken, bugün olan ve yaklaşan kayıtları önem sırasıyla gösterir.</p></div></div><div class="decisionStats"><article><small>Geciken</small><strong id="remOverdue">0</strong></article><article><small>Bugün</small><strong id="remToday">0</strong></article><article><small>7 gün</small><strong id="remWeek">0</strong></article><article><small>Araç 30 gün</small><strong id="remVehicle">0</strong></article></div><div id="reminderList" class="list"></div></section>
<section data-page="search" class="panel hidden"><div class="sectionHead"><div><h2>🔎 Evrensel Arama</h2><p>Görev, proje, belge, radyoloji, finans, araç ve tekrar eden kayıtlarda ara.</p></div></div><div class="searchBar"><input id="globalSearchInput" maxlength="120" placeholder="Örn: Megane, BT, fatura, rapor…" /><button id="globalSearchBtn" type="button">Ara</button></div><div id="globalSearchMeta" class="tiny"></div><div id="globalSearchResults" class="list"></div></section>`);
    const tasksPage=document.querySelector('[data-page="tasks"]');
    tasksPage?.insertAdjacentHTML('afterend',`
<section data-page="recurring" class="panel hidden"><div class="sectionHead"><div><h2>↻ Tekrarlayan Görevler</h2><p>Günlük, hafta içi, haftalık veya aylık rutinleri bir kez tanımla.</p></div></div><form id="recurringForm"><div class="formGrid four"><input id="recTitle" maxlength="180" placeholder="Tekrarlayan görev" required /><select id="recFrequency"><option value="daily">Her gün</option><option value="weekdays">Hafta içi</option><option value="weekly">Her hafta</option><option value="monthly">Her ay</option></select><input id="recTime" type="time" value="09:00" required /><select id="recPriority"><option value="1">Yüksek</option><option value="2" selected>Normal</option><option value="3">Düşük</option></select></div><div class="formGrid four"><input id="recStart" type="date" required /><input id="recEnd" type="date" /><select id="recWeekday"><option value="1">Pazartesi</option><option value="2">Salı</option><option value="3">Çarşamba</option><option value="4">Perşembe</option><option value="5">Cuma</option><option value="6">Cumartesi</option><option value="0">Pazar</option></select><input id="recDay" type="number" min="1" max="31" value="1" placeholder="Ayın günü" /></div><div class="formGrid two"><select id="recReminder"><option value="0">Tam saatinde hatırlat</option><option value="15">15 dk önce</option><option value="60">1 saat önce</option><option value="1440">1 gün önce</option></select><input id="recNotes" maxlength="500" placeholder="Kısa not" /></div><div class="formActions"><button>Tekrarı Kaydet</button></div></form><div id="recurringList" class="list"></div></section>`);
    const taskForm=document.querySelector('#taskForm .formGrid.three');
    taskForm?.insertAdjacentHTML('afterend','<div class="formGrid one"><label class="v10InlineLabel">Hatırlatma zamanı <input id="taskReminder" type="datetime-local" /></label></div>');
    const homeGrid=document.querySelector('[data-page="home"] .grid');
    homeGrid?.insertAdjacentHTML('afterbegin','<article class="card"><span class="icon">☀️</span><h3>Bugün</h3><p>Geciken, bugün ve yaklaşan işleri tek ekranda gör.</p><button data-go="today">Bugünü Aç</button></article><article class="card"><span class="icon">📅</span><h3>Takvim</h3><p>Görev, proje, araç ve rutinleri aylık izle.</p><button data-go="calendar">Takvimi Aç</button></article>');
    const s=document.createElement('script'); s.src='./v09.js'; document.head.appendChild(s);
    const wait=()=>{ if(typeof refreshData==='function' && typeof assistantAnswerFor==='function' && typeof decisionCriticalTaskRows==='function'){const x=document.createElement('script');x.src='./v10-core.js';document.head.appendChild(x);} else setTimeout(wait,40);}; wait();
  }catch(e){document.body.innerHTML='<main class="wrap"><div class="msg">YEA V1.0 açılamadı: '+String(e.message||e)+'</div></main>'}
})();
