const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const script=fs.readFileSync(path.join(__dirname,'../rpys-duty-print-v415.js'),'utf8');
function fixture(){
 const dom=new JSDOM('<select id="month"><option value="2026-10">Ekim</option></select><section id="nobet"><div id="polPanel"><div class="toolbar"><button onclick="stablePrintDuty(\'pol\')">🖨️ Listeyi Dikey A4 Yazdır</button></div></div><div id="acilPanel"><div class="toolbar"><button onclick="stablePrintDuty(\'acil\')">🖨️ Listeyi Dikey A4 Yazdır</button></div></div><div class="rpysPageNote" data-rpys-note-month="2026-10"><textarea></textarea></div></section><section id="saymanlik"><button id="sayPrint">🖨️ Normal Yazdır</button></section>',{url:'https://example.com',runScripts:'outside-only'}),w=dom.window;
 w.eval(`var db={assign:{locked:1},assignmentMeta:{locked:{locked:true,manual:true}}},original=db;
 function stableDutyDoc(type){return '<div class="rpys393doc"><h2>'+type+'</h2><table class="stableDuty"><tbody><tr><td>Örnek Personel</td></tr></tbody></table><div class="sigs">İmzalar</div></div>'}
 function stablePrintDuty(){throw Error('Old print flow must not run')}`);
 w.eval(script);w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 return {dom,w,d:w.document};
}
test('Nöbet buttons restore the orientation chooser and intercept stale Saymanlık routing',()=>{
 const {dom,w,d}=fixture();try{
  const buttons=[...d.querySelectorAll('#nobet .toolbar button')],before=JSON.stringify(w.db);let legacy=0,normal=0;
  d.addEventListener('click',e=>{if(e.target.closest?.('#nobet .toolbar button'))legacy++;if(e.target.id==='sayPrint')normal++},true);
  buttons.forEach(b=>assert.equal(b.textContent,'🖨 Listeyi Yazdır'));
  buttons[0].dataset.rpys383print='say';buttons[0].click();
  assert.equal(legacy,0);assert.equal(d.querySelectorAll('#rpysDutyPrint415Dialog').length,1);
  assert.equal(d.querySelectorAll('#rpysDutyPrint415Dialog [data-orientation]').length,2);
  d.querySelector('[data-close]').click();assert.equal(d.querySelector('#rpysDutyPrint415Dialog'),null);
  d.getElementById('sayPrint').click();assert.equal(normal,1);assert.equal(legacy,0);
  assert.equal(w.db,w.original);assert.equal(JSON.stringify(w.db),before);
 }finally{dom.window.close()}
});
test('each list retains its renderer; the current monthly note prints before signatures and is escaped',()=>{
 const {dom,w,d}=fixture();try{
  const ta=d.querySelector('#nobet textarea');ta.value='Nöbet notu\n<img src=x onerror=alert(1)>';
  for(const type of ['pol','acil']){
   const document=new w.DOMParser().parseFromString(w.rpysDutyPrint415.documentBody(type),'text/html');
   assert.equal(document.querySelector('h2').textContent,type);
   assert.equal(document.querySelector('.rpysDutyPrint415Note div').textContent,ta.value);
   assert.equal(document.querySelectorAll('img').length,0);
   assert.equal(document.querySelector('table').nextElementSibling.className,'rpysDutyPrint415Note');
   assert.equal(document.querySelector('.rpysDutyPrint415Note').nextElementSibling.className,'sigs');
  }
  d.getElementById('month').value='2026-10';
  d.querySelector('.rpysPageNote').dataset.rpysNoteMonth='2026-09';
  assert.ok(!w.rpysDutyPrint415.documentBody('pol').includes('Nöbet notu'));
 }finally{dom.window.close()}
});
test('portrait and landscape keep the printed document inside an A4 iframe',async()=>{
 const {dom,w,d}=fixture();try{
  for(const orientation of ['portrait','landscape']){
   let printed=0;w.rpysDutyPrint415.print('pol',orientation);
   const f=d.getElementById('rpysDutyPrint415Frame');assert.ok(f);
   f.contentWindow.focus=()=>{};f.contentWindow.print=()=>printed++;
   await new Promise(resolve=>setTimeout(resolve,0));
   const content=f.contentDocument.documentElement.outerHTML;
   assert.match(content,new RegExp('@page\\{size:A4 '+orientation));
   assert.match(content,/table class="stableDuty"/);
   assert.equal(printed,1);
   assert.match(f.contentDocument.getElementById('rpysDutyPrint415Content').style.transform,/scale\(/);
  }
  assert.equal(w.db,w.original);
 }finally{dom.window.close()}
});
