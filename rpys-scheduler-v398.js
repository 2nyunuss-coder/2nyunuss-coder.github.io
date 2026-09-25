/* Safety repairs around the existing 6.1.1 engine; no data migration. */
(()=>{
  const clone=x=>JSON.parse(JSON.stringify(x)), own=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
  let run=null;
  const invalidate=()=>{_assignCache={};_allAssignCache=null;_calcCache={};_peopleCache=null};
  function protectedCell(key){
    if(db.rpysCellLocks?.[key])return true;
    if(db.manualDutyOverrides?.[key]||db.assignmentMeta?.[key]?.manual)return true;
    if(!run)return false;
    if(!key.startsWith(run.month+'|'))return true;
    const parts=key.split('|'),col=dutyColumnByKey(parts[1],parts.slice(3).join('|'));
    if(col?.unit!==run.unit)return true;
    return !run.rebuild&&own(run.before.assign,key);
  }
  function mayClear(key){return !!run?.rebuild&&!protectedCell(key)}
  function repairCache(source){
    return source.replace("let s=sig();if(s!==lastSig){lastSig=s;invalidate('assignment-signature')}return old.apply(this,arguments)","if(window.rpysScheduler398?.running())return old.apply(this,arguments);let s=sig();if(s!==lastSig){lastSig=s;invalidate('assignment-signature')}return old.apply(this,arguments)");
  }
  function repair(source){
    const change=(name,next,edits)=>{
      const start=source.indexOf('function '+name+'('),end=source.indexOf('\nfunction '+next+'(',start);
      if(start<0||end<0)throw Error('Liste motoru kaynak kontrolü başarısız: '+name);
      let body=source.slice(start,end);
      for(const [from,to] of edits){if(!body.includes(from))throw Error('Liste motoru kaynak kontrolü başarısız: '+name);body=body.replaceAll(from,to)}
      source=source.slice(0,start)+body+source.slice(end);
    };
    change('distributePolRotation2','polRotationWeeklyPreview',[
      ['  purgeGhostShiftData();','  // Existing data is preserved; disabled columns are excluded by polRotationSlots.'],
      ['delete db.assign[k];if(db.assignmentMeta)delete db.assignmentMeta[k]','if(window.rpysScheduler398.mayClear(k)){delete db.assign[k];if(db.assignmentMeta)delete db.assignmentMeta[k]}'],
      ['  for(let d=1;d<=daysInMonth();d++){','  _assignCache={};_allAssignCache=null;_calcCache={};\n  Object.assign(hours,currentMonthHoursMap(ids));Object.assign(count,currentMonthCountMap(ids));\n  for(let d=1;d<=daysInMonth();d++){'],
      ['let used=new Set(),dailyPool=','let used=new Set(slots.map(s=>Number(db.assign[keyFor("pol",d,s.col.key)]||0)).filter(Boolean)),dailyPool='],
      ['let s=slots[si];if(!isDutyCellApplicable(s.type,s.col,d))continue;','let s=slots[si];if(db.assign[keyFor("pol",d,s.col.key)]||window.rpysScheduler398.protectedCell(keyFor("pol",d,s.col.key))||!isDutyCellApplicable(s.type,s.col,d))continue;'],
      ['count[preferred]=(count[preferred]||0)+1;filled++;','count[preferred]=(count[preferred]||0)+1;filled++;_assignCache={};_allAssignCache=null;_calcCache={};'],
      ['count[chosen]=(count[chosen]||0)+1;filled++;','count[chosen]=(count[chosen]||0)+1;filled++;_assignCache={};_allAssignCache=null;_calcCache={};']
    ]);
    change('autoDistribute','autoDistributePolRotation',[
      ['for(const x of outsiders){delete db.assign[x.k];if(db.assignmentMeta)delete db.assignmentMeta[x.k]}','for(const x of outsiders){if(window.rpysScheduler398.mayClear(x.k)){delete db.assign[x.k];if(db.assignmentMeta)delete db.assignmentMeta[x.k]}}'],
      ['if(unit==="PORTABL + SKOPİ")purgeNonSkopiPoolAssignments();','// Only selected-unit unprotected cells can be rebuilt.'],
      ['delete db.assign[kk];','if(window.rpysScheduler398.protectedCell(kk))continue;\n        delete db.assign[kk];']
    ]);
    change('distributeSkopiSequential','leaveDutyRuleSummary',[
      ['  purgeRestAndLeaveViolations();','  // Validation reports existing conflicts; it never purges other units.'],
      ['  purgeNonSkopiPoolAssignments();',''],
      ['      delete db.assign[k];','      if(!window.rpysScheduler398.mayClear(k))continue;\n      delete db.assign[k];'],
      ['          delete db.assign[kk];','          if(window.rpysScheduler398.protectedCell(kk))continue;\n          delete db.assign[kk];'],
      ['!personHasOverlap(id,nd,nightCol)','!personHasOverlap(id,nd,nightCol)&&window.rpysRest16V397.validateMutations([{key:dayKey,type:"acil",day:d,col:dayCol,pid:id},{key:nightKey,type:"acil",day:nd,col:nightCol,pid:id}]).ok']
    ]);
    change('skopiCanReceivePairStrict','skopiGiveBlankPair',[
      ['  delete db.assign[dayKey];delete db.assign[nightKey];','  if(window.rpysScheduler398.protectedCell(dayKey)||window.rpysScheduler398.protectedCell(nightKey))return false;\n  delete db.assign[dayKey];delete db.assign[nightKey];'],
      ['canTakeShift(id,nd,nightCol,"PORTABL + SKOPİ");','canTakeShift(id,nd,nightCol,"PORTABL + SKOPİ")&&window.rpysRest16V397.validateMutations([{key:dayKey,type:"acil",day,col:dayCol,pid:id},{key:nightKey,type:"acil",day:nd,col:nightCol,pid:id}]).ok;']
    ]);
    change('distributeExactV251','selectedUnitOutsidersV2411',[
      ['!used.has(Number(id))&&v250Available(id,d,unit,daySlots)','!used.has(Number(id))&&v250Available(id,d,unit,daySlots)&&canTakeShiftV2414(id,d,rec.s.col,unit)']
    ]);
    return repairCache(source);
  }
  function activeOn(id,day){
    const p=getPersonById(id);if(!p)return false;
    return typeof personStatusAt==='function'?personStatusAt(p,dateStr(day))==='Aktif':p.status==='Aktif'&&p.active!==false;
  }
  function wrapEligibility(name){
    const base=window[name];if(typeof base!=='function'||base.__rpys398)return;
    const fn=function(id,day,col){
      if(!activeOn(id,day))return false;
      if(run&&col?.key){
        for(const type of ['pol','acil'])if(dutyColumnByKey(type,col.key)&&protectedCell(keyFor(type,day,col.key)))return false;
      }
      return base.apply(this,arguments);
    };fn.__rpys398=true;window[name]=fn;
  }
  function wrapRun(name){
    const base=window[name];if(typeof base!=='function'||base.__rpys398)return;
    const fn=function(){
      if(run)return base.apply(this,arguments);
      if(isMonthLocked()){alert('Bu ay kilitli. Liste değiştirilmedi.');return false}
      const before=clone(db),month=ym(),rebuild=!!document.getElementById('rebuildSelectedUnitV246')?.checked;
      const unit=name==='runPolRotation2'?'POLİKLİNİK RÖNTGEN':name==='distributeSkopiSequential'?'PORTABL + SKOPİ':document.getElementById('autoUnit')?.value;
      const saved={},pending=[];run={before,month,rebuild,unit};
      const lookup=window.dutyColumnByKey,columns=new Map();
      const allMonths=window.allAssignmentsAllMonths,overlap=window.personHasOverlap,staticQueries={};
      let value,error;
      try{
      for(const type of ['pol','acil'])for(const col of dutyColumns(type,{includeDisabled:true}))columns.set(type+'|'+col.key,col);
      window.dutyColumnByKey=function(type,key){const col=columns.get(type+'|'+key);return col?{...col}:lookup.apply(this,arguments)};
      if(typeof allMonths==='function'){
        // Other months cannot change in this transaction (verified before commit).
        // Rebuild only this month's rows when the engine invalidates its caches.
        const historical=allMonths().filter(row=>row.monthKey!==month),people=new Map((db.staff||[]).map(p=>[String(p.id),p]));
        window.allAssignmentsAllMonths=function(){
          if(_allAssignCache)return _allAssignCache;
          const rows=historical.slice();
          for(const [key,pid] of Object.entries(db.assign||{})){
            if(!key.startsWith(month+'|'))continue;
            const p=key.split('|');if(p.length!==4)continue;
            const person=people.get(String(pid)),base=dutyColumnByKey(p[1],p[3]);if(!person||!base)continue;
            const meta=db.assignmentMeta?.[key]||{},col={...base};if(meta.shift)col.shift=meta.shift;if(meta.hours!=null)col.hours=Number(meta.hours);
            rows.push({monthKey:month,type:p[1],day:Number(p[2]),col,person,date:month+'-'+String(p[2]).padStart(2,'0')});
          }
          for(const r of db.importedRecords||[]){if(r.monthKey!==month||isImportedShiftBlocked(r))continue;const person=people.get(String(r.personId));if(person&&r.col)rows.push({monthKey:r.monthKey,type:r.type,day:Number(r.day),col:r.col,person,date:r.date,importedExtra:true,source:r.source})}
          return _allAssignCache=rows;
        };
      }
      if(typeof overlap==='function'){
        let source=null,byPerson=new Map();
        window.personHasOverlap=function(id,day,col,ignoreKey=null){
          const candidate=shiftInterval(day,col);if(!candidate)return false;
          const rows=allAssignmentsAllMonths();
          if(source!==rows){source=rows;byPerson=new Map();for(const row of rows){const pid=Number(row.person.id);if(!byPerson.has(pid))byPerson.set(pid,[]);byPerson.get(pid).push(row)}}
          const previous=new Date(candidate.st);previous.setDate(previous.getDate()-1);previous.setHours(0,0,0,0);
          const first=localYMD(previous),last=localYMD(candidate.en);
          for(const row of byPerson.get(Number(id))||[]){
            if(row.date<first||row.date>last)continue;
            const key=row.monthKey+'|'+row.type+'|'+row.day+'|'+row.col.key;if(ignoreKey&&key===ignoreKey)continue;
            const t=parseShiftTimes(row.col);if(!t)continue;
            const [y,m]=row.monthKey.split('-').map(Number),st=new Date(y,m-1,row.day,t.sh,t.sm),en=new Date(y,m-1,row.day,t.eh,t.em);if(en<=st)en.setDate(en.getDate()+1);
            if(intervalsOverlap(candidate,{st,en}))return true;
          }
          return false;
        };
      }
      // These queries depend on unchanged leave/calendar/status data, never on assignments.
      for(const name of ['isOnLeave','isMandatoryPreLeaveThursday','isMandatoryReturnWorkday','isPreLeaveThursday','isReturnWeekendBlockedV2414','isProtectedLeaveWeekend','isSkopiPreLeaveFridayBlocked','fullWeekLeaveInfo','leaveReturnInfoV2414','finalObligation']){
        if(typeof window[name]!=='function')continue;
        const baseQuery=window[name],cache=new Map();staticQueries[name]=baseQuery;
        window[name]=function(){const k=JSON.stringify(Array.from(arguments));if(!cache.has(k))cache.set(k,baseQuery.apply(this,arguments));return cache.get(k)};
      }
      for(const key of ['save','saveNowV245','flushSave'])if(typeof window[key]==='function'){saved[key]=window[key];window[key]=(...args)=>{pending.push(args);return null}}
        const beforeRest=window.rpysRest16V397.allViolations();
        value=window.rpysRest16V397.runIndexed(()=>base.apply(this,arguments));
        if(value&&typeof value.then==='function')throw Error('Beklenmeyen asenkron motor; liste korunarak işlem durduruldu.');
        for(const key of window.rpysRest16V397.allViolations().keys())if(!beforeRest.has(key))throw Error('16 saat ve üzeri çalışma sonrası ertesi gün dinlenme kuralı ihlali engellendi.');
        if(JSON.stringify(db.rpysCellLocks)!==JSON.stringify(before.rpysCellLocks))throw Error('Hücre kilitleri değiştirilemez.');
        for(const key of new Set([...Object.keys(before.assign||{}),...Object.keys(db.assign||{}),...Object.keys(before.assignmentMeta||{}),...Object.keys(db.assignmentMeta||{}),...Object.keys(before.rpysCellLocks||{})])){
          if((protectedCell(key)||before.rpysCellLocks?.[key]||before.manualDutyOverrides?.[key]||before.assignmentMeta?.[key]?.manual)&&
            ['assign','assignmentMeta','manualDutyOverrides'].some(field=>JSON.stringify(db[field]?.[key])!==JSON.stringify(before[field]?.[key])))throw Object.assign(Error('Korunan hücre değişikliği engellendi.'),{cellKey:key});
        }
      }catch(e){db=before;invalidate();error=e}
      finally{for(const [key,original] of Object.entries(saved))window[key]=original;for(const [key,original] of Object.entries(staticQueries))window[key]=original;window.dutyColumnByKey=lookup;if(allMonths)window.allAssignmentsAllMonths=allMonths;if(overlap)window.personHasOverlap=overlap;run=null}
      if(error){try{renderAll()}catch(_){}console.error('RPYS398 motor koruması',error,error.cellKey||'');alert('İşlem tamamlanamadı; önceki liste aynen korundu.\n\n'+(error.message||error));return false}
      if(pending.length){const saveFn=saved.saveNowV245||saved.save;saveFn?.({allowAssignDrop:rebuild,label:'6.1.1 güvenli liste dağıtımı'});}
      invalidate();return value;
    };fn.__rpys398=true;window[name]=fn;
  }
  function install(){
    if(typeof window.autoDistribute!=='function'||typeof window.canTakeShift!=='function')return;
    ['canTakeShift','canTakeShiftV2413','canTakeShiftV2414'].forEach(wrapEligibility);
    ['autoDistribute','runPolRotation2','distributeSkopiSequential'].forEach(wrapRun);
    document.documentElement.dataset.rpysSchedulerSafety='398';
  }
  window.rpysScheduler398={repair,repairCache,install,protectedCell,mayClear,running:()=>!!run};
  install();
  window.addEventListener('rpys-direct-core-ready',()=>[50,400,2800].forEach(ms=>setTimeout(install,ms)));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);
  [1000,3500].forEach(ms=>setTimeout(install,ms));
})();
