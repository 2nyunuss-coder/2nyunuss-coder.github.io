const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.join(__dirname,'..'),core=process.env.RPYS_CORE_FIXTURE,patches=process.env.RPYS_PATCH_FIXTURES;
// These optional fixtures contain only public program source. All scheduling
// scenarios below replace the database with synthetic staff and calendars.
test('full application: only leave requires first-workday return and reserve always blocks assignments',{skip:!core||!patches},async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext();await context.route('**/*',route=>{
   const u=new URL(route.request().url());if(u.hostname==='rpys.test'){const p=path.join(root,u.pathname==='/'?'index.html':u.pathname);if(fs.existsSync(p)&&fs.statSync(p).isFile())return route.fulfill({contentType:p.endsWith('.html')?'text/html; charset=utf-8':'application/javascript; charset=utf-8',body:fs.readFileSync(p)})}
   if(u.pathname==='/functions/v1/rpys-app-source')return route.fulfill({contentType:'text/html; charset=utf-8',body:fs.readFileSync(core)});
   const p=path.join(patches,u.pathname.split('/').at(-1)+'.js');if(fs.existsSync(p))return route.fulfill({contentType:'application/javascript',body:fs.readFileSync(p)});return route.fulfill({status:401,body:'{}',contentType:'application/json'});
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.dismiss());await page.goto('https://rpys.test/');await page.waitForFunction(()=>window.__RPYS_DIRECT_CORE_READY__&&window.rpysRules421&&window.rpysTargets399);await page.waitForTimeout(3500);
  const result=await page.evaluate(()=>{
   window.alert=m=>window.testAlerts.push(m);window.confirm=()=>true;window.save=()=>window.testSaves++;window.saveNowV245=()=>window.testSaves++;window.flushSave=()=>{};
   const baseHoliday=window.rpysHolidayInfo,results=[];
   function seed(unit,mode){
    db=defaultDb();Object.assign(db,{assign:{},leaves:[],reserves:{},cellStatus:{},importedSaymanlik:{},sayManualWork:{},sayStatusCleared:{},importedRecords:[],assignmentMeta:{},manualDutyOverrides:{},rpysCellLocks:{},spousePairs:[],lockedMonths:{}});month.value='2026-10';db.staff=['AMİNE TEST','PERSON B','PERSON C','PERSON D','PERSON E','PERSON F'].map((name,i)=>({id:i+1,name,status:'Aktif',active:true}));repairCoreData();db.unitPools[ym()+'|'+unit]=[1,2,3,4,5,6];db.skopiEligible=[1,2,3,4,5,6];
    db.cellStatus={'2026-10|AMİNE TEST|10':'reserve','2026-10|AMİNE TEST|11':'reserve','2026-10|PERSON E|14':'sua'};db.reserves={'2026-10|2':[17,18],'2026-10|6':[24,25]};db.leaves=[{personId:3,start:'2026-09-25',end:'2026-09-30',type:'Yıllık İzin'}];db.importedSaymanlik={'2026-10|PERSON D|8':'RAPOR','2026-10|PERSON D|9':'RAPOR'};
    db.distributionRulesV421={[unit]:RPYSRules.config({maxGapEnabled:false,minGapEnabled:false,spouseSameDay:false,preLeaveThursday:false,returnMonday:false,blockReserve:false,leaveWeekendBlock:false})};
    window.rpysHolidayInfo=date=>mode==='holiday'&&date==='2026-10-19'?{type:'full',label:'Test tatili'}:baseHoliday(date);
    if(mode==='locked'){db.leaves.push({personId:1,start:'2026-10-10',end:'2026-10-11',type:'Yıllık İzin'});db.rpysCellLocks={'2026-10|acil|12|sk1':{exists:false},'2026-10|acil|12|sk2':{exists:false}};}
    if(mode==='reserve-locked'){db.importedSaymanlik={};db.rpysCellLocks={'2026-10|acil|12|sk1':{exists:false},'2026-10|acil|12|sk2':{exists:false}};}
    renderAutoPanel();autoUnit.value=unit;renderAutoPanel();for(const o of autoPeople.options)o.selected=true;rpysRules421.install();_assignCache={};_allAssignCache=null;_calcCache={};testSaves=0;testAlerts=[];
   }
   for(const [unit,mode] of [...['ACİL RÖNTGEN','BİLGİSAYARLI TOMOGRAFİ','PORTABL + SKOPİ','POLİKLİNİK RÖNTGEN'].map(u=>[u,'normal']),['PORTABL + SKOPİ','sequential'],['PORTABL + SKOPİ','holiday'],['PORTABL + SKOPİ','locked'],['PORTABL + SKOPİ','reserve-locked']]){
    seed(unit,mode);const before=JSON.stringify([db.assign,db.rpysCellLocks,db.assignmentMeta,db.leaves,db.reserves,db.cellStatus]),start=performance.now();if(mode==='sequential')distributeSkopiSequential();else autoDistribute();const rows=assignmentsMonth();results.push({unit,mode,ms:performance.now()-start,saves:testSaves,alerts:[...testAlerts],returnDays:db.staff.map(p=>({id:p.id,required:rpysScheduler398.returnWorkdays(p.id),actual:rows.filter(a=>a.person.id===p.id).map(a=>a.day)})),missing:rpysScheduler398.returnWorkdayViolations([1,2,3,4,5,6]),blocked:rows.filter(a=>rpysScheduler398.reservedOn(a.person.id,a.day)||[4].includes(a.person.id)&&[8,9].includes(a.day)||a.person.id===5&&a.day===14).map(a=>a.person.id+'|'+a.day),rest:rpysRest16V397.allViolations().size,unchanged:JSON.stringify([db.assign,db.rpysCellLocks,db.assignmentMeta,db.leaves,db.reserves,db.cellStatus])===before,mandatory:[rpysRules421.enabled(unit,'returnMonday'),rpysRules421.enabled(unit,'blockReserve')]});
   }
   seed('PORTABL + SKOPİ','normal');rpysRules421.open();const switches=['returnMonday','blockReserve'].map(k=>{const el=document.querySelector('[data-rule="'+k+'"]');return {key:k,checked:el.checked,disabled:el.disabled,label:el.parentElement.textContent}});document.querySelector('#rpysRuleDialog421 [data-close]').click();return {results,switches};
  });
  console.log('Return/reserve production scenarios:',JSON.stringify(result));
  for(const r of result.results){assert.deepEqual(r.mandatory,[true,true]);assert.equal(r.blocked.length,0,JSON.stringify(r));assert.equal(r.rest,0,JSON.stringify(r));if(r.mode==='locked'){assert.equal(r.saves,0);assert.equal(r.unchanged,true);assert.ok(r.alerts.some(t=>t.includes('AMİNE TEST')&&t.includes('2026-10-12')));continue}assert.equal(r.saves,1,JSON.stringify(r));assert.equal(r.missing.length,0,JSON.stringify(r));for(const p of r.returnDays)for(const day of p.required)assert.ok(p.actual.includes(day),JSON.stringify(r));assert.ok(!r.alerts.some(m=>/İşlem tamamlanamadı|hata oluştu/.test(m)));assert.deepEqual(r.returnDays[0].required,r.mode==='locked'?[12]:[]);assert.deepEqual(r.returnDays[1].required,[]);assert.deepEqual(r.returnDays[5].required,[]);assert.deepEqual(r.returnDays[2].required,[1]);if(r.mode==='reserve-locked')assert.ok(!r.returnDays[0].actual.includes(12),'post-reserve Monday can stay empty without excluding the employee');}
  for(const s of result.switches){assert.equal(s.checked,true);assert.equal(s.disabled,true);assert.match(s.label,/Zorunlu/);if(s.key==='returnMonday')assert.doesNotMatch(s.label,/rezerve/i)}assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});
