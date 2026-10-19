const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const js=fs.readFileSync(path.join(__dirname,'../rpys-stability-v420.js'),'utf8');
function fixture(html=''){const dom=new JSDOM(html,{url:'https://test.invalid',runScripts:'outside-only'}),w=dom.window;w.TextDecoder=TextDecoder;w.TextEncoder=TextEncoder;w.eval(js);return {dom,w,api:w.rpysStability420}}
test('grand total rows keep their identity and stop mutating once values settle',()=>{
 const f=fixture('<table class="say"><thead><tr><th>DATE</th><th>A</th><th>B</th></tr></thead><tbody><tr><td>FARK</td><td>1</td><td>2</td></tr></tbody></table>');try{
  let value=100;f.w.totals=()=>[{muk:value,diff:20},{muk:100,diff:-10}];f.w.puantajValue=(r,k)=>r[k];f.api.renderGrandTotals();
  const first=f.w.document.querySelector('.rpys319GrandRow'),obs=new f.w.MutationObserver(()=>{});obs.observe(f.w.document.body,{childList:true,subtree:true});
  for(let n=0;n<30;n++)f.api.renderGrandTotals();assert.equal(obs.takeRecords().length,0);assert.equal(f.w.document.querySelector('.rpys319GrandRow'),first);
  value=120;f.api.renderGrandTotals();assert.equal(first.cells[1].textContent,'220 SAAT');assert.equal(first.cells[1].colSpan,2);assert.equal(f.w.document.querySelectorAll('.rpys319GrandRow').length,2);obs.disconnect();
 }finally{f.dom.window.close()}
});
test('embedded legacy functions delegate totals and avoid rebuilding unchanged menu buttons',()=>{
 const f=fixture('<div id="menu"><button>🔒 Seçili Hücreleri Kilitle / Aç</button></div>');try{
  const legacy="var __RPYS_FIXPACK_319__=1;\n  function addSayGrandTotals(){throw Error('old totals')}\n  function enrichSuitable(){throw Error('old menu')}\n  function addBtn(menu,id,label,fn,before){if(!menu)return;let b=document.getElementById(id);if(!b){b=document.createElement('button');b.id=id;menu.appendChild(b)}b.textContent=label;b.onclick=fn}";
  const encoded=Buffer.from(legacy).toString('base64'),repaired=f.api.repair('const b="'+encoded+'"');assert.notEqual(repaired,'const b="'+encoded+'"');
  const decoded=Buffer.from(repaired.match(/"([^"]+)"/)[1],'base64').toString();f.w.eval(decoded);f.w.__RPYS_INTERACTION_GUARD_V400__=true;f.w.enrichSuitable();f.w.addSayGrandTotals();
  f.w.addBtn(f.w.document.getElementById('menu'),'duplicate','🔒 Bağlı Görevi Kilitle / Aç',()=>{});assert.equal(f.w.document.querySelectorAll('#menu button').length,1);
 }finally{f.dom.window.close()}
});
test('legacy context renderers yield to the current menu owner',()=>{
 const f=fixture();try{
  f.w.__RPYS_INTERACTION_GUARD_V400__=true;
  for(const [slug,names] of [['rpys-patch332',['bindSuitable','stableSuitable']],['rpys-patch336',['bindSuitable336','render336']],['rpys-patch337',['bindSuitable','render337']],['rpys-patch338',['installSuitable','render338']],['rpys-patch339',['bindSuitable','suitableBox','renderSuitable339']]]){
   const repaired=f.api.repairPatch(names.map(n=>`function ${n}(){throw Error('old writer')}`).join('\n'),slug);f.w.eval(repaired);for(const n of names)f.w[n]();
  }
 }finally{f.dom.window.close()}
});
test('latest people controls rebuild only when names or selections change',()=>{
 const f=fixture('<div id="host"></div>');try{
  const legacy=`var host=document.getElementById('host'),staff=[{id:1,name:'A'}],ids=new Set([1]);function render(){
 host.innerHTML='<label>'+staff[0].name+' '+ids.has(1)+'</label>';
 }`;
  f.w.eval(f.api.repairPatch(legacy,'rpys-patch339'));f.w.render();const original=f.w.document.querySelector('label');f.w.render();assert.equal(f.w.document.querySelector('label'),original);
  f.w.ids.clear();f.w.render();assert.notEqual(f.w.document.querySelector('label'),original);
 }finally{f.dom.window.close()}
});
test('current suitable-person renderer preserves button nodes when called repeatedly',()=>{
 const f=fixture('<div id="dutyContextMenu"></div><div class="dropDutyCell dutySelected" data-type="pol" data-col="day" data-day="1"></div>');try{
  const w=f.w;w.setTimeout=()=>0;w.dutyContextCellV2413=w.document.querySelector('.dropDutyCell');w.dutyColumnByKey=()=>({unit:'TEST',shift:'08:00-15:00'});w.dateStr=d=>'2026-10-'+String(d).padStart(2,'0');w.suitablePeopleForDutyV2413=()=>[{p:{id:1,name:'A',status:'Aktif'},idle:3}];
  w.eval(fs.readFileSync(path.join(__dirname,'../rpys-runtime-v400.js'),'utf8'));w.rpysInteraction400.ensureSingleMenu();w.document.getElementById('rpysSuitableButtonV396').click();
  const box=w.document.getElementById('dutySuitableListV2413'),button=box.querySelector('button'),obs=new w.MutationObserver(()=>{});obs.observe(box,{childList:true,subtree:true});
  for(let i=0;i<30;i++)w.rpysInteraction400.renderSuitable();assert.equal(obs.takeRecords().length,0);assert.equal(box.querySelector('button'),button);
  w.dutyContextCellV2413.dataset.day='2';w.rpysInteraction400.renderSuitable();assert.match(box.textContent,/02.10.2026/);obs.disconnect();
 }finally{f.dom.window.close()}
});
test('legacy lock and clipboard maintenance keep existing controls instead of remove/recreate loops',()=>{
 const f=fixture('<div id="menu"><button id="rpysCopy353">Copy</button><button id="rpysPaste353">Paste</button><button>🔒 Seçili Hücreleri Kilitle</button></div>');try{
  f.w.__RPYS_INTERACTION_GUARD_V400__=true;
  f.w.eval(f.api.repairPatch("function cleanup(menu){throw Error('remove lock')}function addLock(menu){throw Error('recreate lock')}",'rpys-patch352'));
  f.w.cleanup(f.w.document.getElementById('menu'));f.w.addLock(f.w.document.getElementById('menu'));
  f.w.eval(f.api.repairPatch("function menu(){throw Error('recreate clipboard buttons')}",'rpys-patch353'));f.w.menu();
  const parsed=f.api.repairPatch("function noteFor(){}\\nfunction docFor(){}\\nfunction stripSignatures(){}",'rpys-patch383');new (require('node:vm').Script)(parsed);
 }finally{f.dom.window.close()}
});
test('SDS menu positioning never moves a button that is already in the correct place',()=>{
 const f=fixture('<aside class="sidebar"><button id="rpysSdsPermanent">SDS</button> <button id="advancedMenuBtn">More</button></aside>');try{
  const legacy="function lockMenu(){const b=document.getElementById('rpysSdsPermanent'),ref=document.getElementById('advancedMenuBtn');if(ref&&ref!==b&&ref.parentNode&&b.parentNode===ref.parentNode)ref.parentNode.insertBefore(b,ref)}";
  f.w.eval(f.api.repairPatch(legacy,'rpys-patch388'));f.w.lockMenu();
  const side=f.w.document.querySelector('aside'),button=f.w.document.getElementById('rpysSdsPermanent'),ref=f.w.document.getElementById('advancedMenuBtn'),obs=new f.w.MutationObserver(()=>{});obs.observe(side,{childList:true});
  for(let n=0;n<40;n++)f.w.lockMenu();assert.equal(obs.takeRecords().length,0);
  side.append(button);f.w.lockMenu();assert.equal(button.nextSibling,ref);obs.takeRecords();f.w.lockMenu();assert.equal(obs.takeRecords().length,0);obs.disconnect();
 }finally{f.dom.window.close()}
});
test('legacy tracking panel preserves unsaved controls and presentation decorations between observer callbacks',()=>{
 const f=fixture('<div id="tracking"></div>');try{
  const legacy="var config='2026-10-01';function buildTracking322(){const x=document.getElementById('tracking');x.innerHTML=`<input id=\"p322Start\" value=\"${config}\"><div id=\"p322Summary\"></div>`;const h=document.getElementById('p322Summary');h.innerHTML=`<div class=\"p322chips\">${config}</div>`}";
  f.w.eval(f.api.repairPatch(legacy,'rpys-patch322'));f.w.buildTracking322();
  const input=f.w.document.getElementById('p322Start');input.value='UNSAVED DATE';
  const decoration=f.w.document.createElement('button');f.w.document.getElementById('tracking').append(decoration);
  const obs=new f.w.MutationObserver(()=>{});obs.observe(f.w.document.body,{childList:true,subtree:true});
  for(let i=0;i<30;i++)f.w.buildTracking322();assert.equal(obs.takeRecords().length,0);assert.equal(f.w.document.getElementById('p322Start'),input);assert.equal(input.value,'UNSAVED DATE');assert.equal(decoration.isConnected,true);
  f.w.config='2026-11-01';f.w.buildTracking322();assert.equal(f.w.document.getElementById('p322Start').value,'2026-11-01');obs.disconnect();
 }finally{f.dom.window.close()}
});
