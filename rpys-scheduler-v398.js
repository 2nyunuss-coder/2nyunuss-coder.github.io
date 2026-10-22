/* Safety repairs around the existing 6.1.1 engine; no data migration. */
(()=>{
  if(window.rpysScheduler398?.runTargets)return;
  const clone=x=>JSON.parse(JSON.stringify(x)), own=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
  let run=null,targetRunner=null;
  const invalidate=()=>{_assignCache={};_allAssignCache=null;_calcCache={};_peopleCache=null};
  function sayHoursOnly(key,data=db){
    const override=data.manualDutyOverrides?.[key],meta=data.assignmentMeta?.[key];
    const sayReason=override?.reason==='Saymanlık mesai saati değişikliği'||meta?.source==='Saymanlık manuel saat';
    const samePerson=!override||Number(override.oldPid||0)===Number(override.newPid||0);
    return !!sayReason&&samePerson;
  }
  function manualAssignmentCell(key,data=db){
    const assigned=Number(data.assign?.[key]||0);
    if(!assigned||sayHoursOnly(key,data))return false;
    const override=data.manualDutyOverrides?.[key],meta=data.assignmentMeta?.[key];
    if(override){
      if(override.newPid!=null)return Number(override.newPid)===assigned;
      if(/temiz|silme/i.test(String(override.reason||'')))return false;
      return true;
    }
    return !!meta?.manual;
  }
  function manualBadgeHtml(key){
    return db.manualDutyOverrides?.[key]?'<span class="manualSyncBadge" role="img" aria-label="Elle düzenlendi; Saymanlıkla senkron" title="Elle düzenlendi • Saymanlıkla senkron" style="font-size:11px;line-height:1;padding:2px 3px">✎</span>':'';
  }
  function protectedCell(key){
    const reference=run?.before||db;
    if(reference.rpysCellLocks?.[key])return true;
    if(manualAssignmentCell(key,reference))return true;
    if(!run)return false;
    if(!key.startsWith(run.month+'|'))return true;
    const parts=key.split('|'),col=dutyColumnByKey(parts[1],parts.slice(3).join('|'));
    if(col?.unit!==run.unit)return true;
    if(run.targetIds&&Number(reference.assign?.[key]||0)&&!run.targetIds.has(Number(reference.assign[key])))return true;
    return !run.rebuild&&!!Number(run.before.assign?.[key]||0);
  }
  function mayClear(key){return !!run?.rebuild&&!protectedCell(key)}
  function repairCache(source){
    return source.replace("let s=sig();if(s!==lastSig){lastSig=s;invalidate('assignment-signature')}return old.apply(this,arguments)","if(window.rpysScheduler398?.running()||window.rpysTargets399?.isPlanning?.())return old.apply(this,arguments);let s=sig();if(s!==lastSig){lastSig=s;invalidate('assignment-signature')}return old.apply(this,arguments)");
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
    change('enforceSkopiLeaveAnchors','distributeSkopiSequential',[
      ['if(db.assign[k]&&(db.assignmentMeta?.[k]?.manual||db.manualDutyOverrides?.[k]))','if(db.assign[k]&&window.rpysScheduler398.manualAssignmentCell(k))']
    ]);
    change('distributeSkopiSequential','leaveDutyRuleSummary',[
      ['  purgeRestAndLeaveViolations();','  // Validation reports existing conflicts; it never purges other units.'],
      ['  let finalMetrics=skopiMetricState(ids),','  window.rpysScheduler398.alignSpouseDays("PORTABL + SKOPİ",ids,audit);\n  let finalMetrics=skopiMetricState(ids),'],
      ['  if(anchorResult.warnings.length)msg+=','  const spouseShortfalls=audit.filter(x=>x.kind==="spouse-day-shortfall");if(spouseShortfalls.length)msg+="\\n\\nEş günü nedeniyle yerleştirilemeyen görevler:\\n"+spouseShortfalls.map(x=>(getPersonById(x.personId)?.name||x.personId)+": "+x.day+". gün. "+x.reason).join("\\n");\n  if(anchorResult.warnings.length)msg+='],
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
    change('genericDistributeV251','spouseAnchorDaysV251',[
      ['if(r.spouseSameDay)filled+=preassignSameUnitSpouses(unit,ids,slots,d,hours,count,unitHours,unitCount);','// Each candidate reserves both spouse cells atomically below.'],
      ['ids.filter(id=>canTakeShift(id,d,s.col,unit))','ids.filter(id=>window.rpysScheduler398.spousePlacements(id,d,s,unit,ids,slots).length)'],
      ['let id=Number(candidates[0]);db.assign[k]=id;\n      hours[id]=(hours[id]||0)+Number(s.col.hours||0);count[id]=(count[id]||0)+1;\n      unitHours[id]=(unitHours[id]||0)+Number(s.col.hours||0);unitCount[id]=(unitCount[id]||0)+1;\n      if([0,6].includes(new Date(dateStr(d)+"T12:00:00").getDay()))weekendCount[id]=(weekendCount[id]||0)+1;\n      filled++;_assignCache={};_allAssignCache=null;_calcCache={}',
       'filled+=window.rpysScheduler398.placeSpouseGroup(Number(candidates[0]),d,s,unit,ids,slots,hours,count,unitHours,unitCount,weekendCount).length;']
    ]);
    change('distributeExactV251','selectedUnitOutsidersV2411',[
      ['for(const rec of dayRecs){','for(const rec of dayRecs){\n      if(db.assign[rec.k]||window.rpysScheduler398.protectedCell(rec.k))continue;'],
      ['&&canTakeShiftV2414(id,d,rec.s.col,unit)','&&window.rpysScheduler398.spousePlacements(id,d,rec.s,unit,ids,slots).length'],
      ['let id=Number(candidates[0]);db.assign[rec.k]=id;used.add(id);\n      hours[id]=(hours[id]||0)+rec.h;count[id]=(count[id]||0)+1;unitHours[id]=(unitHours[id]||0)+rec.h;unitCount[id]=(unitCount[id]||0)+1;\n      if(rec.weekend)weekendCount[id]=(weekendCount[id]||0)+1;filled++;_assignCache={};_allAssignCache=null;_calcCache={}',
       'const placed=window.rpysScheduler398.placeSpouseGroup(Number(candidates[0]),d,rec.s,unit,ids,slots,hours,count,unitHours,unitCount,weekendCount);for(const x of placed)used.add(x.id);filled+=placed.length;'],
      ['if(!v251RepairSpouse(plan))break;','if(!window.rpysScheduler398.preserveSpousePairs(()=>v251RepairSpouse(plan)))break;'],
      ['if(v250TryGapRepair(v,plan,slots))','if(window.rpysScheduler398.preserveSpousePairs(()=>v250TryGapRepair(v,plan,slots)))']
    ]);
    change('distributePolRotation2','polRotationWeeklyPreview',[
      ['canTakeShift(id,d,s.col,"POLİKLİNİK RÖNTGEN")','window.rpysScheduler398.spousePlacements(id,d,s,"POLİKLİNİK RÖNTGEN",ids,slots).length'],
      ['let k=keyFor("pol",d,s.col.key);db.assign[k]=preferred;used.add(preferred);\n        hours[preferred]=(hours[preferred]||0)+Number(s.col.hours||0);count[preferred]=(count[preferred]||0)+1;filled++;_assignCache={};_allAssignCache=null;_calcCache={};',
       'const placed=window.rpysScheduler398.placeSpouseGroup(preferred,d,s,"POLİKLİNİK RÖNTGEN",ids,slots,hours,count);for(const x of placed)used.add(x.id);filled+=placed.length;'],
      ['choosePolSubstitute(s,d,order,used,order.filter(id=>!dailyPool.includes(id)),hours)','choosePolSubstitute(s,d,order.filter(id=>window.rpysScheduler398.spousePlacements(id,d,s,"POLİKLİNİK RÖNTGEN",ids,slots).length),used,order.filter(id=>!dailyPool.includes(id)),hours)'],
      ['db.assign[k]=chosen;used.add(chosen);\n      hours[chosen]=(hours[chosen]||0)+Number(s.col.hours||0);count[chosen]=(count[chosen]||0)+1;filled++;_assignCache={};_allAssignCache=null;_calcCache={};',
       'const placed=window.rpysScheduler398.placeSpouseGroup(chosen,d,s,"POLİKLİNİK RÖNTGEN",ids,slots,hours,count);for(const x of placed)used.add(x.id);filled+=placed.length;'],
      ['audit.push({day:d,slot:s.col.key,personId:preferred,kind:"normal",theoretical:true})','for(const x of placed)audit.push({day:d,slot:x.slot.col.key,personId:x.id,kind:x.id===preferred?"normal":"spouse",theoretical:x.id===preferred})'],
      ['audit.push({day:d,slot:s.col.key,personId:chosen,kind:"substitute",theoretical:false})','for(const x of placed)audit.push({day:d,slot:x.slot.col.key,personId:x.id,kind:x.id===chosen?"substitute":"spouse",theoretical:false})']
    ]);
    change('manualSyncBadge','clearManualDutySyncForMonth',[
      ['return db.manualDutyOverrides?.[k]?\'<span class="manualSyncBadge" title="Elle değiştirildi • Saymanlık canlı senkron">ELLE↔SAY</span>\':""','return window.rpysScheduler398.manualBadgeHtml(k)']
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
      if(!run&&window.__RPYS_MANUAL_16_APPROVED__===String(dateStr(day))+"|"+String(id)+"|"+String(col?.key||col?.unit||""))return true;
      if(!activeOn(id,day))return false;
      if(run&&col?.key){
        for(const type of ['pol','acil'])if(dutyColumnByKey(type,col.key)&&protectedCell(keyFor(type,day,col.key)))return false;
      }
      return base.apply(this,arguments);
    };fn.__rpys398=true;window[name]=fn;
  }
  const personNameKey=value=>String(value||'').trim().toLocaleUpperCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
  function calendarValue(store,person,month,day){
    const exact=month+'|'+person.name+'|'+Number(day);if(own(store,exact))return store[exact];
    const name=personNameKey(person.name);for(const [key,value] of Object.entries(store||{})){const p=key.split('|');if(p[0]===month&&Number(p.at(-1))===Number(day)&&personNameKey(p.slice(1,-1).join('|'))===name)return value}return null;
  }
  function absentStatus(value){
    let code=String(value||'').trim().toLocaleLowerCase('tr-TR');
    if(typeof sayStatusFromText==='function')code=sayStatusFromText(value)||code;
    if(['izin','sua','yillik','yıllık','idari','mazeret','rapor','gecici','ketem','ketemgecici','ayrilis','atamaoncesi','tayinoncesi'].includes(code))return true;
    const text=personNameKey(value);return /^(ŞUA|SUA|SAĞLIK|SAGLIK|YILLIK|İDARİ|IDARI|MAZERET) (İZNİ|IZNI|IZIN)$/.test(text)||text==='RAPOR';
  }
  function spouseUnavailable(id,day,month=ym()){
    const person=getPersonById(id);if(!person)return false;const date=month+'-'+String(day).padStart(2,'0');
    if((db.leaves||[]).some(l=>Number(l.personId??l.idPerson??l.person?.id)===Number(id)&&l.start<=date&&l.end>=date))return true;
    try{if(typeof personStatusAt==='function'&&personStatusAt(person,date)!=='Aktif')return true}catch(_){}
    if(calendarValue(db.sayStatusCleared,person,month,day))return false;
    let effective='';try{if(month===ym()&&typeof getCellStatus==='function')effective=getCellStatus(person.name,Number(day))||''}catch(_){}
    if(!effective){const manual=calendarValue(db.cellStatus,person,month,day),imported=calendarValue(db.importedSaymanlik,person,month,day);effective=manual==='izin'&&imported?imported:manual||imported||''}
    return absentStatus(effective);
  }
  function spouseWorkingOnDay(id,day,month=ym()){
    const person=getPersonById(id);if(!person)return false;
    for(const [key,pid] of Object.entries(db.assign||{})){const p=key.split('|');if(p[0]===month&&Number(p[2])===Number(day)&&Number(pid)===Number(id))return true}
    if((db.importedRecords||[]).some(r=>r.monthKey===month&&Number(r.day)===Number(day)&&Number(r.personId)===Number(id)&&!(typeof isImportedShiftBlocked==='function'&&isImportedShiftBlocked(r))))return true;
    const work=calendarValue(db.sayManualWork,person,month,day),hours=Number(work?.total??(Number(work?.pol||0)+Number(work?.ac||0)));return Number.isFinite(hours)&&hours>0;
  }
  function spouseDayViolations(month){
    if(typeof spouseOf!=='function')return [];
    if(window.rpysRules421&&!window.rpysRules421.enabled(run?.unit||document.getElementById('autoUnit')?.value||'','spouseSameDay'))return [];
    const staff=db.staff||[],pairs=new Set(),rows=Object.entries(db.assign||{}).filter(([k,id])=>k.startsWith(month+'|')&&Number(id)).map(([k,id])=>({person:{id:Number(id)},day:Number(k.split('|')[2])}));
    for(const r of db.importedRecords||[])if(r.monthKey===month&&!(typeof isImportedShiftBlocked==='function'&&isImportedShiftBlocked(r)))rows.push({person:{id:Number(r.personId)},day:Number(r.day)});
    for(const p of staff)for(const [key,work] of Object.entries(db.sayManualWork||{})){const a=key.split('|');if(a[0]!==month||personNameKey(a.slice(1,-1).join('|'))!==personNameKey(p.name))continue;const total=Number(work?.total??(Number(work?.pol||0)+Number(work?.ac||0)));if(Number.isFinite(total)&&total>0)rows.push({person:{id:Number(p.id)},day:Number(a.at(-1))})}
    const byId=new Map(),out=[];
    for(const a of rows){const id=Number(a.person?.id||0),day=Number(a.day);if(!id||!day)continue;if(!byId.has(id))byId.set(id,new Set());byId.get(id).add(day)}
    for(const p of staff){
      const id=Number(p.id),other=Number(spouseOf(id)||0);if(!other||id===other||!staff.some(x=>Number(x.id)===other))continue;
      const pair=[id,other].sort((a,b)=>a-b),pk=pair.join('|');if(pairs.has(pk))continue;pairs.add(pk);
      const a=byId.get(id)||new Set(),b=byId.get(other)||new Set();
      for(const d of new Set([...a,...b])){
        if(a.has(d)===b.has(d))continue;
        const missing=a.has(d)?other:id;
        const date=month+'-'+String(d).padStart(2,'0'),person=staff.find(p=>Number(p.id)===missing);
        let leave=spouseUnavailable(missing,d,month);
        try{if(month===ym()&&typeof isOnLeave==='function')leave=leave||!!isOnLeave(missing,d)}catch(_){}
        if(leave)continue;
        out.push({key:pk+'|'+d,day:d,first:id,second:other,missing});
      }
    }
    return out;
  }
  // Plan the two cells before writing either spouse. Availability is checked
  // against the same draft, including other units, locks, leave and next-day rest.
  function spousePlacements(id,day,slot,unit,ids,slots){
    id=Number(id);const eligible=window.canTakeShiftV2414||window.canTakeShift;
    const free=s=>{const key=keyFor(s.type,day,s.col.key);return !db.assign[key]&&!protectedCell(key)&&isDutyCellApplicable(s.type,s.col,day)};
    if(!free(slot)||!eligible(id,day,slot.col,unit))return [];
    const first={id,slot,key:keyFor(slot.type,day,slot.col.key)};
    const enabled=window.rpysRules421?window.rpysRules421.enabled(unit,'spouseSameDay'):typeof ruleCfg==='function'&&ruleCfg().spouseSameDay;
    const other=enabled&&typeof spouseOf==='function'?Number(spouseOf(id)||0):0;
    if(!other||spouseUnavailable(other,day)||spouseWorkingOnDay(other,day)||typeof isOnLeave==='function'&&isOnLeave(other,day))return [first];
    if(!ids.map(Number).includes(other))return [];
    const second=slots.find(s=>keyFor(s.type,day,s.col.key)!==first.key&&free(s)&&eligible(other,day,s.col,unit));
    return second?[first,{id:other,slot:second,key:keyFor(second.type,day,second.col.key)}]:[];
  }
  function placeSpouseGroup(id,day,slot,unit,ids,slots,hours,count,unitHours,unitCount,weekendCount){
    const plan=spousePlacements(id,day,slot,unit,ids,slots);
    for(const x of plan){
      db.assign[x.key]=x.id;const h=Number(x.slot.col.hours||0);
      hours[x.id]=(hours[x.id]||0)+h;count[x.id]=(count[x.id]||0)+1;
      if(unitHours)unitHours[x.id]=(unitHours[x.id]||0)+h;if(unitCount)unitCount[x.id]=(unitCount[x.id]||0)+1;
      if(weekendCount&&[0,6].includes(new Date(dateStr(day)+'T12:00:00').getDay()))weekendCount[x.id]=(weekendCount[x.id]||0)+1;
    }
    if(plan.length)invalidate();return plan;
  }
  function alignSpouseDays(unit,ids,audit=[]){
    if(typeof spouseOf!=='function')return;
    const original=run?.beforeSpouses||new Set(),selected=new Set(ids.map(Number)),slots=unitSlots(unit),eligible=window.canTakeShiftV2414||window.canTakeShift;
    const currentIssues=()=>spouseDayViolations(ym()).filter(x=>!original.has(x.key));
    const attempt=(key,id,previous)=>{
      const prior=new Set(currentIssues().map(x=>x.key)),old=db.assign[key];delete db.assign[key];invalidate();
      const p=key.split('|'),day=Number(p[2]),base=dutyColumnByKey(p[1],p[3]),col={...base,...db.assignmentMeta?.[key]};
      const ok=!id||eligible(id,day,col,unit);
      if(ok&&id)db.assign[key]=id;invalidate();
      if(ok&&!currentIssues().some(x=>!prior.has(x.key))){audit.push({kind:'spouse-day-align',day,personId:id||null,previousPersonId:previous||old||null,colKey:p[3]});return true}
      if(old)db.assign[key]=old;else delete db.assign[key];invalidate();return false;
    };
    // Complete a partner's day first; only new, unprotected assignments may be
    // replaced. If no lawful pairing fits, keep the rest of the draft and report
    // that day rather than rolling back all unrelated assignments.
    for(const issue of currentIssues()){
      const d=issue.day,missing=issue.missing;
      if(selected.has(missing)){
        const candidates=slots.filter(s=>isDutyCellApplicable(s.type,s.col,d)).map(s=>keyFor(s.type,d,s.col.key)).filter(k=>!protectedCell(k)&&(!db.assign[k]||selected.has(Number(db.assign[k])))&&Number(db.assign[k]||0)!==Number(issue.first)&&Number(db.assign[k]||0)!==Number(issue.second)).sort((a,b)=>Number(!!db.assign[a])-Number(!!db.assign[b]));
        if(candidates.some(k=>attempt(k,missing)))continue;
      }
      const working=missing===issue.first?issue.second:issue.first;
      const sources=Object.keys(db.assign||{}).filter(k=>k.startsWith(ym()+'|')&&Number(k.split('|')[2])===d&&Number(db.assign[k])===Number(working)&&dutyColumnByKey(k.split('|')[1],k.split('|')[3])?.unit===unit&&!protectedCell(k));
      for(const key of selected.has(working)?sources:[]){
        const replacement=ids.map(Number).filter(id=>id!==working&&id!==missing).sort((a,b)=>Object.values(db.assign).filter(id=>Number(id)===a).length-Object.values(db.assign).filter(id=>Number(id)===b).length);
        if(!replacement.some(id=>attempt(key,id,working)))attempt(key,0,working);
      }
      if(sources.length)audit.push({kind:'spouse-day-shortfall',day:d,personId:working,reason:'Eşler için aynı gün iki uygun görev yerleştirilemedi; diğer geçerli görevler korundu.'});
    }
  }
  function preserveSpousePairs(operation){
    const before=clone(db.assign),issues=new Set(spouseDayViolations(ym()).map(x=>x.key));
    const result=operation();invalidate();
    if(spouseDayViolations(ym()).some(x=>!issues.has(x.key))){db.assign=before;invalidate();return 0}
    return result;
  }
  function wrapRun(name){
    const base=window[name];if(typeof base!=='function'||base.__rpys398)return;
    const fn=function(){
      if(run)return base.apply(this,arguments);
      const targetUnit=name==='runPolRotation2'?'POLİKLİNİK RÖNTGEN':name==='distributeSkopiSequential'?'PORTABL + SKOPİ':document.getElementById('autoUnit')?.value;
      if(window.rpysTargets399?.enabledFor(targetUnit)&&!window.rpysTargets399.hasPrepared(targetUnit))return window.rpysTargets399.prepare(targetUnit,()=>fn.apply(this,arguments));
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
        const targetIds=window.rpysTargets399?.enabledFor(unit)?window.rpysTargets399.model(unit).ids:null;
        if(targetIds)run.targetIds=new Set(targetIds);
        const restCheck=()=>targetIds&&window.rpysRest16V397.allViolationsForMonth?window.rpysRest16V397.allViolationsForMonth(targetIds,month):window.rpysRest16V397.allViolations();
        const beforeRest=restCheck();
        const beforeSpouses=new Set(spouseDayViolations(month).map(x=>x.key));run.beforeSpouses=beforeSpouses;
        value=window.rpysRest16V397.runIndexed(()=>window.rpysTargets399?.enabledFor(unit)?window.rpysTargets399.distribute(unit):base.apply(this,arguments));
        if(value&&typeof value.then==='function')throw Error('Beklenmeyen asenkron motor; liste korunarak işlem durduruldu.');
        for(const key of restCheck().keys())if(window.rpysRules421?.enabled(unit,'noPostDuty')!==false&&!beforeRest.has(key))throw Error('16 saat ve üzeri çalışma sonrası ertesi gün dinlenme kuralı ihlali engellendi.');
        const newSpouseIssues=spouseDayViolations(month).filter(x=>!beforeSpouses.has(x.key));
        if(newSpouseIssues.length){const x=newSpouseIssues[0];throw Error('Eşlerin aynı gün çalışma kuralı: '+(getPersonById(x.first)?.name||x.first)+' / '+(getPersonById(x.second)?.name||x.second)+', '+x.day+'. gün aynı gün için iki uygun görev hücresi bulunamadı. İzinli eşin çalışması gerekmez; izinli olmayan eş tek başına çalışabilir.');}
        if(JSON.stringify(db.rpysCellLocks)!==JSON.stringify(before.rpysCellLocks))throw Error('Hücre kilitleri değiştirilemez.');
        for(const key of new Set([...Object.keys(before.assign||{}),...Object.keys(db.assign||{}),...Object.keys(before.assignmentMeta||{}),...Object.keys(db.assignmentMeta||{}),...Object.keys(before.rpysCellLocks||{})])){
          if((protectedCell(key)||before.rpysCellLocks?.[key]||manualAssignmentCell(key,before))&&
            ['assign','assignmentMeta','manualDutyOverrides'].some(field=>JSON.stringify(db[field]?.[key])!==JSON.stringify(before[field]?.[key])))throw Object.assign(Error('Korunan hücre değişikliği engellendi.'),{cellKey:key});
        }
      }catch(e){db=before;invalidate();error=e}
      finally{for(const [key,original] of Object.entries(saved))window[key]=original;for(const [key,original] of Object.entries(staticQueries))window[key]=original;window.dutyColumnByKey=lookup;if(allMonths)window.allAssignmentsAllMonths=allMonths;if(overlap)window.personHasOverlap=overlap;run=null}
      if(error){try{renderAll()}catch(_){}console.error('RPYS398 motor koruması',error,error.cellKey||'');window.rpysTargets399?.reportError?.(error.message||String(error));alert('İşlem tamamlanamadı; önceki liste aynen korundu.\n\n'+(error.message||error));return false}
      if(pending.length){const saveFn=saved.saveNowV245||saved.save;saveFn?.({allowAssignDrop:rebuild,label:'6.1.1 güvenli liste dağıtımı'});}
      invalidate();return value;
    };fn.__rpys398=true;window[name]=fn;if(name==='autoDistribute')targetRunner=fn;
  }
  function install(){
    if(typeof window.autoDistribute!=='function'||typeof window.canTakeShift!=='function')return;
    ['canTakeShift','canTakeShiftV2413','canTakeShiftV2414'].forEach(wrapEligibility);
    ['autoDistribute','runPolRotation2','distributeSkopiSequential'].forEach(wrapRun);
    document.documentElement.dataset.rpysSchedulerSafety='398';
  }
  function runTargets(){
    if(!targetRunner)install();
    if(!targetRunner)throw Error('Güvenli hedef dağıtım motoru henüz yüklenemedi. Sayfayı yenileyin.');
    return targetRunner();
  }
  window.rpysScheduler398={runTargets,repair,repairCache,install,protectedCell,manualAssignmentCell,sayHoursOnly,manualBadgeHtml,mayClear,spousePlacements,placeSpouseGroup,alignSpouseDays,preserveSpousePairs,spouseUnavailable,spouseWorkingOnDay,absentStatus,spouseDayViolations,currentUnit:()=>run?.unit||'',running:()=>!!run};
  install();
  window.addEventListener('rpys-direct-core-ready',()=>[50,400,2800].forEach(ms=>setTimeout(install,ms)));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);
  [1000,3500].forEach(ms=>setTimeout(install,ms));
})();
