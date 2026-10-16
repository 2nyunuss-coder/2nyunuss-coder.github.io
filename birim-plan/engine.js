(function(root){
'use strict';
const days=m=>new Date(Number(m.slice(0,4)),Number(m.slice(5,7)),0).getDate();
const date=(m,d)=>`${m}-${String(d).padStart(2,'0')}`;
const weekend=(m,d)=>[0,6].includes(new Date(`${date(m,d)}T12:00:00`).getDay());
function totals(s){return s.people.map(p=>{const cells=Object.entries(s.assign).filter(([k,id])=>k.startsWith(s.month+'|')&&id===p.id);const hours=cells.reduce((n,[k])=>n+Number(s.shifts.find(t=>t.id===k.split('|')[2])?.hours||0),0);const duty=cells.reduce((n,[k])=>n+(weekend(s.month,Number(k.split('|')[1]))?1:0),0);return {id:p.id,name:p.name,count:cells.length,hours,weekends:duty,target:Number(p.target),extra:Math.max(0,hours-Number(p.target)),missing:Math.max(0,Number(p.target)-hours)};});}
function reason(s,p,d,t,slot){
 if(!p.active)return 'Personel pasif';
 if((p.unavailable||[]).includes(date(s.month,d)))return 'İzinli / uygun değil';
 const current=new Date(`${date(s.month,d)}T00:00:00Z`).getTime()/3600000+Number(t.start);
 let count=0,hours=Number(t.hours);
 for(const [key,id] of Object.entries(s.assign)){
  if(id!==p.id||key===slot)continue;
  const [m,day,shift]=key.split('|'),other=s.shifts.find(x=>x.id===shift);if(!other)continue;
  if(m===s.month){count++;hours+=Number(other.hours);if(Number(day)===d)return 'Aynı gün ikinci görev';}
  const start=new Date(`${date(m,Number(day))}T00:00:00Z`).getTime()/3600000+Number(other.start);
  const gap=current>=start?current-(start+Number(other.hours)):start-(current+Number(t.hours));
  if(gap<Number(s.rules.rest))return 'Dinlenme süresi yetersiz';
 }
 if(count>=Number(s.rules.maxDuties))return 'Aylık görev sınırı';
 if(hours>Number(s.rules.maxHours))return 'Aylık saat sınırı';
 return '';
}
function generate(source){
 const s=JSON.parse(JSON.stringify(source));
 // Only replace the selected month. Adjacent months remain available for rest checks.
 for(const key of Object.keys(s.assign))if(key.startsWith(s.month+'|'))delete s.assign[key];
 const gaps=[];
 for(let d=1;d<=days(s.month);d++)for(const t of [...s.shifts].sort((a,b)=>a.start-b.start)){
  const need=Number(weekend(s.month,d)?t.weekend:t.weekday);
  for(let n=0;n<need;n++){
   const key=`${s.month}|${d}|${t.id}|${n}`;
   const stats=totals(s),eligible=s.people.filter(p=>!reason(s,p,d,t,key));
   eligible.sort((a,b)=>{const x=stats.find(x=>x.id===a.id),y=stats.find(x=>x.id===b.id);return (x.hours/Math.max(1,x.target)-y.hours/Math.max(1,y.target))||(weekend(s.month,d)?x.weekends-y.weekends:0)||x.count-y.count||a.name.localeCompare(b.name,'tr');});
   if(eligible.length)s.assign[key]=eligible[0].id;else gaps.push({day:d,shift:t.name,slot:n+1});
  }
 }
 return {assign:s.assign,gaps};
}
const api={days,date,weekend,totals,reason,generate};if(typeof module!=='undefined')module.exports=api;else root.UnitPlanner=api;
})(typeof globalThis!=='undefined'?globalThis:this);
