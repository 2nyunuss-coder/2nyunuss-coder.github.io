(()=>{
if(window.__sayV2Loaded)return;window.__sayV2Loaded=true;
const S={on:false,hide:false,width:62,heights:{},widths:{}};
try{Object.assign(S,JSON.parse(localStorage.getItem('rpys-say-v2-pref')||'{}'));S.on=false}catch(e){}
const save=()=>{try{localStorage.setItem('rpys-say-v2-pref',JSON.stringify({...S,on:false}))}catch(e){}};
const style=document.createElement('style');style.textContent='@media screen{#saymanlik.sayV2 #say1Grid,#saymanlik.sayV2 #say2Grid{max-width:100%!important;overflow:auto!important}#saymanlik.sayV2 #say1Grid table,#saymanlik.sayV2 #say2Grid table{width:max-content!important;min-width:100%!important}#saymanlik.sayV2 #say1Grid tr>:first-child,#saymanlik.sayV2 #say2Grid tr>:first-child{position:sticky;left:0;z-index:4;background:#f3f8ff}#saymanlik .sayV2bar{display:flex;gap:8px;flex-wrap:wrap;padding:8px;background:#edf5ff;border-radius:9px;margin:8px 0}#saymanlik.sayV2 .sayV2Hidden{display:none!important}#saymanlik .sayV2handle{position:absolute;right:0;bottom:0;width:10px;height:10px;cursor:nwse-resize;background:#3b82f6;opacity:.55;z-index:5}}';document.head.appendChild(style);
const tables=()=>[...document.querySelectorAll('#say1Grid table,#say2Grid table')];
function apply(){const root=document.getElementById('saymanlik');if(!root)return;root.classList.toggle('sayV2',S.on);if(!S.on){tables().forEach(table=>{[...table.rows].forEach(tr=>{tr.style.removeProperty('height');[...tr.cells].forEach(cell=>{cell.style.removeProperty('min-width');cell.style.removeProperty('position');cell.classList.remove('sayV2Hidden');cell.querySelectorAll('.sayV2handle').forEach(h=>h.remove())})})});return;}
tables().forEach((table,t)=>{[...table.rows].forEach((tr,r)=>{const rk=t+':'+r;if(S.heights[rk])tr.style.height=S.heights[rk]+'px';[...tr.cells].forEach((cell,c)=>{
if(c>0)cell.style.minWidth=(S.widths[t+':'+c]||S.width)+'px';
const head=(table.rows[0]?.cells[c]?.textContent||'').trim().toLocaleLowerCase('tr-TR').replace(/\s+/g,' ');
cell.classList.toggle('sayV2Hidden',S.hide&&/^(izin günü|izin günleri|rapor günü|rapor günleri|izin toplamı|rapor toplamı)$/.test(head));
if(!r||!cell.matches('td')||cell.querySelector('.sayV2handle'))return;
cell.style.position='relative';const handle=document.createElement('span');handle.className='sayV2handle';handle.title='Satır yüksekliği ve sütun genişliği';
handle.onpointerdown=e=>{e.preventDefault();e.stopPropagation();const x=e.clientX,y=e.clientY,w=cell.offsetWidth,h=tr.offsetHeight;handle.setPointerCapture(e.pointerId);
handle.onpointermove=a=>{S.heights[rk]=Math.max(28,Math.min(160,h+a.clientY-y));S.widths[t+':'+c]=Math.max(36,Math.min(200,w+a.clientX-x));tr.style.height=S.heights[rk]+'px';[...table.rows].forEach(z=>{if(z.cells[c])z.cells[c].style.minWidth=S.widths[t+':'+c]+'px'})};
handle.onpointerup=()=>{handle.onpointermove=null;save()};};cell.appendChild(handle);
})})})}
function install(){const root=document.getElementById('saymanlik');if(!root||root.querySelector('.sayV2bar'))return;const bar=document.createElement('div');bar.className='sayV2bar';
const toggle=document.createElement('button');toggle.textContent='Saymanlık V2 Aç';toggle.onclick=()=>{S.on=!S.on;toggle.textContent=S.on?'Orijinal Saymanlığa Dön':'Saymanlık V2 Aç';apply()};
const hide=document.createElement('button');hide.textContent='İzin/Rapor Özetini Gizle';hide.onclick=()=>{S.hide=!S.hide;hide.textContent=S.hide?'İzin/Rapor Özetini Göster':'İzin/Rapor Özetini Gizle';save();apply()};
const slider=document.createElement('input');slider.type='range';slider.min=36;slider.max=130;slider.value=S.width;slider.oninput=()=>{S.width=+slider.value;S.widths={};apply();save()};
const label=document.createElement('label');label.textContent='Hücre genişliği ';label.append(slider);const note=document.createElement('small');note.textContent='Aynı canlı veriler · Yalnız ekran görünümü · PDF değişmez';
bar.append(toggle,hide,label,note);root.insertBefore(bar,root.firstChild);
let pending=false;new MutationObserver(()=>{if(pending||!S.on)return;pending=true;setTimeout(()=>{pending=false;apply()},140)}).observe(root,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();window.addEventListener('rpys-direct-core-ready',()=>setTimeout(install,800));
})();