const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../rpys-targets-v399.js'),'utf8');
const solve=vm.runInNewContext('('+source.slice(source.indexOf('  function solve('),source.indexOf('  function requirementsFor(')).trim()+')',{Date,kinds:['day','night'],empty:()=>({day:0,night:0})});
function calendar(seed){
 let state=seed;const rand=()=>((state=Math.imul(state,1664525)+1013904223)>>>0)/4294967296;
 const ids=[1,2,3,4,5,6],slots=[],chosen=new Map();
 const blocked=Object.fromEntries(ids.map(id=>[id,new Set(Array.from({length:31},(_,i)=>i+1).filter(()=>rand()<.13))]));
 for(let day=1;day<=31;day++){
  const allowed=ids.filter(id=>!blocked[id].has(day));
  if(![0,6].includes(new Date(Date.UTC(2026,11,day)).getUTCDay()))slots.push({key:'D'+day,day,kind:'day',allowed});
  slots.push({key:'N'+day,day,kind:'night',allowed});
 }
 const canPlace=(id,s)=>![...chosen].some(([t,pid])=>id===pid&&(s.day===t.day||t.kind==='night'&&s.day===t.day+1||s.kind==='night'&&t.day===s.day+1));
 const requirements=ids.flatMap(id=>Array.from({length:26},(_,i)=>({id,days:new Set(Array.from({length:6},(_,n)=>i+n+1))})));
 const remaining=Object.fromEntries(ids.map((id,i)=>[id,{day:i===5?3:4,night:i===0?6:5}]));
 const r=solve({slots,ids,remaining,requirements,calendarSearch:true,canPlace,place:(id,s)=>chosen.set(s,id),remove:(id,s)=>chosen.delete(s),timeLimit:3000,maxNodes:2000});
 assert.equal(r.ok,true);
 assert.equal(r.plan.length,54);
 for(const id of ids){
  const assignments=[...chosen].filter(([,pid])=>pid===id).map(([slot])=>slot);
  assert.equal(assignments.filter(slot=>slot.kind==='day').length,id===6?3:4);
  assert.equal(assignments.filter(slot=>slot.kind==='night').length,id===1?6:5);
  assert(assignments.every(slot=>!blocked[id].has(slot.day)));
  for(const slot of assignments)if(slot.kind==='night')assert(!assignments.some(other=>other.day===slot.day+1));
 }
 for(const requirement of requirements)assert([...chosen].some(([slot,id])=>id===requirement.id&&requirement.days.has(slot.day)));
 return r;
}
test('Skopi 23 day and 31 night targets complete under leave, rest and spacing constraints',()=>{
 const result=calendar(3);
 assert(result.nodes<2000,'regression: bounded search must complete before the old dead end');
});
function boundaryRequirements(assign,leaves=[]){
 const unit='PORTABL + SKOPİ';
 const scope={
  db:{assign,leaves},Date,Set,Map,Number,String,Math,
  ym:()=> '2026-12',daysInMonth:()=>31,dateStr:day=>'2026-12-'+String(day).padStart(2,'0'),
  unitRulesV251:()=>({maxGapEnabled:true}),unitMaxGapDaysV251:()=>5,
  assignmentsMonth:()=>Object.entries(assign).filter(([key])=>key.startsWith('2026-12|')).map(([key,id])=>({person:{id},day:Number(key.split('|')[2]),col:{unit}})),
  dutyColumnByKey:()=>({unit}),getPersonById:id=>({id,name:String(id)}),personStatusAt:()=> 'Aktif',
  nonLeaveSegmentsV2414:()=>[[1,31]]
 };
 const compile=vm.runInNewContext('('+source.slice(source.indexOf('  function requirementsFor('),source.indexOf('  function finalRules(')).trim()+')',scope);
 const model={u:unit,ids:[1]};
 const result=compile(model);result.warnings=model.boundaryWarnings;return result;
}
test('Skopi compiles previous and next month gap obligations before search',()=>{
 const requirements=boundaryRequirements({'2026-11|acil|30|sk2':1,'2027-01|acil|2|sk2':1});
 const before=requirements.find(rule=>rule.reason.startsWith('Önceki'));
 const after=requirements.find(rule=>rule.reason.startsWith('Sonraki'));
 assert.deepEqual([...before.days],[1,2,3,4,5,6]);
 assert.deepEqual([...after.days],[27,28,29,30,31]);
});
test('a fixed first-month duty satisfies the previous-month boundary',()=>{
 const requirements=boundaryRequirements({'2026-11|acil|30|sk2':1,'2026-12|acil|2|sk2':1});
 assert(!requirements.some(rule=>rule.reason.startsWith('Önceki')));
});
test('leave resets cross-month blank runs and pre-existing historical gaps become warnings',()=>{
 const impossible=boundaryRequirements({'2026-11|acil|20|sk2':1});
 assert(!impossible.some(rule=>rule.reason.startsWith('Önceki')));
 assert.equal(impossible.warnings.length,1);
 assert.equal(impossible.warnings[0].date,'2026-11-20');
 const reset=boundaryRequirements({'2026-11|acil|25|sk2':1},[{personId:1,start:'2026-11-26',end:'2026-12-04'}]);
 assert(reset.find(rule=>rule.reason.startsWith('Önceki')).days.has(10));
 assert(!reset.find(rule=>rule.reason.startsWith('Önceki')).days.has(11));
});
test('quota matching rejects jointly impossible targets without mutating assignments or quotas',()=>{
 const remaining={1:{day:2,night:0},2:{day:1,night:0}};
 const selected=new Map();
 const result=solve({
  slots:[{key:'a',day:1,kind:'day',allowed:[1]},{key:'b',day:2,kind:'day',allowed:[2]},{key:'c',day:3,kind:'day',allowed:[2]}],
  ids:[1,2],remaining,calendarSearch:true,canPlace:()=>true,
  place:(id,slot)=>selected.set(slot,id),remove:(id,slot)=>selected.delete(slot)
 });
 assert.equal(result.ok,false);
 assert.equal(result.timedOut,false);
 assert.equal(selected.size,0);
 assert.equal(remaining[1].day,2);
 assert.equal(remaining[2].day,1);
});

test('historical exemption ignores only its existing external boundary, not current-month gaps',()=>{
 let violations=[];
 const scope={ym:()=> '2026-12',assignmentsMonth:()=>[],unitRulesV251:()=>({maxGapEnabled:true}),v251GapViolations:()=>violations,getPersonById:id=>({name:'Person '+id})};
 const check=vm.runInNewContext('('+source.slice(source.indexOf('  function finalRules('),source.indexOf('  function searchAdapter(')).trim()+')',scope);
 const model={u:'PORTABL + SKOPİ',ids:[1],boundaryWarnings:[{id:1,side:'before',date:'2026-11-20'}]};
 violations=[{id:1,leftDate:'2026-11-20',rightDate:'2026-12-01',blank:10}];
 assert.equal(check(model),true);
 violations.push({id:1,left:3,right:12,blank:8});
 assert.notEqual(check(model),true);
 violations=[{id:2,leftDate:'2026-11-20',rightDate:'2026-12-01',blank:10}];
 assert.notEqual(check(model),true);
});
