/* Nöbet Listesi print controls and per-shift visibility. */
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
function filterPrintedShifts(d,type){
 const table=d.querySelector('table.stableDuty'),head=table?.tHead,shiftRow=head?.rows?.[1];if(!table||!shiftRow)return;
 const hidden=collapsedShifts(),groups=[...head.rows[0].cells].filter(th=>th.rowSpan<2||th.colSpan>1),remove=[],adjust=[];let offset=0;
 for(const group of groups){
  if(group.rowSpan>1&&group.colSpan===1)continue;
  const span=Math.max(1,Number(group.colSpan)||1),unit=group.textContent.trim(),seen=new Map();let keep=0;
  for(let i=0;i<span;i++){
   const shift=shiftRow.cells[offset+i],name=String(shift?.textContent||'').trim(),occ=seen.get(name)||0;seen.set(name,occ+1);
   if(hidden.has([type,unit,name,occ].join('|')))remove.push(offset+i);else keep++
  }
  adjust.push({group,keep});offset+=span
 }
 for(const index of remove.sort((a,b)=>b-a)){
  shiftRow.cells[index]?.remove();
  for(const row of table.tBodies[0]?.rows||[])row.cells[index+1]?.remove();
  table.querySelector('colgroup')?.children[index+1]?.remove();
 }
 for(const item of adjust){if(!item.keep)item.group.remove();else item.group.colSpan=item.keep}
 const cols=table.querySelectorAll('colgroup col');cols.forEach((col,index)=>{if(index>0)col.style.width=''});
}
function documentBody(type){
 if(typeof stableDutyDoc!=='function')throw Error('Nöbet listesi henüz hazır değil.');
 const d=new DOMParser().parseFromString(stableDutyDoc(type),'text/html');
 const table=d.querySelector('table.stableDuty');
 if(!table)throw Error('Nöbet tablosu oluşturulamadı.');
 d.body.prepend(...d.head.querySelectorAll('style'));
 filterPrintedShifts(d,type);
 const value=note();
 // v418 wraps stableDutyDoc and already adds the note. Avoid printing a second copy.
 if(value&&!d.querySelector('.rpysPrintNoteGuard418,.rpysDutyPrint415Note,.printNote,.rpysPrintNote')){
  const box=d.createElement('div'),title=d.createElement('b'),content=d.createElement('div');
  box.className='rpysDutyPrint415Note';title.textContent='Not';content.textContent=value;
  box.append(title,content);table.insertAdjacentElement('afterend',box);
 }
 return d.body.innerHTML;
}

const COLLAPSED_SHIFTS='rpys_duty_collapsed_shifts_v1';
function shiftName(th){return String(th?.dataset?.rpysShiftName||th?.textContent?.replace(/\s*\(gizli\)\s*$/i,'').trim()||'')}
function collapsedShifts(){try{return new Set(JSON.parse(sessionStorage.getItem(COLLAPSED_SHIFTS)||'[]'))}catch(_){return new Set()}}
function saveCollapsedShifts(set){try{sessionStorage.setItem(COLLAPSED_SHIFTS,JSON.stringify([...set]))}catch(_){}}
function shiftInfo(th){
 const table=th?.closest('table.schedule'),head=table?.tHead,shiftRow=head?.rows?.[1];if(!table||!shiftRow)return null;
 const shifts=[...shiftRow.cells],index=shifts.indexOf(th);if(index<0)return null;
 let offset=0,unit='',within=0;
 for(const group of head.rows[0].querySelectorAll('th.unitHeaderAction')){
  const span=Math.max(1,Number(group.dataset.rpysOriginalSpan)||Number(group.colSpan)||1);
  if(index>=offset&&index<offset+span){unit=[...group.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim()||group.textContent.trim();within=index-offset;break}
  offset+=span;
 }
 if(!unit)return null;
 const type=table.closest('#acilGrid')?'acil':'pol',name=shiftName(th);
 const same=[...shifts.slice(0,index)].filter(x=>{
  const info=shiftInfoBase(x,head);return info?.unit===unit&&info?.name===name
 }).length;
 return {table,index,unit,name,type,key:[type,unit,name,same].join('|')}
}
function shiftInfoBase(th,head){
 const shifts=[...head.rows[1].cells],index=shifts.indexOf(th);if(index<0)return null;
 let offset=0,unit='';for(const group of head.rows[0].querySelectorAll('th.unitHeaderAction')){const span=Math.max(1,Number(group.dataset.rpysOriginalSpan)||Number(group.colSpan)||1);if(index>=offset&&index<offset+span){unit=[...group.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim()||group.textContent.trim();break}offset+=span}
 return {unit,name:shiftName(th)}
}
function applyShiftVisibility(th,hidden){
 const info=shiftInfo(th);if(!info)return;
 for(const row of [...info.table.rows].slice(2)){const cell=row.cells[info.index+1];if(cell)cell.style.display=hidden?'none':''}
 th.dataset.rpysShiftName=info.name;th.setAttribute('aria-expanded',String(!hidden));
 th.title='Sağ tık ile gizle: '+info.unit+' • '+info.name;th.style.display=hidden?'none':'';
 const head=info.table.tHead,groups=[...head.rows[0].querySelectorAll('th.unitHeaderAction')];let offset=0;
 for(const group of groups){
  const span=Math.max(1,Number(group.dataset.rpysOriginalSpan)||Number(group.colSpan)||1),shown=[...head.rows[1].cells].slice(offset,offset+span).filter(x=>x.style.display!=='none').length;
  group.colSpan=Math.max(1,shown);group.style.display=shown?'':'none';offset+=span;
 }
 renderHiddenShiftControls(info.table);
}
function toggleShift(th){
 const info=shiftInfo(th);if(!info)return;
 const state=collapsedShifts(),hidden=!state.has(info.key);
 if(hidden)state.add(info.key);else state.delete(info.key);
 saveCollapsedShifts(state);applyShiftVisibility(th,hidden);
}
function scanShiftHeaders(){
 const state=collapsedShifts();
 document.querySelectorAll('#nobet #polGrid table.schedule,#nobet #acilGrid table.schedule').forEach(table=>{
  for(const group of table.tHead?.rows?.[0]?.querySelectorAll('th.unitHeaderAction')||[])if(!group.dataset.rpysOriginalSpan)group.dataset.rpysOriginalSpan=String(group.colSpan||1);
  for(const th of table.tHead?.rows?.[1]?.querySelectorAll('th.shift')||[]){
   const info=shiftInfo(th);if(!info)continue;
   th.dataset.rpysShiftName=info.name;th.style.cursor='context-menu';
   applyShiftVisibility(th,state.has(info.key));
  }
 });
}
function renderHiddenShiftControls(table){
 const grid=table.closest('#polGrid,#acilGrid');if(!grid)return;
 const hidden=[...(table.tHead?.rows?.[1]?.querySelectorAll('th.shift')||[])].map(th=>({th,info:shiftInfo(th)})).filter(x=>x.info&&collapsedShifts().has(x.info.key));
 let tray=grid.querySelector(':scope > .rpysDutyHiddenShifts');
 if(!hidden.length){tray?.remove();return}
 if(!tray){tray=document.createElement('div');tray.className='rpysDutyHiddenShifts';grid.insertBefore(tray,table)}
 const signature=JSON.stringify(hidden.map(x=>x.info.key));if(tray.dataset.signature===signature)return;
 tray.dataset.signature=signature;tray.replaceChildren();
 for(const item of hidden){const button=document.createElement('button');button.type='button';button.className='rpysDutyShowShift';button.dataset.shiftKey=item.info.key;button.dataset.grid=grid.id;button.textContent='↗ Göster: '+item.info.unit+' • '+item.info.name;tray.append(button)}
}
document.addEventListener('contextmenu',event=>{
 const th=event.target.closest?.('#nobet #polGrid th.shift,#nobet #acilGrid th.shift');
 if(!th)return;
 event.preventDefault();event.stopImmediatePropagation();toggleShift(th);
},true);
document.addEventListener('click',event=>{
 const button=event.target.closest?.('#nobet .rpysDutyShowShift');if(!button)return;
 event.preventDefault();const grid=document.getElementById(button.dataset.grid),table=grid?.querySelector('table.schedule');
 const th=[...(table?.tHead?.rows?.[1]?.querySelectorAll('th.shift')||[])].find(x=>shiftInfo(x)?.key===button.dataset.shiftKey);if(!th)return;
 const state=collapsedShifts();state.delete(button.dataset.shiftKey);saveCollapsedShifts(state);applyShiftVisibility(th,false);
},true);
const shiftObserver=new MutationObserver(scanShiftHeaders);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{scanShiftHeaders();shiftObserver.observe(document.documentElement,{childList:true,subtree:true})});
else {scanShiftHeaders();shiftObserver.observe(document.documentElement,{childList:true,subtree:true})}
const shiftStyle=document.createElement('style');shiftStyle.textContent='#nobet .schedule th.shift{cursor:context-menu!important}.rpysDutyHiddenShifts{display:flex;flex-wrap:wrap;gap:5px;margin:4px 0 7px}.rpysDutyHiddenShifts button{border:1px solid #94a3b8;border-radius:5px;background:#eef4f9;color:#17365d;padding:4px 8px;font-size:11px;cursor:pointer}';document.head.append(shiftStyle);
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
