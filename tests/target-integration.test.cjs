const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {Worker:Thread}=require('node:worker_threads');
const root=path.join(__dirname,'..'),unit='PORTABL + SKOPİ';
function fixture(){
 const saved=[],alerts=[],controls={autoUnit:{value:unit},autoPeople:{closest:()=>null,selectedOptions:[1,2,3,4,5,6].map(value=>({value}))},rebuildSelectedUnitV246:{checked:true},distResult:{textContent:''}};
 const cols={day:{key:'day',unit,hours:8},night:{key:'night',unit,hours:16},other:{key:'other',unit:'OTHER',hours:8}};
 let month='2026-10';
 class Worker{constructor(){this.thread=new Thread(`const {parentPort}=require('node:worker_threads');const {solveTargets}=require(${JSON.stringify(path.join(root,'rpys-target-worker.js'))});parentPort.on('message',data=>parentPort.postMessage(solveTargets(data)));`,{eval:true});this.thread.on('message',data=>this.onmessage?.({data}));this.thread.on('error',()=>this.onerror?.())}postMessage(data){this.thread.postMessage(data)}terminate(){this.thread.terminate()}}
 const c={console,URL,Worker,Date,clearTimeout,setTimeout:(fn,ms)=>ms===0||ms>=5000?setTimeout(fn,ms):0,
 db:{staff:['Berk Yaşar','Erdem Ulus','F. Ahmed Karagöz','Hakan Çelik','Nurullah Bardak','Recep Duman'].map((name,i)=>({id:i+1,name,status:'Aktif'})),assign:{},assignmentMeta:{},manualDutyOverrides:{},rpysCellLocks:{},leaves:[],importedRecords:[],settings:{},customTextRules:[],manualDistributionTargetsV399:{['2026-10|'+unit]:{enabled:true,people:Object.fromEntries([1,2,3,4,5,6].map((id,i)=>[id,{day:[5,4,4,4,3,1][i],night:[7,6,5,6,4,2][i]}]))}}},
 _assignCache:{},_allAssignCache:null,_calcCache:{},_peopleCache:null,
 document:{baseURI:'https://example.org/',currentScript:{src:'https://example.org/rpys-targets-v399.js'},readyState:'complete',head:{appendChild(){}},createElement:()=>({}),documentElement:{dataset:{}},getElementById:id=>controls[id]||null,addEventListener(){}},addEventListener(){},alert:m=>alerts.push(m),
 ym:()=>month,dateStr:d=>month+'-'+String(d).padStart(2,'0'),daysInMonth:()=>30,keyFor:(t,d,k)=>`${month}|${t}|${d}|${k}`,isMonthLocked:()=>false,
 dutyColumnByKey:(t,k)=>cols[k],dutyColumns:t=>t==='acil'?Object.values(cols):[],unitSlots:()=>['day','night'].map(k=>({type:'acil',col:cols[k]})),isShiftBlockedForMonth:()=>false,isDutyCellApplicable:(t,col,d)=>col.key!=='day'||d<=21,
 getPersonById:id=>c.db.staff.find(p=>p.id===Number(id)),personStatusAt:p=>p.status,isOnLeave:(id,d)=>c.db.leaves.some(l=>l.id===id&&l.day===d),ruleCfg:()=>({longHours:23,minGap:2}),unitRulesV251:()=>({}),isOvernightOrDutyShift:col=>col.hours>=16,
 canTakeShift:()=>true,canTakeShiftV2414:(id,d,col)=>!c.isOnLeave(id,d)&&!c.assignmentsMonth().some(a=>a.person.id===id&&a.day===d),
 allAssignmentsAllMonths:()=>Object.entries(c.db.assign).filter(([,id])=>id).map(([k,id])=>{const [monthKey,type,day,col]=k.split('|');return {monthKey,type,day:Number(day),date:monthKey+'-'+day.padStart(2,'0'),person:c.getPersonById(id),col:cols[col]}}),
 assignmentsMonth:()=>c.allAssignmentsAllMonths().filter(a=>a.monthKey===month),isImportedShiftBlocked:()=>false,
 autoDistribute:()=>{throw Error('legacy engine must not run')},save(){},saveNowV245:()=>saved.push(JSON.stringify(c.db)),flushSave(){},renderAll(){}};
 c.window=c;vm.createContext(c);for(const file of ['rpys-runtime-v397.js','rpys-scheduler-v398.js','rpys-targets-v399.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),c);
 return {c,controls,saved,alerts,cols,setMonth:v=>{month=v}};
}
test('real Worker -> safe scheduler: 51 exact duties, live state unchanged until validated, one save',async()=>{
 const f=fixture(),before=JSON.stringify(f.c.db);let exposedDraft=false,ticks=0;const poll=setInterval(()=>{ticks++;if(!f.saved.length&&JSON.stringify(f.c.db)!==before)exposedDraft=true},1);const promise=f.c.autoDistribute();assert.equal(JSON.stringify(f.c.db),before);assert.equal(f.saved.length,0);
 let heartbeat=false;await new Promise(r=>setImmediate(()=>{heartbeat=true;r()}));assert.equal(heartbeat,true);
 const result=await promise;clearInterval(poll);assert.ok(ticks>1);assert.equal(exposedDraft,false);assert.equal(result.ok,true,f.alerts.join('\n'));assert.equal(f.alerts.length,0);assert.equal(f.saved.length,1);assert.equal(Object.keys(f.c.db.assign).length,51);
 const m=f.c.rpysTargets399.model(unit);for(const id of m.ids)for(const kind of ['day','night'])assert.equal(m.actual[id][kind],f.c.db.manualDistributionTargetsV399['2026-10|'+unit].people[id][kind]);
 assert.equal(f.c.rpysRest16V397.allViolations().size,0);
});
test('leave, other unit, manual, lock and unselected person are preserved on successful rebuild',async()=>{
 const f=fixture();f.c.db.staff.push({id:7,name:'Not selected',status:'Aktif'});
 Object.assign(f.c.db.assign,{'2026-10|acil|1|day':1,'2026-10|acil|10|night':2,'2026-10|acil|2|other':3,'2026-10|acil|22|day':7});
 f.c.db.assignmentMeta['2026-10|acil|1|day']={manual:true};f.c.db.rpysCellLocks['2026-10|acil|10|night']={locked:true};f.c.db.rpysCellLocks['2026-10|acil|30|day']={locked:true};
 f.c.db.leaves=[{id:1,day:3},{id:1,day:4},{id:1,day:5}];const protectedState=JSON.stringify([f.c.db.assignmentMeta,f.c.db.rpysCellLocks,f.c.db.staff]);
 const result=await f.c.autoDistribute();assert.equal(result.ok,true,f.alerts.join('\n'));assert.equal(f.saved.length,1);assert.equal(f.c.db.assign['2026-10|acil|1|day'],1);assert.equal(f.c.db.assign['2026-10|acil|10|night'],2);assert.equal(f.c.db.assign['2026-10|acil|2|other'],3);assert.equal(f.c.db.assign['2026-10|acil|22|day'],7);assert.equal(JSON.stringify([f.c.db.assignmentMeta,f.c.db.rpysCellLocks,f.c.db.staff]),protectedState);
 assert.equal(f.c.rpysRest16V397.allViolations().size,0);for(const d of [3,4,5])for(const k of ['day','night'])assert.notEqual(f.c.db.assign[`2026-10|acil|${d}|${k}`],1);
});
test('impossible personal leave capacity explains name and kind, changes nothing and never saves',async()=>{
 const f=fixture();f.c.db.leaves=Array.from({length:30},(_,i)=>({id:1,day:i+1}));const before=JSON.stringify(f.c.db);assert.equal(await f.c.autoDistribute(),false);assert.equal(JSON.stringify(f.c.db),before);assert.equal(f.saved.length,0);assert.match(f.alerts[0],/Berk Yaşar.*gündüz/);assert.match(f.alerts[0],/Önerilen üst sınır: 0/);
});
test('edits during worker computation reject stale plan and retain the new edit',async()=>{
 const f=fixture(),pending=f.c.autoDistribute();f.c.db.staff[0].name='Edited during calculation';const before=JSON.stringify(f.c.db);assert.equal(await pending,false);assert.equal(JSON.stringify(f.c.db),before);assert.equal(f.saved.length,0);assert.match(f.alerts[0],/veriler veya seçim değişti/);
});
test('worker error and unavailable Worker preserve database',async()=>{
 for(const mode of ['missing','error']){const f=fixture();f.c.Worker=mode==='missing'?undefined:class{postMessage(){queueMicrotask(()=>this.onerror())}terminate(){}};const before=JSON.stringify(f.c.db);assert.equal(await f.c.autoDistribute(),false);assert.equal(JSON.stringify(f.c.db),before);assert.equal(f.saved.length,0)}
});
test('history filters selected unit and people; fair targets preserve fixed totals and do not edit targets',()=>{
 const f=fixture();f.c.db.staff.push({id:7,name:'Excluded',status:'Aktif'});Object.assign(f.c.db.assign,{'2025-01|acil|2|day':1,'2025-01|acil|3|night':1,'2025-01|acil|4|other':1,'2025-01|acil|5|day':7});
 const m=f.c.rpysTargets399.model(unit),h=f.c.rpysTargets399.historyFor(m);assert.equal(h.data[1][2025].day,1);assert.equal(h.data[1][2025].night,1);assert.equal(h.data[7],undefined);
 f.c.db.leaves=Array.from({length:15},(_,i)=>({id:1,day:i+1}));const before=JSON.stringify(f.c.db),fair=f.c.rpysTargets399.fairTargets(m);assert.equal(JSON.stringify(f.c.db),before);assert.ok(fair.targets[1].night<fair.targets[2].night);assert.equal(Object.values(fair.targets).reduce((n,v)=>n+v.day,0),21);assert.equal(Object.values(fair.targets).reduce((n,v)=>n+v.night,0),30);
});
test('unselected existing in-unit assignment is never mutable; empty locks reduce required coverage',()=>{
 const f=fixture();f.c.db.staff.push({id:7,name:'Excluded',status:'Aktif'});const outsider='2026-10|acil|5|day',emptyLock='2026-10|acil|6|night';f.c.db.assign[outsider]=7;f.c.db.rpysCellLocks[emptyLock]={locked:true};const m=f.c.rpysTargets399.model(unit);assert.equal(m.mutable.has(outsider),false);assert.equal(m.mutable.has(emptyLock),false);assert.equal(m.required.day,20);assert.equal(m.required.night,29);
});
test('selection and month changes during work reject plan without restoring stale data',async()=>{
 for(const field of ['selection','month']){const f=fixture(),promise=f.c.autoDistribute();if(field==='selection')f.controls.autoPeople.selectedOptions.pop();else f.setMonth('2026-11');const before=JSON.stringify(f.c.db);assert.equal(await promise,false);assert.equal(JSON.stringify(f.c.db),before);assert.equal(f.saved.length,0);assert.match(f.alerts[0],/veriler veya seçim değişti/)}
});
test('special monthly limit is diagnosed before worker search and leaves all data intact',async()=>{
 const f=fixture();f.c.db.customTextRules=[{active:true,unit,kind:'personUnitMonthlyMax',personId:1,max:2}];const before=JSON.stringify(f.c.db);assert.equal(await f.c.autoDistribute(),false);assert.equal(JSON.stringify(f.c.db),before);assert.equal(f.saved.length,0);assert.match(f.alerts[0],/Berk Yaşar.*özel kural/);
});
test('supported consecutive-duty rule is compiled without all-pairs eligibility rescans',async()=>{
 const f=fixture();f.c.db.customTextRules=[{active:true,kind:'unitConsecutive',unit,maxConsecutive:1}];const base=f.c.canTakeShiftV2414;let calls=0;f.c.canTakeShiftV2414=(...args)=>{calls++;return base(...args)};
 const result=await f.c.autoDistribute();assert.equal(result.ok,true,f.alerts.join('\n'));assert.ok(calls<1000,`too many eligibility queries: ${calls}`);assert.equal(f.saved.length,1);
 for(const id of [1,2,3,4,5,6]){const days=f.c.assignmentsMonth().filter(a=>a.person.id===id).map(a=>a.day).sort((a,b)=>a-b);assert.ok(days.slice(1).every((d,i)=>d-days[i]>1))}
});

function enableGapRule(f){
 f.c.unitRulesV251=()=>({maxGapEnabled:true});f.c.unitMaxGapDaysV251=()=>5;f.c.nonLeaveSegmentsV2414=()=>[[1,30]];f.c.spouseOf=()=>null;
 f.c.v251GapViolations=ids=>ids.flatMap(id=>{const days=f.c.assignmentsMonth().filter(a=>a.person.id===id&&a.col.unit===unit).map(a=>a.day).sort((a,b)=>a-b);return days.slice(1).flatMap((d,i)=>d-days[i]-1>5?[{id,left:days[i],right:d}]:[])});
}
test('between-duty gap mode allows low targets without month-boundary requirements',async()=>{
 const f=fixture();enableGapRule(f);const r=await f.c.autoDistribute();assert.equal(r.ok,true,f.alerts.join('\n'));assert.equal(f.c.v251GapViolations([1,2,3,4,5,6]).length,0);assert.equal(f.saved.length,1);assert.equal(Object.keys(f.c.db.assign).length,51);
});
test('fixed duties too far apart require intermediate tasks; failure never clears protected cells',async()=>{
 const f=fixture();enableGapRule(f);for(const d of [1,30]){const k=`2026-10|acil|${d}|night`;f.c.db.assign[k]=6;f.c.db.rpysCellLocks[k]={locked:true}}const before=JSON.stringify(f.c.db);assert.equal(await f.c.autoDistribute(),false);assert.equal(JSON.stringify(f.c.db),before);assert.equal(f.saved.length,0);assert.match(f.alerts[0],/Recep Duman/);
});
test('dedicated target entry survives a later replacement of the global legacy autoDistribute',async()=>{
 const f=fixture();let legacy=0;f.c.autoDistribute=()=>{legacy++};const r=await f.c.rpysTargets399.run();assert.equal(r.ok,true,f.alerts.join('\n'));assert.equal(legacy,0);assert.equal(f.saved.length,1);assert.equal(Object.keys(f.c.db.assign).length,51);
});
test('target button entry surfaces synchronous startup errors instead of silently returning',async()=>{
 const f=fixture();f.c.rpysScheduler398.runTargets=()=>{throw Error('startup probe')};assert.equal(await f.c.rpysTargets399.run(),false);assert.match(f.controls.distResult.textContent,/startup probe/);assert.equal(f.saved.length,0);
});

test('empty lazy defaults and display preferences do not invalidate a pending plan',async()=>{
 const f=fixture();delete f.c.db.rpysCellLocks;const pending=f.c.rpysTargets399.run();f.c.db.rpysCellLocks={};f.c.db.sayTextObligationReduction={};f.c.db.sayTextNoObligationReduction={};f.c.db.poliklinikTakipConfig={groups:['day'],start:'2026-10-01'};f.c.db.ui={panel:'targets'};f.c.db._meta={heartbeat:'changed'};const result=await pending;assert.equal(result.ok,true,f.alerts.join('\n'));assert.equal(f.saved.length,1);assert.equal(f.c.db.ui.panel,'targets');
});
test('manual empty overrides and actual assignment edits still reject stale plans',async()=>{
 for(const field of ['assign','manualDutyOverrides']){const f=fixture(),pending=f.c.rpysTargets399.run();f.c.db[field]['2026-10|acil|1|day']=field==='assign'?null:{};const before=JSON.stringify(f.c.db);assert.equal(await pending,false);assert.equal(JSON.stringify(f.c.db),before);assert.equal(f.saved.length,0)}
});

test('draft history and assignment caches survive every cooperative yield',async()=>{
 const f=fixture();let tick=0,builds=0;f.c.Date=class extends Date{static now(){return tick}};
 const all=f.c.allAssignmentsAllMonths,eligibility=f.c.canTakeShiftV2414;f.c.allAssignmentsAllMonths=()=>{builds++;return all()};f.c.canTakeShiftV2414=(...args)=>{tick+=2;return eligibility(...args)};
 const before=JSON.stringify(f.c.db),original=f.c.allAssignmentsAllMonths;await f.c.rpysTargets399.planningData(unit);assert.equal(builds,1);assert.equal(f.c.allAssignmentsAllMonths,original);assert.equal(f.c.rpysTargets399.isPlanning(),false);assert.equal(JSON.stringify(f.c.db),before);
});
test('preparation deadline restores state and prevents an unbounded calculating screen',async()=>{
 const f=fixture();let tick=0;f.c.Date=class extends Date{static now(){return tick}};const base=f.c.canTakeShiftV2414;f.c.canTakeShiftV2414=(...args)=>{tick+=1100;return base(...args)};const before=JSON.stringify(f.c.db);assert.equal(await f.c.rpysTargets399.run(),false);assert.match(f.controls.distResult.textContent,/hazırlığı zamanında tamamlanamadı/);assert.equal(JSON.stringify(f.c.db),before);assert.equal(f.c.rpysTargets399.isPlanning(),false);assert.equal(f.saved.length,0);
});
test('cancel during preparation restores the complete original state',async()=>{
 const f=fixture(),before=JSON.stringify(f.c.db),pending=f.c.rpysTargets399.run();assert.equal(f.c.rpysTargets399.cancel(),true);assert.equal(await pending,false);assert.equal(JSON.stringify(f.c.db),before);assert.equal(f.saved.length,0);assert.match(f.controls.distResult.textContent,/iptal edildi/);assert.equal(f.c.rpysTargets399.cancel(),false);
});
test('cancel while Worker is pending immediately terminates it and releases the button',async()=>{
 const f=fixture();let signal,terminated=false;const started=new Promise(r=>{signal=r});f.c.Worker=class{postMessage(){signal()}terminate(){terminated=true}};const before=JSON.stringify(f.c.db),pending=f.c.rpysTargets399.run();await started;assert.equal(f.c.rpysTargets399.cancel(),true);assert.equal(await pending,false);assert.equal(terminated,true);assert.equal(JSON.stringify(f.c.db),before);assert.equal(f.saved.length,0);assert.match(f.controls.distResult.textContent,/iptal edildi/);
});

test('cache signature scans are bypassed only while an isolated draft is active',async()=>{
 const f=fixture();f.c.signatureChecks=0;const source="(()=>{let lastSig='';function sig(){window.signatureChecks++;return 'live'}function invalidate(){}const old=()=>true;return function(){let s=sig();if(s!==lastSig){lastSig=s;invalidate('assignment-signature')}return old.apply(this,arguments)}})()";f.c.probe=vm.runInContext(f.c.rpysScheduler398.repairCache(source),f.c);const base=f.c.canTakeShiftV2414;f.c.canTakeShiftV2414=(...args)=>{f.c.probe();return base(...args)};await f.c.rpysTargets399.planningData(unit);assert.equal(f.c.signatureChecks,0);f.c.probe();assert.equal(f.c.signatureChecks,1);
});
test('indexed draft checks retain previous-month rest and next-month imported-duty protection',async()=>{
 const f=fixture();f.c.daysInMonth=()=>31;f.c.db.manualDistributionTargetsV399['2026-10|'+unit].people[6].night=3;f.c.db.assign['2026-09|acil|30|night']=1;f.c.db.importedRecords=[{monthKey:'2026-11',type:'acil',day:1,date:'2026-11-01',personId:1,col:f.cols.day}];const result=await f.c.rpysTargets399.run();assert.equal(result.ok,true,f.alerts.join('\n'));assert.equal(result.plan.length,52);assert.notEqual(f.c.db.assign['2026-10|acil|1|day'],1);assert.notEqual(f.c.db.assign['2026-10|acil|1|night'],1);assert.notEqual(f.c.db.assign['2026-10|acil|31|night'],1);assert.equal(f.c.rpysRest16V397.allViolations().size,0);assert.equal(f.c.db.assign['2026-09|acil|30|night'],1);
});
test('thousands of historical assignments are not scanned by each candidate rest query',async()=>{
 const f=fixture();for(let year=1995;year<2020;year++)for(let month=1;month<=12;month++)for(let day=1;day<=28;day++)f.c.db.assign[`${year}-${String(month).padStart(2,'0')}|acil|${day}|other`]=day%6+1;
 const original={...f.c.db.assign},candidates=f.c.rpysTargets399.recordCandidates;let queries=0,maxKeys=0;f.c.rpysTargets399.recordCandidates=(...args)=>{const result=candidates(...args);if(result){queries++;maxKeys=Math.max(maxKeys,result.keys.length)}return result};
 const result=await f.c.rpysTargets399.run();assert.equal(result.ok,true,f.alerts.join('\n'));assert.equal(result.plan.length,51);assert.ok(queries>300);assert.ok(maxKeys<100,`too many keys per indexed query: ${maxKeys}`);for(const [key,pid] of Object.entries(original))assert.equal(f.c.db.assign[key],pid);assert.equal(f.c.rpysTargets399.recordCandidates(1,null),null);assert.equal(f.saved.length,1);
});

// Independent date-by-date oracle for the active rules10 cross-month check.
// Leave resets a blank run; both endpoints must be real duties, and at least
// one must be in the selected month. No month-boundary duty is invented.
function enableCrossMonthGaps(f){
 enableGapRule(f);const intra=f.c.v251GapViolations;
 f.c.v251GapViolations=ids=>intra(ids).concat(ids.flatMap(id=>{
  const dates=[...new Set(f.c.allAssignmentsAllMonths().filter(a=>a.person.id===id&&a.col.unit===unit).map(a=>a.date))].sort(),out=[];
  for(let i=1;i<dates.length;i++){
   const a=dates[i-1],b=dates[i];if(a.slice(0,7)===b.slice(0,7)||![a.slice(0,7),b.slice(0,7)].includes(f.c.ym()))continue;
   let run=0,blank=0;for(let t=Date.parse(a+'T00:00:00Z')+86400000;t<Date.parse(b+'T00:00:00Z');t+=86400000){const d=new Date(t).toISOString().slice(0,10);if(f.c.db.leaves.some(l=>Number(l.personId)===id&&l.start<=d&&l.end>=d))run=0;else blank=Math.max(blank,++run)}
   if(blank>5)out.push({id,kind:'cross-month',leftDate:a,rightDate:b,blank});
  }return out;
 }));
}
test('cross-month anchors are solved up front: exact 51 duties and no rejected full-plan retries',async()=>{
 const f=fixture();enableCrossMonthGaps(f);f.c.db.assign['2026-09|acil|30|day']=1;f.c.db.assign['2026-11|acil|1|day']=2;
 const Native=f.c.Worker;let requests=0;f.c.Worker=class extends Native{postMessage(data){requests++;super.postMessage(data)}};
 const result=await f.c.rpysTargets399.run();assert.equal(result.ok,true,f.alerts.join('\n'));assert.equal(requests,1);assert.equal(result.plan.length,51);assert.equal(f.saved.length,1);assert.equal(f.c.v251GapViolations([1,2,3,4,5,6]).length,0);assert.equal(f.c.db.assign['2026-09|acil|30|day'],1);assert.equal(f.c.db.assign['2026-11|acil|1|day'],2);
});
test('infeasible target between previous and next month explains person and preserves all data',async()=>{
 const f=fixture();enableCrossMonthGaps(f);for(const k of ['2026-09|acil|30|day','2026-11|acil|1|day'])f.c.db.assign[k]=6;
 const before=JSON.stringify(f.c.db),started=Date.now();assert.equal(await f.c.autoDistribute(),false);assert.equal(JSON.stringify(f.c.db),before);assert.equal(f.saved.length,0);assert.match(f.alerts[0],/Recep Duman/);assert.match(f.alerts[0],/görev aralığı|boş gün kuralı/);assert.doesNotMatch(f.alerts[0],/Verilen sürede/);assert.ok(Date.now()-started<2000);
});

function enableEdgeGaps(f){
 enableCrossMonthGaps(f);f.c.__RPYS_RULEPATCH8_EDGE_GAP_SPOUSE__=1;const old=f.c.v251GapViolations;
 f.c.v251GapViolations=ids=>old(ids).concat(ids.flatMap(id=>f.c.nonLeaveSegmentsV2414(id).flatMap(([a,b])=>{
  const days=f.c.assignmentsMonth().filter(x=>x.person.id===id&&x.col.unit===unit&&x.day>=a&&x.day<=b).map(x=>x.day).sort((x,y)=>x-y);
  const edges=[a-1,...days,b+1];return edges.slice(1).flatMap((d,i)=>d-edges[i]-1>5?[{id,left:edges[i],right:d,blank:d-edges[i]-1}]:[]);
 })));
}
test('effective rulepatch8: low monthly target fails before Worker with the exact missing count',async()=>{
 const f=fixture();enableEdgeGaps(f);let workers=0;f.c.Worker=class{constructor(){workers++}};const before=JSON.stringify(f.c.db);assert.equal(await f.c.autoDistribute(),false);assert.equal(workers,0);assert.equal(f.saved.length,0);assert.equal(JSON.stringify(f.c.db),before);assert.match(f.alerts[0],/Recep Duman.*1 gündüz.*2 nöbet/);assert.match(f.alerts[0],/ay başını, ay sonunu/);assert.match(f.alerts[0],/en az 5 görev/);assert.match(f.alerts[0],/En az 2 görev eksik/);
});
test('effective edge and cross-month rules: 51 exact duties with feasible manually edited targets',async()=>{
 const f=fixture();enableEdgeGaps(f);const cfg=f.c.rpysTargets399.config(unit);cfg.people[1].night=5;cfg.people[6].night=4;f.c.db.assign['2026-09|acil|30|day']=1;f.c.db.assign['2026-11|acil|1|day']=2;
 const result=await f.c.rpysTargets399.run();assert.equal(result.ok,true,f.alerts.join('\n'));assert.equal(result.plan.length,51);assert.equal(f.c.v251GapViolations([1,2,3,4,5,6]).length,0);assert.equal(f.saved.length,1);const m=f.c.rpysTargets399.model(unit);for(const id of m.ids)for(const kind of ['day','night'])assert.equal(m.actual[id][kind],cfg.people[id][kind]);
});

test('button applies 39 feasible duties and reports the unavailable persons exact 12-duty shortfall',async()=>{
 const f=fixture();f.c.db.leaves=Array.from({length:30},(_,i)=>({id:1,day:i+1}));const targets=JSON.stringify(f.c.rpysTargets399.config(unit).people),before=JSON.stringify(f.c.db.assign);let draftExposed=false;const poll=setInterval(()=>{if(!f.saved.length&&JSON.stringify(f.c.db.assign)!==before)draftExposed=true},1);
 const result=await f.c.rpysTargets399.run();clearInterval(poll);assert.equal(result.ok,true,f.alerts.join('\n'));assert.equal(result.partial,true);assert.equal(result.plan.length,39);assert.equal(result.unfilled.length,12);assert.equal(result.shortfalls.length,2);assert.deepEqual(JSON.parse(JSON.stringify(result.shortfalls.map(x=>[x.id,x.kind,x.missing]))),[[1,'day',5],[1,'night',7]]);assert.equal(f.saved.length,1);assert.equal(draftExposed,false);assert.equal(JSON.stringify(f.c.rpysTargets399.config(unit).people),targets);assert.equal(f.c.rpysRest16V397.allViolations().size,0);assert.match(f.controls.distResult.textContent,/Kısmi dağıtım uygulandı/);assert.match(f.controls.distResult.textContent,/Berk Yaşar: 0 \/ 5 gündüz; 5 eksik/);assert.equal(f.alerts.length,0);
});
test('button applies target counts even when gap obligations cannot finish, with explicit unresolved warnings',async()=>{
 const f=fixture();enableEdgeGaps(f);const before=JSON.stringify(f.c.rpysTargets399.config(unit).people);const result=await f.c.rpysTargets399.run();assert.equal(result.ok,true,f.alerts.join('\n'));assert.equal(result.partial,true);assert.equal(result.plan.length,51);assert.equal(result.shortfalls.length,0);assert.equal(f.saved.length,1);assert.equal(JSON.stringify(f.c.rpysTargets399.config(unit).people),before);assert.ok(result.notes.some(x=>/Recep Duman/.test(x)));assert.match(f.controls.distResult.textContent,/koşullar hâlâ düzeltilmeli/);assert.equal(f.c.db.manualDistributionResultsV399['2026-10|'+unit].status,'partial');assert.equal(f.c.rpysRest16V397.allViolations().size,0);
});
test('partial fallback preserves existing unlocked, manual, locked, historical and other-unit assignments',async()=>{
 const f=fixture();Object.assign(f.c.db.assign,{'2026-10|acil|1|day':1,'2026-10|acil|10|night':2,'2026-10|acil|3|day':4,'2026-10|acil|2|other':3,'2026-09|acil|30|night':5});f.c.db.assignmentMeta['2026-10|acil|1|day']={manual:true};f.c.db.rpysCellLocks['2026-10|acil|10|night']={exists:true,value:2};f.c.db.leaves=Array.from({length:29},(_,i)=>({id:1,day:i+2}));const original=JSON.stringify([f.c.db.assignmentMeta,f.c.db.rpysCellLocks,f.c.db.staff]),assign={...f.c.db.assign},targets=JSON.stringify(f.c.rpysTargets399.config(unit).people);const result=await f.c.rpysTargets399.run();assert.equal(result.ok,true,f.alerts.join('\n'));assert.equal(result.partial,true);assert.ok(result.plan.length>20);for(const [key,id] of Object.entries(assign))assert.equal(f.c.db.assign[key],id);assert.equal(JSON.stringify([f.c.db.assignmentMeta,f.c.db.rpysCellLocks,f.c.db.staff]),original);assert.equal(JSON.stringify(f.c.rpysTargets399.config(unit).people),targets);assert.equal(f.saved.length,1);assert.equal(f.c.rpysRest16V397.allViolations().size,0);
});

test('partial validation removes only unsafe new duties when an authoritative dynamic rule rejects a full draft',async()=>{
 const f=fixture(),base=f.c.canTakeShiftV2414;f.c.canTakeShiftV2414=(id,d,col,u)=>base(id,d,col,u)&&(id!==1||f.c.assignmentsMonth().filter(a=>a.person.id===1&&a.col.unit===unit).length<3);
 const r=await f.c.rpysTargets399.run();assert.equal(r.ok,true,f.alerts.join('\n'));assert.equal(r.partial,true);assert.equal(f.c.assignmentsMonth().filter(a=>a.person.id===1).length,3);assert.equal(r.plan.length,42);assert.equal(f.saved.length,1);assert.ok(r.notes.some(x=>/uygunluk kuralı/.test(x)));assert.equal(f.c.rpysRest16V397.allViolations().size,0);
});
test('partial fallback preserves spouse-day guard and still applies unaffected peoples duties',async()=>{
 const f=fixture();f.c.db.staff.push({id:7,name:'Unselected spouse',status:'Aktif'});f.c.spouseOf=id=>Number(id)===1?7:Number(id)===7?1:null;
 const r=await f.c.rpysTargets399.run();assert.equal(r.ok,true,f.alerts.join('\n'));assert.equal(r.partial,true);assert.equal(r.plan.length,39);assert.equal(f.saved.length,1);assert.equal(f.c.assignmentsMonth().filter(a=>a.person.id===1).length,0);assert.equal(f.c.rpysScheduler398.spouseDayViolations(f.c.ym()).length,0);assert.match(f.controls.distResult.textContent,/eşlerin aynı gün/);
});
test('when no new duty can be placed, partial mode keeps the complete database and does not save',async()=>{
 const f=fixture();for(const id of [1,2,3,4,5,6])for(let day=1;day<=30;day++)f.c.db.leaves.push({id,day});const before=JSON.stringify(f.c.db);const r=await f.c.rpysTargets399.run();assert.equal(r.ok,false);assert.equal(r.partial,true);assert.equal(r.plan.length,0);assert.equal(f.saved.length,0);assert.equal(JSON.stringify(f.c.db),before);assert.match(f.controls.distResult.textContent,/Yerleştirilebilen yeni görev yok/);
});

test('partial search retains monthly special upper limits and exact per-kind target ceilings',async()=>{
 const f=fixture();f.c.db.customTextRules=[{active:true,kind:'personUnitMonthlyMax',personId:1,unit,max:2}];const r=await f.c.rpysTargets399.run();assert.equal(r.ok,true,f.alerts.join('\n'));assert.equal(r.partial,true);assert.equal(f.c.assignmentsMonth().filter(x=>x.person.id===1).length,2);assert.equal(r.plan.length,41);assert.equal(f.saved.length,1);for(const id of [1,2,3,4,5,6])for(const kind of ['day','night'])assert.ok(f.c.rpysTargets399.model(unit).actual[id][kind]<=f.c.rpysTargets399.config(unit).people[id][kind]);
});
test('cancel and live edits during partial fallback never save a draft or overwrite the edit',async()=>{
 for(const action of ['cancel','edit']){
  const f=fixture();f.c.db.leaves=Array.from({length:30},(_,i)=>({id:1,day:i+1}));let signal;const started=new Promise(r=>{signal=r}),Native=f.c.Worker;f.c.Worker=class extends Native{postMessage(data){assert.equal(data.allowPartial,true);signal();super.postMessage(data)}};
  const pending=f.c.rpysTargets399.run();await started;if(action==='cancel')f.c.rpysTargets399.cancel();else f.c.db.assign['2026-10|acil|1|other']=3;const before=JSON.stringify(f.c.db);assert.equal(await pending,false);assert.equal(JSON.stringify(f.c.db),before);assert.equal(f.saved.length,0);
 }
});

test('weekend targets are exact subsets of the original 30 night duties, not additional duties',async()=>{
 const f=fixture(),weekends=[2,2,1,1,1,1];for(const id of [1,2,3,4,5,6])f.c.rpysTargets399.config(unit).people[id].weekendNight=weekends[id-1];
 const r=await f.c.rpysTargets399.run();assert.equal(r.ok,true,f.alerts.join('\n'));assert.equal(r.partial,false);assert.equal(r.plan.length,51);assert.equal(f.saved.length,1);const m=f.c.rpysTargets399.model(unit);assert.equal(m.required.weekendNight,8);for(const id of m.ids){assert.equal(m.actual[id].weekendNight,weekends[id-1]);assert.equal(m.actual[id].night,f.c.rpysTargets399.config(unit).people[id].night)}assert.equal(f.c.rpysRest16V397.allViolations().size,0);
});
test('protected Saturday/Sunday nights count once; Friday nights and weekend daytime duties do not',()=>{
 const f=fixture();Object.assign(f.c.db.assign,{'2026-10|acil|2|night':1,'2026-10|acil|3|night':2,'2026-10|acil|4|day':3,'2026-10|acil|4|night':4});f.c.db.assignmentMeta['2026-10|acil|3|night']={manual:true};f.c.db.rpysCellLocks['2026-10|acil|4|night']={exists:true,value:4};const m=f.c.rpysTargets399.model(unit);assert.equal(m.actual[1].weekendNight,0);assert.equal(m.actual[2].weekendNight,1);assert.equal(m.fixed[2].weekendNight,1);assert.equal(m.actual[3].weekendNight,0);assert.equal(m.fixed[4].weekendNight,1);assert.equal(m.required.weekendNight,8);
});
test('weekend target above total night target is rejected without changing the list',async()=>{
 const f=fixture();f.c.rpysTargets399.config(unit).people[6].weekendNight=3;const before=JSON.stringify(f.c.db);assert.equal(await f.c.rpysTargets399.run(),false);assert.equal(f.saved.length,0);assert.equal(JSON.stringify(f.c.db),before);assert.match(f.controls.distResult.textContent,/hafta sonu nöbet hedefi 0 ile toplam nöbet hedefi \(2\)/);
});
test('fair leave proposal includes weekend quotas, preserves their total and leaves saved manual targets unchanged',()=>{
 const f=fixture();for(const day of [3,4,10,11,17,18,24,25])f.c.db.leaves.push({id:1,day});const before=JSON.stringify(f.c.rpysTargets399.config(unit)),m=f.c.rpysTargets399.model(unit),fair=f.c.rpysTargets399.fairTargets(m);assert.equal(fair.targets[1].weekendNight,0);assert.equal(Object.values(fair.targets).reduce((n,x)=>n+x.weekendNight,0),8);assert.equal(Object.values(fair.targets).reduce((n,x)=>n+x.night,0),30);for(const p of Object.values(fair.targets))assert.ok(p.weekendNight<=p.night);assert.equal(JSON.stringify(f.c.rpysTargets399.config(unit)),before);
});
test('unavailable weekend quota is reported separately while feasible duties are applied below all quotas',async()=>{
 const f=fixture();for(const id of [1,2,3,4,5,6])f.c.rpysTargets399.config(unit).people[id].weekendNight=[2,2,1,1,1,1][id-1];for(const day of [3,4,10,11,17,18,24,25])f.c.db.leaves.push({id:1,day});const targets=JSON.stringify(f.c.rpysTargets399.config(unit).people);const r=await f.c.rpysTargets399.run();assert.equal(r.ok,true,f.alerts.join('\n'));assert.equal(r.partial,true);assert.ok(r.plan.length>30);const missing=r.shortfalls.find(x=>x.id===1&&x.kind==='weekendNight');assert.equal(missing.missing,2);assert.match(f.controls.distResult.textContent,/Berk Yaşar: 0 \/ 2 hafta sonu nöbeti/);assert.equal(JSON.stringify(f.c.rpysTargets399.config(unit).people),targets);const m=f.c.rpysTargets399.model(unit);for(const id of m.ids){const t=f.c.rpysTargets399.config(unit).people[id];assert.ok(m.actual[id].weekendNight<=t.weekendNight);assert.ok(m.actual[id].night<=t.night);assert.ok(m.actual[id].night-m.actual[id].weekendNight<=t.night-t.weekendNight)}assert.equal(f.c.rpysRest16V397.allViolations().size,0);assert.equal(f.saved.length,1);
});
test('an unset weekend field remains optional for existing saved targets',async()=>{
 const f=fixture(),cfg=f.c.rpysTargets399.config(unit);assert.equal(cfg.people[1].weekendNight,undefined);const r=await f.c.rpysTargets399.run();assert.equal(r.ok,true);assert.equal(r.partial,false);assert.equal(cfg.people[1].weekendNight,undefined);assert.equal(r.plan.length,51);
});

test('weekend allocation preserves a locked weekend night, manual day and other-unit duties with leave',async()=>{
 const f=fixture();for(const id of [1,2,3,4,5,6])f.c.rpysTargets399.config(unit).people[id].weekendNight=[2,2,1,1,1,1][id-1];Object.assign(f.c.db.assign,{'2026-10|acil|3|night':1,'2026-10|acil|5|day':3,'2026-10|acil|4|other':4});f.c.db.rpysCellLocks['2026-10|acil|3|night']={exists:true,value:1};f.c.db.assignmentMeta['2026-10|acil|5|day']={manual:true};f.c.db.leaves=[{id:2,day:10},{id:2,day:11}];const protectedBefore=JSON.stringify([f.c.db.rpysCellLocks,f.c.db.assignmentMeta]),r=await f.c.rpysTargets399.run();assert.equal(r.ok,true,f.alerts.join('\n'));assert.equal(r.partial,false);assert.equal(f.c.db.assign['2026-10|acil|3|night'],1);assert.equal(f.c.db.assign['2026-10|acil|5|day'],3);assert.equal(f.c.db.assign['2026-10|acil|4|other'],4);assert.equal(JSON.stringify([f.c.db.rpysCellLocks,f.c.db.assignmentMeta]),protectedBefore);const m=f.c.rpysTargets399.model(unit);for(const id of m.ids)assert.equal(m.actual[id].weekendNight,[2,2,1,1,1,1][id-1]);assert.equal(f.saved.length,1);assert.equal(f.c.rpysRest16V397.allViolations().size,0);
});
