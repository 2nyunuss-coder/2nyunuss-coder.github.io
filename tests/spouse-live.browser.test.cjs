const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.join(__dirname,'..'),core=process.env.RPYS_CORE_FIXTURE,patches=process.env.RPYS_PATCH_FIXTURES;
// Public application source and its external legacy patches are fixtures only.
// No personnel database is downloaded or contacted by this browser test.
test('full application: spouse pairing in normal distribution and protected/leave scenarios',{skip:!core||!patches},async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext();await context.route('**/*',route=>{
   const u=new URL(route.request().url());
   if(u.hostname==='rpys.test'){const p=path.join(root,u.pathname==='/'?'index.html':u.pathname);if(fs.existsSync(p)&&fs.statSync(p).isFile())return route.fulfill({contentType:p.endsWith('.html')?'text/html; charset=utf-8':'application/javascript; charset=utf-8',body:fs.readFileSync(p)})}
   if(u.pathname==='/functions/v1/rpys-app-source')return route.fulfill({contentType:'text/html; charset=utf-8',body:fs.readFileSync(core)});
   const p=path.join(patches,u.pathname.split('/').at(-1)+'.js');if(fs.existsSync(p))return route.fulfill({contentType:'application/javascript',body:fs.readFileSync(p)});
   return route.fulfill({status:401,body:'{}',contentType:'application/json'});
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.dismiss());await page.goto('https://rpys.test/');await page.waitForFunction(()=>window.rpysRules421&&window.rpysTargets399);await page.waitForTimeout(3500);
  const results=await page.evaluate(()=>{
   window.alert=message=>window.testAlerts.push(message);window.confirm=()=>true;window.save=()=>window.testSaves++;window.saveNowV245=()=>window.testSaves++;window.flushSave=()=>{};
   const results=[];
   const seed=(unit,scenario)=>{
    db=defaultDb();month.value='2026-10';db.staff=['MAHMUT YILMAZ','RUMEYSA YILMAZ','OTHER A','OTHER B','OTHER C','OTHER D'].map((name,i)=>({id:i+1,name,status:'Aktif',active:true}));repairCoreData();db.assignmentMeta??={};db.rpysCellLocks??={};db.spousePairs=[{a:1,b:2,active:true}];db.unitPools[ym()+'|'+unit]=[1,2,3,4,5,6];db.skopiEligible=[1,2,3,4,5,6];
    db.distributionRulesV421={[unit]:RPYSRules.config({maxGapEnabled:false,preLeaveThursday:false,returnMonday:false,leaveWeekendBlock:false,minGapEnabled:false,spouseSameDay:scenario!=='disabled'})};
    if(scenario==='leave')db.leaves=[{personId:2,start:'2026-10-01',end:'2026-10-31',type:'Yıllık İzin'}];
    if(scenario==='protected'){
     db.assign={'2026-09|acil|30|ar1':2,'2026-10|pol|2|p1':2,'2026-10|acil|5|sk1':3};db.rpysCellLocks={'2026-10|acil|5|sk1':{exists:true},'2026-10|acil|12|sk1':{exists:false}};db.assignmentMeta={'2026-10|acil|5|sk1':{manual:true}};
    }
    renderAutoPanel();autoUnit.value=unit;renderAutoPanel();for(const o of autoPeople.options)o.selected=!(scenario==='unselected'||scenario==='disabled')||Number(o.value)!==2;rpysRules421.install();_allAssignCache=null;_assignCache={};_calcCache={};window.testAlerts=[];window.testSaves=0;
   };
   for(const [unit,scenarioName] of [...['ACİL RÖNTGEN','BİLGİSAYARLI TOMOGRAFİ','PORTABL + SKOPİ','POLİKLİNİK RÖNTGEN'].map(u=>[u,'active']),...['leave','protected','unselected','disabled'].map(s=>['PORTABL + SKOPİ',s]),...['active','leave','protected'].map(s=>['PORTABL + SKOPİ','sequential-'+s])]){
    const sequential=scenarioName.startsWith('sequential-'),scenario=scenarioName.replace('sequential-','');
    seed(unit,scenario);const protectedState=JSON.stringify([db.rpysCellLocks,db.assignmentMeta,db.staff]),started=performance.now();if(sequential)distributeSkopiSequential();else autoDistribute();const rows=Object.entries(db.assign);results.push({unit,scenario,sequential,ms:performance.now()-started,saves:testSaves,alerts:[...testAlerts],count:rows.filter(([k])=>k.startsWith('2026-10|')).length,pair:[1,2].map(id=>[...new Set(rows.filter(([k,p])=>k.startsWith('2026-10|')&&p===id).map(([k])=>Number(k.split('|')[2])))].sort((a,b)=>a-b)),violations:rpysScheduler398.spouseDayViolations(ym()).length,rest:rpysRest16V397.allViolations().size,protected:JSON.stringify([db.rpysCellLocks,db.assignmentMeta,db.staff])===protectedState,previous:db.assign['2026-09|acil|30|ar1'],otherUnit:db.assign['2026-10|pol|2|p1'],manual:db.assign['2026-10|acil|5|sk1'],emptyLock:db.assign['2026-10|acil|12|sk1']});
   }
   return results;
  });
  for(const r of results){assert.equal(r.saves,1,JSON.stringify(r));if(r.sequential){assert.equal(r.alerts.length,1,JSON.stringify(r));assert.match(r.alerts[0],/dağıtım tamamlandı/)}else assert.deepEqual(r.alerts,[],JSON.stringify(r));assert.ok(r.count>0);assert.equal(r.violations,0,JSON.stringify(r));assert.equal(r.rest,0,JSON.stringify(r));assert.equal(r.protected,true,JSON.stringify(r));if(r.scenario==='active'){assert.ok(r.pair[0].length>0);assert.deepEqual(r.pair[0],r.pair[1],r.unit)}if(r.scenario==='leave'){assert.ok(r.pair[0].length>0);assert.equal(r.pair[1].length,0)}if(r.scenario==='protected'){assert.equal(r.previous,2);assert.equal(r.otherUnit,2);assert.equal(r.manual,3);assert.equal(r.emptyLock,undefined)}if(r.scenario==='unselected')assert.equal(r.pair[0].length,0);if(r.scenario==='disabled')assert.ok(r.pair[0].length>0)}
  assert.deepEqual(errors,[]);console.log('Full application spouse scenarios:',JSON.stringify(results));
 }finally{await browser.close()}
});
