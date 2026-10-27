const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const js=fs.readFileSync(path.join(__dirname,'../rpys-stability-v420.js'),'utf8');
function fixture(html=''){const dom=new JSDOM(html,{url:'https://test.invalid',runScripts:'outside-only'}),w=dom.window;w.TextDecoder=TextDecoder;w.TextEncoder=TextEncoder;w.eval(js);return {dom,w,api:w.rpysStability420}}
test('Saymanlık extra unit totals are removed while personal totals stay and repeated cleanup does not mutate',()=>{
 const f=fixture('<section id="saymanlik"><div class="toolbar"></div><table class="say"><tbody><tr><td>TOPLAM</td><td>157</td></tr><tr><td>MÜKELLEF</td><td>112</td></tr><tr><td>FARK</td><td>45</td></tr><tr class="rpysF20UnitTotal"><td>BİRİM TOPLAM ÇALIŞILAN</td><td>3948</td></tr><tr class="rpys319GrandRow"><td>TÜM BİRİM TOPLAM MÜKELLEF</td><td>3232</td></tr></tbody></table></section>');try{
  f.w.db={assign:{manual:1},puantajOverride:{a:45}};const before=JSON.stringify(f.w.db);f.api.renderGrandTotals();assert.equal(f.w.document.querySelectorAll('table.say tr').length,3);assert.equal(f.w.document.querySelectorAll('.rpysF20UnitTotal,.rpys319GrandRow').length,0);
  const obs=new f.w.MutationObserver(()=>{});obs.observe(f.w.document.body,{childList:true,subtree:true});for(let n=0;n<30;n++)f.api.renderGrandTotals();assert.equal(obs.takeRecords().length,0);assert.equal(JSON.stringify(f.w.db),before);assert.equal(f.w.document.querySelectorAll('#rpysPuantajReset422').length,1);assert.match(f.w.document.querySelector('#rpysPuantajReset422').textContent,/Elle girilen toplamları kaldır/);obs.disconnect();
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

test('external legacy menus reuse equivalent lock and swap actions instead of recreating removed duplicates',()=>{
 const f=fixture('<div id="cellContextMenu"><button id="lock">🔒 Seçili Hücreleri Kilitle / Aç</button><button id="swap">↔ Seçili 2 çalışmayı Değiştir</button></div>');try{
  const w=f.w;w.db={assign:{protected:1}};const before=JSON.stringify(w.db);let clicks=0;w.document.getElementById('lock').onclick=()=>clicks++;
  const source="const $=s=>document.querySelector(s);function menu(){for(const [id,lab] of [['r319sl','🔒 Seçili hücreleri Kilitle / Aç'],['r319ss','↔ Seçili 2 çalışmayı Değiştir']]){let m=$('#cellContextMenu');if(!m||$('#'+id))continue;let b=document.createElement('button');b.id=id;b.textContent=lab;m.append(b)}}";
  w.eval(f.api.repairPatch(source,'rpys-patch319fixed'));const obs=new w.MutationObserver(()=>{});obs.observe(w.document.body,{subtree:true,childList:true});
  for(let i=0;i<30;i++)w.menu();assert.equal(obs.takeRecords().length,0);assert.equal(w.document.querySelectorAll('button').length,2);w.document.getElementById('lock').click();assert.equal(clicks,1);
  w.document.getElementById('lock').remove();w.menu();assert.equal(w.document.querySelectorAll('button').length,2);assert.ok(w.document.getElementById('r319sl'),'a missing action is still installed');assert.equal(JSON.stringify(w.db),before);obs.disconnect();
 }finally{f.dom.window.close()}
});

test('window-assigned encoded tracking summary stops its observer loop and preserves table controls until data changes',()=>{
 const f=fixture('<div id="rpysF20PolTrackSummary"></div>');try{
  const source='var count=1;function summary(){let h=document.getElementById("rpysF20PolTrackSummary");if(!h)return;h.innerHTML=`<div class="tablewrap"><table><tbody><tr><td>${count}</td></tr></tbody></table></div>`}';
  const encoded=Buffer.from(source).toString('base64'),html='window.__F20_SOURCE="'+encoded+'";',repaired=f.api.repair(html);assert.notEqual(repaired,html,'window property payload must be patched too');f.w.eval(repaired);f.w.eval(f.w.atob(f.w.__F20_SOURCE));f.w.summary();const table=f.w.document.querySelector('table');const button=f.w.document.createElement('button');button.textContent='Zoom';table.parentElement.prepend(button);
  const obs=new f.w.MutationObserver(()=>{});obs.observe(f.w.document.body,{subtree:true,childList:true});for(let n=0;n<40;n++)f.w.summary();assert.equal(obs.takeRecords().length,0);assert.equal(f.w.document.querySelector('table'),table);assert.ok(button.isConnected);
  f.w.count=2;f.w.summary();assert.equal(f.w.document.querySelector('td').textContent,'2');assert.notEqual(f.w.document.querySelector('table'),table);obs.disconnect();
 }finally{f.dom.window.close()}
});

test('unrelated encoded data and executable payloads remain byte-for-byte unchanged',()=>{
 const f=fixture();try{const data=Buffer.from('unrelated data '.repeat(80)).toString('base64'),code=Buffer.from('window.unrelated=42;/*'+'x'.repeat(300)+'*/').toString('base64'),html=`<img src="data:image/png;base64,${data}"><script>window.bin="${data}";window.code="${code}";</script>`;assert.equal(f.api.repair(html),html)}finally{f.dom.window.close()}
});

test('the second embedded F20 unit-total writer delegates cleanup instead of recreating summary rows',()=>{
 const f=fixture('<table class="say"><tbody><tr><td>FARK</td><td>45</td></tr></tbody></table>');try{const source='// rpysF20UnitTotal\nfunction totalsRows(){throw Error("old writer")}';f.w.eval(f.api.repairEmbedded(source));f.w.totalsRows();assert.equal(f.w.document.querySelectorAll('table tr').length,1)}finally{f.dom.window.close()}
});


test('embedded print maintenance does not rewrite unchanged labels on every DOM mutation',()=>{
 const f=fixture('<button id="print">🖨 Listeyi Yazdır</button>');try{
  const original="function rename(){const el=document.getElementById('print');if(el.tagName==='INPUT')el.value='Listeyi Yazdır';else el.textContent='🖨 Listeyi Yazdır';}";
  const encoded=Buffer.from(original+'/*'+'x'.repeat(250)+'*/').toString('base64');
  const repaired=f.api.repair('window.printPatch="'+encoded+'";');f.w.eval(repaired);f.w.eval(new TextDecoder().decode(Uint8Array.from(f.w.atob(f.w.printPatch),c=>c.charCodeAt(0))));
  const obs=new f.w.MutationObserver(()=>{});obs.observe(f.w.document.body,{subtree:true,childList:true});
  for(let n=0;n<25;n++)f.w.rename();assert.equal(obs.takeRecords().length,0);
  f.w.document.getElementById('print').textContent='Old label';obs.takeRecords();f.w.rename();assert.equal(f.w.document.getElementById('print').textContent,'🖨 Listeyi Yazdır');obs.disconnect();
 }finally{f.dom.window.close()}
});
