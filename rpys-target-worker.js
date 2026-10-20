/* Pure CSP solver. No database, DOM, credentials or persistence in this worker. */
(function(scope){
'use strict';
function solveTargets(input){
 const {slots,ids,remaining,conflicts=[],requirements:required=[],forbidden=[],limits=[],gapRules=[],excluded=[]}=input;
 const start=Date.now(),limit=input.timeLimit??3200,maxNodes=input.maxNodes??7000;
 const requirements=required.slice();
 for(const rule of gapRules){
  const edge=rule.crossMonth;if(!edge)continue;
  const fixed=edge.fixedDays||rule.fixedDays;if(!(fixed.length+remaining[rule.id].day+remaining[rule.id].night))continue;
  const blank=(a,b)=>Math.max(0,...edge.runs.map(([lo,hi])=>Math.max(0,Math.min(hi,b-1)-Math.max(lo,a+1)+1)));
  for(const side of ['before','after']){
   if(edge[side]===null)continue;
   const valid=d=>side==='before'?blank(edge.before,d)<=rule.maxBlank:blank(d,edge.after)<=rule.maxBlank;
   if(fixed.some(valid))continue;
   const date=new Date(Date.parse(edge.month+'-01T00:00:00Z')+(edge[side]-1)*86400000).toISOString().slice(0,10);
   requirements.push({values:slots.filter(s=>s.allowed.includes(rule.id)&&valid(s.day)).map(s=>`${s.index}:${rule.id}`),reason:`${input.names?.[rule.id]||('#'+rule.id)}: ${date} tarihindeki ${side==='before'?'önceki':'sonraki'} ay göreviyle ${rule.maxBlank} boş gün sınırını sağlayan uygun görev gerekiyor. İzin, dinlenme ve hedef sayıları birlikte kontrol edilmeli.`});
  }
 }

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
  for(const r of requirements)if(!r.values.some(v=>picked.has(v))&&!r.values.some(v=>domains[values.get(v)?.slot]?.includes(v))){lastFailure=r.reason||'Zorunlu görev günü için uygun personel kalmadı.';return null;}
  for(const group of forbidden)if(group.every(v=>picked.has(v)))return null;
  for(const group of limits){
   const used=group.values.filter(v=>picked.has(v)).length;
   if(used>group.max)return null;
   if(used===group.max){const banned=new Set(group.values);domains=domains.map(d=>d===null?null:d.filter(v=>!banned.has(v)));}
  }
  for(const r of requirements)if(!r.values.some(v=>picked.has(v))){const possible=r.values.filter(v=>domains[values.get(v)?.slot]?.includes(v));if(!possible.length)return null;if(possible.length===1)domains[values.get(possible[0]).slot]=[possible[0]]}
  // Real duties, including the nearest assignments on either side of the
  // month. Cross-month blank runs reset on leave, exactly as rules10 does.
  for(const rule of gapRules){
   const worked=new Set(rule.fixedDays);for(const v of chosen){const x=values.get(v);if(x.id===rule.id)worked.add(slots[x.slot].day)}
   const edge=rule.crossMonth,fixed=edge?.fixedDays||rule.fixedDays,total=fixed.length+remaining[rule.id].day+remaining[rule.id].night;
   if(edge&&edge.before!==null&&edge.after!==null&&total>0&&edge.runs.some(([a,b])=>a<=edge.before+1&&b>=edge.after-1)){
    const needed=Math.floor((edge.after-edge.before-1)/(rule.maxBlank+1));
    if(total<needed){lastFailure=`${input.names?.[rule.id]||('#'+rule.id)}: önceki ve sonraki ayın görevleri arasında ${rule.maxBlank} boş gün kuralı en az ${needed} görev gerektiriyor; seçili ay hedefi ${remaining[rule.id].day+remaining[rule.id].night} ek görev + ${fixed.length} korunan görev. Öneri: toplam hedef en az ${needed} olmalı ve diğer kişilerin hedefleri dengelenmeli. Hedefler değiştirilmedi.`;return null}
   }
   const intervals=[];
   for(const [from,to] of rule.segments){const days=[...worked].filter(d=>d>=from&&d<=to).sort((a,b)=>a-b);
    if(rule.includeEdges){days.unshift(from-1);days.push(to+1)}
    for(let n=1;n<days.length;n++)intervals.push({a:days[n-1],b:days[n],lo:days[n-1]+1,hi:days[n]-1});
   }
   let minimum=0;
   for(const {a,b,lo,hi} of intervals){
    const length=hi-lo+1;if(length<=rule.maxBlank)continue;
    minimum+=Math.floor(length/(rule.maxBlank+1));
    for(const [from,to] of [[lo,lo+rule.maxBlank],[hi-rule.maxBlank,hi]]){
     const possible=slots.filter(s=>s.day>=from&&s.day<=to&&domains[s.index]!==null).flatMap(s=>domains[s.index].filter(v=>values.get(v).id===rule.id));
     if(!possible.length){
      const date=d=>d+'. gün';
      lastFailure=`${input.names?.[rule.id]||('#'+rule.id)}: ${date(a)} – ${date(b)} arasında ${rule.maxBlank} boş gün sınırı için ${date(from)} – ${date(to)} aralığında uygun ek görev yok.`;return null;
     }
     if(possible.length===1)domains[values.get(possible[0]).slot]=possible;
    }
   }
   if(minimum>left[rule.id].day+left[rule.id].night){lastFailure=`${input.names?.[rule.id]||('#'+rule.id)}: görev aralığı için en az ${minimum} ek görev gerekiyor; kalan hedef ${left[rule.id].day} gündüz + ${left[rule.id].night} nöbet.`;return null}
  }
  for(const d of domains)if(d!==null&&!d.length)return null;
  if(chosen.length===slots.length){if(excluded.some(p=>p.every(v=>picked.has(v))))return null;return chosen}
  const signature=domains.map(d=>d===null?'#':d.join(',')).join(';')+'|'+ids.map(id=>left[id].day+','+left[id].night).join(';')+'|'+chosen.slice().sort().join(',');
  if(memo.has(signature))return null;
  if(!matching(domains,left,'day')||!matching(domains,left,'night')){lastFailure='Ortak uygun gün kapasitesi hedefleri karşılamıyor (izin/dinlenme/diğer görevler).';return null}
  let i=-1;for(const s of slots)if(domains[s.index]!==null&&(i<0||domains[s.index].length<domains[i].length||(domains[s.index].length===domains[i].length&&s.day<slots[i].day)))i=s.index;
  // MRV chooses the hardest cell, with calendar order as the tie-breaker.
  // Prefer the person who removes the fewest choices from other cells,
  // weighted by their scarcity. Quota pressure breaks equal-cost ties.
  // Filling every night backwards before any day created large dead ends.
  const costs=new Map(domains[i].map(v=>[v,domains.reduce((n,d)=>n+(d?d.filter(w=>clashes.get(v).has(w)).length/d.length:0),0)]));
  const candidates=domains[i].slice().sort((a,b)=>{const x=values.get(a),y=values.get(b);const capacity=id=>domains.filter(d=>d?.some(v=>values.get(v).id===id&&values.get(v).kind===x.kind)).length;return costs.get(a)-costs.get(b)||left[y.id][y.kind]/capacity(y.id)-left[x.id][x.kind]/capacity(x.id)||x.id-y.id});
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
