(()=>{
if(window.__RPYS322)return;window.__RPYS322=1;
const Q=(s,r=document)=>r.querySelector(s), QA=(s,r=document)=>Array.from(r.querySelectorAll(s));
const UP=s=>String(s||'').trim().toLocaleUpperCase('tr-TR');
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const reset=()=>{try{_assignCache={};_allAssignCache=null;_calcCache={}}catch(e){}};
const monthLast=mk=>{let [y,m]=String(mk).split('-').map(Number);return new Date(y,m,0).getDate()};
const slotId=(type,col)=>`${type}|${col.key}`;
function allSlots322(){let out=[];try{out.push(...dutyColumns('pol',{includeDisabled:true}).map(c=>({type:'pol',col:c})),...dutyColumns('acil',{includeDisabled:true}).map(c=>({type:'acil',col:c})))}catch(e){}return out}
function trackingStore322(){
  db.polTracking322=db.polTracking322||{};let mk=ym();
  if(!db.polTracking322[mk]){
    let slots=allSlots322().filter(x=>{
      let u=UP(x.col.unit);return ['POLİKLİNİK RÖNTGEN','RUTİN PORTABL','MAMOGRAFİ','KEMİK ÖLÇÜMÜ'].includes(u)&&n(x.col.hours)<22
    }).map(x=>slotId(x.type,x.col));
    db.polTracking322[mk]={slots,start:`${mk}-01`,end:`${mk}-${String(monthLast(mk)).padStart(2,'0')}`}
  }
  let c=db.polTracking322[mk];if(!Array.isArray(c.slots))c.slots=[];
  if(!c.start)c.start=`${mk}-01`;if(!c.end)c.end=`${mk}-${String(monthLast(mk)).padStart(2,'0')}`;
  return c
}
function assignmentInTracking322(a,c=trackingStore322()){
  return !!(a&&a.date>=c.start&&a.date<=c.end&&c.slots.includes(`${a.type}|${a.col?.key}`))
}
function polDayCount322(pid){let c=trackingStore322();try{return allAssignmentsAllMonths().filter(a=>Number(a.person.id)===Number(pid)&&assignmentInTracking322(a,c)).length}catch(e){return 0}}
function currentMetricCount322(pid,metric){
  try{
    if(metric==='polDay322')return polDayCount322(pid);
    if(typeof resolvedMonthMetric==='function')return n(resolvedMonthMetric(metric,pid,ym()));
    return assignmentsMonth().filter(a=>Number(a.person.id)===Number(pid)&&(
      metric==='mammo'?UP(a.col?.unit)==='MAMOGRAFİ':
      metric==='skopiDay'?UP(a.col?.unit)==='PORTABL + SKOPİ'&&a.col?.key==='sk1':
      metric==='skopiNobet'?UP(a.col?.unit)==='PORTABL + SKOPİ'&&a.col?.key==='sk2':
      metric==='skopiWeekend'?UP(a.col?.unit)==='PORTABL + SKOPİ'&&a.col?.key==='sk2'&&[0,6].includes(new Date(a.date+'T12:00:00').getDay()):false
    )).length
  }catch(e){return 0}
}
function explicitTarget322(pid,metric){
  if(metric==='polDay322')return 0;
  try{let r=netManual(metric,pid),v=n(r?.obligation);return v>0?v:0}catch(e){return 0}
}
function metricForCell322(col,d){
  let u=UP(col?.unit),key=String(col?.key||''),w=new Date(dateStr(d)+'T12:00:00').getDay();
  if(u==='MAMOGRAFİ')return {metric:'mammo',label:'Mamografi'};
  if(u==='PORTABL + SKOPİ'){
    if(key==='sk1'||n(col?.hours)<22)return {metric:'skopiDay',label:'Skopi gündüz'};
    if(w===0||w===6)return {metric:'skopiWeekend',secondary:'skopiNobet',label:'Skopi hafta sonu'};
    return {metric:'skopiNobet',label:'Skopi nöbet'}
  }
  if(['POLİKLİNİK RÖNTGEN','RUTİN PORTABL','KEMİK ÖLÇÜMÜ'].includes(u))return {metric:'polDay322',label:'Poliklinik gündüz'};
  return null
}
function deficitInfo322(pid,col,d,people){
  let spec=metricForCell322(col,d);if(!spec)return {def:0,label:'',cur:0,target:0,secondaryDef:0};
  let cur=currentMetricCount322(pid,spec.metric),target=explicitTarget322(pid,spec.metric);
  if(!target)target=Math.max(cur,...people.map(p=>currentMetricCount322(p.id,spec.metric)));
  let def=Math.max(0,target-cur),secondaryDef=0;
  if(spec.secondary){let sc=currentMetricCount322(pid,spec.secondary),st=explicitTarget322(pid,spec.secondary);if(!st)st=Math.max(sc,...people.map(p=>currentMetricCount322(p.id,spec.secondary)));secondaryDef=Math.max(0,st-sc)}
  return {def,label:spec.label,cur,target,secondaryDef}
}
function idle322(pid,d){try{let ds=dateStr(d),last=lastWorkedDateBefore(pid,ds);if(!last)return 999;return Math.max(0,Math.round((new Date(ds+'T12:00:00')-new Date(last+'T12:00:00'))/86400000)-1)}catch(e){return 0}}
window.suitablePeopleForDutyV2413=function(){
  let cell=dutyContextCellV2413;if(!cell)return[];let type=cell.dataset.type,d=+cell.dataset.day,col=dutyColumnByKey(type,cell.dataset.col);if(!col)return[];
  let pool=currentPeople().filter(Boolean),allowed=pool.filter(p=>{try{return canTakeShiftV2414(p.id,d,col,col.unit)}catch(e){return false}});
  return allowed.map(p=>{let z=deficitInfo322(p.id,col,d,pool);return {p,...z,idle:idle322(p.id,d),spouseToday:(typeof spouseAssignedOnDay==='function'?!!spouseAssignedOnDay(p.id,d):false)}})
    .sort((a,b)=>b.def-a.def||b.secondaryDef-a.secondaryDef||Number(b.spouseToday)-Number(a.spouseToday)||b.idle-a.idle||a.p.name.localeCompare(b.p.name,'tr'))
};
window.renderSuitableDutyPeopleV2413=function(){
  let box=Q('#dutySuitableListV2413');if(!box)return;let cell=dutyContextCellV2413;if(!cell){box.innerHTML='Hücre seçilmedi.';box.style.display='block';return}
  let type=cell.dataset.type,d=+cell.dataset.day,col=dutyColumnByKey(type,cell.dataset.col),arr=suitablePeopleForDutyV2413();if(!col){box.innerHTML='Vardiya bulunamadı.';box.style.display='block';return}
  let spec=metricForCell322(col,d),sub=spec?` • ${spec.label} eksiğine göre sıralı`:'';
  box.innerHTML=`<div class="suitableHeadV2413"><b>${d}. gün • ${esc(col.unit)}</b><br><small>${esc(col.shift)}${esc(sub)}</small></div>`+
    (arr.length?arr.map(x=>`<button class="suitablePersonV2413" onclick="assignSuitableDutyV2413(${x.p.id})" style="${personColorStyle(x.p.id,false)}"><b>${esc(x.p.name)}</b><span>${x.label?`<strong>Eksik: ${x.def} gün</strong> • ${x.cur}/${x.target}`:''}${x.secondaryDef?` • Nöbet eksiği ${x.secondaryDef}`:''}${x.idle>=900?' • Önceki görev yok':` • ${x.idle} gündür boş`}${x.spouseToday?' • ♥ Eşi bugün görevde':''}</span></button>`).join(''):'<div class="suitableNoneV2413">Bu hücre için kurallara uygun personel yok.</div>');box.style.display='block'
};
window.assignSuitableDutyV2413=function(pid){let cells=(typeof selectedDutyCells!=='undefined'?selectedDutyCells:[]).filter(Boolean);if(cells.length>1&&typeof window.rpys322SafeBulk==='function')return window.rpys322SafeBulk(Number(pid),cells);let cell=dutyContextCellV2413;if(!cell)return;let col=dutyColumnByKey(cell.dataset.type,cell.dataset.col);if(!col||!canTakeShiftV2414(Number(pid),+cell.dataset.day,col,col.unit))return alert('Personel artık bu hücre için uygun değil.');setAssign(cell.dataset.type,+cell.dataset.day,cell.dataset.col,String(pid));closeRpysContextMenus()};

/* POLIKLINIK TRACKING */
function buildTracking322(){
  let page=Q('#takip');if(!page)return;let old=Q('#r320pol');if(old)old.style.display='none';old=Q('#r319pol');if(old)old.style.display='none';let x=Q('#rpys322PolTracking');if(!x){x=document.createElement('div');x.id='rpys322PolTracking';x.className='panel rpys322Track';page.insertBefore(x,page.firstElementChild?.nextSibling||page.firstChild)}
  let c=trackingStore322(),slots=allSlots322();x.innerHTML=`<div class="panelTitleRow"><div><h3>🏥 Poliklinik Gündüz Takibi • Dahil Edilecek Çalışmalar</h3><div class="smallhelp">Tüm birim/vardiyalar aşağıda. Kutucuğu sen seçersin; bu seçim Portable / Poliklinik / DEXA için Uygun Kişiler “Poliklinik gündüz eksiği” hesabında da kullanılır.</div></div><button class="btn alt" id="p322All">Tümünü Seç/Kaldır</button></div><div class="p322dates"><label>Başlangıç <input type="date" id="p322Start" value="${c.start}"></label><label>Bitiş <input type="date" id="p322End" value="${c.end}"></label></div><div class="p322slots">${slots.map(s=>{let v=slotId(s.type,s.col);return `<label><input type="checkbox" value="${esc(v)}" ${c.slots.includes(v)?'checked':''}> <b>${esc(s.col.unit)}</b><small>${esc(s.col.shift)} • ${s.col.hours}s • ${s.type==='pol'?'POL':'ACİL'}</small></label>`}).join('')}</div><div class="toolbar"><button class="btn" id="p322Save">Seçimleri Kaydet / Hesapla</button><button class="btn alt" id="p322Defaults">Varsayılan Gündüz Birimleri</button></div><div id="p322Summary" class="p322summary"></div>`;
  Q('#p322Save',x).onclick=()=>{c.start=Q('#p322Start',x).value;c.end=Q('#p322End',x).value;c.slots=QA('.p322slots input:checked',x).map(i=>i.value);save();renderTrackingSummary322();try{renderSuitableDutyPeopleV2413()}catch(e){}};
  Q('#p322All',x).onclick=()=>{let a=QA('.p322slots input',x),all=a.every(i=>i.checked);a.forEach(i=>i.checked=!all)};
  Q('#p322Defaults',x).onclick=()=>{QA('.p322slots input',x).forEach(i=>{let s=slots.find(z=>slotId(z.type,z.col)===i.value),u=UP(s?.col?.unit);i.checked=!!s&&['POLİKLİNİK RÖNTGEN','RUTİN PORTABL','MAMOGRAFİ','KEMİK ÖLÇÜMÜ'].includes(u)&&n(s.col.hours)<22})};
  renderTrackingSummary322()
}
function renderTrackingSummary322(){let h=Q('#p322Summary');if(!h)return;let c=trackingStore322(),people=currentPeople().map(p=>({p,count:polDayCount322(p.id)})),mx=Math.max(0,...people.map(x=>x.count));people.sort((a,b)=>(mx-a.count)-(mx-b.count)||a.p.name.localeCompare(b.p.name,'tr'));h.innerHTML=`<b>${esc(c.start)} – ${esc(c.end)}</b> • ${c.slots.length} vardiya seçili • <b>Poliklinik gündüz dengesi</b><div class="p322chips">${people.map(x=>`<span><b>${esc(x.p.name)}</b> ${x.count} gün • <strong>Eksik ${Math.max(0,mx-x.count)}</strong></span>`).join('')}</div>`}

/* LOCK + SWAP */
function lockStore322(){db.lockedDutyCells322=db.lockedDutyCells322||{};return db.lockedDutyCells322}
function dutyKey322(c){try{return keyFor(c.dataset.type,+c.dataset.day,c.dataset.col)}catch(e){return null}}
function selectedDuty322(){let a=[];try{a=(selectedDutyCells||[]).slice()}catch(e){};if(!a.length)a=QA('.dropDutyCell.dutySelected');return [...new Set(a.filter(Boolean))]}
function restoreLocks322(){let st=lockStore322();db.assignmentMeta=db.assignmentMeta||{};for(const [k,s] of Object.entries(st)){if(!k.startsWith(ym()+'|'))continue;if(s.value==null)delete db.assign[k];else db.assign[k]=s.value;if(s.meta)db.assignmentMeta[k]=JSON.parse(JSON.stringify(s.meta));else delete db.assignmentMeta[k]}reset()}
window.rpys322ToggleLock=function(){let cs=selectedDuty322();if(!cs.length)return alert('Önce nöbet hücresi seç.');let st=lockStore322(),ks=cs.map(dutyKey322).filter(Boolean),all=ks.every(k=>!!st[k]);if(all)ks.forEach(k=>delete st[k]);else ks.forEach(k=>{st[k]={value:Object.prototype.hasOwnProperty.call(db.assign,k)?db.assign[k]:null,meta:db.assignmentMeta?.[k]?JSON.parse(JSON.stringify(db.assignmentMeta[k])):null,at:new Date().toISOString()}});save();markLocks322();alert(all?'Seçili hücrelerin kilidi açıldı.':`${ks.length} hücre kilitlendi. Otomatik dağıtım ve manuel değişiklik bu hücreleri değiştiremez.`)};
function markLocks322(){let st=lockStore322();QA('.dropDutyCell').forEach(c=>c.classList.toggle('rpys322locked',!!st[dutyKey322(c)]))}
window.rpys322Swap=function(){let cs=selectedDuty322(),ks=cs.map(dutyKey322).filter(Boolean);if(ks.length!==2)return alert('CTRL/SHIFT ile tam 2 dolu nöbet hücresi seç.');let st=lockStore322();if(ks.some(k=>st[k]))return alert('Kilitli hücre değiştirilemez. Önce kilidi aç.');let a=db.assign[ks[0]],b=db.assign[ks[1]];if(!a||!b)return alert('Değiştirmek için iki hücrede de personel olmalı.');let ds=cs.map(c=>({c,type:c.dataset.type,d:+c.dataset.day,col:dutyColumnByKey(c.dataset.type,c.dataset.col),k:dutyKey322(c)}));let snap=ks.map(k=>({k,v:db.assign[k],m:db.assignmentMeta?.[k]?JSON.parse(JSON.stringify(db.assignmentMeta[k])):null}));try{delete db.assign[ks[0]];delete db.assign[ks[1]];reset();let ok1=canTakeShiftV2414(Number(b),ds[0].d,ds[0].col,ds[0].col.unit),ok2=canTakeShiftV2414(Number(a),ds[1].d,ds[1].col,ds[1].col.unit);if(!ok1||!ok2)throw Error('Değişim sonrası personellerden biri hedef hücre için uygun değil.');}catch(e){snap.forEach(s=>db.assign[s.k]=s.v);reset();return alert('Değiştirme yapılamadı: '+String(e?.message||e))}snap.forEach(s=>db.assign[s.k]=s.v);try{if(typeof pushUndoPoint==='function')pushUndoPoint('Seçili 2 nöbet hücresini değiştir')}catch(e){};db.assign[ks[0]]=b;db.assign[ks[1]]=a;db.assignmentMeta=db.assignmentMeta||{};delete db.assignmentMeta[ks[0]];delete db.assignmentMeta[ks[1]];try{markManualDutyOverride(ks[0],a,b,'İki hücre değiştir');markManualDutyOverride(ks[1],b,a,'İki hücre değiştir')}catch(e){};reset();save();try{clearDutyCellSelection()}catch(e){};renderAll();alert('Seçili 2 nöbet hücresindeki personeller değiştirildi.')};
window.rpys322SafeBulk=function(pid,cells){pid=Number(pid);cells=[...new Set((cells||[]).filter(Boolean))];if(!pid||cells.length<2)return false;let st=lockStore322(),ds=cells.map(c=>({c,type:c.dataset.type,d:+c.dataset.day,colKey:c.dataset.col,col:dutyColumnByKey(c.dataset.type,c.dataset.col),k:dutyKey322(c)}));if(ds.some(x=>st[x.k])){alert('Seçili hücrelerden biri kilitli. Hiçbir hücre değiştirilmedi.');return true}let snap=ds.map(x=>({k:x.k,has:Object.prototype.hasOwnProperty.call(db.assign,x.k),v:db.assign[x.k],m:db.assignmentMeta?.[x.k]?JSON.parse(JSON.stringify(db.assignmentMeta[x.k])):null}));let restore=()=>{db.assignmentMeta=db.assignmentMeta||{};snap.forEach(s=>{if(s.has)db.assign[s.k]=s.v;else delete db.assign[s.k];if(s.m)db.assignmentMeta[s.k]=s.m;else delete db.assignmentMeta[s.k]});reset()};try{ds.forEach(x=>{delete db.assign[x.k];if(db.assignmentMeta)delete db.assignmentMeta[x.k]});reset();for(const x of ds){if(!x.col)throw Error(`${x.d}. gün vardiya bulunamadı`);if(isShiftBlockedForMonth(x.type,x.col,ym()))throw Error(`${x.d}. gün vardiya kapalı`);if(!canTakeShiftV2414(pid,x.d,x.col,x.col.unit))throw Error(`${x.d}. gün ${x.col.unit} / ${x.col.shift} için personel uygun değil`);db.assign[x.k]=pid;reset()}}catch(e){restore();alert('Toplu atama yapılamadı: '+String(e?.message||e)+'. Hiçbir hücre değiştirilmedi.');return true}restore();try{if(typeof pushUndoPoint==='function')pushUndoPoint('CTRL/SHIFT toplu personel atama')}catch(e){};for(const x of ds){let old=Object.prototype.hasOwnProperty.call(db.assign,x.k)?db.assign[x.k]:null;db.assign[x.k]=pid;if(db.assignmentMeta)delete db.assignmentMeta[x.k];try{markManualDutyOverride(x.k,old,pid,'CTRL/SHIFT toplu personel atama')}catch(e){}}reset();save();try{clearDutyCellSelection()}catch(e){};renderAll();let p=getPersonById(pid);alert(`${p?.name||'Seçilen personel'} ${ds.length} seçili hücreye atandı.`);return true};
function installLockHooks322(){
  if(typeof save==='function'&&!save.__rpys322){let old=save;window.save=function(){restoreLocks322();return old.apply(this,arguments)};save.__rpys322=1}
  if(typeof setAssign==='function'&&!setAssign.__rpys322){let old=setAssign;window.setAssign=function(type,d,colKey,id){let k=keyFor(type,+d,colKey);if(lockStore322()[k]){alert('🔒 Bu nöbet hücresi kilitli. Önce kilidi aç.');renderAll();return}return old.apply(this,arguments)};setAssign.__rpys322=1}
  let menu=Q('#dutyContextMenu');if(menu&&!Q('#rpys322LockBtn',menu)){let div=document.createElement('div');div.innerHTML='<div style="height:1px;background:#e4e9f0;margin:5px 0"></div><button id="rpys322LockBtn" class="ctxBtn" onclick="rpys322ToggleLock()">🔒 Seçili Hücreleri Kilitle / Kilidi Aç</button><button id="rpys322SwapBtn" class="ctxBtn" onclick="rpys322Swap()">⇄ Seçili 2 Hücreyi Değiştir</button>';menu.insertBefore(div,menu.lastElementChild)}
}

/* NET SORT + PDF PREVIEW */
const sortState322=new WeakMap();
function cellValue322(td){let i=td?.querySelector('input,select');let s=String(i?i.value:td?.textContent||'').trim().replace(',', '.');let num=Number(s.replace(/[^0-9+\-.]/g,''));return s!==''&&Number.isFinite(num)&&/[0-9]/.test(s)?{num,s}:{num:null,s:s.toLocaleLowerCase('tr-TR')}}
function sortTable322(table,idx,th){let body=table.tBodies?.[0];if(!body)return;let prev=sortState322.get(table)||{idx:-1,dir:1},dir=prev.idx===idx?-prev.dir:1;sortState322.set(table,{idx,dir});let rows=[...body.rows];rows.sort((a,b)=>{let x=cellValue322(a.cells[idx]),y=cellValue322(b.cells[idx]);let c=(x.num!==null&&y.num!==null)?x.num-y.num:String(x.s).localeCompare(String(y.s),'tr',{numeric:true,sensitivity:'base'});return c*dir});rows.forEach(r=>body.appendChild(r));QA('th .rpys322sort',table).forEach(s=>s.textContent='↕');let sp=Q('.rpys322sort',th);if(sp)sp.textContent=dir>0?'▲':'▼'}
function setupNetSort322(){QA('#netistat table').forEach(table=>{let hr=table.tHead?.rows?.[table.tHead.rows.length-1];if(!hr)return;[...hr.cells].forEach((th,i)=>{if(th.dataset.rpys322sort)return;th.dataset.rpys322sort='1';th.style.cursor='pointer';let sp=document.createElement('span');sp.className='rpys322sort';sp.textContent='↕';th.appendChild(sp);th.addEventListener('click',e=>{if(e.target.closest('input,button,select'))return;sortTable322(table,i,th)})})})}
function netPreviewHtml322(){let title=Q('#netTableTitle')?.textContent||'Net İstatistikler',period=Q('#netStatMonth option:checked')?.textContent||'';let main=Q('.netManualPanel .netStatTable table')?.cloneNode(true);if(!main)return `<h2>${esc(title)}</h2><p>Tablo bulunamadı.</p>`;QA('input,select',main).forEach(i=>{let s=document.createElement('span');s.textContent=i.value;i.replaceWith(s)});let monthly=Q('#netUnitMonthlyGrid table')?.cloneNode(true);return `<div class="p322pdfhead"><b>RPYS • ${esc(title)}</b><span>${esc(period)}</span></div>${monthly?`<h3>Aylık Birim İncelemesi</h3>${monthly.outerHTML}`:''}<h3>${esc(title)}</h3>${main.outerHTML}`}
function ensurePdfModal322(){if(Q('#rpys322PdfModal'))return;let o=document.createElement('div');o.id='rpys322PdfModal';o.innerHTML='<div class="p322pdfcard"><div class="p322pdfbar"><b>🔎 PDF Önizleme</b><label>Boyut <input id="p322PdfZoom" type="range" min="55" max="115" value="85"></label><button class="btn" id="p322PdfPrint">PDF / Yazdır</button><button class="btn alt" id="p322PdfClose">Kapat</button></div><div class="p322pdfscroll"><div id="p322PdfPage" class="p322pdfpage"></div></div></div>';document.body.appendChild(o);Q('#p322PdfClose',o).onclick=()=>o.classList.remove('show');Q('#p322PdfZoom',o).oninput=e=>Q('#p322PdfPage',o).style.setProperty('--p322zoom',e.target.value/100);Q('#p322PdfPrint',o).onclick=()=>{let body=netPreviewHtml322();try{if(typeof stablePrintDocument==='function')stablePrintDocument('Net İstatistikler',body,'landscape');else window.print()}catch(e){window.print()}};o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('show')})}
window.openNetPdfPreview322=function(){ensurePdfModal322();let o=Q('#rpys322PdfModal'),p=Q('#p322PdfPage');p.innerHTML=netPreviewHtml322();p.style.setProperty('--p322zoom',.85);Q('#p322PdfZoom').value='85';o.classList.add('show')};
function addNetPreviewButton322(){let hero=Q('#netistat .netHeroSelects');if(hero&&!Q('#rpys322NetPreview',hero)){let b=document.createElement('button');b.id='rpys322NetPreview';b.className='btn';b.textContent='🔎 PDF Önizleme';b.onclick=openNetPdfPreview322;hero.appendChild(b)}}

/* TEXT FIT */
function fitCellText322(){['#polGrid','#acilGrid','#say1Grid','#say2Grid'].forEach(sel=>{let host=Q(sel),table=host?.querySelector('table');if(!table)return;let cells=QA('th,td',table);cells.forEach(c=>{let w=c.getBoundingClientRect().width,fs=w<55?6:w<75?6.6:w<95?7.2:null;if(fs)c.style.setProperty('font-size',fs+'px','important');else if(c.dataset.rpys322fs){c.style.removeProperty('font-size')}c.dataset.rpys322fs='1';QA('select,input',c).forEach(i=>{let f=w<70?6.2:w<95?7:null;if(f)i.style.setProperty('font-size',f+'px','important');else i.style.removeProperty('font-size')})})})}
function addCss322(){if(Q('#rpys322css'))return;let s=document.createElement('style');s.id='rpys322css';s.textContent=`
.rpys322locked{box-shadow:inset 0 0 0 3px #7c3aed!important;position:relative}.rpys322locked:after{content:'🔒';position:absolute;right:1px;top:1px;font-size:9px;z-index:5}.suitablePersonV2413 span strong{color:#b42318}.p322dates{display:flex;gap:10px;flex-wrap:wrap;margin:8px 0}.p322slots{display:grid;grid-template-columns:repeat(2,minmax(260px,1fr));gap:6px;max-height:300px;overflow:auto;margin:8px 0}.p322slots label{border:1px solid #dbe3ee;border-radius:8px;padding:7px;background:#f8fbff;display:flex;align-items:center;gap:6px}.p322slots small{margin-left:auto;color:#6d7c91}.p322chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}.p322chips span{padding:5px 8px;border:1px solid #dce5ef;border-radius:999px;background:#f7fafc;font-size:10px}.rpys322sort{font-size:8px;margin-left:4px;opacity:.65}.netStatTable td,.netStatTable th,#netUnitMonthlyGrid td,#netUnitMonthlyGrid th{overflow:hidden;text-overflow:ellipsis;white-space:normal;overflow-wrap:anywhere}#rpys322PdfModal{display:none;position:fixed;inset:0;background:#0f172acc;z-index:30000;padding:2vh 2vw}#rpys322PdfModal.show{display:block}.p322pdfcard{height:96vh;background:#eef2f7;border-radius:14px;display:flex;flex-direction:column;overflow:hidden}.p322pdfbar{display:flex;align-items:center;gap:10px;padding:9px 12px;background:#fff;border-bottom:1px solid #dbe3ee}.p322pdfbar label{margin-left:auto}.p322pdfscroll{overflow:auto;padding:18px}.p322pdfpage{--p322zoom:.85;width:297mm;min-height:210mm;margin:auto;background:#fff;padding:8mm;box-shadow:0 10px 30px #0003;transform:scale(var(--p322zoom));transform-origin:top center;font-size:8px}.p322pdfpage table{width:100%;table-layout:fixed;border-collapse:collapse;font-size:8px}.p322pdfpage th,.p322pdfpage td{border:1px solid #cfd8e5;padding:3px;white-space:normal;overflow-wrap:anywhere;overflow:hidden}.p322pdfhead{display:flex;justify-content:space-between;font-size:10px;margin-bottom:8px}#polGrid table,#acilGrid table,#say1Grid table,#say2Grid table{table-layout:fixed!important}#polGrid th,#polGrid td,#acilGrid th,#acilGrid td,#say1Grid th,#say1Grid td,#say2Grid th,#say2Grid td{overflow:hidden!important;text-overflow:ellipsis!important;overflow-wrap:anywhere!important}#polGrid select,#acilGrid select{min-width:0!important;max-width:100%!important;width:100%!important;text-overflow:ellipsis}@media(max-width:900px){.p322slots{grid-template-columns:1fr}.p322pdfpage{transform-origin:top left}}
`;document.head.appendChild(s)}
function run322(){try{addCss322();installLockHooks322();buildTracking322();setupNetSort322();addNetPreviewButton322();markLocks322();clearTimeout(window.__rpys322fit);window.__rpys322fit=setTimeout(fitCellText322,120)}catch(e){console.error('RPYS322',e)}}
new MutationObserver(()=>{clearTimeout(window.__rpys322mo);window.__rpys322mo=setTimeout(run322,120)}).observe(document.body,{childList:true,subtree:true});window.addEventListener('resize',()=>{clearTimeout(window.__rpys322rs);window.__rpys322rs=setTimeout(fitCellText322,150)});setTimeout(run322,150);setTimeout(run322,900)
})();
