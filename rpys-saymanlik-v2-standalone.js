(()=>{
'use strict';
if(window.__SAYV2_STANDALONE__)return;window.__SAYV2_STANDALONE__=true;
const css=document.createElement('style');css.textContent=`
#saymanlikV2.page{padding:14px}
#saymanlikV2 .sv2bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px;padding:11px;background:#eef5fc;border:1px solid #ccdaea;border-radius:10px}
#saymanlikV2 .sv2bar input{width:110px}
#saymanlikV2 .sv2wrap{max-width:100%;overflow:auto;max-height:69vh;border:1px solid #cad9e9;border-radius:9px;background:white}
#saymanlikV2 table{border-collapse:separate;border-spacing:0;width:max-content;min-width:100%;table-layout:auto}
#saymanlikV2 td,#saymanlikV2 th{border:1px solid #dce5ef;padding:3px 5px;box-sizing:border-box;white-space:normal;overflow-wrap:break-word}
#saymanlikV2 tr>:first-child{position:sticky;left:0;z-index:3;background:#eaf3fb}
#saymanlikV2 tr:first-child>*{position:sticky;top:0;z-index:4}
#saymanlikV2 .sv2handle{position:absolute;right:0;bottom:0;width:12px;height:12px;cursor:nwse-resize;background:#2782d5;border:1px solid white;border-radius:2px;z-index:8}
#saymanlikV2 .sv2summary{font-size:12px;margin:12px 0;color:#50627b}
#saymanlikV2 .sv2hidden{display:none!important}
#saymanlikV2 .sv2calc{background:#eef5fd!important;font-weight:700;min-width:85px}
#saymanlikV2 tr>th:first-child{min-width:175px;position:sticky;left:0;background:#eaf3fb;z-index:6}
`;document.head.append(css);
const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n};
const state={tab:1,width:94,height:29,unit:'all',hide:false,widths:{},heights:{}};
try{const s=JSON.parse(localStorage.getItem('rpys-say-v2-independent')||'{}');Object.assign(state,s)}catch(e){}
const save=()=>{try{localStorage.setItem('rpys-say-v2-independent',JSON.stringify(state))}catch(e){}};
function staff(){try{return Array.isArray(db.staff)?db.staff:[]}catch(e){return []}}
function unit(p){return String(p?.unit||p?.department||p?.birim||p?.unitName||'').trim()}
function source(){return document.querySelector(state.tab===1?'#say1Grid table':'#say2Grid table')}
let warming=false,warmAttempts=0;
function warmSource(){if(warming||source()||warmAttempts>=3)return;warmAttempts++;warming=true;const page=document.getElementById('saymanlikV2');const side=document.querySelector('.sidebar');const original=[...side?.querySelectorAll('.nav,button')||[]].find(x=>/saymanlık/i.test(x.textContent)&&!/V2/i.test(x.textContent));try{if(original)original.click();else document.getElementById('saymanlik')?.classList.add('active')}catch(e){}setTimeout(()=>{const v=document.getElementById('saymanlikV2');document.querySelectorAll('main.main > section.page').forEach(x=>x.classList.remove('active'));v?.classList.add('active');document.getElementById('rpysSayV2Nav')?.classList.add('active');warming=false;build()},550)}
function build(){
const page=document.getElementById('saymanlikV2');if(!page)return;
const holder=page.querySelector('.sv2wrap');if(!holder)return;
const src=source();holder.replaceChildren();if(!src){holder.textContent=warmAttempts>=3?'Kaynak Saymanlık tablosu oluşturulamadı. Ana Saymanlık ekranındaki SAY1/SAY2 yüklemesi kontrol edilmeli.':'Saymanlık kayıtları hazırlanıyor…';warmSource();return}

const rows=[...src.rows],header=rows.find(r=>r.cells.length>4&&/TARİH|TARIH/i.test(r.cells[0]?.textContent||''))||rows.find(r=>r.cells.length>4);
if(!header){holder.textContent='Personel başlıkları bulunamadı.';return}
const heads=[...header.cells].map(c=>c.textContent.trim().replace(/\s+/g,' '));
const norm=s=>String(s||'').toLocaleUpperCase('tr-TR').replace(/\s+/g,' ').trim();
const people=staff();
const persons=heads.map((name,ci)=>({name,ci,p:people.find(p=>norm(p.name)===norm(name))})).filter(x=>x.ci>0&&x.name&&(!state.unit||state.unit==='all'||unit(x.p)===state.unit));
const dates=rows.slice(rows.indexOf(header)+1).filter(r=>/^\s*\d{1,2}\s*[/.]\s*\d{1,2}/.test(r.cells[0]?.textContent||''));
if(!dates.length){holder.textContent='Gün satırları bulunamadı.';return}
const table=el('table'),top=el('tr');top.append(el('th','PERSONEL'));
dates.forEach(r=>top.append(el('th',r.cells[0].textContent.trim().split(' ')[0])));
const summaries=['İzin Günü','Rapor Günü','Mükellef','Pol Çalışma','Acil Çalışma','Toplam Çalışma','Toplam FM'];
summaries.forEach(s=>{const th=el('th',s);th.className='sv2calc';top.append(th)});table.append(top);
for(const item of persons){
 const row=el('tr');row.append(el('th',item.name));let leave=0,report=0,total=0;
 dates.forEach(sourceRow=>{
  const srcCell=sourceRow.cells[item.ci],cell=el('td');
  if(srcCell){
   const content=srcCell.textContent.trim();cell.textContent=content;
   const computed=getComputedStyle(srcCell);cell.style.backgroundColor=computed.backgroundColor;cell.style.color=computed.color;
   const normText=norm(content);
   if(!/REZERV/.test(normText)){if(/RAPOR/.test(normText))report++;else if(/İZİN|IZIN/.test(normText))leave++}
   for(const match of content.matchAll(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/g)){
    let minutes=Number(match[3])*60+Number(match[4])-Number(match[1])*60-Number(match[2]);if(minutes<0)minutes+=1440;total+=minutes/60;
   }
  }
  row.append(cell);
 });
 [leave,report,'—','—','—',total?Math.round(total*10)/10:'—','—'].forEach(n=>{const cell=el('td',String(n));cell.className='sv2calc';row.append(cell)});
 table.append(row);
}
holder.append(table);
for(const [ri,tr] of [...table.rows].entries())for(const [ci,cell] of [...tr.cells].entries()){
 if(ci>0){const width=Number(state.widths[ci]||state.width);cell.style.width=width+'px';cell.style.minWidth=width+'px'}
 if(ri>0)cell.style.height=Number(state.heights[ri]||state.height)+'px';
 if(state.hide&&(ci===dates.length+1||ci===dates.length+2))cell.classList.add('sv2hidden');
 if(ri===0||ci===0)continue;
 cell.style.position='relative';const grip=el('span');grip.className='sv2handle';grip.title='Satır ve sütun boyutunu sürükleyerek ayarla';
 grip.addEventListener('pointerdown',e=>{
  e.preventDefault();e.stopPropagation();const x=e.clientX,y=e.clientY,w=cell.offsetWidth,h=cell.offsetHeight;grip.setPointerCapture(e.pointerId);
  const move=v=>{state.widths[ci]=Math.max(45,Math.min(220,w+v.clientX-x));state.heights[ri]=Math.max(24,Math.min(120,h+v.clientY-y));[...table.rows].forEach(r=>{if(r.cells[ci]){r.cells[ci].style.width=state.widths[ci]+'px';r.cells[ci].style.minWidth=state.widths[ci]+'px'}});[...tr.cells].forEach(c=>c.style.height=state.heights[ri]+'px')};
  const end=()=>{grip.removeEventListener('pointermove',move);save()};grip.addEventListener('pointermove',move);grip.addEventListener('pointerup',end,{once:true});
 });cell.append(grip);
}
page.querySelector('.sv2summary').textContent='Toplam birim mükellefi ve fazla mesai: kaynak hesap bağlantısı henüz doğrulanmadı · '+persons.length+' personel / '+dates.length+' gün · Rezerveler izin ve rapor sayısına eklenmez.';

}
function install(){
const main=document.querySelector('main.main'),side=document.querySelector('.sidebar');if(!main||!side)return false;
if(document.getElementById('saymanlikV2'))return true;
const page=el('section');page.id='saymanlikV2';page.className='page';
page.innerHTML='<h2>Saymanlık V2</h2><p style="font-size:12px;color:#63758b">Orijinal Saymanlıktan bağımsız görünüm. Değişiklikler ortak kaynak veriden okunur; görev düzenleme orijinal Saymanlık ekranındadır.</p><div class="sv2bar"></div><div class="sv2wrap"></div><div class="sv2summary"></div><div style="display:flex;justify-content:space-around;margin:30px 0;text-align:center;gap:15px"><div>Hazırlayan<br>Ad Soyad / İmza</div><div>Kontrol Eden<br>Ad Soyad / İmza</div><div>Onaylayan<br>Ad Soyad / İmza</div></div>';main.append(page);
const bar=page.querySelector('.sv2bar');
const tabs=el('select');[['1','SAY1'],['2','SAY2']].forEach(([v,l])=>{const o=el('option',l);o.value=v;tabs.append(o)});tabs.value=String(state.tab);tabs.onchange=()=>{state.tab=Number(tabs.value);save();build()};
const units=el('select');const refreshUnits=()=>{const all=[...new Set(staff().map(unit).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'tr'));units.replaceChildren();for(const name of ['all',...all]){const o=el('option',name==='all'?'Tüm birimler':name);o.value=name;units.append(o)}units.value=all.includes(state.unit)?state.unit:'all';state.unit=units.value};refreshUnits();units.onchange=()=>{state.unit=units.value;save();build()};
const hide=el('button','İzin/Rapor sütunları: '+(state.hide?'Gizli':'Açık'));hide.onclick=()=>{state.hide=!state.hide;hide.textContent='İzin/Rapor sütunları: '+(state.hide?'Gizli':'Açık');save();build()};
const refresh=el('button','↻ Verileri Yenile');refresh.onclick=()=>{refreshUnits();build()};
const back=el('button','Orijinal Saymanlıkta Düzenle');back.onclick=()=>{const original=[...side.querySelectorAll('button,.nav')].find(x=>/saymanlık/i.test(x.textContent)&&!/V2/i.test(x.textContent));if(original)original.click();else{page.classList.remove('active');document.getElementById('saymanlik')?.classList.add('active')}};
for(const [label,key,min,max] of [['Sütun genişliği','width',50,160],['Satır yüksekliği','height',22,75]]){const wrap=el('label',label+' '),input=el('input');input.type='range';input.min=min;input.max=max;input.value=state[key];input.oninput=()=>{state[key]=Number(input.value);state[key==='width'?'widths':'heights']={};save();build()};wrap.append(input);bar.append(wrap)}
bar.prepend(tabs,units,hide,refresh,back);
const native=[...side.querySelectorAll('.nav,button')].find(x=>/saymanlık/i.test(x.textContent)&&!/V2/i.test(x.textContent));const nav=el('button','▦ Saymanlık V2');nav.type='button';nav.className=native?.className||'nav';nav.id='rpysSayV2Nav';nav.onclick=()=>{document.querySelectorAll('main.main > section.page').forEach(x=>x.classList.remove('active'));page.classList.add('active');side.querySelectorAll('.nav').forEach(x=>x.classList.remove('active'));nav.classList.add('active');document.body.classList.remove('rpysMobileMenuOpen');refreshUnits();build()};
if(native)native.after(nav);else side.append(nav);
return true;
}
let attempts=0;const timer=setInterval(()=>{if(install()||++attempts>40)clearInterval(timer)},500);
window.addEventListener('rpys-direct-core-ready',()=>setTimeout(install,500));
})();