/* RPYS last-mile print-note guard. Ensures Saymanlik/Nobet notes survive every PDF/print route. */
(()=>{
'use strict';
if(window.__RPYS_PRINT_NOTE_GUARD_V418__)return;
window.__RPYS_PRINT_NOTE_GUARD_V418__=true;
const STORE='rpys_page_notes_v1';
const noteSelectors='.rpysSay414Note,.rpysDutyPrint415Note,.printNote,.rpysPrintNoteGuard418';

function currentMonth(){return String(document.getElementById('month')?.value||'genel')}
function store(){
 try{return JSON.parse(localStorage.getItem(STORE)||'{}')||{}}catch(_){return{}}
}
function visibleNote(kind,m){
 const sec=document.getElementById(kind),box=sec?.querySelector('.rpysPageNote');
 const ta=box?.querySelector('textarea');
 const live=[ta?.value,box?.querySelector('.rpysPageNotePrint')?.textContent,box?.querySelector('.rpysNotePrintText')?.textContent]
   .map(v=>String(v??'')).find(v=>v.trim());
 if(m===currentMonth()&&live)return live.trim();
 return String(store()[kind+'|'+m]??'').trim();
}
function style(doc){
 if(doc.getElementById('rpys-print-note-guard-style-v418'))return;
 const s=doc.createElement('style');s.id='rpys-print-note-guard-style-v418';
 s.textContent='.rpysPrintNoteGuard418{display:block!important;position:static!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important;margin:1.5mm 0!important;padding:1.5mm 2mm!important;border:1px solid #94a3b8!important;background:#fff!important;color:#111!important;font:6.5pt Arial,sans-serif!important;line-height:1.2!important;break-inside:avoid!important;page-break-inside:avoid!important;text-align:left!important}.rpysPrintNoteGuard418 b{display:block!important;font:700 6.5pt Arial,sans-serif!important;margin:0 0 .5mm!important}.rpysPrintNoteGuard418 div{display:block!important;font:6.5pt Arial,sans-serif!important;line-height:1.2!important;white-space:pre-wrap!important;overflow-wrap:anywhere!important;word-break:break-word!important}';
 (doc.head||doc.documentElement).appendChild(s);
}
function insertForTable(doc,table,kind){
 const sheet=table.closest('.sheet'),scope=sheet||table.closest('.stableSayPage,.rpys393saywrap,.rpys393doc')||table.parentElement||doc.body;
 if(scope?.querySelector(noteSelectors))return;
 const m=String(sheet?.dataset?.month||currentMonth()),value=visibleNote(kind,m);
 if(!value)return;
 const box=doc.createElement('div'),b=doc.createElement('b'),text=doc.createElement('div');
 box.className='rpysPrintNoteGuard418';box.dataset.rpysNoteKind=kind;box.dataset.rpysNoteMonth=m;
 b.textContent='Not';text.textContent=value;box.append(b,text);
 const sig=scope?.querySelector('.sigs,.sayScreenSignatures,.stableSignatures,[data-rpys-signatures]');
 if(sig)sig.insertAdjacentElement('beforebegin',box);else table.insertAdjacentElement('afterend',box);
}
function inject(doc){
 try{
  if(!doc?.documentElement)return false;
  style(doc);
  doc.querySelectorAll('table.stableSay,table.rpys393saytable,table.say').forEach(t=>insertForTable(doc,t,'saymanlik'));
  doc.querySelectorAll('table.stableDuty').forEach(t=>insertForTable(doc,t,'nobet'));
  return !!doc.querySelector(noteSelectors);
 }catch(_){return false}
}
function guardHtml(html){
 const raw=String(html??'');
 if(!/<table/i.test(raw))return raw;
 try{
  const d=new DOMParser().parseFromString(raw,'text/html');
  if(!d.querySelector('table.stableSay,table.rpys393saytable,table.say,table.stableDuty'))return raw;
  d.body.prepend(...d.head.querySelectorAll('style'));
  inject(d);return d.body.innerHTML;
 }catch(_){return raw}
}
function wrapRenderers(){
 for(const name of ['stableSayDoc','stableDutyDoc']){
  const old=window[name];if(typeof old!=='function'||old.__rpysNoteGuard418)continue;
  const wrapped=function(){return guardHtml(old.apply(this,arguments))};
  Object.assign(wrapped,old);wrapped.__rpysNoteGuard418=true;window[name]=wrapped;
  try{if(name==='stableSayDoc')stableSayDoc=wrapped;else stableDutyDoc=wrapped}catch(_){}
 }
 for(const name of ['stablePrintDocument','openPrintDocument']){
  const old=window[name];if(typeof old!=='function'||old.__rpysNoteGuard418)continue;
  const wrapped=function(title,body,...rest){return old.call(this,title,guardHtml(body),...rest)};
  Object.assign(wrapped,old);wrapped.__rpysNoteGuard418=true;window[name]=wrapped;
  try{if(name==='stablePrintDocument')stablePrintDocument=wrapped;else openPrintDocument=wrapped}catch(_){}
 }
}
function armFrame(frame){
 if(!frame||frame.__rpysNoteGuard418)return;frame.__rpysNoteGuard418=true;
 const arm=()=>{
  try{
   const w=frame.contentWindow,d=frame.contentDocument;if(!w||!d)return;
   inject(d);
   if(!w.__rpysNoteGuardPrint418){
    const old=w.print?.bind(w);if(typeof old==='function'){
     w.print=function(){inject(d);return old()};w.__rpysNoteGuardPrint418=true;
    }
   }
  }catch(_){}
 };
 frame.addEventListener('load',arm);arm();setTimeout(arm,0);setTimeout(arm,80);setTimeout(arm,300);
}
function scan(){wrapRenderers();document.querySelectorAll('iframe').forEach(armFrame)}
const obs=new MutationObserver(scan);
function start(){
 scan();obs.observe(document.documentElement,{childList:true,subtree:true});
 let n=0;const iv=setInterval(()=>{scan();if(++n>=120)clearInterval(iv)},500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
window.addEventListener('rpys-direct-core-ready',scan);
window.rpysPrintNoteGuard418={inject,guardHtml,scan};
})();