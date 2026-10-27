const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.join(__dirname,'..'),core=process.env.RPYS_CORE_FIXTURE,patches=process.env.RPYS_PATCH_FIXTURES;
const cases=require('./fixtures/acil-augmenting-cases.json');
// These synthetic calendars have a known full witness. The previous release
// left 58–59/60 cells filled in these cases. Database requests are blocked.
test('ACİL completes feasible greedy dead ends and explains genuine empty cells',{skip:!core||!patches},async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext();await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname==='rpys.test'){const p=path.join(root,u.pathname==='/'?'index.html':u.pathname);if(fs.existsSync(p)&&fs.statSync(p).isFile())return route.fulfill({contentType:p.endsWith('.html')?'text/html; charset=utf-8':'application/javascript; charset=utf-8',body:fs.readFileSync(p)})}if(u.pathname==='/functions/v1/rpys-app-source')return route.fulfill({contentType:'text/html; charset=utf-8',body:fs.readFileSync(core)});const p=path.join(patches,u.pathname.split('/').at(-1)+'.js');if(fs.existsSync(p))return route.fulfill({contentType:'application/javascript',body:fs.readFileSync(p)});return route.fulfill({status:401,body:'{}',contentType:'application/json'})});
  const page=await context.newPage(),errors=[];page.on('dialog',d=>d.dismiss());page.on('pageerror',e=>errors.push(e.message));await page.goto('https://rpys.test/');await page.waitForFunction(()=>window.__RPYS_DIRECT_CORE_READY__&&window.rpysTargets399);await page.waitForTimeout(3500);
  const results=await page.evaluate(async cases=>{
   const unit='ACİL RÖNTGEN',out=[];
   window.alert=m=>testAlerts.push(m);window.confirm=()=>true;
   window.save=()=>testSaves++;window.saveNowV245=()=>testSaves++;window.flushSave=()=>{};
   const reset=()=>{_assignCache={};_allAssignCache=null;_calcCache={};_peopleCache=null;};
   const eligibilityErrors=()=>{
    const errors=[];
    for(const row of assignmentsMonth().filter(a=>a.col.unit===unit)){
     const key=keyFor(row.type,row.day,row.col.key),id=db.assign[key];delete db.assign[key];reset();
     try{if(!canTakeShiftV2414(row.person.id,row.day,row.col,unit))errors.push(key);}
     finally{db.assign[key]=id;reset();}
    }
    return errors;
   };
   const check=()=>({ineligible:eligibilityErrors(),rest:rpysRest16V397.allViolations().size,gaps:rpysScheduler398.gapViolations([1,2,3,4,5,6],unit).length,returns:rpysScheduler398.returnWorkdayViolations([1,2,3,4,5,6]).length,blocked:assignmentsMonth().filter(a=>rpysScheduler398.reservedOn(a.person.id,a.day)||rpysScheduler398.spouseUnavailable(a.person.id,a.day)).length});
   for(const fixture of [...cases,{...cases[0],trial:'impossible'},{...cases[0],trial:'locked-empty'}]){
    db=defaultDb();Object.assign(db,{assign:{},assignmentMeta:{},manualDutyOverrides:{},rpysCellLocks:{},lockedDutyCells:{},leaves:[],reserves:JSON.parse(JSON.stringify(fixture.reserves)),cellStatus:{},sayStatusCleared:{},importedSaymanlik:{},sayManualWork:{},importedRecords:[],spousePairs:[],lockedMonths:{},manualDistributionTargetsV399:{}});
    month.value='2026-11';db.staff=Array.from({length:6},(_,i)=>({id:i+1,name:'TEST PERSON '+(i+1),status:'Aktif',active:true}));repairCoreData();db.unitPools[ym()+'|'+unit]=db.staff.map(p=>p.id);db.distributionRulesV421={[unit]:RPYSRules.config({})};
    db.assign=JSON.parse(JSON.stringify(fixture.witness));reset();const witness=check();
    db.assign=JSON.parse(JSON.stringify(fixture.initial));
    if(fixture.trial==='impossible'){
     db.assign=JSON.parse(JSON.stringify(fixture.witness));
     for(let id=1;id<=6;id++)db.reserves['2026-11|'+id]=[...new Set([...(db.reserves['2026-11|'+id]||[]),15])];
     delete db.assign['2026-11|acil|15|ar1'];delete db.assign['2026-11|acil|15|ar2'];
    }
    if(fixture.trial==='locked-empty'){
     db.assign=JSON.parse(JSON.stringify(fixture.witness));delete db.assign['2026-11|acil|15|ar1'];
     db.rpysCellLocks['2026-11|acil|15|ar1']={exists:false,value:null,meta:null,manual:null,at:'2026-11-01T00:00:00Z'};
    }
    renderAutoPanel();autoUnit.value=unit;renderAutoPanel();for(const o of autoPeople.options)o.selected=true;
    document.getElementById('rebuildSelectedUnitV246').checked=typeof fixture.trial==='number'&&fixture.trial%2===0;
    rpysRules421.install();reset();
    // Let queued UI maintenance from the preceding synthetic calendar settle
    // before taking this scenario's selection/database snapshot.
    await new Promise(resolve=>setTimeout(resolve,50));testSaves=0;testAlerts=[];
    const initial=JSON.parse(JSON.stringify(db.assign)),preserve=!document.getElementById('rebuildSelectedUnitV246').checked;
    const protectedData=JSON.stringify([db.staff,db.leaves,db.reserves,db.rpysCellLocks,db.manualDistributionTargetsV399]);
    const started=performance.now();document.getElementById('autoDistributeBtnV251').click();
    while(rpysTargets399.isBusy())await new Promise(resolve=>setTimeout(resolve,20));
    out.push({trial:fixture.trial,expectedBefore:fixture.expectedBefore,witness,filled:assignmentsMonth().filter(a=>a.col.unit===unit).length,checks:check(),saves:testSaves,alerts:[...testAlerts],audit:db.v251PlanAudit?.[ym()+'|'+unit]?.completion||rpysScheduler398.equalCompletion(unit,[1,2,3,4,5,6]),protectedUnchanged:protectedData===JSON.stringify([db.staff,db.leaves,db.reserves,db.rpysCellLocks,db.manualDistributionTargetsV399]),initialPreserved:!preserve||Object.entries(initial).every(([k,id])=>db.assign[k]===id),text:document.getElementById('distResult').textContent,detail:document.getElementById('rpysAcilCompletion425')?.textContent||'',ms:performance.now()-started});
   }return out;
  },cases);
  console.log('ACİL augmenting scenarios:',JSON.stringify(results));
  for(const r of results){
   assert.deepEqual(r.witness,{ineligible:[],rest:0,gaps:0,returns:0,blocked:0});
   assert.equal(r.saves,typeof r.trial==='number'?1:0,JSON.stringify(r));assert.deepEqual(r.alerts,[],JSON.stringify(r));
   assert.equal(r.protectedUnchanged,true);assert.equal(r.initialPreserved,true);assert.doesNotMatch(r.text,/5 günlük aralık kontrolünde/);
   assert.deepEqual(r.checks,{ineligible:[],rest:0,gaps:0,returns:0,blocked:0},JSON.stringify(r));
   assert.ok(r.ms<5000,JSON.stringify(r));
   if(typeof r.trial==='number'){
    assert.equal(r.filled,60,JSON.stringify(r));assert.equal(r.audit.engine,'csp-worker');assert.equal(r.audit.unfilled.length,0);
   }else if(r.trial==='impossible'){
    assert.equal(r.filled,58);assert.equal(r.audit.unfilled.length,2);
    for(const x of r.audit.unfilled){assert.equal(x.day,15);assert.equal(x.people.length,6);assert.ok(x.people.every(p=>p.reason==='Rezerve'));}
    assert.match(r.detail,/Rezerve/);assert.match(r.text,/58 \/ 60/);
   }else{
    assert.equal(r.filled,59);assert.equal(r.audit.unfilled.length,1);assert.equal(r.audit.unfilled[0].locked,true);assert.match(r.detail,/kilitli/);assert.match(r.text,/59 \/ 59/);
   }
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});
