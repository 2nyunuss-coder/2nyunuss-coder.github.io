/* RPYS V2 independent preview solver v0.2: no RPYS writes. */
(()=>{'use strict';
function solve({slots=[],staff=[],targets={},existing=[],leaves=[],options={},maxNodes=100000,maxMs=5500}){
 const ids=staff.map(p=>String(p.id)),t0=performance.now(),counts=Object.fromEntries(ids.map(id=>[id,{day:0,night:0,skopi:0}])),busy=new Map(),out=new Map(),reasons=[],unfilled=[];
 const dates=Object.fromEntries(ids.map(id=>[id,[]])),blocked=new Map(ids.map(id=>[id,new Set()]));
 const next=(d,n)=>{let x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')};
 for(const l of leaves){let id=String(l.id);if(!blocked.has(id))continue;for(const d of l.days||[]){blocked.get(id).add(d);if(options.beforeLeave!==false&&!blocked.get(id).has(next(d,-1)))blocked.get(id).add(next(d,-1))}}
 const byDate=new Map();for(const e of existing){if(!e?.id||!e.date)continue;let id=String(e.id);if(!byDate.has(id))byDate.set(id,[]);byDate.get(id).push({date:e.date,hours:Number(e.hours||0),start:e.start,end:e.end,key:e.key});if(e.selected&&counts[id]){let kind=e.kind||'day';counts[id][kind]=(counts[id][kind]||0)+1;out.set(e.key,id)}}
 const target=(id,k)=>Number(targets[id]?.[k]||0),strict=options.strictTargets!==false,allowDouble=options.allowDifferentHours===true,rest=options.rest16!==false;
 let nodes=0,timedOut=false;
 function overlap(a,b){if(!allowDouble)return true;if(!Number.isFinite(a.start)||!Number.isFinite(a.end)||!Number.isFinite(b.start)||!Number.isFinite(b.end))return true;return a.start<b.end&&b.start<a.end}
 function eligible(s,id){if(blocked.get(id)?.has(s.date))return 'İzin veya izin öncesi boşluk';if(target(id,s.kind)<=counts[id][s.kind])return 'Hedef dolu';
 const records=[...(byDate.get(id)||[]),...(dates[id]||[])];
 for(const e of records){let gap=Math.round((Date.parse(s.date+'T12:00:00')-Date.parse(e.date+'T12:00:00'))/86400000);
 if(gap===0&&overlap(s,e))return 'Aynı gün saat çakışması / saat bilgisi yok';
 if(Math.abs(gap)===1&&options.noConsecutive!==false)return 'Ardışık gün engeli';
 if(rest&&gap===1&&e.hours>=16)return '16 saat görev sonrası dinlenme';
 if(rest&&gap===-1&&Number(s.hours||0)>=16)return 'Sonraki gün göreviyle dinlenme çakışması';
 }
 if(s.allowed&&!s.allowed.includes(id))return 'Birim personel havuzunda değil';return '';
 }
 function ranked(s){return ids.filter(id=>!eligible(s,id)).sort((a,b)=>{let qa=(target(a,s.kind)-counts[a][s.kind]),qb=(target(b,s.kind)-counts[b][s.kind]);let la=dates[a]||[],lb=dates[b]||[];let near=x=>x.reduce((n,e)=>n+1/(1+Math.abs((Date.parse(s.date)-Date.parse(e.date))/86400000)),0);return qb-qa||near(la)-near(lb)||a.localeCompare(b)})}
 const work=slots.filter(s=>!out.has(s.key)).map(s=>({...s,kind:s.kind||'day',hours:Number(s.hours||0)}));
 function dfs(left){if(!left.length)return true;if(++nodes>maxNodes||performance.now()-t0>maxMs){timedOut=true;return false}
 let chosen=null,choices=null;for(const s of left){let c=ranked(s);if(!choices||c.length<choices.length){chosen=s;choices=c;if(!c.length)break}}if(!choices?.length)return false;
 let remaining=left.filter(x=>x!==chosen);for(const id of choices){counts[id][chosen.kind]++;let entry={date:chosen.date,hours:chosen.hours,start:chosen.start,end:chosen.end,key:chosen.key};dates[id].push(entry);out.set(chosen.key,id);if(dfs(remaining))return true;out.delete(chosen.key);dates[id].pop();counts[id][chosen.kind]--;if(timedOut)break}return false}
 let ok=dfs(work);if(!ok){/* Safe fallback: place only individually validated assignments; never relax safety constraints. */
 out.clear();for(const id of ids){counts[id]={day:0,night:0,skopi:0};dates[id]=[]}
 for(const e of existing)if(e.selected&&counts[String(e.id)]){let id=String(e.id),kind=e.kind||'day';counts[id][kind]++;out.set(e.key,id)}
 for(const s of work.slice().sort((a,b)=>{let ac=ids.filter(id=>!blocked.get(id)?.has(a.date)).length,bc=ids.filter(id=>!blocked.get(id)?.has(b.date)).length;return ac-bc||a.date.localeCompare(b.date)})){let candidates=ranked(s);if(!candidates.length){unfilled.push({key:s.key,date:s.date,reason:ids.map(id=>id+': '+eligible(s,id)).slice(0,8).join('; ')||'Uygun personel yok'});continue}let id=candidates[0];out.set(s.key,id);counts[id][s.kind]++;dates[id].push({date:s.date,hours:s.hours,start:s.start,end:s.end,key:s.key})}
 reasons.push(timedOut?'Tam çözüm arama sınırına ulaştı; kısmi dağıtım gösteriliyor.':'Tüm hedefler karşılanamadı; kuralları bozmadan kısmi dağıtım oluşturuldu.')
 }
 const differences=[];for(const id of ids)for(const kind of ['day','night','skopi']){let wanted=target(id,kind),actual=counts[id][kind]||0;if(wanted!==actual&&wanted>0)differences.push({id,kind,wanted,actual})}
 if(differences.length)reasons.push('Hedef sapmaları: '+differences.length);
 return {ok:true,complete:ok&&unfilled.length===0&&(!strict||differences.length===0),assignments:[...out],counts,unfilled,differences,reasons,nodes,timedOut,version:'0.2-preview'};
}
window.RPYSV2Independent={solve,version:'0.2-preview'};
})();