(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.YeaHistoryQuery=api;})(typeof window==='undefined'?this:window,function(){
  'use strict';
  const norm=v=>String(v??'').trim().replace(/\s+/g,' ').toLocaleUpperCase('tr-TR');
  const round=v=>Math.round(v*100)/100;
  const seed=label=>({label,dayCount:0,nightCount:0,totalCount:0,dayHours:0,nightHours:0,totalHours:0,unknownHours:0,days:new Set()});
  function add(x,r){x.totalCount++;x.totalHours+=r.hours;x.days.add(r.date);if(!r.hours)x.unknownHours++;if(r.category==='day'){x.dayCount++;x.dayHours+=r.hours;}else{x.nightCount++;x.nightHours+=r.hours;}}
  const finish=x=>({...x,days:undefined,workedDays:x.days.size,dayHours:round(x.dayHours),nightHours:round(x.nightHours),totalHours:round(x.totalHours)});
  function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00Z');return !Number.isNaN(+d)&&d.toISOString().slice(0,10)===s;}
  function range(shift){const t=[...String(shift||'').matchAll(/(\d{1,2})[:.]([0-5]\d)/g)];if(t.length<2)return null;const start=+t[0][1]*60 + +t[0][2],end=+t[1][1]*60 + +t[1][2];if(start>=1440||end>=1440)return null;return [start,end<=start?end+1440:end];}
  function prepare(records,rules,P,policy='review'){
    const exact=new Map(),buckets=new Map(),issues=[];let duplicates=0,invalid=0;
    for(const raw of records||[]){const date=String(raw.date||''),person=String(raw.person||'').trim(),unit=P.canonicalUnit(raw.unit);if(!validDate(date)||!person){invalid++;continue;}
      const hours=Number(raw.hours),r={...raw,date,person,unit,hours:Number.isFinite(hours)&&hours>0&&hours<=48?hours:0,category:rules[unit]||P.defaultCategory(unit)};
      const time=range(r.shift),key=JSON.stringify([date,norm(person),norm(unit),time||norm(r.shift),r.hours]);
      if(exact.has(key)){duplicates++;exact.get(key).sources.push({fileName:r.fileName,sheet:r.sheet,row:r.row,col:r.col});continue;}
      r.sources=[{fileName:r.fileName,sheet:r.sheet,row:r.row,col:r.col}];exact.set(key,r);
      const group=JSON.stringify([date,norm(person),norm(unit)]);if(!buckets.has(group))buckets.set(group,[]);buckets.get(group).push(r);
    }
    const out=[];
    for(const rows of buckets.values()){
      let conflict=false;for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){const a=range(rows[i].shift),b=range(rows[j].shift);if(!a||!b||Math.max(a[0],b[0])<Math.min(a[1],b[1]))conflict=true;}
      if(conflict){issues.push(...rows.map(r=>({...r,reason:'Aynı kişi/tarih/birimde çakışan veya belirsiz vardiya'})));if(policy==='review')continue;if(policy==='largest'){out.push(rows.reduce((a,b)=>a.hours>=b.hours?a:b));continue;}}
      out.push(...rows);
    }
    return {records:out,issues,duplicates,invalid,rawCount:(records||[]).length};
  }
  function matches(r,f){const date=r.date;
    if(f.person&&norm(r.person)!==norm(f.person))return false;
    if(f.year&&date.slice(0,4)!==String(f.year))return false;
    if(f.month&&+date.slice(5,7)!==+f.month)return false;
    if(f.start&&date<f.start||f.end&&date>f.end)return false;
    if(f.unit&&r.unit!==f.unit||f.category&&r.category!==f.category)return false;
    if(f.source&&r.importId!==f.source&&!r.sources?.some(s=>s.fileName===f.sourceName))return false;
    if(f.text&&!norm([r.person,r.unit,r.shift,r.fileName,r.sheet].join(' ')).includes(norm(f.text)))return false;
    const weekend=[0,6].includes(new Date(date+'T12:00:00Z').getUTCDay());
    if(f.weekday==='weekend'&&!weekend||f.weekday==='weekday'&&weekend)return false;
    if(f.min!==''&&f.min!=null&&r.hours<+f.min||f.max!==''&&f.max!=null&&r.hours>+f.max)return false;
    if(f.hours==='unknown'&&r.hours||f.hours==='known'&&!r.hours)return false;
    return true;
  }
  function summarize(records,group){const map=new Map();for(const r of records){let label=group==='month'?r.date.slice(0,7):group==='year'?r.date.slice(0,4):group==='unit'?r.unit:group==='personMonth'?r.date.slice(0,7)+' · '+r.person:r.person;const k=norm(label);if(!map.has(k))map.set(k,seed(label));add(map.get(k),r);}return [...map.values()].map(finish);}
  function run(records,rules,f,P){
    const scoped=records.filter(r=>!f.source||r.importId===f.source),p=prepare(scoped,rules,P,f.policy),rows=p.records.filter(r=>r.category!=='exclude'&&matches(r,f));
    const totals=seed('Toplam');rows.forEach(r=>add(totals,r));
    return {...p,records:rows,groups:summarize(rows,f.group||'person'),months:summarize(rows,'month').sort((a,b)=>a.label.localeCompare(b.label)),units:summarize(rows,'unit'),totals:finish(totals),people:new Set(rows.map(r=>norm(r.person))).size,excluded:p.records.filter(r=>r.category==='exclude'&&matches(r,{...f,category:''})).length};
  }
  function previousYear(f){const shift=s=>{if(!s)return s;const x=(+s.slice(0,4)-1)+s.slice(4);return validDate(x)?x:x.slice(0,8)+'28';};return {...f,year:f.year?String(+f.year-1):'',start:shift(f.start),end:shift(f.end)};}
  function csv(rows){const q=v=>'"'+String(typeof v==='string'&&/^[\s]*[=+@-]/.test(v)?"'"+v:v??'').replace(/"/g,'""')+'"';return '\ufeff'+rows.map(r=>r.map(q).join(';')).join('\r\n');}
  return {run,prepare,matches,previousYear,csv,range};
});
