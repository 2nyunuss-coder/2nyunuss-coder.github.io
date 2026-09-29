/* Custom shift activation, ordering and all-unit support. */
(()=>{
  if(window.__RPYS_CUSTOM_SHIFT_V405__)return;
  window.__RPYS_CUSTOM_SHIFT_V405__=true;

  const trUpper=value=>String(value||'').trim().toLocaleUpperCase('tr-TR');
  const norm=value=>trUpper(value).replace(/\s+/g,' ').replace(/[–—]/g,'-');
  const startMinute=value=>{const m=String(value||'').match(/(\d{1,2})[:.]?(\d{2})/);return m?Number(m[1])*60+Number(m[2]):9999};
  const signature=col=>norm(col?.unit)+'|'+norm(col?.shift);
  const get=id=>document.getElementById(id);

  function ensureStore(){
    if(!window.db)return false;
    if(!db.shiftStudio||typeof db.shiftStudio!=='object')db.shiftStudio={disabled:{},custom:[]};
    if(!db.shiftStudio.disabled||typeof db.shiftStudio.disabled!=='object')db.shiftStudio.disabled={};
    if(!db.shiftStudio.disabledAt||typeof db.shiftStudio.disabledAt!=='object')db.shiftStudio.disabledAt={};
    if(!Array.isArray(db.shiftStudio.custom))db.shiftStudio.custom=[];
    if(!db.shiftStudio.columnOrder||typeof db.shiftStudio.columnOrder!=='object')db.shiftStudio.columnOrder={pol:[],acil:[]};
    return true
  }
  function insertCustom(out,col){
      const unit=norm(col.unit),same=out.map((item,index)=>({item,index})).filter(x=>norm(x.item.unit)===unit);
      if(!same.length){out.push(col);return}
      const minute=startMinute(col.shift),later=same.find(x=>startMinute(x.item.shift)>minute);
      out.splice(later?later.index:same[same.length-1].index+1,0,col)
  }
  function autoPlace(cols){
    const out=cols.filter(col=>!col._custom);
    for(const col of cols.filter(col=>col._custom))insertCustom(out,col);
    return out
  }
  function applyOrder(type,cols){
    if(!ensureStore())return cols;
    const stored=Array.isArray(db.shiftStudio.columnOrder[type])?db.shiftStudio.columnOrder[type].map(String):[];
    if(!stored.length)return autoPlace(cols);
    const byKey=new Map(cols.map(col=>[String(col.key),col])),ordered=[];
    for(const key of stored){const col=byKey.get(key);if(col){ordered.push(col);byKey.delete(key)}}
    for(const col of byKey.values())if(col._custom)insertCustom(ordered,col);else ordered.push(col);
    return ordered
  }
  function saveImmediate(label){
    try{_assignCache={}}catch(_){}try{_allAssignCache=null}catch(_){}try{_calcCache={}}catch(_){}
    try{if(typeof saveNowV245==='function')return saveNowV245({label});if(typeof save==='function')return save()}catch(e){console.warn('RPYS405 kayıt',e)}
  }
  function renderAfterChange(){
    try{if(typeof renderShiftStudio==='function')renderShiftStudio()}catch(_){}
    try{if(typeof renderCurrentPage==='function')renderCurrentPage()}catch(_){}
  }
  function moveShiftColumn(type,key,direction){
    if(!ensureStore()||typeof dutyColumns!=='function')return;
    const active=dutyColumns(type),current=active.find(col=>String(col.key)===String(key));if(!current)return;
    const peers=active.filter(col=>norm(col.unit)===norm(current.unit)),at=peers.findIndex(col=>String(col.key)===String(key)),next=peers[at+Number(direction)];
    if(!next)return alert(direction<0?'Bu vardiya birimi içinde zaten en solda.':'Bu vardiya birimi içinde zaten en sağda.');
    const all=dutyColumns(type,{includeDisabled:true}),order=all.map(col=>String(col.key)),i=order.indexOf(String(key)),j=order.indexOf(String(next.key));
    if(i<0||j<0)return;[order[i],order[j]]=[order[j],order[i]];db.shiftStudio.columnOrder[type]=order;
    saveImmediate('Vardiya sütunu sırası değiştirildi');renderAfterChange()
  }
  function enhanceShiftRows(){
    const host=get('shiftStudioRows');if(!host||typeof dutyColumns!=='function')return;
    const columns=[...dutyColumns('pol',{includeDisabled:true}).map(col=>({type:'pol',col})),...dutyColumns('acil',{includeDisabled:true}).map(col=>({type:'acil',col}))];
    [...host.querySelectorAll('.shiftStudioRow')].forEach((row,index)=>{
      const item=columns[index],bar=row.querySelector('.toolbar');if(!item||!bar||bar.querySelector('[data-rpys405-move]'))return;
      const off=!!db.shiftStudio.disabled[item.type+'|'+item.col.key];
      for(const [dir,label,title] of [[-1,'←','Birim içinde sola kaydır'],[1,'→','Birim içinde sağa kaydır']]){
        const button=document.createElement('button');button.type='button';button.className='btn alt';button.textContent=label;button.title=title;button.dataset.rpys405Move=String(dir);button.disabled=off;
        button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();moveShiftColumn(item.type,item.col.key,dir)});bar.prepend(button)
      }
    })
  }
  function enhanceAddForm(){
    const input=get('shiftAddUnit');if(!input||input.dataset.rpys405)return;input.dataset.rpys405='1';input.placeholder='Mevcut veya yeni birim adı';
    let list=get('rpys405ShiftUnits');if(!list){list=document.createElement('datalist');list.id='rpys405ShiftUnits';input.after(list)}input.setAttribute('list',list.id);
    const refresh=()=>{if(typeof dutyColumns!=='function')return;const units=[...new Set([...dutyColumns('pol',{includeDisabled:true}),...dutyColumns('acil',{includeDisabled:true})].map(col=>trUpper(col.unit)).filter(Boolean))];list.innerHTML=units.map(unit=>'<option value="'+String(unit).replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'"></option>').join('')};
    refresh();const help=document.createElement('div');help.className='smallhelp';help.dataset.rpys405='unit-help';help.textContent='Listeden mevcut birimi seçebilir veya gerektiğinde yeni birim adı yazabilirsin.';input.closest('label')?.appendChild(help)
  }
  function fixedAddCustomShift(){
    if(!ensureStore())return;
    const type=get('shiftAddType')?.value,unit=String(get('shiftAddUnit')?.value||'').trim(),shift=String(get('shiftAddTime')?.value||'').trim(),hours=Number(get('shiftAddHours')?.value),days=get('shiftAddDays')?.value,cat=get('shiftAddCat')?.value;
    if(!['pol','acil'].includes(type)||!unit||!shift||!Number.isFinite(hours)||hours<=0)return alert('Birim, saat ve süreyi doldur.');
    const all=dutyColumns(type,{includeDisabled:true}),sig=signature({unit,shift}),matches=all.filter(col=>signature(col)===sig),active=matches.find(col=>!db.shiftStudio.disabled[type+'|'+col.key]);
    if(active)return alert('Bu birim ve saat için aktif bir vardiya zaten var. Vardiya Yönetim Merkezi’nden yerini oklarla değiştirebilirsin.');
    const disabled=matches[0];if(disabled&&typeof setShiftEnabled==='function'){setShiftEnabled(type,disabled.key,true);return alert('Aynı birim ve saatteki iptal vardiya yeniden aktif edildi. Yeni mükerrer sütun oluşturulmadı.')}
    let id=Date.now();while(db.shiftStudio.custom.some(col=>Number(col.id)===id))id++;
    const key='usr_'+id;db.shiftStudio.custom.push({id,type,key,unit:trUpper(unit),shift,cat,hours,days,_custom:true});
    delete db.shiftStudio.disabled[type+'|'+key];delete db.shiftStudio.disabledAt[type+'|'+key];
    const ordered=applyOrder(type,dutyColumns(type,{includeDisabled:true}));db.shiftStudio.columnOrder[type]=ordered.map(col=>String(col.key));
    saveImmediate('Yeni vardiya eklendi');renderAfterChange();alert('Vardiya aktif olarak eklendi. Sütun yerini Vardiya Yönetim Merkezi’ndeki ← → düğmeleriyle değiştirebilirsin.')
  }
  function install(){
    if(!ensureStore())return;
    const columnsBase=window.dutyColumns;
    if(typeof columnsBase==='function'&&!columnsBase.__rpys405){const wrapped=function(type,opts){return applyOrder(type,columnsBase.call(this,type,opts))};wrapped.__rpys405=true;wrapped.__rpys405base=columnsBase;window.dutyColumns=wrapped}
    const blockedBase=window.isShiftBlockedForMonth;
    if(typeof blockedBase==='function'&&!blockedBase.__rpys405){const wrapped=function(type,col,monthKey){if(!col||!ensureStore())return false;const k=type+'|'+col.key;if(!db.shiftStudio.disabled[k])return false;const at=String(db.shiftStudio.disabledAt[k]||(typeof ym==='function'?ym():''));const month=String(monthKey||(typeof ym==='function'?ym():''));return !at||month>=at};wrapped.__rpys405=true;wrapped.__rpys405base=blockedBase;window.isShiftBlockedForMonth=wrapped}
    const addBase=window.addCustomShift;
    if(typeof addBase==='function'&&!addBase.__rpys405){fixedAddCustomShift.__rpys405=true;fixedAddCustomShift.__rpys405base=addBase;window.addCustomShift=fixedAddCustomShift}
    const renderBase=window.renderShiftStudio;
    if(typeof renderBase==='function'&&!renderBase.__rpys405){const wrapped=function(){const value=renderBase.apply(this,arguments);enhanceShiftRows();enhanceAddForm();return value};wrapped.__rpys405=true;wrapped.__rpys405base=renderBase;window.renderShiftStudio=wrapped}
    enhanceAddForm();enhanceShiftRows();document.documentElement.dataset.rpysCustomShift='405'
  }
  window.rpysShift405={install,applyOrder,moveShiftColumn,fixedAddCustomShift,signature,startMinute};
  window.addEventListener('rpys-direct-core-ready',()=>setTimeout(install,120));
  const start=()=>{install();setTimeout(install,1000);setTimeout(install,3500);setTimeout(install,7000)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
