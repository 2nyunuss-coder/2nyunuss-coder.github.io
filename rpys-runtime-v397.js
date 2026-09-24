(()=>{
  if(window.__RPYS_REST_16_HOURS_V397__)return;
  window.__RPYS_REST_16_HOURS_V397__=true;

  const REST_LIMIT=16;
  const safe=(fn,fallback)=>{try{return fn()}catch(_){return fallback}};
  const pad=n=>String(n).padStart(2,"0");

  function database(){return safe(()=>db,window.db||{})||{}}
  function currentMonth(){return safe(()=>String(ym()||""),String(document.getElementById("month")?.value||""))}
  function addDays(date,amount){
    const d=new Date(String(date)+"T12:00:00");
    if(Number.isNaN(d.getTime()))return "";
    d.setDate(d.getDate()+Number(amount||0));
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  }
  function targetDate(day){
    if(/^\d{4}-\d{2}-\d{2}$/.test(String(day||"")))return String(day);
    return safe(()=>dateStr(Number(day)),`${currentMonth()}-${pad(Number(day))}`)
  }
  function parseShiftHours(value){
    const m=String(value||"").match(/(\d{1,2})\s*[:.]\s*(\d{2})\s*[-–—]\s*(\d{1,2})\s*[:.]\s*(\d{2})/);
    if(!m)return 0;
    const start=Number(m[1])*60+Number(m[2]),end=Number(m[3])*60+Number(m[4]);
    let minutes=end-start;if(minutes<=0)minutes+=1440;
    return Math.round(minutes/6)/10
  }
  function workHours(col={},meta={},fallback={}){
    for(const value of [meta?.hours,col?.hours,fallback?.hours]){
      const n=Number(value);if(Number.isFinite(n)&&n>0)return n
    }
    return parseShiftHours(meta?.shift||col?.shift||fallback?.shift||"")
  }
  function column(type,key){return safe(()=>dutyColumnByKey(type,key),null)}
  function personName(id){
    const p=safe(()=>(database().staff||[]).find(x=>Number(x.id)===Number(id)),null);
    return String(p?.name||p?.adSoyad||p?.fullName||`Personel #${id}`)
  }
  function recordDate(month,day){return `${month}-${pad(Number(day))}`}

  function recordsFor(personId){
    const data=database(),pid=Number(personId),out=[];
    for(const [key,value] of Object.entries(data.assign||{})){
      if(Number(value)!==pid)continue;
      const parts=String(key).split("|");if(parts.length<4)continue;
      const month=parts[0],type=parts[1],day=Number(parts[2]),colKey=parts.slice(3).join("|"),meta=(data.assignmentMeta||{})[key]||{},col=column(type,colKey)||{};
      out.push({key,date:recordDate(month,day),hours:workHours(col,meta),type,day,colKey,source:"main"})
    }
    for(let i=0;i<(data.importedRecords||[]).length;i++){
      const row=data.importedRecords[i];if(Number(row?.personId)!==pid)continue;
      if(safe(()=>typeof isImportedShiftBlocked==="function"&&isImportedShiftBlocked(row),false))continue;
      const date=String(row.date||recordDate(row.monthKey,row.day));
      out.push({key:`__imported_${i}`,date,hours:workHours(row.col||{},row.meta||{},row),source:"imported"})
    }
    return out
  }
  function totalsFor(records){
    const hours=new Map(),counts=new Map();
    for(const row of records||[]){
      const date=String(row.date||"");if(!date)continue;
      hours.set(date,(hours.get(date)||0)+Number(row.hours||0));
      counts.set(date,(counts.get(date)||0)+1)
    }
    return {hours,counts}
  }
  function violationMap(records){
    const {hours,counts}=totalsFor(records),out=new Map();
    for(const [date,total] of hours){
      const next=addDays(date,1);
      if(Number(total)+0.0001<REST_LIMIT||!(counts.get(next)>0))continue;
      out.set(`${date}|${next}`,{longDate:date,nextDate:next,hours:Math.round(Number(total)*10)/10})
    }
    return out
  }
  function normalizeMutation(mutation,index){
    const data=database(),m={...(mutation||{})},type=String(m.type||""),day=Number(m.day||0),colKey=String(m.colKey||m.col?.key||"");
    const key=String(m.key||`__rpys397_${Date.now()}_${index}`),col=m.col||column(type,colKey)||{},meta=m.meta||{};
    return {...m,key,type,day,colKey,col,date:String(m.date||targetDate(day)),pid:Number(m.pid||0),oldPid:m.oldPid==null?Number(data.assign?.[key]||0):Number(m.oldPid||0),hours:workHours(col,meta,m)}
  }
  function applyMutations(records,pid,mutations){
    const keys=new Set(mutations.map(m=>m.key)),out=(records||[]).filter(row=>!keys.has(String(row.key)));
    for(const m of mutations)if(Number(m.pid)===Number(pid))out.push({key:m.key,date:m.date,hours:m.hours,source:"candidate"});
    return out
  }
  function validateMutations(input){
    const mutations=(input||[]).map(normalizeMutation),ids=new Set();
    for(const m of mutations){if(m.oldPid)ids.add(m.oldPid);if(m.pid)ids.add(m.pid)}
    const violations=[];
    for(const pid of ids){
      const before=recordsFor(pid),beforeMap=violationMap(before),afterMap=violationMap(applyMutations(before,pid,mutations));
      for(const [key,item] of afterMap)if(!beforeMap.has(key))violations.push({...item,key,personId:Number(pid),personName:personName(pid)})
    }
    return {ok:violations.length===0,violations,mutations}
  }
  function candidateResult(personId,day,col){
    return validateMutations([{pid:Number(personId),date:targetDate(day),day:Number(day),col:col||{},hours:workHours(col||{})}])
  }
  function previousDayHours(personId,day){
    const previous=addDays(targetDate(day),-1),sum=recordsFor(personId).filter(x=>x.date===previous).reduce((n,x)=>n+Number(x.hours||0),0);
    return Math.round(sum*10)/10
  }
  function allViolations(){
    const data=database(),ids=new Set((data.staff||[]).map(p=>Number(p.id)).filter(Boolean));
    for(const value of Object.values(data.assign||{}))if(Number(value))ids.add(Number(value));
    for(const row of data.importedRecords||[])if(Number(row?.personId))ids.add(Number(row.personId));
    const out=new Map();
    for(const pid of ids)for(const [key,item] of violationMap(recordsFor(pid)))out.set(`${pid}|${key}`,{...item,personId:pid,personName:personName(pid)});
    return out
  }
  function violationText(result,prefix="Atama yapılamadı"){
    const rows=(result?.violations||[]).slice(0,6).map(v=>`• ${v.personName}: ${v.longDate} günü ${v.hours} saat → ${v.nextDate} günü dinlenme`);
    return `${prefix}.\n\n16 saat ve üzeri çalışan personel ertesi takvim gününde hiçbir göreve yazılamaz.${rows.length?"\n\n"+rows.join("\n"):""}`
  }
  function invalidate(){
    safe(()=>{_assignCache={}},null);safe(()=>{_allAssignCache=null},null);safe(()=>{_calcCache={}},null)
  }

  function installCoreRule(){
    const blocking=function(personId,day){return previousDayHours(personId,day)};blocking.__rpys397=true;
    const worked=function(personId,day){return previousDayHours(personId,day)>=REST_LIMIT};worked.__rpys397=true;
    window.previousDayBlockingHours=blocking;window.workedLongPreviousDay=worked;
    const oldDuty=window.previousDayHadDuty;
    if(typeof oldDuty==="function"&&!oldDuty.__rpys397){
      const wrapped=function(personId,day){return previousDayHours(personId,day)>=REST_LIMIT||oldDuty.apply(this,arguments)};
      wrapped.__rpys397=true;wrapped.__rpys397base=oldDuty;window.previousDayHadDuty=wrapped
    }
    const oldOvernight=window.isOvernightOrDutyShift;
    if(typeof oldOvernight==="function"&&!oldOvernight.__rpys397){
      const wrapped=function(col){return workHours(col||{})>=REST_LIMIT||oldOvernight.apply(this,arguments)};
      wrapped.__rpys397=true;wrapped.__rpys397base=oldOvernight;window.isOvernightOrDutyShift=wrapped
    }
  }
  function wrapEligibility(name){
    const base=window[name];if(typeof base!=="function"||base.__rpys397)return;
    const wrapped=function(personId,day,col){if(!candidateResult(personId,day,col).ok)return false;return base.apply(this,arguments)};
    wrapped.__rpys397=true;wrapped.__rpys397base=base;window[name]=wrapped
  }
  function wrapSetAssign(){
    const base=window.setAssign;if(typeof base!=="function"||base.__rpys397)return;
    const wrapped=function(type,day,colKey,id){
      const pid=Number(id||0);
      if(pid){
        const key=safe(()=>keyFor(type,Number(day),colKey),`${currentMonth()}|${type}|${Number(day)}|${colKey}`),result=validateMutations([{key,type,day:Number(day),colKey,pid}]);
        if(!result.ok){alert(violationText(result));return false}
      }
      return base.apply(this,arguments)
    };
    wrapped.__rpys397=true;wrapped.__rpys397base=base;window.setAssign=wrapped
  }
  function selectedDutyCellsNow(){
    const direct=safe(()=>[...(selectedDutyCells||[])].filter(Boolean),[]);
    return direct.length?direct:[...document.querySelectorAll(".dropDutyCell.dutySelected")]
  }
  function wrapBulkSelection(){
    const base=window.applyDutyBulkSelection;if(typeof base!=="function"||base.__rpys397)return;
    const wrapped=function(){
      const pid=Number(document.getElementById("dutyBulkPerson")?.value||0),cells=selectedDutyCellsNow();
      if(pid&&cells.length){
        const mutations=cells.map(cell=>({key:safe(()=>keyFor(cell.dataset.type,Number(cell.dataset.day),cell.dataset.col),""),type:cell.dataset.type,day:Number(cell.dataset.day),colKey:cell.dataset.col,pid})),result=validateMutations(mutations);
        if(!result.ok){alert(violationText(result,"Toplu atama uygulanmadı"));return false}
      }
      return base.apply(this,arguments)
    };
    wrapped.__rpys397=true;wrapped.__rpys397base=base;window.applyDutyBulkSelection=wrapped
  }
  function wrapDutyMove(){
    const base=window.validateDutyMove;if(typeof base!=="function"||base.__rpys397)return;
    const wrapped=function(src,targetType,targetDay,targetColKey){
      const verdict=base.apply(this,arguments);if(!verdict?.ok||!src)return verdict;
      const targetPid=Number(verdict.targetPid||0),mutations=[
        {key:src.sourceKey,type:src.type,day:Number(src.day),colKey:src.colKey,pid:verdict.swap?targetPid:0,col:verdict.sourceCol},
        {key:verdict.targetKey,type:targetType,day:Number(targetDay),colKey:targetColKey,pid:Number(src.pid),col:verdict.targetCol}
      ],result=validateMutations(mutations);
      return result.ok?verdict:{...verdict,ok:false,reason:violationText(result,"Taşıma yapılamadı").replace(/^Taşıma yapılamadı\.\n\n/,"")}
    };
    wrapped.__rpys397=true;wrapped.__rpys397base=base;window.validateDutyMove=wrapped
  }
  function wrapConflictApproval(){
    const base=window.rpysApproveDutyConflict384;if(typeof base!=="function"||base.__rpys397)return;
    const wrapped=function(pid,type,day,colKey,targetKey){
      const key=targetKey||safe(()=>keyFor(type,Number(day),colKey),""),result=validateMutations([{key,type,day:Number(day),colKey,pid:Number(pid)}]);
      if(!result.ok){alert(violationText(result));return false}
      return base.apply(this,arguments)
    };
    wrapped.__rpys397=true;wrapped.__rpys397base=base;window.rpysApproveDutyConflict384=wrapped
  }
  function generatedRecords(personId,generated){
    return (generated||[]).filter(x=>Number(x.personId)===Number(personId)).map((x,i)=>({key:`__generated_${i}`,date:String(x.date||""),hours:workHours({}, {}, x)}))
  }
  function wrapSimulation(){
    const base=window.simulationCanPlacePerson;if(typeof base!=="function"||base.__rpys397)return;
    const wrapped=function(person,slot,generated){
      if(!base.apply(this,arguments))return false;
      const pid=Number(person?.id||0),date=String(slot?.date||""),before=recordsFor(pid).concat(generatedRecords(pid,generated)),after=before.concat([{key:"__simulation_candidate",date,hours:workHours({}, {}, slot)}]);
      const old=violationMap(before),next=violationMap(after);for(const key of next.keys())if(!old.has(key))return false;
      return true
    };
    wrapped.__rpys397=true;wrapped.__rpys397base=base;window.simulationCanPlacePerson=wrapped
  }
  function restoreSnapshot(snapshot,label){
    const data=database();data.assign=JSON.parse(JSON.stringify(snapshot.assign));data.assignmentMeta=JSON.parse(JSON.stringify(snapshot.meta));invalidate();
    safe(()=>{if(typeof saveNowV245==="function")saveNowV245({allowAssignDrop:true,label});else save({allowAssignDrop:true,label})},null);
    safe(()=>renderAll(),null)
  }
  function snapshot(){const data=database();return {assign:JSON.parse(JSON.stringify(data.assign||{})),meta:JSON.parse(JSON.stringify(data.assignmentMeta||{})),violations:allViolations()}}
  function rollbackIfNewViolation(before,label){
    const after=allViolations(),fresh=[];for(const [key,item] of after)if(!before.violations.has(key))fresh.push(item);
    if(!fresh.length)return false;
    restoreSnapshot(before,"16 saat dinlenme kuralı • güvenli geri alma");
    alert(violationText({violations:fresh},`${label} geri alındı; önceki liste korundu`));return true
  }
  function wrapTransaction(name,label){
    const base=window[name];if(typeof base!=="function"||base.__rpys397)return;
    const wrapped=function(){
      const before=snapshot(),result=base.apply(this,arguments);
      if(result&&typeof result.then==="function")return result.then(value=>{rollbackIfNewViolation(before,label);return value},error=>{throw error});
      rollbackIfNewViolation(before,label);return result
    };
    wrapped.__rpys397=true;wrapped.__rpys397base=base;window[name]=wrapped
  }
  function install(){
    installCoreRule();
    ["canTakeShift","canTakeShiftV2413","canTakeShiftV2414"].forEach(wrapEligibility);
    wrapSetAssign();wrapBulkSelection();wrapDutyMove();wrapConflictApproval();wrapSimulation();
    wrapTransaction("autoDistribute","Otomatik dağıtım");
    wrapTransaction("distributeSkopiSequential","Skopi dağıtımı");
    wrapTransaction("applyScenario","Senaryo uygulaması")
  }

  let pasteGuard=null;
  function armPasteGuard(){
    const before=snapshot();pasteGuard={before,done:false};
    for(const delay of [80,350,1000])setTimeout(()=>{
      if(!pasteGuard||pasteGuard.before!==before||pasteGuard.done)return;
      if(rollbackIfNewViolation(before,"Kopyala-yapıştır"))pasteGuard.done=true
    },delay)
  }
  document.addEventListener("click",event=>{if(event.target?.closest?.("#rpysPaste353"))armPasteGuard()},true);
  document.addEventListener("keydown",event=>{if((event.ctrlKey||event.metaKey)&&String(event.key||"").toLowerCase()==="v"&&!/INPUT|TEXTAREA/.test(String(event.target?.tagName||"")))armPasteGuard()},true);

  window.rpysRest16V397={limit:REST_LIMIT,parseShiftHours,recordsFor,previousDayHours,validateMutations,candidateResult,allViolations,install};
  window.addEventListener("rpys-direct-core-ready",()=>[0,160,700,2200].forEach(ms=>setTimeout(install,ms)));
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install);else install();
  setTimeout(install,900);setTimeout(install,3000)
})();
