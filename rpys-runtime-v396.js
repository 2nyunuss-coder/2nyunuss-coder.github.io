(()=>{
  if(window.__RPYS_DATA_INTEGRITY_PERSONNEL_V396__)return;
  window.__RPYS_DATA_INTEGRITY_PERSONNEL_V396__=true;

  let suitableOpen=false,menuRepairTimer=0;

  function markEdit(){window.__RPYS_LAST_USER_EDIT_V396__=Date.now()}
  function invalidateCaches(){
    try{_assignCache={}}catch(_){}
    try{_allAssignCache=null}catch(_){}
    try{_calcCache={}}catch(_){}
    try{_peopleCache=null}catch(_){}
  }
  function trUpper(v){return String(v??"").toLocaleUpperCase("tr-TR").replace(/\s+/g," ").trim()}
  function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  function isActive(person){return !!person&&person.status==="Aktif"&&person.active!==false}
  function currentCell(){
    try{if(dutyContextCellV2413)return dutyContextCellV2413}catch(_){}
    return window.dutyContextCellV2413||document.querySelector(".dropDutyCell.dutySelected")
  }
  function currentMonth(){
    try{return typeof ym==="function"?String(ym()||""):String(document.getElementById("month")?.value||"")}catch(_){return String(document.getElementById("month")?.value||"")}
  }
  function displayDate(raw){
    const m=String(raw||"").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m?`${m[3]}.${m[2]}.${m[1]}`:String(raw||"—")
  }

  function installSaveHooks(){
    try{
      const base=window.save;
      if(typeof base==="function"&&!base.__rpys396){
        const wrapped=function(){markEdit();invalidateCaches();return base.apply(this,arguments)};
        wrapped.__rpys396=true;wrapped.__rpys396base=base;window.save=wrapped
      }
    }catch(e){console.warn("RPYS396 save hook",e)}
    try{
      const base=window.saveNowV245;
      if(typeof base==="function"&&!base.__rpys396){
        const wrapped=function(){markEdit();invalidateCaches();return base.apply(this,arguments)};
        wrapped.__rpys396=true;wrapped.__rpys396base=base;window.saveNowV245=wrapped
      }
    }catch(e){console.warn("RPYS396 immediate save hook",e)}
  }

  function hasMonthData(person,mk){
    try{return typeof personHasMonthData==="function"&&personHasMonthData(person,mk)}catch(_){return false}
  }
  function eligibleSayPeople(mk=currentMonth()){
    try{return (db.staff||[]).filter(p=>isActive(p)||hasMonthData(p,mk))}catch(_){return []}
  }
  function reconcileSayRoster(mk=currentMonth(),roster=null){
    try{
      if(!db.sayRoster||typeof db.sayRoster!=="object")db.sayRoster={};
      const eligible=eligibleSayPeople(mk).slice().sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""),"tr",{sensitivity:"base"}));
      const allowed=new Set(eligible.map(p=>Number(p.id))),seen=new Set(),src=roster||db.sayRoster[mk]||{say1:[],say2:[]};
      const clean=arr=>(arr||[]).map(Number).filter(id=>allowed.has(id)&&!seen.has(id)&&!!seen.add(id));
      const say1=clean(src.say1),say2=clean(src.say2);
      for(const p of eligible){
        const id=Number(p.id);if(seen.has(id))continue;
        (say1.length<16?say1:say2).push(id);seen.add(id)
      }
      return db.sayRoster[mk]={say1,say2}
    }catch(e){console.warn("RPYS396 saymanlık kadrosu",e);return roster||{say1:[],say2:[]}}
  }
  function installRosterHooks(){
    try{
      if(typeof window.sayEligiblePeople==="function"&&!window.sayEligiblePeople.__rpys396){
        const fn=function(mk=currentMonth()){return eligibleSayPeople(mk)};fn.__rpys396=true;window.sayEligiblePeople=fn
      }
      const base=window.ensureSayRoster;
      if(typeof base==="function"&&!base.__rpys396){
        const wrapped=function(mk=currentMonth()){
          const roster=base.apply(this,arguments);return reconcileSayRoster(mk,roster)
        };
        wrapped.__rpys396=true;wrapped.__rpys396base=base;window.ensureSayRoster=wrapped
      }
    }catch(e){console.warn("RPYS396 roster hook",e)}
  }

  function menuKey(button){
    if(button.closest("#dutySuitableListV2413"))return "";
    const t=trUpper(button.textContent);
    if(!t)return "";
    if(t.includes("SEÇİLİ")&&(t.includes("ÇALIŞMAYI DEĞİŞTİR")||t.includes("HÜCREYİ DEĞİŞTİR")))return "swap";
    if(t.includes("UYGUN KİŞİLER")||t.includes("UYGUN PERSONELİ BUL"))return "suitable";
    if((t.includes("KİLİTLE")||t.includes("KİLİDİ AÇ"))&&!t.includes("NÖBET + SAYMANLIK"))return "lock";
    return "text:"+t
  }
  function removeLegacySuitable(menu){
    for(const wrap of menu.querySelectorAll(".dutySuitableWrapV2413")){
      if(wrap.id==="rpysSuitableWrapV396")continue;
      const text=trUpper(wrap.textContent);
      if(text.includes("UYGUN KİŞİLER")||wrap.querySelector("#dutySuitableListV2413"))wrap.remove()
    }
  }
  function dedupeMenu(menu){
    if(!menu)return;
    const seen=new Set();
    for(const button of [...menu.querySelectorAll("button,.ctxBtn,[role=menuitem]")]){
      const key=menuKey(button);if(!key)continue;
      if(!seen.has(key)){seen.add(key);continue}
      button.remove()
    }
  }
  function ensureSuitableControl(){
    const menu=document.getElementById("dutyContextMenu");if(!menu)return;
    removeLegacySuitable(menu);
    let wrap=document.getElementById("rpysSuitableWrapV396");
    if(!wrap){
      wrap=document.createElement("div");wrap.id="rpysSuitableWrapV396";wrap.className="dutySuitableWrapV2413";
      wrap.innerHTML='<button id="rpysSuitableButtonV396" type="button" class="ctxBtn">👥 O Güne Uygun Personeli Bul</button><div id="dutySuitableListV2413" class="dutySuitableListV2413" aria-live="polite"></div>';
      menu.insertBefore(wrap,menu.firstChild)
    }
    const button=wrap.querySelector("#rpysSuitableButtonV396");
    if(button&&!button.dataset.rpys396){
      button.dataset.rpys396="1";
      button.addEventListener("click",e=>{
        e.preventDefault();e.stopPropagation();
        suitableOpen=!suitableOpen;
        const box=document.getElementById("dutySuitableListV2413");
        if(suitableOpen){
          renderSuitablePeople();button.textContent="👥 Uygun Personeli Gizle";
          if(box)box.style.display="block"
        }else{
          button.textContent="👥 O Güne Uygun Personeli Bul";
          if(box)box.style.display="none"
        }
      })
    }
  }
  function repairMenus(){
    ensureSuitableControl();
    dedupeMenu(document.getElementById("dutyContextMenu"));
    dedupeMenu(document.getElementById("cellContextMenu"))
  }
  function scheduleMenuRepair(delay=80){
    clearTimeout(menuRepairTimer);menuRepairTimer=setTimeout(repairMenus,delay)
  }

  function suitableRows(){
    try{
      const fn=window.suitablePeopleForDutyV2413;
      const rows=typeof fn==="function"?fn():[];
      return Array.isArray(rows)?rows:[]
    }catch(e){console.warn("RPYS396 uygun personel",e);return []}
  }
  function renderSuitablePeople(){
    const box=document.getElementById("dutySuitableListV2413");if(!box)return;
    const cell=currentCell();
    if(!cell){box.innerHTML='<div class="suitableNoneV2413">Önce bir nöbet günü hücresine sağ tıklayın.</div>';box.style.display=suitableOpen?"block":"none";return}
    const type=cell.dataset.type,day=Number(cell.dataset.day),colKey=cell.dataset.col;
    let col=null,date="";
    try{col=dutyColumnByKey(type,colKey)}catch(_){}
    try{date=dateStr(day)}catch(_){date=currentMonth()+"-"+String(day).padStart(2,"0")}
    if(!col){box.innerHTML='<div class="suitableNoneV2413">Vardiya bilgisi bulunamadı.</div>';box.style.display=suitableOpen?"block":"none";return}
    const rows=suitableRows();
    const header=`<div class="suitableHeadV2413"><b>${escapeHtml(displayDate(date))} • ${escapeHtml(col.unit||type)}</b><br><small>${escapeHtml(col.shift||"")} • yalnız o gün gerçekten müsait personel</small></div>`;
    const people=rows.length?rows.map(item=>{
      const p=item?.p||item;if(!p)return "";
      const idle=Number(item.totalIdle??item.idle??999),last=String(item.lastAny||item.last||"");
      const idleText=idle>=900?"Kayıtlı önceki mesaisi yok":`${idle} gündür herhangi bir mesaiye gelmedi`;
      const lastText=last?` • Son mesai: ${displayDate(last)}`:"";
      const spouse=item.spouseToday?" • Eşi bugün görevde":"";
      const gap=Number(item.gap);
      let style="";try{style=personColorStyle(p.id,false)}catch(_){}
      return `<button type="button" class="suitablePersonV2413 rpys396SuitablePerson" data-rpys-suitable-person="${Number(p.id)}" style="${escapeHtml(style)}"><b>${escapeHtml(p.name)}</b><span>${escapeHtml(idleText+lastText+spouse)}</span>${Number.isFinite(gap)?`<small>Mükellef açığı: ${Math.round(gap*10)/10} saat</small>`:""}</button>`
    }).join(""):'<div class="suitableNoneV2413">Bu gün için izin, nöbet çıkışı, çakışma ve birim kurallarını geçen müsait personel bulunamadı.</div>';
    box.innerHTML=header+people;box.style.display=suitableOpen?"block":"none"
  }
  function installSuitableRenderer(){
    try{window.renderSuitableDutyPeopleV2413=renderSuitablePeople}catch(_){}
    try{renderSuitableDutyPeopleV2413=renderSuitablePeople}catch(_){}
  }

  function syncStatusCompatibility(){
    try{for(const p of db.staff||[])p.active=p.status==="Aktif"}catch(_){}
  }
  function addStyle(){
    if(document.getElementById("rpys396Style"))return;
    const style=document.createElement("style");style.id="rpys396Style";
    style.textContent='#dutyContextMenu{max-height:calc(100vh - 24px)!important;overflow:auto!important}#rpysSuitableWrapV396{border-bottom:1px solid #d9e3ec;margin-bottom:4px;padding-bottom:4px}#rpysSuitableButtonV396{font-weight:900!important;background:#eef7ff!important;color:#17365d!important}.dutySuitableListV2413{max-height:min(390px,55vh)!important}.rpys396SuitablePerson{display:grid!important;grid-template-columns:minmax(120px,.75fr) minmax(170px,1.25fr)!important;gap:2px 8px!important;align-items:center!important}.rpys396SuitablePerson>b{font-size:10px!important}.rpys396SuitablePerson>span{white-space:normal!important;text-align:right!important;font-size:8px!important}.rpys396SuitablePerson>small{grid-column:1/-1;font-size:7px!important;opacity:.8}.passivePersonRow{order:99}@media(max-width:700px){#dutyContextMenu{min-width:min(92vw,360px)!important}.rpys396SuitablePerson{grid-template-columns:1fr!important}.rpys396SuitablePerson>span{text-align:left!important}.rpys396SuitablePerson>small{grid-column:1!important}}';
    document.head.appendChild(style)
  }

  function install(){
    installSaveHooks();installRosterHooks();installSuitableRenderer();syncStatusCompatibility();addStyle();repairMenus()
  }

  ["input","change","paste","drop"].forEach(name=>document.addEventListener(name,markEdit,true));
  document.addEventListener("contextmenu",e=>{
    if(!e.target.closest?.(".dropDutyCell"))return;
    suitableOpen=false;
    [0,50,180].forEach(ms=>setTimeout(()=>{repairMenus();if(suitableOpen)return;const box=document.getElementById("dutySuitableListV2413");if(box)box.style.display="none";const b=document.getElementById("rpysSuitableButtonV396");if(b)b.textContent="👥 O Güne Uygun Personeli Bul"},ms))
  },true);
  document.addEventListener("click",e=>{
    const person=e.target.closest?.("[data-rpys-suitable-person]");if(!person)return;
    e.preventDefault();e.stopPropagation();markEdit();
    const id=Number(person.dataset.rpysSuitablePerson||0);
    if(id&&typeof window.assignSuitableDutyV2413==="function")window.assignSuitableDutyV2413(id)
  },true);

  function observe(){
    const observer=new MutationObserver(mutations=>{
      if(mutations.some(m=>m.target?.closest?.("#dutyContextMenu,#cellContextMenu")||[...m.addedNodes].some(n=>n.nodeType===1&&(n.matches?.("#dutyContextMenu,#cellContextMenu")||n.querySelector?.("#dutyContextMenu,#cellContextMenu")))))scheduleMenuRepair()
    });
    observer.observe(document.body,{childList:true,subtree:true})
  }

  window.addEventListener("rpys-direct-core-ready",()=>setTimeout(install,120));
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{install();observe()});else{install();observe()}
  setTimeout(install,700);setTimeout(install,2600)
})();
