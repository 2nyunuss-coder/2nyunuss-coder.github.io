/* Targeted Saymanlık text-deduction and ŞUA hours refresh repair. */
(()=>{'use strict';
if(window.__RPYS_SAY_HAKEDIS_FIX_V2__)return;window.__RPYS_SAY_HAKEDIS_FIX_V2__=true;
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
function refreshHours(){try{if(typeof suaPeople!=='function'||typeof renderSuaHours!=='function')return;try{_allAssignCache=null}catch{}try{_calcCache={}}catch{}const year=Number(db?.sua?.year)||2026,people=suaPeople();renderSuaHours(people,year);let hours=people.reduce((sum,p)=>sum+Array.from({length:12},(_,m)=>monthHours(p,year,m)).reduce((a,b)=>a+b,0),0);const stat=document.getElementById('suaStatHours');if(stat)stat.textContent=typeof fmt==='function'?fmt(round2(hours)):String(round2(hours))}catch(e){console.warn('RPYS ŞUA hakediş yenileme',e)}}
function installHours(){try{if(typeof suaHoursForPersonMonth==='function'&&!suaHoursForPersonMonth.__rpysHakFixV1){const old=suaHoursForPersonMonth;const wrapped=function(p,y,m){let v=0;try{v=Number(old.apply(this,arguments))||0}catch{}return v>0?round2(v):monthHours(p,y,m)};wrapped.__rpysHakFixV1=true;suaHoursForPersonMonth=wrapped}if(typeof suaTab==='function'&&!suaTab.__rpysHakFixV1){const old=suaTab;const wrapped=function(tab){const out=old.apply(this,arguments);if(tab==='hours')setTimeout(refreshHours,0);return out};wrapped.__rpysHakFixV1=true;suaTab=wrapped}if(typeof renderSua==='function'&&!renderSua.__rpysHakFixV1){const old=renderSua;const wrapped=function(){try{_allAssignCache=null}catch{}const out=old.apply(this,arguments);return out};wrapped.__rpysHakFixV1=true;renderSua=wrapped}}catch(e){console.warn('RPYS ŞUA hakediş kancası',e)}}
function deductionHours(entered,confirmText,selectedCount){
 const c=norm(confirmText),t=norm(entered),combined=`${c} ${t}`;
 const hourValues=[...c.matchAll(/(\d+(?:[.,]\d+)?)\s*saat/g)].map(m=>Number(m[1].replace(',','.')));
 if(hourValues.length)return Math.max(...hourValues);
 const dayValues=[...combined.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:is\s*)?gun/g)].map(m=>Number(m[1].replace(',','.')));
 if(dayValues.length)return Math.max(...dayValues)*7;
 const numeric=String(entered||'').trim().match(/^(\d+(?:[.,]\d+)?)$/);
 if(numeric)return Number(numeric[1].replace(',','.'))*7;
 return selectedCount>0&&/izin|rapor|gecici|ketem/.test(t)?selectedCount*7:0
}
function installSaymanlik(){try{
 if(typeof editSelectedSayCellText!=='function'||editSelectedSayCellText.__rpysHakFixV2)return;
 const old=editSelectedSayCellText;
 const wrapped=function(){
  const cells=(selectedSayCells||[]).map(el=>({name:el.dataset.person,day:Number(el.dataset.day)})).filter(x=>x.name&&x.day);
  const byPerson=new Map();for(const x of cells){const p=(db.staff||[]).find(y=>norm(y.name)===norm(x.name));if(p&&!byPerson.has(String(p.id)))byPerson.set(String(p.id),{p,before:0});}
  for(const row of byPerson.values())try{row.before=Number(finalObligation(row.p))||0}catch{}
  let entered='',confirmText='',confirmed=false;const origPrompt=window.prompt,origConfirm=window.confirm;
  try{
   window.prompt=function(message,initial){const value=origPrompt.apply(this,arguments);if(value!==null)entered=String(value);return value};
   window.confirm=function(message){const yes=origConfirm.apply(this,arguments);if(/mukellef/.test(norm(message))&&/saat|gun/.test(norm(message))){confirmText=String(message||'');confirmed=!!yes}return yes};
   return old.apply(this,arguments)
  }finally{
   window.prompt=origPrompt;window.confirm=origConfirm;
   const text=norm(entered),isLeave=/izin|rapor|gecici|ketem/.test(`${text} ${norm(confirmText)}`);
   const selectedByPerson=new Map();for(const x of cells){const p=(db.staff||[]).find(y=>norm(y.name)===norm(x.name));if(p)selectedByPerson.set(String(p.id),(selectedByPerson.get(String(p.id))||0)+1)}
   const groups=[...byPerson.values()];
   for(const row of groups){
    const pid=String(row.p.id),chosen=selectedByPerson.get(pid)||1;
    const wanted=confirmed&&isLeave?deductionHours(entered,confirmText,chosen):0;
    if(!wanted)continue;
    let now=Number(finalObligation(row.p));if(!Number.isFinite(now))now=row.before;
    const alreadyApplied=Math.max(0,row.before-now),remaining=Math.max(0,wanted-alreadyApplied);
    if(remaining>0){db.obligationOverride=db.obligationOverride||{};db.obligationOverride[obligationKey(row.p.id)]=Math.max(0,round2(now-remaining))}
   }
   try{_assignCache={};_allAssignCache=null;_calcCache={};_peopleCache=null}catch{}
   if(confirmed&&isLeave){try{if(typeof saveNowV245==='function')saveNowV245({label:'Saymanlık izin mükellef düşümü'});else save()}catch{try{save()}catch{}}try{renderAll()}catch{}}
  }
 };
 wrapped.__rpysHakFixV2=true;editSelectedSayCellText=wrapped
}catch(e){console.warn('RPYS Saymanlık edit kancası',e)}}
function install(){installHours();installSaymanlik()}
function refreshIfActive(){if(document.querySelector('#sua.page.active'))refreshHours()}
install();window.rpysRefreshSuaHoursV1=refreshHours;
window.addEventListener('rpys-direct-core-ready',()=>{install();setTimeout(install,250);setTimeout(refreshIfActive,250)});
document.addEventListener('click',e=>{if(e.target.closest('.suaTabs [data-suatab="hours"]')){setTimeout(refreshHours,0);setTimeout(refreshHours,250)}else if(e.target.closest('.sidebar .nav[data-p="sua"],#rpysDesktopHome409 [data-view-action="launch"]')){setTimeout(refreshIfActive,350);setTimeout(refreshIfActive,900)}else if(e.target.closest('#sua .suaControls button')){setTimeout(refreshIfActive,100)}},true);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(refreshIfActive,100)});
setTimeout(refreshIfActive,800);setTimeout(refreshIfActive,3000);
let n=0,iv=setInterval(()=>{install();if(++n>=60)clearInterval(iv)},500);
})();
