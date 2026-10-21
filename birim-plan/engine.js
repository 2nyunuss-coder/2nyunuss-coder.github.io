(function(root){
'use strict';
const R=typeof module!=='undefined'?require('../rpys-rules-v421.js'):root.RPYSRules;
const days=m=>new Date(Number(m.slice(0,4)),Number(m.slice(5,7)),0).getDate(),date=(m,d)=>`${m}-${String(d).padStart(2,'0')}`;
const stamp=d=>Date.parse(d+'T00:00:00Z')/3600000,plus=(d,n)=>new Date((stamp(d)+n*24)*3600000).toISOString().slice(0,10),weekend=(m,d)=>[0,6].includes(new Date(date(m,d)+'T12:00:00Z').getUTCDay());
const unitOf=(s,t)=>String(t?.unit??s.unit??''),rules=(s,u=s.unit||'')=>R.config(s.unitRules?.[u]||s.rules||{},'standalone');
function shifts(s,units=[s.unit||'']){return s.shifts.filter(t=>t.active!==false&&units.includes(unitOf(s,t))&&!(s.rooms||[]).some(r=>r.unit===unitOf(s,t)&&r.name===t.room&&r.active===false))}
function records(s){return Object.entries(s.assign||{}).flatMap(([key,id])=>{const [month,d,tid]=key.split('|'),base=s.shifts.find(t=>t.id===tid),t=s.assignmentMeta?.[key]?.shift||base;if(!t||!id&&id!=='0')return [];return [{key,id:String(id),month,day:Number(d),date:date(month,Number(d)),shift:t,unit:unitOf(s,t),start:stamp(date(month,Number(d)))+Number(t.start),hours:Number(t.hours)}]})}
function totals(s,unit=s.unit??null){const rows=records(s).filter(a=>a.month===s.month&&(unit===null||a.unit===unit)),calc={dailyHours:7,addDaysPer360:90,...s.fhz};return s.people.map(p=>{const cells=rows.filter(a=>a.id===String(p.id)),hours=cells.reduce((n,a)=>n+a.hours,0),fhzHours=cells.filter(a=>a.shift.fhzEligible===true).reduce((n,a)=>n+a.hours,0);return {id:p.id,name:p.name,count:cells.length,hours,weekends:cells.filter(a=>weekend(s.month,a.day)).length,target:Number(p.target||0),extra:Math.max(0,hours-Number(p.target||0)),missing:Math.max(0,Number(p.target||0)-hours),fhzHours,workDays:fhzHours/Number(calc.dailyHours),fhzDays:fhzHours/Number(calc.dailyHours)*Number(calc.addDaysPer360)/360}})}
function status(s,p,ds){return s.calendar?.[p.id+'|'+ds]||((p.unavailable||[]).includes(ds)?'izin':'')}
function leaveDates(s,p){return [...new Set([...(p.unavailable||[]).filter(ds=>!s.calendar?.[p.id+'|'+ds]||['izin','rapor'].includes(s.calendar[p.id+'|'+ds])),...Object.entries(s.calendar||{}).filter(([k,v])=>k.startsWith(p.id+'|')&&['izin','rapor'].includes(v)).map(([k])=>k.slice(k.indexOf('|')+1))])]}
function leavePeriods(s,p){const ds=leaveDates(s,p).sort(),out=[];for(const ds0 of ds){const last=out.at(-1);if(last&&plus(last.end,1)===ds0)last.end=ds0;else out.push({start:ds0,end:ds0})}return out}
function required(s,p,u){const c=rules(s,u),out=[];for(const l of leavePeriods(s,p)){if(c.preLeaveThursday&&new Date(l.start+'T12:00:00Z').getUTCDay()===1)out.push({date:plus(l.start,-4),message:'Pazartesi izni öncesi Perşembe işbaşı'});if(c.returnMonday){let d=plus(l.end,1);while([0,6].includes(new Date(d+'T12:00:00Z').getUTCDay())||leaveDates(s,p).includes(d))d=plus(d,1);out.push({date:d,message:'İzin dönüşü ilk iş günü işbaşı'})}}for(const r of c.custom.filter(r=>r.enabled!==false&&r.type==='requiredDate'&&(!r.personId||String(r.personId)===String(p.id))))for(const d of r.dates)out.push({date:d,message:r.name});return out.filter(x=>x.date.slice(0,7)===s.month)}
function issues(s,p,d,t,slot,all=records(s)){
 const u=unitOf(s,t),c=rules(s,u),ds=date(s.month,d),current=stamp(ds)+Number(t.start),end=current+Number(t.hours),mine=all.filter(a=>a.id===String(p.id)&&a.key!==slot),out=[],add=(key,message,severity='error')=>{if(c[key]!==false)out.push({key,message,severity})};
 if(!p.active)out.push({key:'active',message:'Personel pasif',severity:'error'});
 if(['izin','rapor'].includes(status(s,p,ds)))add('blockLeave',status(s,p,ds)==='rapor'?'Raporlu':'İzinli / uygun değil');
 if(status(s,p,ds)==='rezerve')add('blockReserve','Rezerve gün');
 if(t.role&&!(p.roles||[]).some(x=>x.toLocaleLowerCase('tr')===t.role.toLocaleLowerCase('tr')))add('requireRole','Görev grubu uygun değil: '+t.role);
 const missing=(t.requiredSkills||[]).filter(k=>!(p.skills||[]).some(x=>x.toLocaleLowerCase('tr')===k.toLocaleLowerCase('tr')));if(missing.length)add('requireSkills','Yetkinlik eksik: '+missing.join(', '));
 for(const l of leavePeriods(s,p)){
  if(c.preLeaveThursday&&new Date(l.start+'T12:00:00Z').getUTCDay()===1&&ds>=plus(l.start,-3)&&ds<l.start)add('preLeaveThursday','İzin öncesi Cuma–Pazar boşluğu');
  if(c.leaveWeekendBlock){let next=plus(l.end,1);while([0,6].includes(new Date(next+'T12:00:00Z').getUTCDay())){if(ds===next)add('leaveWeekendBlock','İzin dönüşü hafta sonu boşluğu');next=plus(next,1)}}
 }
 if(mine.some(a=>a.date===ds))add('avoidSameDay','Aynı gün ikinci görev');
 if(mine.some(a=>a.start<end&&current<a.start+a.hours))add('overlap','Görev saatleri çakışıyor');
 const byDay=new Map();for(const a of mine)byDay.set(a.date,(byDay.get(a.date)||0)+a.hours);
 if((byDay.get(plus(ds,-1))||0)>=16||mine.some(a=>a.date===plus(ds,-1)&&Number(a.shift.start)+a.hours>24)||(Number(t.hours)>=16||Number(t.start)+Number(t.hours)>24)&&byDay.has(plus(ds,1)))add('noPostDuty','Dinlenme süresi yetersiz');
 if(mine.some(a=>{const gap=current>=a.start?current-(a.start+a.hours):a.start-end;return gap<Number(c.rest)}))add('noPostDuty','Dinlenme süresi yetersiz');
 if(Number(t.hours)>=16){if(mine.some(a=>a.hours>=16&&Math.abs(stamp(a.date)-stamp(ds))/24<Number(c.minGap)))add('minGapEnabled','Uzun görevler arasında gün aralığı yetersiz');if(mine.some(a=>a.hours>=16&&Math.abs(stamp(a.date)-stamp(ds))===48))add('avoidAlternate','Gün aşırı nöbet / uzun görev','warning')}
 const monthly=mine.filter(a=>a.month===s.month&&a.unit===u),hours=monthly.reduce((n,a)=>n+a.hours,Number(t.hours));
 if(monthly.length>=Number(c.maxDuties))add('maxDutiesEnabled','Aylık görev sınırı');if(hours>Number(c.maxHours))add('maxHoursEnabled','Aylık saat sınırı');
 for(const r of c.custom.filter(r=>r.enabled!==false&&(!r.personId||String(r.personId)===String(p.id)))){
  let bad=r.type==='blockedWeekdays'&&r.weekdays.includes(new Date(ds+'T12:00:00Z').getUTCDay())||r.type==='maxDuties'&&monthly.length>=Number(r.value)||r.type==='maxHours'&&hours>Number(r.value)||r.type==='blockedDates'&&r.dates.includes(ds);
  if(r.type==='maxConsecutive'){const worked=new Set(mine.filter(a=>a.unit===u).map(a=>a.date));worked.add(ds);let run=0;for(let x=plus(ds,-Number(r.value));x<=plus(ds,Number(r.value));x=plus(x,1)){run=worked.has(x)?run+1:0;if(run>Number(r.value))bad=true}}
  if(bad)out.push({key:r.id,message:r.name,severity:'error'});
 }
 return out.filter((x,i,a)=>a.findIndex(y=>y.message===x.message)===i);
}
function reason(s,p,d,t,slot){return issues(s,p,d,t,slot).find(x=>x.severity==='error')?.message||''}
function onDay(s,d,t){return !t.weekdays||t.weekdays.includes(new Date(date(s.month,d)+'T12:00:00Z').getUTCDay())}
function cells(s,units=[s.unit||'']){const out=[];for(let d=1;d<=days(s.month);d++)for(const t of shifts(s,units).filter(t=>onDay(s,d,t)))for(let n=0;n<Number(weekend(s.month,d)?t.weekend:t.weekday);n++){const key=`${s.month}|${d}|${t.id}|${n}`;out.push({d,t:s.assignmentMeta?.[key]?.shift||t,n,key})};const keys=new Set(out.map(c=>c.key));for(const a of records(s))if(a.month===s.month&&units.includes(a.unit)&&!keys.has(a.key)){out.push({d:a.day,t:a.shift,n:Number(a.key.split('|')[3]),key:a.key});keys.add(a.key)}return out.sort((a,b)=>a.d-b.d||a.t.start-b.t.start)}
function snapshot(s,key,t,manual=false){s.assignmentMeta??={};s.assignmentMeta[key]={...(s.assignmentMeta[key]||{}),manual,shift:{...t,unit:unitOf(s,t)}}}
function audit(s,units=[s.unit||'']){const out=[],all=records(s);for(const a of all.filter(a=>a.month===s.month&&units.includes(a.unit))){const p=s.people.find(p=>String(p.id)===a.id);if(p)for(const x of issues(s,p,a.day,a.shift,a.key,all))out.push({...x,key:a.key,personId:p.id,day:a.day,unit:a.unit})}
 for(const u of units)for(const p of s.people.filter(p=>p.active)){
  const c=rules(s,u),mine=all.filter(a=>a.id===String(p.id)&&a.month===s.month&&a.unit===u),worked=new Set(all.filter(a=>a.id===String(p.id)&&a.month===s.month).map(a=>a.date));
  for(const r of required(s,p,u))if(!worked.has(r.date))out.push({key:'required-'+p.id+'-'+r.date,personId:p.id,day:Number(r.date.slice(8)),unit:u,severity:'warning',message:r.message+' eksik'});
  if(c.maxGapEnabled&&mine.length){let blank=0;for(let d=1;d<=days(s.month);d++){const ds=date(s.month,d);blank=worked.has(ds)||status(s,p,ds)?0:blank+1;if(blank===Number(c.maxGapDays)+1)out.push({key:'gap-'+p.id+'-'+d,personId:p.id,day:d,unit:u,severity:'warning',message:c.maxGapDays+' boş gün sınırı aşılıyor'})}}
  if(c.spouseSameDay&&p.spouseId){const other=s.people.find(x=>String(x.id)===String(p.spouseId));if(other?.active)for(const a of mine)if(!['izin','rapor'].includes(status(s,other,a.date))&&!all.some(b=>b.id===String(other.id)&&b.date===a.date))out.push({key:'spouse-'+p.id+'-'+a.day,personId:p.id,day:a.day,unit:u,severity:'warning',message:'İzinli olmayan eşin aynı gün görevi yok'})}
 }return out;}
function generate(source,options={}){
 const s=JSON.parse(JSON.stringify(source)),units=options.units||[s.unit||''],selected=new Set(shifts(s,units).map(t=>t.id));s.assignmentMeta??={};
 if(options.rebuild)for(const key of Object.keys(s.assign))if(key.startsWith(s.month+'|')&&selected.has(key.split('|')[2])&&!s.locks?.[key]&&!s.assignmentMeta[key]?.manual){delete s.assign[key];delete s.assignmentMeta[key]}
 const gaps=[];let all=records(s);
 for(const cell of cells(s,units)){const {d,t,key}=cell;if(s.assign[key]!=null&&s.assign[key]!=='')continue;if(s.locks?.[key]){gaps.push({day:d,shift:t.name,slot:cell.n+1,unit:unitOf(s,t),reason:'Boş kilitli hücre'});continue}
  const stats=new Map(totals(s,null).map(x=>[String(x.id),x])),candidates=s.people.map(p=>({p,issues:issues(s,p,d,t,key,all)})),eligible=candidates.filter(x=>!x.issues.some(i=>i.severity==='error'));
  eligible.sort((a,b)=>{const x=stats.get(String(a.p.id)),y=stats.get(String(b.p.id)),u=unitOf(s,t),c=rules(s,u),need=p=>required(s,p,u).some(r=>r.date===date(s.month,d))?1:0;return need(b.p)-need(a.p)||a.issues.length-b.issues.length||(c.obligationOvertime?x.hours/Math.max(1,x.target)-y.hours/Math.max(1,y.target):0)||(c.weekendFair&&weekend(s.month,d)?x.weekends-y.weekends:0)||x.count-y.count||a.p.name.localeCompare(b.p.name,'tr')});
  if(eligible.length){s.assign[key]=eligible[0].p.id;snapshot(s,key,t);all=records(s)}else {const reasons={};for(const c of candidates)for(const i of c.issues.filter(i=>i.severity==='error'))reasons[i.message]=(reasons[i.message]||0)+1;gaps.push({day:d,shift:t.name,slot:cell.n+1,unit:unitOf(s,t),reasons,reason:Object.entries(reasons).map(([why,count])=>why+' ('+count+' kişi)').join(' · ')||'Aktif personel bulunamadı'})};
 }
 return {assign:s.assign,assignmentMeta:s.assignmentMeta,gaps,warnings:audit(s,units)};
}
function coverage(s){const all=cells(s),assigned=all.filter(c=>s.assign[c.key]),rows=records(s).filter(a=>a.month===s.month&&a.unit===s.unit),groups=[...new Set(all.map(c=>c.t.room||'Ortak ekip'))];return {total:all.length,filled:assigned.length,gaps:all.length-assigned.length,hours:rows.reduce((n,a)=>n+a.hours,0),byRoom:groups.map(room=>{const cs=all.filter(c=>(c.t.room||'Ortak ekip')===room);return {room,total:cs.length,filled:cs.filter(c=>s.assign[c.key]).length}})}}
const api={coverage,status,leaveDates,onDay,days,date,weekend,totals,reason,issues,generate,records,rules,cells,shifts,snapshot,audit,unitOf};if(typeof module!=='undefined')module.exports=api;else root.UnitPlanner=api;
})(typeof globalThis!=='undefined'?globalThis:this);
