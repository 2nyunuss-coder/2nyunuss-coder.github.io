(()=>{
'use strict';
if(window.__RPYS_SAY_V2_FIXED__)return;window.__RPYS_SAY_V2_FIXED__=true;
const PREF='rpys-say-v2-display-20261022';
let prefs={width:100,dayHeight:29,hideAbsences:false,unit:'all'};
try{Object.assign(prefs,JSON.parse(localStorage.getItem(PREF)||'{}'))}catch(e){}
const persist=()=>{try{localStorage.setItem(PREF,JSON.stringify(prefs))}catch(e){}};
let enabled=false,busy=false;
const root=()=>document.getElementById('saymanlik');
const grids=()=>[...document.querySelectorAll('#say1Grid table,#say2Grid table')];
const style=document.createElement('style');style.id='rpys-say-v2-fixed-css';
style.textContent=`@media screen{
#saymanlik .sayV2bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:8px;margin:8px 0;border:1px solid #c5daee;background:#eef6ff;border-radius:8px}
#saymanlik .sayV2bar label{font-size:12px;display:inline-flex;gap:5px;align-items:center}
#saymanlik .sayV2bar input{width:100px}
#saymanlik .sayV2bar small{color:#54718c}
#saymanlik.sayV2enabled #say1Grid,#saymanlik.sayV2enabled #say2Grid{overflow:auto!important;max-width:100%!important}
#saymanlik.sayV2enabled #say1Grid table,#saymanlik.sayV2enabled #say2Grid table{width:max-content!important;min-width:100%!important;table-layout:auto!important}
#saymanlik.sayV2enabled #say1Grid tr>:first-child,#saymanlik.sayV2enabled #say2Grid tr>:first-child{position:sticky;left:0;z-index:3}
#saymanlik.sayV2enabled #say1Grid tr:first-child>*,#saymanlik.sayV2enabled #say2Grid tr:first-child>*{position:sticky;top:0;z-index:4}
#saymanlik.sayV2enabled .sayV2HiddenCol{display:none!important}
#saymanlik.sayV2enabled .sayV2resize{position:absolute;right:0;bottom:0;width:9px;height:9px;background:#2f77d5;opacity:.6;cursor:nwse-resize;z-index:6}
}`;
document.head.append(style);
const original=new WeakMap();
function remember(cell){if(!original.has(cell))original.set(cell,{width:cell.style.width,minWidth:cell.style.minWidth,height:cell.style.height,minHeight:cell.style.minHeight,position:cell.style.position,display:cell.style.display})}
function clear(){for(const table of grids())for(const tr of table.rows)for(const cell of tr.cells){
const orig=original.get(cell);if(orig){for(const [k,v]of Object.entries(orig))cell.style[k]=v;original.delete(cell)}
cell.classList.remove('sayV2HiddenCol');cell.querySelectorAll(':scope > .sayV2resize').forEach(n=>n.remove());
}root()?.classList.remove('sayV2enabled')}
function staff(){try{return Array.isArray(db?.staff)?db.staff:[]}catch(e){return []}}
function unit(p){return String(p?.unit||p?.department||p?.birim||p?.unitName||p?.departmentName||'').trim()}
function apply(){
if(!enabled||busy)return;busy=true;
try{const r=root();if(!r)return;r.classList.add('sayV2enabled');
for(const table of grids()){
const rows=[...table.rows];if(rows.length<2)continue;
const top=rows.find(tr=>tr.cells.length>3)||rows[0];
const heads=[...top.cells];
const cols=heads.map((cell,i)=>{
  const name=cell.textContent.trim().replace(/[↕↑↓]/g,'').replace(/\s+/g,' ');
  const p=staff().find(p=>String(p.name||'').trim().toLocaleUpperCase('tr-TR')===name.toLocaleUpperCase('tr-TR'));
  const absence=/^(izin|rapor)(\s+(gün|günü|günleri|toplamı))?$/i.test(name);
  return {i,name,p,absence,hidden:(!!p&&prefs.unit!=='all'&&unit(p)!==prefs.unit)||(prefs.hideAbsences&&absence)};
});
for(let ri=0;ri<rows.length;ri++){
 const tr=rows[ri];
 for(let ci=0;ci<tr.cells.length;ci++){
  const cell=tr.cells[ci];remember(cell);
  const info=cols[ci];cell.classList.toggle('sayV2HiddenCol',!!info?.hidden);
  if(ci>0){const value=Number(prefs['col'+ci]||prefs.width);cell.style.minWidth=value+'px';cell.style.width=value+'px'}
  if(ri>0){const h=Number(prefs['row'+ri]||prefs.dayHeight);cell.style.minHeight=h+'px';cell.style.height=h+'px'}
  if(ri===0||ci===0||cell.querySelector(':scope > .sayV2resize'))continue;
  cell.style.position='relative';const handle=document.createElement('span');handle.className='sayV2resize';handle.title='Köşeden sürükle: sütun genişliği ve satır yüksekliği';
  handle.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();const x=e.clientX,y=e.clientY,w=cell.offsetWidth,h=cell.offsetHeight;handle.setPointerCapture(e.pointerId);
    const move=ev=>{prefs['col'+ci]=Math.max(42,Math.min(220,Math.round(w+ev.clientX-x)));prefs['row'+ri]=Math.max(22,Math.min(110,Math.round(h+ev.clientY-y)));apply()};
    const end=()=>{handle.removeEventListener('pointermove',move);persist()};handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',end,{once:true});
  });cell.append(handle);
 }
}
}
}finally{busy=false}
}
function setup(){
const r=root();if(!r||r.querySelector('.sayV2bar'))return;
const bar=document.createElement('div');bar.className='sayV2bar';
const toggle=document.createElement('button');toggle.type='button';toggle.textContent='Saymanlık V2 Aç';toggle.onclick=()=>{enabled=!enabled;toggle.textContent=enabled?'Orijinal Saymanlığa Dön':'Saymanlık V2 Aç';if(enabled)apply();else clear()};
const filter=document.createElement('select');filter.title='Birim filtresi';
const updateUnits=()=>{const current=filter.value||prefs.unit,values=[...new Set(staff().map(unit).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'tr'));filter.replaceChildren();for(const val of ['all',...values]){const option=document.createElement('option');option.value=val;option.textContent=val==='all'?'Tüm birimler':val;filter.append(option)}filter.value=values.includes(current)?current:'all';prefs.unit=filter.value};
updateUnits();filter.onchange=()=>{prefs.unit=filter.value;persist();apply()};
const hide=document.createElement('button');hide.type='button';hide.textContent='İzin/Rapor sütunlarını '+(prefs.hideAbsences?'Göster':'Gizle');hide.onclick=()=>{prefs.hideAbsences=!prefs.hideAbsences;hide.textContent='İzin/Rapor sütunlarını '+(prefs.hideAbsences?'Göster':'Gizle');persist();apply()};
function slider(title,min,max,key){const label=document.createElement('label');label.textContent=title;const inp=document.createElement('input');inp.type='range';inp.min=min;inp.max=max;inp.value=prefs[key];inp.oninput=()=>{prefs[key]=Number(inp.value);for(const k of Object.keys(prefs))if(k.startsWith(key==='width'?'col':'row'))delete prefs[k];persist();apply()};label.append(inp);return label}
const info=document.createElement('small');info.textContent='Personeller sütunlarda · Günler satırlarda · Yalnız ekran görünümü';
bar.append(toggle,filter,hide,slider('Sütun',55,150,'width'),slider('Satır',23,65,'dayHeight'),info);r.insertBefore(bar,r.firstChild);
let pending=false;new MutationObserver(m=>{if(!enabled||pending||!m.some(x=>x.addedNodes.length||x.removedNodes.length))return;pending=true;setTimeout(()=>{pending=false;apply()},160)}).observe(r,{subtree:true,childList:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
window.addEventListener('rpys-direct-core-ready',()=>setTimeout(setup,600));
})();