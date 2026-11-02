(()=>{
if(window.__RPYS_PATCH332__)return; window.__RPYS_PATCH332__=1;
const N=s=>String(s??'').replace(/\s+/g,' ').trim();
const U=s=>N(s).toLocaleUpperCase('tr-TR');
const Q=(s,r=document)=>r.querySelector(s), QA=(s,r=document)=>Array.from(r.querySelectorAll(s));
function ensure(){
  try{
    db.rpysManualTouched332=db.rpysManualTouched332&&typeof db.rpysManualTouched332==='object'?db.rpysManualTouched332:{};
    db.polTrack332=db.polTrack332&&typeof db.polTrack332==='object'?db.polTrack332:{};
    db.polTrackOverrides332=db.polTrackOverrides332&&typeof db.polTrackOverrides332==='object'?db.polTrackOverrides332:{};
    db.netVisibleMetrics332=db.netVisibleMetrics332&&typeof db.netVisibleMetrics332==='object'?db.netVisibleMetrics332:{};
  }catch(_){}
}
ensure();
function persist(){try{save()}catch(e){console.error('RPYS332 save',e)}}
// Mark only values the user explicitly edits from this version onward as manual targets.
function wrapManual(){
  try{
    const old=window.setNetManual;
    if(typeof old==='function'&&!old.__p332){
      const f=function(metric,pid,field,value){
        ensure();
        if(field==='obligation') db.rpysManualTouched332[`${metric}|${Number(pid)}`]=true;
        const r=old.apply(this,arguments); persist(); return r;
      }; f.__p332=1; window.setNetManual=f;
    }
  }catch(_){}
}

const TRACK_GROUPS=[
  ['polDay','POLİKLİNİK RÖNTGEN'],['secretary','SEKRETERLİK'],['manager','BİRİM SORUMLUSU'],['mammo','MAMOGRAFİ'],['bone','KEMİK ÖLÇÜMÜ'],['acil','ACİL RÖNTGEN'],
  ['portableDay','PORTABLE GÜNDÜZ'],['portableNobet','PORTABLE NÖBET'],['skopiDay','SKOPİ GÜNDÜZ'],['skopiNobet','SKOPİ NÖBET'],['bt','BİLGİSAYARLI TOMOGRAFİ']
];
function defaultTrack(){
  const old=db?.polTrackConfig||{};
  const g=new Set(Array.isArray(old.groups)?old.groups:[]);
  return {start:old.start||`${new Date().getFullYear()}-01-01`,end:old.end||`${new Date().getFullYear()}-12-31`,groups:[...new Set([
    ...(g.has('polDay')?['polDay']:[]),...(g.has('secretary')?['secretary']:[]),...(g.has('manager')?['manager']:[]),...(g.has('mammo')?['mammo']:[]),...(g.has('bone')?['bone']:[]),...(g.has('acil')?['acil']:[]),
    ...(g.has('portable')?['portableDay','portableNobet']:[]),...(g.has('skopiDay')?['skopiDay']:[]),...(g.has('skopiNobet')?['skopiNobet']:[]),...(g.has('bt')?['bt']:[])
  ])]};
}
function trackCfg(){ensure(); if(!db.polTrack332.start){Object.assign(db.polTrack332,defaultTrack());persist()} return db.polTrack332}
function matchTrack(a,key){
  const u=String(a?.col?.unit||''), k=String(a?.col?.key||'');
  if(key==='polDay')return u==='POLİKLİNİK RÖNTGEN';
  if(key==='secretary')return u==='SEKRETERLİK';
  if(key==='manager')return u==='BİRİM SORUMLUSU';
  if(key==='mammo')return u==='MAMOGRAFİ';
  if(key==='bone')return u==='KEMİK ÖLÇÜMÜ';
  if(key==='acil')return u==='ACİL RÖNTGEN';
  if(key==='portableDay')return u==='RUTİN PORTABL'&&k==='porS';
  if(key==='portableNobet')return u==='RUTİN PORTABL'&&k==='porW';
  if(key==='skopiDay')return u==='PORTABL + SKOPİ'&&k==='sk1';
  if(key==='skopiNobet')return u==='PORTABL + SKOPİ'&&k==='sk2';
  if(key==='bt')return u==='BİLGİSAYARLI TOMOGRAFİ';
  return false;
}
function allAssign(){try{return typeof allAssignmentsAllMonths==='function'?allAssignmentsAllMonths():[]}catch(_){return []}}
function esc332(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function rangeKey(){const c=trackCfg();return `${c.start}|${c.end}|${[...(c.groups||[])].sort().join(',')}`}
function ovRow(pid){ensure();const k=`${rangeKey()}|${Number(pid)}`;return db.polTrackOverrides332[k]||(db.polTrackOverrides332[k]={})}
function trackData(){
  const c=trackCfg(), groups=new Set(c.groups||[]), src=allAssign().filter(a=>a?.date>=c.start&&a?.date<=c.end&&[...groups].some(g=>matchTrack(a,g)));
  const ids=new Set((db.staff||[]).filter(p=>p&&p.active!==false).map(p=>Number(p.id)));
  const rows=[];
  for(const id of ids){
    const p=(db.staff||[]).find(x=>Number(x.id)===id); if(!p)continue;
    const aa=src.filter(a=>Number(a.person?.id)===id), days=new Set(aa.map(a=>a.date)).size, tasks=aa.length, hours=aa.reduce((s,a)=>s+Number(a.col?.hours||0),0), o=ovRow(id);
    const val=(k,auto)=>o[k]===undefined||o[k]===null||o[k]===''?auto:Number(o[k]);
    rows.push({p,days:val('days',days),tasks:val('tasks',tasks),hours:val('hours',hours),obligation:val('obligation',0),auto:{days,tasks,hours}});
  }
  return rows;
}
function setTrackOv(pid,field,raw){const o=ovRow(pid),t=String(raw??'').trim(); if(t===''){delete o[field]}else{const n=Number(t.replace(',','.'));if(!Number.isFinite(n))return;o[field]=n} persist(); renderTrackTable()}
window.rpys332SetTrackOv=setTrackOv;
function renderTrackTable(){
  const panel=findTrackPanel(); if(!panel)return;
  let host=Q('#rpys332TrackTable',panel); if(!host){host=document.createElement('div');host.id='rpys332TrackTable';host.className='tablewrap rpys332-own';panel.appendChild(host)}
  const rows=trackData();
  host.innerHTML=`<table data-rpys332-track="1"><thead><tr><th>Personel</th><th>Gün ✎</th><th>Görev ✎</th><th>Saat ✎</th><th>Mükellef ✎</th><th>Fark</th></tr></thead><tbody>${rows.map(r=>{
    const diff=Number(r.tasks)-Number(r.obligation);
    return `<tr><td>${esc332(r.p.name)}</td><td><input class="rpys332num" value="${r.days}" onchange="rpys332SetTrackOv(${Number(r.p.id)},'days',this.value)"></td><td><input class="rpys332num" value="${r.tasks}" onchange="rpys332SetTrackOv(${Number(r.p.id)},'tasks',this.value)"></td><td><input class="rpys332num" value="${r.hours}" onchange="rpys332SetTrackOv(${Number(r.p.id)},'hours',this.value)"></td><td><input class="rpys332num" value="${r.obligation||''}" placeholder="0" onchange="rpys332SetTrackOv(${Number(r.p.id)},'obligation',this.value)"></td><td>${diff}</td></tr>`
  }).join('')}</tbody></table>`;
  enhanceTables(host);
}
function findTrackPanel(){return QA('div,section').find(el=>/Poliklinik Takibi\s*[—-]\s*Dahil Birimler ve Tarih/i.test(N(el.querySelector?.('h1,h2,h3')?.textContent||'')))||null}
function patchTrackPanel(){
  const panel=findTrackPanel(); if(!panel||panel.dataset.rpys332==='1')return false; panel.dataset.rpys332='1';
  const c=trackCfg();
  // Hide old checkbox card block and old result table, but keep date selects/header.
  QA('label',panel).forEach(l=>{if(l.querySelector('input[type=checkbox]')){const box=l.closest('div'); if(box)box.style.display='none'; else l.style.display='none'}});
  QA('table',panel).forEach(t=>{if(!t.closest('#rpys332TrackTable')){const w=t.closest('.tablewrap')||t;w.style.display='none';w.dataset.rpys332Old='1'}});
  const controls=document.createElement('div');controls.id='rpys332TrackControls';controls.className='rpys332CheckGrid';
  controls.innerHTML=TRACK_GROUPS.map(([k,l])=>`<label class="rpys332Check"><input type="checkbox" data-g="${k}" ${c.groups?.includes(k)?'checked':''}><span>${l}</span></label>`).join('');
  const desc=QA('p,.smallhelp',panel).find(x=>/Poliklinik gündüz hesabına/i.test(N(x.textContent)));
  (desc?.parentElement||panel).appendChild(controls);
  controls.addEventListener('change',()=>{c.groups=QA('input[type=checkbox]:checked',controls).map(x=>x.dataset.g);persist();updateTrackSummary(panel);renderTrackTable()});
  const sels=QA('select',panel); if(sels[0]){sels[0].value=c.start;sels[0].addEventListener('change',()=>{c.start=sels[0].value;persist();renderTrackTable();updateTrackSummary(panel)})} if(sels[1]){sels[1].value=c.end;sels[1].addEventListener('change',()=>{c.end=sels[1].value;persist();renderTrackTable();updateTrackSummary(panel)})}
  const saveBtn=QA('button',panel).find(b=>/Ayarları Kaydet/i.test(N(b.textContent))); if(saveBtn)saveBtn.addEventListener('click',()=>{if(sels[0])c.start=sels[0].value;if(sels[1])c.end=sels[1].value;c.groups=QA('input[type=checkbox]:checked',controls).map(x=>x.dataset.g);persist();renderTrackTable();updateTrackSummary(panel)},true);
  updateTrackSummary(panel); renderTrackTable(); return true;
}
function updateTrackSummary(panel){let s=Q('#rpys332TrackSummary',panel);if(!s){s=document.createElement('div');s.id='rpys332TrackSummary';s.className='smallhelp';Q('#rpys332TrackControls',panel)?.after(s)}const c=trackCfg();s.textContent=`${c.start} → ${c.end} • ${(c.groups||[]).length} birim seçili`}

// Net statistics: checkbox selector for which metrics are visible.
const NET_BOXES=[['portable','Portable'],['skopiNobet','Skopi Nöbet'],['skopiDay','Skopi Gündüz'],['skopiWeekend','Skopi Hafta Sonu'],['pol','Poliklinik'],['mammo','Mamografi'],['acil','Acil Röntgen'],['bt','BT'],['bone','Kemik Ölçümü'],['manager','Birim Sorumlusu'],['ketem','KETEM'],['gecici','Geçici Görevlendirme'],['secretary','Sekreterlik']];
function patchNetBoxes(){const page=Q('#netistat');if(!page||Q('#rpys332NetBoxes',page))return false;ensure();for(const [k] of NET_BOXES)if(db.netVisibleMetrics332[k]===undefined)db.netVisibleMetrics332[k]=true;const box=document.createElement('div');box.id='rpys332NetBoxes';box.className='rpys332CheckGrid rpys332StatsBoxes';box.innerHTML=NET_BOXES.map(([k,l])=>`<label class="rpys332Check"><input type="checkbox" data-m="${k}" ${db.netVisibleMetrics332[k]!==false?'checked':''}><span>${l}</span></label>`).join('');const tabs=Q('#netMetricTabs',page);tabs?.before(box);box.addEventListener('change',e=>{const x=e.target;if(!x.matches('input[data-m]'))return;db.netVisibleMetrics332[x.dataset.m]=x.checked;persist();applyNetVisibility()});applyNetVisibility();return true}
function applyNetVisibility(){const page=Q('#netistat');if(!page)return;QA('#netMetricTabs [data-netmetric]',page).forEach(b=>{b.style.display=db.netVisibleMetrics332?.[b.dataset.netmetric]===false?'none':''})}

// Universal sortable/collapsible/printable tables.
let tblSeq=0;
function parseVal(s){const t=N(s).replace(/\./g,'').replace(',','.');const n=Number(t.replace(/[^0-9+\-.]/g,''));return t!==''&&Number.isFinite(n)&&/[0-9]/.test(t)?{n,text:N(s)}:{n:null,text:N(s)}}
function sortTable(table,idx,dir){const body=table.tBodies?.[0];if(!body)return;const rows=Array.from(body.rows);rows.sort((a,b)=>{const A=parseVal(a.cells[idx]?.innerText||a.cells[idx]?.querySelector('input')?.value||''),B=parseVal(b.cells[idx]?.innerText||b.cells[idx]?.querySelector('input')?.value||'');let c;if(A.n!==null&&B.n!==null)c=A.n-B.n;else c=A.text.localeCompare(B.text,'tr',{numeric:true,sensitivity:'base'});return dir==='asc'?c:-c});rows.forEach(r=>body.appendChild(r))}
function printTable(table){const f=document.createElement('iframe');f.style.cssText='position:fixed;width:0;height:0;border:0;right:0;bottom:0';document.body.appendChild(f);const d=f.contentDocument;d.open();d.write(`<html><head><meta charset="utf-8"><style>body{font-family:Arial}table{border-collapse:collapse;width:100%;font-size:11px}th,td{border:1px solid #999;padding:4px}th{background:#eee}input{border:0;width:100%;text-align:center}</style></head><body>${table.outerHTML}</body></html>`);d.close();setTimeout(()=>{f.contentWindow.focus();f.contentWindow.print();setTimeout(()=>f.remove(),1000)},100)}
function enhanceTable(table){if(!table||table.dataset.rpys332Table==='1')return;table.dataset.rpys332Table='1';table.id=table.id||`rpys332tbl${++tblSeq}`;const thead=table.tHead;if(thead){Array.from(thead.rows).forEach(row=>Array.from(row.cells).forEach((th,i)=>{th.classList.add('rpys332Sort');th.title='Sıralamak için tıkla';th.addEventListener('click',e=>{if(e.target.closest('input,button,a,select'))return;const d=th.dataset.sortDir==='asc'?'desc':'asc';QA('th',thead).forEach(x=>{delete x.dataset.sortDir;x.classList.remove('rpys332Asc','rpys332Desc')});th.dataset.sortDir=d;th.classList.add(d==='asc'?'rpys332Asc':'rpys332Desc');sortTable(table,i,d)})}))}
  const wrap=table.closest('.tablewrap')||table.parentElement;if(!wrap||wrap.querySelector(`:scope > .rpys332TblTools[data-for="${table.id}"]`))return;const tools=document.createElement('div');tools.className='rpys332TblTools';tools.dataset.for=table.id;tools.innerHTML='<button type="button" class="rpys332Collapse">▾ Tablo</button><button type="button" class="rpys332Print">🖨 Yazdır</button>';wrap.insertBefore(tools,table);const cb=Q('.rpys332Collapse',tools);cb.onclick=()=>{const hidden=table.style.display==='none';table.style.display=hidden?'':'none';cb.textContent=hidden?'▾ Tablo':'▸ Tablo'};Q('.rpys332Print',tools).onclick=()=>printTable(table)
}
function enhanceTables(root=document){QA('table',root).forEach(enhanceTable)}

// Correct suitable-person deficits: only explicit manual targets count; one render, one stable order.
function context(){try{return window.dutyContextCellV2413||(typeof dutyContextCellV2413!=='undefined'?dutyContextCellV2413:null)}catch(_){return null}}
function suitableMetric(cell){try{const col=dutyColumnByKey(cell.dataset.type,cell.dataset.col),u=String(col?.unit||''),k=String(col?.key||'');if(u==='RUTİN PORTABL')return 'portable';if(u==='PORTABL + SKOPİ')return k==='sk1'?'skopiDay':'skopiNobet';if(u==='POLİKLİNİK RÖNTGEN')return 'pol';if(u==='MAMOGRAFİ')return 'mammo';if(u==='KEMİK ÖLÇÜMÜ')return 'bone';return null}catch(_){return null}}
function currentMetricCount(metric,pid){try{const arr=typeof assignmentsMonth==='function'?assignmentsMonth():[];return arr.filter(a=>Number(a.person?.id)===Number(pid)&&({portable:a=>a.col?.unit==='RUTİN PORTABL',skopiDay:a=>a.col?.unit==='PORTABL + SKOPİ'&&a.col?.key==='sk1',skopiNobet:a=>a.col?.unit==='PORTABL + SKOPİ'&&a.col?.key==='sk2',pol:a=>a.col?.unit==='POLİKLİNİK RÖNTGEN',mammo:a=>a.col?.unit==='MAMOGRAFİ',bone:a=>a.col?.unit==='KEMİK ÖLÇÜMÜ'}[metric]?.(a))).length}catch(_){return 0}}
function explicitTarget(metric,pid){ensure();if(!metric||!db.rpysManualTouched332[`${metric}|${Number(pid)}`])return null;try{const x=db.netStatManual?.[`${metric}|${Number(pid)}`]?.obligation;const n=Number(x);return Number.isFinite(n)&&n>=0?n:null}catch(_){return null}}
function pidOf(b){let v=Number(b.dataset.personId||b.dataset.pid||0);if(v)return v;const m=String(b.getAttribute('onclick')||'').match(/assignSuitableDutyV2413\s*\(\s*(\d+)/);return m?Number(m[1]):0}
function stableSuitable(){const box=Q('#dutySuitableListV2413'),cell=context();if(!box||!cell)return;const metric=suitableMetric(cell),rows=QA('button.suitablePersonV2413',box),seen=new Set(),items=[];for(const b of rows){const pid=pidOf(b),name=N(Q('b',b)?.textContent||b.textContent),key=pid||U(name);if(seen.has(key)){b.remove();continue}seen.add(key);const target=explicitTarget(metric,pid),cur=target===null?null:currentMetricCount(metric,pid),missing=target===null?null:Math.max(0,target-cur);const spouse=/EŞİ.*NÖBETTE/i.test(U(b.textContent));QA('span',b).forEach(s=>s.remove());const sp=document.createElement('span');sp.textContent=target===null?(spouse?'♥ Eşi bugün nöbette':'Uygun'):`Eksik: ${missing} gün • ${cur}/${target}${spouse?' • ♥ Eşi bugün nöbette':''}`;b.appendChild(sp);items.push({b,pid,name,missing})}items.sort((a,b)=>{const am=a.missing??-1,bm=b.missing??-1;if(am!==bm)return bm-am;return a.name.localeCompare(b.name,'tr',{sensitivity:'base'})||a.pid-b.pid});items.forEach(x=>box.appendChild(x.b));box.style.visibility='visible';box.style.display='block'}
let suitableToken=0,lastTouch=0;
function openSuitable332(ev){if(ev){try{ev.preventDefault();ev.stopPropagation()}catch(_){}}const box=Q('#dutySuitableListV2413');if(!box)return;box.style.visibility='hidden';const my=++suitableToken;try{window.renderSuitableDutyPeopleV2413?.()}catch(e){console.error('RPYS332 suitable render',e)}requestAnimationFrame(()=>{if(my!==suitableToken)return;stableSuitable()})}
function bindSuitable(){const old=Q('#dutyContextMenu .dutySuitableWrapV2413');if(!old||old.dataset.rpys332==='1')return false;const wrap=old.cloneNode(true);wrap.dataset.rpys332='1';wrap.removeAttribute('onmouseenter');old.replaceWith(wrap);const btn=Q('button.ctxBtn',wrap);if(btn){btn.removeAttribute('onclick');btn.addEventListener('pointerup',e=>{if(e.pointerType==='touch'||e.pointerType==='pen'){lastTouch=Date.now();openSuitable332(e)}},true);btn.addEventListener('click',e=>{if(Date.now()-lastTouch<550)return;openSuitable332(e)},true)}wrap.addEventListener('mouseenter',e=>openSuitable332(e),true);return true}

function tick(){wrapManual();patchTrackPanel();patchNetBoxes();applyNetVisibility();enhanceTables();bindSuitable()}
const style=document.createElement('style');style.id='rpys332style';style.textContent=`
.rpys332CheckGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin:12px 0}.rpys332Check{display:flex;align-items:center;gap:10px;padding:12px;border:1px solid #d6e0ea;border-radius:12px;background:#f7f9fc;font-weight:700}.rpys332Check input{width:20px;height:20px}.rpys332num{width:82px;max-width:100%;padding:5px;border:1px solid #cbd5e1;border-radius:6px;text-align:center;background:#fff}.rpys332TblTools{display:flex;gap:7px;justify-content:flex-end;align-items:center;padding:4px 0}.rpys332TblTools button{border:1px solid #cbd5e1;background:#fff;border-radius:7px;padding:5px 9px;font-weight:700;color:#17365d}.rpys332Sort{cursor:pointer;user-select:none}.rpys332Sort:after{content:' ↕';opacity:.35}.rpys332Asc:after{content:' ▲';opacity:1}.rpys332Desc:after{content:' ▼';opacity:1}#dutySuitableListV2413{transition:none!important}#dutySuitableListV2413 .suitablePersonV2413{transition:none!important;animation:none!important}`;document.head.appendChild(style);
[0,100,400,1000,2500].forEach(t=>setTimeout(tick,t));const mo=new MutationObserver(()=>{clearTimeout(window.__rpys332mo);window.__rpys332mo=setTimeout(tick,80)});try{mo.observe(document.documentElement,{childList:true,subtree:true})}catch(_){}
console.log('RPYS PATCH332 istatistik/manuel hedef/sabit uygun kişiler/tablo araçları aktif');
})();
