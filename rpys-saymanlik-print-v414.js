/* Saymanlık document formatting only. No writes to RPYS records or cloud data. */
(()=>{
'use strict';
if(window.rpysSaymanlik414)return;
const label=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
const number=s=>{const n=Number(String(s??'').trim().replace(/\s*SAAT\s*$/i,'').replace(',','.'));return Number.isFinite(n)?n:0};
const hours=n=>String(Math.round(n*100)/100).replace('.',',')+' SAAT';
const month=()=>document.getElementById('month')?.value||'genel';
let reading=false,renderer=null;
const css=`
table.rpysSay414Table.stableSay,table.rpysSay414Table.say{width:100%!important;table-layout:fixed!important;border-collapse:collapse!important}
table.rpysSay414Table.stableSay th.nameHead,table.rpysSay414Table.say th.rpysSay414Head{height:auto!important;min-height:4.2mm!important;padding:.3mm .2mm!important;white-space:normal!important;overflow:hidden!important;word-break:normal!important;overflow-wrap:anywhere!important;line-height:1.08!important}
table.rpysSay414Table th .rpysSay414Name{display:block!important;max-width:100%!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:normal!important;font-size:4.4pt!important;line-height:1.08!important}
table.rpysSay414Table th .rpysSay414Long{font-size:4pt!important}
.sheet[data-doc] table.rpysSay414Table.stableSay tbody tr:not(.rpysSay414Grand) td{height:3.4mm!important;min-height:0!important;padding:.12mm .18mm!important}
table.rpysSay414Table.stableSay tr:not(.rpysSay414Grand) td:first-child,table.rpysSay414Table.stableSay th:first-child{width:13mm!important;min-width:0!important;max-width:13mm!important;padding:.14mm .18mm!important;font-size:4.45pt!important;line-height:1!important;overflow:hidden!important}
table.rpysSay414Table.stableSay tr.rpysSay414Grand td,table.rpysSay414Table.say tr.rpysSay414Grand td{width:auto!important;min-width:0!important;max-width:none!important;white-space:nowrap!important;overflow-wrap:normal!important;word-break:normal!important;text-align:center!important;font-size:5.1pt!important;line-height:1.1!important;height:4.2mm!important;padding:.3mm .5mm!important;overflow:hidden!important}
table.rpysSay414Table .rpysSay414GrandLabel,table.rpysSay414Table .rpysSay414GrandValue{display:inline!important;font:inherit!important;white-space:nowrap!important}
.rpysSay414Note{display:block!important;position:static!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important;margin:1.5mm 0!important;padding:1.5mm 2mm!important;border:1px solid #94a3b8!important;font:6.5pt Arial,sans-serif!important;line-height:1.2!important;break-inside:avoid!important;text-align:left!important}
.rpysSay414Note b{display:block!important;font:700 6.5pt Arial,sans-serif!important;margin-bottom:.5mm!important}
.rpysSay414Note div{display:block!important;font:6.5pt Arial,sans-serif!important;line-height:1.2!important;white-space:pre-wrap!important;overflow-wrap:anywhere!important}
@media print{.rpysSay414Table,.rpysSay414Note{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
`;
function note(m){
 const ta=document.querySelector('#saymanlik .rpysPageNote textarea'),box=ta?.closest('.rpysPageNote');
 if(box?.dataset.rpysNoteMonth===m)return String(ta.value||'').trim();
 try{const all=JSON.parse(localStorage.getItem('rpys_page_notes_v1')||'{}');return String(all['saymanlik|'+m]||'').trim()}catch(_){return ''}
}
function unitTotals(){
 // Read both rendered rosters: includes manual/imported puantaj values and people
 // present in historical lists. Avoid the old grand-total cache and its label bug.
 const sum={muk:0,extra:0},seen=new Set();
 if(typeof renderer!=='function'||typeof sayNamesForPage!=='function')throw Error('Saymanlık çıktı kaynağı hazır değil.');
 reading=true;
 try{for(const pg of [1,2]){
  const roster=sayNamesForPage(pg)||[];
  const d=new DOMParser().parseFromString(renderer(roster,'SAYFA '+pg+'/2'),'text/html');
  const t=d.querySelector('table.stableSay,table.rpys393saytable');
  if(!t&&roster.length)throw Error('Saymanlık tablosu bulunamadı.');
  const row=k=>[...(t?.rows||[])].find(r=>label(r.cells[0]?.textContent)===k);
  const muk=row('MUKELLEF'),diff=row('FARK');
  if(roster.length&&(!muk||!diff))throw Error('Saymanlık MÜKELLEF/FARK satırları bulunamadı.');
  roster.forEach((name,i)=>{
   const id=typeof personIdByName==='function'?personIdByName(name):null,key=id?'id:'+id:'name:'+label(name);
   if(seen.has(key))return;seen.add(key);
   sum.muk+=number(muk?.cells[i+1]?.textContent);
   sum.extra+=Math.max(0,number(diff?.cells[i+1]?.textContent));
  });
 }}finally{reading=false}
 return sum;
}
function prepare(html,opts={}){
 const d=new DOMParser().parseFromString(String(html||''),'text/html');
 const tables=[...d.querySelectorAll('table.stableSay,table.rpys393saytable,table.say')].filter(t=>[...t.rows].some(r=>label(r.cells[0]?.textContent)==='MUKELLEF'));
 if(!tables.length)return html;
 // DOMParser can move leading legacy print styles into <head>. Keep them so
 // the existing colors, row heights, header and signature sizing survive.
 d.body.prepend(...d.head.querySelectorAll('style'));
 const sum=opts.snapshot?null:unitTotals(),m=opts.month||month();
 for(const t of tables){
  const value=sum||{muk:number(t.dataset.rpysUnitMuk),extra:number(t.dataset.rpysUnitExtra)};
  t.classList.add('rpysSay414Table');t.dataset.rpysUnitMuk=String(value.muk);t.dataset.rpysUnitExtra=String(value.extra);
  // Keep the existing date/person column widths; only format their contents.
  t.querySelectorAll('thead th.nameHead,thead tr:last-child th:not(:first-child)').forEach(th=>{
   if(th.colSpan>1)return;
   const name=th.textContent.trim(),span=d.createElement('span');span.className='rpysSay414Name'+(name.length>22?' rpysSay414Long':'');span.textContent=name;
   th.classList.add('rpysSay414Head');th.replaceChildren(span);
  });
  for(const r of [...t.rows])if(r.classList.contains('rpys393grand')||r.classList.contains('rpys393grand2')||r.classList.contains('rpysSay414Grand')||/^TOPLAM (MUKELLEF|FAZLA)/.test(label(r.cells[0]?.textContent)))r.remove();
  const columns=Math.max(...[...t.rows].map(r=>[...r.cells].reduce((n,c)=>n+c.colSpan,0))),tb=t.tBodies[t.tBodies.length-1]||t.createTBody();
  for(const [text,val,cls] of [['TOPLAM MÜKELLEF',value.muk,'rpys393grand'],['TOPLAM FAZLA MESAİ',value.extra,'rpys393grand2']]){
   const r=tb.insertRow();r.className='rpysSay414Grand '+cls;
   const td=r.insertCell();td.colSpan=columns;
   const a=d.createElement('span'),b=d.createElement('span');a.className='rpysSay414GrandLabel';b.className='rpysSay414GrandValue';a.textContent=text;b.textContent=hours(val);td.append(a,' — ',b);
  }
  // Embed each page's note before its signatures, inside the document body.
  const page=t.closest('.stableSayPage,.rpys393saywrap')||t.parentElement;
  page.querySelectorAll('.rpysSay414Note,.rpys383Note,.printNote').forEach(x=>x.remove());
  const text=opts.snapshot?String(t.dataset.rpysNote||''):note(m);t.dataset.rpysNote=text;
  if(text){const box=d.createElement('div'),b=d.createElement('b'),content=d.createElement('div');box.className='rpysSay414Note';b.textContent='Not';content.textContent=text;box.append(b,content);t.insertAdjacentElement('afterend',box)}
 }
 d.querySelectorAll('#rpys-saymanlik-print-style-v414').forEach(x=>x.remove());
 const style=d.createElement('style');style.id='rpys-saymanlik-print-style-v414';style.textContent=css;d.body.append(style);
 return d.body.innerHTML;
}
function install(){
 if(typeof window.stableSayDoc==='function'&&!window.stableSayDoc.__rpys414){
  const old=window.stableSayDoc;renderer=old;
  const wrap=function(){const body=old.apply(this,arguments);return reading?body:prepare(body)};
  Object.assign(wrap,old);wrap.__rpys414=true;window.stableSayDoc=wrap;
  try{stableSayDoc=wrap}catch(_){}
 }
 for(const name of ['stablePrintDocument','openPrintDocument']){
  const old=window[name];if(typeof old!=='function'||old.__rpys414)continue;
  const wrap=function(title,body,...rest){return old.call(this,title,prepare(body),...rest)};
  Object.assign(wrap,old);wrap.__rpys414=true;window[name]=wrap;
  try{if(name==='stablePrintDocument')stablePrintDocument=wrap;else openPrintDocument=wrap}catch(_){}
 }
}
function repairQuickFrame(){
 const f=document.getElementById('rpys383printframe');
 if(!f||f.__rpys414)return;
 const repair=()=>{try{const d=f.contentDocument;if(!d?.querySelector('table.rpysSay414Table'))return;d.body.innerHTML=prepare(d.body.innerHTML,{snapshot:true});f.__rpys414=true}catch(e){console.warn('Saymanlık çıktı düzeltmesi',e)}};
 f.addEventListener('load',repair,{once:true});repair();
}
window.rpysSaymanlik414={prepare,unitTotals,install};
install();window.addEventListener('rpys-direct-core-ready',install);
document.addEventListener('DOMContentLoaded',install);
const observer=new MutationObserver(()=>{install();repairQuickFrame()});observer.observe(document.documentElement,{childList:true,subtree:true});
// Cloud patches can replace renderers after startup without changing the DOM.
let count=0;const timer=setInterval(()=>{install();if(++count>=120)clearInterval(timer)},500);
})();
