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
#saymanlikV2 .sv2wrap{width:100%!important;max-height:none!important;min-height:360px;overflow-x:auto!important;overflow-y:visible!important}
#saymanlikV2 .sv2cards{margin:5px 0 7px!important;gap:5px!important}
#saymanlikV2 .sv2card{padding:6px 10px!important}
#saymanlikV2 .sv2card b{font-size:15px!important}
#saymanlikV2 .sv2bar{padding:6px!important;margin-bottom:6px!important;gap:5px!important}
#saymanlikV2 .sv2wrap td.sv2day{padding:2px 3px!important}
#saymanlikV2 .sv2short{font-size:14px!important;font-weight:800!important;line-height:1.12!important}
#saymanlikV2 .sv2shortHour{font-size:9px!important;line-height:1.1!important;margin-top:2px!important;white-space:normal!important;overflow-wrap:anywhere}
#saymanlikV2 .sv2wrap tr>th:first-child{min-width:155px!important;max-width:200px;white-space:normal!important}
#saymanlikV2 .sv2heading{margin-bottom:3px}
#saymanlikV2:fullscreen{height:100dvh!important;width:100vw!important;max-width:none!important;overflow:hidden!important;background:#eef4fb!important;padding:8px!important}
#saymanlikV2:fullscreen .sv2wrap{height:calc(100dvh - 230px)!important;max-height:none!important;min-height:0!important}
#saymanlikV2:fullscreen .sv2wrap{overflow:auto!important}
#saymanlikV2:fullscreen .sv2wrap table{min-width:100%!important}
#saymanlikV2:fullscreen .sv2cards{grid-template-columns:repeat(6,minmax(0,1fr))!important}
#saymanlikV2 th.sv2weekend,#saymanlikV2 td.sv2empty.sv2weekend{background-color:#fff2ed!important;color:#9f3a2a!important}
#saymanlikV2 th.sv2holiday,#saymanlikV2 td.sv2empty.sv2holiday{background-color:#ffe0df!important;color:#982626!important}
#saymanlikV2 td.sv2day.sv2weekend:not(.sv2empty){border-left:2px solid #ed9e81!important}
#saymanlikV2 td.sv2day.sv2holiday:not(.sv2empty){border-left:2px solid #ea7777!important}
#saymanlikV2 .sv2personcell{min-width:175px!important}
#saymanlikV2 .sv2personrow{display:flex;align-items:center;gap:5px}
#saymanlikV2 .sv2rownum{display:inline-block;min-width:20px;color:#64748b;font-size:10px;font-weight:600}
#saymanlikV2 .sv2personname{flex:1;min-width:0;overflow-wrap:anywhere}
#saymanlikV2 .sv2orderbuttons{display:flex;gap:2px;opacity:.25}
#saymanlikV2 .sv2personcell:hover .sv2orderbuttons,#saymanlikV2 .sv2orderbuttons:focus-within{opacity:1}
#saymanlikV2 .sv2orderbuttons button{padding:0 3px;border:1px solid #cbd5e1;border-radius:3px;background:white;color:#1e497a;cursor:pointer;font-size:11px}
#saymanlikV2 .sv2summarydetails{background:white;border:1px solid #dce6f0;border-radius:8px;padding:7px 10px;font-size:12px;color:#35506e}
#saymanlikV2 .sv2summarydetails summary{cursor:pointer;font-weight:650}
#saymanlikV2 .sv2day{cursor:context-menu}
#cellContextMenu{z-index:2147483646!important}
@media(max-width:1000px){#saymanlikV2 .sv2cards{grid-template-columns:repeat(3,1fr)}}
@media(max-width:650px){#saymanlikV2 .sv2cards{grid-template-columns:repeat(2,minmax(0,1fr))}#saymanlikV2 .sv2bar{align-items:stretch}#saymanlikV2 .sv2bar select,#saymanlikV2 .sv2bar button{min-height:36px}}
`;document.head.append(css);
const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n};
const state={tab:0,width:66,height:38,period:1,unit:'all',hide:false,group:false,search:'',collapsed:{},widths:{},heights:{},order:[]};
try{const s=JSON.parse(localStorage.getItem('rpys-say-v2-independent')||'{}');Object.assign(state,s)}catch(e){}
// V10: gruplama ilk açılışta kapalıdır; kullanıcı dilediğinde açabilir.
if(!state.groupChoiceV10){state.group=false;state.groupChoiceV10=true}
// V12: eksik SAY2 personelini de varsayılan listeye kat.
if(!state.allPeopleChoiceV12){state.tab=0;state.allPeopleChoiceV12=true}
const save=()=>{try{localStorage.setItem('rpys-say-v2-independent',JSON.stringify(state))}catch(e){}};
function movePerson(name,direction,visible){
 const names=visible.map(x=>x.name),existing=[...new Set([...(Array.isArray(state.order)?state.order:[]),...names])];
 // Rebuild visible ordering from the current display before moving a person.
 const displayed=new Set(names),positions=existing.map((name,i)=>displayed.has(name)?i:-1).filter(i=>i>=0);
 names.forEach((name,i)=>{existing[positions[i]]=name});
 const at=existing.indexOf(name),other=direction<0?positions.filter(i=>i<at).pop():positions.find(i=>i>at);
 if(other===undefined)return;
 [existing[at],existing[other]]=[existing[other],existing[at]];state.order=existing;save();build();
}
function holidayKind(date){
 try{if(typeof isHolidayDate==='function'&&isHolidayDate(date))return 'sv2holiday';if(typeof isHalfHolidayDate==='function'&&isHalfHolidayDate(date))return 'sv2holiday'}catch(e){}
 const weekday=new Date(date+'T12:00:00Z').getUTCDay();return weekday===0||weekday===6?'sv2weekend':'';
}
function printV2(){
 const page=document.getElementById('saymanlikV2'),grid=page?.querySelector('.sv2wrap table');if(!grid)return alert('Yazdırılacak Saymanlık V2 tablosu henüz hazır değil.');
 const copy=grid.cloneNode(true);copy.querySelectorAll('.sv2handle,.sv2orderbuttons').forEach(n=>n.remove());
 const cards=[...page.querySelectorAll('.sv2card')].map(card=>({label:card.querySelector('small')?.textContent||'',value:card.querySelector('b')?.textContent||'—'}));
 const doc=document.implementation.createHTMLDocument('RPYS Saymanlık V2');
 const style=doc.createElement('style');style.textContent=`@page{size:landscape;margin:7mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#172d4b;margin:0}h2{margin:0 0 5px;font-size:14px}.meta{font-size:10px;margin-bottom:7px}.totals{display:flex;gap:12px;flex-wrap:wrap;border:1px solid #9db0c7;padding:5px;margin-bottom:7px;font-size:10px}.totals b{margin-left:4px}table{border-collapse:collapse;width:100%;table-layout:fixed;font-size:7px}th,td{border:1px solid #afc0d0;text-align:center;padding:2px 1px;height:auto!important;min-width:0!important;width:auto!important;overflow-wrap:anywhere}th:first-child{width:34mm!important;text-align:left}thead{display:table-header-group}tr{break-inside:avoid}td.sv2day{font-size:7px}.sv2short{display:block;font-weight:700}.sv2shortHour{display:block;font-size:6px}.sv2group th{background:#dfeafa!important}.sv2weekend{background:#fff2ed!important}.sv2holiday{background:#ffe0df!important}.sv2hidden{display:none!important}.sv2calc{background:#eef5fd!important}.sv2rownum{margin-right:4px}.sv2personrow{display:flex;gap:4px}.foot{margin-top:8px;border-top:1px solid #9db0c7;padding-top:5px;font-size:10px;display:flex;justify-content:space-between}@media print{*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`;
 doc.head.append(style);const title=doc.createElement('h2');title.textContent='RPYS — Saymanlık V2';const meta=doc.createElement('div');meta.className='meta';meta.textContent=(document.getElementById('month')?.selectedOptions?.[0]?.textContent||month())+' • '+(state.period===0?'Tüm Ay':state.period===1?'İlk 15 Gün':'Son 15 Gün')+' • '+(state.unit==='all'?'Tüm birimler':state.unit);
 const totals=doc.createElement('div');totals.className='totals';for(const c of cards){const span=doc.createElement('span'),b=doc.createElement('b');span.textContent=c.label+': ';b.textContent=c.value;span.append(b);totals.append(span)}
 const foot=doc.createElement('div');foot.className='foot';const muk=cards.find(c=>c.label==='Birim mükellefi')?.value||'—',fm=cards.find(c=>c.label==='Toplam fazla mesai')?.value||'—';foot.textContent='TOPLAM MÜKELLEF: '+muk+'    |    TOPLAM FAZLA MESAİ: '+fm;
 doc.body.append(title,meta,totals,copy,foot);
 const printable='<!doctype html><html lang="tr"><head><meta charset="utf-8">'+doc.head.innerHTML+'<style>@media print{.printbar{display:none!important}}</style></head><body><div class="printbar" style="padding:8px;background:#eaf2fc;margin-bottom:8px"><button onclick="window.print()" style="padding:8px 15px">🖨 Yazdır / PDF Kaydet</button> <small>Önizlemeyi kapatmak için bu sekmeyi kapatabilirsin.</small></div>'+doc.body.innerHTML+'</body></html>';
 const popup=window.open('','_blank');
 if(popup){popup.document.open();popup.document.write(printable);popup.document.close();popup.focus();try{popup.print()}catch(e){}return}
 const frame=document.createElement('iframe');frame.setAttribute('aria-hidden','true');frame.style.cssText='position:fixed;right:0;bottom:0;width:1px;height:1px;opacity:0;border:0';document.body.append(frame);
 let printed=false;frame.onload=()=>{if(printed)return;printed=true;try{frame.contentWindow.focus();frame.contentWindow.print()}catch(e){alert('Yazdırma penceresi açılamadı: '+e.message)}};
 frame.srcdoc=printable;
 frame.addEventListener('load',()=>{try{frame.contentWindow.onafterprint=()=>frame.remove()}catch(e){}},{once:true});
 setTimeout(()=>frame.remove(),60000);
}
function staff(){try{return Array.isArray(db.staff)?db.staff:[]}catch(e){return []}}
function month(){try{return typeof ym==='function'?ym():''}catch{return ''}}
function memberships(){
 const map=new Map(),mk=month();try{for(const [key,ids] of Object.entries(db.unitPools||{})){
  if(!mk||!key.startsWith(mk+'|')||!Array.isArray(ids))continue;
  const name=key.slice(mk.length+1);for(const pid of ids){const id=String(pid);if(!map.has(id))map.set(id,name)}
 }}catch(e){}return map;
}
function unit(p,membership){return (p&&membership?.get(String(p.id)))||String(p?.unit||p?.department||p?.birim||p?.unitName||p?.departmentName||'').trim()}
function assignmentsFor(p,dateCell){
 if(!p)return [];
 const match=String(dateCell||'').match(/^(\d{1,2})\s*[/.]\s*(\d{1,2})/),mk=month();if(!match||!mk)return [];
 const day=Number(match[1]),assignments=[];
 try{for(const [key,pid] of Object.entries(db.assign||{})){
  const parts=key.split('|');if(parts[0]!==mk||Number(parts[2])!==day||String(pid)!==String(p.id))continue;
  const meta=db.assignmentMeta?.[key]||{},base=typeof dutyColumnByKey==='function'?dutyColumnByKey(parts[1],parts.slice(3).join('|')):null;
  assignments.push({shift:String(meta.shift||base?.shift||''),label:[parts[1],parts.slice(3).join('|'),base?.unit,base?.name,base?.title,meta.unit,meta.name].filter(Boolean).join(' ')});
 }}catch(e){}return assignments;
}
function shiftTimes(p,dateCell){
 const shifts=[];for(const a of assignmentsFor(p,dateCell)){const t=a.shift.match(/\d{1,2}[:.]\d{2}\s*[-–]\s*\d{1,2}[:.]\d{2}/)?.[0];if(t&&!shifts.includes(t))shifts.push(t)}return shifts.join(' / ');
}
function dutyCode(content,parsed,assignments){
 const labels=assignments.map(a=>a.label).join(' ').toLocaleUpperCase('tr-TR');
 // Gündüz birimleri, V1'de N işaretli gelse dahi V2'de gündüzdür.
 if(/POL[İI]KL[İI]N[İI]K|DEXA|MAMO|MAMOGRAF[İI]|SORUMLU|G[ÜU]ND[ÜU]Z|SKOP[İI]|PORTABLE|SEKRETERL[İI]K/.test(labels))return 'G';
 if(/N[ÖO]BET|GECE|AC[İI]L N|N[ÖO]BET/.test(labels))return 'N';
 if(parsed){let minutes=Number(parsed[3])*60+Number(parsed[4])-Number(parsed[1])*60-Number(parsed[2]);if(minutes<=0)minutes+=1440;return minutes>=14*60?'N':'G'}
 if(/\b(?:G[ÜU]ND[ÜU]Z|POL[İI]KL[İI]N[İI]K|DEXA|MAMO|SKOP[İI]|PORTABLE|SEKRETERL[İI]K)\b/i.test(content))return 'G';
 return /^\s*[NG](?=\s|$)/i.test(content)?content.trim()[0].toLocaleUpperCase('tr-TR'):'';
}
function openOriginalCellMenu(srcCell,viewCell,event){
 event.preventDefault();event.stopPropagation();
 const page=document.getElementById('saymanlikV2');
 const select=()=>{page.querySelector('.sv2selected')?.classList.remove('sv2selected');viewCell.classList.add('sv2selected')};select();
 const menu=document.getElementById('cellContextMenu');if(menu)menu.style.display='none';
 // V1 hücresinin bütün orijinal işlem seçeneklerini ve kayıt mekanizmasını kullan.
 srcCell.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,button:2,buttons:2,clientX:event.clientX,clientY:event.clientY,screenX:event.screenX,screenY:event.screenY}));
 const shown=document.getElementById('cellContextMenu');
 if(shown&&getComputedStyle(shown).display!=='none'){
  shown.style.position='fixed';shown.style.left=Math.min(event.clientX,Math.max(0,innerWidth-shown.offsetWidth-12))+'px';shown.style.top=Math.min(event.clientY,Math.max(0,innerHeight-shown.offsetHeight-12))+'px';shown.style.zIndex='2147483646';return;
 }
 // V1 menüsü açılmadıysa kullanıcıyı aynı personel ve güne götür; veri değiştirme.
 const original=[...document.querySelectorAll('.sidebar .nav,.sidebar button')].find(x=>/saymanlık/i.test(x.textContent)&&!/V2/i.test(x.textContent));original?.click();
 setTimeout(()=>{srcCell.scrollIntoView({block:'center',inline:'center'});srcCell.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,button:2,clientX:Math.min(innerWidth-100,Math.max(10,srcCell.getBoundingClientRect().left)),clientY:Math.min(innerHeight-100,Math.max(10,srcCell.getBoundingClientRect().top))}))},90);
}
function sourceFor(tab){
 const host=document.querySelector(tab===1?'#say1Grid':'#say2Grid'),table=host?.querySelector('table');if(!table)return null;
 const rows=[...table.rows];
 const header=rows.find(r=>r.cells.length>4&&/TARİH|TARIH/i.test(r.cells[0]?.textContent||''))||rows.find(r=>r.cells.length>4);
 const hasDates=rows.some(r=>/^\s*\d{1,2}\s*[/.]\s*\d{1,2}/.test(r.cells[0]?.textContent||''));
 return header&&hasDates?table:null;
}
function source(){return sourceFor(state.tab===2?2:1)}
function sourcesReady(){return state.tab===0?!!(sourceFor(1)&&sourceFor(2)):!!source()}
let warming=false,warmAttempts=0;
function warmSource(){if(warming||sourcesReady()||warmAttempts>=8)return;warmAttempts++;warming=true;const side=document.querySelector('.sidebar');const original=[...side?.querySelectorAll('.nav,button')||[]].find(x=>/saymanlık/i.test(x.textContent)&&!/V2/i.test(x.textContent));try{if(original)original.click();else document.getElementById('saymanlik')?.classList.add('active')}catch(e){}setTimeout(()=>{const v=document.getElementById('saymanlikV2');document.querySelectorAll('main.main > section.page').forEach(x=>x.classList.remove('active'));v?.classList.add('active');document.getElementById('rpysSayV2Nav')?.classList.add('active');warming=false;build()},900)}
function build(){
const page=document.getElementById('saymanlikV2');if(!page)return;
const holder=page.querySelector('.sv2wrap');if(!holder)return;
const src=source();holder.replaceChildren();if(!sourcesReady()){holder.textContent=warmAttempts>=8?'Ana Saymanlık henüz hazır değil. Önce Saymanlık SAY1/SAY2 sekmesini açıp ardından V2 içindeki Verileri Yenile düğmesine bas.':'Saymanlık kayıtları yükleniyor… ('+(warmAttempts+1)+'/8)';warmSource();return}

const rows=[...src.rows],header=rows.find(r=>r.cells.length>4&&/TARİH|TARIH/i.test(r.cells[0]?.textContent||''))||rows.find(r=>r.cells.length>4);
if(!header){holder.textContent='Personel başlıkları bulunamadı.';return}
const heads=[...header.cells].map(c=>c.textContent.trim().replace(/\s+/g,' '));
const norm=s=>String(s||'').toLocaleUpperCase('tr-TR').replace(/\s+/g,' ').trim();
const people=staff();
const membership=memberships();
const tables=state.tab===0?[sourceFor(1),sourceFor(2)]:[src];
const normalizedLabel=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/İ/g,'I').toLocaleUpperCase('tr-TR').replace(/\s+/g,' ').trim();
const val=s=>{const raw=String(s??'').replace(/\s*(SAAT|SA)\s*$/i,'').trim();if(!raw||raw==='—')return null;const n=Number(raw.replace(',','.'));return Number.isFinite(n)?n:null};
const summariesByTable=new Map();const seen=new Set();
const persons=[];
for(const tableSource of tables){
 const tr=[...tableSource.rows],h=tr.find(r=>r.cells.length>4&&/TARİH|TARIH/i.test(r.cells[0]?.textContent||''))||tr.find(r=>r.cells.length>4);
 const dateRows=tr.slice(tr.indexOf(h)+1).filter(r=>/^\s*\d{1,2}\s*[/.]\s*\d{1,2}/.test(r.cells[0]?.textContent||''));
 const summary={};for(const r of tr){const label=normalizedLabel(r.cells[0]?.textContent);if(['POLIKLINIK','ACIL','TOPLAM','MUKELLEF','FARK'].includes(label))summary[label]=r}summariesByTable.set(tableSource,summary);
 [...h.cells].forEach((cell,ci)=>{const name=cell.textContent.trim().replace(/\s+/g,' '),key=norm(name);if(ci===0||!key||seen.has(key))return;seen.add(key);
  const p=people.find(x=>norm(x.name)===key);if((state.unit&&state.unit!=='all'&&(!p||unit(p,membership)!==state.unit))||!key.includes(norm(state.search)))return;
  persons.push({name,ci,p,allDates:dateRows,tableSource,summary});
 });
}
const allDates=rows.slice(rows.indexOf(header)+1).filter(r=>/^\s*\d{1,2}\s*[/.]\s*\d{1,2}/.test(r.cells[0]?.textContent||''));const dates=state.period===0?allDates:allDates.slice(state.period===1?0:15,state.period===1?15:31);
if(!dates.length){holder.textContent='Gün satırları bulunamadı.';return}
const table=el('table'),top=el('tr');top.append(el('th','NO / PERSONEL'));
const mk=month();const dateClasses=dates.map(r=>{const day=Number(r.cells[0]?.textContent.match(/^\s*(\d+)/)?.[1]);return mk&&day?holidayKind(mk+'-'+String(day).padStart(2,'0')):''});
dates.forEach((r,i)=>{const th=el('th',r.cells[0].textContent.trim().split(' ')[0]);if(dateClasses[i])th.classList.add(dateClasses[i]);top.append(th)});
const summaries=['İzin Günü','Rapor Günü','Mükellef','Pol Çalışma','Acil Çalışma','Toplam Çalışma','Toplam FM'];
summaries.forEach(s=>{const th=el('th',s);th.className='sv2calc';top.append(th)});table.append(top);
let sumLeave=0,sumReport=0,sumHours=0;
const order=Array.isArray(state.order)?state.order:[];
const personComparator=(a,b)=>{const ai=order.indexOf(a.name),bi=order.indexOf(b.name);if(ai>=0&&bi>=0)return ai-bi;if(ai>=0)return -1;if(bi>=0)return 1;return a.name.localeCompare(b.name,'tr')};
const ordered=[...persons].sort((a,b)=>state.group?(unit(a.p,membership)||'Atanmamış').localeCompare(unit(b.p,membership)||'Atanmamış','tr')||personComparator(a,b):personComparator(a,b));
let lastGroup='';
for(const [personIndex,item] of ordered.entries()){
 const group=unit(item.p,membership)||'Atanmamış';
 if(state.group&&group!==lastGroup){lastGroup=group;const g=el('tr');g.className='sv2group';const label=el('th',(state.collapsed[group]?'▸ ':'▾ ')+group+' ('+ordered.filter(x=>(unit(x.p,membership)||'Atanmamış')===group).length+')');label.colSpan=dates.length+summaries.length+1;label.title='Grubu aç/kapat';label.addEventListener('click',()=>{state.collapsed[group]=!state.collapsed[group];save();build()});g.append(label);table.append(g)}
 if(state.group&&state.collapsed[group]){
  for(const sourceRow of item.allDates){const content=sourceRow.cells[item.ci]?.textContent.trim()||'',n=norm(content);if(!/REZERV/.test(n)){if(/RAPOR/.test(n))sumReport++;else if(/İZİN|IZIN/.test(n))sumLeave++}}
  continue;
 }
 const row=el('tr'),nameCell=el('th');nameCell.className='sv2personcell';
 const line=el('div');line.className='sv2personrow';const number=el('span',String(personIndex+1)+'.');number.className='sv2rownum';const label=el('span',item.name);label.className='sv2personname';
 const controls=el('span');controls.className='sv2orderbuttons';for(const [symbol,direction] of [['↑',-1],['↓',1]]){const button=el('button',symbol);button.type='button';button.title=item.name+' '+(direction<0?'yukarı':'aşağı')+' taşı';button.onclick=e=>{e.preventDefault();e.stopPropagation();movePerson(item.name,direction,state.group?ordered.filter(x=>(unit(x.p,membership)||'Atanmamış')===group):ordered)};controls.append(button)}
 line.append(number,label,controls);nameCell.append(line);row.append(nameCell);let leave=0,report=0,total=0;
 for(const sourceRow of item.allDates){const srcCell=sourceRow.cells[item.ci];if(!srcCell)continue;const content=srcCell.textContent.trim(),normText=norm(content);if(!/REZERV/.test(normText)){if(/RAPOR/.test(normText))report++;else if(/İZİN|IZIN/.test(normText))leave++}}

 dates.forEach((dateRow,dayIndex)=>{const sourceRow=item.allDates[allDates.indexOf(dateRow)]||item.allDates[dayIndex]||dateRow;
  const srcCell=sourceRow.cells[item.ci],cell=el('td');
  if(srcCell){
   const content=srcCell.textContent.trim();cell.classList.add('sv2day');const parsed=content.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);const assignments=assignmentsFor(item.p,sourceRow.cells[0]?.textContent),times=shiftTimes(item.p,sourceRow.cells[0]?.textContent);const hours=content.match(/\b(\d+(?:[.,]\d+)?)\s*sa\b/i)?.[1];
   if(parsed){const code=el('span',dutyCode(content,parsed,assignments));code.className='sv2short';cell.append(code);const hour=el('span',times||parsed[0]);hour.className='sv2shortHour';cell.append(hour);cell.title=content;}
   else if(content){const label=/REZERV/i.test(content)?'RV':/RAPOR/i.test(content)?'R':/İZİN|IZIN/i.test(content)?'İ':dutyCode(content,null,assignments)|| (content.length>16?content.slice(0,14)+'…':content);const txt=el('span',label);txt.className='sv2short';cell.append(txt);if(times||hours){const sub=el('span',times||(hours+' sa'));sub.className='sv2shortHour';cell.append(sub)}cell.title=content+(times?' | '+times:'');}
   else{cell.classList.add('sv2empty');cell.textContent='·';}
   const computed=getComputedStyle(srcCell);cell.style.backgroundColor=computed.backgroundColor;cell.style.color=computed.color;
   cell.tabIndex=0;cell.setAttribute('role','button');cell.setAttribute('aria-label',item.name+' '+sourceRow.cells[0].textContent.trim()+' '+content);
   const select=()=>{page.querySelector('.sv2selected')?.classList.remove('sv2selected');cell.classList.add('sv2selected');page.querySelector('.sv2formula').textContent=item.name+' | '+sourceRow.cells[0].textContent.trim()+' | '+(content||'Boş')+' — Düzenlemek için Orijinal Saymanlıkta Düzenle seçeneğini kullan.'};
   cell.addEventListener('click',select);cell.addEventListener('focus',select);
   cell.addEventListener('contextmenu',e=>openOriginalCellMenu(srcCell,cell,e));

  }
  if(dateClasses[dayIndex])cell.classList.add(dateClasses[dayIndex]);row.append(cell);
 });
 const take=label=>val(item.summary[label]?.cells[item.ci]?.textContent);
 const pol=take('POLIKLINIK'),acil=take('ACIL'),worked=take('TOPLAM'),muk=take('MUKELLEF'),diff=take('FARK');
 sumLeave+=leave;sumReport+=report;if(worked!==null)sumHours+=worked;
 [leave,report,muk,pol,acil,worked,diff===null?null:Math.max(0,diff)].forEach(n=>{const cell=el('td',n===null?'—':String(n));cell.className='sv2calc';row.append(cell)});
 table.append(row);
}
holder.append(table);
const cards=page.querySelector('.sv2cards');
if(cards){cards.replaceChildren();const values=label=>persons.map(p=>val(p.summary[label]?.cells[p.ci]?.textContent));const allM=values('MUKELLEF'),allF=values('FARK'),allW=values('TOPLAM');const totalOf=a=>a.length&&a.every(n=>n!==null)?Math.round(a.reduce((s,n)=>s+n,0)*100)/100+' sa':'—';for(const [label,value] of [['Personel',persons.length],['İzin günü',sumLeave],['Rapor günü',sumReport],['Toplam çalışma saati',totalOf(allW)],['Birim mükellefi',totalOf(allM)],['Toplam fazla mesai',allF.length&&allF.every(n=>n!==null)?Math.round(allF.reduce((s,n)=>s+Math.max(0,n),0)*100)/100+' sa':'—']]){const card=el('div');card.className='sv2card';const l=el('small',label),v=el('b',String(value));card.append(l,v);cards.append(card)}}
const details=page.querySelector('.sv2summarydetails');if(details){const body=details.querySelector('div');body.replaceChildren();const positive=persons.map(p=>({name:p.name,worked:val(p.summary.TOPLAM?.cells[p.ci]?.textContent),muk:val(p.summary.MUKELLEF?.cells[p.ci]?.textContent),difference:val(p.summary.FARK?.cells[p.ci]?.textContent)})).filter(x=>x.difference>0).sort((a,b)=>b.difference-a.difference);const intro=el('p','Fazla mesai, V1 Saymanlık FARK satırının pozitif kısmından alınır. Çalışılan saat ile mükellef saat arasındaki farkı gösterir; izin, vardiya ve manuel düzeltmelerin etkisi için V1 kayıtları ayrıca incelenmelidir.');body.append(intro);if(positive.length){const list=el('ul');for(const p of positive.slice(0,8)){const item=el('li',p.name+': '+p.difference+' sa fazla mesai (çalışma '+(p.worked??'—')+' / mükellef '+(p.muk??'—')+' sa)');list.append(item)}body.append(list)}else body.append(el('p','Seçili listede pozitif FARK bulunmadı.'))}
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
page.querySelector('.sv2summary').textContent='Hesaplar V1 Saymanlık satırlarından okunur; kaynakta hesap yoksa — gösterilir. '+persons.length+' personel / '+dates.length+' gün · Rezerveler izin ve rapor sayısına eklenmez.';

}
function install(){
const main=document.querySelector('main.main'),side=document.querySelector('.sidebar');if(!main||!side)return false;
if(document.getElementById('saymanlikV2'))return true;
const page=el('section');page.id='saymanlikV2';page.className='page';
page.innerHTML='<div class="sv2heading"><h2>Saymanlık V2</h2><small>Excel tarzı çalışma görünümü · V1 verileri korunur</small></div><div class="sv2bar"></div><div class="sv2cards"></div><div class="sv2formula">Bir hücre seçerek tam içeriğini görüntüleyebilirsin.</div><div class="sv2wrap"></div><div class="sv2legend"><span>🟩 Çalışma</span><span>🟨 Nöbet</span><span>İZ: İzin</span><span>R: Rapor</span><span>RV: Rezerve</span><span>Hafta sonları ve tatiller renklidir</span></div><details class="sv2summarydetails"><summary>Fazla mesai neden oluşmuş? · Kısa analiz</summary><div></div></details><div class="sv2summary"></div><div style="display:flex;justify-content:space-around;margin:30px 0;text-align:center;gap:15px"><div>Hazırlayan<br>Ad Soyad / İmza</div><div>Kontrol Eden<br>Ad Soyad / İmza</div><div>Onaylayan<br>Ad Soyad / İmza</div></div>';main.append(page);
const bar=page.querySelector('.sv2bar');const periods=el('select');[['1','İlk 15 Gün'],['2','Son 15 Gün'],['0','Tüm Ay']].forEach(([v,t])=>{const o=el('option',t);o.value=v;periods.append(o)});periods.value=String(state.period);periods.onchange=()=>{state.period=Number(periods.value);save();build()};
const tabs=el('select');[['0','Tüm Personel'],['1','SAY1'],['2','SAY2']].forEach(([v,l])=>{const o=el('option',l);o.value=v;tabs.append(o)});tabs.value=String(state.tab);tabs.onchange=()=>{state.tab=Number(tabs.value);warmAttempts=0;save();build()};
const units=el('select');const refreshUnits=()=>{const membership=memberships(),all=[...new Set(staff().map(p=>unit(p,membership)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'tr'));units.replaceChildren();for(const name of ['all',...all]){const o=el('option',name==='all'?'Tüm birimler':name);o.value=name;units.append(o)}units.value=all.includes(state.unit)?state.unit:'all';state.unit=units.value};refreshUnits();units.onchange=()=>{state.unit=units.value;save();build()};
const hide=el('button','İzin/Rapor sütunları: '+(state.hide?'Gizli':'Açık'));hide.onclick=()=>{state.hide=!state.hide;hide.textContent='İzin/Rapor sütunları: '+(state.hide?'Gizli':'Açık');save();build()};
const grouping=el('button',state.group?'✓ Birimlere göre ayrıldı':'Birimlere göre ayır');grouping.onclick=()=>{state.group=!state.group;grouping.textContent=state.group?'✓ Birimlere göre ayrıldı':'Birimlere göre ayır';save();build()};
const fullscreen=el('button','⛶ Tam ekran');fullscreen.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await page.requestFullscreen()}catch(e){console.warn('Tam ekran kullanılamıyor',e)}};
const printButton=el('button','🖨 V2 Yazdır');printButton.type='button';printButton.onclick=printV2;
// Saymanlık V2 etkinken sayfa dışındaki eski Yazdır düğmesi de V2 çıktısını üretir.
window.addEventListener('click',e=>{if(!page.classList.contains('active'))return;const b=e.target.closest?.('button,[role="button"]');if(!b)return;const name=[b.textContent,b.title,b.getAttribute('aria-label')].filter(Boolean).join(' ');if(!/yazdır|yazdir|print/i.test(name)||/toplu|paket/i.test(name))return;e.preventDefault();e.stopImmediatePropagation();printV2()},true);
const search=el('input');search.type='search';search.placeholder='Personel ara';search.setAttribute('aria-label','Personel ara');search.value=state.search||'';search.addEventListener('input',()=>{state.search=search.value;save();build()});
const refresh=el('button','↻ Verileri Yenile');refresh.onclick=()=>{warmAttempts=0;refreshUnits();build()};
const sortAlpha=el('button','A→Z Alfabetik sırala');sortAlpha.onclick=()=>{state.order=[];save();build()};
const resetSize=el('button','↺ Hücre boyutlarını sıfırla');resetSize.onclick=()=>{state.width=58;state.height=39;state.widths={};state.heights={};save();bar.querySelectorAll('input[type="range"]').forEach((input,i)=>{input.value=i===0?58:39});build()};
const back=el('button','Orijinal Saymanlıkta Düzenle');back.onclick=()=>{const original=[...side.querySelectorAll('button,.nav')].find(x=>/saymanlık/i.test(x.textContent)&&!/V2/i.test(x.textContent));if(original)original.click();else{page.classList.remove('active');document.getElementById('saymanlik')?.classList.add('active')}};
for(const [label,key,min,max] of [['Gün hücresi genişliği','width',42,110],['Tüm satırların yüksekliği','height',28,75]]){const wrap=el('label',label+' '),input=el('input');input.type='range';input.min=min;input.max=max;input.value=state[key];input.oninput=()=>{state[key]=Number(input.value);state[key==='width'?'widths':'heights']={};save();build()};wrap.append(input);bar.append(wrap)}
bar.prepend(tabs,periods,units,search,sortAlpha,grouping,hide,fullscreen,printButton,refresh,resetSize,back);
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
