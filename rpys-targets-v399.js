/* Per-person monthly targets using the existing 6.1.1 eligibility and transaction guards. */
(()=>{
  if(window.rpysTargets399)return;
  const kinds=['day','night'],metrics=[...kinds,'weekendNight'],labels={day:'gündüz',night:'nöbet',weekendNight:'hafta sonu nöbeti'};
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
  const empty=()=>({day:0,night:0,weekendNight:0});
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clearCache=()=>{_assignCache={};_allAssignCache=null;_calcCache={};_peopleCache=null};
  const kind=col=>Number(col.hours||0)>=16?'night':'day';
  const weekendOn=(day,month=ym())=>[0,6].includes(new Date(month+'-'+String(day).padStart(2,'0')+'T12:00:00Z').getUTCDay());
  const key=u=>ym()+'|'+u;
  const gapLimit=u=>Number(window.rpysRules421?.settings(u).maxGapDays??(typeof unitMaxGapDaysV251==='function'?unitMaxGapDaysV251(u):5))||5;
  const ruleOn=(u,k)=>['returnMonday','blockReserve'].includes(k)?true:window.rpysRules421?window.rpysRules421.enabled(u,k):unitRulesV251(u)[k]!==false;
  const textFor=u=>window.rpysRules421?.textRules(u)||db.customTextRules||[];
  const customFor=u=>window.rpysRules421?.customRules(u)||[];
  const config=u=>db.manualDistributionTargetsV399?.[key(u)]||{enabled:false,people:{}};
  let automaticUnit=null;
  const enabledFor=u=>automaticUnit===u||config(u).enabled===true;
  const selected=u=>[...new Set((document.getElementById('autoUnit')?.value===u
    ?Array.from(document.getElementById('autoPeople')?.selectedOptions||[]).map(o=>Number(o.value))
    :(db.unitPools?.[key(u)]||[]).map(Number)).filter(id=>getPersonById(id)))];
  function editableConfig(u){db.manualDistributionTargetsV399??={};return db.manualDistributionTargetsV399[key(u)]??={enabled:false,people:{}}}
  function persist(){window.__RPYS_LAST_USER_EDIT_V396__=Date.now();saveNowV245({label:'Personel gündüz/nöbet hedefleri'});}
  function model(u,ids=selected(u),{preserveExisting=false}={}){
    const rebuild=!preserveExisting&&!!document.getElementById('rebuildSelectedUnitV246')?.checked;
    // Mevcut G/N sayısını assignmentsMonth() önbelleğinden değil, seçili ayın
    // gerçek vardiya hücrelerinden yeniden hesapla. Böylece ay değiştirirken eski
    // ayın önbelleği yeni ayın toplamına karışamaz.
    const actual=Object.fromEntries(ids.map(id=>[id,empty()])),fixed=Object.fromEntries(ids.map(id=>[id,empty()]));
    const counted=new Set();
    const slots=[],mutable=new Set();let lockedEmpty=0;
    for(const s of unitSlots(u).filter(s=>!isShiftBlockedForMonth(s.type,s.col,ym())))for(let d=1;d<=daysInMonth();d++){
      if(!isDutyCellApplicable(s.type,s.col,d))continue;
      const k=keyFor(s.type,d,s.col.key),manualProtected=window.rpysScheduler398?.manualAssignmentCell
        ?window.rpysScheduler398.manualAssignmentCell(k)
        :!!(db.assign[k]&&(db.manualDutyOverrides?.[k]||db.assignmentMeta?.[k]?.manual));
      const protectedCell=!!(db.rpysCellLocks?.[k]||manualProtected);
      if(!protectedCell&&(!db.assign[k]||ids.includes(Number(db.assign[k])))&&(rebuild||!db.assign[k])){mutable.add(k);slots.push({key:k,day:d,type:s.type,col:s.col,kind:kind(s.col),weekendNight:kind(s.col)==='night'&&weekendOn(d)});}
      else if(!db.assign[k])lockedEmpty++;
    }
    // Aynı hücreyi yalnız bir kez say; kaynak db.assign + unitSlots() olsun.
    // Bu, tabloda görünen ayın gerçek hücre toplamını verir.
    for(const s of unitSlots(u).filter(s=>!isShiftBlockedForMonth(s.type,s.col,ym())))for(let d=1;d<=daysInMonth();d++){
      if(!isDutyCellApplicable(s.type,s.col,d))continue;
      const k=keyFor(s.type,d,s.col.key),raw=db.assign?.[k],id=Number(raw||0);
      if(!id||!actual[id]||counted.has(k))continue;
      counted.add(k);
      const t=kind(s.col);
      actual[id][t]++;
      const weekendNight=t==='night'&&weekendOn(d);if(weekendNight)actual[id].weekendNight++;
      const manualProtected=window.rpysScheduler398?.manualAssignmentCell
        ?window.rpysScheduler398.manualAssignmentCell(k)
        :!!(db.manualDutyOverrides?.[k]||db.assignmentMeta?.[k]?.manual);
      if(!mutable.has(k)||manualProtected){fixed[id][t]++;if(weekendNight)fixed[id].weekendNight++}
    }
    const required=empty();for(const id of ids)for(const t of kinds)required[t]+=fixed[id][t];
    for(const s of slots)required[s.kind]++;
    required.weekendNight=ids.reduce((n,id)=>n+fixed[id].weekendNight,0)+slots.filter(s=>s.weekendNight).length;
    return {u,ids,rebuild,actual,fixed,required,slots,mutable,lockedEmpty};
  }
  function readTargets(m,{partial=false}={}){
    if(automaticUnit===m.u)return Object.fromEntries(m.ids.map(id=>[id,{day:m.fixed[id].day+m.slots.filter(s=>s.kind==='day').length,night:m.fixed[id].night+m.slots.filter(s=>s.kind==='night').length,weekendNight:null}]));
    const cfg=config(m.u),targets={},problems=[];
    for(const id of m.ids){targets[id]={};for(const t of kinds){
      const v=cfg.people?.[id]?.[t];
      if(v==null||v===''||!Number.isInteger(Number(v))||Number(v)<0||Number(v)>1000){problems.push(`${getPersonById(id).name}: ${labels[t]} hedefini 0 veya pozitif tam sayı olarak yaz.`);continue}
      targets[id][t]=Number(v);
      if(!partial&&Number(v)<m.fixed[id][t])problems.push(`${getPersonById(id).name}: korunan ${m.fixed[id][t]} ${labels[t]} kaydı var; ${v} hedefi uygulanamaz. Manuel/kilitli kayıt korunur. Mevcutları koru modundaysan yeniden dağıt seçeneğini kontrol et.`);
    }}
    if(problems.length)throw Error(problems.slice(0,8).join('\n'));
    for(const id of m.ids){
      const v=cfg.people?.[id]?.weekendNight;
      targets[id].weekendNight=v==null||v===''?null:Number(v);
      if(targets[id].weekendNight===null)continue;
      if(!Number.isInteger(Number(v))||Number(v)<0||Number(v)>targets[id].night)problems.push(`${getPersonById(id).name}: hafta sonu nöbet hedefi 0 ile toplam nöbet hedefi (${targets[id].night}) arasında bir tam sayı olmalı.`);
      else if(!partial&&(Number(v)<m.fixed[id].weekendNight||targets[id].night-Number(v)<m.fixed[id].night-m.fixed[id].weekendNight))problems.push(`${getPersonById(id).name}: hafta sonu hedefi korunan hafta sonu/hafta içi nöbet sayılarıyla uyuşmuyor. Mevcut kayıtlar korunur.`);
    }
    if(problems.length)throw Error(problems.join('\n'));
    for(const t of kinds){const total=m.ids.reduce((n,id)=>n+targets[id][t],0);if(!partial&&total!==m.required[t])problems.push(`${labels[t]} hedef toplamı ${total}; seçili personeller için gereken ${m.required[t]}. Fark: ${total-m.required[t]}.`)}
    const specified=m.ids.filter(id=>targets[id].weekendNight!==null),weekendTotal=specified.reduce((n,id)=>n+targets[id].weekendNight,0);
    if(!partial&&(weekendTotal>m.required.weekendNight||specified.length===m.ids.length&&weekendTotal!==m.required.weekendNight))problems.push(`Hafta sonu nöbet hedef toplamı ${weekendTotal}; gereken ${m.required.weekendNight}. Bu sayı toplam nöbet hedefinin içindedir.`);
    if(problems.length)throw Error(problems.join('\n'));
    return targets;
  }
  const plusDate=(date,n)=>new Date(Date.parse(date+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
  function calendarFor(m){
    const blocked=new Map(m.ids.map(id=>[id,new Map()])),required=new Map(m.ids.map(id=>[id,new Map()])),hardRequired=new Map(m.ids.map(id=>[id,new Set()])),manual=new Map();
    const leaves=new Map(m.ids.map(id=>[id,(db.leaves||[]).filter(l=>Number(l.personId??l.idPerson??l.person?.id)===id&&/^\d{4}-\d{2}-\d{2}$/.test(l.start||'')&&/^\d{4}-\d{2}-\d{2}$/.test(l.end||'')&&l.start<=l.end)]));
    const add=(map,id,date,reason)=>{if(date.slice(0,7)===ym())map.get(id).set(Number(date.slice(8)),reason)};
    const holiday=date=>typeof rpysHolidayInfo==='function'&&rpysHolidayInfo(date)?.type==='full';
    for(const id of m.ids)for(const l of leaves.get(id)){
      if(ruleOn(m.u,'preLeaveThursday')&&new Date(l.start+'T12:00:00Z').getUTCDay()===1){
        add(required,id,plusDate(l.start,-4),'Pazartesi başlayan izin öncesi Perşembe işbaşı');
        for(const n of [-3,-2,-1])add(blocked,id,plusDate(l.start,n),'Pazartesi başlayan izin öncesi Cuma–Pazar boşluğu');
      }
      let date=plusDate(l.end,1),guard=0;
      while(guard++<370&&(weekendOn(Number(date.slice(8)),date.slice(0,7))||holiday(date)||leaves.get(id).some(x=>x.start<=date&&x.end>=date))){if(ruleOn(m.u,'leaveWeekendBlock'))add(blocked,id,date,'İzin bitişi ile ilk iş günü arasındaki dinlenme');date=plusDate(date,1)}
      if(guard<370&&!window.rpysScheduler398?.returnWorkdays&&ruleOn(m.u,'returnMonday'))add(required,id,date,'izin dönüşü ilk iş günü işbaşı');
    }
    for(const id of m.ids)for(const day of window.rpysScheduler398?.returnWorkdays(id,ym())||[]){required.get(id).set(day,'izin dönüşü ilk iş günü işbaşı');hardRequired.get(id).add(day)}
    const nextRequired=new Set(),nextMonth=new Date(Date.UTC(Number(ym().slice(0,4)),Number(ym().slice(5)),1)).toISOString().slice(0,7);for(const id of m.ids)if(window.rpysScheduler398?.returnWorkdays(id,nextMonth).includes(1))nextRequired.add(id);
    const people=new Map(m.ids.map(id=>[String(getPersonById(id).name),id]));
    for(const [key,value] of Object.entries(db.sayManualWork||{})){
      const parts=key.split('|'),id=people.get(parts.slice(1,-1).join('|')),date=parts[0]+'-'+String(Number(parts.at(-1))).padStart(2,'0'),hours=Number(value?.total??(Number(value?.pol||0)+Number(value?.ac||0)));
      if(id&&Number.isFinite(hours)&&hours>0&&/^\d{4}-\d{2}-\d{2}$/.test(date))manual.set(id+'|'+date,hours);
    }
    for(const id of m.ids)for(const r of window.rpysRules421?.requiredDates(id,m.u)||[])required.get(id).set(r.day,r.reason);
    return {unit:m.u,blocked,required,hardRequired,nextRequired,manual,hasLeave:new Set(m.ids.filter(id=>leaves.get(id).length))};
  }
  function calendarReason(calendar,id,day,col){
    if(window.rpysScheduler398?.reservedOn(id,day,ym()))return 'Rezerve gün; izin gibi görev yazılamaz';
    const next=plusDate(dateStr(day),1);if(ruleOn(calendar.unit,'noPostDuty')&&(isOvernightOrDutyShift(col)||Number(col.hours)>=16)&&(next.startsWith(ym()+'-')?calendar.hardRequired.get(id)?.has(Number(next.slice(8))):calendar.nextRequired.has(id)))return 'Ertesi gün zorunlu izin dönüşü işbaşı';
    const date=dateStr(day),blocked=calendar.blocked.get(id)?.get(day);if(blocked)return blocked;
    if(ruleOn(calendar.unit,'avoidSameDay')&&calendar.manual.has(id+'|'+date))return 'Saymanlıkta aynı gün kayıtlı manuel çalışma';
    if(ruleOn(calendar.unit,'noPostDuty')&&(calendar.manual.get(id+'|'+plusDate(date,-1))||0)>=16)return 'Önceki gün Saymanlıkta 16 saat ve üzeri çalışma sonrası dinlenme';
    if(ruleOn(calendar.unit,'noPostDuty')&&(isOvernightOrDutyShift(col)||Number(col.hours)>=16)&&calendar.manual.has(id+'|'+plusDate(date,1)))return 'Ertesi gün Saymanlıkta kayıtlı çalışma';
    return '';
  }
  function requirementsFor(m,calendar=calendarFor(m)){
    const rows=assignmentsMonth(),requirements=[],rules=unitRulesV251(m.u);
    for(const id of m.ids){
      const workDays=new Set(rows.filter(a=>Number(a.person.id)===id).map(a=>Number(a.day)));
      for(const [day] of calendar.required.get(id)||[])if(calendar.manual.has(id+'|'+dateStr(day)))workDays.add(day);
      const active=d=>personStatusAt(getPersonById(id),dateStr(d))==='Aktif';
      for(let d=1;d<=daysInMonth();d++)if(active(d)&&!workDays.has(d)){
        const reason=calendar.required.get(id)?.get(d)||(!calendar.hasLeave.has(id)&&((rules.returnMonday&&typeof isReturnMondayRequiredV251==='function'&&isReturnMondayRequiredV251(id,d,m.u))||(rules.preLeaveThursday&&typeof isPreLeaveThursdayRequiredV251==='function'&&isPreLeaveThursdayRequiredV251(id,d,m.u))?'izin dönüşü/öncesi':''));
        if(reason)requirements.push({id,days:new Set([d]),reason,hard:calendar.hardRequired.get(id)?.has(d)||false});
      }
    }
    for(const id of m.ids)for(const r of window.rpysRules421?.requiredDates(id,m.u)||[])if(!rows.some(a=>Number(a.person.id)===id&&a.col.unit===m.u&&Number(a.day)===r.day)&&!requirements.some(x=>x.id===id&&x.days.has(r.day)))requirements.push({id,days:new Set([r.day]),reason:r.reason});
    return requirements;
  }
  function payrollState(m){
    let rows=[];if(typeof window.totals==='function')rows=window.totals()||[];
    const assignments=assignmentsMonth(),result={};
    for(const id of m.ids){
      const p=getPersonById(id),row=rows.find(r=>Number(r.p?.id)===id);
      const display=field=>{if(!row)return NaN;try{return typeof puantajValue==='function'?Number(puantajValue(row,field)):Number(row[field])}catch(_){return Number(row[field])}};
      let worked=display('total'),obligation=display('muk');
      if(!Number.isFinite(worked))worked=assignments.filter(a=>Number(a.person.id)===id).reduce((n,a)=>n+Number(a.col.hours||0),0);
      if(!Number.isFinite(obligation)&&typeof finalObligation==='function')obligation=Number(finalObligation(p));
      const band=String(p.mesaiBand??''),cap=band===''?null:typeof overtimeCap==='function'?Number(overtimeCap(band)):({'0':0,'0-30':30,'30-70':70,'70-100':100,'100+':99999}[band]??null);
      const frozen=field=>own(db.puantajOverride,ym()+'|'+id+'|'+field)||(typeof useImportedSay==='function'&&useImportedSay()&&typeof importedPuantajKey==='function'&&own(db.importedPuantaj,importedPuantajKey(p.name,field)));
      result[id]={worked,obligation:Number.isFinite(obligation)?obligation:null,band,cap,frozenTotal:frozen('total'),frozenPol:frozen('pol'),frozenAc:frozen('ac')};
    }
    return result;
  }
  function payrollMarkup(m){
    const r=db.manualDistributionResultsV399?.[key(m.u)];if(!r?.payroll)return '';
    return '<details><summary>Dağıtım sonrası Saymanlık kontrolü</summary><div style="white-space:pre-wrap">'+escape(m.ids.filter(id=>r.payroll[id]).map(id=>{const x=r.payroll[id];return `${getPersonById(id).name}: mükellef ${x.obligation??'—'} saat / görünen toplam ${x.worked} saat / fazla mesai ${x.obligation==null?'—':Math.max(0,x.worked-x.obligation)} saat${x.band?' / tercih '+x.band+' saat':''}${x.frozenTotal||x.frozenPol||x.frozenAc?' / manuel puantaj değerleri korunuyor':''}`}).join('\n'))+'</div></details>';
  }
  function finalRules(m){
    const r=unitRulesV251(m.u),rows=assignmentsMonth();
    if(r.maxGapEnabled){const gaps=window.rpysScheduler398.gapViolations?window.rpysScheduler398.gapViolations(m.ids,m.u,ym()):v251GapViolations(m.ids,m.u);if(gaps.length)return gaps.map(g=>`${getPersonById(g.id)?.name||('#'+g.id)}: ${g.leftDate??g.left??g.from??'?'} – ${g.rightDate??g.right??g.to??'?'} arasında görev aralığı ${g.blank??g.gap??'?'} boş gün; izin verilen en fazla ${gapLimit(m.u)}.`).join('\n')}
    if(r.spouseSameDay){const issues=window.rpysScheduler398?.spouseDayViolations?.(ym())||[];if(issues.length)return issues.map(x=>`${getPersonById(x.first).name} / ${getPersonById(x.second).name}: ${x.day}. gün eş kuralı.`).join('\n')}
    const missing=requirementsFor(m);if(missing.length)return missing.map(x=>`${getPersonById(x.id).name}: ${[...x.days].join(', ')}. gün ${x.reason} eksik.`).join('\n');
    return true;
  }
  function searchAdapter(m){
    const chosen=new Map(),r=ruleCfg(),baseRows=assignmentsMonth(),calendar=calendarFor(m),longFixed=new Map();
    const start=new Date(ym()+'-01T12:00:00').getTime();
    for(const id of m.ids)longFixed.set(id,new Set(allAssignmentsAllMonths().filter(a=>Number(a.person.id)===id&&Number(a.col.hours)>=Number(r.longHours||23)).map(a=>Math.round((new Date(a.date+'T12:00:00').getTime()-start)/86400000)+1).filter(d=>d>=-Math.max(4,Number(r.minGap??2))&&d<=daysInMonth()+Math.max(4,Number(r.minGap??2)))));
    const textRules=[...textFor(m.u),...customFor(m.u)].filter(x=>x.active!==false&&x.kind!=='config');
    for(const s of m.slots){s.long=Number(s.col.hours)>=Number(r.longHours||23);s.blocksNext=ruleOn(m.u,'noPostDuty')&&(isOvernightOrDutyShift(s.col)||Number(s.col.hours)>=16);}
    const calendarChecks=new Map();
    function canPlace(id,s){
      const checkKey=id+'|'+s.key;if(!calendarChecks.has(checkKey))calendarChecks.set(checkKey,calendarReason(calendar,id,s.day,s.col));if(calendarChecks.get(checkKey))return false;
      const mine=[...chosen.values()].filter(x=>x.id===id),longs=new Set(longFixed.get(id));
      for(const x of mine){const t=x.s;if(ruleOn(m.u,'overlap')&&typeof shiftInterval==='function'){const a=shiftInterval(s.day,s.col),b=shiftInterval(t.day,t.col);if(a&&b&&a.st<b.en&&b.st<a.en)return false}if(ruleOn(m.u,'avoidSameDay')&&t.day===s.day)return false;if(ruleOn(m.u,'noPostDuty')&&((t.blocksNext&&s.day===t.day+1)||(s.blocksNext&&t.day===s.day+1)))return false;if(t.long)longs.add(t.day);}
      if(s.long){
        if(ruleOn(m.u,'minGapEnabled')&&[...longs].some(d=>Math.abs(s.day-d)<Number(r.minGap??2)))return false;
        longs.add(s.day);
        if(r.avoidAlternate&&(window.rpysRules421||db.settings.avoidAlternate)&&[s.day,s.day+2,s.day+4].some(d=>longs.has(d)&&longs.has(d-2)&&longs.has(d-4)))return false;
      }
      for(const rule of textRules){
        if(rule.kind==='pairAvoidSameDay'&&(Number(rule.personA)===id||Number(rule.personB)===id)){
          const other=Number(rule.personA)===id?Number(rule.personB):Number(rule.personA);
          if([...chosen.values()].some(x=>x.id===other&&x.s.day===s.day))return false;
        }
        if(rule.kind==='unitNextDayBlock'&&rule.fromUnit===m.u&&rule.toUnit===m.u&&mine.some(x=>Math.abs(x.s.day-s.day)===1))return false;
        if(rule.kind==='unitConsecutive'&&rule.unit===m.u&&(!rule.personId||Number(rule.personId)===id)){
          const days=new Set(baseRows.filter(a=>Number(a.person.id)===id&&a.col.unit===m.u).map(a=>Number(a.day)));for(const x of mine)days.add(x.s.day);days.add(s.day);
          const max=Number(rule.maxConsecutive||1);for(let from=s.day-max;from<=s.day;from++)if(Array.from({length:max+1},(_,i)=>from+i).every(d=>days.has(d)))return false;
        }
      }
      return true;
    }
    return {canPlace,place:(id,s)=>chosen.set(s.key,{id,s}),remove:(id,s)=>chosen.delete(s.key),finalCheck:()=>{
      for(const {id,s} of chosen.values())db.assign[s.key]=id;clearCache();let verdict=true;
      try{
        // The original 6.1.1 rules remain authoritative over the fast search model.
        for(const {id,s} of chosen.values()){
          delete db.assign[s.key];clearCache();let ok;
          try{ok=!calendarReason(calendar,id,s.day,s.col)&&canTakeShiftV2414(id,s.day,s.col,m.u)}finally{db.assign[s.key]=id;clearCache()}
          if(!ok){verdict=`${getPersonById(id).name}: ${s.day}. gün mevcut uygunluk kuralları sağlanamadı.`;break;}
        }
        if(verdict===true)verdict=finalRules(m);
        return verdict;
      }finally{if(verdict!==true){for(const {s} of chosen.values())delete db.assign[s.key];clearCache();}}
    }};
  }
  function validateMonthlyLimits(m,targets){
    for(const rule of [...textFor(m.u),...customFor(m.u)].filter(x=>x.active!==false&&x.unit===m.u))for(const id of m.ids){
      if((rule.kind==='unitPersonMonthlyMax'||(rule.kind==='personUnitMonthlyMax'&&Number(rule.personId)===id))&&targets[id].day+targets[id].night>Number(rule.max||0))throw Error(`${getPersonById(id).name}: hedef toplamı özel kuraldaki ${rule.max} görev sınırını aşıyor.`);
    }
  }
  const workerURL=new URL('rpys-target-worker.js?v=20261023-safe-partial-23',document.currentScript?.src||document.baseURI).href;
  let preparing=false,prepared=null,draftActive=false,currentJob=null,activeRecordIndex=null,bestEffortRequested=false;
  let feedback={text:'',tone:'',busy:false};
  function report(text,tone='progress',busy=preparing){
    feedback={text:String(text||''),tone,busy};
    const panel=document.getElementById('rpysTargetPanel399'),box=panel?.querySelector?.('[data-target-feedback]');
    if(box){box.hidden=!feedback.text;box.textContent=feedback.text;box.dataset.tone=tone;box.setAttribute('role',tone==='error'?'alert':'status')}
    for(const b of panel?.querySelectorAll?.('[data-target-action="run"]')||[]){b.disabled=busy||isMonthLocked();b.textContent=busy?'Hesaplanıyor…':'Hedeflere Göre Dağıt';b.setAttribute('aria-busy',String(busy))}
    for(const b of panel?.querySelectorAll?.('[data-target-action=cancel]')||[])b.hidden=!busy;
    const legacy=document.getElementById('distResult');if(legacy)legacy.textContent=feedback.text;
  }
  async function runTargets(){
    try{
      if(preparing){report('Dağıtım zaten hesaplanıyor. Sonuç bu panelde gösterilecek.','progress',true);return false}
      if(isMonthLocked())throw Error('Bu ay kilitli. Liste değiştirilmedi.');
      const u=document.getElementById('autoUnit')?.value;
      if(!u)throw Error('Önce birimi ve personelleri seçin.');
      report('Hedef dağıtımı başlatılıyor…','progress',true);
      editableConfig(u).enabled=true;
      if(typeof window.rpysScheduler398?.runTargets!=='function')throw Error('Güvenli hedef dağıtım motoru yüklenemedi. Sayfayı yenileyin.');
      bestEffortRequested=true;
      try{return await window.rpysScheduler398.runTargets()}finally{bestEffortRequested=false}
    }catch(e){report(e.message||String(e),'error',false);console.error('RPYS hedef düğmesi',e);return false}
  }
  function hasPrepared(u){return prepared?.u===u}
  function cancel(){
    if(!currentJob)return false;
    currentJob.cancelled=true;
    currentJob.reject?.(Error('İşlem iptal edildi. Önceki liste korundu.'));
    report('İşlem iptal ediliyor; mevcut liste korunuyor…','progress',true);return true;
  }
  function recordIndex(m){
    const month=ym(),fixed=new Map(),current=new Map(),imports=new Map();
    const add=(map,key,value)=>{if(!map.has(key))map.set(key,[]);map.get(key).push(value)};
    for(const k of new Set([...Object.keys(db.assign||{}),...m.mutable])){
      const [ymKey,,day]=k.split('|'),date=ymKey+'-'+String(day).padStart(2,'0');
      if(ymKey===month)add(current,date,k);
      else{const pid=Number(db.assign[k]||0);if(pid)add(fixed,pid+'|'+date,k)}
    }
    for(const [index,record] of (db.importedRecords||[]).entries()){
      const date=String(record.date||record.monthKey+'-'+String(record.day).padStart(2,'0'));
      add(imports,Number(record.personId)+'|'+date,{index,record});
    }
    return (pid,dates)=>{
      const keys=[],extra=[];
      if(dates)for(const date of dates){keys.push(...current.get(date)||[],...fixed.get(pid+'|'+date)||[]);extra.push(...imports.get(pid+'|'+date)||[])}
      else{for(const group of current.values())keys.push(...group);for(const [key,group] of fixed)if(key.startsWith(pid+'|'))keys.push(...group);for(const [key,group] of imports)if(key.startsWith(pid+'|'))extra.push(...group)}
      return {keys,imports:extra};
    };
  }
  function historyIndex(m){
    // Other months are immutable in a draft. Read them once, then rebuild only
    // the selected month's known keys when candidate validation clears caches.
    const month=ym(),historical=allAssignmentsAllMonths().filter(a=>(a.monthKey||String(a.date).slice(0,7))!==month);
    const keys=new Set([...Object.keys(db.assign||{}).filter(k=>k.startsWith(month+'|')),...m.mutable]);
    const people=new Map((db.staff||[]).map(p=>[Number(p.id),p])),columns=new Map();
    _allAssignCache=null;
    return ()=>{
      if(_allAssignCache)return _allAssignCache;
      const rows=historical.slice();
      for(const k of keys){
        const pid=Number(db.assign[k]||0);if(!pid)continue;
        const [monthKey,type,dayS,...parts]=k.split('|'),colKey=parts.join('|'),columnKey=type+'|'+colKey;
        if(!columns.has(columnKey))columns.set(columnKey,dutyColumnByKey(type,colKey));
        const base=columns.get(columnKey),person=people.get(pid);if(!base||!person)continue;
        const col={...base},meta=db.assignmentMeta?.[k]||{};if(meta.shift)col.shift=meta.shift;if(meta.hours!=null)col.hours=Number(meta.hours);
        rows.push({monthKey,type,day:Number(dayS),date:monthKey+'-'+String(dayS).padStart(2,'0'),person,col});
      }
      for(const r of db.importedRecords||[]){
        if(r.monthKey!==month||(typeof isImportedShiftBlocked==='function'&&isImportedShiftBlocked(r)))continue;
        const person=people.get(Number(r.personId));if(person&&r.col)rows.push({monthKey:month,type:r.type,day:Number(r.day),date:r.date,person,col:r.col,importedExtra:true,source:r.source});
      }
      return _allAssignCache=rows;
    };
  }
  function gapRulesFor(m,rows){
    if(!unitRulesV251(m.u).maxGapEnabled)return [];
    if(window.rpysScheduler398.gapCalendar)return window.rpysScheduler398.gapCalendar(m.ids,m.u,ym()).map(({date,...rule})=>rule);
    const origin=Date.parse(ym()+'-01T00:00:00Z'),last=daysInMonth();
    const offset=s=>Math.round((Date.parse(s+'T00:00:00Z')-origin)/86400000)+1;
    const anchors=new Map(m.ids.map(id=>[id,{before:null,after:null,fixedDays:[]}]));
    // Match the all-month runtime: raw assignments in this unit are real
    // anchors. Imported statistics and a synthetic month edge are not duties.
    const units={ar1:'ACİL RÖNTGEN',ar2:'ACİL RÖNTGEN',bt1:'BİLGİSAYARLI TOMOGRAFİ',bt2:'BİLGİSAYARLI TOMOGRAFİ',btW:'BİLGİSAYARLI TOMOGRAFİ',sk1:'PORTABL + SKOPİ',sk2:'PORTABL + SKOPİ',porS:'PORTABL + SKOPİ',porW:'RUTİN PORTABL',mam:'MAMOGRAFİ',kem:'KEMİK ÖLÇÜMÜ',sec:'SEKRETERLİK',sor:'BİRİM SORUMLUSU'};
    for(let n=1;n<=5;n++)units['p'+n]='POLİKLİNİK RÖNTGEN';
    for(const [key,raw] of Object.entries(db.assign||{})){
      const a=anchors.get(Number(raw));if(!a)continue;
      const [month,type,day,col]=key.split('|');if(!month)continue;
      const u=units[col]||dutyColumnByKey(type,col)?.unit;if(u!==m.u)continue;
      const d=offset(month+'-'+String(Number(day)).padStart(2,'0'));if(!Number.isFinite(d))continue;
      if(month===ym())a.fixedDays.push(d);
      if(d<1&&(a.before===null||d>a.before))a.before=d;
      if(d>last&&(a.after===null||d<a.after))a.after=d;
    }
    return m.ids.map(id=>{
      const {before,after,fixedDays}=anchors.get(id),from=before===null?1:before+1,to=after===null?last:after-1;
      const leaves=(db.leaves||[]).filter(l=>Number(l.personId??l.idPerson??l.person?.id)===id&&l.start&&l.end).map(l=>[Math.max(from,offset(l.start)),Math.min(to,offset(l.end))]).filter(([a,b])=>a<=b).sort((a,b)=>a[0]-b[0]);
      const runs=[];let next=from;for(const [a,b] of leaves){if(a>next)runs.push([next,a-1]);next=Math.max(next,b+1)}if(next<=to)runs.push([next,to]);
      return {id,maxBlank:Number(gapLimit(m.u)),includeEdges:!!window.__RPYS_RULEPATCH8_EDGE_GAP_SPOUSE__,segments:nonLeaveSegmentsV2414(id),fixedDays:rows.filter(a=>Number(a.person.id)===id&&a.col.unit===m.u).map(a=>Number(a.day)),crossMonth:{before,after,fixedDays,last,runs,month:ym()}};
    });
  }
  async function planningData(u,{check=()=>{},progress=()=>{},partial=false}={}){
    const m=model(u,selected(u)),targets=readTargets(m,{partial});
    if(!partial)validateMonthlyLimits(m,targets);
    if(!m.ids.length)throw Error('Önce bu birimde çalışacak personelleri seç.');
    // Work exclusively on a detached database. No save is called during planning.
    let live=db;const draft=JSON.parse(JSON.stringify(live)),month=ym();db=draft;draftActive=true;clearCache();
    let sliceStart=Date.now(),originalAll=window.allAssignmentsAllMonths,indexed=null;
    const yieldIfNeeded=async()=>{
      if(Date.now()-sliceStart<8)return;
      const cached={assign:_assignCache,all:_allAssignCache,calc:_calcCache,people:_peopleCache};
      db=live;draftActive=false;window.allAssignmentsAllMonths=originalAll;clearCache();
      await new Promise(resolve=>setTimeout(resolve,0));
      live=db;originalAll=window.allAssignmentsAllMonths;
      if(ym()!==month)throw Error('Hesaplama sırasında veriler veya seçim değişti; plan kaydedilmedi.');
      db=draft;draftActive=true;window.allAssignmentsAllMonths=indexed;_assignCache=cached.assign;_allAssignCache=cached.all;_calcCache=cached.calc;_peopleCache=cached.people;sliceStart=Date.now();check();
    };
    try{
      for(const k of m.mutable){delete db.assign[k];if(db.assignmentMeta)delete db.assignmentMeta[k]}
      clearCache();
      const remaining=Object.fromEntries(m.ids.map(id=>[id,{day:Math.max(0,targets[id].day-m.fixed[id].day),night:Math.max(0,targets[id].night-m.fixed[id].night)}]));
      activeRecordIndex=recordIndex(m);indexed=historyIndex(m);window.allAssignmentsAllMonths=indexed;
      const rows=assignmentsMonth(),calendar=calendarFor(m),payroll=ruleOn(u,'obligationOvertime')?payrollState(m):{};
      for(const [index,s] of m.slots.entries()){
        check();progress('Uygun günler',index+1,m.slots.length);
        s.index=index;s.blocksNext=ruleOn(m.u,'noPostDuty')&&(isOvernightOrDutyShift(s.col)||Number(s.col.hours)>=16);s.allowed=m.ids.filter(id=>remaining[id][s.kind]>0&&!calendarReason(calendar,id,s.day,s.col)&&(!ruleOn(u,'avoidSameDay')||!rows.some(a=>Number(a.person.id)===id&&Number(a.day)===s.day&&a.col.unit===u))&&canTakeShiftV2414(id,s.day,s.col,u));
        if(Date.now()-sliceStart>=8)await yieldIfNeeded();
      }
      const problems=[];
      for(const id of m.ids)for(const t of kinds){
        const capacity=new Set(m.slots.filter(s=>s.kind===t&&s.allowed.includes(id)).map(s=>s.day)).size;
        if(automaticUnit!==u&&remaining[id][t]>capacity)problems.push(`${getPersonById(id).name}: ${targets[id][t]} ${labels[t]} hedefi; korunan ${m.fixed[id][t]}, uygun gün en fazla ${capacity}. İzin, dinlenme, mevcut görev veya özel kurallar nedeniyle en az ${remaining[id][t]-capacity} görev karşılanamıyor. Önerilen üst sınır: ${m.fixed[id][t]+capacity} (ortak kapasite ayrıca doğrulanır).`);
      }
      for(const id of m.ids){
        let free=0,rest=-Infinity;
        for(let d=1;d<=daysInMonth();d++){
          const options=m.slots.filter(s=>s.day===d&&s.allowed.includes(id));
          const nextFree=Math.max(free,rest,options.some(s=>!s.blocksNext)?free+1:-Infinity);
          const nextRest=options.some(s=>s.blocksNext)?free+1:-Infinity;
          free=nextFree;rest=nextRest;
        }
        const capacity=Math.max(free,rest),need=remaining[id].day+remaining[id].night;
        if(automaticUnit!==u&&ruleOn(u,'avoidSameDay')&&need>capacity)problems.push(`${getPersonById(id).name}: kalan ${remaining[id].day} gündüz + ${remaining[id].night} nöbet toplamı ${need}; aynı gün ve nöbet ertesi dinlenmeyle en fazla ${capacity} görev mümkün. En az ${need-capacity} görev azaltılmalı veya uygun günler gözden geçirilmeli.`);
      }
      for(const s of m.slots)if(!s.allowed.length)problems.push(`${s.day}. gün ${s.col.shift||s.col.key}: seçili personellerden hedefi kalan uygun kişi yok (izin, dinlenme, mevcut görev veya özel kural).`);
      if(problems.length&&!partial)throw Error(problems.join('\n'));
      const adapter=searchAdapter(m),conflicts=[],limits=[],cfg=ruleCfg(),crossPairs=new Set();for(const rule of [...textFor(m.u),...customFor(m.u)].filter(r=>r.active!==false&&r.kind==='pairAvoidSameDay')){crossPairs.add(Number(rule.personA)+'|'+Number(rule.personB));crossPairs.add(Number(rule.personB)+'|'+Number(rule.personA));}
      const addLimit=(id,days,max,longOnly=false)=>{
        const fixedDays=new Set(rows.filter(a=>Number(a.person.id)===id&&(longOnly?Number(a.col.hours)>=Number(cfg.longHours||23):a.col.unit===u)).map(a=>Number(a.day)));
        const fixed=days.filter(d=>fixedDays.has(d)).length;
        const values=m.slots.filter(s=>days.includes(s.day)&&s.allowed.includes(id)&&(!longOnly||s.long)).map(s=>`${s.index}:${id}`);
        if(values.length)limits.push({values,max:partial?Math.max(0,max-fixed):max-fixed});
      };
      for(const id of m.ids){
        if(cfg.avoidAlternate&&(window.rpysRules421||db.settings.avoidAlternate))for(let d=1;d+4<=daysInMonth();d++)addLimit(id,[d,d+2,d+4],2,true);
        for(const rule of [...textFor(m.u),...customFor(m.u)].filter(r=>r.active!==false&&r.kind==='unitConsecutive'&&r.unit===u&&(!r.personId||Number(r.personId)===id))){
          const max=Number(rule.maxConsecutive||1);
          for(let d=1;d+max<=daysInMonth();d++)addLimit(id,Array.from({length:max+1},(_,i)=>d+i),max);
        }
      }
      // Pair rules concern the same/adjacent days (or the shift's own span).
      // Index nearby cells once instead of rechecking every person against
      // every cell in the month. Long-range gap and monthly rules are compiled
      // separately below.
      const pairSpan=Math.max(2,Number(cfg.minGap||2),...m.slots.map(s=>Math.ceil(Number(s.col.hours||0)/24)+1));
      const slotsByDay=new Map();for(const s of m.slots){if(!slotsByDay.has(s.day))slotsByDay.set(s.day,[]);slotsByDay.get(s.day).push(s)}
      for(let i=0;i<m.slots.length;i++)for(const id of m.slots[i].allowed){
        check();progress('Görev çakışmaları',i+1,m.slots.length);
        const a=m.slots[i];adapter.place(id,a);
        try{for(let day=Math.max(1,a.day-pairSpan);day<=Math.min(daysInMonth(),a.day+pairSpan);day++)for(const b of slotsByDay.get(day)||[]){
          if(b.index<=i)continue;
          for(const other of b.allowed){
            if(other!==id&&(day!==a.day||!crossPairs.has(id+'|'+other)))continue;
            if(!adapter.canPlace(other,b))conflicts.push([`${i}:${id}`,`${b.index}:${other}`]);
          }
        }}
        finally{adapter.remove(id,a)}
        if(Date.now()-sliceStart>=8)await yieldIfNeeded();
      }
      for(const id of m.ids)if(targets[id].weekendNight!==null){
        for(const weekend of [true,false]){
          const total=weekend?targets[id].weekendNight:targets[id].night-targets[id].weekendNight;
          const fixed=weekend?m.fixed[id].weekendNight:m.fixed[id].night-m.fixed[id].weekendNight;
          const need=Math.max(0,total-fixed),values=m.slots.filter(s=>s.kind==='night'&&s.weekendNight===weekend&&s.allowed.includes(id)).map(s=>`${s.index}:${id}`);
          limits.push({values,min:partial?0:need,max:need,reason:`${getPersonById(id).name}: ${weekend?'hafta sonu':'hafta içi'} nöbet hedefi için ${need} ek görev gerekiyor; uygun günler, izin/dinlenme ve diğer görevler birlikte yetmiyor.`});
        }
      }
      for(const rule of [...textFor(m.u),...customFor(m.u)].filter(r=>r.active!==false&&r.unit===u&&['unitPersonMonthlyMax','personUnitMonthlyMax'].includes(r.kind)))for(const id of m.ids)if(rule.kind==='unitPersonMonthlyMax'||Number(rule.personId)===id)limits.push({values:m.slots.filter(s=>s.allowed.includes(id)).map(s=>`${s.index}:${id}`),max:Math.max(0,Number(rule.max||0)-m.fixed[id].day-m.fixed[id].night)});
      const dependencies=[];
      if(ruleOn(u,'spouseSameDay')&&typeof spouseOf==='function')for(const s of m.slots)for(const id of s.allowed){
        const other=Number(spouseOf(id)||0);if(!other)continue;
        if(window.rpysScheduler398.spouseUnavailable(other,s.day,ym())||window.rpysScheduler398.reservedOn(other,s.day,ym())||window.rpysScheduler398.spouseWorkingOnDay(other,s.day,ym())||isOnLeave(other,s.day))continue;
        dependencies.push({when:`${s.index}:${id}`,anyOf:m.slots.filter(x=>x.index!==s.index&&x.day===s.day&&x.allowed.includes(other)).map(x=>`${x.index}:${other}`),reason:`${getPersonById(id).name} / ${getPersonById(other)?.name||other}: ${s.day}. gün iki eş için uygun görev gerekiyor; izinli eş çalışmak zorunda değil.`});
      }
      if(partial)for(const id of m.ids){
        const blocked=dependencies.filter(r=>Number(r.when.split(':')[1])===id&&!r.anyOf.length).map(r=>m.slots[Number(r.when.split(':')[0])].day);
        if(blocked.length)problems.push(`${getPersonById(id).name}: eşlerin aynı gün çalışma kuralı için ${[...new Set(blocked)].join(', ')}. günlerde eşine uygun ikinci görev yok. Eşi başka birimde çalışmıyor ve izinli değil; personel seçimini ve uygun hücreleri kontrol edin. İzinli eşin çalışması gerekmez.`);
      }
      const obligations=requirementsFor(m,calendar),softRequirements=new Set();
      for(const id of m.ids){
        const chosenDays=[],availableDays=new Set(m.slots.filter(s=>s.allowed.includes(id)).map(s=>s.day));
        for(const r of obligations.filter(r=>r.id===id).sort((a,b)=>Math.max(...a.days)-Math.max(...b.days))){
          if(chosenDays.some(d=>r.days.has(d)))continue;
          const options=[...r.days].filter(d=>availableDays.has(d));
          if(!options.length){const reason=`${getPersonById(id).name}: ${r.reason} için ${[...r.days].join(', ')}. günlerde uygun görev yok.`;if(partial){if(!r.hard)softRequirements.add(r);problems.push(reason);continue}throw Error(reason)};
          chosenDays.push(Math.max(...options));
        }
        const need=remaining[id].day+remaining[id].night;
        if(chosenDays.length>need){const reason=`${getPersonById(id).name}: kalan hedef ${remaining[id].day} gündüz + ${remaining[id].night} nöbet = ${need} görev. Mevcut görev aralığı/izin dönüşü kuralları en az ${chosenDays.length} ek görev gerektiriyor. Hedef toplamı en az ${m.fixed[id].day+m.fixed[id].night+chosenDays.length} olmalı; diğer personellerin toplamları buna göre yeniden dengelenmeli. Hedefler değiştirilmedi.`;if(partial){for(const r of obligations.filter(r=>r.id===id&&!r.hard))softRequirements.add(r);problems.push(reason)}else throw Error(reason)}
      }
      const requirements=obligations.map(r=>({id:r.id,reason:r.reason,hard:!!r.hard,soft:!r.hard&&softRequirements.has(r),values:m.slots.filter(s=>r.days.has(s.day)&&s.allowed.includes(r.id)).map(s=>`${s.index}:${r.id}`)}));
      // A partial plan may relax optimization goals, but never put a returning
      // person on later dates while omitting their mandatory first workday.
      for(const r of requirements.filter(r=>r.hard))for(const s of m.slots.filter(s=>s.allowed.includes(r.id)))dependencies.push({when:`${s.index}:${r.id}`,anyOf:r.values,reason:`${getPersonById(r.id).name}: ${r.reason}`});
      const gapRules=gapRulesFor(m,rows);
      for(const rule of gapRules.filter(r=>r.includeEdges)){
        let minimum=0;
        for(const [a,b] of rule.segments){const days=[a-1,...new Set(rule.fixedDays.filter(d=>d>=a&&d<=b)),b+1].sort((x,y)=>x-y);for(let i=1;i<days.length;i++)minimum+=Math.floor((days[i]-days[i-1]-1)/(rule.maxBlank+1));}
        const need=remaining[rule.id].day+remaining[rule.id].night;
        if(minimum>need){const reason=`${getPersonById(rule.id).name}: hedef ${targets[rule.id].day} gündüz + ${targets[rule.id].night} nöbet = ${targets[rule.id].day+targets[rule.id].night} görev. Etkin ${rule.maxBlank} boş gün kuralı ay başını, ay sonunu ve izin dışı dönemleri de kapsıyor; korunan görevlerle birlikte en az ${m.fixed[rule.id].day+m.fixed[rule.id].night+minimum} görev gerekiyor. En az ${minimum-need} görev eksik. Öneri: bu kişinin toplam hedefini artırıp diğer kişilerin hedeflerini dengeleyin veya görev aralığı ayarını gözden geçirin. Hedefler ve liste değiştirilmedi.`;if(partial){rule.soft=true;problems.push(reason.replace('Hedefler ve liste değiştirilmedi.','Uygun görevler yerleştirilir; bu kişinin boş gün sınırı karşılanamayabilir.'))}else throw Error(reason)}
      }
      if(automaticUnit===u){
        const requiredDays=new Map();for(const r of requirements.filter(r=>r.hard))for(const value of r.values){const day=m.slots[Number(value.split(':')[0])].day;if(!requiredDays.has(day))requiredDays.set(day,new Set());requiredDays.get(day).add(r.id)}
        for(const [day,required] of requiredDays){
          for(const id of [...required]){const other=ruleOn(u,'spouseSameDay')&&typeof spouseOf==='function'?Number(spouseOf(id)||0):0;if(other&&!window.rpysScheduler398.spouseUnavailable(other,day)&&!window.rpysScheduler398.reservedOn(other,day)&&!window.rpysScheduler398.spouseWorkingOnDay(other,day))required.add(other)}
          const owner=new Map(),slots=m.slots.filter(s=>s.day===day);const augment=(id,seen)=>{for(const s of slots){if(!s.allowed.includes(id)||seen.has(s.index))continue;seen.add(s.index);if(!owner.has(s.index)||augment(owner.get(s.index),seen)){owner.set(s.index,id);return true}}return false};
          for(const id of required)if(!augment(id,new Set()))problems.push(`${day}. gün izin dönüşü ve eş kuralı nedeniyle ${[...required].map(id=>getPersonById(id)?.name||id).join(', ')} için ${required.size} ayrı görev gerekiyor; uygun vardiya hücreleri yetmiyor. İzin, rezerve ve kilitli kayıtları veya birim vardiyalarını kontrol edin. Uygun görevler uygulanır; işbaşı yerleşmeyen kişiye sonraki günlerde yeni görev yazılmaz.`);
        }
      }
      if(automaticUnit===u)for(const rule of gapRules){
        const edge=rule.crossMonth,days=[...rule.fixedDays,...m.slots.filter(s=>s.allowed.includes(rule.id)).map(s=>s.day)];
        for(const side of ['before','after']){if(edge?.[side]==null)continue;const blank=d=>Math.max(0,...edge.runs.map(([lo,hi])=>Math.max(0,Math.min(hi,(side==='before'?d:edge.after)-1)-Math.max(lo,(side==='before'?edge.before:d)+1)+1)));if(!days.some(d=>blank(d)<=rule.maxBlank)){const date=plusDate(ym()+'-01',edge[side]-1);problems.push(`${getPersonById(rule.id).name}: ${side==='before'?'önceki':'sonraki'} ayın ${date} göreviyle ${rule.maxBlank} boş gün sınırını sağlayacak uygun gün yok. Ay geçişi listesini, izin/rezerve kayıtlarını veya kilitli hücreleri kontrol edin. Uygun görevler korunur; boş gün sınırı ayrıca raporlanır.`)}}
      }
      if(automaticUnit===u){
        const needs=gapRules.map(rule=>({id:rule.id,n:rule.segments.reduce((n,[a,b])=>{const days=[a-1,...rule.fixedDays.filter(d=>d>=a&&d<=b),b+1].sort((x,y)=>x-y);return n+days.slice(1).reduce((m,d,i)=>m+Math.floor((d-days[i]-1)/(rule.maxBlank+1)),0)},0)})),minimum=needs.reduce((n,x)=>n+x.n,0),available=m.slots.filter(s=>s.allowed.length).length;
        if(minimum>available)problems.push(`${u}: ${needs.filter(x=>x.n).map(x=>(getPersonById(x.id)?.name||x.id)+': en az '+x.n+' ek görev').join('; ')}. ${gapRules[0]?.maxBlank||5} boş gün kuralı için toplam ${minimum} ek görev gerekiyor; yalnız ${available} uygun hücre var.${!m.rebuild?' Mevcut görevleri koru modu açık. Otomatik görevleri yeniden yerleştirmek için “Seçili birimi baştan dağıt” seçeneğini açın; manuel ve kilitli kayıtlar korunur.':' Personel seçimini, izin/rezerve takvimini veya vardiya sayısını düzenleyin.'} Uygun görevler yerleştirilir; boş gün sınırındaki eksikler ayrıca gösterilir.`);
      }
      return {m,targets,problems,input:{payroll,allowPartial:partial,hardGaps:gapRules.length>0,strictAllCalendars:automaticUnit===u,allowGapShortfall:automaticUnit===u,ids:m.ids,names:Object.fromEntries(m.ids.map(id=>[id,getPersonById(id).name])),remaining,slots:m.slots.map(s=>({index:s.index,day:s.day,kind:s.kind,hours:Number(s.col.hours||0),category:s.col.cat==='Poliklinik'?'pol':s.col.cat==='Acil'?'ac':s.type==='acil'?'ac':'pol',allowed:s.allowed})),conflicts,requirements,limits,gapRules,dependencies}};
    }finally{db=live;draftActive=false;activeRecordIndex=null;window.allAssignmentsAllMonths=originalAll;clearCache()}
  }
  function validatePartial(m,plan){
    const notes=[],retained=[],seen=new Set(),calendar=calendarFor(m),used=Object.fromEntries(m.ids.map(id=>[id,empty()])),targets=readTargets(m,{partial:true});
    const spouseIssues=()=>window.rpysScheduler398.spouseDayViolations?.(ym())||[],beforeSpouses=new Set(spouseIssues().map(x=>x.key));
    for(const x of plan){
      const s=m.slots[x.slot];
      if(!s||seen.has(s.key)||!s.allowed.includes(x.id)||!used[x.id]||++used[x.id][s.kind]>Math.max(0,targets[x.id][s.kind]-m.fixed[x.id][s.kind]))throw Error('Kısmi planın hücre/hedef doğrulaması başarısız. Liste korunuyor.');
      if(s.kind==='night'&&targets[x.id].weekendNight!==null){
        if(s.weekendNight)used[x.id].weekendNight++;
        const weekend=used[x.id].weekendNight,weekday=used[x.id].night-weekend,fixed=m.fixed[x.id],t=targets[x.id];
        if(weekend>Math.max(0,t.weekendNight-fixed.weekendNight)||weekday>Math.max(0,t.night-t.weekendNight-(fixed.night-fixed.weekendNight)))throw Error('Hafta sonu/hafta içi nöbet alt hedefi aşılamaz. Liste korunuyor.');
      }
      seen.add(s.key);db.assign[s.key]=x.id;retained.push(x);
    }
    clearCache();
    // Validate the whole draft, pruning only new unsafe assignments to a fixed
    // point. Existing assignments are immutable in partial mode.
    let changed=true;
    while(changed){
      changed=false;
      for(let i=retained.length-1;i>=0;i--){
        const x=retained[i],s=m.slots[x.slot];delete db.assign[s.key];clearCache();let ok;
        try{ok=!calendarReason(calendar,x.id,s.day,s.col)&&canTakeShiftV2414(x.id,s.day,s.col,m.u)}finally{if(ok)db.assign[s.key]=x.id;clearCache()}
        if(!ok){retained.splice(i,1);changed=true;notes.push(`${getPersonById(x.id).name}: ${s.day}. gün ${labels[s.kind]} yerleştirilemedi; izin/dinlenme/mevcut görev veya özel uygunluk kuralı.`)}
      }
      for(const requirement of requirementsFor(m,calendar).filter(r=>r.hard)){
        for(let i=retained.length-1;i>=0;i--)if(Number(retained[i].id)===requirement.id){const x=retained[i];delete db.assign[m.slots[x.slot].key];retained.splice(i,1);changed=true;notes.push(`${getPersonById(x.id).name}: zorunlu izin dönüşü ilk iş günü yerleşmediği için yeni görevleri uygulanmadı. Korunan kayıtlar ve hedefleri değiştirilmedi.`)}
        clearCache();
      }
      for(const issue of spouseIssues().filter(x=>!beforeSpouses.has(x.key))){
        let removed=false;
        for(let i=retained.length-1;i>=0;i--){const x=retained[i],s=m.slots[x.slot];if(s.day===issue.day&&[issue.first,issue.second].includes(Number(x.id))){delete db.assign[s.key];retained.splice(i,1);removed=changed=true;notes.push(`${getPersonById(x.id).name}: ${s.day}. gün eşlerin aynı gün çalışma kuralı nedeniyle boş bırakıldı.`)}}
        clearCache();if(!removed)throw Error('Kısmi planda eşlerin aynı gün çalışma kuralı doğrulanamadı; liste korundu.');
      }
    }
    const gapIssues=ruleOn(m.u,'maxGapEnabled')?window.rpysScheduler398.gapViolations(m.ids,m.u,ym()):[];
    for(const gap of gapIssues)notes.push(`${getPersonById(gap.id).name}: ${gap.leftDate} – ${gap.rightDate} arasında ${gap.blank} boş gün; sınır ${gap.maxBlank}. Uygun görevler korundu; bu kural ayrıca gözden geçirilmeli.`);
    const rules=finalRules(m);if(rules!==true)notes.push(String(rules));
    for(const r of requirementsFor(m))notes.push(`${getPersonById(r.id).name}: ${[...r.days].join(', ')}. gün ${r.reason} görevi eksik.`);
    return {plan:retained,notes:[...new Set(notes)],gapExceptions:[...new Set(gapIssues.map(x=>Number(x.id)))]};
  }
  function planningFingerprint(){
    const ignored=new Set(['_meta','ui','auditLog','poliklinikTakipConfig','polTrackConfig','polTracking322','quickPrint383','sayRoster']);
    const exact=new Set(['assign','assignmentMeta','manualDutyOverrides','rpysCellLocks','unitPools','staff','leaves','importedRecords']);
    function canonical(value,preserve=false){
      if(value===null||typeof value!=='object')return value;
      if(Array.isArray(value)){const result=value.map(v=>canonical(v,preserve));return result.length||preserve?result:undefined}
      const result={};for(const k of Object.keys(value).sort()){const v=canonical(value[k],preserve);if(v!==undefined)result[k]=v}
      return Object.keys(result).length||preserve?result:undefined;
    }
    const state={};for(const k of Object.keys(db).sort())if(!ignored.has(k)){const value=k==='staff'?(db.staff||[]).map(({color,...person})=>person):db[k],v=canonical(value,exact.has(k));if(v!==undefined&&!(v&&typeof v==='object'&&Object.keys(v).length===0))state[k]=v}
    return JSON.stringify(state);
  }
  async function prepareAutomatic(u,resume){
    if(preparing||automaticUnit)return false;
    automaticUnit=u;try{return await prepare(u,resume)}finally{automaticUnit=null}
  }
  async function prepare(u,resume){
    if(preparing){report('Dağıtım zaten hesaplanıyor.','progress',true);return false;}
    if(isMonthLocked()){report('Bu ay kilitli. Liste değiştirilmedi.','error',false);return false;}
    preparing=true;let worker,timer;
    const job={started:Date.now(),workerMs:0,cancelled:false,reject:null};currentJob=job;
    let preparationLimit=6000;
    const check=()=>{if(job.cancelled)throw Error('İşlem iptal edildi. Önceki liste korundu.');if(Date.now()-job.started-job.workerMs>preparationLimit)throw Error('Uygun gün hazırlığı zamanında tamamlanamadı; mevcut liste korunuyor. Bu sonuç hedeflerin imkânsız olduğunu göstermez.');};
    let lastProgress=0;
    const progress=(phase,done,total)=>{if(Date.now()-lastProgress<200)return;lastProgress=Date.now();report(`${phase}: ${done} / ${total} · ${Math.floor((Date.now()-job.started)/1000)} sn`,'progress',true)};
    report('Hedefler ve uygun günler denetleniyor; geçici plan arka planda hazırlanıyor…','progress',true);
    try{
      const sourceUnit=document.getElementById('autoUnit')?.value,fingerprint=planningFingerprint(),month=ym(),selectionRebuild=!!document.getElementById('rebuildSelectedUnitV246')?.checked;
      // Short Skopi targets cannot cover every editable cell. Start with a
      // partial plan and honor the user's rebuild selection for unlocked cells.
      const current=model(u,selected(u)),given=readTargets(current,{partial:true});
      const short=u==='PORTABL + SKOPİ'&&kinds.some(t=>current.ids.reduce((n,id)=>n+given[id][t],0)<current.required[t]);
      const attempts=automaticUnit===u||short?[true]:bestEffortRequested?[false,true]:[false];let data,result,reason='',notes=[],gapExceptions=[];
      for(const partial of attempts){
        preparationLimit=partial?90000:30000;
        try{data=await planningData(u,{check,progress,partial})}
        catch(e){if(!partial&&bestEffortRequested&&!job.cancelled){reason=e.message;continue}throw e}
        check();
        if(typeof Worker!=='function')throw Error('Bu tarayıcı arka plan hesaplamasını desteklemiyor. Liste değiştirilmedi.');
        report(partial?'Yerleştirilebilen görevler hesaplanıyor; eksikler ayrıca gösterilecek…':'Takvime tam hedeflerle yerleştirme hesaplanıyor…','progress',true);
        worker??=new Worker(workerURL);
        const excluded=[],started=Date.now(),searchBudget=automaticUnit===u?1200:partial?8000:bestEffortRequested?1800:3200;
        let accepted=false;
        for(;;){
          if(job.cancelled)throw Error('İşlem iptal edildi. Önceki liste korundu.');
          const workerStarted=Date.now();
          try{result=await new Promise((resolve,reject)=>{
            job.reject=reject;worker.onmessage=e=>{clearTimeout(timer);resolve(e.data)};
            worker.onerror=()=>{clearTimeout(timer);reject(Error('Arka plan dağıtım motoru yüklenemedi; liste değiştirilmedi.'))};
            timer=setTimeout(()=>reject(Error('Arka plan hesaplaması tamamlanamadı; liste değiştirilmedi.')),Math.max(5200,searchBudget+3000));
            worker.postMessage({...data.input,excluded,timeLimit:Math.max(1,searchBudget-(Date.now()-started)),maxNodes:partial&&automaticUnit!==u?120000:7000});
          })}finally{job.workerMs+=Date.now()-workerStarted}job.reject=null;
          if(job.cancelled)throw Error('İşlem iptal edildi. Önceki liste korundu.');
          if(result.error)throw Error('Arka plan motoru hatası: '+result.error+'; liste değiştirilmedi.');
          if(!result.ok){
            const message=(result.timedOut?'Verilen sürede geçerli tam plan bulunamadı; bu sonuç hedeflerin imkânsız olduğunu kanıtlamaz.':'Hedefler ortak uygun günler ve görev çakışmalarıyla birlikte karşılanamıyor.')+'\n'+(result.lastFailure||'İzin, nöbet ertesi dinlenme ve özel kurallar.');
            if(bestEffortRequested&&!partial){reason=message;break}throw Error(message);
          }
          const currentFingerprint=planningFingerprint();if(currentFingerprint!==fingerprint){const a=JSON.parse(fingerprint),b=JSON.parse(currentFingerprint);console.warn('RPYS plan değişiklik denetimi',Object.keys({...a,...b}).filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k])).join(', '))}
          if(ym()!==month||currentFingerprint!==fingerprint||document.getElementById('autoUnit')?.value!==sourceUnit||JSON.stringify(selected(u))!==JSON.stringify(data.m.ids)||!!document.getElementById('rebuildSelectedUnitV246')?.checked!==selectionRebuild)throw Error('Hesaplama sırasında veriler veya seçim değişti. Yeni bilgilerle dağıtımı tekrar başlatın; plan kaydedilmedi.');
          report('Yerleştirilen görevlerin güvenlik ve hedef kontrolleri yapılıyor…','progress',true);
          const live=db,originalAll=window.allAssignmentsAllMonths;db=JSON.parse(JSON.stringify(live));draftActive=true;clearCache();let verdict;
          try{
            const beforeSpouses=new Set((window.rpysScheduler398.spouseDayViolations?.(ym())||[]).map(x=>x.key));
            for(const k of data.m.mutable){delete db.assign[k];if(db.assignmentMeta)delete db.assignmentMeta[k]}
            clearCache();activeRecordIndex=recordIndex(data.m);window.allAssignmentsAllMonths=historyIndex(data.m);
            if(partial){const checked=validatePartial(data.m,result.plan);result.plan=checked.plan;gapExceptions=checked.gapExceptions;notes=[...data.problems,...checked.notes];verdict=true}
            else{const adapter=searchAdapter(data.m);for(const x of result.plan)adapter.place(x.id,data.m.slots[x.slot]);verdict=adapter.finalCheck();if(verdict===true){const issues=(window.rpysScheduler398.spouseDayViolations?.(ym())||[]).filter(x=>!beforeSpouses.has(x.key));if(issues.length){const x=issues[0];verdict=`${getPersonById(x.first)?.name||x.first} / ${getPersonById(x.second)?.name||x.second}: ${x.day}. gün eşlerin aynı gün çalışma kuralı.`}}}
          }finally{db=live;draftActive=false;activeRecordIndex=null;window.allAssignmentsAllMonths=originalAll;clearCache()}
          if(verdict===true){accepted=true;break}
          if(automaticUnit===u&&result.timedOut)throw Error('Verilen sürede bütün kuralları sağlayan plan bulunamadı; bu sonuç hedeflerin imkânsız olduğunu kanıtlamaz.\n'+String(verdict));
          if(bestEffortRequested){reason=String(verdict);break}
          excluded.push(result.plan.map(x=>`${x.slot}:${x.id}`));
          if(Date.now()-started>=searchBudget)throw Error(String(verdict)+'\nGeçerli alternatif plan süre içinde bulunamadı; liste ve hedefler korundu.');
        }
        if(accepted){
          if(partial&&!result.plan.length){report('Yerleştirilebilen yeni görev yok. Mevcut liste korundu.\n'+[reason,...data.problems,...notes].filter(Boolean).join('\n'),'warning',false);return {ok:false,partial:true,plan:[],notes}}
          prepared={u,partial,timedOut:!!result.timedOut,reason:partial?reason:'',notes:partial&&result.timedOut?[...notes,'Bulunan kısmi plan uygulandı; daha fazla görevin yerleşemeyeceği kanıtlanmış değildir.']:notes,plan:result.plan.map(x=>({id:x.id,slot:data.m.slots[x.slot]})),nodes:result.nodes,gapExceptions:partial?gapExceptions:[]};break;
        }
      }
      if(!prepared)throw Error(reason||'Yerleştirilebilen plan bulunamadı; mevcut liste korundu.');
      report('Plan doğrulandı. Güvenli kayıt hazırlanıyor…','progress',true);
      return resume();
    }catch(e){console.error('RPYS dağıtım hazırlığı',e);report(e.message||String(e),'error',false);alert('Dağıtım uygulanmadı; mevcut liste ve hedefler korundu.\n\n'+(e.message||e));return false}
    finally{clearTimeout(timer);worker?.terminate();preparing=false;prepared=null;currentJob=null;activeRecordIndex=null;report(feedback.text,feedback.tone,false)}
  }
  function distribute(u){
    if(!window.rpysScheduler398?.running())throw Error('Güvenli dağıtım oturumu gerekli.');
    const partial=!!prepared?.partial,m=model(u,selected(u));if(!m.ids.length)throw Error('Önce bu birimde çalışacak personelleri seç.');
    const targets=readTargets(m,{partial});
    if(!partial)validateMonthlyLimits(m,targets);
    activeRecordIndex=recordIndex(m);
    for(const k of m.mutable){if(db.assign[k]&&!window.rpysScheduler398.mayClear(k))throw Error('Korunan kayıt değiştirilemez.');delete db.assign[k];if(db.assignmentMeta)delete db.assignmentMeta[k];}
    clearCache();
    const remaining=Object.fromEntries(m.ids.map(id=>[id,{day:Math.max(0,targets[id].day-m.fixed[id].day),night:Math.max(0,targets[id].night-m.fixed[id].night)}]));
    const occupied=new Set(assignmentsMonth().filter(a=>a.col.unit===u).map(a=>Number(a.person.id)+'|'+Number(a.day)));
    const eligibility=new Map(),calendarForDraft=calendarFor(m);
    const canPlace=(id,s)=>{
      if(ruleOn(u,'avoidSameDay')&&occupied.has(id+'|'+s.day)||calendarReason(calendarForDraft,id,s.day,s.col))return false;
      const k=id+'|'+s.key;
      if(!eligibility.has(k))eligibility.set(k,!!canTakeShiftV2414(id,s.day,s.col,u));
      return eligibility.get(k);
    };
    for(const s of m.slots)s.allowed=m.ids.filter(id=>remaining[id][s.kind]>0&&canPlace(id,s));
    const requirements=partial?[]:requirementsFor(m);
    for(const r of requirements)if(!m.slots.some(s=>r.days.has(s.day)&&s.allowed.includes(r.id)))throw Error(`${getPersonById(r.id).name}: ${r.reason} için ${[...r.days].join(', ')}. günlerde uygun hücre yok.`);
    for(const s of m.slots)if(!partial&&!s.allowed.length)throw Error(`${s.day}. gün ${s.col.shift||s.col.key}: hedefi kalan uygun personel yok (izin, dinlenme, başka görev veya korunan kayıt).`);
    if(!hasPrepared(u))throw Error('Önce arka plan dağıtım planı hazırlanmalı.');
    const result={ok:true,partial,timedOut:!!prepared.timedOut,plan:prepared.plan,nodes:prepared.nodes,gapExceptions:partial?(prepared.gapExceptions||[]):[]};
    let unresolved=[];
    if(partial){
      const checked=validatePartial(m,prepared.plan.map(x=>({id:x.id,slot:m.slots.findIndex(s=>s.key===x.slot.key),kind:x.slot.kind})));
      result.gapExceptions=checked.gapExceptions;
      unresolved=checked.notes;
      result.plan=checked.plan.map(x=>({id:x.id,slot:m.slots[x.slot]}));result.notes=[...new Set([prepared.reason?'Tam plan kontrolü: '+prepared.reason.replace(/Hedefler ve liste değiştirilmedi\./g,'').trim():'',...prepared.notes,...checked.notes].filter(Boolean).map(n=>String(n).replace(/Hedefler ve liste değiştirilmedi\./g,'').trim()))];
      if(!result.plan.length)throw Error('Yeni güvenli görev yerleştirilemedi; mevcut liste korundu.');
    }else{
      const adapter=searchAdapter(m);
      for(const x of result.plan){const s=m.slots.find(s=>s.key===x.slot.key);if(!s||!s.allowed.includes(x.id)||remaining[x.id][s.kind]<=0||!adapter.canPlace(x.id,s))throw Error('Geçici plan güncel uygunluk kurallarını karşılamıyor.');adapter.place(x.id,s);remaining[x.id][s.kind]--;}
      const verdict=adapter.finalCheck();if(verdict!==true)throw Error(String(verdict));
    }
    clearCache();const actual=model(u,m.ids).actual;
    for(const id of m.ids)for(const t of metrics.filter(t=>targets[id][t]!=null))if(partial?actual[id][t]>Math.max(targets[id][t],m.fixed[id][t]):actual[id][t]!==targets[id][t])throw Error('Hedef doğrulaması başarısız; önceki liste korundu.');
    if(automaticUnit===u){
      const unfilled=m.slots.filter(s=>!db.assign[s.key]);result.partial=unfilled.length>0||result.gapExceptions.length>0||result.notes?.length>0;result.unfilled=unfilled;result.shortfalls=[];
      db.unitPools??={};db.unitPools[key(u)]=m.ids.slice();if(u==='PORTABL + SKOPİ')db.skopiEligible=m.ids.slice();
      db.v251PlanAudit??={};db.v251PlanAudit[key(u)]={at:new Date().toISOString(),engine:'csp-worker-gap-calendar',gaps:window.rpysScheduler398.gapViolations(m.ids,u,ym()),filled:result.plan.length,unfilled:unfilled.map(s=>({day:s.day,key:s.key})),notes:result.notes||[]};
      window.rpysScheduler398.validateReturnsFor?.([...new Set(result.plan.map(x=>Number(x.id)))]);saveNowV245({allowAssignDrop:m.rebuild,label:u+' boş gün sınırıyla güvenli otomatik dağıtım'});renderAll();render();
      report(`${u}: ${result.partial?'Kısmi dağıtım uygulandı. ':''}${result.plan.length} görev yerleştirildi; ${unfilled.length} hücre boş. İzin/rezerve, çakışma, nöbet ertesi dinlenme ve korunan kayıtlar denetlendi.${result.gapExceptions.length?` ${gapLimit(u)} boş gün sınırı bazı kişilerde karşılanamadı; uygun görevler uygulandı.`:''}${result.timedOut?' Daha fazla görevin yerleşemeyeceği kanıtlanmış değildir.':''}\n${[...new Set([...(result.notes||[]),...unfilled.map(s=>`${s.day}. gün ${s.col.shift||s.col.key}: uygun personel yerleştirilemedi (izin, dinlenme, başka görev veya özel kurallar); elle kontrol edilebilir.`)])].join('\n')}` ,result.partial?'warning':'success',false);return result;
    }
    result.shortfalls=m.ids.flatMap(id=>metrics.filter(t=>targets[id][t]!=null&&actual[id][t]<targets[id][t]).map(t=>({id,kind:t,target:targets[id][t],actual:actual[id][t],missing:targets[id][t]-actual[id][t]})));
    result.unfilled=m.slots.filter(s=>!db.assign[s.key]).map(s=>({day:s.day,kind:s.kind,key:s.key,reason:s.allowed.length&&s.allowed.every(id=>actual[id][s.kind]>=targets[id][s.kind])?'Uygun personellerin ilgili hedefleri doldu.':'İzin, dinlenme, mevcut görev veya özel kurallar kalan hedeflerle birlikte yerleşmedi; elle kontrol edilebilir.'}));
    if(partial&&!result.shortfalls.length&&!result.unfilled.length&&!unresolved.length&&m.ids.every(id=>metrics.every(t=>targets[id][t]==null||actual[id][t]===targets[id][t]))){result.partial=false;result.notes=[]}
    console.info('RPYS hedef dağıtım teşhisi',{unit:u,month:ym(),slots:m.slots.length,nodes:result.nodes,partial,filled:result.plan.length,engine:'csp-worker'});
    db.unitPools??={};db.unitPools[key(u)]=m.ids.slice();if(u==='PORTABL + SKOPİ')db.skopiEligible=m.ids.slice();
    db.manualDistributionResultsV399??={};db.manualDistributionResultsV399[key(u)]={at:new Date().toISOString(),engine:'6.1.1-csp-worker',targets,actual,filled:result.plan.length,status:result.partial?'partial':'complete',notes:result.notes||[],shortfalls:result.shortfalls,unfilled:result.unfilled,payroll:payrollState(m)};
    window.rpysScheduler398.validateReturnsFor?.(partial?[...new Set(result.plan.map(x=>Number(x.id)))]:m.ids);
    saveNowV245({allowAssignDrop:m.rebuild,label:`${u} elle gündüz/nöbet hedeflerine göre dağıtım`});
    renderAll();render();
    if(result.partial){
      const shortages=result.shortfalls.map(x=>`${getPersonById(x.id).name}: ${x.actual} / ${x.target} ${labels[x.kind]}; ${x.missing} eksik (izin, dinlenme, diğer görevler, özel kurallar veya ortak uygun gün kapasitesi).`);
      const overages=m.ids.flatMap(id=>metrics.filter(t=>targets[id][t]!=null&&actual[id][t]>targets[id][t]).map(t=>`${getPersonById(id).name}: mevcut ${actual[id][t]} ${labels[t]}, hedef ${targets[id][t]}; mevcut kayıtlar korundu.`));
      report(`${u}: Kısmi dağıtım uygulandı. ${result.plan.length} yeni görev yerleştirildi; ${result.unfilled.length} hücre boş kaldı. Mevcut liste ve hedef değerleri korundu.\n${shortages.length?shortages.join('\n'):'Eksik personel hedefi kalmadı; aşağıdaki koşullar hâlâ düzeltilmeli.'}\n${[...overages,...result.notes].join('\n')}`,'warning',false);
    }else report(`${u}: ${result.plan.length} görev yerleştirildi. Seçili ${m.ids.length} personelin ${m.ids.some(id=>targets[id].weekendNight!=null)?'gündüz, nöbet ve hafta sonu nöbet':'gündüz ve nöbet'} hedefleri tam karşılandı. Manuel/kilitli kayıtlar korundu.`,'success',false);
    return result;
  }
  function totals(m){
    const cfg=config(m.u),sum=empty();let missing=0;
    for(const id of m.ids)for(const t of kinds){const n=cfg.people?.[id]?.[t];if(n==null||n==='')missing++;else sum[t]+=Number(n)||0;}
    const specified=m.ids.filter(id=>cfg.people?.[id]?.weekendNight!=null&&cfg.people[id].weekendNight!==''),weekend=specified.reduce((n,id)=>n+Number(cfg.people[id].weekendNight||0),0);
    return `Gereken: ${m.required.day} gündüz / ${m.required.night} nöbet · Hedef: ${sum.day} / ${sum.night} · Hafta sonu nöbet: ${m.required.weekendNight} gereken / ${weekend} hedef${specified.length<m.ids.length?` (${m.ids.length-specified.length} kişi serbest)`:''}${missing?` · ${missing} boş alan`:''}${m.lockedEmpty?` · ${m.lockedEmpty} boş kilitli hücre dağıtım dışında`:''} · Boş gün sınırı: ${(window.rpysRules421?window.rpysRules421.enabled(m.u,'maxGapEnabled'):!!unitRulesV251(m.u).maxGapEnabled)?gapLimit(m.u)+' gün':'Kapalı'}`;
  }
  // Distribute by the selected employees' actual active days within this unit.
  function availableOn(id,day){
    const p=getPersonById(id);
    if(!p||personStatusAt(p,dateStr(day))!=='Aktif'||window.rpysScheduler398?.reservedOn(id,day,ym()))return false;
    // Employment status alone does not reflect leave; consult the leave calendar.
    if(typeof isOnLeave==='function'){
      try{if(isOnLeave(id,day))return false}catch(e){console.warn('RPYS izin kontrolü',e)}
    }
    return true;
  }
  function fairTargets(m){
    const result=Object.fromEntries(m.ids.map(id=>[id,{...m.fixed[id]}])),calendar={day:new Set(),night:new Set(),weekendNight:new Set()};
    for(const slot of unitSlots(m.u).filter(s=>!isShiftBlockedForMonth(s.type,s.col,ym())))for(let d=1;d<=daysInMonth();d++)if(isDutyCellApplicable(slot.type,slot.col,d)){const t=kind(slot.col);calendar[t].add(d);if(t==='night'&&weekendOn(d))calendar.weekendNight.add(d)}
    const availability={};for(const id of m.ids){availability[id]=empty();for(const t of metrics)availability[id][t]=[...calendar[t]].filter(d=>availableOn(id,d)).length;}
    const allocate=(type,total,get,set,available,fixed)=>{
      let left=total-m.ids.reduce((n,id)=>n+get(id),0);if(left<0)throw Error('Korunan görevler gerekli toplamdan fazla.');
      while(left>0){const options=m.ids.filter(id=>available(id)>0&&get(id)<Math.max(available(id),fixed(id)));if(!options.length)throw Error(type+' için yeterli uygun gün bulunmuyor.');options.sort((a,b)=>get(a)/available(a)-get(b)/available(b)||available(b)-available(a)||a-b);set(options[0],get(options[0])+1);left--;}
    };
    allocate('gündüz',m.required.day,id=>result[id].day,(id,n)=>{result[id].day=n},id=>availability[id].day,id=>m.fixed[id].day);
    allocate('hafta sonu nöbeti',m.required.weekendNight,id=>result[id].weekendNight,(id,n)=>{result[id].weekendNight=n},id=>availability[id].weekendNight,id=>m.fixed[id].weekendNight);
    const weekday=Object.fromEntries(m.ids.map(id=>[id,m.fixed[id].night-m.fixed[id].weekendNight]));
    allocate('hafta içi nöbeti',m.required.night-m.required.weekendNight,id=>weekday[id],(id,n)=>{weekday[id]=n},id=>availability[id].night-availability[id].weekendNight,id=>m.fixed[id].night-m.fixed[id].weekendNight);
    for(const id of m.ids)result[id].night=weekday[id]+result[id].weekendNight;
    return {targets:result,availability};
  }
  function suggest(useCurrent=false){
    const u=document.getElementById('autoUnit')?.value;if(!u||isMonthLocked())return;
    const m=model(u),cfg=editableConfig(u);if(!m.ids.length)return;
    try{
      const proposal=useCurrent?null:fairTargets(m);
      for(const id of m.ids)cfg.people[id]={...(useCurrent?m.actual[id]:proposal.targets[id])};
      persist();render();
    }catch(e){alert(e.message||String(e))}
  }
  function historyFor(m){
    const cutoff=ym()+'-01',data={},years=new Set(),seen=new Set();
    for(const id of m.ids)data[id]={};
    for(const a of allAssignmentsAllMonths()){
      const id=Number(a.person?.id??a.personId??0),date=String(a.date||'').slice(0,10);
      if(!own(data,id)||!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>=cutoff||a.col?.unit!==m.u)continue;
      const y=Number(date.slice(0,4)),signature=[date,id,a.col?.key||a.col?.shift||'',a.type||''].join('|');
      if(seen.has(signature))continue;seen.add(signature);years.add(y);
      data[id][y]??=empty();data[id][y][kind(a.col)]++;if(kind(a.col)==='night'&&weekendOn(Number(date.slice(8)),date.slice(0,7)))data[id][y].weekendNight++;
    }
    return {years:[...years].sort((a,b)=>b-a),data};
  }
  let historyVisible=false;
  function lastResultMarkup(m){
    const r=db.manualDistributionResultsV399?.[key(m.u)];
    if(r?.status!=='partial'||JSON.stringify(Object.keys(r.targets||{}).map(Number).sort((a,b)=>a-b))!==JSON.stringify(m.ids.slice().sort((a,b)=>a-b)))return '';
    const lines=(r.shortfalls||[]).map(x=>`${getPersonById(x.id)?.name||x.id}: ${x.actual} / ${x.target} ${labels[x.kind]}, ${x.missing} eksik.`);
    for(const x of (r.unfilled||[]).slice().sort((a,b)=>a.day-b.day))lines.push(`${x.day}. gün ${labels[x.kind]} boş: ${x.reason}`);
    lines.push(...(r.notes||[]));
    return `<details class="rpysTargetLastResult399"><summary>Son kısmi dağıtım raporu · ${(r.unfilled||[]).length} boş hücre</summary><p class="smallhelp">Bu rapor son uygulama anına aittir; sonraki elle düzeltmeler için yukarıdaki güncel kalan sayılarını kontrol edin.</p><div style="white-space:pre-wrap">${escape(lines.join('\n'))}</div></details>`;
  }
  function historyMarkup(m){
    if(!historyVisible)return '';
    const h=historyFor(m);
    const headings=h.years.map(y=>'<th>'+y+'<br>G / N</th>').join('');
    const rows=m.ids.map(id=>{
      const sum=empty(),cells=h.years.map(y=>{const v=h.data[id][y]||empty();sum.day+=v.day;sum.night+=v.night;return '<td>'+v.day+' / '+v.night+'</td>'}).join('');
      return '<tr><th>'+escape(getPersonById(id).name)+'</th>'+cells+'<td><b>'+sum.day+' / '+sum.night+'</b></td></tr>';
    }).join('');
    return '<div class="rpysHistory399"><h4>Seçili birim: '+escape(m.u)+' · Seçili personel: '+m.ids.length+'</h4>'+
      '<p class="smallhelp">Yalnız seçilen personelin bu birimdeki kayıtlı geçmiş çalışmaları; seçili ay ve sonrası hariç. Eksik geçmiş kayıtlar toplamları eksik gösterebilir.</p>'+
      '<div class="rpysTargetTable399"><table><thead><tr><th>Personel</th>'+headings+'<th>Geçmiş toplam<br>G / N</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
      (h.years.length?'':'<p class="smallhelp">Bu birim ve personeller için geçmiş kayıt bulunamadı.</p>')+'</div>';
  }
  function render(){
    const pick=document.getElementById('autoPeople'),layout=pick?.closest('.autoBox');if(!layout)return;
    const u=document.getElementById('autoUnit')?.value;if(!u)return;
    let host=document.getElementById('rpysTargetPanel399');if(!host){host=document.createElement('section');host.id='rpysTargetPanel399';layout.appendChild(host);layout.classList.add('rpysTargetsLayout399');}
    // Keep the pressed run button alive until its click is delivered. A queued
    // render between pointerdown and click otherwise replaces the event target.
    if(host.contains(document.activeElement)&&(document.activeElement?.tagName==='INPUT'||document.activeElement?.matches?.('[data-target-action=run]')&&!preparing||document.activeElement?.matches?.('[data-target-action=cancel]')&&preparing))return;
    const m=model(u),cfg=config(u),locked=isMonthLocked(),disabled=locked?'disabled':'';
    let fairness=null;try{fairness=fairTargets(m)}catch(e){console.warn('RPYS fair target preview',e)}
    host.innerHTML=`<h3>Personel Gündüz / Nöbet Hedefleri</h3><div class="smallhelp">${escape(ym())} · ${escape(u)} · Hedef motoru 21.10.2026</div>
      ${u==='ACİL RÖNTGEN'?'<p class="smallhelp">“Kurallara Göre Eşit Dağıt” açık vardiyaları birim kurallarıyla dengeler. Elle girdiğiniz sayıları uygulamak için “Hedeflere Göre Dağıt”ı kullanın.</p>':''}
      <label class="rpysTargetsToggle399"><input type="checkbox" data-target-enable ${cfg.enabled?'checked':''} ${disabled}> Elle girdiğim hedeflere göre dağıt</label>
      <p class="smallhelp">Sayılar bu birimdeki <b>ayın toplam görevi</b> içindir. 16 saat ve üzeri nöbet; daha kısa vardiya gündüz sayılır. Mevcut ve korunan görevler toplamın içindedir. <b>Hafta sonu nöbeti</b>, Cumartesi/Pazar başlayan nöbetlerin sayısıdır ve toplam nöbet hedefinin içindedir. Bu alanı boş bırakırsanız hafta sonu için ayrı sayı kısıtı uygulanmaz.</p>
      <p class="smallhelp">Tam dağıtım mümkün değilse mevcut kayıtlar korunur, yerleşebilen yeni görevler uygulanır. Önce görev aralığı ve zorunlu izin dönüşü/öncesi kurallarını tamamlayan plan aranır. Tamamlanamayan aralık/dönüş koşulları ayrıca açıklanır; kişinin uygun diğer görevleri korunur. İzin, dinlenme, çakışma ve hedef üst sınırları her görevde denetlenir.</p>
      <div class="rpysTargetSummary399" role="status">${escape(totals(m))}</div>
      <div class="rpysTargetTable399"><table><thead><tr><th>Personel</th><th>Gündüz<br>hedefi</th><th>Nöbet<br>hedefi</th><th>Hafta sonu<br>nöbet hedefi</th><th>Mevcut<br>G / N / HS</th><th>Kalan<br>G / N / HS</th></tr></thead><tbody>${m.ids.map(id=>{
        const p=getPersonById(id),v=cfg.people?.[id]||{};
        return `<tr><th scope="row">${escape(p.name)}<small>Uygun gün: ${fairness?fairness.availability[id].day+" G / "+fairness.availability[id].night+" N / "+fairness.availability[id].weekendNight+" HS":"—"} · Korunan: ${m.fixed[id].day} G / ${m.fixed[id].night} N / ${m.fixed[id].weekendNight} HS</small></th>${metrics.map(t=>`<td><input type="number" min="0" max="1000" step="1" inputmode="numeric" data-target-id="${id}" data-target-kind="${t}" aria-label="${escape(p.name)} ${labels[t]} hedefi" value="${v[t]==null?'':escape(v[t])}" placeholder="${t==='weekendNight'?'Serbest':'0'}" ${disabled}></td>`).join('')}<td>${m.actual[id].day} / ${m.actual[id].night} / ${m.actual[id].weekendNight}</td><td data-target-diff="${id}">${metrics.map(t=>v[t]==null?'—':Number(v[t])-m.actual[id][t]).join(' / ')}</td></tr>`;
      }).join('')||'<tr><td colspan="6">Soldan personelleri seç.</td></tr>'}</tbody></table></div>
      <div class="rpysTargetActions399"><button type="button" class="btn alt" data-target-action="rules">⚙ Kurallar</button><button type="button" class="btn alt" data-target-action="history">Geçmiş Görev İstatistikleri</button><button type="button" class="btn alt" data-target-action="equal" ${disabled}>İzinlere Göre Adil Hedef Öner</button><button type="button" class="btn alt" data-target-action="current" ${disabled}>Mevcut Sayıları Al</button><button type="button" class="btn" data-target-action="run" ${preparing?'disabled':disabled} aria-busy="${preparing}">${preparing?'Hesaplanıyor…':'Hedeflere Göre Dağıt'}</button><button type="button" class="btn alt" data-target-action="cancel" ${preparing?'':'hidden'}>İptal</button></div>
      <div data-target-feedback class="rpysTargetFeedback399" role="${feedback.tone==='error'?'alert':'status'}" aria-live="polite" data-tone="${escape(feedback.tone)}" ${feedback.text?'':'hidden'}>${escape(feedback.text)}</div>
      ${lastResultMarkup(m)}${payrollMarkup(m)}${historyMarkup(m)}\n      <p class="smallhelp">Hedefler otomatik kaydedilir. Elle hedefler açıkken dağıtım düğmeleri bu sayıları kullanır. Kilitli ve manuel hücreler değişmez; izin ve dinlenme kuralları korunur. Saymanlık mükellef, fiilî çalışma ve fazla mesai tercihleri görev hedefleri korunarak dengelenir. Adil hedef önerisi seçilen personelin izinlerini ve korunan görevlerini hesaba katar; günlere uygunluk dağıtımda ayrıca kontrol edilir.</p>`;
  }
  let queued=false;
  function queueRender(){if(queued)return;queued=true;setTimeout(()=>{queued=false;try{render()}catch(e){console.error('RPYS hedef paneli',e)}},0)}
  function install(){
    if(typeof window.autoDistribute!=='function'||typeof window.assignmentsMonth!=='function')return;
    for(const name of ['renderAutoPanel','onAutoUnitChanged','renderAll','renderCurrentPage','saveUnitPool']){
      const old=window[name];if(typeof old!=='function'||old.__targets399)continue;
      const fn=function(){const result=old.apply(this,arguments);queueRender();return result};fn.__targets399=true;window[name]=fn;
    }
    document.documentElement.dataset.rpysManualTargets='399';queueRender();
  }
  function input(event){
    const el=event.target;if(!el?.matches?.('#rpysTargetPanel399 input'))return;
    if(isMonthLocked()){queueRender();return;}
    const u=document.getElementById('autoUnit')?.value,cfg=editableConfig(u);
    if(el.hasAttribute('data-target-enable'))cfg.enabled=el.checked;
    else {cfg.people[el.dataset.targetId]??={};cfg.people[el.dataset.targetId][el.dataset.targetKind]=el.value===''?null:Number(el.value);}
    persist();const m=model(u),host=document.getElementById('rpysTargetPanel399');host.querySelector('.rpysTargetSummary399').textContent=totals(m);
    for(const cell of host.querySelectorAll('[data-target-diff]')){const id=cell.dataset.targetDiff,v=cfg.people[id]||{};cell.textContent=metrics.map(t=>v[t]==null?'—':Number(v[t])-m.actual[id][t]).join(' / ');}
  }
  window.rpysTargets399={version:'20261023-acil-equal-24',enabledFor,distribute,model,readTargets,render,install,suggest,config,prepare,prepareAutomatic,hasPrepared,planningData,historyFor,fairTargets,run:runTargets,cancel,isBusy:()=>preparing,clearFeedback:()=>report('','progress',false),isPlanning:()=>draftActive,recordCandidates:(id,dates)=>(draftActive||(prepared&&window.rpysScheduler398?.running()))&&activeRecordIndex?activeRecordIndex(Number(id),dates):null,reportError:message=>report(message,'error',false)};
  document.addEventListener('input',input,true);
  document.addEventListener('change',e=>{if(['autoUnit','autoPeople','month','rebuildSelectedUnitV246'].includes(e.target?.id))queueRender();});
  document.addEventListener('click',e=>{
    const b=e.target?.closest?.('#rpysTargetPanel399 [data-target-action]');if(!b)return;
    e.preventDefault();e.stopPropagation();
    try{
      const action=b.dataset.targetAction;
      if(action==='run'){void runTargets();return}
      if(action==='cancel'){cancel();return}
      if(isMonthLocked()&&action!=='history'){report('Bu ay kilitli.','error',false);return}
      if(action==='rules'){window.rpysRules421?.open(document.getElementById('autoUnit')?.value);return}
      if(action==='history'){historyVisible=!historyVisible;render()}
      else if(action==='equal')suggest();else if(action==='current')suggest(true);
    }catch(e){report(e.message||String(e),'error',false)}
  },true);
  const style=document.createElement('style');style.textContent=`
    .rpysTargetFeedback399{white-space:pre-wrap;padding:10px;margin-top:10px;border:1px solid var(--line,#cbd5e1);border-radius:8px;overflow-wrap:anywhere}.rpysTargetFeedback399[data-tone=error]{border-color:#dc2626}.rpysTargetFeedback399[hidden]{display:none}
    .rpysTargetsLayout399{grid-template-columns:minmax(160px,.55fr) minmax(310px,1fr) minmax(390px,1.15fr)}
    #rpysTargetPanel399{padding:14px;border:1px solid var(--line,#cbd5e1);border-radius:12px;background:var(--panel,var(--card,#fff));color:var(--text,#172b4d);min-width:0}
    #rpysTargetPanel399 h3{margin:0 0 8px}#rpysTargetPanel399 .rpysTargetsToggle399{display:flex;gap:8px;align-items:center;margin:12px 0;color:inherit}
    #rpysTargetPanel399 p{line-height:1.5}.rpysTargetSummary399{padding:9px;border:1px solid var(--line,#cbd5e1);border-radius:8px;font-weight:700;margin-bottom:10px}
    .rpysTargetTable399{overflow:auto;max-height:480px}.rpysTargetTable399 table{width:100%;border-collapse:collapse;color:inherit}
    .rpysTargetTable399 th,.rpysTargetTable399 td{padding:7px 4px;border-bottom:1px solid var(--line,#cbd5e1);font-size:12px;text-align:center;background:transparent;color:inherit}
    .rpysTargetTable399 th:first-child{text-align:left}.rpysTargetTable399 small{display:block;font-weight:400;font-size:10px;opacity:.8;margin-top:4px}
    #rpysTargetPanel399 input[type=number]{width:64px;min-width:54px;padding:7px 4px;border:1px solid var(--line,#94a3b8);border-radius:7px;background:var(--panel,var(--card,#fff));color:inherit;text-align:center}
    .rpysTargetActions399{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}@media(max-width:1250px){.rpysTargetsLayout399{grid-template-columns:1fr!important}}`;
  document.head.appendChild(style);install();
  window.addEventListener('rpys-direct-core-ready',()=>[100,600,3000].forEach(ms=>setTimeout(install,ms)));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);
  [1200,3800].forEach(ms=>setTimeout(install,ms));
})();
