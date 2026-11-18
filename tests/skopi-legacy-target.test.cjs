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
