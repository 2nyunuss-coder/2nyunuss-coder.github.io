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
test('authoritative pair rule is compiled before search; alternative satisfies it before one commit',async()=>{
 const f=fixture(),data=await f.c.rpysTargets399.planningData(unit),first=require('../rpys-target-worker.js').solveTargets(data.input),mine=first.plan.filter(x=>x.id===1).slice(0,2).map(x=>data.m.slots[x.slot].day);
 const base=f.c.canTakeShiftV2414;let rejected=0;
 f.c.canTakeShiftV2414=(id,d,col,u)=>{if(id===1&&mine.includes(d)&&f.c.assignmentsMonth().some(a=>a.person.id===1&&mine.includes(a.day)&&a.day!==d)){rejected++;return false}return base(id,d,col,u)};
 const result=await f.c.autoDistribute();assert.equal(result.ok,true,f.alerts.join('\n'));assert.ok(rejected>0);assert.equal(f.saved.length,1);const rows=f.c.assignmentsMonth().filter(a=>a.person.id===1&&mine.includes(a.day));assert.ok(rows.length<2);
});

function enableGapRule(f){
 f.c.unitRulesV251=()=>({maxGapEnabled:true});f.c.unitMaxGapDaysV251=()=>5;f.c.nonLeaveSegmentsV2414=()=>[[1,30]];f.c.spouseOf=()=>null;
 f.c.v251GapViolations=ids=>ids.flatMap(id=>{const days=f.c.assignmentsMonth().filter(a=>a.person.id===id&&a.col.unit===unit).map(a=>a.day).sort((a,b)=>a-b);return days.slice(1).flatMap((d,i)=>d-days[i]-1>5?[{id,left:days[i],right:d}]:[])});
}
test('active runtime gap rule allows low targets without synthetic month-boundary duties',async()=>{
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
