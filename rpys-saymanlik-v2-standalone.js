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
const table=src.cloneNode(true);table.id='saymanlikV2ReadOnlyTable';table.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));table.querySelectorAll('button,input,select,textarea,.sayV2handle,.sayV2resize').forEach(x=>x.remove());table.querySelectorAll('[contenteditable]').forEach(x=>x.removeAttribute('contenteditable'));holder.append(table);
const people=staff(),names=people.map(p=>({p,n:String(p.name||'').trim().toLocaleUpperCase('tr-TR')}));
const header=[...table.rows].find(r=>r.cells.length>4);const colData=header?[...header.cells].map(c=>{const s=c.textContent.trim().replace(/\s+/g,' ').toLocaleUpperCase('tr-TR');return names.find(n=>n.n===s)?.p||null}):[];
for(const [r,tr] of [...table.rows].entries()){
  for(const [c,cell] of [...tr.cells].entries()){
    const p=colData[c],isAbsence=/^(izin|rapor)(?:\s+(?:gün|günü|günleri|toplamı))?$/i.test(header?.cells[c]?.textContent?.trim()||'');
    cell.classList.toggle('sv2hidden',!!((p&&state.unit!=='all'&&unit(p)!==state.unit)||(state.hide&&isAbsence)));
    const width=Number(state.widths[c]||state.width);
    if(c>0){cell.style.width=width+'px';cell.style.minWidth=width+'px'}
    if(r>0){cell.style.height=Number(state.heights[r]||state.height)+'px'}
    if(r===0||c===0)continue;
    cell.style.position='relative';
    const grip=el('span');grip.className='sv2handle';grip.title='Köşeden sürükleyerek genişlik ve yüksekliği ayarla';
    grip.addEventListener('pointerdown',e=>{
      e.preventDefault();e.stopPropagation();const x=e.clientX,y=e.clientY,w=cell.offsetWidth,h=cell.offsetHeight;grip.setPointerCapture(e.pointerId);
      const move=v=>{state.widths[c]=Math.max(45,Math.min(240,w+v.clientX-x));state.heights[r]=Math.max(22,Math.min(125,h+v.clientY-y));[...table.rows].forEach(row=>{if(row.cells[c]){row.cells[c].style.width=state.widths[c]+'px';row.cells[c].style.minWidth=state.widths[c]+'px'}});[...tr.cells].forEach(td=>td.style.height=state.heights[r]+'px')};
      const end=()=>{grip.removeEventListener('pointermove',move);save()};grip.addEventListener('pointermove',move);grip.addEventListener('pointerup',end,{once:true});
    });cell.append(grip);
  }
}
page.querySelector('.sv2summary').textContent='Kaynak: Saymanlık '+(state.tab===1?'SAY1':'SAY2')+' · Aynı canlı tablodan yenilenir · Orijinal Saymanlık ve PDF değişmez.';
}
function install(){
const main=document.querySelector('main.main'),side=document.querySelector('.sidebar');if(!main||!side)return false;
if(document.getElementById('saymanlikV2'))return true;
const page=el('section');page.id='saymanlikV2';page.className='page';
page.innerHTML='<h2>Saymanlık V2</h2><p style="font-size:12px;color:#63758b">Orijinal Saymanlıktan bağımsız görünüm. Değişiklikler ortak kaynak veriden okunur; görev düzenleme orijinal Saymanlık ekranındadır.</p><div class="sv2bar"></div><div class="sv2wrap"></div><div class="sv2summary"></div>';main.append(page);
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