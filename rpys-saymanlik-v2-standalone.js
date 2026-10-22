(()=>{
'use strict';
if(window.__SAYV2_STANDALONE__)return;window.__SAYV2_STANDALONE__=true;
const css=document.createElement('style');css.textContent=`
#saymanlikV2.page{padding:14px}
#saymanlikV2 .sv2bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px;padding:11px;background:#eef5fc;border:1px solid #ccdaea;border-radius:10px}
#saymanlikV2 .sv2bar input{width:110px}
#saymanlikV2 .sv2wrap{max-width:100%;overflow:auto;max-height:72vh;border:1px solid #cad9e9;border-radius:9px;background:white}
#saymanlikV2 table{border-collapse:separate;border-spacing:0;width:max-content;min-width:100%;table-layout:auto}
#saymanlikV2 td,#saymanlikV2 th{border:1px solid #dce5ef;padding:6px 7px;font-size:12px;line-height:1.25;box-sizing:border-box;white-space:normal;overflow-wrap:break-word}
#saymanlikV2 tr>:first-child{position:sticky;left:0;z-index:3;background:#eaf3fb}
#saymanlikV2 tr:first-child>*{position:sticky;top:0;z-index:4}
#saymanlikV2 .sv2handle{position:absolute;right:0;bottom:0;width:12px;height:12px;cursor:nwse-resize;background:#2782d5;border:1px solid white;border-radius:2px;z-index:8}
#saymanlikV2 .sv2summary{font-size:12px;margin:12px 0;color:#50627b}
#saymanlikV2 .sv2hidden{display:none!important}
#saymanlikV2 td.sv2day{padding:3px 2px!important;text-align:center;vertical-align:middle;font-size:10px!important;line-height:1.15!important;white-space:normal!important}
#saymanlikV2 .sv2time{display:block;font-size:9px!important;font-weight:650;letter-spacing:-.15px;line-height:1.15;white-space:nowrap}
#saymanlikV2 .sv2text{display:block;font-size:9px!important;line-height:1.15;font-weight:650;overflow-wrap:anywhere}
#saymanlikV2 td.sv2day.sv2empty{color:transparent!important}
#saymanlikV2 .sv2calc{font-size:10px!important;text-align:center}
#saymanlikV2 .sv2bar select,#saymanlikV2 .sv2bar button{font-size:12px}
#saymanlikV2 .sv2calc{background:#eef5fd!important;font-weight:700;min-width:85px}\n#saymanlikV2 table tr:nth-child(even)>td:not(.sv2calc){box-shadow:inset 0 0 0 999px rgba(238,245,253,.07)}\n#saymanlikV2 tr:first-child th{white-space:nowrap;font-size:11px;background:#e6f0fb;z-index:5}\n#saymanlikV2 .sv2summary{padding:10px;background:#f4f8fc;border-radius:8px}
#saymanlikV2 tr>th:first-child{min-width:175px;position:sticky;left:0;background:#eaf3fb;z-index:6}

#saymanlikV2{background:#eef4fb!important;color:#17365d!important}
#saymanlikV2 .sv2bar{background:white!important;border:1px solid #d9e5f2!important;padding:12px!important}
#saymanlikV2 .sv2cards{display:grid;grid-template-columns:repeat(6,minmax(120px,1fr));gap:10px;margin:10px 0 14px}
#saymanlikV2 .sv2card{padding:12px 14px;background:white;border:1px solid #dce6f0;border-radius:12px;box-shadow:0 3px 10px #17365d0a}
#saymanlikV2 .sv2card small{display:block;color:#64748b;font-size:11px}
#saymanlikV2 .sv2card b{font-size:20px;color:#163b6b}
#saymanlikV2 .sv2wrap{background:white!important;max-height:66vh!important}
#saymanlikV2 .sv2wrap table{border-collapse:separate;border-spacing:0}
#saymanlikV2 .sv2wrap th{font-size:11px!important;color:#153c68!important}
#saymanlikV2 .sv2wrap td,#saymanlikV2 .sv2wrap th{border:1px solid #e2eaf4!important;padding:2px 4px!important;text-align:center}
#saymanlikV2 .sv2wrap tr>th:first-child{text-align:left!important;min-width:170px!important;font-weight:750}
#saymanlikV2 .sv2day{font-size:10px!important;vertical-align:middle!important}
#saymanlikV2 .sv2time{font-size:10px!important;font-weight:800;line-height:1.15}
#saymanlikV2 .sv2text{font-size:9px!important;line-height:1.1}
#saymanlikV2 .sv2short{display:block;font-size:12px;font-weight:850;line-height:1.1}
#saymanlikV2 .sv2shortHour{display:block;font-size:9px;line-height:1.1;margin-top:3px;font-weight:650}
#saymanlikV2 td.sv2empty{background:#fbfdff!important;color:#94a3b8!important}
#saymanlikV2 .sv2calc{background:#f2f7ff!important;font-size:11px!important}
#saymanlikV2 .sv2summary{background:white!important;border:1px solid #dce6f0;margin-top:10px!important}
#saymanlikV2 .sv2wrap{overscroll-behavior:contain}
#saymanlikV2 .sv2wrap th,#saymanlikV2 .sv2wrap td{font-variant-numeric:tabular-nums}
#saymanlikV2 .sv2wrap td.sv2day{min-width:42px}
#saymanlikV2 .sv2bar button{border:1px solid #cbd9e8;border-radius:7px;padding:7px 10px;background:#f8fbff;color:#17365d;cursor:pointer}
#saymanlikV2 .sv2bar button:hover{background:#e6f0fc}
#saymanlikV2 .sv2handle{opacity:.22;touch-action:none}
#saymanlikV2 td:hover .sv2handle{opacity:1}
#saymanlikV2 .sv2heading{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px}
#saymanlikV2 .sv2heading h2{margin:0;font-size:20px}
#saymanlikV2 .sv2heading small{color:#64748b}
#saymanlikV2 .sv2formula{background:#fff;border:1px solid #dce6f0;padding:9px 12px;border-radius:8px;margin-bottom:9px;font-size:12px;color:#35506e;min-height:36px}
#saymanlikV2 .sv2group th{position:static!important;text-align:left!important;background:#dfeafa!important;color:#163b6b!important;font-size:12px!important;padding:8px 12px!important;cursor:pointer}
#saymanlikV2 .sv2selected{outline:2px solid #1674dc!important;outline-offset:-2px;z-index:2!important}
#saymanlikV2 .sv2legend{display:flex;gap:12px;flex-wrap:wrap;font-size:11px;color:#58708a;margin-top:9px}
#saymanlikV2 .sv2bar input[type=search]{width:175px;max-width:100%;border:1px solid #cbd9e8;border-radius:7px;padding:7px}
#saymanlikV2 .sv2wrap .sv2day .sv2short{font-size:10px!important}
#saymanlikV2 .sv2handle{width:7px;height:7px;border:0;border-radius:1px;right:0;bottom:0;opacity:0}
#saymanlikV2 .sv2selected .sv2handle{opacity:.8}
#saymanlikV2.page{width:100%!important;max-width:none!important;min-height:calc(100dvh - 125px)!important;padding:8px!important}
#saymanlikV2 .sv2wrap{width:100%!important;max-height:calc(100dvh - 305px)!important;min-height:360px;overflow:auto!important}
#saymanlikV2 .sv2cards{margin:5px 0 7px!important;gap:5px!important}
#saymanlikV2 .sv2card{padding:6px 10px!important}
#saymanlikV2 .sv2card b{font-size:15px!important}
#saymanlikV2 .sv2bar{padding:6px!important;margin-bottom:6px!important;gap:5px!important}
#saymanlikV2 .sv2wrap td.sv2day{padding:2px 3px!important}
#saymanlikV2 .sv2short{font-size:14px!important;font-weight:800!important;line-height:1.12!important}
#saymanlikV2 .sv2shortHour{font-size:9px!important;line-height:1.1!important;margin-top:2px!important;white-space:normal!important;overflow-wrap:anywhere}
#saymanlikV2 .sv2wrap tr>th:first-child{min-width:155px!important;max-width:200px;white-space:normal!important}
#saymanlikV2 .sv2heading{margin-bottom:3px}
@media(max-width:1000px){#saymanlikV2 .sv2cards{grid-template-columns:repeat(3,1fr)}}
@media(max-width:650px){#saymanlikV2 .sv2cards{grid-template-columns:repeat(2,minmax(0,1fr))}#saymanlikV2 .sv2bar{align-items:stretch}#saymanlikV2 .sv2bar select,#saymanlikV2 .sv2bar button{min-height:36px}}
`;document.head.append(css);
const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n};
const state={tab:1,width:66,height:38,period:1,unit:'all',hide:false,group:false,search:'',collapsed:{},widths:{},heights:{}};
try{const s=JSON.parse(localStorage.getItem('rpys-say-v2-independent')||'{}');Object.assign(state,s)}catch(e){}
// V10: gruplama ilk açılışta kapalıdır; kullanıcı dilediğinde açabilir.
if(!state.groupChoiceV10){state.group=false;state.groupChoiceV10=true}
const save=()=>{try{localStorage.setItem('rpys-say-v2-independent',JSON.stringify(state))}catch(e){}};
function staff(){try{return Array.isArray(db.staff)?db.staff:[]}catch(e){return []}}
function month(){try{return typeof ym==='function'?ym():''}catch{return ''}}
function memberships(){
 const map=new Map(),mk=month();try{for(const [key,ids] of Object.entries(db.unitPools||{})){
  if(!mk||!key.startsWith(mk+'|')||!Array.isArray(ids))continue;
  const name=key.slice(mk.length+1);for(const pid of ids){const id=String(pid);if(!map.has(id))map.set(id,name)}
 }}catch(e){}return map;
}
function unit(p,membership){return (p&&membership?.get(String(p.id)))||String(p?.unit||p?.department||p?.birim||p?.unitName||p?.departmentName||'').trim()}
function shiftTimes(p,dateCell){
 if(!p)return '';
 const match=String(dateCell||'').match(/^(\d{1,2})\s*[/.]\s*(\d{1,2})/),mk=month();if(!match||!mk)return '';
 const day=Number(match[1]),shifts=[];
 try{for(const [key,pid] of Object.entries(db.assign||{})){
  const parts=key.split('|');if(parts[0]!==mk||Number(parts[2])!==day||String(pid)!==String(p.id))continue;
  const meta=db.assignmentMeta?.[key]||{},base=typeof dutyColumnByKey==='function'?dutyColumnByKey(parts[1],parts.slice(3).join('|')):null;
  const value=String(meta.shift||base?.shift||'');const t=value.match(/\d{1,2}[:.]\d{2}\s*[-–]\s*\d{1,2}[:.]\d{2}/)?.[0];if(t&&!shifts.includes(t))shifts.push(t);
 }}catch(e){}return shifts.join(' / ');
}
function source(){
 const host=document.querySelector(state.tab===1?'#say1Grid':'#say2Grid'),table=host?.querySelector('table');if(!table)return null;
 const rows=[...table.rows];
 const header=rows.find(r=>r.cells.length>4&&/TARİH|TARIH/i.test(r.cells[0]?.textContent||''))||rows.find(r=>r.cells.length>4);
 const hasDates=rows.some(r=>/^\s*\d{1,2}\s*[/.]\s*\d{1,2}/.test(r.cells[0]?.textContent||''));
 return header&&hasDates?table:null;
}
let warming=false,warmAttempts=0;
function warmSource(){if(warming||source()||warmAttempts>=8)return;warmAttempts++;warming=true;const side=document.querySelector('.sidebar');const original=[...side?.querySelectorAll('.nav,button')||[]].find(x=>/saymanlık/i.test(x.textContent)&&!/V2/i.test(x.textContent));try{if(original)original.click();else document.getElementById('saymanlik')?.classList.add('active')}catch(e){}setTimeout(()=>{const v=document.getElementById('saymanlikV2');document.querySelectorAll('main.main > section.page').forEach(x=>x.classList.remove('active'));v?.classList.add('active');document.getElementById('rpysSayV2Nav')?.classList.add('active');warming=false;build()},900)}
function build(){
const page=document.getElementById('saymanlikV2');if(!page)return;
const holder=page.querySelector('.sv2wrap');if(!holder)return;
const src=source();holder.replaceChildren();if(!src){holder.textContent=warmAttempts>=8?'Ana Saymanlık henüz hazır değil. Önce Saymanlık SAY1/SAY2 sekmesini açıp ardından V2 içindeki Verileri Yenile düğmesine bas.':'Saymanlık kayıtları yükleniyor… ('+(warmAttempts+1)+'/8)';warmSource();return}

const rows=[...src.rows],header=rows.find(r=>r.cells.length>4&&/TARİH|TARIH/i.test(r.cells[0]?.textContent||''))||rows.find(r=>r.cells.length>4);
if(!header){holder.textContent='Personel başlıkları bulunamadı.';return}
const heads=[...header.cells].map(c=>c.textContent.trim().replace(/\s+/g,' '));
const norm=s=>String(s||'').toLocaleUpperCase('tr-TR').replace(/\s+/g,' ').trim();
const people=staff();
const membership=memberships();
const persons=heads.map((name,ci)=>({name,ci,p:people.find(p=>norm(p.name)===norm(name))})).filter(x=>x.ci>0&&x.name&&(!state.unit||state.unit==='all'||(x.p&&unit(x.p,membership)===state.unit))&&norm(x.name).includes(norm(state.search)));
const allDates=rows.slice(rows.indexOf(header)+1).filter(r=>/^\s*\d{1,2}\s*[/.]\s*\d{1,2}/.test(r.cells[0]?.textContent||''));const dates=state.period===0?allDates:allDates.slice(state.period===1?0:15,state.period===1?15:31);
if(!dates.length){holder.textContent='Gün satırları bulunamadı.';return}
const table=el('table'),top=el('tr');top.append(el('th','PERSONEL'));
dates.forEach(r=>top.append(el('th',r.cells[0].textContent.trim().split(' ')[0])));
const summaries=['İzin Günü','Rapor Günü','Mükellef','Pol Çalışma','Acil Çalışma','Toplam Çalışma','Toplam FM'];
summaries.forEach(s=>{const th=el('th',s);th.className='sv2calc';top.append(th)});table.append(top);
let sumLeave=0,sumReport=0,sumHours=0;
const ordered=state.group?[...persons].sort((a,b)=>(unit(a.p,membership)||'Atanmamış').localeCompare(unit(b.p,membership)||'Atanmamış','tr')||a.ci-b.ci):persons;
let lastGroup='';
for(const item of ordered){
 const group=unit(item.p,membership)||'Atanmamış';
 if(state.group&&group!==lastGroup){lastGroup=group;const g=el('tr');g.className='sv2group';const label=el('th',(state.collapsed[group]?'▸ ':'▾ ')+group+' ('+ordered.filter(x=>(unit(x.p,membership)||'Atanmamış')===group).length+')');label.colSpan=dates.length+summaries.length+1;label.title='Grubu aç/kapat';label.addEventListener('click',()=>{state.collapsed[group]=!state.collapsed[group];save();build()});g.append(label);table.append(g)}
 if(state.group&&state.collapsed[group]){
  for(const sourceRow of allDates){const content=sourceRow.cells[item.ci]?.textContent.trim()||'',n=norm(content);if(!/REZERV/.test(n)){if(/RAPOR/.test(n))sumReport++;else if(/İZİN|IZIN/.test(n))sumLeave++}for(const m of content.matchAll(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/g)){let t=Number(m[3])*60+Number(m[4])-Number(m[1])*60-Number(m[2]);if(t<0)t+=1440;sumHours+=t/60}}
  continue;
 }
 const row=el('tr');row.append(el('th',item.name));let leave=0,report=0,total=0;
 for(const sourceRow of allDates){const srcCell=sourceRow.cells[item.ci];if(!srcCell)continue;const content=srcCell.textContent.trim(),normText=norm(content);if(!/REZERV/.test(normText)){if(/RAPOR/.test(normText))report++;else if(/İZİN|IZIN/.test(normText))leave++}for(const match of content.matchAll(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/g)){let minutes=Number(match[3])*60+Number(match[4])-Number(match[1])*60-Number(match[2]);if(minutes<0)minutes+=1440;total+=minutes/60}}

 dates.forEach(sourceRow=>{
  const srcCell=sourceRow.cells[item.ci],cell=el('td');
  if(srcCell){
   const content=srcCell.textContent.trim();cell.classList.add('sv2day');const parsed=content.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);const times=shiftTimes(item.p,sourceRow.cells[0]?.textContent);const hours=content.match(/\b(\d+(?:[.,]\d+)?)\s*sa\b/i)?.[1];
   if(parsed){let minutes=Number(parsed[3])*60+Number(parsed[4])-Number(parsed[1])*60-Number(parsed[2]);if(minutes<0)minutes+=1440;const code=el('span',minutes>=14?'N':'G');code.className='sv2short';cell.append(code);const hour=el('span',times||parsed[0]);hour.className='sv2shortHour';cell.append(hour);cell.title=content;}
   else if(content){const label=/REZERV/i.test(content)?'RV':/RAPOR/i.test(content)?'R':/İZİN|IZIN/i.test(content)?'İ':/^(N|G|I)(?:\s|$)/i.test(content)?content[0].toLocaleUpperCase('tr-TR'):content.length>16?content.slice(0,14)+'…':content;const txt=el('span',label);txt.className='sv2short';cell.append(txt);if(times||hours){const sub=el('span',times||(hours+' sa'));sub.className='sv2shortHour';cell.append(sub)}cell.title=content+(times?' | '+times:'');}
   else{cell.classList.add('sv2empty');cell.textContent='·';}
   const computed=getComputedStyle(srcCell);cell.style.backgroundColor=computed.backgroundColor;cell.style.color=computed.color;
   cell.tabIndex=0;cell.setAttribute('role','button');cell.setAttribute('aria-label',item.name+' '+sourceRow.cells[0].textContent.trim()+' '+content);
   const select=()=>{page.querySelector('.sv2selected')?.classList.remove('sv2selected');cell.classList.add('sv2selected');page.querySelector('.sv2formula').textContent=item.name+' | '+sourceRow.cells[0].textContent.trim()+' | '+(content||'Boş')+' — Düzenlemek için Orijinal Saymanlıkta Düzenle seçeneğini kullan.'};
   cell.addEventListener('click',select);cell.addEventListener('focus',select);

  }
  row.append(cell);
 });
 sumLeave+=leave;sumReport+=report;sumHours+=total;
 [leave,report,'—','—','—',total?Math.round(total*10)/10:'—','—'].forEach(n=>{const cell=el('td',String(n));cell.className='sv2calc';row.append(cell)});
 table.append(row);
}
holder.append(table);
const cards=page.querySelector('.sv2cards');
if(cards){cards.replaceChildren();for(const [label,value] of [['Personel',persons.length],['İzin günü',sumLeave],['Rapor günü',sumReport],['Toplam çalışma saati',Math.round(sumHours*10)/10+' sa'],['Birim mükellefi','—'],['Toplam fazla mesai','—']]){const card=el('div');card.className='sv2card';const l=el('small',label),v=el('b',String(value));card.append(l,v);cards.append(card)}}
for(const [ri,tr] of [...table.rows].entries())for(const [ci,cell] of [...tr.cells].entries()){
 if(tr.classList.contains('sv2group'))continue;
 if(ci>0){const width=Number(state.widths[ci]||state.width);cell.style.width=width+'px';cell.style.minWidth=width+'px'}
 if(ri>0)cell.style.height=Number(state.heights[ri]||state.height)+'px';
 if(state.hide&&(ci===dates.length+1||ci===dates.length+2))cell.classList.add('sv2hidden');
 if(ri===0||ci===0||!cell.classList.contains('sv2day'))continue;
 cell.style.position='relative';const grip=el('span');grip.className='sv2handle';grip.title='Satır ve sütun boyutunu sürükleyerek ayarla';
 grip.addEventListener('pointerdown',e=>{
  e.preventDefault();e.stopPropagation();const x=e.clientX,y=e.clientY,w=cell.offsetWidth,h=cell.offsetHeight;grip.setPointerCapture(e.pointerId);
  const move=v=>{state.widths[ci]=Math.max(45,Math.min(220,w+v.clientX-x));state.heights[ri]=Math.max(24,Math.min(120,h+v.clientY-y));[...table.rows].forEach(r=>{if(r.cells[ci]){r.cells[ci].style.width=state.widths[ci]+'px';r.cells[ci].style.minWidth=state.widths[ci]+'px'}});[...tr.cells].forEach(c=>c.style.height=state.heights[ri]+'px')};
  const end=()=>{grip.removeEventListener('pointermove',move);save()};grip.addEventListener('pointermove',move);grip.addEventListener('pointerup',end,{once:true});grip.addEventListener('pointercancel',end,{once:true});
 });cell.append(grip);
}
page.querySelector('.sv2summary').textContent='Toplam birim mükellefi ve fazla mesai: kaynak hesap bağlantısı henüz doğrulanmadı · '+persons.length+' personel / '+dates.length+' gün · Rezerveler izin ve rapor sayısına eklenmez.';

}
function install(){
const main=document.querySelector('main.main'),side=document.querySelector('.sidebar');if(!main||!side)return false;
if(document.getElementById('saymanlikV2'))return true;
const page=el('section');page.id='saymanlikV2';page.className='page';
page.innerHTML='<div class="sv2heading"><h2>Saymanlık V2</h2><small>Excel tarzı çalışma görünümü · V1 verileri korunur</small></div><div class="sv2bar"></div><div class="sv2cards"></div><div class="sv2formula">Bir hücre seçerek tam içeriğini görüntüleyebilirsin.</div><div class="sv2wrap"></div><div class="sv2legend"><span>🟩 Çalışma</span><span>🟨 Nöbet</span><span>İZ: İzin</span><span>R: Rapor</span><span>RV: Rezerve</span><span>Hücre köşesinden boyutlandır</span></div><div class="sv2summary"></div><div style="display:flex;justify-content:space-around;margin:30px 0;text-align:center;gap:15px"><div>Hazırlayan<br>Ad Soyad / İmza</div><div>Kontrol Eden<br>Ad Soyad / İmza</div><div>Onaylayan<br>Ad Soyad / İmza</div></div>';main.append(page);
const bar=page.querySelector('.sv2bar');const periods=el('select');[['1','İlk 15 Gün'],['2','Son 15 Gün'],['0','Tüm Ay']].forEach(([v,t])=>{const o=el('option',t);o.value=v;periods.append(o)});periods.value=String(state.period);periods.onchange=()=>{state.period=Number(periods.value);save();build()};
const tabs=el('select');[['1','SAY1'],['2','SAY2']].forEach(([v,l])=>{const o=el('option',l);o.value=v;tabs.append(o)});tabs.value=String(state.tab);tabs.onchange=()=>{state.tab=Number(tabs.value);save();build()};
const units=el('select');const refreshUnits=()=>{const membership=memberships(),all=[...new Set(staff().map(p=>unit(p,membership)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'tr'));units.replaceChildren();for(const name of ['all',...all]){const o=el('option',name==='all'?'Tüm birimler':name);o.value=name;units.append(o)}units.value=all.includes(state.unit)?state.unit:'all';state.unit=units.value};refreshUnits();units.onchange=()=>{state.unit=units.value;save();build()};
const hide=el('button','İzin/Rapor sütunları: '+(state.hide?'Gizli':'Açık'));hide.onclick=()=>{state.hide=!state.hide;hide.textContent='İzin/Rapor sütunları: '+(state.hide?'Gizli':'Açık');save();build()};
const grouping=el('button',state.group?'✓ Birimlere göre ayrıldı':'Birimlere göre ayır');grouping.onclick=()=>{state.group=!state.group;grouping.textContent=state.group?'✓ Birimlere göre ayrıldı':'Birimlere göre ayır';save();build()};
const fullscreen=el('button','⛶ Tam ekran');fullscreen.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await page.requestFullscreen()}catch(e){console.warn('Tam ekran kullanılamıyor',e)}};
const search=el('input');search.type='search';search.placeholder='Personel ara';search.setAttribute('aria-label','Personel ara');search.value=state.search||'';search.addEventListener('input',()=>{state.search=search.value;save();build()});
const refresh=el('button','↻ Verileri Yenile');refresh.onclick=()=>{warmAttempts=0;refreshUnits();build()};
const resetSize=el('button','↺ Hücre boyutlarını sıfırla');resetSize.onclick=()=>{state.width=58;state.height=39;state.widths={};state.heights={};save();bar.querySelectorAll('input[type="range"]').forEach((input,i)=>{input.value=i===0?58:39});build()};
const back=el('button','Orijinal Saymanlıkta Düzenle');back.onclick=()=>{const original=[...side.querySelectorAll('button,.nav')].find(x=>/saymanlık/i.test(x.textContent)&&!/V2/i.test(x.textContent));if(original)original.click();else{page.classList.remove('active');document.getElementById('saymanlik')?.classList.add('active')}};
for(const [label,key,min,max] of [['Gün hücresi genişliği','width',42,110],['Tüm satırların yüksekliği','height',28,75]]){const wrap=el('label',label+' '),input=el('input');input.type='range';input.min=min;input.max=max;input.value=state[key];input.oninput=()=>{state[key]=Number(input.value);state[key==='width'?'widths':'heights']={};save();build()};wrap.append(input);bar.append(wrap)}
bar.prepend(tabs,periods,units,search,grouping,hide,fullscreen,refresh,resetSize,back);
const native=[...side.querySelectorAll('.nav,button')].find(x=>/saymanlık/i.test(x.textContent)&&!/V2/i.test(x.textContent));const nav=el('button','▦ Saymanlık V2');nav.type='button';nav.className=native?.className||'nav';nav.id='rpysSayV2Nav';nav.onclick=()=>{document.querySelectorAll('main.main > section.page').forEach(x=>x.classList.remove('active'));page.classList.add('active');side.querySelectorAll('.nav').forEach(x=>x.classList.remove('active'));nav.classList.add('active');document.body.classList.remove('rpysMobileMenuOpen');refreshUnits();build()};
if(native)native.after(nav);else side.append(nav);
return true;
}
let attempts=0;const timer=setInterval(()=>{if(install()||++attempts>40)clearInterval(timer)},500);
window.addEventListener('rpys-direct-core-ready',()=>setTimeout(install,500));
// V1 veri kaynağı yeniden çizildiğinde V2 açık ise yalnızca görünümü güncelle.
// Bulut/veritabanı kayıtlarına kesinlikle yazılmaz.
let redrawTimer=0;
const observer=new MutationObserver(records=>{
 if(!document.getElementById('saymanlikV2')?.classList.contains('active'))return;
 if(!records.some(r=>r.target.closest?.('#say1Grid,#say2Grid')))return;
 clearTimeout(redrawTimer);redrawTimer=setTimeout(build,300);
});
if(document.body)observer.observe(document.body,{subtree:true,childList:true,characterData:true});
})();
