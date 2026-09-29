/* RPYS v4.0.6 - Her ay icin bagimsiz ana ve alternatif liste. */
(()=>{
  'use strict';
  if(window.rpysListVariants406)return;

  const VERSION='4.0.6';
  const STORE_KEY='monthListVariantsV406';
  const MAP_FIELDS=[
    'assign',
    'assignmentMeta',
    'manualDutyOverrides',
    'dutyCellOverrides',
    'engineDecisions',
    'unitPools',
    'manualSyncMonths',
    'manualDistributionTargetsV399',
    'rpysCellLocks',
    'lockedDutyCells',
    'lockedMonths'
  ];
  const NESTED_MAP_FIELDS=[
    ['polRotation2','orders'],
    ['polRotation2','audit'],
    ['polRotation2','baseWeek'],
    ['polRotation2','auditSummary'],
    ['polRoomRotation','plans']
  ];
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const isMonthKey=(key,monthKey)=>String(key)===String(monthKey)||String(key).startsWith(String(monthKey)+'|');
  const currentMonth=()=>String(document.getElementById('month')?.value||'');
  const database=()=>{try{return db}catch(_){return null}};

  function ensureStore(){
    const data=database();if(!data)return null;
    let store=data[STORE_KEY];
    if(!store||typeof store!=='object')store=data[STORE_KEY]={version:1,activeByMonth:{},variants:{}};
    if(!store.activeByMonth||typeof store.activeByMonth!=='object')store.activeByMonth={};
    if(!store.variants||typeof store.variants!=='object')store.variants={};
    store.version=1;
    return store;
  }
  function activeVariant(monthKey=currentMonth()){
    const store=ensureStore();
    const requested=store?.activeByMonth?.[monthKey]==='alt'?'alt':'main';
    return requested==='alt'&&store?.variants?.[monthKey]?.alt?.data?'alt':'main';
  }
  function monthEntry(monthKey,create=false){
    const store=ensureStore();if(!store)return null;
    if(create&&!store.variants[monthKey])store.variants[monthKey]={};
    return store.variants[monthKey]||null;
  }
  function hasAlternative(monthKey=currentMonth()){
    return !!monthEntry(monthKey)?.alt?.data;
  }
  function pickMonthMap(source,monthKey){
    const out={};
    for(const [key,value] of Object.entries(source&&typeof source==='object'?source:{}))if(isMonthKey(key,monthKey))out[key]=clone(value);
    return out;
  }
  function replaceMonthMap(target,monthKey,replacement){
    if(!target||typeof target!=='object')target={};
    for(const key of Object.keys(target))if(isMonthKey(key,monthKey))delete target[key];
    for(const [key,value] of Object.entries(replacement||{}))if(isMonthKey(key,monthKey))target[key]=clone(value);
    return target;
  }
  function nestedMap(data,path,create=false){
    let node=data;
    for(const part of path){
      if(!node||typeof node!=='object')return null;
      if(create&&(!node[part]||typeof node[part]!=='object'))node[part]={};
      node=node[part];
    }
    return node&&typeof node==='object'?node:null;
  }
  function snapshotMonth(monthKey=currentMonth()){
    const data=database();if(!data||!monthKey)return null;
    const maps={},nested={};
    for(const field of MAP_FIELDS)maps[field]=pickMonthMap(data[field],monthKey);
    for(const path of NESTED_MAP_FIELDS)nested[path.join('.')]=pickMonthMap(nestedMap(data,path),monthKey);
    return {schema:1,month:monthKey,maps,nested,capturedAt:new Date().toISOString()};
  }
  function applySnapshot(monthKey,snapshot){
    const data=database();if(!data||!monthKey||!snapshot)return false;
    const maps=snapshot.maps||{},nested=snapshot.nested||{};
    for(const field of MAP_FIELDS){
      if(!data[field]||typeof data[field]!=='object')data[field]={};
      data[field]=replaceMonthMap(data[field],monthKey,maps[field]||{});
    }
    for(const path of NESTED_MAP_FIELDS){
      const map=nestedMap(data,path,true);
      replaceMonthMap(map,monthKey,nested[path.join('.')]||{});
    }
    clearCaches();
    return true;
  }
  function captureVariant(monthKey=currentMonth(),variant=activeVariant(monthKey)){
    if(!monthKey)return null;
    const entry=monthEntry(monthKey,true),snap=snapshotMonth(monthKey);if(!entry||!snap)return null;
    const previous=entry[variant]||{};
    entry[variant]={
      createdAt:previous.createdAt||new Date().toISOString(),
      updatedAt:new Date().toISOString(),
      source:previous.source||(variant==='main'?'existing-month':'main-copy'),
      data:snap
    };
    return entry[variant];
  }
  function clearCaches(){
    try{_assignCache={}}catch(_){}
    try{_allAssignCache=null}catch(_){}
    try{_calcCache={}}catch(_){}
    try{_peopleCache=null}catch(_){}
    try{if(typeof clearDutyCellSelection==='function')clearDutyCellSelection()}catch(_){}
    try{if(typeof clearSaySelection==='function')clearSaySelection()}catch(_){}
  }
  function protectEditWindow(){
    window.__RPYS_LAST_USER_EDIT_V396__=Date.now();
    window.__RPYS_EDIT_GUARD_UNTIL_V400__=Math.max(Number(window.__RPYS_EDIT_GUARD_UNTIL_V400__||0),Date.now()+15000);
  }
  function persist(label){
    protectEditWindow();
    const opts={allowAssignDrop:true,label};
    try{
      if(typeof saveNowV245==='function')return saveNowV245(opts);
      if(typeof save==='function')return save(opts);
    }catch(error){console.error('RPYS liste varyanti kayit hatasi',error);throw error}
  }
  function renderAfterSwitch(){
    clearCaches();
    try{if(typeof renderAll==='function')renderAll();else if(typeof renderCurrentPage==='function')renderCurrentPage()}catch(error){console.warn('RPYS liste varyanti cizim hatasi',error)}
    setTimeout(refreshUi,0);
  }
  function switchVariant(target,monthKey=currentMonth(),options={}){
    target=target==='alt'?'alt':'main';
    const store=ensureStore();if(!store||!monthKey)return false;
    if(target==='alt'&&!hasAlternative(monthKey)){
      if(!options.silent&&typeof alert==='function')alert('Bu ay için henüz 2. Liste oluşturulmadı.');
      refreshUi();return false;
    }
    const current=activeVariant(monthKey);
    if(current===target){refreshUi();return true}
    captureVariant(monthKey,current);
    const targetData=monthEntry(monthKey)?.[target]?.data;
    if(!targetData){
      if(!options.silent&&typeof alert==='function')alert('Seçilen liste kaydı bulunamadı. Ana liste korunuyor.');
      refreshUi();return false;
    }
    applySnapshot(monthKey,targetData);
    store.activeByMonth[monthKey]=target;
    store.lastSwitch={month:monthKey,from:current,to:target,at:new Date().toISOString()};
    try{if(typeof logAction==='function')logAction(`${monthKey}: ${target==='main'?'1. Liste (Ana)':'2. Liste (Alternatif)'} açıldı.`)}catch(_){}
    persist(`${monthKey} ${target==='main'?'1. Liste (Ana)':'2. Liste (Alternatif)'} seçildi`);
    if(!options.noRender)renderAfterSwitch();
    return true;
  }
  function createAlternative(monthKey=currentMonth()){
    const store=ensureStore();if(!store||!monthKey)return false;
    if(hasAlternative(monthKey))return switchVariant('alt',monthKey);
    const current=activeVariant(monthKey);
    captureVariant(monthKey,current);
    if(current!=='main')return false;
    const entry=monthEntry(monthKey,true),main=entry.main?.data;if(!main)return false;
    const alt=clone(main);
    alt.capturedAt=new Date().toISOString();
    // Imzalanmis/kilitli ana liste korunur; yeni alternatif liste duzenlemeye acik baslar.
    if(alt.maps?.lockedMonths)delete alt.maps.lockedMonths[monthKey];
    entry.alt={createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),source:'main-copy',data:alt};
    applySnapshot(monthKey,alt);
    store.activeByMonth[monthKey]='alt';
    store.lastSwitch={month:monthKey,from:'main',to:'alt',at:new Date().toISOString(),created:true};
    try{if(typeof logAction==='function')logAction(`${monthKey}: Ana liste korunarak 2. Liste (Alternatif) oluşturuldu.`)}catch(_){}
    persist(`${monthKey} 2. Liste (Alternatif) oluşturuldu`);
    renderAfterSwitch();
    return true;
  }
  function counts(monthKey=currentMonth()){
    const live=Object.keys(database()?.assign||{}).filter(k=>isMonthKey(k,monthKey)).length;
    const entry=monthEntry(monthKey);
    const count=s=>Object.keys(s?.data?.maps?.assign||{}).length;
    return {live,main:entry?.main?count(entry.main):activeVariant(monthKey)==='main'?live:0,alt:entry?.alt?count(entry.alt):0};
  }
  function cellUnit(key,monthKey){
    if(!isMonthKey(key,monthKey))return '';
    const parts=String(key).split('|');if(parts.length<4)return '';
    const type=parts[1],colKey=parts.slice(3).join('|');
    try{return String(typeof dutyColumnByKey==='function'?(dutyColumnByKey(type,colKey)?.unit||''):'')}catch(_){return ''}
  }
  function copyCellKeys(sourceMaps,targetMaps,clearKeys,copyKeys=clearKeys){
    const fields=['assign','assignmentMeta','manualDutyOverrides','engineDecisions','rpysCellLocks','lockedDutyCells'];
    for(const field of fields){
      targetMaps[field]=targetMaps[field]||{};const source=sourceMaps[field]||{};
      for(const key of clearKeys)delete targetMaps[field][key];
      for(const key of copyKeys)if(own(source,key))targetMaps[field][key]=clone(source[key]);
    }
  }
  function copyScopeData(sourceSnapshot,targetSnapshot,scope,value,monthKey){
    const source=clone(sourceSnapshot),target=clone(targetSnapshot);if(!source||!target)return null;
    source.maps=source.maps||{};target.maps=target.maps||{};source.nested=source.nested||{};target.nested=target.nested||{};
    if(scope==='all'){
      const targetLock=clone(target.maps.lockedMonths||{}),result=clone(source);
      result.maps=result.maps||{};result.maps.lockedMonths=targetLock;
      result.month=monthKey;result.capturedAt=new Date().toISOString();return result;
    }
    if(scope==='unit'){
      const unit=String(value||''),keys=new Set();
      for(const field of ['assign','assignmentMeta','manualDutyOverrides','dutyCellOverrides','engineDecisions','rpysCellLocks','lockedDutyCells']){
        for(const key of Object.keys(source.maps[field]||{}))if(cellUnit(key,monthKey)===unit)keys.add(key);
        for(const key of Object.keys(target.maps[field]||{}))if(cellUnit(key,monthKey)===unit)keys.add(key);
      }
      copyCellKeys(source.maps,target.maps,keys);
      target.maps.dutyCellOverrides=target.maps.dutyCellOverrides||{};
      for(const key of keys)delete target.maps.dutyCellOverrides[key];
      for(const key of keys)if(own(source.maps.dutyCellOverrides,key))target.maps.dutyCellOverrides[key]=clone(source.maps.dutyCellOverrides[key]);
      for(const field of ['unitPools','manualDistributionTargetsV399']){
        target.maps[field]=target.maps[field]||{};const key=monthKey+'|'+unit;
        delete target.maps[field][key];if(own(source.maps[field],key))target.maps[field][key]=clone(source.maps[field][key]);
      }
      if(unit==='POLİKLİNİK RÖNTGEN')for(const key of ['polRotation2.orders','polRotation2.audit','polRotation2.baseWeek','polRotation2.auditSummary','polRoomRotation.plans']){
        target.nested[key]=target.nested[key]||{};delete target.nested[key][monthKey];
        if(own(source.nested[key],monthKey))target.nested[key][monthKey]=clone(source.nested[key][monthKey]);
      }
    }else if(scope==='person'){
      const personId=Number(value),sourceAssign=source.maps.assign||{},targetAssign=target.maps.assign||{},sourceKeys=new Set(),clearKeys=new Set();
      for(const [key,pid] of Object.entries(sourceAssign))if(Number(pid)===personId){sourceKeys.add(key);clearKeys.add(key)}
      for(const [key,pid] of Object.entries(targetAssign))if(Number(pid)===personId)clearKeys.add(key);
      copyCellKeys(source.maps,target.maps,clearKeys,sourceKeys);
    }else return null;
    target.month=monthKey;target.capturedAt=new Date().toISOString();return target;
  }
  function targetLocked(snapshot,monthKey){return !!snapshot?.maps?.lockedMonths?.[monthKey]}
  function copyBetweenLists(scope,value,monthKey=currentMonth()){
    const sourceVariant=activeVariant(monthKey),targetVariant=sourceVariant==='main'?'alt':'main',entry=monthEntry(monthKey,true);
    if(!entry?.[targetVariant]?.data){
      if(targetVariant==='alt')return createAlternative(monthKey);
      if(typeof alert==='function')alert('Hedef liste bulunamadı.');return false;
    }
    captureVariant(monthKey,sourceVariant);
    const source=entry[sourceVariant].data,target=entry[targetVariant].data;
    if(targetLocked(target,monthKey)){
      if(typeof alert==='function')alert('Hedef liste kilitli. Önce hedef listeye geçip ay kilidini aç. Ana liste değiştirilmedi.');
      return false;
    }
    const data=database(),person=scope==='person'?(data?.staff||[]).find(p=>Number(p.id)===Number(value)):null;
    const detail=scope==='all'?'tüm liste':scope==='unit'?`“${value}” birimi`:`“${person?.name||value}” personeli`;
    if(typeof confirm==='function'&&!confirm(`Aktif ${sourceVariant==='main'?'Ana':'Alternatif'} listeden ${detail}, ${targetVariant==='main'?'Ana':'Alternatif'} listeye kopyalanacak. Hedefte yalnız bu kapsamdaki kayıtlar değişecek. Devam edilsin mi?`))return false;
    const next=copyScopeData(source,target,scope,value,monthKey);if(!next)return false;
    entry[targetVariant]={...entry[targetVariant],updatedAt:new Date().toISOString(),source:`${sourceVariant}-${scope}-copy`,data:next};
    closeCopyDialog();
    const ok=switchVariant(targetVariant,monthKey);
    if(ok&&typeof alert==='function')alert(`${detail} hedef listeye kopyalandı ve hedef liste açıldı.`);
    return ok;
  }
  function copyUnits(){
    try{return typeof allUnitNames==='function'?allUnitNames().slice().sort((a,b)=>a.localeCompare(b,'tr')):[]}catch(_){return []}
  }
  function copyPeople(){
    return (database()?.staff||[]).slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'tr'));
  }
  function updateCopyScopeUi(){
    const scope=document.getElementById('rpysCopyScope406')?.value||'all',unit=document.getElementById('rpysCopyUnit406'),person=document.getElementById('rpysCopyPerson406');
    if(unit)unit.hidden=scope!=='unit';if(person)person.hidden=scope!=='person';
  }
  function closeCopyDialog(){const modal=document.getElementById('rpysCopyModal406');if(modal)modal.hidden=true}
  function openCopyDialog(){
    const monthKey=currentMonth();if(!hasAlternative(monthKey))return createAlternative(monthKey);
    let modal=document.getElementById('rpysCopyModal406');if(!modal)return false;
    const active=activeVariant(monthKey),target=active==='main'?'alt':'main';
    modal.querySelector('#rpysCopyDirection406').textContent=`${active==='main'?'1. Liste (Ana)':'2. Liste (Alternatif)'} → ${target==='main'?'1. Liste (Ana)':'2. Liste (Alternatif)'}`;
    const unit=modal.querySelector('#rpysCopyUnit406');unit.innerHTML=copyUnits().map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join('');
    const person=modal.querySelector('#rpysCopyPerson406');person.innerHTML=copyPeople().map(p=>`<option value="${Number(p.id)}">${escapeHtml(p.name||'')}</option>`).join('');
    modal.hidden=false;updateCopyScopeUi();return true;
  }
  function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function applyCopyDialog(){
    const scope=document.getElementById('rpysCopyScope406')?.value||'all';
    const value=scope==='unit'?document.getElementById('rpysCopyUnit406')?.value:scope==='person'?document.getElementById('rpysCopyPerson406')?.value:'';
    if(scope!=='all'&&!value){if(typeof alert==='function')alert(scope==='unit'?'Birim seç.':'Personel seç.');return false}
    return copyBetweenLists(scope,value,currentMonth());
  }
  function injectStyle(){
    if(document.getElementById('rpysListVariantsStyle406'))return;
    const style=document.createElement('style');style.id='rpysListVariantsStyle406';style.textContent=`
      .rpysListVariants406{display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap;padding:4px 6px;border:1px solid var(--line,#dbe5ef);border-radius:10px;background:var(--panel,#fff)}
      .rpysListVariants406 label{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:800;color:var(--ink,#17365d);white-space:nowrap}
      #rpysListVariantSelect406{min-width:166px}
      .rpysListVariantBadge406{display:inline-flex;align-items:center;min-height:28px;padding:4px 8px;border-radius:999px;background:#e7f1fb;color:#17365d;font-size:10px;font-weight:900;white-space:nowrap}
      .rpysListVariantBadge406.alt{background:#fff1cb;color:#794b00;border:1px solid #f0c04d}
      #rpysCreateAlt406{white-space:nowrap}
      #rpysCopyBetween406{white-space:nowrap}
      .rpysCopyModal406[hidden]{display:none!important}.rpysCopyModal406{position:fixed;inset:0;z-index:100080;display:grid;place-items:center;padding:16px;background:rgba(7,20,34,.55)}
      .rpysCopyCard406{width:min(520px,96vw);background:var(--panel,#fff);color:var(--ink,#17365d);border:1px solid var(--line,#dbe5ef);border-radius:16px;padding:18px;box-shadow:0 22px 70px rgba(0,0,0,.3)}
      .rpysCopyCard406 h3{margin:0 0 6px}.rpysCopyCard406 p{font-size:12px;line-height:1.45}.rpysCopyDirection406{padding:9px 11px;margin:10px 0;border-radius:10px;background:#e7f1fb;font-weight:900;text-align:center}
      .rpysCopyFields406{display:grid;gap:9px}.rpysCopyFields406 label{display:grid;gap:4px;font-size:11px;font-weight:800}.rpysCopyFields406 select{width:100%}.rpysCopyActions406{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}
      @media(max-width:900px){.rpysListVariants406{width:100%;padding:5px}.rpysListVariants406 label{flex:1}.rpysListVariants406 select{flex:1;min-width:140px}#rpysCreateAlt406{flex:1}}
      @media print{.rpysListVariants406{display:none!important}}
    `;document.head.appendChild(style);
  }
  function buildUi(){
    const month=document.getElementById('month');if(!month)return false;
    let wrap=document.getElementById('rpysListVariants406');
    if(!wrap){
      injectStyle();wrap=document.createElement('div');wrap.id='rpysListVariants406';wrap.className='rpysListVariants406';
      wrap.innerHTML=`<label>Liste <select id="rpysListVariantSelect406" aria-label="Aylık liste seçimi"><option value="main">1. Liste (Ana)</option><option value="alt">2. Liste (Alternatif)</option></select></label><button type="button" class="btn alt" id="rpysCreateAlt406">＋ 2. Listeyi Oluştur</button><button type="button" class="btn alt" id="rpysCopyBetween406">⇄ Listeler Arası Kopyala</button><span class="rpysListVariantBadge406" id="rpysListVariantBadge406">Ana liste</span>`;
      month.insertAdjacentElement('afterend',wrap);
      wrap.querySelector('#rpysListVariantSelect406').addEventListener('change',event=>switchVariant(event.target.value,currentMonth()));
      wrap.querySelector('#rpysCreateAlt406').addEventListener('click',()=>createAlternative(currentMonth()));
      wrap.querySelector('#rpysCopyBetween406').addEventListener('click',openCopyDialog);
      const modal=document.createElement('div');modal.id='rpysCopyModal406';modal.className='rpysCopyModal406';modal.hidden=true;
      modal.innerHTML=`<div class="rpysCopyCard406" role="dialog" aria-modal="true" aria-labelledby="rpysCopyTitle406"><h3 id="rpysCopyTitle406">Listeler Arası Kopyala</h3><p>Aktif listedeki kayıtları diğer listeye aktar. Kapsam dışındaki görevler hedef listede değişmez.</p><div class="rpysCopyDirection406" id="rpysCopyDirection406"></div><div class="rpysCopyFields406"><label>Kopyalama kapsamı<select id="rpysCopyScope406"><option value="all">Tüm listeyi birebir kopyala</option><option value="unit">Yalnız seçilen birimi kopyala</option><option value="person">Yalnız seçilen personeli kopyala</option></select></label><select id="rpysCopyUnit406" aria-label="Kopyalanacak birim"></select><select id="rpysCopyPerson406" aria-label="Kopyalanacak personel"></select></div><p><b>Koruma:</b> Hedef liste kilitliyse işlem yapılmaz. Birim/personel kopyasında hedefteki diğer kayıtlar korunur.</p><div class="rpysCopyActions406"><button type="button" class="btn alt" id="rpysCopyCancel406">İptal</button><button type="button" class="btn" id="rpysCopyApply406">Hedef Listeye Kopyala</button></div></div>`;
      document.body.appendChild(modal);modal.querySelector('#rpysCopyScope406').addEventListener('change',updateCopyScopeUi);modal.querySelector('#rpysCopyCancel406').addEventListener('click',closeCopyDialog);modal.querySelector('#rpysCopyApply406').addEventListener('click',applyCopyDialog);modal.addEventListener('click',event=>{if(event.target===modal)closeCopyDialog()});
    }
    refreshUi();return true;
  }
  function refreshUi(){
    const monthKey=currentMonth(),select=document.getElementById('rpysListVariantSelect406'),button=document.getElementById('rpysCreateAlt406'),copyButton=document.getElementById('rpysCopyBetween406'),badge=document.getElementById('rpysListVariantBadge406');
    if(!select||!button||!badge||!monthKey)return;
    const alt=hasAlternative(monthKey),active=activeVariant(monthKey),option=select.querySelector('option[value="alt"]');
    if(option)option.disabled=!alt;
    select.value=active;
    button.hidden=alt;
    button.disabled=alt;
    if(copyButton){copyButton.hidden=!alt;copyButton.disabled=!alt}
    badge.textContent=active==='alt'?'Aktif: 2. Liste (Alternatif)':'Aktif: 1. Liste (Ana)';
    badge.classList.toggle('alt',active==='alt');
    const c=counts(monthKey);select.title=`Ana liste: ${c.main} görev${alt?` • Alternatif: ${c.alt} görev`:''}`;
    document.body?.setAttribute('data-rpys-list-variant',active);
  }
  let observedMonth='';
  function installMonthListener(){
    const month=document.getElementById('month');if(!month||month.dataset.rpysListVariant406)return;
    month.dataset.rpysListVariant406='1';observedMonth=String(month.value||'');
    month.addEventListener('change',()=>{
      const oldMonth=observedMonth;
      if(oldMonth)captureVariant(oldMonth,activeVariant(oldMonth));
      observedMonth=String(month.value||'');
      setTimeout(()=>{buildUi();refreshUi()},0);
    },true);
  }
  function install(){
    if(!database()||!document.getElementById('month'))return false;
    ensureStore();installMonthListener();buildUi();refreshUi();return true;
  }
  window.rpysListVariants406={
    version:VERSION,ensureStore,activeVariant,hasAlternative,pickMonthMap,replaceMonthMap,
    snapshotMonth,applySnapshot,captureVariant,switchVariant,createAlternative,copyScopeData,copyBetweenLists,openCopyDialog,counts,refreshUi,install
  };
  let tries=0,timer=setInterval(()=>{tries++;if(install()||tries>120)clearInterval(timer)},250);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.addEventListener('focus',refreshUi);
  window.addEventListener('rpys-direct-core-ready',()=>setTimeout(()=>{install();refreshUi()},0));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshUi()});
})();
