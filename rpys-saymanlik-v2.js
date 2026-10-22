(()=>{
if(window.__sayV2Loaded)return;window.__sayV2Loaded=true;
const S={on:false,hide:false,width:62,heights:{},widths:{},unit:'all'};
try{Object.assign(S,JSON.parse(localStorage.getItem('rpys-say-v2-pref')||'{}'));S.on=false}catch(e){}
const save=()=>{try{localStorage.setItem('rpys-say-v2-pref',JSON.stringify({...S,on:false}))}catch(e){}};
const style=document.createElement('style');style.textContent='@media screen{#saymanlik.sayV2 #say1Grid,#saymanlik.sayV2 #say2Grid{max-width:100%!important;overflow:auto!important}#saymanlik.sayV2 #say1Grid table,#saymanlik.sayV2 #say2Grid table{width:max-content!important;min-width:100%!important}#saymanlik.sayV2 #say1Grid tr>:first-child,#saymanlik.sayV2 #say2Grid tr>:first-child{position:sticky;left:0;z-index:4;background:#f3f8ff}#saymanlik .sayV2bar{display:flex;gap:8px;flex-wrap:wrap;padding:8px;background:#edf5ff;border-radius:9px;margin:8px 0}#saymanlik.sayV2 .sayV2Hidden{display:none!important}#saymanlik .sayV2handle{position:absolute;right:0;bottom:0;width:10px;height:10px;cursor:nwse-resize;background:#3b82f6;opacity:.55;z-index:5}}';document.head.appendChild(style);
const tables=()=>[...document.querySelectorAll('#say1Grid table,#say2Grid table')];
function unitOf(p){return String(p?.unit||p?.department||p?.birim||p?.unitName||p?.departmentName||'').trim()}
function personForRow(tr){const name=(tr.cells[0]?.textContent||'').trim().replace(/↕/g,'');try{return (db.staff||[]).find(p=>String(p.name||'').trim()===name)}catch(e){return null}}
function statusFor(name,day){try{return typeof getCellStatus==='function'?String(getCellStatus(name,day)||'').toLocaleLowerCase('tr-TR'):''}catch(e){return ''}}
function reserveSummary(){
 const node=document.querySelector('#saymanlik .sayV2ReserveSummary');if(!node)return;
 try{
  const month=typeof ym==='function'?ym():'';if(!/^\d{4}-\d{2}$/.test(month)){node.textContent='Ay bilgisi okunamadı.';return}
  const days=new Date(Number(month.slice(0,4)),Number(month.slice(5,7)),0).getDate();
  const all=Array.isArray(db?.staff)?db.staff:[],staff=all.filter(p=>S.unit==='all'||unitOf(p)===S.unit);
  let izin=0,rapor=0,rezerv=0,unknown=0;
  for(const p of staff)for(let d=1;d<=days;d++){
   const date=month+'-'+String(d).padStart(2,'0');
   const leaves=(db.leaves||[]).filter(l=>String(l.personId)===String(p.id)&&l.start<=date&&l.end>=date);
   let state=leaves.map(l=>String(l.type||'')+' '+String(l.status||'')).join(' ').toLocaleLowerCase('tr-TR');
   try{const s=typeof getCellStatus==='function'?getCellStatus(p.name,d):'';state+=' '+String(s||'').toLocaleLowerCase('tr-TR')}catch(e){}
   if(/rezerv/.test(state)){rezerv++;continue}
   if(/rapor/.test(state)){rapor++;continue}
   if(/izin|yıllık|yillik/.test(state)){izin++;continue}
  }
  node.textContent='V2 kayıt kontrolü — İzin: '+izin+' gün · Rapor: '+rapor+' gün · Rezerv: '+rezerv+' gün (izin/rapora katılmaz). Yalnız tanınan statüler ve kayıtlı ay.';
 }catch(e){node.textContent='Rezerv kontrolü yapılamadı: '+String(e.message||e)}
}
function apply(){const root=document.getElementById('saymanlik');if(!root)return;root.classList.toggle('sayV2',S.on);if(!S.on){tables().forEach(table=>{[...table.rows].forEach(tr=>{tr.style.removeProperty('height');tr.style.removeProperty('display');[...tr.cells].forEach(cell=>{cell.style.removeProperty('min-width');cell.style.removeProperty('position');cell.classList.remove('sayV2Hidden');cell.querySelectorAll('.sayV2handle').forEach(h=>h.remove())})})});return;}
reserveSummary();tables().forEach((table,t)=>{[...table.rows].forEach((tr,r)=>{const rk=t+':'+r;const person=r?personForRow(tr):null;const unit=person?unitOf(person):'';tr.style.display=S.unit==='all'||!person||unit===S.unit?'':'none';if(S.heights[rk])tr.style.height=S.heights[rk]+'px';[...tr.cells].forEach((cell,c)=>{
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
const label=document.createElement('label');label.textContent='Hücre genişliği ';label.append(slider);const unitSelect=document.createElement('select');unitSelect.setAttribute('aria-label','Birim personel filtresi');const refreshUnits=()=>{let units=[];try{units=[...new Set((db.staff||[]).map(unitOf).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'tr'))}catch(e){}unitSelect.innerHTML='';for(const val of ['all',...units]){const option=document.createElement('option');option.value=val;option.textContent=val==='all'?'Tüm birimler':val;unitSelect.append(option)}unitSelect.value=units.includes(S.unit)?S.unit:'all'};refreshUnits();unitSelect.onchange=()=>{S.unit=unitSelect.value;save();apply()};const note=document.createElement('small');note.textContent='Aynı canlı veriler · Yalnız ekran görünümü · PDF değişmez';
bar.append(toggle,hide,unitSelect,label,note);const reservation=document.createElement('div');reservation.className='sayV2ReserveSummary';reservation.style.cssText='font-size:12px;padding:6px 10px;color:#35516f;background:#f4f8fe;border-radius:8px;margin:4px 0';root.insertBefore(bar,root.firstChild);bar.after(reservation);
let pending=false;new MutationObserver(()=>{if(pending||!S.on)return;pending=true;setTimeout(()=>{pending=false;apply()},140)}).observe(root,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();window.addEventListener('rpys-direct-core-ready',()=>setTimeout(install,800));
})();