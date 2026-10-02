const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.join(__dirname,'..');
function fixture(){
 const dom=new JSDOM('<select id="month"><option value="2026-10">Ekim 2026</option></select><section class="page" id="saymanlik"></section><section class="page" id="nobet"></section>',{url:'https://example.com',runScripts:'outside-only'}),w=dom.window;
 w.eval(`
 var db={staff:[{id:1,name:'Örnek Personel'}],assign:{locked:1},assignmentMeta:{locked:{manual:true,locked:true}},puantajOverride:{'2026-10|1|muk':201.5}},original=db;
 var _allAssignCache={a:1},_peopleCache=[1],_assignCache={a:2},_calcCache={a:3},cacheRefs=[_allAssignCache,_peopleCache,_assignCache,_calcCache],failRender=false;
 var staff=Array.from({length:32},(_,i)=>({id:i+1,name:i===0?'Örnek Çok Uzun Personel Adı Soyadı':'Örnek Personel '+(i+1)}));
 function ym(){return document.getElementById('month').value}
 function personIdByName(n){return staff.find(p=>p.name===n)?.id}
 function sayNamesForPage(pg){return staff.slice((pg-1)*16,pg*16).map(p=>p.name)}
 function stablePrintHeader(t){return '<div class="ph"><h2>'+t+'</h2><div>'+ym()+'</div></div>'}
 function stableSignatures(){return '<div class="sigs"><div>Hazırlayan</div><div>Kontrol eden</div><div>Onaylayan</div></div>'}
 function totals(){return staff.map((p,i)=>({p,muk:154,diff:i%2===0?10:-54,pol:77,ac:87,total:164}))}
 function puantajValue(r,key){if(key==='muk'&&r.p.id===1&&ym()==='2026-10')return 201.5;if(key==='diff'&&r.p.id===1)return 77;return r[key]}
 function stableSayDoc(names,title){
  if(failRender)throw Error('renderer failed');
  const rs=totals(),row=(text,k)=>'<tr class="sum"><td>'+text+'</td>'+names.map(n=>'<td>'+puantajValue(rs.find(r=>r.p.name===n),k)+'</td>').join('')+'</tr>';
  return '<div class="stableSayPage">'+stablePrintHeader(title)+'<table class="stableSay rpys393saytable"><thead><tr><th>TARİH</th>'+names.map(n=>'<th class="nameHead">'+n+'</th>').join('')+'</tr></thead><tbody>'+Array.from({length:31},(_,i)=>'<tr><td>'+(i+1)+'</td>'+names.map(()=>'<td>08:00-15:00</td>').join('')+'</tr>').join('')+row('POLİKLİNİK','pol')+row('ACİL','ac')+row('TOPLAM','total')+row('MÜKELLEF','muk')+row('FARK','diff')+'<tr class="rpys393grand"><td>TOPLAM MÃKELLEF</td><td colspan="16">0 SAAT</td></tr><tr class="rpys393grand2"><td>TOPLAM FAZLA MESAÄ°</td><td colspan="16">1403 SAAT</td></tr></tbody></table>'+stableSignatures()+'</div>';
 }
 stableSayDoc.__rpys393=1;
 function stableDutyDoc(t){return '<h2>'+t+' '+ym()+'</h2><table class="stableDuty"><tr><td>Örnek nöbet</td></tr></table>'}
 function stablePrintDocument(t,b,o){return {title:t,body:b,orientation:o}}
 function openPrintDocument(t,b,o){return {title:t,body:b,options:o}}
 function centerLeaveHtml(){return stableDutyDoc('izin')}
 function assignmentsMonth(){return [{person:{id:1},col:{unit:'BT',hours:16}}]}
 function save(){throw Error('Print must not save')}
 `);
 w.eval(fs.readFileSync(path.join(root,'rpys-page-notes-v2.js'),'utf8'));
 w.eval(fs.readFileSync(path.join(root,'rpys-saymanlik-print-v414.js'),'utf8'));
 w.eval(fs.readFileSync(path.join(root,'rpys-print-center-v413.js'),'utf8'));
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 return {dom,w,api:w.rpysSaymanlik414};
}
function parse(w,html){return new w.DOMParser().parseFromString(html,'text/html')}
function pack(doc,period='this'){return {name:'Test',rows:[{doc,period,copies:1}]}}
test('both pages show unit totals with manual values; labels and numbers share one spanning cell',()=>{
 const {dom,w}=fixture();try{
  const before=JSON.stringify(w.db);
  for(const pg of [1,2]){
   const d=parse(w,w.stableSayDoc(w.sayNamesForPage(pg),'SAYFA '+pg+'/2'));
   const rows=d.querySelectorAll('.rpysSay414Grand');assert.equal(rows.length,2);
   assert.match(rows[0].textContent,/TOPLAM MÜKELLEF — 4975,5 SAAT/);
   assert.match(rows[1].textContent,/TOPLAM FAZLA MESAİ — 227 SAAT/);
   assert.equal(rows[0].cells.length,1);assert.equal(rows[0].cells[0].colSpan,17);
   assert.equal(d.querySelectorAll('.rpysSay414Name').length,16);
   assert.equal(d.querySelectorAll('.sum').length,5);
  }
  assert.equal(w.stableSayDoc.__rpys393,1);
  assert.equal(w.db,w.original);assert.equal(JSON.stringify(w.db),before);
 }finally{dom.window.close()}
});
test('note is captured immediately, escaped, before signatures; monthly notes never leak',()=>{
 const {dom,w}=fixture();try{
  const ta=w.document.querySelector('#saymanlik textarea');ta.value='Birinci satır\n<img src=x onerror=alert(1)>';ta.dispatchEvent(new w.Event('input'));
  const d=parse(w,w.stableSayDoc(w.sayNamesForPage(1),'SAYFA 1/2'));
  assert.equal(d.querySelectorAll('.rpysSay414Note').length,1);assert.equal(d.querySelector('.rpysSay414Note div').textContent,ta.value);assert.equal(d.querySelectorAll('img').length,0);
  assert.equal(d.querySelector('table').nextElementSibling.className,'rpysSay414Note');assert.equal(d.querySelector('.rpysSay414Note').nextElementSibling.className,'sigs');
  const result=w.rpysBulkPrint413.build(pack('say2','prev')),prev=parse(w,result.parts[0].body);
  assert.equal(prev.querySelectorAll('.rpysSay414Note,.printNote').length,0);assert.match(prev.querySelector('.rpysSay414Grand').textContent,/4928 SAAT/);
  assert.equal(w.document.getElementById('month').value,'2026-10');assert.equal(w.document.querySelector('#saymanlik textarea').value,ta.value);
 }finally{dom.window.close()}
});
test('single print and mixed bulk package retain routing, notes, caches, database and locked/manual assignments',()=>{
 const {dom,w}=fixture();try{
  const before=JSON.stringify(w.db),ta=w.document.querySelector('#saymanlik textarea');ta.value='Saymanlık notu';ta.dispatchEvent(new w.Event('input'));
  const say=w.stablePrintDocument('Say',w.stableSayDoc(w.sayNamesForPage(2),'SAYFA 2/2'),'landscape');assert.equal(say.orientation,'landscape');assert.equal(parse(w,say.body).querySelectorAll('.rpysSay414Note').length,1);
  const duty=w.stableDutyDoc('pol');assert.equal(w.stablePrintDocument('Nöbet',duty,'portrait').body,duty);
  const result=w.rpysBulkPrint413.build({rows:[{doc:'say1',period:'this',copies:2},{doc:'nobet',period:'prev',copies:1},{doc:'puantaj',period:'this',copies:1},{doc:'birim',period:'this',copies:1}]});
  assert.equal(result.parts.length,7);assert.match(result.parts[2].body,/pol 2026-09/);assert.match(result.parts[3].body,/acil 2026-09/);
  for(const p of result.parts.filter(p=>p.doc==='say1'||p.doc==='puantaj')){const d=parse(w,p.body);assert.equal(d.querySelectorAll('.rpysSay414Grand').length,2);assert.equal(d.querySelectorAll('.rpysSay414Note,.printNote').length,1)}
  assert.equal(w.db,w.original);assert.equal(JSON.stringify(w.db),before);assert.equal(w._calcCache,w.cacheRefs[3]);assert.equal(w._assignCache,w.cacheRefs[2]);assert.equal(w.document.querySelectorAll('option').length,1);
 }finally{dom.window.close()}
});
test('renderer failure restores month, database and cache references',()=>{
 const {dom,w}=fixture();try{
  w.failRender=true;assert.throws(()=>w.rpysBulkPrint413.build(pack('say2','prev')),/renderer failed/);
  assert.equal(w.db,w.original);assert.equal(w.document.getElementById('month').value,'2026-10');assert.equal(w._calcCache,w.cacheRefs[3]);
 }finally{dom.window.close()}
});
test('later renderer replacement is wrapped once; serialized print body can repair legacy total removal',()=>{
 const {dom,w,api}=fixture();try{
  const old=w.stableSayDoc;w.stableSayDoc=function(){return old.apply(this,arguments)};api.install();const wrapper=w.stableSayDoc;api.install();assert.equal(w.stableSayDoc,wrapper);
  const d=parse(w,w.stableSayDoc(w.sayNamesForPage(1),'SAYFA 1/2'));d.querySelectorAll('.rpysSay414Grand').forEach(x=>x.remove());
  const repaired=parse(w,api.prepare(d.body.innerHTML,{snapshot:true}));assert.equal(repaired.querySelectorAll('.rpysSay414Grand').length,2);assert.match(repaired.querySelector('.rpysSay414Grand').textContent,/4975,5 SAAT/);
 }finally{dom.window.close()}
});
test('leading print styles and colors survive repeated document preparation',()=>{
 const {dom,w,api}=fixture();try{
  const input='<style id="legacy-print-colors">.rpys393grand td{background:#17365d}</style>'+w.stableSayDoc(w.sayNamesForPage(1),'SAYFA 1/2');
  const d=parse(w,api.prepare(api.prepare(input)));
  assert.equal(d.querySelector('#legacy-print-colors').textContent,'.rpys393grand td{background:#17365d}');
  assert.equal(d.querySelectorAll('#rpys-saymanlik-print-style-v414').length,1);
  assert.equal(d.querySelectorAll('.rpysSay414Name').length,16);
 }finally{dom.window.close()}
});
