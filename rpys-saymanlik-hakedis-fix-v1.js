/* Targeted Saymanlık text-deduction and ŞUA hours refresh repair. */
(()=>{'use strict';
if(window.__RPYS_SAY_HAKEDIS_FIX_V3__)return;window.__RPYS_SAY_HAKEDIS_FIX_V3__=true;
const round2=n=>Math.round((Number(n)||0)*100)/100;
const norm=s=>String(s||'').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/\s+/g,' ').trim();
function monthKeyOf(r){let k=String(r?.monthKey||r?.month||'');if(/^\d{4}-\d{2}$/.test(k))return k;let key=String(r?._assignKey||'').split('|')[0];if(/^\d{4}-\d{2}$/.test(key))return key;let d=String(r?.date||r?.tarih||'').slice(0,10);if(/^\d{4}-\d{2}-\d{2}$/.test(d))return d.slice(0,7);return ''}
function hoursOf(r){let v=r?.col?.hours??r?.hours??r?.saat;if(v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))&&Number(v)>0)return Number(v);let shift=String(r?.col?.shift||r?.shift||r?.start&&r?.end&&`${r.start}-${r.end}`||'');let m=shift.match(/(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})/);if(!m)return 0;let a=Number(m[1])+Number(m[2])/60,b=Number(m[3])+Number(m[4])/60;if(b<a)b+=24;return Math.max(0,b-a)}
function personMatches(r,p){let id=r?.person?.id??r?.personId??r?.pid??r?.id;if(id!==undefined&&id!==null&&String(id)===String(p.id))return true;let name=r?.person?.name??r?.personName??r?.name??r?.adSoyad;try{return !!name&&personNameVariants(p).some(x=>norm(x)===norm(name))}catch{return !!name&&norm(name)===norm(p.name)}}
function rawMonthHours(p,year,month){const mk=`${year}-${String(month+1).padStart(2,'0')}`;let total=0;
 try{for(const [key,pid] of Object.entries(db?.assign||{})){const a=key.split('|');if(a.length!==4||a[0]!==mk||String(pid)!==String(p.id))continue;const col=typeof dutyColumnByKey==='function'?dutyColumnByKey(a[1],a[3]):null,meta=db.assignmentMeta?.[key]||{};total+=hoursOf({col:{...(col||{}),hours:meta.hours??col?.hours,shift:meta.shift??col?.shift}})}}catch{}
 try{for(const r of db?.importedRecords||[]){if(monthKeyOf(r)===mk&&personMatches(r,p))total+=hoursOf(r)}}catch{}
 return round2(total)}
function monthHours(p,year,month){const mk=`${year}-${String(month+1).padStart(2,'0')}`;let total=0,rows=[];
 try{if(typeof allAssignmentsAllMonths==='function')rows=allAssignmentsAllMonths().filter(r=>monthKeyOf(r)===mk&&personMatches(r,p))}catch{}
 if(rows.length){total=round2(rows.reduce((s,r)=>s+hoursOf(r),0));if(total>0)return total}
 if(typeof personMonthHours==='function'){try{let v=Number(personMonthHours(p.id,mk));if(Number.isFinite(v)&&v>0)return round2(v)}catch{}}
 total=rawMonthHours(p,year,month);if(total>0)return total;
 // Last compatibility path for older normalized duty-record shapes.
 try{let pools=[db.tasks,db.assignments,db.duties,db.records,db.mainTasks,db.extraRecords,db.manualRecords].filter(Array.isArray).flat();for(const r of pools)if(monthKeyOf(r)===mk&&personMatches(r,p))total+=hoursOf(r)}catch{}
 return round2(total)}
// The cloud renderer calls fmt(), but the original formatter is function-local elsewhere.
if(typeof window.fmt!=='function')window.fmt=n=>new Intl.NumberFormat('tr-TR',{maximumFractionDigits:2}).format(Number(n)||0);
const absent=new Set(['izin','sua','yillik','idari','mazeret','rapor','gecici','ketem','ketemgecici']);
function textAbsence(value){const t=String(value??'').trim();return !!t&&/[a-zçğıöşü]/i.test(t)&&!/^\s*\d{1,2}[:.]\d{2}\s*[-–—]/.test(t)}
function leaveFor(name,day){
 const p=(db.staff||[]).find(p=>p.name===name);if(!p)return null;const date=dateStr(Number(day));
 // Explicit leave records take precedence over stale imported/manual display values.
 return (db.leaves||[]).find(l=>String(l.personId)===String(p.id)&&l.start<=date&&l.end>=date&&!['saymanlik-status','excel-say-status'].includes(l.source))||null;
}
function leaveStatus(l){return l?(l.status||sayStatusFromText(l.type)||'izin'):''}
function calendarHours(date){const d=new Date(date+'T12:00:00'),w=d.getDay();if(w===0||w===6)return 0;if(typeof isHolidayDate==='function'&&isHolidayDate(date))return 0;return typeof isHalfHolidayDate==='function'&&isHalfHolidayDate(date)?5:7}
function absenceDates(p){
 const dates=new Set();for(let d=1;d<=daysInMonth();d++){
  const date=dateStr(d);if(!calendarHours(date))continue;
  const key=sayOverrideKey(p.name,d),text=db.sayCellOverrides?.[key],status=getCellStatus(p.name,d);
  const leave=(db.leaves||[]).some(l=>String(l.personId)===String(p.id)&&l.start<=date&&l.end>=date);
  const special=['gecici','ketem'].some(k=>(db.specialAssignments?.[k]||[]).some(r=>String(r.personId)===String(p.id)&&r.start<=date&&r.end>=date));
  if(leave||special||absent.has(status)||textAbsence(text))dates.add(date);
 }return dates;
}
function refreshHours(){
 try{
  if(typeof suaPeople!=='function'||typeof renderSuaHours!=='function')return;
  _allAssignCache=null;_calcCache={};
  const year=Number(db?.sua?.year)||Number(ym().slice(0,4)),people=suaPeople();renderSuaHours(people,year);
  const stat=document.getElementById('suaStatHours');if(stat)stat.textContent=window.fmt(people.reduce((n,p)=>n+Array.from({length:12},(_,m)=>monthHours(p,year,m)).reduce((a,b)=>a+b,0),0));
 }catch(e){console.warn('RPYS ŞUA hakediş yenileme',e);const box=document.getElementById('suaHoursSummary');if(box)box.textContent='Hakediş tablosu hesaplanamadı: '+e.message}
}
function installHours(){
 if(typeof suaHoursForPersonMonth==='function'&&!suaHoursForPersonMonth.__rpysHakFixV3){
  const wrapped=function(p,y,m){return monthHours(p,y,m)};wrapped.__rpysHakFixV3=true;suaHoursForPersonMonth=wrapped;
 }
 if(typeof suaTab==='function'&&!suaTab.__rpysHakFixV3){const old=suaTab;const wrapped=function(tab){const result=old.apply(this,arguments);if(tab==='hours')refreshHours();return result};wrapped.__rpysHakFixV3=true;suaTab=wrapped}
}
function persist(){_assignCache={};_allAssignCache=null;_calcCache={};_peopleCache=null;if(typeof saveNowV245==='function')saveNowV245({label:'Saymanlık metin ve takvim düşümü'});else save();renderAll()}
function editText(){
 if(!selectedSayCells.length)return;if(isMonthLocked())return alert('Bu ay kilitli.');
 const cells=[...new Map(selectedSayCells.map(el=>[sayOverrideKey(el.dataset.person,Number(el.dataset.day)),el])).values()];
 const first=cells[0],value=prompt(`Seçili ${cells.length} hücreye yazılacak metin / saat:`,sayData(first.dataset.person,Number(first.dataset.day)));if(value===null)return;
 const text=String(value).trim(),status=sayStatusFromText(text),reduce=textAbsence(text);
 const people=[...new Set(cells.map(el=>el.dataset.person))].map(n=>(db.staff||[]).find(p=>p.name===n)).filter(Boolean);
 const before=new Map(people.map(p=>[p.id,automaticObligation(p)]));
 pushUndoPoint('Saymanlık metin / takvim mükellef düşümü');db.sayTextObligation??={};db.cellStatus??={};db.sayCellOverrides??={};
 for(const el of cells){
  const n=el.dataset.person,d=Number(el.dataset.day),key=sayOverrideKey(n,d),sk=statusKey(n,d),oldText=db.sayCellOverrides[key];
  if(status){db.cellStatus[sk]=status;delete db.sayCellOverrides[key];delete db.sayTextObligation[key]}
  else{
   if(text)db.sayCellOverrides[key]=text;else delete db.sayCellOverrides[key];
   if(reduce){db.cellStatus[sk]='izin';db.sayTextObligation[key]=true}
   else{if(textAbsence(oldText)||db.sayTextObligation[key]||absent.has(db.cellStatus[sk]))delete db.cellStatus[sk];delete db.sayTextObligation[key]}
  }
  if(db.sayStatusCleared)delete db.sayStatusCleared[key];
 }
 people.forEach(p=>syncSayStatusesToLeavePage(p.name));
 // Existing explicit totals are adjusted only by this edit's delta, once per person.
 for(const p of people){const delta=automaticObligation(p)-before.get(p.id),ok=obligationKey(p.id),pk=puantajOverrideKey(p.id,'muk');
  if(db.obligationOverride?.[ok]!=null&&db.obligationOverride[ok]!=='')db.obligationOverride[ok]=Math.max(0,round2(Number(db.obligationOverride[ok])+delta));
  if(db.puantajOverride?.[pk]!=null&&db.puantajOverride[pk]!=='')db.puantajOverride[pk]=Math.max(0,round2(Number(db.puantajOverride[pk])+delta));
 }
 const menu=document.getElementById('cellContextMenu');if(menu)menu.style.display='none';persist();
}
function install(){
 installHours();
 if(typeof getCellStatus==='function'&&!getCellStatus.__rpysHakFixV3){const old=getCellStatus;const f=function(n,d){const l=leaveFor(n,d);return l?leaveStatus(l):old.apply(this,arguments)};f.__rpysHakFixV3=true;getCellStatus=f}
 if(typeof sayData==='function'&&!sayData.__rpysHakFixV3){const old=sayData;const f=function(n,d){const l=leaveFor(n,d);return l?String(l.type||sayStatusLabel(leaveStatus(l))).toLocaleUpperCase('tr-TR'):old.apply(this,arguments)};f.__rpysHakFixV3=true;sayData=f}
 if(typeof automaticObligation==='function'&&!automaticObligation.__rpysHakFixV3){const f=function(p){let base=0;for(let d=1;d<=daysInMonth();d++)base+=calendarHours(dateStr(d));return Math.max(0,round2(base-[...absenceDates(p)].reduce((n,ds)=>n+calendarHours(ds),0)))};f.__rpysHakFixV3=true;automaticObligation=f}
 if(typeof rawPuantajValue==='function'&&!rawPuantajValue.__rpysHakFixV3){const old=rawPuantajValue;const f=function(r,key){return key==='muk'?finalObligation(r.p):old.apply(this,arguments)};f.__rpysHakFixV3=true;rawPuantajValue=f}
 if(typeof editSelectedSayCellText==='function'&&editSelectedSayCellText!==editText)editSelectedSayCellText=editText;
}
window.rpysSayHakedis419={install,absenceDates,calendarHours,monthHours,refreshHours,textAbsence};
window.rpysRefreshSuaHoursV1=refreshHours;
install();if(document.querySelector('#sua.page.active'))refreshHours();
window.addEventListener('rpys-direct-core-ready',()=>{install();if(document.querySelector('#sua.page.active'))refreshHours()});
document.addEventListener('click',e=>{if(e.target.closest?.('.suaTabs [data-suatab="hours"]'))setTimeout(refreshHours,0)},true);
})();
