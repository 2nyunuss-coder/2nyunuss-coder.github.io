/* RPYS V2 independent constraint solver; never writes to RPYS. */
(()=>{'use strict';if(window.RPYSV2Independent)return;
function solve({slots,staff,targets,existing,leaves,maxNodes=120000,maxMs=4500}){
 const start=performance.now(),ids=staff.map(x=>String(x.id)),counts=new Map(ids.map(id=>[id,{day:0,night:0}])),busy=new Map(ids.map(id=>[id,new Set()])),result=new Map(),errors=[];
 const blocked=new Map(ids.map(id=>[id,new Set(leaves.filter(l=>String(l.id)===id).flatMap(l=>l.days))]));
 for(const e of existing){let id=String(e.id),date=e.date;if(!counts.has(id))continue;busy.get(id).add(date);if(e.selected){counts.get(id)[e.kind]++;result.set(e.key,id)}}
 const todo=slots.filter(s=>!result.has(s.key));for(let kind of ['day','night']){let need=todo.filter(s=>s.kind===kind).length,capacity=ids.reduce((n,id)=>n+Number(targets[id]?.[kind]||0)-counts.get(id)[kind],0);if(need!==capacity)errors.push(kind+' hedef toplamı: '+capacity+' boş kapasite, '+need+' görev gerekiyor')}
 for(let id of ids)for(let kind of ['day','night'])if(counts.get(id)[kind]>Number(targets[id]?.[kind]||0))errors.push(id+' için korunan '+kind+' görevi hedefi aşıyor');
 if(errors.length)return {ok:false,error:errors.join('\n'),nodes:0};
 let nodes=0,aborted=false;const assignments=new Map();
 function possible(s){return ids.filter(id=>!blocked.get(id).has(s.date)&&!busy.get(id).has(s.date)&&counts.get(id)[s.kind]<targets[id][s.kind]&&!(s.allowed&& !s.allowed.includes(id))).sort((a,b)=>(targets[b][s.kind]-counts.get(b)[s.kind])-(targets[a][s.kind]-counts.get(a)[s.kind]))}
 function walk(left){if(!left.length)return true;if(++nodes>maxNodes||performance.now()-start>maxMs){aborted=true;return false}let chosen,options;for(let s of left){let p=possible(s);if(!p.length)return false;if(!options||p.length<options.length){chosen=s;options=p;if(p.length===1)break}}let next=left.filter(s=>s!==chosen);for(let id of options){busy.get(id).add(chosen.date);counts.get(id)[chosen.kind]++;assignments.set(chosen.key,id);if(walk(next))return true;assignments.delete(chosen.key);counts.get(id)[chosen.kind]--;busy.get(id).delete(chosen.date);if(aborted)break}return false}
 const ok=walk(todo);return ok?{ok:true,assignments:[...result,...assignments],counts:Object.fromEntries(counts),nodes}:{ok:false,error:aborted?'Arama süresi/düğüm sınırı doldu.':'Hedefler, izinler ve aynı gün çakışma kısıtlarıyla çözüm bulunamadı.',nodes};
}
window.RPYSV2Independent={solve,version:'0.1-isolated'};
})();