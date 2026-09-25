/* First-edit durability and click-only, unit-scoped suitable-person menu. */
(()=>{
  if(window.__RPYS_INTERACTION_GUARD_V400__)return;
  window.__RPYS_INTERACTION_GUARD_V400__=true;

  let suitableOpen=false,repairTimer=0,flushTimer=0,ackToken=0,repairing=false;
  const guard=()=>{window.__RPYS_EDIT_GUARD_UNTIL_V400__=Date.now()+120000};
  const invalidate=()=>{
    try{_assignCache={}}catch(_){}try{_allAssignCache=null}catch(_){}
    try{_calcCache={}}catch(_){}try{_peopleCache=null}catch(_){}
  };
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const monthKey=()=>{try{return typeof ym==='function'?String(ym()||''):String(document.getElementById('month')?.value||'')}catch(_){return ''}};
  function currentCell(){
    try{if(dutyContextCellV2413)return dutyContextCellV2413}catch(_){}
    return window.dutyContextCellV2413||document.querySelector('.dropDutyCell.dutySelected');
  }
  function currentCellKey(){const c=currentCell();return c?[c.dataset.type,c.dataset.day,c.dataset.col].join('|'):''}

  function monitorAck(){
    const token=++ackToken;let chain=null;
    try{chain=_storageWriteChain}catch(_){}
    Promise.resolve(chain).then(()=>{
      let pending=false,timer=false;try{pending=!!_savePending}catch(_){}try{timer=!!_saveTimerV245}catch(_){}
      if(token===ackToken&&!pending&&!timer)window.__RPYS_EDIT_GUARD_UNTIL_V400__=0;
    }).catch(()=>{});
  }
  function flushFirstSave(){
    clearTimeout(flushTimer);flushTimer=setTimeout(()=>{
      let pendingTimer=false;try{pendingTimer=!!_saveTimerV245}catch(_){}
      if(!pendingTimer||typeof window.saveNowV245!=='function')return;
      try{window.saveNowV245({label:'İlk işlem güvenli kaydı'})}catch(e){console.warn('RPYS400 ilk kayıt',e)}
    },0);
  }
  function installSaveGuards(){
    const saveBase=window.save;
    if(typeof saveBase==='function'&&!saveBase.__rpys400){
      const wrapped=function(){guard();invalidate();const value=saveBase.apply(this,arguments);flushFirstSave();return value};
      wrapped.__rpys400=true;wrapped.__rpys400base=saveBase;window.save=wrapped;
    }
    const nowBase=window.saveNowV245;
    if(typeof nowBase==='function'&&!nowBase.__rpys400){
      const wrapped=function(){guard();invalidate();const value=nowBase.apply(this,arguments);monitorAck();return value};
      wrapped.__rpys400=true;wrapped.__rpys400base=nowBase;window.saveNowV245=wrapped;
    }
  }

  function configuredPool(col){
    const unit=String(col?.unit||''),ids=[];
    try{
      const autoUnit=document.getElementById('autoUnit'),autoPeople=document.getElementById('autoPeople');
      if(autoUnit?.value===unit)for(const option of Array.from(autoPeople?.selectedOptions||[]))ids.push(Number(option.value));
      if(!ids.length)for(const id of db.unitPools?.[monthKey()+'|'+unit]||[])ids.push(Number(id));
      if(!ids.length&&unit==='PORTABL + SKOPİ')for(const id of db.skopiEligible||[])ids.push(Number(id));
    }catch(_){}
    return new Set(ids.filter(Boolean));
  }
  function suitableRows(col){
    let rows=[];try{rows=typeof suitablePeopleForDutyV2413==='function'?suitablePeopleForDutyV2413():[]}catch(e){console.warn('RPYS400 uygun personel',e)}
    if(!Array.isArray(rows))rows=[];
    const pool=configuredPool(col),scoped=pool.size?rows.filter(row=>pool.has(Number((row?.p||row)?.id))):rows.slice(0,8);
    return {rows:scoped,poolConfigured:pool.size>0,total:rows.length};
  }
  function displayDate(raw){const m=String(raw||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}.${m[2]}.${m[1]}`:String(raw||'—')}
  function renderSuitable(){
    const box=document.getElementById('dutySuitableListV2413');if(!box)return;
    if(!suitableOpen){box.replaceChildren();box.style.display='none';return}
    const cell=currentCell();if(!cell){box.innerHTML='<div class="suitableNoneV2413">Önce bir nöbet günü hücresine sağ tıklayın.</div>';box.style.display='block';return}
    let col=null,date='';const type=cell.dataset.type,day=Number(cell.dataset.day);
    try{col=dutyColumnByKey(type,cell.dataset.col)}catch(_){}try{date=dateStr(day)}catch(_){date=monthKey()+'-'+String(day).padStart(2,'0')}
    if(!col){box.innerHTML='<div class="suitableNoneV2413">Vardiya bilgisi bulunamadı.</div>';box.style.display='block';return}
    const result=suitableRows(col),rows=result.rows;
    const scope=result.poolConfigured?'birim için seçili personel havuzu':'ilk 8 uygun personel';
    const header=`<div class="suitableHeadV2413"><b>${esc(displayDate(date))} • ${esc(col.unit||type)}</b><br><small>${esc(col.shift||'')} • ${rows.length} kişi • ${scope}</small></div>`;
    const people=rows.length?rows.map(item=>{
      const p=item?.p||item;if(!p)return '';
      const idle=Number(item.totalIdle??item.idle??999),last=String(item.lastAny||item.last||'');
      const idleText=idle>=900?'Kayıtlı önceki mesaisi yok':`${idle} gündür herhangi bir mesaiye gelmedi`;
      const lastText=last?` • Son mesai: ${displayDate(last)}`:'',spouse=item.spouseToday?' • Eşi bugün görevde':'';
      let style='';try{style=personColorStyle(p.id,false)}catch(_){}
      return `<button type="button" class="suitablePersonV2413 rpys400SuitablePerson" data-rpys-suitable-person="${Number(p.id)}" style="${esc(style)}"><b>${esc(p.name)}</b><span>${esc(idleText+lastText+spouse)}</span></button>`;
    }).join(''):'<div class="suitableNoneV2413">Bu hücre için seçili birim havuzunda kurallara uygun personel bulunamadı.</div>';
    box.innerHTML=header+people;box.style.display='block';
  }
  function ensureSingleMenu(){
    if(repairing)return;repairing=true;
    try{
      const menus=[...document.querySelectorAll('[id="dutyContextMenu"]')];if(!menus.length)return;
      const menu=menus[0];for(const duplicate of menus.slice(1))duplicate.remove();
      let wrap=menu.querySelector('#rpysSuitableWrapV396');
      for(const old of [...menu.querySelectorAll('.dutySuitableWrapV2413')])if(old!==wrap)old.remove();
      if(!wrap){wrap=document.createElement('div');wrap.id='rpysSuitableWrapV396';wrap.className='dutySuitableWrapV2413';menu.insertBefore(wrap,menu.firstChild)}
      wrap.removeAttribute('onmouseenter');wrap.onmouseenter=null;
      let button=wrap.querySelector('#rpysSuitableButtonV396'),box=wrap.querySelector('#dutySuitableListV2413');
      if(!button){button=document.createElement('button');button.id='rpysSuitableButtonV396';button.type='button';button.className='ctxBtn';wrap.prepend(button)}
      if(!box){box=document.createElement('div');box.id='dutySuitableListV2413';box.className='dutySuitableListV2413';box.setAttribute('aria-live','polite');wrap.appendChild(box)}
      if(!button.dataset.rpys400){
        const fresh=button.cloneNode(true);button.replaceWith(fresh);button=fresh;button.dataset.rpys396='1';button.dataset.rpys400='1';
        button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();suitableOpen=!suitableOpen;button.textContent=suitableOpen?'👥 Uygun Personeli Gizle':'👥 O Güne Uygun Personeli Bul';renderSuitable()});
      }
      button.textContent=suitableOpen?'👥 Uygun Personeli Gizle':'👥 O Güne Uygun Personeli Bul';
      if(!suitableOpen){box.replaceChildren();box.style.display='none'}
      window.renderSuitableDutyPeopleV2413=renderSuitable;
    }finally{repairing=false}
  }
  function scheduleRepair(delay=0){clearTimeout(repairTimer);repairTimer=setTimeout(()=>{installSaveGuards();ensureSingleMenu()},delay)}
  function install(){installSaveGuards();ensureSingleMenu();window.renderSuitableDutyPeopleV2413=renderSuitable;document.documentElement.dataset.rpysInteractionGuard='400'}

  ['input','change','paste','drop'].forEach(name=>document.addEventListener(name,guard,true));
  document.addEventListener('contextmenu',e=>{if(!e.target.closest?.('.dropDutyCell'))return;suitableOpen=false;scheduleRepair(0);setTimeout(()=>scheduleRepair(0),80)},true);
  const observer=new MutationObserver(mutations=>{if(mutations.some(m=>m.target?.closest?.('#dutyContextMenu')||[...m.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('#dutyContextMenu,.dutySuitableWrapV2413')||n.querySelector?.('#dutyContextMenu,.dutySuitableWrapV2413')))))scheduleRepair(20)});
  const start=()=>{install();observer.observe(document.body,{childList:true,subtree:true});let n=0,iv=setInterval(()=>{install();if(++n>=18)clearInterval(iv)},400)};
  window.rpysInteraction400={installSaveGuards,configuredPool,suitableRows,renderSuitable,ensureSingleMenu,guard};
  window.addEventListener('rpys-direct-core-ready',()=>setTimeout(start,80));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
