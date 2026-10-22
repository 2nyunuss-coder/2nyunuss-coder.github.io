/* RPYS adapter for the shared, per-unit distribution rule catalogue. */
(()=>{
'use strict';if(window.rpysRules421||!window.RPYSRules)return;const R=RPYSRules;let context='';
const currentUnit=()=>context||window.rpysScheduler398?.currentUnit?.()||document.getElementById('autoUnit')?.value||'';
const withUnit=(unit,fn)=>{const old=context;context=unit||currentUnit();try{return fn()}finally{context=old}};
function settings(unit=currentUnit()){
 const global=typeof ruleCfgBase==='function'?ruleCfgBase():{},legacy=db.unitRuleConfig?.[unit]||{},saved=db.distributionRulesV421?.[unit]||{};
 return R.config({...global,...legacy,leaveWeekendBlock:legacy.leaveWeekendWork!==true,...saved});
}
let ruleCfgBase=null;
const enabled=(unit,key)=>settings(unit||currentUnit())[key]!==false;
function ownCustom(unit){return settings(unit).custom.filter(r=>r.enabled!==false)}
function textRules(unit){const overrides=settings(unit).legacyRules||{};return (db.customTextRules||[]).map((r,i)=>({...r,active:Object.prototype.hasOwnProperty.call(overrides,String(r.id??('index:'+i)))?overrides[String(r.id??('index:'+i))]!==false:r.active!==false}))}
function customRules(unit){const cfg=settings(unit),baseRules=[];if(cfg.maxDutiesEnabled)baseRules.push({active:true,unit,kind:'unitPersonMonthlyMax',max:Number(cfg.maxDuties)});return [...baseRules,...ownCustom(unit).flatMap(r=>{const base={active:true,unit,personId:r.personId?Number(r.personId):null,name:r.name,id:r.id};if(r.type==='maxDuties')return [{...base,kind:r.personId?'personUnitMonthlyMax':'unitPersonMonthlyMax',max:Number(r.value)}];if(r.type==='maxConsecutive')return [{...base,kind:'unitConsecutive',maxConsecutive:Number(r.value)}];return []})]}
function customReason(id,day,col,unit){
 unit=unit||col?.unit||currentUnit();const date=dateStr(day),rows=assignmentsMonth().filter(a=>Number(a.person?.id)===Number(id)&&a.col.unit===unit);
 const cfg=settings(unit);if(cfg.maxDutiesEnabled&&rows.length>=Number(cfg.maxDuties))return 'Aylık görev üst sınırı';if(cfg.maxHoursEnabled&&rows.reduce((n,a)=>n+Number(a.col.hours||0),Number(col.hours||0))>Number(cfg.maxHours))return 'Aylık saat üst sınırı';
 for(const r of ownCustom(unit)){if(r.personId&&Number(r.personId)!==Number(id))continue;
  if(r.type==='blockedWeekdays'&&r.weekdays.includes(new Date(date+'T12:00:00Z').getUTCDay()))return r.name;
  if(r.type==='blockedDates'&&r.dates.includes(date))return r.name;
  if(r.type==='maxDuties'&&rows.length>=Number(r.value))return r.name;
  if(r.type==='maxHours'&&rows.reduce((n,a)=>n+Number(a.col.hours||0),Number(col.hours||0))>Number(r.value))return r.name;
  if(r.type==='maxConsecutive'){const ds=new Set(rows.map(a=>Number(a.day)));ds.add(Number(day));const max=Number(r.value);let run=0;for(let d=1;d<=daysInMonth();d++){run=ds.has(d)?run+1:0;if(run>max)return r.name}}
 }return '';
}
function requiredDates(id,unit){return ownCustom(unit).filter(r=>r.type==='requiredDate'&&(!r.personId||Number(r.personId)===Number(id))).flatMap(r=>r.dates.filter(date=>date.slice(0,7)===ym()).map(date=>({day:Number(date.slice(8)),reason:r.name})))}
function install(){
 const sidebar=document.querySelector?.('.sidebar');if(sidebar&&!document.getElementById('rpysRulesCenter421')){const area=document.createElement('div');area.id='rpysRulesCenter421';area.style.cssText='padding:10px;margin:8px 0;border:1px solid #6482a0;border-radius:8px';const b=document.createElement('button');b.type='button';b.className='btn alt';b.textContent='⚙ Kural ekle / düzenle';b.onclick=()=>open(currentUnit()||(typeof allUnitNames==='function'?allUnitNames()[0]:''));const v=document.createElement('small');v.id='rpys-app-version';v.style.cssText='display:block;margin-top:6px';v.textContent='RPYS · 20261022-say-14';area.append(b,v);const brand=sidebar.querySelector('.brand');if(brand)brand.after(area);else sidebar.append(area)}
 if(typeof window.ruleCfg==='function'&&!window.ruleCfg.__rules421){ruleCfgBase=window.ruleCfg;const f=function(){const c=settings();return {...ruleCfgBase(),...c,nextDayBlock:c.noPostDuty,spouseSameDay:c.spouseSameDay,maxGap:c.maxGapDays}};f.__rules421=true;window.ruleCfg=f;}
 const wrap=(name,fn)=>{const base=window[name];if(typeof base!=='function'||base.__rules421)return;const f=function(...args){return fn.call(this,base,args)};f.__rules421=true;window[name]=f};
 wrap('unitRulesV251',(base,[u])=>{const b=base(u),s=settings(u);return {...b,...s,leaveWeekendWork:!s.leaveWeekendBlock}});
 wrap('unitMaxGapDaysV251',(base,[u])=>Number(settings(u).maxGapDays));
 for(const name of ['previousDayHadDuty','workedLongPreviousDay'])wrap(name,(base,args)=>enabled(currentUnit(),'noPostDuty')?base(...args):false);
 wrap('personHasOverlap',(base,args)=>enabled(currentUnit(),'overlap')?base(...args):false);
 wrap('personAssignedSameDay',(base,args)=>enabled(currentUnit(),'avoidSameDay')?base(...args):false);
 wrap('lastLongDutyGapDays',(base,args)=>enabled(currentUnit(),'minGapEnabled')&&Number(settings().minGap)>0?base(...args):null);
 wrap('consecutiveAlternatePattern',(base,[id,d])=>{if(!enabled(currentUnit(),'avoidAlternate'))return false;const dates=new Set(typeof longDutyDates==='function'?longDutyDates(id):[]),day=dateStr(d),back=n=>new Date(Date.parse(day+'T12:00:00Z')-n*86400000).toISOString().slice(0,10);return dates.has(back(2))&&dates.has(back(4))});
 wrap('isProtectedLeaveWeekend',(base,args)=>enabled(args[2]||currentUnit(),'leaveWeekendBlock')?base(...args):false);
 wrap('isReturnWeekendBlockedV2414',(base,args)=>enabled(currentUnit(),'leaveWeekendBlock')?base(...args):false);
 wrap('isSkopiPreLeaveFridayBlocked',(base,args)=>enabled(currentUnit(),'preLeaveThursday')?base(...args):false);
 for(const [name,key] of [['isReturnMondayRequiredV251','returnMonday'],['isPreLeaveThursdayRequiredV251','preLeaveThursday']])wrap(name,(base,args)=>enabled(args[2]||currentUnit(),key)?base(...args):false);
 wrap('isOnLeave',(base,args)=>{const distributing=!!context||window.rpysScheduler398?.running?.()||window.rpysTargets399?.isPlanning?.();return distributing&&!enabled(currentUnit(),'blockLeave')?false:base(...args)||!!window.rpysScheduler398?.spouseUnavailable(args[0],args[1],ym())});
 wrap('isReserved',(base,args)=>enabled(currentUnit(),'blockReserve')?base(...args):false);
 wrap('schedulerHardViolationsV2494',(base,args)=>{const out=base(...args),c=settings();for(const key of out.keys()){const type=String(key).split('|')[1];if(type==='leave'&&!c.blockLeave||type==='rest'&&!c.noPostDuty||type==='leaveweekend'&&!c.leaveWeekendBlock)out.delete(key)}return out});
 const exempt=(id,day)=>{const other=typeof spouseOf==='function'?spouseOf(id):null;return !!other&&(!!window.rpysScheduler398?.spouseUnavailable(other,day,ym())||!!window.rpysScheduler398?.spouseWorkingOnDay(other,day,ym()))};
 wrap('strictSpouseDayEligible',(base,args)=>!enabled(currentUnit(),'spouseSameDay')||exempt(args[0],args[1])||base(...args));
 for(const name of ['enforceSpouseTodayCandidates','spouseCandidatesV251','balancedSpouseFilterV2412','spouseAnchorGateV2413'])wrap(name,(base,args)=>{const result=base(...args),allowed=new Set((result||[]).map(Number));return (args[0]||[]).filter(id=>allowed.has(Number(id))||exempt(id,args[1]))});
 wrap('crossUnitSpouseMismatchV2411',(base,[ids,unit])=>{const selected=new Set((ids||[]).map(Number)),rows=assignmentsMonth();return (window.rpysScheduler398?.spouseDayViolations(ym())||[]).filter(x=>(selected.has(x.first)||selected.has(x.second))&&rows.some(a=>a.col.unit===unit&&Number(a.day)===x.day&&selected.has(Number(a.person.id)))).map(x=>(getPersonById(x.first)?.name||x.first)+' / '+(getPersonById(x.second)?.name||x.second)+': '+x.day+'. gün eş çalışma günü eksik')});
 wrap('spouseOf',(base,args)=>{const distributing=!!context||window.rpysScheduler398?.running?.()||window.rpysTargets399?.isPlanning?.();return distributing&&!enabled(currentUnit(),'spouseSameDay')?null:base(...args)});
 for(const name of ['canTakeShift','canTakeShiftV2413','canTakeShiftV2414'])wrap(name,(base,args)=>withUnit(args[3]||args[2]?.unit,()=>!customReason(...args)&&base(...args)));
 for(const name of ['autoDistribute','runPolRotation2','distributeSkopiSequential','distributeExactV251'])wrap(name,(base,args)=>withUnit(name==='runPolRotation2'?'POLİKLİNİK RÖNTGEN':name==='distributeSkopiSequential'?'PORTABL + SKOPİ':typeof args[0]==='string'?args[0]:currentUnit(),()=>base(...args)));
 const host=document.getElementById('autoPeople')?.closest('.autoBox');if(host&&!document.getElementById('rpysRulesButton421')){const b=document.createElement('button');b.id='rpysRulesButton421';b.type='button';b.className='btn alt';b.textContent='⚙ Birim kural listesi';b.onclick=()=>open(currentUnit());(host.querySelector('.toolbar')||host.firstElementChild||host).append(b)}
 for(const name of ['renderAutoPanel','onAutoUnitChanged'])wrap(name,(base,args)=>{const r=base(...args);setTimeout(install,0);return r});
}
function open(unit=currentUnit()){
 if(!unit)return alert('Önce birim seçin.');const legacy=textRules(unit).map((r,i)=>({...r,_ruleKey:String(r.id??('index:'+i))})).filter(r=>r.kind!=='config'&&(!r.unit||r.unit===unit));
 return R.openPanel({unit,units:typeof allUnitNames==='function'?allUnitNames():[unit],onUnitChange:u=>open(u),settings:settings(unit),people:db.staff||[],legacy,onSave:(cfg,edited)=>{
  cfg.legacyRules={...(cfg.legacyRules||{}),...Object.fromEntries(edited.map(r=>[r._ruleKey,r.active!==false]))};db.distributionRulesV421??={};db.distributionRulesV421[unit]=cfg;db.unitRuleConfig??={};db.unitRuleConfig[unit]={...(db.unitRuleConfig[unit]||{}),...cfg,leaveWeekendWork:!cfg.leaveWeekendBlock};
  window.__RPYS_LAST_USER_EDIT_V396__=Date.now();_assignCache={};_allAssignCache=null;_calcCache={};saveNowV245({label:unit+' kural listesi'});window.rpysTargets399?.render();window.renderAutoUnitRuleSummaryV251?.();
 }});
}
window.rpysRules421={settings,enabled,currentUnit,withUnit,open,textRules,customRules,customReason,requiredDates,install};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();window.addEventListener('rpys-direct-core-ready',()=>[0,300,1200,3000].forEach(ms=>setTimeout(install,ms)));[900,3500].forEach(ms=>setTimeout(install,ms));
})();
