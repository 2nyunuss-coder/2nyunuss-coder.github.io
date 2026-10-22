/* Pure CSP solver. No database, DOM, credentials or persistence in this worker. */
(function(scope){
'use strict';
// Conditional same-day requirements: assigning one spouse requires one of the
// eligible cells for the other spouse. Leave/fixed-work exemptions are resolved
// by the calendar adapter before the worker receives this immutable input.
function propagateDependencies(dependencies,values,domains,picked){
 for(const r of dependencies){
  if(r.anyOf.some(v=>picked.has(v)))continue;
  const possible=r.anyOf.filter(v=>domains[values.get(v)?.slot]?.includes(v));
  if(picked.has(r.when)){
   if(!possible.length)return false;
   if(possible.length===1)domains[values.get(possible[0]).slot]=[possible[0]];
  }else if(!possible.length){const slot=values.get(r.when)?.slot;if(domains[slot])domains[slot]=domains[slot].filter(v=>v!==r.when)}
 }return true;
}
function dependencyComplete(dependencies,chosen){
 let kept=new Set(chosen),changed=true;
 while(changed){changed=false;for(const r of dependencies)if(kept.has(r.when)&&!r.anyOf.some(v=>kept.has(v))){kept.delete(r.when);changed=true}}
 return chosen.filter(v=>kept.has(v));
}
function solveTargets(input){
 if(input.allowPartial)return solvePartial(input);
 const {slots,ids,remaining,conflicts=[],requirements:required=[],forbidden=[],limits=[],gapRules=[],excluded=[],dependencies=[]}=input;
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
  if(!propagateDependencies(dependencies,values,domains,picked))return null;
  for(const r of requirements)if(!r.values.some(v=>picked.has(v))&&!r.values.some(v=>domains[values.get(v)?.slot]?.includes(v))){lastFailure=r.reason||'Zorunlu görev günü için uygun personel kalmadı.';return null;}
  for(const group of forbidden)if(group.every(v=>picked.has(v)))return null;
  for(const group of limits){
   const used=group.values.filter(v=>picked.has(v)).length;
   if(used>group.max)return null;
   if(used===group.max){const banned=new Set(group.values);domains=domains.map(d=>d===null?null:d.filter(v=>!banned.has(v)));}
   if(group.min!=null&&used<group.min){
    const possible=group.values.filter(v=>domains[values.get(v)?.slot]?.includes(v));
    if(used+possible.length<group.min){lastFailure=group.reason||'Görev alt hedefi için yeterli uygun hücre kalmadı.';return null}
    if(used+possible.length===group.min)for(const v of possible)domains[values.get(v).slot]=[v];
   }
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
  const payroll=payrollScores(input,values,chosen);
  const candidates=domains[i].slice().sort((a,b)=>{const x=values.get(a),y=values.get(b);const capacity=id=>domains.filter(d=>d?.some(v=>values.get(v).id===id&&values.get(v).kind===x.kind)).length;return costs.get(a)-costs.get(b)||left[y.id][y.kind]/capacity(y.id)-left[x.id][x.kind]/capacity(x.id)||payroll(a)-payroll(b)||x.id-y.id});
  for(const v of candidates){const x=values.get(v),next=domains.map(d=>d===null?null:d.filter(w=>!clashes.get(v).has(w)));next[i]=null;
   const rest=Object.fromEntries(ids.map(id=>[id,{...left[id]}]));rest[x.id][x.kind]--;
   const result=visit(next,rest,[...chosen,v]);if(result)return result;if(timedOut)break;
  }
  if(memo.size<20000)memo.add(signature);return null;
 }
 const plan=visit(options,remaining,[]);
 return {ok:!!plan,plan:(plan||[]).map(v=>values.get(v)),nodes,timedOut,lastFailure,bottleneck,best:best.map(v=>values.get(v)),elapsed:Date.now()-start};
}
function payrollScores(input,values,chosen){
 const added=new Map();
 const increment=x=>{const p=input.payroll?.[x.id],slot=input.slots[x.slot];return !p||p.frozenTotal||slot.category==='pol'&&p.frozenPol||slot.category==='ac'&&p.frozenAc?0:Number(slot.hours||0)};
 for(const v of chosen){const x=values.get(v);added.set(x.id,(added.get(x.id)||0)+increment(x))}
 return v=>{const x=values.get(v),p=input.payroll?.[x.id];if(!p||p.obligation==null)return 0;const projected=Number(p.worked||0)+(added.get(x.id)||0)+increment(x),over=Math.max(0,projected-p.obligation);return (p.cap==null?0:Math.max(0,over-p.cap)*100)+over+projected/Math.max(1,p.obligation)};
}
// First try calendar-complete people. Proven impossible calendar conditions are
// reported by the caller; they must not remove a person's eligible duties.
function partialCalendar(input,values,domains,left,chosen){
 const {slots}=input,picked=new Set(chosen),active=new Set(input.strictAllCalendars?input.ids:chosen.map(v=>values.get(v).id)),complete=new Set(active);let feasible=true;
 function requireValues(id,tokens){
  if(tokens.some(v=>picked.has(v)))return;
  complete.delete(id);const possible=tokens.filter(v=>domains[values.get(v)?.slot]?.includes(v));
  if(!possible.length)feasible=false;else if(possible.length===1)domains[values.get(possible[0]).slot]=possible;
 }
 for(const r of input.requirements||[])if(!r.soft&&active.has(r.id))requireValues(r.id,r.values);
 for(const rule of input.gapRules||[]){
  if(rule.soft||!active.has(rule.id))continue;
  const worked=new Set(rule.fixedDays);for(const v of chosen){const x=values.get(v);if(x.id===rule.id)worked.add(slots[x.slot].day)}
  const edge=rule.crossMonth;
  if(edge){
   const fixed=edge.fixedDays||rule.fixedDays,blank=(a,b)=>Math.max(0,...edge.runs.map(([lo,hi])=>Math.max(0,Math.min(hi,b-1)-Math.max(lo,a+1)+1)));
   for(const side of ['before','after'])if(edge[side]!=null){const valid=d=>side==='before'?blank(edge.before,d)<=rule.maxBlank:blank(d,edge.after)<=rule.maxBlank;if(!fixed.some(valid))requireValues(rule.id,slots.filter(s=>valid(s.day)&&s.allowed.includes(rule.id)).map(s=>`${s.index}:${rule.id}`))}
  }
  let minimum=0;
  for(const [from,to] of rule.segments){
   const days=[...worked].filter(d=>d>=from&&d<=to).sort((a,b)=>a-b);if(rule.includeEdges){days.unshift(from-1);days.push(to+1)}
   for(let n=1;n<days.length;n++){
    const lo=days[n-1]+1,hi=days[n]-1,length=hi-lo+1;if(length<=rule.maxBlank)continue;
    complete.delete(rule.id);minimum+=Math.floor(length/(rule.maxBlank+1));
    for(const [a,b] of [[lo,lo+rule.maxBlank],[hi-rule.maxBlank,hi]])requireValues(rule.id,slots.filter(s=>s.day>=a&&s.day<=b&&s.allowed.includes(rule.id)).map(s=>`${s.index}:${rule.id}`));
   }
  }
  if(minimum>left[rule.id].day+left[rule.id].night)feasible=false;
 }
 return {feasible,complete};
}
// Keep a calendar-complete seed, then maximize eligible coverage if that seed
// leaves cells empty. Both passes share the original time/node budget. A missing
// monthly gap/return condition is an explicit partial-plan warning, never a
// reason to discard all otherwise eligible assignments for that person.
function solvePartial(input){
 const {slots,ids,remaining,conflicts=[],limits=[],dependencies=[]}=input,start=Date.now(),budget=input.timeLimit??1200,maxNodes=input.maxNodes??7000;
 const values=new Map(),clashes=new Map();for(const s of slots)for(const id of s.allowed){const v=`${s.index}:${id}`;values.set(v,{slot:s.index,id,kind:s.kind});clashes.set(v,new Set())}
 for(const [a,b] of conflicts){clashes.get(a)?.add(b);clashes.get(b)?.add(a)}
 const initial=slots.map(s=>s.allowed.map(id=>`${s.index}:${id}`));let best=[],nodes=0,timedOut=false,phaseStopped=false;
 propagateDependencies(dependencies,values,initial,new Set());
 const paired=new Map();for(const r of dependencies){const x=values.get(r.when);if(x&&r.anyOf.length&&r.anyOf.every(v=>values.get(v)?.id!==x.id&&slots[values.get(v)?.slot]?.day===slots[x.slot].day))paired.set(r.when,r.anyOf);}
 const strictUntil=start+budget*(input.strictAllCalendars?1:.35),strictNodes=input.strictAllCalendars?maxNodes:Math.max(1,Math.floor(maxNodes*.35));
 function upper(domains,left){let n=0;for(const kind of ['day','night']){const owners=new Map();function add(i,seen){for(const v of domains[i]||[]){const id=values.get(v).id;if(seen.has(id))continue;seen.add(id);const mine=owners.get(id)||[];if(mine.length<left[id][kind]){mine.push(i);owners.set(id,mine);return true}for(let k=0;k<mine.length;k++)if(add(mine[k],seen)){mine[k]=i;return true}}return false}for(const s of slots)if(s.kind===kind&&domains[s.index]?.length&&add(s.index,new Set()))n++}return n}
 const personCeilings=Object.fromEntries(ids.map(id=>[id,remaining[id].day+remaining[id].night]));
 for(const group of limits){const set=new Set(group.values),first=values.get(group.values[0]);if(first&&group.values.every(v=>values.get(v)?.id===first.id)&&[...values].filter(([,x])=>x.id===first.id).every(([v])=>set.has(v)))personCeilings[first.id]=Math.min(personCeilings[first.id],Math.max(0,group.max))}
 const goal=Math.min(upper(initial,remaining),ids.reduce((n,id)=>n+personCeilings[id],0));
 function visit(domains,left,chosen,strict){
  if(best.length===goal)return;
  if(++nodes>maxNodes||Date.now()-start>budget){timedOut=true;return}
  if(strict&&(nodes>strictNodes||Date.now()>strictUntil)){phaseStopped=true;return}
  domains=domains.map(d=>d===null?null:d.filter(v=>left[values.get(v).id][values.get(v).kind]>0));
  const picked=new Set(chosen);for(const group of limits){const used=group.values.filter(v=>picked.has(v)).length;if(used>group.max)return;if(used===group.max){const ban=new Set(group.values);domains=domains.map(d=>d===null?null:d.filter(v=>!ban.has(v)))}}
  if(!propagateDependencies(dependencies,values,domains,picked))return;
  const calendar=strict||input.hardGaps||input.strictAllCalendars?partialCalendar(input,values,domains,left,chosen):null;
  const eligible=calendar?chosen.filter(v=>calendar.complete.has(values.get(v).id)):chosen;
  const valid=input.strictAllCalendars&&calendar.complete.size!==ids.length?[]:dependencyComplete(dependencies,eligible);
  if(valid.length>best.length)best=valid.slice();if(best.length===goal)return;
  if(calendar&&!calendar.feasible)return;
  const cells=slots.filter(s=>domains[s.index]?.length);if(!cells.length||chosen.length+Math.min(cells.length,ids.reduce((n,id)=>n+left[id].day+left[id].night,0))<=best.length)return;
  let s=cells[0];for(const x of cells)if(domains[x.index].length<domains[s.index].length||(domains[x.index].length===domains[s.index].length&&x.day<s.day))s=x;
  const cost=v=>domains.reduce((n,d)=>n+(d?.length?d.filter(w=>clashes.get(v).has(w)).length/d.length:0),0),costs=new Map(domains[s.index].map(v=>[v,cost(v)]));
  const payroll=payrollScores(input,values,chosen);
  const candidates=domains[s.index].slice().sort((a,b)=>{const x=values.get(a),y=values.get(b);return costs.get(a)-costs.get(b)||left[y.id][y.kind]/Math.max(1,remaining[y.id][y.kind])-left[x.id][x.kind]/Math.max(1,remaining[x.id][x.kind])||payroll(a)-payroll(b)||x.id-y.id});
  for(const v of candidates){
   const partners=paired.get(v),groups=partners&&!partners.some(w=>picked.has(w))?partners.filter(w=>domains[values.get(w).slot]?.includes(w)).map(w=>[v,w]):[[v]];
   for(const group of groups){let next=domains.map(d=>d===null?null:d.slice()),rest=Object.fromEntries(ids.map(id=>[id,{...left[id]}])),ok=true;
    for(const token of group){const x=values.get(token);if(!next[x.slot]?.includes(token)||rest[x.id][x.kind]<=0){ok=false;break}next=next.map(d=>d===null?null:d.filter(w=>!clashes.get(token).has(w)));next[x.slot]=null;rest[x.id][x.kind]--;}
    if(ok)visit(next,rest,[...chosen,...group],strict);if(best.length===goal||timedOut||phaseStopped)return;
   }
  }
  const skipped=domains.slice();skipped[s.index]=null;visit(skipped,left,chosen,strict);
 }
 if((input.requirements||[]).some(r=>!r.soft)||(input.gapRules||[]).some(r=>!r.soft))visit(initial,remaining,[],true);
 if(best.length<goal&&!timedOut&&!input.strictAllCalendars){phaseStopped=false;visit(initial,remaining,[],false)}
 return {ok:true,partial:true,plan:best.map(v=>values.get(v)),nodes,timedOut,optimal:!timedOut||best.length===goal,elapsed:Date.now()-start};
}
if(typeof module!=='undefined')module.exports={solveTargets};
else scope.onmessage=e=>{try{scope.postMessage(solveTargets(e.data))}catch(error){scope.postMessage({ok:false,error:String(error.message||error)})}};
})(typeof self==='undefined'?globalThis:self);
