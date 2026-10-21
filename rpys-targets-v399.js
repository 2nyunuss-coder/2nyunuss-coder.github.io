/* Per-person monthly targets using the existing 6.1.1 eligibility and transaction guards. */
(()=>{
  if(window.rpysTargets399)return;
  const kinds=['day','night'],labels={day:'gündüz',night:'nöbet'};
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
  const empty=()=>({day:0,night:0});
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clearCache=()=>{_assignCache={};_allAssignCache=null;_calcCache={};_peopleCache=null};
  const kind=col=>Number(col.hours||0)>=16?'night':'day';
  const key=u=>ym()+'|'+u;
  const config=u=>db.manualDistributionTargetsV399?.[key(u)]||{enabled:false,people:{}};
  const enabledFor=u=>config(u).enabled===true;
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
      if(!protectedCell&&(!db.assign[k]||ids.includes(Number(db.assign[k])))&&(rebuild||!own(db.assign,k))){mutable.add(k);slots.push({key:k,day:d,type:s.type,col:s.col,kind:kind(s.col)});}
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
      const manualProtected=window.rpysScheduler398?.manualAssignmentCell
        ?window.rpysScheduler398.manualAssignmentCell(k)
        :!!(db.manualDutyOverrides?.[k]||db.assignmentMeta?.[k]?.manual);
      if(!mutable.has(k)||manualProtected)fixed[id][t]++;
    }
    const required=empty();for(const id of ids)for(const t of kinds)required[t]+=fixed[id][t];
    for(const s of slots)required[s.kind]++;
    return {u,ids,rebuild,actual,fixed,required,slots,mutable,lockedEmpty};
  }
  function readTargets(m,{partial=false}={}){
    const cfg=config(m.u),targets={},problems=[];
    for(const id of m.ids){targets[id]={};for(const t of kinds){
      const v=cfg.people?.[id]?.[t];
      if(v==null||v===''||!Number.isInteger(Number(v))||Number(v)<0||Number(v)>1000){problems.push(`${getPersonById(id).name}: ${labels[t]} hedefini 0 veya pozitif tam sayı olarak yaz.`);continue}
      targets[id][t]=Number(v);
      if(!partial&&Number(v)<m.fixed[id][t])problems.push(`${getPersonById(id).name}: korunan ${m.fixed[id][t]} ${labels[t]} kaydı var; ${v} hedefi uygulanamaz. Manuel/kilitli kayıt korunur. Mevcutları koru modundaysan yeniden dağıt seçeneğini kontrol et.`);
    }}
    if(problems.length)throw Error(problems.slice(0,8).join('\n'));
    for(const t of kinds){const total=m.ids.reduce((n,id)=>n+targets[id][t],0);if(!partial&&total!==m.required[t])problems.push(`${labels[t]} hedef toplamı ${total}; seçili personeller için gereken ${m.required[t]}. Fark: ${total-m.required[t]}.`)}
    if(problems.length)throw Error(problems.join('\n'));
    return targets;
  }
  function requirementsFor(m){
    const rows=assignmentsMonth(),requirements=[],rules=unitRulesV251(m.u);
    for(const id of m.ids){
      const workDays=new Set(rows.filter(a=>Number(a.person.id)===id).map(a=>Number(a.day)));
      const active=d=>personStatusAt(getPersonById(id),dateStr(d))==='Aktif';
      for(let d=1;d<=daysInMonth();d++)if(active(d)&&!workDays.has(d)&&
        ((rules.returnMonday&&isReturnMondayRequiredV251(id,d,m.u))||(rules.preLeaveThursday&&isPreLeaveThursdayRequiredV251(id,d,m.u))))requirements.push({id,days:new Set([d]),reason:'izin dönüşü/öncesi'});

    }
    return requirements;
  }
  function finalRules(m){
    const r=unitRulesV251(m.u),rows=assignmentsMonth();
    if(r.maxGapEnabled){const gaps=v251GapViolations(m.ids,m.u);if(gaps.length)return gaps.map(g=>`${getPersonById(g.id)?.name||('#'+g.id)}: ${g.leftDate??g.left??g.from??'?'} – ${g.rightDate??g.right??g.to??'?'} arasında görev aralığı ${g.blank??g.gap??'?'} boş gün; izin verilen en fazla ${unitMaxGapDaysV251(m.u)||5}.`).join('\n')}
    if(r.spouseSameDay){
      for(const id of m.ids){const sp=spouseOf(id);if(!sp)continue;
        const a=new Set(rows.filter(x=>Number(x.person.id)===id).map(x=>Number(x.day))),b=new Set(rows.filter(x=>Number(x.person.id)===Number(sp)).map(x=>Number(x.day)));
        if(a.size&&b.size&&[...a].filter(d=>b.has(d)).length<Math.min(a.size,b.size))return `${getPersonById(id).name}: eşlerin aynı gün çalışma kuralı.`;
      }
    }
    return true;
  }
  function searchAdapter(m){
    const chosen=new Map(),r=ruleCfg(),baseRows=assignmentsMonth(),longFixed=new Map();
    const start=new Date(ym()+'-01T12:00:00').getTime();
    for(const id of m.ids)longFixed.set(id,new Set(allAssignmentsAllMonths().filter(a=>Number(a.person.id)===id&&Number(a.col.hours)>=Number(r.longHours||23)).map(a=>Math.round((new Date(a.date+'T12:00:00').getTime()-start)/86400000)+1).filter(d=>d>=-Math.max(4,Number(r.minGap||2))&&d<=daysInMonth()+Math.max(4,Number(r.minGap||2)))));
    const textRules=(db.customTextRules||[]).filter(x=>x.active!==false&&x.kind!=='config');
    for(const s of m.slots){s.long=Number(s.col.hours)>=Number(r.longHours||23);s.blocksNext=isOvernightOrDutyShift(s.col)||Number(s.col.hours)>=16;}
    function canPlace(id,s){
      const mine=[...chosen.values()].filter(x=>x.id===id),longs=new Set(longFixed.get(id));
      for(const x of mine){const t=x.s;if(t.day===s.day)return false;if((t.blocksNext&&s.day===t.day+1)||(s.blocksNext&&t.day===s.day+1))return false;if(t.long)longs.add(t.day);}
      if(s.long){
        if([...longs].some(d=>Math.abs(s.day-d)<Number(r.minGap||2)))return false;
        longs.add(s.day);
        if(r.avoidAlternate&&db.settings.avoidAlternate&&[s.day,s.day+2,s.day+4].some(d=>longs.has(d)&&longs.has(d-2)&&longs.has(d-4)))return false;
      }
      for(const rule of textRules){
        if(rule.kind==='pairAvoidSameDay'&&(Number(rule.personA)===id||Number(rule.personB)===id)){
          const other=Number(rule.personA)===id?Number(rule.personB):Number(rule.personA);
          if([...chosen.values()].some(x=>x.id===other&&x.s.day===s.day))return false;
        }
        if(rule.kind==='unitNextDayBlock'&&rule.fromUnit===m.u&&rule.toUnit===m.u&&mine.some(x=>Math.abs(x.s.day-s.day)===1))return false;
        if(rule.kind==='unitConsecutive'&&rule.unit===m.u){
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
          try{ok=canTakeShiftV2414(id,s.day,s.col,m.u)}finally{db.assign[s.key]=id;clearCache()}
          if(!ok){verdict=`${getPersonById(id).name}: ${s.day}. gün mevcut uygunluk kuralları sağlanamadı.`;break;}
        }
        if(verdict===true)verdict=finalRules(m);
        return verdict;
      }finally{if(verdict!==true){for(const {s} of chosen.values())delete db.assign[s.key];clearCache();}}
    }};
  }
  function validateMonthlyLimits(m,targets){
    for(const rule of (db.customTextRules||[]).filter(x=>x.active!==false&&x.unit===m.u))for(const id of m.ids){
      if((rule.kind==='unitPersonMonthlyMax'||(rule.kind==='personUnitMonthlyMax'&&Number(rule.personId)===id))&&targets[id].day+targets[id].night>Number(rule.max||0))throw Error(`${getPersonById(id).name}: hedef toplamı özel kuraldaki ${rule.max} görev sınırını aşıyor.`);
    }
  }
  const workerURL=new URL('rpys-target-worker.js?v=20261021-partial-5',document.currentScript?.src||document.baseURI).href;
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
      return {id,maxBlank:Number(unitMaxGapDaysV251(m.u)||5),includeEdges:!!window.__RPYS_RULEPATCH8_EDGE_GAP_SPOUSE__,segments:nonLeaveSegmentsV2414(id),fixedDays:rows.filter(a=>Number(a.person.id)===id&&a.col.unit===m.u).map(a=>Number(a.day)),crossMonth:{before,after,fixedDays,last,runs,month:ym()}};
    });
  }
  async function planningData(u,{check=()=>{},progress=()=>{},partial=false}={}){
    const m=model(u,selected(u),{preserveExisting:partial}),targets=readTargets(m,{partial});
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
      const rows=assignmentsMonth();
      for(const [index,s] of m.slots.entries()){
        check();progress('Uygun günler',index+1,m.slots.length);
        s.index=index;s.blocksNext=isOvernightOrDutyShift(s.col)||Number(s.col.hours)>=16;s.allowed=m.ids.filter(id=>remaining[id][s.kind]>0&&!rows.some(a=>Number(a.person.id)===id&&Number(a.day)===s.day&&a.col.unit===u)&&canTakeShiftV2414(id,s.day,s.col,u));
        if(Date.now()-sliceStart>=8)await yieldIfNeeded();
      }
      const problems=[];
      for(const id of m.ids)for(const t of kinds){
        const capacity=new Set(m.slots.filter(s=>s.kind===t&&s.allowed.includes(id)).map(s=>s.day)).size;
        if(remaining[id][t]>capacity)problems.push(`${getPersonById(id).name}: ${targets[id][t]} ${labels[t]} hedefi; korunan ${m.fixed[id][t]}, uygun gün en fazla ${capacity}. İzin, dinlenme, mevcut görev veya özel kurallar nedeniyle en az ${remaining[id][t]-capacity} görev karşılanamıyor. Önerilen üst sınır: ${m.fixed[id][t]+capacity} (ortak kapasite ayrıca doğrulanır).`);
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
        if(need>capacity)problems.push(`${getPersonById(id).name}: kalan ${remaining[id].day} gündüz + ${remaining[id].night} nöbet toplamı ${need}; aynı gün ve nöbet ertesi dinlenmeyle en fazla ${capacity} görev mümkün. En az ${need-capacity} görev azaltılmalı veya uygun günler gözden geçirilmeli.`);
      }
      for(const s of m.slots)if(!s.allowed.length)problems.push(`${s.day}. gün ${s.col.shift||s.col.key}: seçili personellerden hedefi kalan uygun kişi yok (izin, dinlenme, mevcut görev veya özel kural).`);
      if(problems.length&&!partial)throw Error(problems.join('\n'));
      const adapter=searchAdapter(m),conflicts=[],limits=[],cfg=ruleCfg();
      const addLimit=(id,days,max,longOnly=false)=>{
        const fixedDays=new Set(rows.filter(a=>Number(a.person.id)===id&&(longOnly?Number(a.col.hours)>=Number(cfg.longHours||23):a.col.unit===u)).map(a=>Number(a.day)));
        const fixed=days.filter(d=>fixedDays.has(d)).length;
        const values=m.slots.filter(s=>days.includes(s.day)&&s.allowed.includes(id)&&(!longOnly||s.long)).map(s=>`${s.index}:${id}`);
        if(values.length)limits.push({values,max:partial?Math.max(0,max-fixed):max-fixed});
      };
      for(const id of m.ids){
        if(cfg.avoidAlternate&&db.settings.avoidAlternate)for(let d=1;d+4<=daysInMonth();d++)addLimit(id,[d,d+2,d+4],2,true);
        for(const rule of (db.customTextRules||[]).filter(r=>r.active!==false&&r.kind==='unitConsecutive'&&r.unit===u)){
          const max=Number(rule.maxConsecutive||1);
          for(let d=1;d+max<=daysInMonth();d++)addLimit(id,Array.from({length:max+1},(_,i)=>d+i),max);
        }
      }
      for(let i=0;i<m.slots.length;i++)for(const id of m.slots[i].allowed){
        check();progress('Görev çakışmaları',i+1,m.slots.length);
        const a=m.slots[i];adapter.place(id,a);
        try{for(let j=i+1;j<m.slots.length;j++)for(const other of m.slots[j].allowed){
          const b=m.slots[j];
          if(!adapter.canPlace(other,b))conflicts.push([`${i}:${id}`,`${j}:${other}`]);
        }}
        finally{adapter.remove(id,a)}
        if(Date.now()-sliceStart>=8)await yieldIfNeeded();
      }
      for(const rule of (db.customTextRules||[]).filter(r=>r.active!==false&&r.unit===u&&['unitPersonMonthlyMax','personUnitMonthlyMax'].includes(r.kind)))for(const id of m.ids)if(rule.kind==='unitPersonMonthlyMax'||Number(rule.personId)===id)limits.push({values:m.slots.filter(s=>s.allowed.includes(id)).map(s=>`${s.index}:${id}`),max:Math.max(0,Number(rule.max||0)-m.fixed[id].day-m.fixed[id].night)});
      const obligations=partial?[]:requirementsFor(m);
      for(const id of m.ids){
        const chosenDays=[],availableDays=new Set(m.slots.filter(s=>s.allowed.includes(id)).map(s=>s.day));
        for(const r of obligations.filter(r=>r.id===id).sort((a,b)=>Math.max(...a.days)-Math.max(...b.days))){
          if(chosenDays.some(d=>r.days.has(d)))continue;
          const options=[...r.days].filter(d=>availableDays.has(d));
          if(!options.length)throw Error(`${getPersonById(id).name}: ${r.reason} için ${[...r.days].join(', ')}. günlerde uygun görev yok.`);
          chosenDays.push(Math.max(...options));
        }
        const need=remaining[id].day+remaining[id].night;
        if(chosenDays.length>need)throw Error(`${getPersonById(id).name}: kalan hedef ${remaining[id].day} gündüz + ${remaining[id].night} nöbet = ${need} görev. Mevcut görev aralığı/izin dönüşü kuralları en az ${chosenDays.length} ek görev gerektiriyor. Hedef toplamı en az ${m.fixed[id].day+m.fixed[id].night+chosenDays.length} olmalı; diğer personellerin toplamları buna göre yeniden dengelenmeli. Hedefler değiştirilmedi.`);
      }
      const requirements=obligations.map(r=>({values:m.slots.filter(s=>r.days.has(s.day)&&s.allowed.includes(r.id)).map(s=>`${s.index}:${r.id}`)}));
      const gapRules=gapRulesFor(m,rows);
      for(const rule of gapRules.filter(r=>r.includeEdges&&!partial)){
        let minimum=0;
        for(const [a,b] of rule.segments){const days=[a-1,...new Set(rule.fixedDays.filter(d=>d>=a&&d<=b)),b+1].sort((x,y)=>x-y);for(let i=1;i<days.length;i++)minimum+=Math.floor((days[i]-days[i-1]-1)/(rule.maxBlank+1));}
        const need=remaining[rule.id].day+remaining[rule.id].night;
        if(minimum>need)throw Error(`${getPersonById(rule.id).name}: hedef ${targets[rule.id].day} gündüz + ${targets[rule.id].night} nöbet = ${targets[rule.id].day+targets[rule.id].night} görev. Etkin ${rule.maxBlank} boş gün kuralı ay başını, ay sonunu ve izin dışı dönemleri de kapsıyor; korunan görevlerle birlikte en az ${m.fixed[rule.id].day+m.fixed[rule.id].night+minimum} görev gerekiyor. En az ${minimum-need} görev eksik. Öneri: bu kişinin toplam hedefini artırıp diğer kişilerin hedeflerini dengeleyin veya görev aralığı ayarını gözden geçirin. Hedefler ve liste değiştirilmedi.`);
      }
      return {m,targets,problems,input:{allowPartial:partial,ids:m.ids,names:Object.fromEntries(m.ids.map(id=>[id,getPersonById(id).name])),remaining,slots:m.slots.map(s=>({index:s.index,day:s.day,kind:s.kind,allowed:s.allowed})),conflicts,requirements,limits,gapRules}};
    }finally{db=live;draftActive=false;activeRecordIndex=null;window.allAssignmentsAllMonths=originalAll;clearCache()}
  }
  function validatePartial(m,plan){
    const notes=[],retained=[],seen=new Set(),used=Object.fromEntries(m.ids.map(id=>[id,empty()])),targets=readTargets(m,{partial:true});
    const spouseIssues=()=>window.rpysScheduler398.spouseDayViolations?.(ym())||[],beforeSpouses=new Set(spouseIssues().map(x=>x.key));
    for(const x of plan){
      const s=m.slots[x.slot];
      if(!s||seen.has(s.key)||!s.allowed.includes(x.id)||!used[x.id]||++used[x.id][s.kind]>Math.max(0,targets[x.id][s.kind]-m.fixed[x.id][s.kind]))throw Error('Kısmi planın hücre/hedef doğrulaması başarısız. Liste korunuyor.');
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
        try{ok=canTakeShiftV2414(x.id,s.day,s.col,m.u)}finally{if(ok)db.assign[s.key]=x.id;clearCache()}
        if(!ok){retained.splice(i,1);changed=true;notes.push(`${getPersonById(x.id).name}: ${s.day}. gün ${labels[s.kind]} yerleştirilemedi; izin/dinlenme/mevcut görev veya özel uygunluk kuralı.`)}
      }
      for(const issue of spouseIssues().filter(x=>!beforeSpouses.has(x.key))){
        let removed=false;
        for(let i=retained.length-1;i>=0;i--){const x=retained[i],s=m.slots[x.slot];if(s.day===issue.day&&[issue.first,issue.second].includes(Number(x.id))){delete db.assign[s.key];retained.splice(i,1);removed=changed=true;notes.push(`${getPersonById(x.id).name}: ${s.day}. gün eşlerin aynı gün çalışma kuralı nedeniyle boş bırakıldı.`)}}
        clearCache();if(!removed)throw Error('Kısmi planda eşlerin aynı gün çalışma kuralı doğrulanamadı; liste korundu.');
      }
    }
    const rules=finalRules(m);if(rules!==true)notes.push(String(rules));
    for(const r of requirementsFor(m))notes.push(`${getPersonById(r.id).name}: ${[...r.days].join(', ')}. gün ${r.reason} görevi eksik.`);
    return {plan:retained,notes:[...new Set(notes)]};
  }
  function planningFingerprint(){
    const ignored=new Set(['_meta','ui','auditLog','poliklinikTakipConfig','polTrackConfig']);
    const exact=new Set(['assign','assignmentMeta','manualDutyOverrides','rpysCellLocks','unitPools','staff','leaves','importedRecords']);
    function canonical(value,preserve=false){
      if(value===null||typeof value!=='object')return value;
      if(Array.isArray(value)){const result=value.map(v=>canonical(v,preserve));return result.length||preserve?result:undefined}
      const result={};for(const k of Object.keys(value).sort()){const v=canonical(value[k],preserve);if(v!==undefined)result[k]=v}
      return Object.keys(result).length||preserve?result:undefined;
    }
    const state={};for(const k of Object.keys(db).sort())if(!ignored.has(k)){const v=canonical(db[k],exact.has(k));if(v!==undefined&&!(v&&typeof v==='object'&&Object.keys(v).length===0))state[k]=v}
    return JSON.stringify(state);
  }
  async function prepare(u,resume){
    if(preparing){report('Dağıtım zaten hesaplanıyor.','progress',true);return false;}
    if(isMonthLocked()){report('Bu ay kilitli. Liste değiştirilmedi.','error',false);return false;}
    preparing=true;let worker,timer;
    const job={started:Date.now(),workerMs:0,cancelled:false,reject:null};currentJob=job;
    const check=()=>{if(job.cancelled)throw Error('İşlem iptal edildi. Önceki liste korundu.');if(Date.now()-job.started-job.workerMs>6000)throw Error('Uygun gün hazırlığı zamanında tamamlanamadı; mevcut liste korunuyor. Bu sonuç hedeflerin imkânsız olduğunu göstermez.');};
    let lastProgress=0;
    const progress=(phase,done,total)=>{if(Date.now()-lastProgress<200)return;lastProgress=Date.now();report(`${phase}: ${done} / ${total} · ${Math.floor((Date.now()-job.started)/1000)} sn`,'progress',true)};
    report('Hedefler ve uygun günler denetleniyor; geçici plan arka planda hazırlanıyor…','progress',true);
    try{
      const fingerprint=planningFingerprint(),month=ym(),selectionRebuild=!!document.getElementById('rebuildSelectedUnitV246')?.checked;
      const attempts=bestEffortRequested?[false,true]:[false];let data,result,reason='',notes=[];
      for(const partial of attempts){
        try{data=await planningData(u,{check,progress,partial})}
        catch(e){if(!partial&&bestEffortRequested&&!job.cancelled&&Date.now()-job.started-job.workerMs<=6000){reason=e.message;continue}throw e}
        check();
        if(typeof Worker!=='function')throw Error('Bu tarayıcı arka plan hesaplamasını desteklemiyor. Liste değiştirilmedi.');
        report(partial?'Yerleştirilebilen görevler hesaplanıyor; eksikler ayrıca gösterilecek…':'Takvime tam hedeflerle yerleştirme hesaplanıyor…','progress',true);
        worker??=new Worker(workerURL);
        const excluded=[],started=Date.now(),searchBudget=bestEffortRequested?(partial?1200:1800):3200;
        let accepted=false;
        for(;;){
          if(job.cancelled)throw Error('İşlem iptal edildi. Önceki liste korundu.');
          const workerStarted=Date.now();
          try{result=await new Promise((resolve,reject)=>{
            job.reject=reject;worker.onmessage=e=>{clearTimeout(timer);resolve(e.data)};
            worker.onerror=()=>{clearTimeout(timer);reject(Error('Arka plan dağıtım motoru yüklenemedi; liste değiştirilmedi.'))};
            timer=setTimeout(()=>reject(Error('Arka plan hesaplaması tamamlanamadı; liste değiştirilmedi.')),5200);
            worker.postMessage({...data.input,excluded,timeLimit:Math.max(1,searchBudget-(Date.now()-started))});
          })}finally{job.workerMs+=Date.now()-workerStarted}job.reject=null;
          if(job.cancelled)throw Error('İşlem iptal edildi. Önceki liste korundu.');
          if(result.error)throw Error('Arka plan motoru hatası: '+result.error+'; liste değiştirilmedi.');
          if(!result.ok){
            const message=(result.timedOut?'Verilen sürede geçerli tam plan bulunamadı; bu sonuç hedeflerin imkânsız olduğunu kanıtlamaz.':'Hedefler ortak uygun günler ve görev çakışmalarıyla birlikte karşılanamıyor.')+'\n'+(result.lastFailure||'İzin, nöbet ertesi dinlenme ve özel kurallar.');
            if(bestEffortRequested&&!partial){reason=message;break}throw Error(message);
          }
          if(ym()!==month||planningFingerprint()!==fingerprint||document.getElementById('autoUnit')?.value!==u||JSON.stringify(selected(u))!==JSON.stringify(data.m.ids)||!!document.getElementById('rebuildSelectedUnitV246')?.checked!==selectionRebuild)throw Error('Hesaplama sırasında veriler veya seçim değişti. Yeni bilgilerle dağıtımı tekrar başlatın; plan kaydedilmedi.');
          report('Yerleştirilen görevlerin güvenlik ve hedef kontrolleri yapılıyor…','progress',true);
          const live=db,originalAll=window.allAssignmentsAllMonths;db=JSON.parse(JSON.stringify(live));draftActive=true;clearCache();let verdict;
          try{
            const beforeSpouses=new Set((window.rpysScheduler398.spouseDayViolations?.(ym())||[]).map(x=>x.key));
            for(const k of data.m.mutable){delete db.assign[k];if(db.assignmentMeta)delete db.assignmentMeta[k]}
            clearCache();activeRecordIndex=recordIndex(data.m);window.allAssignmentsAllMonths=historyIndex(data.m);
            if(partial){const checked=validatePartial(data.m,result.plan);result.plan=checked.plan;notes=checked.notes;verdict=true}
            else{const adapter=searchAdapter(data.m);for(const x of result.plan)adapter.place(x.id,data.m.slots[x.slot]);verdict=adapter.finalCheck();if(verdict===true){const issues=(window.rpysScheduler398.spouseDayViolations?.(ym())||[]).filter(x=>!beforeSpouses.has(x.key));if(issues.length){const x=issues[0];verdict=`${getPersonById(x.first)?.name||x.first} / ${getPersonById(x.second)?.name||x.second}: ${x.day}. gün eşlerin aynı gün çalışma kuralı.`}}}
          }finally{db=live;draftActive=false;activeRecordIndex=null;window.allAssignmentsAllMonths=originalAll;clearCache()}
          if(verdict===true){accepted=true;break}
          if(bestEffortRequested){reason=String(verdict);break}
          excluded.push(result.plan.map(x=>`${x.slot}:${x.id}`));
          if(Date.now()-started>=searchBudget)throw Error(String(verdict)+'\nGeçerli alternatif plan süre içinde bulunamadı; liste ve hedefler korundu.');
        }
        if(accepted){
          if(partial&&!result.plan.length){report('Yerleştirilebilen yeni görev yok. Mevcut liste korundu.\n'+[reason,...data.problems,...notes].filter(Boolean).join('\n'),'warning',false);return {ok:false,partial:true,plan:[],notes}}
          prepared={u,partial,reason:partial?reason:'',notes:partial&&result.timedOut?[...notes,'Bulunan kısmi plan uygulandı; daha fazla görevin yerleşemeyeceği kanıtlanmış değildir.']:notes,plan:result.plan.map(x=>({id:x.id,slot:data.m.slots[x.slot]})),nodes:result.nodes};break;
        }
      }
      if(!prepared)throw Error(reason||'Yerleştirilebilen plan bulunamadı; mevcut liste korundu.');
      report('Plan doğrulandı. Güvenli kayıt hazırlanıyor…','progress',true);
      return resume();
    }catch(e){report(e.message||String(e),'error',false);alert('Dağıtım uygulanmadı; mevcut liste ve hedefler korundu.\n\n'+(e.message||e));return false}
    finally{clearTimeout(timer);worker?.terminate();preparing=false;prepared=null;currentJob=null;activeRecordIndex=null;report(feedback.text,feedback.tone,false)}
  }
  function distribute(u){
    if(!window.rpysScheduler398?.running())throw Error('Güvenli dağıtım oturumu gerekli.');
    const partial=!!prepared?.partial,m=model(u,selected(u),{preserveExisting:partial});if(!m.ids.length)throw Error('Önce bu birimde çalışacak personelleri seç.');
    const targets=readTargets(m,{partial});
    if(!partial)validateMonthlyLimits(m,targets);
    activeRecordIndex=recordIndex(m);
    for(const k of m.mutable){if(db.assign[k]&&!window.rpysScheduler398.mayClear(k))throw Error('Korunan kayıt değiştirilemez.');delete db.assign[k];if(db.assignmentMeta)delete db.assignmentMeta[k];}
    clearCache();
    const remaining=Object.fromEntries(m.ids.map(id=>[id,{day:Math.max(0,targets[id].day-m.fixed[id].day),night:Math.max(0,targets[id].night-m.fixed[id].night)}]));
    const occupied=new Set(assignmentsMonth().filter(a=>a.col.unit===u).map(a=>Number(a.person.id)+'|'+Number(a.day)));
    const eligibility=new Map();
    const canPlace=(id,s)=>{
      if(occupied.has(id+'|'+s.day))return false;
      const k=id+'|'+s.key;
      if(!eligibility.has(k))eligibility.set(k,!!canTakeShiftV2414(id,s.day,s.col,u));
      return eligibility.get(k);
    };
    for(const s of m.slots)s.allowed=m.ids.filter(id=>remaining[id][s.kind]>0&&canPlace(id,s));
    const requirements=partial?[]:requirementsFor(m);
    for(const r of requirements)if(!m.slots.some(s=>r.days.has(s.day)&&s.allowed.includes(r.id)))throw Error(`${getPersonById(r.id).name}: ${r.reason} için ${[...r.days].join(', ')}. günlerde uygun hücre yok.`);
    for(const s of m.slots)if(!partial&&!s.allowed.length)throw Error(`${s.day}. gün ${s.col.shift||s.col.key}: hedefi kalan uygun personel yok (izin, dinlenme, başka görev veya korunan kayıt).`);
    if(!hasPrepared(u))throw Error('Önce arka plan dağıtım planı hazırlanmalı.');
    const result={ok:true,partial,plan:prepared.plan,nodes:prepared.nodes};
    let unresolved=[];
    if(partial){
      const checked=validatePartial(m,prepared.plan.map(x=>({id:x.id,slot:m.slots.findIndex(s=>s.key===x.slot.key),kind:x.slot.kind})));
      unresolved=checked.notes;
      result.plan=checked.plan.map(x=>({id:x.id,slot:m.slots[x.slot]}));result.notes=[...new Set([prepared.reason?'Tam plan kontrolü: '+prepared.reason.replace(/Hedefler ve liste değiştirilmedi\./g,'').trim():'',...prepared.notes,...checked.notes].filter(Boolean))];
      if(!result.plan.length)throw Error('Yeni güvenli görev yerleştirilemedi; mevcut liste korundu.');
    }else{
      const adapter=searchAdapter(m);
      for(const x of result.plan){const s=m.slots.find(s=>s.key===x.slot.key);if(!s||!s.allowed.includes(x.id)||remaining[x.id][s.kind]<=0||!adapter.canPlace(x.id,s))throw Error('Geçici plan güncel uygunluk kurallarını karşılamıyor.');adapter.place(x.id,s);remaining[x.id][s.kind]--;}
      const verdict=adapter.finalCheck();if(verdict!==true)throw Error(String(verdict));
    }
    clearCache();const actual=model(u,m.ids,{preserveExisting:partial}).actual;
    for(const id of m.ids)for(const t of kinds)if(partial?actual[id][t]>Math.max(targets[id][t],m.fixed[id][t]):actual[id][t]!==targets[id][t])throw Error('Hedef doğrulaması başarısız; önceki liste korundu.');
    result.shortfalls=m.ids.flatMap(id=>kinds.filter(t=>actual[id][t]<targets[id][t]).map(t=>({id,kind:t,target:targets[id][t],actual:actual[id][t],missing:targets[id][t]-actual[id][t]})));
    result.unfilled=m.slots.filter(s=>!db.assign[s.key]).map(s=>({day:s.day,kind:s.kind,key:s.key,reason:s.allowed.length&&s.allowed.every(id=>actual[id][s.kind]>=targets[id][s.kind])?'Uygun personellerin ilgili hedefleri doldu.':'İzin, dinlenme, mevcut görev veya özel kurallar kalan hedeflerle birlikte yerleşmedi; elle kontrol edilebilir.'}));
    if(partial&&!result.shortfalls.length&&!result.unfilled.length&&!unresolved.length&&m.ids.every(id=>kinds.every(t=>actual[id][t]===targets[id][t]))){result.partial=false;result.notes=[]}
    console.info('RPYS hedef dağıtım teşhisi',{unit:u,month:ym(),slots:m.slots.length,nodes:result.nodes,partial,filled:result.plan.length,engine:'csp-worker'});
    db.unitPools??={};db.unitPools[key(u)]=m.ids.slice();if(u==='PORTABL + SKOPİ')db.skopiEligible=m.ids.slice();
    db.manualDistributionResultsV399??={};db.manualDistributionResultsV399[key(u)]={at:new Date().toISOString(),engine:'6.1.1-csp-worker',targets,actual,filled:result.plan.length,status:result.partial?'partial':'complete',notes:result.notes||[],shortfalls:result.shortfalls,unfilled:result.unfilled};
    saveNowV245({allowAssignDrop:m.rebuild,label:`${u} elle gündüz/nöbet hedeflerine göre dağıtım`});
    renderAll();render();
    if(result.partial){
      const shortages=result.shortfalls.map(x=>`${getPersonById(x.id).name}: ${x.actual} / ${x.target} ${labels[x.kind]}; ${x.missing} eksik (izin, dinlenme, diğer görevler, özel kurallar veya ortak uygun gün kapasitesi).`);
      const overages=m.ids.flatMap(id=>kinds.filter(t=>actual[id][t]>targets[id][t]).map(t=>`${getPersonById(id).name}: mevcut ${actual[id][t]} ${labels[t]}, hedef ${targets[id][t]}; mevcut kayıtlar korundu.`));
      report(`${u}: Kısmi dağıtım uygulandı. ${result.plan.length} yeni görev yerleştirildi; ${result.unfilled.length} hücre boş kaldı. Mevcut liste ve hedef değerleri korundu.\n${shortages.length?shortages.join('\n'):'Eksik personel hedefi kalmadı; aşağıdaki koşullar hâlâ düzeltilmeli.'}\n${[...overages,...result.notes].join('\n')}`,'warning',false);
    }else report(`${u}: ${result.plan.length} görev yerleştirildi. Seçili ${m.ids.length} personelin gündüz ve nöbet hedefleri tam karşılandı. Manuel/kilitli kayıtlar korundu.`,'success',false);
    return result;
  }
  function totals(m){
    const cfg=config(m.u),sum=empty();let missing=0;
    for(const id of m.ids)for(const t of kinds){const n=cfg.people?.[id]?.[t];if(n==null||n==='')missing++;else sum[t]+=Number(n)||0;}
    return `Gereken: ${m.required.day} gündüz / ${m.required.night} nöbet · Hedef: ${sum.day} / ${sum.night}${missing?` · ${missing} boş alan`:''}${m.lockedEmpty?` · ${m.lockedEmpty} boş kilitli hücre dağıtım dışında`:''}`;
  }
  // Distribute by the selected employees' actual active days within this unit.
  function availableOn(id,day){
    const p=getPersonById(id);
    if(!p||personStatusAt(p,dateStr(day))!=='Aktif')return false;
    // Employment status alone does not reflect leave; consult the leave calendar.
    if(typeof isOnLeave==='function'){
      try{if(isOnLeave(id,day))return false}catch(e){console.warn('RPYS izin kontrolü',e)}
    }
    return true;
  }
  function fairTargets(m){
    const result=Object.fromEntries(m.ids.map(id=>[id,{...m.fixed[id]}]));
    const calendar={day:new Set(),night:new Set()};
    for(const slot of unitSlots(m.u).filter(s=>!isShiftBlockedForMonth(s.type,s.col,ym())))
      for(let d=1;d<=daysInMonth();d++)if(isDutyCellApplicable(slot.type,slot.col,d))calendar[kind(slot.col)].add(d);
    const availability={},capacity={};
    for(const id of m.ids){
      availability[id]=empty();capacity[id]=empty();
      for(const t of kinds){
        const n=[...calendar[t]].filter(d=>availableOn(id,d)).length;
        availability[id][t]=n;capacity[id][t]=Math.max(n,m.fixed[id][t]);
      }
    }
    for(const t of kinds){
      let left=m.required[t]-m.ids.reduce((sum,id)=>sum+result[id][t],0);
      if(left<0)throw Error('Korunan görevler gerekli toplamdan fazla.');
      while(left>0){
        const options=m.ids.filter(id=>availability[id][t]>0&&result[id][t]<capacity[id][t]);
        if(!options.length)throw Error(labels[t]+' için yeterli uygun gün bulunmuyor.');
        options.sort((a,b)=>result[a][t]/availability[a][t]-result[b][t]/availability[b][t]||availability[b][t]-availability[a][t]||a-b);
        result[options[0]][t]++;left--;
      }
    }
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
      data[id][y]??=empty();data[id][y][kind(a.col)]++;
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
      <label class="rpysTargetsToggle399"><input type="checkbox" data-target-enable ${cfg.enabled?'checked':''} ${disabled}> Elle girdiğim hedeflere göre dağıt</label>
      <p class="smallhelp">Sayılar bu birimdeki <b>ayın toplam görevi</b> içindir. 16 saat ve üzeri nöbet; daha kısa vardiya gündüz sayılır. Mevcut ve korunan görevler toplamın içindedir.</p>
      <p class="smallhelp">Tam dağıtım mümkün değilse mevcut kayıtlar korunur, yerleşebilen yeni görevler uygulanır. Eksik hedefler ve sağlanamayan görev aralığı koşulları aşağıda gösterilir.</p>
      <div class="rpysTargetSummary399" role="status">${escape(totals(m))}</div>
      <div class="rpysTargetTable399"><table><thead><tr><th>Personel</th><th>Gündüz<br>hedefi</th><th>Nöbet<br>hedefi</th><th>Mevcut<br>G / N</th><th>Kalan<br>G / N</th></tr></thead><tbody>${m.ids.map(id=>{
        const p=getPersonById(id),v=cfg.people?.[id]||{};
        return `<tr><th scope="row">${escape(p.name)}<small>Uygun gün: ${fairness?fairness.availability[id].day+" G / "+fairness.availability[id].night+" N":"—"} · Korunan: ${m.fixed[id].day} G / ${m.fixed[id].night} N</small></th>${kinds.map(t=>`<td><input type="number" min="0" max="1000" step="1" inputmode="numeric" data-target-id="${id}" data-target-kind="${t}" aria-label="${escape(p.name)} ${labels[t]} hedefi" value="${v[t]==null?'':escape(v[t])}" placeholder="0" ${disabled}></td>`).join('')}<td>${m.actual[id].day} / ${m.actual[id].night}</td><td data-target-diff="${id}">${kinds.map(t=>v[t]==null?'—':Number(v[t])-m.actual[id][t]).join(' / ')}</td></tr>`;
      }).join('')||'<tr><td colspan="5">Soldan personelleri seç.</td></tr>'}</tbody></table></div>
      <div class="rpysTargetActions399"><button type="button" class="btn alt" data-target-action="history">Geçmiş Görev İstatistikleri</button><button type="button" class="btn alt" data-target-action="equal" ${disabled}>İzinlere Göre Adil Hedef Öner</button><button type="button" class="btn alt" data-target-action="current" ${disabled}>Mevcut Sayıları Al</button><button type="button" class="btn" data-target-action="run" ${preparing?'disabled':disabled} aria-busy="${preparing}">${preparing?'Hesaplanıyor…':'Hedeflere Göre Dağıt'}</button><button type="button" class="btn alt" data-target-action="cancel" ${preparing?'':'hidden'}>İptal</button></div>
      <div data-target-feedback class="rpysTargetFeedback399" role="${feedback.tone==='error'?'alert':'status'}" aria-live="polite" data-tone="${escape(feedback.tone)}" ${feedback.text?'':'hidden'}>${escape(feedback.text)}</div>
      ${lastResultMarkup(m)}${historyMarkup(m)}\n      <p class="smallhelp">Hedefler otomatik kaydedilir. Elle hedefler açıkken dağıtım düğmeleri bu sayıları kullanır. Kilitli ve manuel hücreler değişmez; izin ve dinlenme kuralları korunur. Adil hedef önerisi seçilen personelin izinlerini ve korunan görevlerini hesaba katar; günlere uygunluk dağıtımda ayrıca kontrol edilir.</p>`;
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
    for(const cell of host.querySelectorAll('[data-target-diff]')){const id=cell.dataset.targetDiff,v=cfg.people[id]||{};cell.textContent=kinds.map(t=>v[t]==null?'—':Number(v[t])-m.actual[id][t]).join(' / ');}
  }
  window.rpysTargets399={version:'20261021-partial-5',enabledFor,distribute,model,readTargets,render,install,suggest,config,prepare,hasPrepared,planningData,historyFor,fairTargets,run:runTargets,cancel,isPlanning:()=>draftActive,recordCandidates:(id,dates)=>(draftActive||(prepared&&window.rpysScheduler398?.running()))&&activeRecordIndex?activeRecordIndex(Number(id),dates):null,reportError:message=>report(message,'error',false)};
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
