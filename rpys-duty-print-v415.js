/* Nöbet Listesi print controls only. Reads the existing document renderer. */
(()=>{
'use strict';
if(window.rpysDutyPrint415)return;
const selector='#nobet #polPanel .toolbar button[onclick*="stablePrintDuty"],#nobet #acilPanel .toolbar button[onclick*="stablePrintDuty"]';
const month=()=>document.getElementById('month')?.value||'genel';
function install(){
 document.querySelectorAll(selector).forEach(button=>{
  button.textContent='🖨 Listeyi Yazdır';
  button.title='A4 yönünü seçerek Nöbet Listesi’ni yazdır';
  button.removeAttribute('data-rpys383print');
 });
}
function note(){
 const box=document.querySelector('#nobet .rpysPageNote'),ta=box?.querySelector('textarea');
 if(ta&&box.dataset.rpysNoteMonth===month())return ta.value.trim();
 try{const notes=JSON.parse(localStorage.getItem('rpys_page_notes_v1')||'{}');return String(notes['nobet|'+month()]||'').trim()}catch(_){return ''}
}
function documentBody(type){
 if(typeof stableDutyDoc!=='function')throw Error('Nöbet listesi henüz hazır değil.');
 const d=new DOMParser().parseFromString(stableDutyDoc(type),'text/html');
 const table=d.querySelector('table.stableDuty');
 if(!table)throw Error('Nöbet tablosu oluşturulamadı.');
 d.body.prepend(...d.head.querySelectorAll('style'));
 const value=note();
 // v418 wraps stableDutyDoc and already adds the note. Avoid printing a second copy.
 if(value&&!d.querySelector('.rpysPrintNoteGuard418,.rpysDutyPrint415Note,.printNote,.rpysPrintNote')){
  const box=d.createElement('div'),title=d.createElement('b'),content=d.createElement('div');
  box.className='rpysDutyPrint415Note';title.textContent='Not';content.textContent=value;
  box.append(title,content);table.insertAdjacentElement('afterend',box);
 }
 return d.body.innerHTML;
}

const COLLAPSED_UNITS='rpys_duty_collapsed_units_v1';
function unitName(th){return String(th?.dataset?.unitName||[...(th?.childNodes||[])].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim()||th?.textContent?.replace(/\s*\(gizli\)\s*$/i,'').trim()||'')}
function collapsedUnits(){try{return new Set(JSON.parse(sessionStorage.getItem(COLLAPSED_UNITS)||'[]'))}catch(_){return new Set()}}
function saveCollapsedUnits(set){try{sessionStorage.setItem(COLLAPSED_UNITS,JSON.stringify([...set]))}catch(_){}}
function applyUnitVisibility(table,unit,hidden){
 const head=table.tHead;if(!head?.rows?.length)return;
 const groups=[...head.rows[0].querySelectorAll('th.unitHeaderAction')];
 const group=groups.find(th=>unitName(th)===unit);
 if(!group)return;
 let start=2;
 for(const th of groups){if(th===group)break;start+=Math.max(1,Number(th.colSpan)||1)}
 const count=Math.max(1,Number(group.colSpan)||1),shiftRow=head.rows[1];
 for(let i=0;i<count;i++){
  const shift=shiftRow?.cells[start-2+i];if(shift)shift.style.display=hidden?'none':'';
  for(const row of [...table.rows].slice(2)){const cell=row.cells[start-1+i];if(cell)cell.style.display=hidden?'none':''}
 }
 group.dataset.unitName=unit;group.setAttribute('aria-expanded',String(!hidden));
 group.title='Tıklayarak birimi '+(hidden?'göster':'gizle')+' • Sağ tık: birim ayını temizle';
 group.style.cursor='pointer';group.classList.toggle('rpysUnitCollapsed',hidden);
 let badge=group.querySelector('.rpysUnitHiddenBadge');
 if(hidden&&!badge){badge=table.ownerDocument.createElement('span');badge.className='rpysUnitHiddenBadge';badge.textContent=' (gizli)';group.append(badge)}
 if(!hidden)badge?.remove();
}
function toggleUnit(group){
 const table=group?.closest('table.schedule'),unit=unitName(group);if(!table||!unit)return;
 const type=group.dataset.unitType||(table.closest('#acilGrid')?'acil':'pol'),key=type+'|'+unit,state=collapsedUnits(),hidden=!state.has(key);
 if(hidden)state.add(key);else state.delete(key);
 saveCollapsedUnits(state);applyUnitVisibility(table,unit,hidden);
}
function scanUnitHeaders(){
 const state=collapsedUnits();
 document.querySelectorAll('#nobet #polGrid table.schedule,#nobet #acilGrid table.schedule').forEach(table=>{
  for(const group of table.tHead?.rows?.[0]?.querySelectorAll('th.unitHeaderAction')||[]){
   const unit=unitName(group);
   group.dataset.unitName=unit;group.style.cursor='pointer';
   group.title='Tıklayarak birimi gizle/göster • Sağ tık: birim ayını temizle';
   const type=group.dataset.unitType||(table.closest('#acilGrid')?'acil':'pol');
   applyUnitVisibility(table,unit,state.has(type+'|'+unit));
  }
 });
}
document.addEventListener('click',event=>{
 const group=event.target.closest?.('#nobet #polGrid th.unitHeaderAction,#nobet #acilGrid th.unitHeaderAction');
 if(!group)return;
 toggleUnit(group);
},true);
let dutyTouch=null;
document.addEventListener('touchstart',event=>{
 const group=event.target.closest?.('#nobet #polGrid th.unitHeaderAction,#nobet #acilGrid th.unitHeaderAction');if(!group||event.touches.length!==1)return;
 const touch=event.touches[0],type=group.dataset.unitType||(group.closest('#acilGrid')?'acil':'pol');
 dutyTouch={group,x:touch.clientX,y:touch.clientY,moved:false,timer:setTimeout(()=>{
  if(!dutyTouch||dutyTouch.group!==group||dutyTouch.moved)return;
  dutyTouch.long=true;
  if(typeof window.showUnitHeaderMenu==='function')window.showUnitHeaderMenu({preventDefault(){},stopPropagation(){},clientX:dutyTouch.x,clientY:dutyTouch.y},type,unitName(group));
 },540)};
 event.preventDefault();event.stopImmediatePropagation();
},true);
document.addEventListener('touchmove',event=>{
 if(!dutyTouch||event.touches.length!==1)return;
 const touch=event.touches[0];if(Math.abs(touch.clientX-dutyTouch.x)>12||Math.abs(touch.clientY-dutyTouch.y)>12){dutyTouch.moved=true;clearTimeout(dutyTouch.timer)}
 event.stopImmediatePropagation();
},true);
document.addEventListener('touchend',event=>{
 if(!dutyTouch)return;
 const current=dutyTouch;clearTimeout(current.timer);dutyTouch=null;
 event.preventDefault();event.stopImmediatePropagation();
 if(!current.moved&&!current.long)toggleUnit(current.group);
},true);
document.addEventListener('touchcancel',event=>{if(dutyTouch)clearTimeout(dutyTouch.timer);dutyTouch=null;event.stopImmediatePropagation()},true);
const unitObserver=new MutationObserver(scanUnitHeaders);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{scanUnitHeaders();unitObserver.observe(document.documentElement,{childList:true,subtree:true})});
else {scanUnitHeaders();unitObserver.observe(document.documentElement,{childList:true,subtree:true})}
const unitStyle=document.createElement('style');unitStyle.textContent='#nobet .schedule th.unitHeaderAction{cursor:pointer!important}#nobet .schedule th.unitHeaderAction.rpysUnitCollapsed{font-size:8pt!important;opacity:.78;background:#dbe5ef!important}#nobet .schedule .rpysUnitHiddenBadge{font-size:.82em;font-weight:500;white-space:nowrap}';document.head.append(unitStyle);
function print(type,orientation){
 document.getElementById('rpysDutyPrint415Frame')?.remove();
 const frame=document.createElement('iframe');frame.id='rpysDutyPrint415Frame';
 frame.title='Nöbet Listesi yazdırma belgesi';
 frame.style.cssText='position:fixed;left:-14000px;top:0;width:1400px;height:1000px;border:0;pointer-events:none';
 document.body.append(frame);
 let body;
 try{body=documentBody(type)}catch(error){frame.remove();alert(error.message);return}
 const landscape=orientation==='landscape',width=landscape?297:210,height=landscape?210:297;
 const css=`@page{size:A4 ${orientation};margin:0}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}html,body{margin:0;padding:0;background:white;color:#111;font-family:Arial,sans-serif}
  #rpysDutyPrint415Page{position:relative;width:${width}mm;height:${height}mm;overflow:hidden}
  #rpysDutyPrint415Viewport{position:absolute;inset:5mm;overflow:hidden}
  #rpysDutyPrint415Content{width:100%;transform-origin:top left}
  #rpysDutyPrint415Content table{width:100%;border-collapse:collapse;table-layout:fixed}
  #rpysDutyPrint415Content th,#rpysDutyPrint415Content td{border:1px solid #b7c8d9;padding:.25mm;text-align:center;vertical-align:middle;overflow-wrap:anywhere}
  #rpysDutyPrint415Content .stableDuty th,#rpysDutyPrint415Content .stableDuty td{font-size:5.5pt;line-height:1.05;height:4.3mm}
  #rpysDutyPrint415Content table.stableDuty tbody td:not(:first-child){height:auto!important;font-size:4.7pt!important;line-height:1.02!important;padding:.16mm .22mm!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;overflow:hidden!important}
  #rpysDutyPrint415Content .ph{text-align:center;margin-bottom:2mm}
  #rpysDutyPrint415Content .sigs{display:grid;grid-template-columns:repeat(3,1fr);text-align:center;gap:3mm;margin-top:2mm}
  .rpysDutyPrint415Note{border:1px solid #94a3b8;padding:1.4mm 2mm;margin:2mm 0;font:6.5pt Arial,sans-serif;line-height:1.2;break-inside:avoid}
  .rpysDutyPrint415Note b{display:block;margin-bottom:.5mm}.rpysDutyPrint415Note div{white-space:pre-wrap;overflow-wrap:anywhere}`;
 const doc=frame.contentDocument;doc.open();doc.write('<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Nöbet Listesi</title><style>'+css+'</style></head><body><div id="rpysDutyPrint415Page"><div id="rpysDutyPrint415Viewport"><div id="rpysDutyPrint415Content">'+body+'</div></div></div></body></html>');doc.close();
 const ready=doc.fonts?.ready||Promise.resolve();
 Promise.resolve(ready).then(()=>{
  if(!frame.isConnected)return;
  const viewport=doc.getElementById('rpysDutyPrint415Viewport'),content=doc.getElementById('rpysDutyPrint415Content');
  const scale=Math.min(1,viewport.clientWidth/Math.max(1,content.scrollWidth),viewport.clientHeight/Math.max(1,content.scrollHeight));
  content.style.transform='scale('+scale+')';
  frame.contentWindow.focus();frame.contentWindow.print();
 }).catch(e=>{frame.remove();alert('Yazdırma hazırlanamadı: '+e.message)});
 setTimeout(()=>frame.remove(),30000);
}
function choose(type){
 document.getElementById('rpysDutyPrint415Dialog')?.remove();
 const dialog=document.createElement('div');dialog.id='rpysDutyPrint415Dialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','Nöbet Listesi yazdırma yönü');
 dialog.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#0f172a88;display:flex;align-items:center;justify-content:center';
 dialog.innerHTML='<div style="width:min(360px,92vw);padding:16px;background:white;border-radius:12px;color:#17365d;font:14px Arial,sans-serif"><b>A4 Yazdırma Yönü</b><div style="display:flex;gap:8px;margin-top:14px"><button data-orientation="portrait" style="flex:1;padding:12px">↕ Dikey</button><button data-orientation="landscape" style="flex:1;padding:12px">↔ Yatay</button></div><button data-close style="margin-top:10px;padding:8px;width:100%">İptal</button></div>';
 dialog.querySelector('[data-close]').onclick=()=>dialog.remove();
 dialog.querySelectorAll('[data-orientation]').forEach(button=>button.onclick=()=>{const orientation=button.dataset.orientation;dialog.remove();print(type,orientation)});
 dialog.onkeydown=e=>{if(e.key==='Escape')dialog.remove()};
 document.body.append(dialog);dialog.querySelector('[data-orientation]').focus();
}
window.addEventListener('click',event=>{
 const button=event.target.closest?.(selector);if(!button)return;
 event.preventDefault();event.stopImmediatePropagation();
 choose(button.closest('#acilPanel')?'acil':'pol');
},true);
window.rpysDutyPrint415={install,documentBody,print};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
window.addEventListener('rpys-direct-core-ready',install);
})();
