
(()=>{
if(window.__RPYS_PATCH339__)return; window.__RPYS_PATCH339__=1;
const Q=(s,r=document)=>r.querySelector(s), QA=(s,r=document)=>Array.from(r.querySelectorAll(s));
const N=s=>String(s??'').replace(/\s+/g,' ').trim();
const U=s=>N(s).toLocaleUpperCase('tr-TR');
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function activeStaff(){try{return (db?.staff||[]).filter(p=>p&&p.active!==false&&U(p.status||'AKTİF')!=='PASİF')}catch(_){return []}}
function ymSafe(){try{return typeof ym==='function'?ym():String(db?.ui?.lastMonth||db?.lastMonth||'')}catch(_){return String(db?.ui?.lastMonth||db?.lastMonth||'')}}
function autoUnitSelect(){let s=Q('#autoUnit,#autoUnitSelect,#unitAutoSelect'); if(s)return s; const all=QA('select'); return all.find(x=>{const t=Array.from(x.options||[]).map(o=>U(o.textContent)).join('|');return t.includes('POLİKLİNİK RÖNTGEN')&&t.includes('SEKRETERLİK')})||null}
function ensureAutoPeople(){
 const s=Q('#autoPeople'); if(!s)return false; const staff=activeStaff();
 const existing=new Set(Array.from(s.options||[]).map(o=>Number(o.value)));
 for(const p of staff){if(!existing.has(Number(p.id))){const o=document.createElement('option');o.value=String(p.id);o.textContent=p.name;s.appendChild(o)}}
 const unit=autoUnitSelect()?.value||''; const key=ymSafe()+'|'+unit; const pool=Array.isArray(db?.unitPools?.[key])?db.unitPools[key].map(Number):[];
 const selected=Array.from(s.options).filter(o=>o.selected).map(o=>Number(o.value));
 if(selected.length===0&&pool.length){const set=new Set(pool);Array.from(s.options).forEach(o=>o.selected=set.has(Number(o.value)))}
 let host=Q('#rpys339PeopleChecks'); if(!host){host=document.createElement('div');host.id='rpys339PeopleChecks';s.insertAdjacentElement('afterend',host)}
 const ids=new Set(Array.from(s.options).filter(o=>o.selected).map(o=>Number(o.value)));
 host.innerHTML='<div class="rpys339PeopleBar"><b>'+staff.length+' aktif personel</b><span><button type="button" data-a="all">Tümünü Seç</button><button type="button" data-a="none">Temizle</button></span></div><div class="rpys339PeopleGrid">'+staff.map(p=>'<label><input type="checkbox" data-pid="'+Number(p.id)+'" '+(ids.has(Number(p.id))?'checked':'')+'><span>'+E(p.name)+'</span></label>').join('')+'</div>';
 s.style.position='absolute';s.style.opacity='0';s.style.pointerEvents='none';s.style.width='1px';s.style.height='1px';
 const old=Q('#rpys337PeopleChecks'); if(old)old.style.display='none';
 host.onchange=e=>{const c=e.target.closest('input[data-pid]');if(!c)return;const o=Array.from(s.options).find(x=>Number(x.value)===Number(c.dataset.pid));if(o)o.selected=!!c.checked};
 host.onclick=e=>{const b=e.target.closest('button[data-a]');if(!b)return;e.preventDefault();const on=b.dataset.a==='all';Array.from(s.options).forEach(o=>o.selected=on);QA('input[data-pid]',host).forEach(c=>c.checked=on)};
 return true;
}
function wrapAutoRender(){try{const old=window.renderAutoPanel;if(typeof old==='function'&&!old.__p339){const f=function(){const r=old.apply(this,arguments);setTimeout(ensureAutoPeople,0);setTimeout(ensureAutoPeople,80);return r};f.__p339=1;window.renderAutoPanel=f}}catch(_){}}
function ctx(){try{return window.dutyContextCellV2413||(typeof dutyContextCellV2413!=='undefined'?dutyContextCellV2413:null)}catch(_){return null}}
function colInfo(cell){try{return dutyColumnByKey(cell.dataset.type,cell.dataset.col)}catch(_){return null}}
function metric(cell){const c=colInfo(cell),u=String(c?.unit||''),k=String(c?.key||'');
 if(u==='RUTİN PORTABL')return {key:'portable',label:'Portable',match:a=>a?.col?.unit==='RUTİN PORTABL'};
 if(u==='PORTABL + SKOPİ')return k==='sk1'?{key:'skopiDay',label:'Skopi Gündüz',match:a=>a?.col?.unit==='PORTABL + SKOPİ'&&a?.col?.key==='sk1'}:{key:'skopiNobet',label:'Skopi Nöbet',match:a=>a?.col?.unit==='PORTABL + SKOPİ'&&a?.col?.key!=='sk1'};
 if(u==='POLİKLİNİK RÖNTGEN')return {key:'pol',label:'Poliklinik Röntgen',match:a=>a?.col?.unit==='POLİKLİNİK RÖNTGEN'};
 if(u==='MAMOGRAFİ')return {key:'mammo',label:'Mamografi',match:a=>a?.col?.unit==='MAMOGRAFİ'};
 if(u==='KEMİK ÖLÇÜMÜ')return {key:'bone',label:'Kemik Ölçümü',match:a=>a?.col?.unit==='KEMİK ÖLÇÜMÜ'};
 if(u==='ACİL RÖNTGEN')return {key:'acil',label:'Acil Röntgen',match:a=>a?.col?.unit==='ACİL RÖNTGEN'};
 if(u==='BİLGİSAYARLI TOMOGRAFİ')return {key:'bt',label:'BT',match:a=>a?.col?.unit==='BİLGİSAYARLI TOMOGRAFİ'};
 if(u==='BİRİM SORUMLUSU')return {key:'manager',label:'Birim Sorumlusu',match:a=>a?.col?.unit==='BİRİM SORUMLUSU'};
 if(u==='SEKRETERLİK')return {key:'secretary',label:'Sekreterlik',match:a=>a?.col?.unit==='SEKRETERLİK'};
 return {key:null,label:u||'Birim',match:a=>String(a?.col?.unit||'')===u};
}
function monthAssignments(){try{return typeof assignmentsMonth==='function'?assignmentsMonth():[]}catch(_){return []}}
function allAssignments(){try{return typeof allAssignmentsAllMonths==='function'?allAssignmentsAllMonths():monthAssignments()}catch(_){return monthAssignments()}}
function dateForDay(d){try{return dateStr(d)}catch(_){return ymSafe()+'-'+String(d).padStart(2,'0')}}
function target(mi,pid){try{if(!mi.key)return null;const n=Number(db?.netStatManual?.[mi.key+'|'+Number(pid)]?.obligation);return Number.isFinite(n)&&n>0?n:null}catch(_){return null}}
function done(mi,pid){try{return monthAssignments().filter(a=>Number(a?.person?.id)===Number(pid)&&mi.match(a)).length}catch(_){return 0}}
function idleInfo(pid,ds,match){try{const dates=allAssignments().filter(a=>Number(a?.person?.id)===Number(pid)&&(!match||match(a))&&String(a?.date||'')<ds).map(a=>String(a.date)).sort();const last=dates.at(-1);if(!last)return {days:999,last:null};const days=Math.max(0,Math.round((new Date(ds+'T12:00:00')-new Date(last+'T12:00:00'))/86400000)-1);return {days,last}}catch(_){return {days:999,last:null}}}
function suitableBox(){
 const wrap=Q('#dutyContextMenu .dutySuitableWrapV2413')||QA('#dutyContextMenu div').find(x=>/Uygun Kişiler/i.test(N(x.textContent)));
 if(!wrap)return null;
 let old=Q('#dutySuitableListV2413',wrap); if(old)old.style.setProperty('display','none','important');
 let b=Q('#rpys339SuitableList',wrap); if(!b){b=document.createElement('div');b.id='rpys339SuitableList';b.className='dutySuitableListV2413';(old||Q('button.ctxBtn',wrap)||wrap.firstChild)?.insertAdjacentElement?.('afterend',b);if(!b.parentElement)wrap.appendChild(b)}
 return b;
}
function renderSuitable339(){const cell=ctx(),box=suitableBox();if(!box)return;if(!cell){box.innerHTML='<div class="suitableNoneV2413">Hücre seçilmedi.</div>';box.style.display='block';return}
 try{const d=Number(cell.dataset.day),col=colInfo(cell);if(!col)throw new Error('Vardiya bulunamadı');const mi=metric(cell),ds=dateForDay(d),items=[];
  for(const p of activeStaff()){let ok=false;try{ok=typeof canTakeShiftV2414==='function'?!!canTakeShiftV2414(p.id,d,col,col.unit):!!canTakeShift(p.id,d,col,col.unit)}catch(_){ok=false}if(!ok)continue;
   const t=target(mi,p.id),cur=done(mi,p.id),unitIdle=idleInfo(p.id,ds,mi.match),anyIdle=idleInfo(p.id,ds,null),missing=t===null?null:Math.max(0,t-cur);let spouse=false;try{spouse=!!spouseAssignedOnDay(p.id,d)}catch(_){}items.push({p,t,cur,unitIdle,anyIdle,missing,spouse})}
  items.sort((a,b)=>{const am=a.missing===null?-1:a.missing,bm=b.missing===null?-1:b.missing;if(am!==bm)return bm-am;if(a.unitIdle.days!==b.unitIdle.days)return b.unitIdle.days-a.unitIdle.days;return String(a.p.name||'').localeCompare(String(b.p.name||''),'tr',{sensitivity:'base'})||Number(a.p.id)-Number(b.p.id)});
  const unitTxt=x=>x.unitIdle.last?(x.unitIdle.days+' gündür bu birimde çalışmadı'):'Bu birimde daha önce hiç çalışmadı';
  const anyTxt=x=>x.anyIdle.last?('Genel: '+x.anyIdle.days+' gündür hiçbir birimde mesaiye gelmedi'):'Genel: daha önce hiçbir birimde mesai kaydı yok';
  box.innerHTML='<div class="suitableHeadV2413">'+d+'. gün • '+E(col.unit)+'<br><small>'+E(col.shift)+' • '+E(mi.label)+'</small></div>'+(items.length?items.map(x=>'<button class="suitablePersonV2413 rpys339row" data-person-id="'+Number(x.p.id)+'" onclick="assignSuitableDutyV2413('+Number(x.p.id)+')" style="'+(typeof personColorStyle==='function'?personColorStyle(x.p.id,false):'')+'"><b>'+E(x.p.name)+'</b><span>Yapılan/Hedef: '+x.cur+'/'+(x.t===null?'—':x.t)+' • '+E(unitTxt(x))+' • '+E(anyTxt(x))+(x.spouse?' • ♥ Eşi bugün nöbette':'')+'</span></button>').join(''):'<div class="suitableNoneV2413">Bu hücre için kurallara uygun personel yok.</div>');
  box.style.display='block';box.style.visibility='visible';box.scrollTop=0;
 }catch(e){console.error('RPYS339 suitable',e);box.innerHTML='<div class="suitableNoneV2413">Uygun personel listesi açılamadı.</div>';box.style.display='block'}
}
function bindSuitable(){const wrap=Q('#dutyContextMenu .dutySuitableWrapV2413');if(!wrap)return false;const b=Q('button.ctxBtn',wrap);if(b&&!b.dataset.rpys339){b.dataset.rpys339='1';b.addEventListener('click',()=>setTimeout(renderSuitable339,0),false);b.addEventListener('pointerup',()=>setTimeout(renderSuitable339,0),false)}return !!suitableBox()}
function scheduleContextRefresh(e){const c=e.target?.closest?.('[data-day][data-col]');if(!c)return;setTimeout(()=>{const box=Q('#rpys339SuitableList');const menu=Q('#dutyContextMenu');if(menu&&getComputedStyle(menu).display!=='none')renderSuitable339()},0);setTimeout(()=>{const menu=Q('#dutyContextMenu');if(menu&&getComputedStyle(menu).display!=='none')renderSuitable339()},60)}
document.addEventListener('contextmenu',scheduleContextRefresh,false);
document.addEventListener('pointerup',e=>{if(e.pointerType==='touch'||e.pointerType==='pen')scheduleContextRefresh(e)},false);
try{window.renderSuitableDutyPeopleV2413=renderSuitable339}catch(_){}
function tick(){wrapAutoRender();ensureAutoPeople();bindSuitable()}
const st=document.createElement('style');st.id='rpys339style';st.textContent='#rpys337PeopleChecks{display:none!important}#rpys339PeopleChecks{margin-top:6px}.rpys339PeopleBar{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:6px 0}.rpys339PeopleBar button{margin-left:6px;padding:6px 9px;border:1px solid #cbd5e1;border-radius:8px;background:#fff}.rpys339PeopleGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:7px;max-height:300px;overflow:auto;padding:8px;border:1px solid #dbe5ef;border-radius:10px;background:#fff}.rpys339PeopleGrid label{display:flex;align-items:center;gap:8px;padding:8px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;font-weight:700}.rpys339PeopleGrid input{width:18px;height:18px}#dutySuitableListV2413{display:none!important}#rpys339SuitableList{display:none;max-height:340px;overflow:auto;transition:none!important}#rpys339SuitableList .rpys339row{transition:none!important;animation:none!important}#rpys339SuitableList .rpys339row>span{display:block;white-space:normal;line-height:1.25}';document.head.appendChild(st);
[0,80,250,700,1500,3000].forEach(t=>setTimeout(tick,t));
let tm=0;const mo=new MutationObserver(()=>{clearTimeout(tm);tm=setTimeout(tick,100)});try{mo.observe(document.documentElement,{childList:true,subtree:true})}catch(_){}
console.log('RPYS PATCH339 aktif: yeni ay isimleri + hücre değişince otomatik uygunluk');
})();
