(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const frame = $('#rpysFrame');
  const loading = $('#loading');
  const loadingText = $('#loadingText');
  const loader = $('#loader');
  const errorBox = $('#error');
  const retry = $('#retry');
  const mobileApp = $('#mobileApp');
  const bottomNav = $('#bottomNav');
  const closeWorkspace = $('#closeWorkspace');
  const CACHE_KEY = 'rpys_cep_snapshot_v2';
  const QUEUE_KEY = 'rpys_cep_queue_v2';
  const BRIDGE_ID = 'rpys-cep-bridge-v2';
  let ready = false;
  let authenticated = false;
  let checks = 0;
  let readinessTimer;
  let sessionTimer;
  let snapshot = loadJson(CACHE_KEY, null);
  let alertFilter = 'all';
  let toastTimer;
  let lastSnapshotAt = 0;

  function loadJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || '') || fallback; } catch (_) { return fallback; } }
  function saveJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  function esc(value) { return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function norm(value) { return String(value || '').toLocaleUpperCase('tr-TR').replace(/[ÇĞİÖŞÜ]/g, c => ({Ç:'C',Ğ:'G',İ:'I',Ö:'O',Ş:'S',Ü:'U'}[c])).replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function localDate(date = new Date()) { const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0'); return `${y}-${m}-${d}`; }
  function localDateTime(date = new Date()) { const offset=date.getTimezoneOffset(); return new Date(date.getTime()-offset*60000).toISOString().slice(0,16); }
  function trDate(value, options={day:'2-digit',month:'long',year:'numeric'}) { try { return new Date(`${String(value).slice(0,10)}T12:00:00`).toLocaleDateString('tr-TR', options); } catch (_) { return value || '—'; } }
  function toast(message) { const el=$('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),2600); }
  function makeId() { return crypto.randomUUID ? crypto.randomUUID() : `m-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
  function mediaDb() { return new Promise((resolve,reject)=>{const req=indexedDB.open('RPYS_CEP_MEDIA_V2',1);req.onupgradeneeded=()=>req.result.createObjectStore('photos');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);}); }
  async function savePhoto(id,file) { const db=await mediaDb(); await new Promise((resolve,reject)=>{const tx=db.transaction('photos','readwrite');tx.objectStore('photos').put(file,id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close(); }
  async function readPhoto(id) { const db=await mediaDb(),value=await new Promise((resolve,reject)=>{const req=db.transaction('photos').objectStore('photos').get(id);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);});db.close();return value; }

  function getInnerDocument() { try { return frame.contentDocument || frame.contentWindow.document; } catch (_) { return null; } }
  function loginIsVisible(doc) { const overlay=doc?.getElementById('loginOverlay'); if(!overlay) return false; try { return frame.contentWindow.getComputedStyle(overlay).display !== 'none'; } catch (_) { return overlay.style.display !== 'none'; } }
  function findPageButton(doc, page) { return doc.querySelector(`.sidebar .nav[data-p="${page}"]`) || doc.querySelector(`[data-p="${page}"]`) || doc.querySelector(`a[href="#${page}"]`); }
  function canOpenPage(doc, page) { if(!doc || loginIsVisible(doc)) return false; try { const checker=frame.contentWindow.userCan; if(typeof checker==='function') return Boolean(checker(page)); } catch (_) {} const target=findPageButton(doc,page); return Boolean(target && target.style.display!=='none' && !target.hidden); }

  function injectMobileSafety(doc) {
    if(doc.getElementById('rpys-cep-shell-style')) return;
    const style=doc.createElement('style'); style.id='rpys-cep-shell-style'; style.textContent='@media(max-width:900px){body{padding-bottom:76px!important}.main{padding-bottom:92px!important}.rpysFixedTools{bottom:78px!important}button,.btn,a.nav{touch-action:manipulation}}'; doc.head.appendChild(style);
  }

  function installBridge(doc) {
    if(doc.getElementById(BRIDGE_ID)) return true;
    const script=doc.createElement('script');
    script.id=BRIDGE_ID;
    script.textContent=`(()=>{if(window.__RPYS_MOBILE_V2__)return;
      const clean=(v,n=500)=>String(v??'').replace(/[<>]/g,'').trim().slice(0,n);
      const clone=v=>JSON.parse(JSON.stringify(v));
      const auth=()=>{if(!currentUser)throw new Error('Oturum gerekli.');return currentUser};
      const store=()=>{if(!db.rpysMobileV2||typeof db.rpysMobileV2!=='object')db.rpysMobileV2={version:2,requests:[],devices:[]};if(!Array.isArray(db.rpysMobileV2.requests))db.rpysMobileV2.requests=[];if(!Array.isArray(db.rpysMobileV2.devices))db.rpysMobileV2.devices=[];return db.rpysMobileV2};
      const id=()=>crypto.randomUUID?crypto.randomUUID():'m-'+Date.now()+'-'+Math.random().toString(36).slice(2);
      const commit=label=>{try{if(typeof logAction==='function')logAction(label)}catch(_){}save()};
      const can=m=>{try{return typeof userCan==='function'?!!userCan(m):false}catch(_){return false}};
      const manager=()=>!!currentUser&&currentUser.role==='admin';
      window.__RPYS_MOBILE_V2__={
        version:2,
        snapshot(){const u=auth(),today=new Date(),td=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');let assignments=[],issues=[],fair=[];
          try{assignments=(typeof allAssignmentsAllMonths==='function'?allAssignmentsAllMonths():assignmentsMonth()).map(a=>({date:a.date,day:Number(a.day),type:a.type,personId:a.person?.id,person:a.person?.name||'',unit:a.col?.unit||'',shift:a.col?.shift||'',hours:Number(a.col?.hours||0),category:a.col?.cat||''}))}catch(_){}
          if(can('analiz'))try{issues=(typeof buildIssues==='function'?buildIssues():[]).slice(0,80).map((x,i)=>({id:String(x.id||i),severity:String(x.sev||x.level||'warn').toLowerCase(),category:String(x.cat||x.category||''),text:clean(x.text||x.reason||x.message||x.label||'Kontrol uyarısı',300)}))}catch(_){}
          if(can('adalet'))try{fair=(typeof fairnessStats==='function'?fairnessStats():[]).map(x=>({person:x.p?.name||'',personId:x.p?.id,total:Number(x.total||0),required:Number(x.muk||0),missing:Number(x.missing||0),over:Number(x.over||0),score:Number(x.score??100)}))}catch(_){}
          let leaves=(db.leaves||[]).filter(l=>l.start<=td&&l.end>=td).map(l=>({personId:l.personId,person:(typeof getPersonById==='function'?getPersonById(l.personId)?.name:'')||'',type:l.type||'İzin',start:l.start,end:l.end}));
          const s=store();return clone({generatedAt:new Date().toISOString(),today:td,selectedMonth:typeof ym==='function'?ym():td.slice(0,7),user:{username:u.username||'',role:u.role||'',isManager:manager()},permissions:{dashboard:can('dashboard'),nobet:can('nobet'),saymanlik:can('saymanlik'),izin:can('izin'),analiz:can('analiz'),adalet:can('adalet'),raporlar:can('raporlar'),ayarlar:can('ayarlar')},assignments,leaves,issues,fairness:fair,requests:s.requests.slice(-200).reverse(),devices:s.devices.slice(-200).reverse()})},
        createRequest(input){const u=auth(),s=store(),r={id:clean(input.id,80)||id(),type:clean(input.type,80),date:clean(input.date,10),detail:clean(input.detail),status:'pending',createdBy:clean(u.username,80),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};if(!r.type||!r.date||!r.detail)throw new Error('Talep bilgileri eksik.');const old=s.requests.find(x=>String(x.id)===r.id);if(old)return clone(old);s.requests.push(r);if(s.requests.length>500)s.requests.splice(0,s.requests.length-500);commit('Mobil talep oluşturuldu: '+r.type);return clone(r)},
        createDevice(input){const u=auth(),s=store(),r={id:clean(input.id,80)||id(),name:clean(input.name,120),recipient:clean(input.recipient,120),date:clean(input.date,30),condition:clean(input.condition,60),note:clean(input.note),hasLocalPhoto:!!input.hasLocalPhoto,status:'open',createdBy:clean(u.username,80),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};if(!r.name||!r.recipient||!r.date)throw new Error('Teslim bilgileri eksik.');const old=s.devices.find(x=>String(x.id)===r.id);if(old)return clone(old);s.devices.push(r);if(s.devices.length>500)s.devices.splice(0,s.devices.length-500);commit('Mobil cihaz teslim kaydı: '+r.name);return clone(r)},
        setStatus(kind,recordId,status){auth();if(!manager())throw new Error('Bu işlem için yönetici yetkisi gerekli.');const s=store(),arr=kind==='request'?s.requests:s.devices,r=arr.find(x=>String(x.id)===String(recordId));if(!r)throw new Error('Kayıt bulunamadı.');const allowed=kind==='request'?['approved','rejected','pending']:['open','completed'];if(!allowed.includes(status))throw new Error('Geçersiz durum.');r.status=status;r.updatedAt=new Date().toISOString();r.reviewedBy=currentUser.username||'';commit('Mobil kayıt durumu güncellendi: '+status);return clone(r)}
      };window.dispatchEvent(new CustomEvent('rpys-mobile-bridge-ready'));})();`;
    doc.body.appendChild(script);
    return Boolean(frame.contentWindow.__RPYS_MOBILE_V2__);
  }

  function bridge() { try { return frame.contentWindow.__RPYS_MOBILE_V2__ || null; } catch (_) { return null; } }
  function safeSnapshot() { const b=bridge(); if(!b) return null; try { const data=b.snapshot(); saveJson(CACHE_KEY,data); return data; } catch (_) { return null; } }

  function finishLoading(doc) { injectMobileSafety(doc); ready=true; checks=0; clearInterval(readinessTimer); loading.style.display='none'; startSessionSync(); }
  function showFailure(message) { clearInterval(readinessTimer); loadingText.textContent='RPYS Cep açılamadı.'; loader.style.display='none'; errorBox.style.display='block'; retry.style.display='block'; errorBox.textContent=message; }
  function checkReady() { checks+=1; const doc=getInnerDocument(); if(doc?.querySelector('main.main') && doc.querySelector('.sidebar')) return finishLoading(doc); if(checks>120) showFailure('Bağlantıyı kontrol edip Tekrar Dene düğmesine basın.'); }
  function startReadinessCheck() { ready=false; authenticated=false; checks=0; clearInterval(readinessTimer); clearInterval(sessionTimer); readinessTimer=setInterval(checkReady,500); checkReady(); }

  function setAuthenticated(on) {
    authenticated=on; document.body.classList.toggle('authenticated',on);
    if(!on){document.body.classList.remove('workspace');mobileApp.hidden=true;bottomNav.hidden=true;closeWorkspace.hidden=true;return;}
    mobileApp.hidden=false;bottomNav.hidden=false;
  }

  function syncSession() {
    const doc=getInnerDocument(); if(!ready||!doc) return;
    const signedIn=!loginIsVisible(doc); if(!signedIn){setAuthenticated(false);return;}
    installBridge(doc); setAuthenticated(true); if(!lastSnapshotAt||Date.now()-lastSnapshotAt>15000){const fresh=safeSnapshot();lastSnapshotAt=Date.now();if(fresh){snapshot=fresh;flushQueue();renderAll();}}
  }
  function startSessionSync() { clearInterval(sessionTimer); sessionTimer=setInterval(syncSession,1000); syncSession(); }

  function setOnlineState() { document.body.classList.toggle('is-offline',!navigator.onLine); updateSyncBadge(); if(navigator.onLine) flushQueue(); }
  function updateSyncBadge() { const queued=loadJson(QUEUE_KEY,[]).length,badge=$('#syncBadge'); badge.className='sync-badge '+(!navigator.onLine?'offline':queued?'pending':''); badge.querySelector('span').textContent=!navigator.onLine?'Çevrimdışı':queued?`${queued} bekliyor`:'Bağlı'; }
  function queueAction(action) { const q=loadJson(QUEUE_KEY,[]); q.push({...action,queuedAt:new Date().toISOString()}); saveJson(QUEUE_KEY,q); updateSyncBadge(); }
  function flushQueue() { const b=bridge(),q=loadJson(QUEUE_KEY,[]); if(!navigator.onLine||!b||!q.length)return; const left=[]; q.forEach(item=>{try{if(item.kind==='request')b.createRequest(item.payload);else if(item.kind==='device')b.createDevice(item.payload)}catch(_){left.push(item)}}); saveJson(QUEUE_KEY,left); updateSyncBadge(); if(left.length!==q.length){snapshot=safeSnapshot()||snapshot;renderAll();} }

  function renderAll() { if(!snapshot)return; renderPermissionLinks(); renderToday(); renderAlerts(); renderRequests(); renderDevices(); updateSyncBadge(); $('#offlineDetail').textContent=`Son güvenli görünüm: ${new Date(snapshot.generatedAt||Date.now()).toLocaleString('tr-TR')}`; }
  function renderPermissionLinks() { $$('[data-open-page]').forEach(el=>{const page=el.dataset.openPage,perms=snapshot?.permissions||{};el.hidden=Object.prototype.hasOwnProperty.call(perms,page)&&perms[page]===false;}); }

  function renderToday() {
    const today=snapshot.today||localDate(),duties=(snapshot.assignments||[]).filter(a=>a.date===today),leaves=snapshot.leaves||[],warnings=allAlerts();
    $('#heroDate').textContent=new Date(`${today}T12:00:00`).toLocaleDateString('tr-TR',{weekday:'long',day:'2-digit',month:'long'});
    $('#heroGreeting').textContent=`İyi çalışmalar${snapshot.user?.username?' '+snapshot.user.username:''}`;
    $('#todayCount').textContent=duties.length;$('#awayCount').textContent=leaves.length;$('#warningCount').textContent=warnings.length;
    $('#todayList').innerHTML=duties.length?duties.sort((a,b)=>String(a.shift).localeCompare(String(b.shift),'tr')).map(a=>`<article class="duty-card"><div class="time-box"><b>${esc(String(a.shift||'Görev').split(/[–-]/)[0])}</b><small>${esc(a.hours?`${a.hours} saat`:'Plan')}</small></div><div class="card-body"><b>${esc(a.person)}</b><p>${esc(a.unit)} • ${esc(a.shift||'Vardiya')}</p></div><i class="unit-dot"></i></article>`).join(''):'<div class="empty">Bugün için görev kaydı bulunmuyor.</div>';
    $('#alertPreview').innerHTML=warnings.length?warnings.slice(0,3).map(alertHtml).join(''):'<div class="empty">Belirgin bir uyarı yok.</div>';
  }

  function allAlerts() {
    const base=(snapshot?.issues||[]).map(x=>({...x,kind:x.severity.includes('high')||x.severity.includes('bad')?'high':'warn'}));
    const fair=(snapshot?.fairness||[]).filter(x=>x.missing>0||x.score<75).map(x=>({id:`fair-${x.personId}`,kind:'fair',category:'fair',text:x.missing>0?`${x.person}: mükellefi ${x.missing} saat eksik.`:`${x.person}: adalet puanı ${x.score}/100.`}));
    return [...base,...fair].slice(0,120);
  }
  function alertHtml(a) { const kind=a.kind==='high'?'high':a.kind==='fair'?'fair':''; return `<article class="alert-card ${kind}"><div class="alert-icon">${a.kind==='high'?'!':a.kind==='fair'?'⚖':'i'}</div><div class="card-body"><b>${a.kind==='high'?'Kritik kontrol':a.kind==='fair'?'Adalet / mükellef':'Plan uyarısı'}</b><p>${esc(a.text)}</p></div></article>`; }
  function renderAlerts() { const alerts=allAlerts(),fair=snapshot.fairness||[]; $('#criticalCount').textContent=alerts.filter(a=>a.kind==='high').length; $('#missingCount').textContent=fair.filter(x=>x.missing>0).length; $('#lowFairCount').textContent=fair.filter(x=>x.score<75).length; const filtered=alertFilter==='all'?alerts:alerts.filter(a=>a.kind===alertFilter); $('#alertList').innerHTML=filtered.length?filtered.map(alertHtml).join(''):'<div class="empty">Bu filtrede uyarı bulunmuyor.</div>'; }

  function statusLabel(status) { return ({pending:'Bekliyor',approved:'Onaylandı',rejected:'Reddedildi',open:'Açık',completed:'Tamamlandı'})[status]||status; }
  function managerActions(kind,r) { if(!snapshot?.user?.isManager)return ''; if(kind==='request'&&r.status==='pending')return `<div class="record-actions"><button data-status="approved" data-kind="request" data-id="${esc(r.id)}">Onayla</button><button data-status="rejected" data-kind="request" data-id="${esc(r.id)}">Reddet</button></div>`; if(kind==='device'&&r.status==='open')return `<div class="record-actions"><button data-status="completed" data-kind="device" data-id="${esc(r.id)}">Teslimi Kapat</button></div>`; return ''; }
  function renderRequests() { const records=snapshot?.requests||[]; $('#requestList').innerHTML=records.length?records.map(r=>`<article class="record-card"><div class="card-body"><b>${esc(r.type)} • ${esc(trDate(r.date))}</b><p>${esc(r.detail)}<br>${esc(r.createdBy)} • ${esc(new Date(r.createdAt).toLocaleString('tr-TR'))}</p>${managerActions('request',r)}</div><span class="record-status ${esc(r.status)}">${statusLabel(r.status)}</span></article>`).join(''):'<div class="empty">Henüz talep yok.</div>'; }
  function renderDevices() { const records=snapshot?.devices||[]; $('#deviceList').innerHTML=records.length?records.map(r=>`<article class="record-card"><div class="card-body"><b>${esc(r.name)} → ${esc(r.recipient)}</b><p>${esc(r.condition)} • ${esc(new Date(r.date).toLocaleString('tr-TR'))}${r.note?`<br>${esc(r.note)}`:''}${r.hasLocalPhoto?' • Fotoğraf eklendi':''}</p><div class="record-actions">${r.hasLocalPhoto?`<button data-photo="${esc(r.id)}">Fotoğrafı Aç</button>`:''}</div>${managerActions('device',r)}</div><span class="record-status ${esc(r.status)}">${statusLabel(r.status)}</span></article>`).join(''):'<div class="empty">Henüz cihaz teslim kaydı yok.</div>'; }

  function showTab(tab) { $$('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${tab}`)); $$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab)); const view=$(`#view-${tab}`); $('#viewTitle').textContent=view?.dataset.title||'RPYS Cep'; try{localStorage.setItem('rpys_cep_tab_v2',tab)}catch(_){} window.scrollTo({top:0,behavior:'smooth'}); }
  function openPage(page) { const doc=getInnerDocument(); if(!authenticated||!doc||!canOpenPage(doc,page)){toast('Bu modül için yetkiniz yok.');return;} const target=findPageButton(doc,page); if(!target){toast('Modül bulunamadı.');return;} target.click(); document.body.classList.add('workspace'); closeWorkspace.hidden=false; frame.style.visibility='visible'; frame.style.pointerEvents='auto'; frame.focus(); }
  function closeFullWorkspace() { document.body.classList.remove('workspace'); closeWorkspace.hidden=true; frame.style.visibility=''; frame.style.pointerEvents=''; snapshot=safeSnapshot()||snapshot; renderAll(); }

  function createRecord(kind,payload) { payload={id:payload.id||makeId(),...payload};const b=bridge(); if(navigator.onLine&&b){const rec=kind==='request'?b.createRequest(payload):b.createDevice(payload); snapshot=safeSnapshot()||snapshot;renderAll();return rec;} queueAction({kind,payload}); const local={...payload,status:kind==='request'?'pending':'open',createdBy:snapshot?.user?.username||'Bu cihaz',createdAt:new Date().toISOString(),queued:true}; const key=kind==='request'?'requests':'devices'; snapshot[key]=[local,...(snapshot[key]||[])];saveJson(CACHE_KEY,snapshot);renderAll();return local; }
  function updateStatus(button) { const b=bridge(); if(!b)return toast('Bağlantı kurulunca tekrar deneyin.'); try{b.setStatus(button.dataset.kind,button.dataset.id,button.dataset.status);snapshot=safeSnapshot()||snapshot;renderAll();toast('Durum güncellendi.');}catch(err){toast(err.message||'İşlem tamamlanamadı.');} }

  function assistantAnswer(question) {
    const q=norm(question),assign=snapshot?.assignments||[],today=snapshot?.today||localDate(),fair=snapshot?.fairness||[];
    if(q.includes('BUGUN')||q.includes('NERED')){const a=assign.filter(x=>x.date===today);return a.length?`${trDate(today,{weekday:'long',day:'2-digit',month:'long'})}:\n`+a.map(x=>`• ${x.person} — ${x.unit}, ${x.shift}`).join('\n'):'Bugün için görev kaydı görünmüyor.';}
    if(q.includes('MUKELLEF')||q.includes('EKSIK')){const a=fair.filter(x=>x.missing>0).sort((x,y)=>y.missing-x.missing);return a.length?'Mükellefi eksik personeller:\n'+a.map(x=>`• ${x.person}: ${x.missing} saat eksik`).join('\n'):'Mükellefi eksik personel görünmüyor.';}
    if(q.includes('BT')&&(q.includes('EN COK')||q.includes('FAZLA'))){const c={};assign.filter(x=>norm(x.unit).includes('BILGISAYARLI TOMOGRAFI')||norm(x.unit)==='BT').forEach(x=>c[x.person]=(c[x.person]||0)+1);const a=Object.entries(c).sort((x,y)=>y[1]-x[1]);return a.length?`En çok BT görevi: ${a[0][0]} (${a[0][1]} görev).\n`+a.slice(1,5).map(x=>`• ${x[0]}: ${x[1]}`).join('\n'):'Seçili veride BT görevi görünmüyor.';}
    if(q.includes('IZIN')){const a=snapshot?.leaves||[];return a.length?'Bugün izinli/raporlu:\n'+a.map(x=>`• ${x.person} — ${x.type}`).join('\n'):'Bugün izinli veya raporlu personel görünmüyor.';}
    if(q.includes('UYARI')||q.includes('SORUN')){const a=allAlerts();return a.length?`Toplam ${a.length} uyarı var:\n`+a.slice(0,6).map(x=>`• ${x.text}`).join('\n'):'Belirgin bir uyarı görünmüyor.';}
    return 'Bu mobil sürümde RPYS verisiyle ilgili “bugün kim nerede”, “izinli kim”, “mükellefi eksik kim”, “uyarılar” ve “en çok BT yapan kim” sorularını yanıtlayabilirim.';
  }

  $('#requestForm').addEventListener('submit',e=>{e.preventDefault();try{createRecord('request',{type:$('#requestType').value,date:$('#requestDate').value,detail:$('#requestDetail').value});e.target.reset();$('#requestDate').value=localDate();toast('Talep kaydedildi.');}catch(err){toast(err.message||'Talep kaydedilemedi.');}});
  $('#deviceForm').addEventListener('submit',async e=>{e.preventDefault();try{const file=$('#devicePhoto').files[0],rec=createRecord('device',{id:makeId(),name:$('#deviceName').value,recipient:$('#deviceRecipient').value,date:$('#deviceDate').value,condition:$('#deviceCondition').value,note:$('#deviceNote').value,hasLocalPhoto:Boolean(file)});if(file)await savePhoto(rec.id,file);e.target.reset();$('#deviceDate').value=localDateTime();$('#photoStatus').textContent='İsteğe bağlı • yalnız bu cihazda saklanır';toast('Cihaz teslimi kaydedildi.');}catch(err){toast(err.message||'Kayıt oluşturulamadı.');}});
  $('#devicePhoto').addEventListener('change',e=>{$('#photoStatus').textContent=e.target.files[0]?`${e.target.files[0].name} seçildi • cihazda kalır`:'İsteğe bağlı • yalnız bu cihazda saklanır';});
  $('#assistantForm').addEventListener('submit',e=>{e.preventDefault();const q=$('#assistantInput').value.trim();if(!q)return;$('#assistantAnswer').textContent=assistantAnswer(q);$('#assistantInput').value='';});
  $$('.suggestions [data-question]').forEach(b=>b.addEventListener('click',()=>{$('#assistantAnswer').textContent=assistantAnswer(b.dataset.question);}));
  $$('[data-tab]').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
  $$('[data-open-page]').forEach(b=>b.addEventListener('click',()=>openPage(b.dataset.openPage)));
  $$('.chip[data-alert-filter]').forEach(b=>b.addEventListener('click',()=>{alertFilter=b.dataset.alertFilter;$$('.chip[data-alert-filter]').forEach(x=>x.classList.toggle('active',x===b));renderAlerts();}));
  document.addEventListener('click',async e=>{const status=e.target.closest('[data-status]');if(status)return updateStatus(status);const photo=e.target.closest('[data-photo]');if(photo)try{const file=await readPhoto(photo.dataset.photo);if(!file)return toast('Fotoğraf yalnız kaydın oluşturulduğu telefonda bulunur.');const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000)}catch(_){toast('Fotoğraf açılamadı.');}});
  $('#openFullRpys').addEventListener('click',()=>{const doc=getInnerDocument();const page=['dashboard','nobet','saymanlik','izin'].find(p=>canOpenPage(doc,p));if(page)openPage(page);else toast('Açılabilir modül bulunamadı.');});
  closeWorkspace.addEventListener('click',closeFullWorkspace);
  $('#refresh').addEventListener('click',()=>{snapshot=safeSnapshot()||snapshot;renderAll();toast('Güncellendi.');});
  $('#exportMobile').addEventListener('click',()=>{const data={exportedAt:new Date().toISOString(),requests:snapshot?.requests||[],devices:snapshot?.devices||[]},blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`RPYS_CEP_KAYITLARI_${localDate()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});
  retry.addEventListener('click',()=>{loadingText.textContent='Güncel ve güvenli RPYS açılıyor…';loader.style.display='block';errorBox.style.display='none';retry.style.display='none';frame.src=`../?rpys_mobile_shell=1&t=${Date.now()}`;startReadinessCheck();});
  window.addEventListener('online',setOnlineState);window.addEventListener('offline',setOnlineState);frame.addEventListener('load',startReadinessCheck);
  $('#requestDate').value=localDate();$('#deviceDate').value=localDateTime();setOnlineState();if(snapshot)renderAll();startReadinessCheck();
  try{showTab(localStorage.getItem('rpys_cep_tab_v2')||'today')}catch(_){showTab('today')}
  if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
})();
