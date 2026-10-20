const {test}=require('node:test'),assert=require('node:assert/strict');
const {solveTargets}=require('../rpys-target-worker.js');
function example(){
 const ids=[1,2,3,4,5,6],remaining=Object.fromEntries(ids.map((id,i)=>[id,{day:[5,4,4,4,3,1][i],night:[7,6,5,6,4,2][i]}]));
 const slots=[];for(let d=1;d<=30;d++){if(d<=21)slots.push({index:slots.length,kind:'day',day:d,allowed:ids.slice()});slots.push({index:slots.length,kind:'night',day:d,allowed:ids.slice()})}
 const conflicts=[];for(let i=0;i<slots.length;i++)for(let j=i+1;j<slots.length;j++)if(slots[i].day===slots[j].day||(slots[i].kind==='night'&&slots[j].day===slots[i].day+1)||(slots[j].kind==='night'&&slots[i].day===slots[j].day+1))for(const id of ids)conflicts.push([`${i}:${id}`,`${j}:${id}`]);
 return {ids,remaining,slots,conflicts};
}
function validate(data,result){assert.equal(result.ok,true,JSON.stringify(result));assert.equal(result.plan.length,data.slots.length);const picked=new Set(result.plan.map(x=>`${x.slot}:${x.id}`));
 for(const [a,b] of data.conflicts)assert.ok(!(picked.has(a)&&picked.has(b)),a+' conflicts '+b);
 for(const id of data.ids)for(const kind of ['day','night'])assert.equal(result.plan.filter(x=>x.id===id&&x.kind===kind).length,data.remaining[id][kind]);
 for(const x of result.plan)assert.ok(data.slots[x.slot].allowed.includes(x.id));
}
test('PORTABL + SKOPİ: exact 21 day and 30 night, six manually entered targets',()=>{const data=example(),before=JSON.stringify(data),r=solveTargets(data);validate(data,r);assert.equal(JSON.stringify(data),before);console.log('51-duty fixture:',r.nodes,'nodes,',r.elapsed,'ms')});
test('leave and other-unit duties exclude dates; fixed manual duty remains assigned',()=>{const data=example();for(const s of data.slots)if([3,4,5].includes(s.day))s.allowed=s.allowed.filter(id=>id!==1);for(const s of data.slots)if(s.day===9)s.allowed=s.allowed.filter(id=>id!==2);
 // A preserved day duty counts towards Berk's five. Represent it as a fixed singleton
 // in this pure solver fixture; integration tests cover excluding fixed cells.
 data.slots.find(s=>s.day===1&&s.kind==='day').allowed=[1];validate(data,solveTargets(data));});
test('shared capacity failure detected without combinatorial search',()=>{const data={ids:[1,2,3],remaining:{1:{day:2,night:0},2:{day:2,night:0},3:{day:1,night:0}},slots:Array.from({length:5},(_,index)=>({index,kind:'day',allowed:index<3?[1,2]:[3]}))};const r=solveTargets(data);assert.equal(r.ok,false);assert.equal(r.timedOut,false);assert.equal(r.nodes,1);assert.match(r.lastFailure,/kapasitesi/)});
test('zero targets, impossible personal capacity, required days and no-good alternatives',()=>{const data={ids:[1,2],remaining:{1:{day:1,night:0},2:{day:1,night:0}},slots:[{index:0,kind:'day',allowed:[1,2]},{index:1,kind:'day',allowed:[1,2]}],requirements:[{values:['0:1']}]};const r=solveTargets(data);validate({...data,conflicts:[]},r);assert.equal(r.plan.find(x=>x.slot===0).id,1);assert.equal(solveTargets({...data,excluded:[r.plan.map(x=>`${x.slot}:${x.id}`)]}).ok,false);data.remaining[1].day=3;assert.equal(solveTargets(data).ok,false)});
test('budget exhaustion is distinguished from proven infeasibility',()=>{const r=solveTargets({...example(),maxNodes:1});assert.equal(r.ok,false);assert.equal(r.timedOut,true)});
test('CSP feasibility agrees with exhaustive enumeration on 150 seeded small constrained cases',()=>{
 let seed=904;const random=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n};
 for(let trial=0;trial<150;trial++){
  const ids=[1,2,3],remaining=Object.fromEntries(ids.map(id=>[id,{day:0,night:0}]));
  const slots=Array.from({length:6},(_,index)=>{const kind=index%2?'night':'day';remaining[1+random(3)][kind]++;return {index,day:index+1,kind,allowed:ids.filter(()=>random(4)!==0)}}),conflicts=[];
  for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)for(const id of ids)if(random(5)===0)conflicts.push([`${i}:${id}`,`${j}:${id}`]);
  const requirements=trial%3===0?[{values:['0:1','2:1','4:1']}]:[],limits=trial%4===0?[{values:['1:2','3:2','5:2'],max:1}]:[];
  const gapRules=trial%5===0?[{id:1,maxBlank:1,segments:[[1,6]],fixedDays:[]}]:[];const data={ids,remaining,slots,conflicts,requirements,limits,gapRules};
  function brute(i,picked,left){if(i===6)return ids.every(id=>left[id].day===0&&left[id].night===0)&&requirements.every(r=>r.values.some(v=>picked.has(v)))&&limits.every(r=>r.values.filter(v=>picked.has(v)).length<=r.max)&&gapRules.every(r=>{const days=[...picked].filter(v=>Number(v.split(':')[1])===r.id).map(v=>slots[Number(v.split(':')[0])].day).sort((a,b)=>a-b);return days.slice(1).every((d,n)=>d-days[n]-1<=r.maxBlank)});
   for(const id of slots[i].allowed){const kind=slots[i].kind,v=`${i}:${id}`;if(!left[id][kind]||conflicts.some(([a,b])=>(a===v&&picked.has(b))||(b===v&&picked.has(a))))continue;left[id][kind]--;picked.add(v);if(brute(i+1,picked,left))return true;picked.delete(v);left[id][kind]++}return false}
  const expected=brute(0,new Set(),structuredClone(remaining)),result=solveTargets(data);assert.equal(result.timedOut,false);assert.equal(result.ok,expected,'trial '+trial);
 }
});

test('browser Worker entry accepts a structured message and posts the result',()=>{
 const vm=require('node:vm'),fs=require('node:fs');let result;const self={postMessage:value=>{result=value}};vm.runInNewContext(fs.readFileSync(require.resolve('../rpys-target-worker.js'),'utf8'),{self});const data=example();self.onmessage({data});validate(data,result);
});

test('between-duty mode: five blank days between real duties; no boundary minimum',()=>{
 const data={ids:[1],remaining:{1:{day:2,night:0}},slots:[{index:0,day:1,kind:'day',allowed:[1]},{index:1,day:7,kind:'day',allowed:[1]}],gapRules:[{id:1,maxBlank:5,segments:[[1,30]],fixedDays:[]}]};assert.equal(solveTargets(data).ok,true);data.slots[1].day=8;assert.equal(solveTargets(data).ok,false);data.slots[0].day=23;data.slots[1].day=29;assert.equal(solveTargets(data).ok,true);
});

test('cross-month gap propagation agrees with date-by-date enumeration across 200 leave calendars',()=>{
 let seed=19;const rnd=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n};
 for(let trial=0;trial<200;trial++){
  const leave=new Set();for(let d=-1;d<=15;d++)if(rnd(9)===0)leave.add(d);
  function runs(a,b){const out=[];let from=a;for(let d=a;d<=b;d++)if(leave.has(d)){if(from<d)out.push([from,d-1]);from=d+1}if(from<=b)out.push([from,b]);return out}
  const count=rnd(6),rule={id:1,maxBlank:1+rnd(4),fixedDays:[],includeEdges:trial%2===0,segments:runs(1,12),crossMonth:{before:trial%3===0?null:-2,after:trial%4===0?null:16,last:12,runs:runs(-1,15),month:'2026-10'}};
  const data={ids:[1,2],remaining:{1:{day:count,night:0},2:{day:6-count,night:0}},slots:[1,3,5,7,9,11].map((day,index)=>({index,day,kind:'day',allowed:leave.has(day)?[2]:[1,2]})),gapRules:[rule]};
  function valid(days){
   for(const [a,b] of rule.segments){const ds=days.filter(d=>d>=a&&d<=b);if(rule.includeEdges){ds.unshift(a-1);ds.push(b+1)}for(let n=1;n<ds.length;n++)if(ds[n]-ds[n-1]-1>rule.maxBlank)return false}
   if(days.length)for(const [a,b] of [[rule.crossMonth.before,days[0]],[days.at(-1),rule.crossMonth.after]]){
    if(a===null||b===null)continue;let run=0;for(let d=a+1;d<b;d++){run=leave.has(d)?0:run+1;if(run>rule.maxBlank)return false}
   }return true;
  }
  let possible=false;for(let mask=0;mask<64;mask++){const days=data.slots.filter((s,i)=>mask&(1<<i));if(days.length===count&&days.every(s=>s.allowed.includes(1))&&valid(days.map(s=>s.day)))possible=true}
  const result=solveTargets(data);assert.equal(result.timedOut,false);assert.equal(result.ok,possible,'cross-month trial '+trial);if(result.ok)assert.ok(valid(result.plan.filter(x=>x.id===1).map(x=>data.slots[x.slot].day).sort((a,b)=>a-b)));
 }
});

test('real November calendar with leave, cross-month duties and two protected cells solves without search growth',()=>{
 // Controlled six-person data compiled by the public application's real
 // eligibility rules: 21 day + 30 night, including 2 protected assignments.
 const data=require('./fixtures/target-51-cross-month.json');const result=solveTargets(data);validate(data,result);assert.equal(result.plan.length,49);assert.ok(result.nodes<1000,`excessive branching: ${result.nodes}`);console.log('51-duty constrained calendar:',result.nodes,'nodes,',result.elapsed,'ms');
});
