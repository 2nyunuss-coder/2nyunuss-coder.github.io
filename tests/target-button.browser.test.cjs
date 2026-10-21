const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.join(__dirname,'..');

// Reuse the controlled personnel/calendar data, but run the production panel,
// native pointer events and the real browser Worker rather than calling the API.
function fixtureHTML(){
 const source=fs.readFileSync(path.join(__dirname,'target-integration.test.cjs'),'utf8');
 let fixture='function fixture(){'+source.split('function fixture(){')[1].split('\ntest(')[0];
 fixture=fixture.split('\n').filter(line=>!line.includes(' class Worker{')).join('\n');
 const start=fixture.indexOf(' c.window=c;vm.createContext(c);');
 const end=fixture.indexOf('\n return {c,controls',start);
 assert.ok(start>0&&end>start,'fixture extraction');
 fixture=fixture.slice(0,start)+`
 for(const [key,value] of Object.entries(c))if(!['document','window','setTimeout','clearTimeout','Date','URL','Worker','addEventListener'].includes(key))window[key]=value;
 Object.defineProperty(c,'db',{get:()=>window.db,set:v=>window.db=v});window.fixtureResult={saved,alerts,controls};
 `+fixture.slice(end);
 return `<!doctype html><html><head><meta charset="utf-8"></head><body>
 <div class="autoBox"><select id="autoUnit"><option>PORTABL + SKOPİ</option></select>
 <select id="autoPeople" multiple>${[1,2,3,4,5,6].map(id=>`<option selected value="${id}">${id}</option>`).join('')}</select>
 <input type="checkbox" id="rebuildSelectedUnitV246" checked><div id="distResult"></div></div>
 <script>const unit='PORTABL + SKOPİ';${fixture};fixture();
 document.addEventListener('click',e=>{if(e.target.closest('[data-target-action]'))e.stopImmediatePropagation()});
 </script>${['rpys-runtime-v397.js','rpys-scheduler-v398.js','rpys-targets-v399.js'].map(file=>`<script src="/${file}"></script>`).join('')}
 </body></html>`;
}

test('actual target button: queued render, legacy replacement, real Worker and visible failures',async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext();
  const allowed=['rpys-runtime-v397.js','rpys-scheduler-v398.js','rpys-targets-v399.js','rpys-target-worker.js'];
  await context.route('**/*',route=>{
   const url=new URL(route.request().url()),name=url.pathname.slice(1);
   if(url.hostname==='rpys.test'&&!name)return route.fulfill({contentType:'text/html; charset=utf-8',body:fixtureHTML()});
   if(url.hostname==='rpys.test'&&allowed.includes(name))return route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(root,name),'utf8')});
   return route.fulfill({status:404,body:''});
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://rpys.test/');
  await page.waitForSelector('[data-target-action=run]');
  await page.evaluate(()=>{window.legacyCalls=0;window.autoDistribute=()=>{legacyCalls++};window.beforeAssignments=JSON.stringify(db.assign)});
  const button=page.locator('[data-target-action=run]');
  await button.scrollIntoViewIfNeeded();const bounds=await button.boundingBox();
  await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
  await page.mouse.down();
  assert.equal(await page.evaluate(()=>{const old=document.querySelector('[data-target-action=run]');rpysTargets399.render();return old===document.querySelector('[data-target-action=run]')}),true,'a queued refresh must retain the pressed button');
  await page.mouse.up();
  const pending=await page.evaluate(()=>({busy:document.querySelector('[data-target-action=run]').getAttribute('aria-busy'),message:document.querySelector('[data-target-feedback]').textContent}));
  assert.equal(pending.busy,'true');assert.match(pending.message,/denetleniyor|hesaplanıyor|Uygun günler|Görev çakışmaları/);
  await page.waitForFunction(()=>fixtureResult.saved.length===1);
  const result=await page.evaluate(()=>({filled:Object.keys(db.assign).length,saves:fixtureResult.saved.length,legacy:legacyCalls,actual:rpysTargets399.model(autoUnit.value).actual,feedback:document.querySelector('[data-target-feedback]').textContent,busy:document.querySelector('[data-target-action=run]').getAttribute('aria-busy')}));
  assert.equal(result.filled,51);assert.equal(result.saves,1);assert.equal(result.legacy,0);assert.equal(result.busy,'false');assert.match(result.feedback,/tam karşılandı/);
  assert.deepEqual(Object.values(result.actual).map(v=>[v.day,v.night]),[[5,7],[4,6],[4,5],[4,6],[3,4],[1,2]]);
  await page.evaluate(()=>{window.successAssignments=JSON.stringify(db.assign);rpysTargets399.config(autoUnit.value).people[1].day=-1});
  await button.click();
  await page.waitForFunction(()=>document.querySelector('[data-target-feedback]').dataset.tone==='error');
  const failed=await page.evaluate(()=>({text:document.querySelector('[data-target-feedback]').textContent,unchanged:JSON.stringify(db.assign)===successAssignments,saves:fixtureResult.saved.length,busy:document.querySelector('[data-target-action=run]').getAttribute('aria-busy')}));
  assert.match(failed.text,/0 veya pozitif tam sayı/);assert.equal(failed.unchanged,true);assert.equal(failed.saves,1);assert.equal(failed.busy,'false');
  await page.evaluate(()=>{window.savedTargetRunner=rpysScheduler398.runTargets;rpysScheduler398.runTargets=()=>{throw Error('startup probe')}});
  await button.click();
  await page.waitForFunction(()=>document.querySelector('[data-target-feedback]').textContent.includes('startup probe'));
  await page.evaluate(()=>{rpysScheduler398.runTargets=savedTargetRunner;rpysTargets399.config(autoUnit.value).people[1].day=5;window.Worker=class{postMessage(){window.stallStarted=true}terminate(){window.stallTerminated=true}}});
  await button.click();await page.waitForFunction(()=>window.stallStarted===true);
  const cancelButton=page.locator('[data-target-action=cancel]');await cancelButton.scrollIntoViewIfNeeded();const cancelBounds=await cancelButton.boundingBox();await page.mouse.move(cancelBounds.x+cancelBounds.width/2,cancelBounds.y+cancelBounds.height/2);await page.mouse.down();
  assert.equal(await page.evaluate(()=>{const old=document.querySelector('[data-target-action=cancel]');rpysTargets399.render();return old===document.querySelector('[data-target-action=cancel]')}),true);
  await page.mouse.up();
  await page.waitForFunction(()=>document.querySelector('[data-target-feedback]').textContent.includes('iptal edildi'));
  const cancelled=await page.evaluate(()=>({unchanged:JSON.stringify(db.assign)===successAssignments,saves:fixtureResult.saved.length,terminated:window.stallTerminated,busy:document.querySelector('[data-target-action=run]').getAttribute('aria-busy'),hidden:document.querySelector('[data-target-action=cancel]').hidden}));
  assert.equal(cancelled.unchanged,true);assert.equal(cancelled.saves,1);assert.equal(cancelled.terminated,true);assert.equal(cancelled.busy,'false');assert.equal(cancelled.hidden,true);
  assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});

test('actual partial button applies feasible duties, displays saved shortages and leaves a second run unchanged',async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext();await context.route('**/*',route=>{const u=new URL(route.request().url()),name=u.pathname.slice(1);if(u.hostname==='rpys.test'&&!name)return route.fulfill({contentType:'text/html; charset=utf-8',body:fixtureHTML()});if(u.hostname==='rpys.test'&&['rpys-runtime-v397.js','rpys-scheduler-v398.js','rpys-targets-v399.js','rpys-target-worker.js'].includes(name))return route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(root,name),'utf8')});return route.fulfill({status:404,body:''})});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://rpys.test/');await page.waitForSelector('[data-target-action=run]');
  await page.evaluate(()=>{db.leaves=Array.from({length:30},(_,i)=>({id:1,day:i+1}));window.originalTargets=JSON.stringify(rpysTargets399.config(autoUnit.value).people)});await page.locator('[data-target-action=run]').click();await page.waitForFunction(()=>fixtureResult.saved.length===1);await page.waitForSelector('.rpysTargetLastResult399');
  const state=await page.evaluate(()=>({count:Object.keys(db.assign).length,text:document.querySelector('[data-target-feedback]').textContent,tone:document.querySelector('[data-target-feedback]').dataset.tone,report:document.querySelector('.rpysTargetLastResult399').textContent,unchangedTargets:JSON.stringify(rpysTargets399.config(autoUnit.value).people)===originalTargets,record:db.manualDistributionResultsV399[ym()+'|'+autoUnit.value],busy:document.querySelector('[data-target-action=run]').getAttribute('aria-busy')}));
  assert.equal(state.count,39);assert.equal(state.unchangedTargets,true);assert.equal(state.tone,'warning');assert.equal(state.busy,'false');assert.match(state.text,/Kısmi dağıtım uygulandı/);assert.match(state.text,/Berk Yaşar: 0 \/ 5 gündüz; 5 eksik/);assert.match(state.report,/Son kısmi dağıtım raporu/);assert.match(state.report,/gün .*boş:/);assert.equal(state.record.status,'partial');assert.equal(state.record.shortfalls.reduce((n,x)=>n+x.missing,0),12);
  await page.evaluate(()=>{window.originalAssignments=JSON.stringify(db.assign)});await page.locator('[data-target-action=run]').click();await page.waitForFunction(()=>document.querySelector('[data-target-feedback]').textContent.includes('Yerleştirilebilen yeni görev yok'));
  assert.equal(await page.evaluate(()=>JSON.stringify(db.assign)===originalAssignments&&fixtureResult.saved.length===1),true);assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});

test('weekend target inputs persist and the real button applies exact weekend counts within night totals',async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext();await context.route('**/*',route=>{const u=new URL(route.request().url()),name=u.pathname.slice(1);if(u.hostname==='rpys.test'&&!name)return route.fulfill({contentType:'text/html; charset=utf-8',body:fixtureHTML()});if(u.hostname==='rpys.test'&&['rpys-runtime-v397.js','rpys-scheduler-v398.js','rpys-targets-v399.js','rpys-target-worker.js'].includes(name))return route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(root,name),'utf8')});return route.fulfill({status:404,body:''})});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://rpys.test/');await page.waitForSelector('[data-target-action=run]');assert.equal(await page.locator('[data-target-kind=weekendNight]').count(),6);assert.equal(await page.locator('[data-target-id="1"][data-target-kind=weekendNight]').getAttribute('placeholder'),'Serbest');
  for(const id of [1,2,3,4,5,6])await page.locator(`[data-target-id="${id}"][data-target-kind=weekendNight]`).fill(String([2,2,1,1,1,1][id-1]));
  assert.match(await page.locator('.rpysTargetSummary399').textContent(),/Hafta sonu nöbet: 8 gereken \/ 8 hedef/);const before=await page.evaluate(()=>fixtureResult.saved.length);await page.locator('[data-target-action=run]').click();await page.waitForFunction(n=>fixtureResult.saved.length>n,before);
  const state=await page.evaluate(()=>({actual:rpysTargets399.model(autoUnit.value).actual,targets:rpysTargets399.config(autoUnit.value).people,text:document.querySelector('[data-target-feedback]').textContent,count:Object.keys(db.assign).length}));assert.equal(state.count,51);assert.deepEqual(Object.values(state.actual).map(x=>x.weekendNight),[2,2,1,1,1,1]);for(const id of [1,2,3,4,5,6])assert.equal(state.actual[id].night,state.targets[id].night);assert.match(state.text,/tam karşılandı/);
  await page.locator('[data-target-id="1"][data-target-kind=weekendNight]').fill('');assert.equal(await page.evaluate(()=>rpysTargets399.config(autoUnit.value).people[1].weekendNight),null);assert.match(await page.locator('.rpysTargetSummary399').textContent(),/1 kişi serbest/);assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});
