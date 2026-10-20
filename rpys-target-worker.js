/* Pure CSP solver. No database, DOM, credentials or persistence in this worker. */
(function(scope){
'use strict';
function solveTargets(input){
 const {slots,ids,remaining,conflicts=[],requirements=[],forbidden=[],limits=[],excluded=[]}=input;
 const start=Date.now(),limit=input.timeLimit??3200,maxNodes=input.maxNodes??7000;
 const options=slots.map(s=>s.allowed.map(id=>`${s.index}:${id}`)),values=new Map();
 slots.forEach(s=>s.allowed.forEach(id=>values.set(`${s.index}:${id}`,{slot:s.index,id,kind:s.kind})));
 const clashes=new Map([...values.keys()].map(k=>[k,new Set()]));
 for(const [a,b] of conflicts){clashes.get(a)?.add(b);clashes.get(b)?.add(a)}
 let nodes=0,timedOut=false,lastFailure='',bottleneck=null,best=[];const memo=new Set();
 // A capacitated bipartite matching checks all subsets (Hall), not just each person's capacity.
 function matching(domains,left,kind){
  const cells=slots.filter(s=>s.kind===kind&&domains[s.index]!==null),owners=new Map();
  function augment(i,seen){for(const v of domains[i]){const id=values.get(v).id;if(seen.has(id))continue;seen.add(id);
   const mine=owners.get(id)||[];if(mine.length<left[id][kind]){mine.push(i);owners.set(id,mine);return true}
   for(let n=0;n<mine.length;n++)if(augment(mine[n],seen)){mine[n]=i;return true}
  }return false}
  for(const s of cells){const seen=new Set();if(!augment(s.index,seen)){
   const subset=[...seen],available=subset.reduce((n,id)=>n+left[id][kind],0);
   const demanded=cells.filter(c=>domains[c.index].every(v=>seen.has(values.get(v).id))).length;
   bottleneck={ids:subset,kind,available,demanded};return false;
  }}return true;
 }
 function visit(domains,left,chosen){
  if(++nodes>maxNodes||Date.now()-start>limit){timedOut=true;return null}
  if(chosen.length>best.length)best=chosen.slice();
  domains=domains.map(d=>d===null?null:d.filter(v=>left[values.get(v).id][values.get(v).kind]>0));
  for(const d of domains)if(d!==null&&!d.length)return null;
  for(const id of ids)for(const kind of ['day','night']){
   const candidates=slots.filter(s=>s.kind===kind&&domains[s.index]?.includes(`${s.index}:${id}`));
   if(candidates.length<left[id][kind]){lastFailure=`${input.names?.[id]||('#'+id)}: kalan ${left[id][kind]} ${kind==='day'?'gündüz':'nöbet'} için en fazla ${candidates.length} uygun hücre var.`;return null}
   if(left[id][kind]>0&&candidates.length===left[id][kind])for(const s of candidates)domains[s.index]=[`${s.index}:${id}`];
  }
  const picked=new Set(chosen);
  for(const r of requirements)if(!r.values.some(v=>picked.has(v))&&!r.values.some(v=>domains[values.get(v)?.slot]?.includes(v)))return null;
  for(const group of forbidden)if(group.every(v=>picked.has(v)))return null;
  for(const group of limits){
   const used=group.values.filter(v=>picked.has(v)).length;
   if(used>group.max)return null;
   if(used===group.max){const banned=new Set(group.values);domains=domains.map(d=>d===null?null:d.filter(v=>!banned.has(v)));}
  }
  for(const r of requirements)if(!r.values.some(v=>picked.has(v))){const possible=r.values.filter(v=>domains[values.get(v)?.slot]?.includes(v));if(!possible.length)return null;if(possible.length===1)domains[values.get(possible[0]).slot]=[possible[0]]}
  for(const d of domains)if(d!==null&&!d.length)return null;
  if(chosen.length===slots.length){if(excluded.some(p=>p.every(v=>picked.has(v))))return null;return chosen}
  const signature=domains.map(d=>d===null?'#':d.join(',')).join(';')+'|'+ids.map(id=>left[id].day+','+left[id].night).join(';')+'|'+chosen.slice().sort().join(',');
  if(memo.has(signature))return null;
  if(!matching(domains,left,'day')||!matching(domains,left,'night')){lastFailure='Ortak uygun gün kapasitesi hedefleri karşılamıyor (izin/dinlenme/diğer görevler).';return null}
  let i=-1;for(const s of slots)if(domains[s.index]!==null&&(i<0||domains[s.index].length<domains[i].length||(domains[s.index].length===domains[i].length&&s.kind==='night')))i=s.index;
  const candidates=domains[i].slice().sort((a,b)=>{const x=values.get(a),y=values.get(b);const capacity=id=>domains.filter(d=>d?.some(v=>values.get(v).id===id&&values.get(v).kind===x.kind)).length;return left[y.id][y.kind]/capacity(y.id)-left[x.id][x.kind]/capacity(x.id)||x.id-y.id});
  for(const v of candidates){const x=values.get(v),next=domains.map(d=>d===null?null:d.filter(w=>!clashes.get(v).has(w)));next[i]=null;
   const rest=Object.fromEntries(ids.map(id=>[id,{...left[id]}]));rest[x.id][x.kind]--;
   const result=visit(next,rest,[...chosen,v]);if(result)return result;if(timedOut)break;
  }
  if(memo.size<20000)memo.add(signature);return null;
 }
 const plan=visit(options,remaining,[]);
 return {ok:!!plan,plan:(plan||[]).map(v=>values.get(v)),nodes,timedOut,lastFailure,bottleneck,best:best.map(v=>values.get(v)),elapsed:Date.now()-start};
}
if(typeof module!=='undefined')module.exports={solveTargets};
else scope.onmessage=e=>{try{scope.postMessage(solveTargets(e.data))}catch(error){scope.postMessage({ok:false,error:String(error.message||error)})}};
})(typeof self==='undefined'?globalThis:self);
