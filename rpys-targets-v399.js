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
  function model(u,ids=selected(u)){
    const rebuild=!!document.getElementById('rebuildSelectedUnitV246')?.checked;
    const actual=Object.fromEntries(ids.map(id=>[id,empty()])),fixed=Object.fromEntries(ids.map(id=>[id,empty()]));
    const slots=[],mutable=new Set();let lockedEmpty=0;
    for(const s of unitSlots(u).filter(s=>!isShiftBlockedForMonth(s.type,s.col,ym())))for(let d=1;d<=daysInMonth();d++){
      if(!isDutyCellApplicable(s.type,s.col,d))continue;
      const k=keyFor(s.type,d,s.col.key),manualProtected=window.rpysScheduler398?.manualAssignmentCell
        ?window.rpysScheduler398.manualAssignmentCell(k)
        :!!(db.assign[k]&&(db.manualDutyOverrides?.[k]||db.assignmentMeta?.[k]?.manual));
      const protectedCell=!!(db.rpysCellLocks?.[k]||manualProtected);
      if(!protectedCell&&(rebuild||!own(db.assign,k))){mutable.add(k);slots.push({key:k,day:d,type:s.type,col:s.col,kind:kind(s.col)});}
      else if(!db.assign[k])lockedEmpty++;
    }
    for(const a of assignmentsMonth().filter(a=>a.col?.unit===u)){
      const id=Number(a.person.id),t=kind(a.col);if(!actual[id])continue;
      actual[id][t]++;
      if(a.importedExtra||!mutable.has(keyFor(a.type,a.day,a.col.key)))fixed[id][t]++;
    }
    const required=empty();for(const id of ids)for(const t of kinds)required[t]+=fixed[id][t];
    for(const s of slots)required[s.kind]++;
    return {u,ids,rebuild,actual,fixed,required,slots,mutable,lockedEmpty};
  }
  function readTargets(m){
    const cfg=config(m.u),targets={},problems=[];
    for(const id of m.ids){targets[id]={};for(const t of kinds){
      const v=cfg.people?.[id]?.[t];
      if(v==null||v===''||!Number.isInteger(Number(v))||Number(v)<0||Number(v)>1000){problems.push(`${getPersonById(id).name}: ${labels[t]} hedefini 0 veya pozitif tam sayı olarak yaz.`);continue}
      targets[id][t]=Number(v);
      if(Number(v)<m.fixed[id][t])problems.push(`${getPersonById(id).name}: korunan ${m.fixed[id][t]} ${labels[t]} kaydı var; ${v} hedefi uygulanamaz. Manuel/kilitli kayıt korunur. Mevcutları koru modundaysan yeniden dağıt seçeneğini kontrol et.`);
    }}
    if(problems.length)throw Error(problems.slice(0,8).join('\n'));
    for(const t of kinds){const total=m.ids.reduce((n,id)=>n+targets[id][t],0);if(total!==m.required[t])problems.push(`${labels[t]} hedef toplamı ${total}; seçili personeller için gereken ${m.required[t]}. Fark: ${total-m.required[t]}.`)}
    if(problems.length)throw Error(problems.join('\n'));
    return targets;
  }
  // Bounded constraint search: place the most constrained remaining cell first.
  function solve({slots,ids,remaining,canPlace,place,remove,requirements=[],finalCheck=()=>true,maxNodes=25000,timeLimit=9000}){
    const start=Date.now(),plan=[],unitDays=Object.fromEntries(ids.map(id=>[id,new Set()]));let nodes=0,timedOut=false,lastFailure='';
    slots=slots.slice().sort((a,b)=>a.day-b.day||(a.kind==='night'?-1:1)-(b.kind==='night'?-1:1)||a.key.localeCompare(b.key));
    function feasible(i){
      for(const id of ids)for(const t of kinds)if(remaining[id][t]<0)return false;
      const available=new Map(),capacity=Object.fromEntries(ids.map(id=>[id,empty()]));
      for(const s of slots.slice(i)){
        const options=s.allowed.filter(id=>remaining[id][s.kind]>0&&!unitDays[id].has(s.day)&&canPlace(id,s));
        if(!options.length)return false;available.set(s,options);for(const id of options)capacity[id][s.kind]++;
      }
      for(const id of ids)for(const t of kinds)if(remaining[id][t]>capacity[id][t])return false;
      for(const r of requirements){
        if([...unitDays[r.id]].some(d=>r.days.has(d)))continue;
        if(!slots.slice(i).some(s=>r.days.has(s.day)&&available.get(s)?.includes(r.id)))return false;
      }
      available.capacity=capacity;return available;
    }
    function visit(i){
      if(++nodes>maxNodes||Date.now()-start>timeLimit){timedOut=true;return false}
      const available=feasible(i);if(!available)return false;
      if(i===slots.length){const check=finalCheck();if(check===true)return true;lastFailure=String(check||'Kurallar sağlanamadı.');return false}
      let best=i;for(let j=i+1;j<slots.length;j++)if(available.get(slots[j]).length<available.get(slots[best]).length||(available.get(slots[j]).length===available.get(slots[best]).length&&slots[j].kind==='night'&&slots[best].kind!=='night'))best=j;
      [slots[i],slots[best]]=[slots[best],slots[i]];
      const s=slots[i],candidates=available.get(s);
      const urgency=id=>requirements.reduce((n,r)=>n+(r.id===id&&r.days.has(s.day)&&![...unitDays[id]].some(d=>r.days.has(d))?1/(1+Math.max(...r.days)-s.day):0),0);
      candidates.sort((a,b)=>urgency(b)-urgency(a)||remaining[b][s.kind]/Math.max(1,available.capacity[b][s.kind])-remaining[a][s.kind]/Math.max(1,available.capacity[a][s.kind])||a-b);
      for(const id of candidates){
        place(id,s);remaining[id][s.kind]--;unitDays[id].add(s.day);plan.push({id,slot:s});
        if(visit(i+1))return true;
        plan.pop();unitDays[id].delete(s.day);remaining[id][s.kind]++;remove(id,s);
        if(timedOut)break;
      }
      [slots[i],slots[best]]=[slots[best],slots[i]];
      return false;
    }
    const ok=visit(0);return {ok,plan:plan.slice(),nodes,timedOut,lastFailure};
  }
  function requirementsFor(m){
    const rows=assignmentsMonth(),requirements=[],rules=unitRulesV251(m.u);
    for(const id of m.ids){
      const fixedDays=new Set(rows.filter(a=>Number(a.person.id)===id&&a.col.unit===m.u).map(a=>Number(a.day)));
      const workDays=new Set(rows.filter(a=>Number(a.person.id)===id).map(a=>Number(a.day)));
      const active=d=>personStatusAt(getPersonById(id),dateStr(d))==='Aktif';
      for(let d=1;d<=daysInMonth();d++)if(active(d)&&!workDays.has(d)&&
        ((rules.returnMonday&&isReturnMondayRequiredV251(id,d,m.u))||(rules.preLeaveThursday&&isPreLeaveThursdayRequiredV251(id,d,m.u))))requirements.push({id,days:new Set([d]),reason:'izin dönüşü/öncesi'});
      if(rules.maxGapEnabled){
        const gap=Number(unitMaxGapDaysV251(m.u)||5);
        for(const [a,b] of nonLeaveSegmentsV2414(id))for(let left=a;left+gap<=b;left++){
          const days=Array.from({length:gap+1},(_,i)=>left+i);
          if(days.every(active)&&!days.some(d=>fixedDays.has(d)))requirements.push({id,days:new Set(days),reason:`${gap} gün görev aralığı`});
        }
      }
    }
    return requirements;
  }
  function finalRules(m){
    const r=unitRulesV251(m.u),rows=assignmentsMonth();
    if(r.maxGapEnabled){const gaps=v251GapViolations(m.ids,m.u);if(gaps.length)return `Görev aralığı kuralı: ${gaps.length} uyuşmazlık.`}
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
  function distribute(u){
    if(!window.rpysScheduler398?.running())throw Error('Güvenli dağıtım oturumu gerekli.');
    const m=model(u);if(!m.ids.length)throw Error('Önce bu birimde çalışacak personelleri seç.');
    const targets=readTargets(m);
    for(const rule of (db.customTextRules||[]).filter(x=>x.active!==false&&x.unit===u))for(const id of m.ids){
      if((rule.kind==='unitPersonMonthlyMax'||(rule.kind==='personUnitMonthlyMax'&&Number(rule.personId)===id))&&targets[id].day+targets[id].night>Number(rule.max||0))throw Error(`${getPersonById(id).name}: hedef toplamı özel kuraldaki ${rule.max} görev sınırını aşıyor.`);
    }
    for(const k of m.mutable){if(db.assign[k]&&!window.rpysScheduler398.mayClear(k))throw Error('Korunan kayıt değiştirilemez.');delete db.assign[k];if(db.assignmentMeta)delete db.assignmentMeta[k];}
    clearCache();
    const remaining=Object.fromEntries(m.ids.map(id=>[id,{day:targets[id].day-m.fixed[id].day,night:targets[id].night-m.fixed[id].night}]));
    const canPlace=(id,s)=>!assignmentsMonth().some(a=>Number(a.person.id)===id&&a.day===s.day&&a.col.unit===u)&&canTakeShiftV2414(id,s.day,s.col,u);
    for(const s of m.slots)s.allowed=m.ids.filter(id=>remaining[id][s.kind]>0&&canPlace(id,s));
    const requirements=requirementsFor(m);
    for(const r of requirements)if(!m.slots.some(s=>r.days.has(s.day)&&s.allowed.includes(r.id)))throw Error(`${getPersonById(r.id).name}: ${r.reason} için ${[...r.days].join(', ')}. günlerde uygun hücre yok.`);
    for(const s of m.slots)if(!s.allowed.length)throw Error(`${s.day}. gün ${s.col.shift||s.col.key}: hedefi kalan uygun personel yok (izin, dinlenme, başka görev veya korunan kayıt).`);
    const result=solve({slots:m.slots,ids:m.ids,remaining,requirements,...searchAdapter(m)});
    if(!result.ok)throw Error(result.timedOut?'Hedefler için arama süresi doldu; listeye değişiklik uygulanmadı. Korunan kayıtları, izinleri ve hedef sayılarını kontrol et.':`Bu hedefler mevcut izin/dinlenme/eş/görev aralığı ve korunan kayıtlarla yerleştirilemedi. ${result.lastFailure}`);
    clearCache();const actual=model(u,m.ids).actual;
    for(const id of m.ids)for(const t of kinds)if(actual[id][t]!==targets[id][t])throw Error('Hedef doğrulaması başarısız; önceki liste korundu.');
    db.unitPools??={};db.unitPools[key(u)]=m.ids.slice();if(u==='PORTABL + SKOPİ')db.skopiEligible=m.ids.slice();
    db.manualDistributionResultsV399??={};db.manualDistributionResultsV399[key(u)]={at:new Date().toISOString(),engine:'6.1.1',targets,actual,filled:result.plan.length};
    saveNowV245({allowAssignDrop:m.rebuild,label:`${u} elle gündüz/nöbet hedeflerine göre dağıtım`});
    renderAll();render();const box=document.getElementById('distResult');if(box)box.textContent=`${u}: ${result.plan.length} görev yerleştirildi. Seçili ${m.ids.length} personelin gündüz ve nöbet hedefleri tam karşılandı. Manuel/kilitli kayıtlar korundu.`;
    return result;
  }
  function totals(m){
    const cfg=config(m.u),sum=empty();let missing=0;
    for(const id of m.ids)for(const t of kinds){const n=cfg.people?.[id]?.[t];if(n==null||n==='')missing++;else sum[t]+=Number(n)||0;}
    return `Gereken: ${m.required.day} gündüz / ${m.required.night} nöbet · Hedef: ${sum.day} / ${sum.night}${missing?` · ${missing} boş alan`:''}${m.lockedEmpty?` · ${m.lockedEmpty} boş kilitli hücre dağıtım dışında`:''}`;
  }
  function suggest(useCurrent=false){
    const u=document.getElementById('autoUnit')?.value;if(!u||isMonthLocked())return;
    const m=model(u),cfg=editableConfig(u);if(!m.ids.length)return;
    for(const id of m.ids)cfg.people[id]={...(useCurrent?m.actual[id]:m.fixed[id])};
    if(!useCurrent)for(const t of kinds){let left=m.required[t]-m.ids.reduce((n,id)=>n+cfg.people[id][t],0);while(left-->0){const id=m.ids.slice().sort((a,b)=>cfg.people[a][t]-cfg.people[b][t]||a-b)[0];cfg.people[id][t]++;}}
    persist();render();
  }
  function render(){
    const pick=document.getElementById('autoPeople'),layout=pick?.closest('.autoBox');if(!layout)return;
    const u=document.getElementById('autoUnit')?.value;if(!u)return;
    let host=document.getElementById('rpysTargetPanel399');if(!host){host=document.createElement('section');host.id='rpysTargetPanel399';layout.appendChild(host);layout.classList.add('rpysTargetsLayout399');}
    if(host.contains(document.activeElement)&&document.activeElement?.tagName==='INPUT')return;
    const m=model(u),cfg=config(u),locked=isMonthLocked(),disabled=locked?'disabled':'';
    host.innerHTML=`<h3>Personel Gündüz / Nöbet Hedefleri</h3><div class="smallhelp">${escape(ym())} · ${escape(u)}</div>
      <label class="rpysTargetsToggle399"><input type="checkbox" data-target-enable ${cfg.enabled?'checked':''} ${disabled}> Elle girdiğim hedeflere göre dağıt</label>
      <p class="smallhelp">Sayılar bu birimdeki <b>ayın toplam görevi</b> içindir. 16 saat ve üzeri nöbet; daha kısa vardiya gündüz sayılır. Mevcut ve korunan görevler toplamın içindedir.</p>
      <div class="rpysTargetSummary399" role="status">${escape(totals(m))}</div>
      <div class="rpysTargetTable399"><table><thead><tr><th>Personel</th><th>Gündüz<br>hedefi</th><th>Nöbet<br>hedefi</th><th>Mevcut<br>G / N</th><th>Kalan<br>G / N</th></tr></thead><tbody>${m.ids.map(id=>{
        const p=getPersonById(id),v=cfg.people?.[id]||{};
        return `<tr><th scope="row">${escape(p.name)}<small>Korunan: ${m.fixed[id].day} G / ${m.fixed[id].night} N</small></th>${kinds.map(t=>`<td><input type="number" min="0" max="1000" step="1" inputmode="numeric" data-target-id="${id}" data-target-kind="${t}" aria-label="${escape(p.name)} ${labels[t]} hedefi" value="${v[t]==null?'':escape(v[t])}" placeholder="0" ${disabled}></td>`).join('')}<td>${m.actual[id].day} / ${m.actual[id].night}</td><td data-target-diff="${id}">${kinds.map(t=>v[t]==null?'—':Number(v[t])-m.actual[id][t]).join(' / ')}</td></tr>`;
      }).join('')||'<tr><td colspan="5">Soldan personelleri seç.</td></tr>'}</tbody></table></div>
      <div class="rpysTargetActions399"><button class="btn alt" data-target-action="equal" ${disabled}>Eşit Hedef Öner</button><button class="btn alt" data-target-action="current" ${disabled}>Mevcut Sayıları Al</button><button class="btn" data-target-action="run" ${disabled}>Hedeflere Göre Dağıt</button></div>
      <p class="smallhelp">Hedefler otomatik kaydedilir. Elle hedefler açıkken dağıtım düğmeleri bu sayıları kullanır. Kilitli ve manuel hücreler değişmez; izin ve dinlenme kuralları korunur. Eşit hedef önerisi yalnız sayı paylaşımıdır; uygunluk dağıtımda kontrol edilir.</p>`;
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
  window.rpysTargets399={enabledFor,distribute,model,readTargets,solve,render,install,suggest,config};
  document.addEventListener('input',input,true);
  document.addEventListener('change',e=>{if(['autoUnit','autoPeople','month','rebuildSelectedUnitV246'].includes(e.target?.id))queueRender();});
  document.addEventListener('click',e=>{const b=e.target?.closest?.('[data-target-action]');if(!b)return;
    if(isMonthLocked())return alert('Bu ay kilitli.');
    if(b.dataset.targetAction==='equal')suggest();else if(b.dataset.targetAction==='current')suggest(true);else{const u=document.getElementById('autoUnit')?.value;editableConfig(u).enabled=true;persist();window.autoDistribute();queueRender();}
  });
  const style=document.createElement('style');style.textContent=`
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
