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
  const slots=Array.from({length:6},(_,index)=>{const kind=index%2?'night':'day';remaining[1+random(3)][kind]++;return {index,kind,allowed:ids.filter(()=>random(4)!==0)}}),conflicts=[];
  for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)for(const id of ids)if(random(5)===0)conflicts.push([`${i}:${id}`,`${j}:${id}`]);
  const requirements=trial%3===0?[{values:['0:1','2:1','4:1']}]:[],limits=trial%4===0?[{values:['1:2','3:2','5:2'],max:1}]:[];
  const data={ids,remaining,slots,conflicts,requirements,limits};
  function brute(i,picked,left){if(i===6)return ids.every(id=>left[id].day===0&&left[id].night===0)&&requirements.every(r=>r.values.some(v=>picked.has(v)))&&limits.every(r=>r.values.filter(v=>picked.has(v)).length<=r.max);
   for(const id of slots[i].allowed){const kind=slots[i].kind,v=`${i}:${id}`;if(!left[id][kind]||conflicts.some(([a,b])=>(a===v&&picked.has(b))||(b===v&&picked.has(a))))continue;left[id][kind]--;picked.add(v);if(brute(i+1,picked,left))return true;picked.delete(v);left[id][kind]++}return false}
  const expected=brute(0,new Set(),structuredClone(remaining)),result=solveTargets(data);assert.equal(result.timedOut,false);assert.equal(result.ok,expected,'trial '+trial);
 }
});

test('browser Worker entry accepts a structured message and posts the result',()=>{
 const vm=require('node:vm'),fs=require('node:fs');let result;const self={postMessage:value=>{result=value}};vm.runInNewContext(fs.readFileSync(require.resolve('../rpys-target-worker.js'),'utf8'),{self});const data=example();self.onmessage({data});validate(data,result);
});
