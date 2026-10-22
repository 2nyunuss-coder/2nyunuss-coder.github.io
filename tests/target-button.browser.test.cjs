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
 Object.defineProperty(c,'db',{get:()=>window.db,set:v=>window.db=v});Object.defineProperty(c,'isOnLeave',{get:()=>window.isOnLeave,set:v=>window.isOnLeave=v});window.fixtureResult={saved,alerts,controls};
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

test('real button respects dated leave, Thursday preparation, first working day, prior-month rest and payroll overrides',async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext();await context.route('**/*',route=>{const u=new URL(route.request().url()),name=u.pathname.slice(1);if(u.hostname==='rpys.test'&&!name)return route.fulfill({contentType:'text/html; charset=utf-8',body:fixtureHTML()});if(u.hostname==='rpys.test'&&['rpys-runtime-v397.js','rpys-scheduler-v398.js','rpys-targets-v399.js','rpys-target-worker.js'].includes(name))return route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(root,name),'utf8')});return route.fulfill({status:404,body:''})});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://rpys.test/');await page.waitForSelector('[data-target-action=run]');
  await page.evaluate(()=>{
   db.leaves=[{personId:1,start:'2026-10-05',end:'2026-10-06',type:'Yıllık İzin'}];window.isOnLeave=(id,d)=>db.leaves.some(l=>l.personId===id&&l.start<=dateStr(d)&&l.end>=dateStr(d));window.rpysHolidayInfo=date=>date==='2026-10-07'?{type:'full'}:null;
   db.assign['2026-09|acil|30|night']=2;db.puantajOverride={'2026-10|1|total':220,'2026-10|1|muk':140};db.staff[0].mesaiBand='0-30';window.totals=()=>db.staff.map(p=>({p,total:assignmentsMonth().filter(a=>a.person.id===p.id).reduce((n,a)=>n+a.col.hours,0),muk:160}));window.puantajValue=(row,field)=>db.puantajOverride[`${ym()}|${row.p.id}|${field}`]??row[field];window.targetsBefore=JSON.stringify(rpysTargets399.config(autoUnit.value).people);
  });
  await page.locator('[data-target-action=run]').click();await page.waitForFunction(()=>fixtureResult.saved.length===1);
  const result=await page.evaluate(()=>({actual:rpysTargets399.model(autoUnit.value).actual,berk:assignmentsMonth().filter(a=>a.person.id===1).map(a=>a.day),previous:db.assign['2026-09|acil|30|night'],rest:rpysRest16V397.allViolations().size,erdFirst:assignmentsMonth().filter(a=>a.person.id===2&&a.day===1).length,payroll:db.puantajOverride,report:document.querySelector('.rpysTargetLastResult399')?.textContent,html:document.querySelector('.rpysTargets399')?.textContent||document.body.textContent,targetsUnchanged:JSON.stringify(rpysTargets399.config(autoUnit.value).people)===targetsBefore}));
  assert.deepEqual(Object.values(result.actual).map(x=>[x.day,x.night]),[[5,7],[4,6],[4,5],[4,6],[3,4],[1,2]]);assert.ok(result.berk.includes(1));assert.ok(result.berk.includes(8));for(const d of [2,3,4,5,6,7])assert.ok(!result.berk.includes(d),'blocked day '+d);assert.equal(result.previous,2);assert.equal(result.erdFirst,0);assert.equal(result.rest,0);assert.equal(result.payroll['2026-10|1|total'],220);assert.equal(result.payroll['2026-10|1|muk'],140);assert.equal(result.targetsUnchanged,true);assert.match(result.html,/Dağıtım sonrası Saymanlık kontrolü/);assert.match(result.html,/mükellef 140 saat \/ görünen toplam 220 saat/);assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});

test('blocked return stays hard while low targets keep feasible duties through the real button',async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext();await context.route('**/*',route=>{const u=new URL(route.request().url()),name=u.pathname.slice(1);if(u.hostname==='rpys.test'&&!name)return route.fulfill({contentType:'text/html; charset=utf-8',body:fixtureHTML()});if(u.hostname==='rpys.test'&&['rpys-runtime-v397.js','rpys-scheduler-v398.js','rpys-targets-v399.js','rpys-target-worker.js'].includes(name))return route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(root,name),'utf8')});return route.fulfill({status:404,body:''})});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://rpys.test/');await page.waitForSelector('[data-target-action=run]');
  await page.evaluate(()=>{
   db.staff[1].name='Ulaş';const cfg=rpysTargets399.config(autoUnit.value);cfg.people[2]={day:1,night:2};cfg.people[6]={day:4,night:6};document.getElementById('rebuildSelectedUnitV246').checked=false;
   db.leaves=[{personId:1,start:'2026-10-05',end:'2026-10-06'}];window.isOnLeave=(id,d)=>db.leaves.some(l=>l.personId===id&&l.start<=dateStr(d)&&l.end>=dateStr(d));
   window.unitRulesV251=()=>({maxGapEnabled:true});window.unitMaxGapDaysV251=()=>5;window.nonLeaveSegmentsV2414=()=>[[1,30]];window.spouseOf=()=>null;window.__RPYS_RULEPATCH8_EDGE_GAP_SPOUSE__=1;
   window.v251GapViolations=ids=>ids.flatMap(id=>{const days=[0,...assignmentsMonth().filter(a=>a.person.id===id&&a.col.unit===autoUnit.value).map(a=>a.day).sort((a,b)=>a-b),31];return days.slice(1).flatMap((d,i)=>d-days[i]-1>5?[{id,left:days[i],right:d,blank:d-days[i]-1}]:[])});
   const base=window.canTakeShiftV2414;window.canTakeShiftV2414=(id,d,...args)=>!(id===1&&d===7)&&base(id,d,...args);
   Object.assign(db.assign,{'2026-10|acil|1|day':1,'2026-10|acil|3|night':2,'2026-10|acil|9|other':4,'2026-09|acil|30|night':3});db.assignmentMeta['2026-10|acil|1|day']={manual:true};db.rpysCellLocks['2026-10|acil|3|night']={exists:true,value:2};
   for(let d=1;d<=30;d++)for(const k of ['day','night'])if((k==='night'||d<=21)&&!db.assign[`2026-10|acil|${d}|${k}`])db.assign[`2026-10|acil|${d}|${k}`]=null;
   window.targetSnapshot=JSON.stringify(cfg.people);window.guardSnapshot=JSON.stringify([db.assignmentMeta,db.rpysCellLocks]);
  });
  await page.locator('[data-target-action=run]').click();await page.waitForFunction(()=>fixtureResult.saved.length===1);
  const result=await page.evaluate(()=>({actual:rpysTargets399.model(autoUnit.value).actual,text:document.querySelector('[data-target-feedback]').textContent,report:document.querySelector('.rpysTargetLastResult399').textContent,protected:[db.assign['2026-10|acil|1|day'],db.assign['2026-10|acil|3|night'],db.assign['2026-10|acil|9|other'],db.assign['2026-09|acil|30|night']],guards:JSON.stringify([db.assignmentMeta,db.rpysCellLocks])===guardSnapshot,targets:JSON.stringify(rpysTargets399.config(autoUnit.value).people)===targetSnapshot,rest:rpysRest16V397.allViolations().size,blocked:assignmentsMonth().filter(a=>a.person.id===1&&[2,3,4,5,6,7].includes(a.day)).length,busy:document.querySelector('[data-target-action=run]').getAttribute('aria-busy')}));
  assert.deepEqual(Object.values(result.actual).map(x=>[x.day,x.night]),[[1,0],[1,2],[4,5],[4,6],[3,4],[4,6]]);assert.deepEqual(result.protected,[1,2,4,3]);assert.equal(result.guards,true);assert.equal(result.targets,true);assert.equal(result.blocked,0);assert.equal(result.rest,0);assert.equal(result.busy,'false');assert.match(result.text,/Kısmi dağıtım uygulandı/);assert.match(result.report,/Berk Yaşar.*7.*izin dönüşü/);assert.match(result.report,/Ulaş.*boş gün/);assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});
