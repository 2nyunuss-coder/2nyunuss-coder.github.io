(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.YeaHistoryParser=api;
})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  const MONTHS={ocak:1,şubat:2,subat:2,mart:3,nisan:4,mayıs:5,mayis:5,haziran:6,temmuz:7,ağustos:8,agustos:8,eylül:9,eylul:9,ekim:10,kasım:11,kasim:11,aralık:12,aralik:12};
  const IGNORE_WORDS=['İZİN','IZIN','RAPOR','TATİL','TATIL','OFF','BOŞ','BOS','GÖREV YOK','ÇALIŞMIYOR','CALISMIYOR'];
  const UNIT_PATTERNS=[
    [/ACİL|ACIL/,'Acil Röntgen'],[/BİLGİSAYARLI TOMOGRAFİ|BILGISAYARLI TOMOGRAFI|\bBT\b|TOMOGRAFİ|TOMOGRAFI/,'BT'],
    [/POLİKLİNİK|POLIKLINIK|RUTİN RÖNTGEN|RUTIN RONTGEN/,'Poliklinik Röntgen'],[/MAMOGRAFİ|MAMOGRAFI/,'Mamografi'],
    [/DEXA|KEMİK|KEMIK/,'DEXA'],[/SKOPİ|SKOPI/,'Skopi'],[/PORTA(BL|BLE)|SEYYAR/,'Portable'],
    [/BİRİM SORUMLUSU|BIRIM SORUMLUSU|SORUMLU/,'Birim Sorumlusu'],[/SEKRETER/,'Sekreterlik'],[/KETEM/,'KETEM'],[/USG|ULTRASON/,'USG']
  ];
  const DAY_UNITS=new Set(['Poliklinik Röntgen','Mamografi','DEXA','Birim Sorumlusu','Sekreterlik','KETEM','USG']);
  const NIGHT_UNITS=new Set(['Acil Röntgen','BT','Skopi','Portable']);
  const pad=n=>String(n).padStart(2,'0');
  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const upper=v=>clean(v).toLocaleUpperCase('tr-TR');
  const isIgnored=v=>IGNORE_WORDS.some(x=>upper(v).includes(x));
  function iso(y,m,d){const dt=new Date(Date.UTC(Number(y),Number(m)-1,Number(d)));if(dt.getUTCFullYear()!==Number(y)||dt.getUTCMonth()!==Number(m)-1||dt.getUTCDate()!==Number(d))return null;return `${y}-${pad(m)}-${pad(d)}`}
  function contextFromName(name){const s=String(name||'').toLocaleLowerCase('tr-TR');const y=(s.match(/\b(19|20)\d{2}\b/)||[])[0];let m=null;for(const [k,v] of Object.entries(MONTHS))if(s.includes(k)){m=v;break}const ym=s.match(/\b((?:19|20)\d{2})[-_. ](0?[1-9]|1[0-2])\b/);return {year:Number(ym?.[1]||y)||null,month:Number(ym?.[2]||m)||null}}
  function excelDate(n){if(!Number.isFinite(n)||n<20000||n>80000)return null;const d=new Date(Math.round((n-25569)*86400*1000));return iso(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate())}
  function parseDate(v,ctx={}){
    if(v instanceof Date&&!Number.isNaN(v.getTime()))return iso(v.getFullYear(),v.getMonth()+1,v.getDate());
    if(typeof v==='number'){const ex=excelDate(v);if(ex)return ex;if(v>=1&&v<=31&&ctx.year&&ctx.month)return iso(ctx.year,ctx.month,v);}
    const s=clean(v);if(!s)return null;
    let m=s.match(/\b((?:19|20)\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);if(m)return iso(+m[1],+m[2],+m[3]);
    m=s.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.]((?:19|20)?\d{2})\b/);if(m){let y=+m[3];if(y<100)y+=2000;return iso(y,+m[2],+m[1]);}
    m=s.match(/^([0-3]?\d)(?:\s*[A-Za-zÇĞİÖŞÜçğıöşü]+)?$/);if(m&&ctx.year&&ctx.month)return iso(ctx.year,ctx.month,+m[1]);
    return null;
  }
  function parseHours(v){
    if(typeof v==='number'&&Number.isFinite(v)&&v>0&&v<=48)return Math.round(v*100)/100;
    const s=upper(v);if(!s)return 0;
    const direct=s.match(/(?:^|\s)(\d{1,2}(?:[.,]\d+)?)\s*(?:SAAT|S)(?:\s|$)/);if(direct)return +direct[1].replace(',','.');
    const t=[...s.matchAll(/(?:^|\D)([0-2]?\d)[:.]([0-5]\d)(?!\d)/g)].map(x=>Number(x[1])+Number(x[2])/60);
    if(t.length>=2){let h=t[1]-t[0];if(h<=0)h+=24;return Math.round(h*100)/100;}
    return 0;
  }
  function detectUnit(v){const s=upper(v);for(const [re,n] of UNIT_PATTERNS)if(re.test(s))return n;return null}
  function canonicalUnit(v){return detectUnit(v)||clean(v)||'Belirsiz'}
  function defaultCategory(unit){const u=canonicalUnit(unit);return DAY_UNITS.has(u)?'day':NIGHT_UNITS.has(u)?'night':'exclude'}
  function looksPerson(v){const s=clean(v);if(s.length<4||s.length>90||/\d{1,2}[:.]\d{2}/.test(s)||detectUnit(s)||isIgnored(s))return false;const words=s.split(' ').filter(Boolean);return words.length>=2&&words.every(x=>/^[A-Za-zÇĞİÖŞÜçğıöşü.'-]+$/.test(x))}
  function splitPersons(v){return String(v??'').split(/[\n;,/]+/).map(x=>clean(x.replace(/^[\s•*\-–—→\d.)]+/,''))).filter(looksPerson)}
  function findHeader(rows,ctx){let best={row:-1,dates:[]};for(let r=0;r<Math.min(rows.length,35);r++){const dates=[];(rows[r]||[]).forEach((v,c)=>{const d=parseDate(v,ctx);if(d)dates.push({col:c,date:d})});if(dates.length>best.dates.length)best={row:r,dates}}return best.dates.length>=2?best:null}
  function likelyMode(rows,head){let numeric=0,names=0,total=0;for(let r=head.row+1;r<Math.min(rows.length,head.row+20);r++)for(const d of head.dates){const v=rows[r]?.[d.col];if(clean(v)){total++;if(parseHours(v)>0||typeof v==='number')numeric++;if(splitPersons(v).length)names++;}}return names>numeric&&names>=Math.max(2,total*.25)?'unit_rows':'person_rows'}
  function rowUnit(labels,defaultUnit,sheet){const found=detectUnit(labels.join(' '));if(found)return found;if(defaultUnit)return canonicalUnit(defaultUnit);return detectUnit(sheet)||clean(sheet)||'Belirsiz'}
  function parseSheet(rows,opts={},sheetName='Sayfa1',fileName=''){
    const fromName=contextFromName(fileName+' '+sheetName),ctx={year:Number(opts.year)||fromName.year,month:Number(opts.month)||fromName.month};
    const head=findHeader(rows,ctx);if(!head)return {records:[],warnings:[`${sheetName}: Tarih başlıkları bulunamadı.`],mode:opts.mode||'auto'};
    const mode=opts.mode&&opts.mode!=='auto'?opts.mode:likelyMode(rows,head),records=[],warnings=[];
    const firstDate=Math.min(...head.dates.map(x=>x.col)),header=(rows[head.row]||[]).map(upper);
    const personHeader=header.findIndex((x,i)=>i<firstDate&&/(PERSONEL|AD SOYAD|ADI SOYADI|TEKNİKER|TEKNIKER)/.test(x));
    for(let r=head.row+1;r<rows.length;r++){
      const row=rows[r]||[],labels=row.slice(0,firstDate).map(clean).filter(Boolean);if(!labels.length&&!head.dates.some(d=>clean(row[d.col])))continue;
      if(mode==='person_rows'){
        let person=personHeader>=0?clean(row[personHeader]):labels.find(looksPerson);if(!looksPerson(person))continue;
        const baseUnit=rowUnit(labels.filter(x=>x!==person),opts.defaultUnit,sheetName);
        for(const h of head.dates){const raw=row[h.col],txt=clean(raw);if(!txt||txt==='0'||isIgnored(txt))continue;const unit=detectUnit(txt)||baseUnit;records.push({date:h.date,person,unit,shift:txt,hours:parseHours(raw),sheet:sheetName,row:r+1,col:h.col+1})}
      }else{
        const unit=rowUnit(labels,opts.defaultUnit,sheetName),rowShift=labels.find(x=>parseHours(x)>0)||labels.join(' '),rowHours=parseHours(rowShift);
        for(const h of head.dates){const raw=row[h.col];for(const person of splitPersons(raw))records.push({date:h.date,person,unit,shift:clean(rowShift),hours:rowHours,sheet:sheetName,row:r+1,col:h.col+1})}
      }
    }
    const seen=new Set(),dedup=records.filter(x=>{const k=[x.date,upper(x.person),upper(x.unit),upper(x.shift),x.hours].join('|');if(seen.has(k))return false;seen.add(k);return true});
    if(!dedup.length)warnings.push(`${sheetName}: Görev kaydı algılanamadı.`);
    return {records:dedup,warnings,mode,headerRow:head.row+1};
  }
  function parseWorkbook(workbook,opts={},fileName=''){
    const records=[],warnings=[],sheets=[];for(const name of workbook.SheetNames||[]){const rows=workbook.toRows?workbook.toRows(name):[];const out=parseSheet(rows,opts,name,fileName);records.push(...out.records);warnings.push(...out.warnings);sheets.push({name,mode:out.mode,count:out.records.length,headerRow:out.headerRow||null})}
    const seen=new Set(),unique=records.filter(x=>{const k=[x.date,upper(x.person),upper(x.unit),upper(x.shift),x.hours].join('|');if(seen.has(k))return false;seen.add(k);return true});return {records:unique,warnings,sheets};
  }
  function aggregate(records,rules={},filters={}){
    const unique=new Map(),people=new Map(),months=new Map();let unknownHours=0;
    for(const r of records||[]){if(filters.person&&r.person!==filters.person)continue;if(filters.year&&String(r.date).slice(0,4)!==String(filters.year))continue;if(filters.month&&String(r.date).slice(5,7)!==pad(filters.month))continue;const unit=canonicalUnit(r.unit),sig=[r.date,upper(r.person),upper(unit)].join('|'),old=unique.get(sig);if(!old||Number(r.hours||0)>Number(old.hours||0))unique.set(sig,{...r,unit})}
    for(const r of unique.values()){const kind=rules[r.unit]||defaultCategory(r.unit);if(kind==='exclude')continue;const hours=Number(r.hours||0);if(!hours)unknownHours++;const add=(map,key,seed)=>{const x=map.get(key)||seed();x.totalCount++;x.totalHours+=hours;if(kind==='day'){x.dayCount++;x.dayHours+=hours}else{x.nightCount++;x.nightHours+=hours}map.set(key,x)};add(people,r.person,()=>({person:r.person,dayCount:0,nightCount:0,totalCount:0,dayHours:0,nightHours:0,totalHours:0}));const mk=String(r.date).slice(0,7),k=mk+'|'+r.person;add(months,k,()=>({month:mk,person:r.person,dayCount:0,nightCount:0,totalCount:0,dayHours:0,nightHours:0,totalHours:0}));}
    const round=x=>Math.round(x*100)/100,finish=a=>a.map(x=>({...x,dayHours:round(x.dayHours),nightHours:round(x.nightHours),totalHours:round(x.totalHours)}));return {people:finish([...people.values()]),months:finish([...months.values()]),recordCount:[...unique.values()].filter(r=>(rules[r.unit]||defaultCategory(r.unit))!=='exclude').length,unknownHours};
  }
  return {contextFromName,parseDate,parseHours,canonicalUnit,defaultCategory,parseSheet,parseWorkbook,aggregate};
});
