(()=>{
'use strict';
if(window.__rpysPrintFixV1)return;window.__rpysPrintFixV1=1;
function noteText(){try{const m=document.getElementById('month')?.value||'genel';const all=JSON.parse(localStorage.getItem('rpys_page_notes_v1')||'{}');return {nobet:String(all['nobet|'+m]||'').trim(),saymanlik:String(all['saymanlik|'+m]||'').trim()};}catch(_){return {nobet:'',saymanlik:''};}}
function prepare(){
 const n=noteText();
 document.querySelectorAll('.rpysPageNote').forEach(box=>{
  const sec=box.closest('#nobet,#saymanlik');const key=sec?.id==='nobet'?'nobet':'saymanlik';const val=(key==='nobet'?n.nobet:n.saymanlik)||box.querySelector('textarea')?.value||'';
  box.querySelector('.rpysNotePrintText')?.remove();
  const p=document.createElement('div');p.className='rpysNotePrintText';p.textContent=val;box.appendChild(p);box.classList.toggle('rpysHasPrintNote',!!val);
 });
 document.querySelectorAll('#saymanlik table td:first-child,#saymanlik .sayScreenTable td:first-child,.sayScreenTable td:first-child').forEach(td=>{
  const len=(td.textContent||'').trim().length;let size=len>30?6.2:len>24?6.8:len>18?7.3:7.8;
  td.style.setProperty('font-size',size+'pt','important');td.style.setProperty('line-height','1.05','important');td.style.setProperty('white-space','normal','important');td.style.setProperty('overflow-wrap','anywhere','important');td.style.setProperty('word-break','break-word','important');
 });
}
function style(){if(document.getElementById('rpys-print-fix-v1-style'))return;const s=document.createElement('style');s.id='rpys-print-fix-v1-style';s.textContent='@media print{.rpysPageNote{display:block!important;margin:4mm 0 2mm!important;padding:2mm!important;border:1px solid #777!important;break-inside:avoid!important}.rpysPageNoteTitle,.rpysPageNoteMeta,.rpysPageNote textarea{display:none!important}.rpysNotePrintText{display:block!important;white-space:pre-wrap!important;overflow-wrap:anywhere!important;word-break:break-word!important;font:8pt Arial,sans-serif!important;line-height:1.3!important;min-height:5mm}.rpysPageNote:not(.rpysHasPrintNote){display:block!important}.sayScreenTable,#saymanlik table{table-layout:fixed!important;width:100%!important}.sayScreenTable td:first-child,#saymanlik table td:first-child{white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;overflow:hidden!important;vertical-align:middle!important}}.rpysNotePrintText{display:none}';document.head.appendChild(s)}
function run(){style();prepare()}
run();setTimeout(run,800);setTimeout(run,2000);
window.addEventListener('beforeprint',prepare);window.addEventListener('afterprint',()=>document.querySelectorAll('.rpysNotePrintText').forEach(x=>x.remove()));
})();