(()=>{
if(window.__RPYS_PATCH323__)return;window.__RPYS_PATCH323__=1;
function obj(k){try{if(db[k]==null)db[k]={};}catch(_){}}
function arr(k){try{if(db[k]==null)db[k]=[];}catch(_){}}
function normalize(){
  ['assign','assignmentMeta','unitPools','unitRuleConfig','distributionWarnings','distributionEmptyReasons','v251PlanAudit','manualDutyOverrides','sayTextObligationReduction','sayTextNoObligationReduction','obligationOverride','reserves','lockedMonths','dutyCellOverrides','monthHistory','history','rpysCellLocks','settings','ruleConfig'].forEach(obj);
  ['staff','leaves','spousePairs','importedRecords','skopiEligible','holidays','auditLog'].forEach(arr);
  try{if(db.specialAssignments==null)db.specialAssignments={};if(db.specialAssignments.gecici==null)db.specialAssignments.gecici=[];if(db.specialAssignments.ketem==null)db.specialAssignments.ketem=[];}catch(_){}
  try{if(db.polRotation2==null)db.polRotation2={};for(const k of ['orders','audit','baseWeek','settings'])if(db.polRotation2[k]==null)db.polRotation2[k]={};}catch(_){}
  try{if(db.shiftStudio==null)db.shiftStudio={};if(db.shiftStudio.disabled==null)db.shiftStudio.disabled={};if(db.shiftStudio.disabledAt==null)db.shiftStudio.disabledAt={};if(db.shiftStudio.custom==null)db.shiftStudio.custom=[];}catch(_){}
  try{if(typeof repairCoreData==='function')repairCoreData()}catch(_){}
}
normalize();
for(const name of ['autoDistribute','runPolRotation2']){
  try{const old=window[name];if(typeof old==='function'&&!old.__p323){const f=function(){normalize();try{_assignCache={};_allAssignCache=null;_calcCache={}}catch(_){}return old.apply(this,arguments)};f.__p323=1;window[name]=f;}}catch(_){}
}
const oldErr=console.error.bind(console);console.error=function(...a){try{if(String(a[0]||'').includes('nöbet motoru'))window.__RPYS_LAST_DIST_ERROR__=String(a[1]?.stack||a[1]?.message||a[1]||'')}catch(_){}return oldErr(...a)};
console.log('RPYS PATCH323 yeni-ay dağıtım başlangıç koruması aktif');
})();