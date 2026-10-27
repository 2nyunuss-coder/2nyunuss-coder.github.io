const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.join(__dirname,'..'),core=process.env.RPYS_CORE_FIXTURE,patches=process.env.RPYS_PATCH_FIXTURES;
// Large synthetic history and CPU throttling reproduce the reported frozen page.
// All database traffic is blocked; this exercises the actual equal button/Worker.
test('ACİL equal stays responsive with 37 staff and 3600 historical duties; cancel/error never save',{skip:!core||!patches,timeout:120000},async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext();await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname==='rpys.test'){const p=path.join(root,u.pathname==='/'?'index.html':u.pathname);if(fs.existsSync(p)&&fs.statSync(p).isFile())return route.fulfill({contentType:p.endsWith('.html')?'text/html; charset=utf-8':'application/javascript; charset=utf-8',body:fs.readFileSync(p)})}if(u.pathname==='/functions/v1/rpys-app-source')return route.fulfill({contentType:'text/html; charset=utf-8',body:fs.readFileSync(core)});const p=path.join(patches,u.pathname.split('/').at(-1)+'.js');if(fs.existsSync(p))return route.fulfill({contentType:'application/javascript',body:fs.readFileSync(p)});return route.fulfill({status:401,body:'{}',contentType:'application/json'})});
  const page=await context.newPage(),errors=[];page.on('dialog',d=>d.dismiss());page.on('pageerror',e=>errors.push(e.message));await page.goto('https://rpys.test/');await page.waitForFunction(()=>window.__RPYS_DIRECT_CORE_READY__&&window.rpysTargets399);await page.waitForTimeout(3500);

  await page.evaluate(()=>{
   const unit='ACİL RÖNTGEN';window.testAlerts=[];window.testSaves=[];window.workerReplied=false;window.workerCalls=0;
   window.alert=m=>testAlerts.push(m);window.confirm=()=>true;window.save=window.saveNowV245=()=>testSaves.push({replied:workerReplied,count:assignmentsMonth().filter(a=>a.col.unit===unit).length});window.flushSave=()=>{};
   db=defaultDb();Object.assign(db,{assign:{},assignmentMeta:{},manualDutyOverrides:{},rpysCellLocks:{},lockedDutyCells:{},leaves:[],reserves:{},cellStatus:{},sayStatusCleared:{},importedSaymanlik:{},sayManualWork:{},importedRecords:[],spousePairs:[],lockedMonths:{},manualDistributionTargetsV399:{}});
   month.value='2026-11';db.staff=Array.from({length:37},(_,i)=>({id:i+1,name:'PERF PERSON '+(i+1),status:'Aktif',active:true}));repairCoreData();
   for(let y=2020;y<=2025;y++)for(let m=1;m<=12;m++)for(let d=1;d<=25;d++)for(const col of ['ar1','ar2'])db.assign[y+'-'+String(m).padStart(2,'0')+'|acil|'+d+'|'+col]=(d*2+(col==='ar1'?0:1))%37+1;
   for(let n=0;n<127;n++)db.leaves.push({personId:n%37+1,start:'2025-'+String(n%12+1).padStart(2,'0')+'-03',end:'2025-'+String(n%12+1).padStart(2,'0')+'-07',type:'Yıllık İzin'});
   for(let n=0;n<301;n++)db.reserves['2025-'+String(n%12+1).padStart(2,'0')+'|'+(n%37+1)]=[2,7,12,17,22];
   Object.assign(db.assign,{'2026-11|acil|1|ar1':3,'2026-10|acil|31|ar2':2,'2026-11|pol|7|p1':31,'2026-11|acil|20|ar1':7});
   const at='2026-11-01T00:00:00Z',manual={month:'2026-11',at,reason:'Kilitli hücre'};db.assignmentMeta['2026-11|acil|1|ar1']={manual:true};db.manualDutyOverrides['2026-11|acil|1|ar1']={...manual};db.rpysCellLocks['2026-11|acil|1|ar1']={exists:true,value:3,meta:{manual:true},manual:{...manual},at};
   db.unitPools[ym()+'|'+unit]=[1,2,3,4,5,6];db.distributionRulesV421={[unit]:RPYSRules.config({})};db.manualDistributionTargetsV399[ym()+'|'+unit]={enabled:true,people:Object.fromEntries([1,2,3,4,5,6].map(id=>[id,{day:0,night:1}]))};
   renderAutoPanel();autoUnit.value=unit;renderAutoPanel();for(const o of autoPeople.options)o.selected=Number(o.value)<=6;document.getElementById('rebuildSelectedUnitV246').checked=true;rpysRules421.install();_assignCache={};_allAssignCache=null;_calcCache={};
   for(const p of document.querySelectorAll('.page'))p.classList.toggle('active',p.id==='nobet');renderAll();
   window.protectedBefore=JSON.stringify([db.staff,db.leaves,db.reserves,db.assignmentMeta,db.manualDutyOverrides,db.rpysCellLocks,db.manualDistributionTargetsV399]);window.assignBefore={...db.assign};
   window.legacyCalls=0;window.distributeExactV251=()=>{legacyCalls++;throw Error('Legacy synchronous engine must not run')};
   const NativeWorker=Worker;window.NativeEqualWorker=NativeWorker;window.Worker=class extends NativeWorker{constructor(...args){super(...args);workerCalls++;this.addEventListener('message',()=>workerReplied=true)}};

  });
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  const started=Date.now();
  const immediate=await page.evaluate(()=>{window.lags=[];window.ticks=0;let last=performance.now();window.pulse=setInterval(()=>{const now=performance.now();lags.push(now-last);last=now;ticks++},20);const start=performance.now();document.getElementById('autoDistributeBtnV251').click();return {ms:performance.now()-start,busy:rpysTargets399.isBusy(),disabled:document.getElementById('autoDistributeBtnV251').disabled,cancel:!document.getElementById('rpysEqualCancel426').hidden,saves:testSaves.length,unchanged:Object.entries(assignBefore).every(([k,id])=>db.assign[k]===id)&&Object.keys(db.assign).length===Object.keys(assignBefore).length}});
  assert.ok(immediate.ms<250,JSON.stringify(immediate));assert.equal(immediate.busy,true);assert.equal(immediate.disabled,true);assert.equal(immediate.cancel,true);assert.equal(immediate.saves,0);assert.equal(immediate.unchanged,true);
  await page.waitForFunction(()=>!rpysTargets399.isBusy(),null,{timeout:45000});
  const result=await page.evaluate(()=>{
   clearInterval(pulse);const rows=assignmentsMonth().filter(a=>a.col.unit==='ACİL RÖNTGEN');
   return {filled:rows.length,workers:workerCalls,legacy:legacyCalls,saves:testSaves,alerts:testAlerts,ticks,maxLag:Math.max(...lags),protectedUnchanged:protectedBefore===JSON.stringify([db.staff,db.leaves,db.reserves,db.assignmentMeta,db.manualDutyOverrides,db.rpysCellLocks,db.manualDistributionTargetsV399]),oldRecordsPreserved:Object.entries(assignBefore).every(([k,id])=>db.assign[k]===id),rest:rpysRest16V397.allViolationsForMonth([1,2,3,4,5,6],'2026-11').size,returns:rpysScheduler398.returnWorkdayViolations([1,2,3,4,5,6]).length,text:distResult.textContent,busy:document.getElementById('autoDistributeBtnV251').getAttribute('aria-busy'),cancelHidden:document.getElementById('rpysEqualCancel426').hidden};
  });
  console.log('ACİL large-history responsive result:',JSON.stringify({...result,elapsed:Date.now()-started,clickMs:immediate.ms,cpuThrottle:4}));
  assert.equal(result.filled,60,JSON.stringify(result));assert.equal(result.workers,1);assert.equal(result.legacy,0);assert.deepEqual(result.saves,[{replied:true,count:60}]);assert.deepEqual(result.alerts,[]);
  // At 4x CPU slowdown, even the final visible-table paint must stay below
  // 2.5 seconds; the old solver alone blocked 12 seconds without throttling.
  assert.equal(result.protectedUnchanged,true);assert.equal(result.oldRecordsPreserved,true);assert.equal(result.rest,0);assert.equal(result.returns,0);assert.ok(result.ticks>10);assert.ok(result.maxLag<2500,JSON.stringify(result));assert.equal(result.busy,'false');assert.equal(result.cancelHidden,true);
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  // Stop a deliberately stalled real-button run. It must expose a working
  // cancel control and preserve the entire previously committed calendar.
  await page.evaluate(()=>{window.successState=JSON.stringify(db);window.workerTerminated=false;window.workerStalled=false;window.Worker=class{postMessage(){workerStalled=true}terminate(){workerTerminated=true}};document.getElementById('autoDistributeBtnV251').click()});
  await page.waitForFunction(()=>workerStalled);await page.evaluate(()=>document.getElementById('rpysEqualCancel426').click());await page.waitForFunction(()=>!rpysTargets399.isBusy());
  const cancel=await page.evaluate(()=>({unchanged:JSON.stringify(db)===successState,saves:testSaves.length,terminated:workerTerminated,text:distResult.textContent}));
  assert.equal(cancel.unchanged,true);assert.equal(cancel.saves,1);assert.equal(cancel.terminated,true);assert.match(cancel.text,/iptal edildi/);
  await page.evaluate(()=>{window.Worker=undefined;document.getElementById('autoDistributeBtnV251').click()});await page.waitForFunction(()=>!rpysTargets399.isBusy());
  const missing=await page.evaluate(()=>({unchanged:JSON.stringify(db)===successState,saves:testSaves.length,text:distResult.textContent,legacy:legacyCalls}));
  assert.equal(missing.unchanged,true);assert.equal(missing.saves,1);assert.equal(missing.legacy,0);assert.match(missing.text,/arka plan hesaplamasını desteklemiyor/);
  // A real edit while the isolated validation yields must reject the stale
  // plan, keep the user's new value and avoid a second save.
  await page.evaluate(()=>{window.editedState=null;window.Worker=class extends NativeEqualWorker{constructor(...args){super(...args);this.addEventListener('message',()=>setTimeout(()=>{db.staff[0].name='USER EDIT DURING VALIDATION';editedState=JSON.stringify(db)},0))}};document.getElementById('autoDistributeBtnV251').click()});
  await page.waitForFunction(()=>!rpysTargets399.isBusy());
  const edited=await page.evaluate(()=>({kept:editedState!==null&&JSON.stringify(db)===editedState,saves:testSaves.length,text:distResult.textContent}));
  assert.equal(edited.kept,true);assert.equal(edited.saves,1);assert.match(edited.text,/veriler veya seçim değişti/);assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});
