/* Additive mobile layer: uses the existing forms and data; no schema or auth changes. */
'use strict';
(() => {
  const q = s => document.querySelector(s);
  const qa = s => [...document.querySelectorAll(s)];
  const narrow = () => matchMedia('(max-width: 820px)').matches;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const prefKey = 'yea_v18_mobile_favorites';
  const defaults = ['tasks','calendar','finance','notepad','vehicle','history'];
  const icons = {pocket:'⌂',today:'☀',calendar:'▦',week:'▤',tasks:'✓',projects:'◇',finance:'₺',vehicle:'↗',docs:'▧',notepad:'✎',calculator:'±',history:'▥',radiology:'✚',assistant:'✦',settings:'⚙',search:'⌕',desktop:'▣',recurring:'↻',files:'▱',reminders:'◷',summary:'≡',decision:'⑂',apps:'▦',games:'◈'};
  let favorites;
  try { const parsed = JSON.parse(localStorage.getItem(prefKey)); favorites = Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string').slice(0,10) : defaults; } catch { favorites = defaults; }
  let modules = [], route = 'pocket', explicitDesktop = false, lastFocus = null;
  const app = q('#appView');
  q('#tabs').insertAdjacentHTML('afterbegin','<button data-tab="pocket">⌂ Cep Merkezi</button><button data-tab="apps">▦ Tüm Modüller</button><button data-tab="games">◈ Oyunlar</button>');
  app.insertAdjacentHTML('beforeend', `
    <section class="v18Pocket hidden" data-page="pocket">
      <div class="v18Greeting"><div><span id="v18Date"></span><h1>Günün elinin altında.</h1></div><button data-v18-open="settings" class="v18Avatar" aria-label="Ayarları aç">YEA</button></div>
      <div id="v18Network" class="v18Network" role="status"></div>
      <div class="v18Quick"><button data-v18-quick="task"><span>＋</span>Görev ekle</button><button data-v18-quick="expense"><span>₺</span>Gider ekle</button><button data-v18-open="notepad"><span>✎</span>Notlarım</button></div>
      <div class="v18Stats"><button data-v18-open="tasks"><span>Açık görev</span><strong id="v18TaskCount">—</strong></button><button data-v18-open="finance"><span>Bu ay bakiye</span><strong id="v18Balance">—</strong></button></div>
      <div class="v18SectionTitle"><h2>Sıradaki işler</h2><button data-v18-open="today">Gün planı →</button></div><div id="v18Tasks" class="v18Tasks"></div>
      <div class="v18SectionTitle"><h2>Elimin altındakiler</h2><button data-v18-open="apps">Düzenle →</button></div><div id="v18Favorites" class="v18AppGrid"></div>
      <a class="v18ArcadeLink" href="./arcade/"><span class="v18GameGlyph">◈</span><span><b>Oyun Odası</b><small>6 oyun · Kaldığın bölümden devam</small></span><span>→</span></a>
    </section>
    <section class="v18Pocket hidden" data-page="apps"><div class="v18SectionTitle"><h1>Tüm modüller</h1><button data-v18-open="settings" aria-label="Ayarlar">⚙</button></div><label class="v18Search">Modül bul<input id="v18Search" type="search" placeholder="Görev, finans, geçmiş…" autocomplete="off"></label><p class="v18Muted">Yıldızla işaretlediklerin cep merkezinde görünür.</p><div id="v18Modules" class="v18ModuleList"></div></section>
    <section class="v18Pocket hidden" data-page="games"><div class="v18SectionTitle"><h1>Oyun Odası</h1><span>6 oyun</span></div><p class="v18Muted">Dokunmatik kontrol, farklı bölümler ve cihazına kaydedilen rekorlar.</p><div class="v18GameList">${[['castle','Kale Atışı','Açıyı ayarla, blok kaleyi dağıt.'],['arrows','Ok Yolu','Çıkışı açık okları doğru sırayla seç.'],['wood','Ahşap Atölyesi','Sanal parçayı hedef şekle yaklaştır.'],['hole','Yutan Halka','Küçük parçaları topla ve büyü.'],['territory','Bölge Akışı','Gücünü dağıt, haritayı ele geçir.'],['blocks','Renkli Rota','Blokları eşleşen çıkışlara kaydır.']].map(([id,title,desc],i)=>`<a href="./arcade/#${id}"><span>0${i+1}</span><div><b>${title}</b><small>${desc}</small></div><span>→</span></a>`).join('')}</div></section>
  `);
  document.body.insertAdjacentHTML('beforeend', `<nav id="v18Nav" class="v18Nav hidden" aria-label="Mobil ana menü"><button data-v18-open="pocket"><span>⌂</span>Ana ekran</button><button data-v18-open="today"><span>☀</span>Bugün</button><button data-v18-quick="task" class="v18Add"><span>＋</span>Ekle</button><a href="./arcade/"><span>◈</span>Oyunlar</a><button data-v18-open="apps"><span>▦</span>Tümü</button></nav>`);
  q('#authView .authCard')?.insertAdjacentHTML('afterend','<a class="v18GuestGame" href="./arcade/">◈ Oyun Odasını aç</a>');
  q('[data-page="settings"]')?.insertAdjacentHTML('afterbegin','<div class="v18Install"><h3>YEA cebinde</h3><p>iPhone: Safari → Paylaş → Ana Ekrana Ekle.<br>Android: tarayıcı menüsü → Uygulamayı yükle / Ana ekrana ekle.</p><p>Görev ve finans kayıtları mevcut YEA hesabında; oyun ilerlemesi ve favoriler yalnız bu cihazda tutulur.</p><a href="./arcade/">Oyun ilerlemesini yedekle →</a></div>');
  modules = qa('#tabs [data-tab]').filter(b => !['pocket','apps'].includes(b.dataset.tab)).map(b=>({id:b.dataset.tab, title:b.textContent.trim().replace(/^[^\p{L}\p{N}]+/u,'')}));
  function status(text) { q('#v18Network').textContent = text; }
  function network() { status(navigator.onLine ? '' : 'Çevrimdışısın. Bulut kayıtları için bağlantı gerekir; önceden yüklenmiş oyunlar çalışabilir.'); }
  function renderModules() {
    const term = q('#v18Search').value.trim().toLocaleLowerCase('tr');
    const rows = modules.filter(m=>m.title.toLocaleLowerCase('tr').includes(term));
    q('#v18Modules').innerHTML = rows.map(m=>`<div class="v18ModuleRow"><button data-v18-open="${esc(m.id)}"><span class="v18ModuleIcon">${icons[m.id]||'▣'}</span><b>${esc(m.title)}</b></button><button data-v18-favorite="${esc(m.id)}" aria-label="${esc(m.title)} favorisi" aria-pressed="${favorites.includes(m.id)}" class="v18Star">${favorites.includes(m.id)?'★':'☆'}</button></div>`).join('') || '<p class="v18Muted">Eşleşen modül yok.</p>';
    q('#v18Favorites').innerHTML = favorites.map(id=>modules.find(m=>m.id===id)).filter(Boolean).map(m=>`<button data-v18-open="${esc(m.id)}"><span>${icons[m.id]||'▣'}</span><b>${esc(m.title)}</b></button>`).join('') || '<button data-v18-open="apps">Favori modül seç</button>';
  }
  function renderPocket() {
    if (document.hidden || app.classList.contains('hidden')) return;
    q('#v18Date').textContent = new Intl.DateTimeFormat('tr-TR',{timeZone:'Europe/Istanbul',weekday:'long',day:'numeric',month:'long'}).format(new Date());
    const list = (typeof tasks !== 'undefined' ? tasks : []).filter(t=>t.status!=='done'&&t.status!=='archived');
    q('#v18TaskCount').textContent = list.length;
    const month = new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit'}).format(new Date());
    const balance = (typeof finance !== 'undefined' ? finance : []).filter(f=>String(f.entry_date).startsWith(month)).reduce((sum,f)=>sum+(f.entry_type==='income'?1:-1)*Number(f.amount||0),0);
    q('#v18Balance').textContent = new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(balance);
    const top = [...list].sort((a,b)=>Number(a.priority||2)-Number(b.priority||2)||(a.due_at||'9999').localeCompare(b.due_at||'9999')).slice(0,3);
    q('#v18Tasks').innerHTML = top.length ? top.map(t=>`<div class="v18Task"><button data-v18-complete="${esc(t.id)}" aria-label="${esc(t.title)} görevini tamamla">✓</button><button data-v18-open="tasks"><b>${esc(t.title)}</b><small>${t.due_at?esc(fmtDate(t.due_at)):'Tarih belirtilmedi'}${Number(t.priority)===1?' · Öncelikli':''}</small></button></div>`).join('') : '<div class="v18Empty">Açık görev görünmüyor.<button data-v18-quick="task">İlk görevini ekle →</button></div>';
  }
  const oldGoto = goto;
  goto = function(tab) {
    if (narrow() && tab==='desktop' && !explicitDesktop) tab='pocket';
    if (!qa('[data-page]').some(p=>p.dataset.page===tab)) return;
    route=tab; oldGoto(tab);
    qa('#v18Nav [data-v18-open]').forEach(b=>{const active=b.dataset.v18Open===tab;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    if(tab==='pocket')renderPocket();
    if(tab==='apps')renderModules();
  };
  function open(tab, push=true) {
    if(tab==='desktop')explicitDesktop=true;
    if(tab==='history')q('#tabs [data-tab="history"]')?.click();
    else window.v13AppOpen(tab);
    if(push && location.hash!==`#${tab}`)history.pushState(null,'',`#${tab}`);
    q(`[data-page="${CSS.escape(tab)}"] h1, [data-page="${CSS.escape(tab)}"] h2`)?.setAttribute('tabindex','-1');
  }
  document.addEventListener('click',async e=>{
    const openBtn=e.target.closest('[data-v18-open]');if(openBtn){open(openBtn.dataset.v18Open);return;}
    const quick=e.target.closest('[data-v18-quick]');if(quick){lastFocus=quick;v12OpenQuick(quick.dataset.v18Quick);return;}
    const fav=e.target.closest('[data-v18-favorite]');if(fav){const id=fav.dataset.v18Favorite;favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id].slice(-10);try{localStorage.setItem(prefKey,JSON.stringify(favorites));}catch{status('Favoriler kaydedilemedi. Cihaz depolaması dolu veya kapalı olabilir.');}renderModules();return;}
    const done=e.target.closest('[data-v18-complete]');if(done){done.disabled=true;try{await patchTask(done.dataset.v18Complete,{status:'done'});renderPocket();}catch(err){status('Görev kaydedilemedi: '+err.message);done.disabled=false;}}
  });
  // Desktop icons retain their original desktop behavior; touch users get one-tap opening.
  q('#v13DesktopGrid')?.addEventListener('click',e=>{if(!narrow())return;const b=e.target.closest('.v13DeskIcon');if(b)b.dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));});
  q('#v13DeskModalBody')?.addEventListener('click',e=>{if(narrow()){const b=e.target.closest('[data-v13-folder-item]');if(b)b.dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));}});
  q('#v18Search').addEventListener('input',renderModules);
  const quickModal=q('#v12QuickModal'),quickHeading=q('#v12QuickModal .v12ModalHead b');
  if(quickHeading){quickHeading.id='v18QuickHeading';quickModal.setAttribute('aria-labelledby','v18QuickHeading');}
  q('#v12QuickClose')?.setAttribute('aria-label','Hızlı kayıt penceresini kapat');
  quickModal?.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const controls=[...quickModal.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])')].filter(el=>el.getClientRects().length);const first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}});
  const refreshObserver=new MutationObserver(()=>requestAnimationFrame(renderPocket));
  ['#taskList','#financeList'].forEach(s=>{const el=q(s);if(el)refreshObserver.observe(el,{childList:true});});
  let entered=false;
  function syncAuth() {
    const signedIn=!app.classList.contains('hidden');q('#v18Nav').classList.toggle('hidden',!signedIn);
    if(signedIn&&!entered){entered=true;const hash=location.hash.slice(1);open(qa('[data-page]').some(p=>p.dataset.page===hash)?hash:narrow()?'pocket':'home',false);}
    if(!signedIn)entered=false;
    renderPocket();
  }
  new MutationObserver(syncAuth).observe(app,{attributes:true,attributeFilter:['class']});
  addEventListener('popstate',()=>open(location.hash.slice(1)||'pocket',false));
  addEventListener('online',network);addEventListener('offline',network);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){network();renderPocket();}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!q('#v12QuickModal').classList.contains('hidden')){v12CloseQuick();lastFocus?.focus();}});
  // Older bootstrap files may register after load; register explicitly for this entry point.
  if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
  const footer=q('footer');if(footer)footer.textContent='YEA Suite 1.8 · Mobil merkez · RPYS’den bağımsız';
  renderModules();network();syncAuth();
})();
