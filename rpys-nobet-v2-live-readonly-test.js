/* Temporary RPYS Nöbet V2 in-app module. Reads RPYS data, never persists. */
(()=>{'use strict';if(window.__rpysV2LiveTest)return;window.__rpysV2LiveTest=true;
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let host,unit='all',draft=new Map(),history=[],selectedMonth='2026-12',last=[],dragKey=null;
function data(){try{return typeof db!=='undefined'?db:null}catch{return null}}
function fn(name){try{return typeof window[name]==='function'?window[name]:null}catch{return null}}
function monthDays(m){let [y,n]=m.split('-').map(Number);return new Date(y,n,0).getDate()}
function getPeople(){let d=data();let p=Array.isArray(d?.staff)?d.staff:Array.isArray(d?.people)?d.people:Array.isArray(d?.personnel)?d.personnel:[];return p.filter(x=>x&&x.id!=null)}
function person(id){try{let f=fn('getPersonById');if(f){let p=f(Number(id));if(p)return p.name||p.fullName||String(id)}}catch{}let p=getPeople().find(x=>String(x.id)===String(id));return p?.name||p?.fullName||p?.adSoyad||('Personel '+id)}
function overtimePreference(p){
 // Only read the actual Personnel page's matching staff row and overtime dropdown.
 const id=String(p.id),name=person(id).replace(/\\s+/g,' ').trim().toLocaleUpperCase('tr-TR');
 const valid=/^(?:0\\s*saat|\\d+\\s*[-–—]\\s*\\d+\\s*saat|\\d+\\s*\\+?\\s*saat)$/i;
 const roots=[...document.querySelectorAll('tr,[role="row"]')].filter(row=>!row.closest('#v2MotorPanel')&&!row.closest('#rpysV2Host'));
 for(const row of roots){
  const cells=[...row.children];
  if(!cells.length)continue;
  const first=(cells[0].textContent||'').replace(/\\s+/g,' ').trim().toLocaleUpperCase('tr-TR');
  if(!(first===name||first.startsWith(name+' ')||first.includes(name+' Ad Soyad')))continue;
  const selects=[...row.querySelectorAll('select')];
  for(const sel of selects){
   const opts=[...sel.options].map(o=>o.textContent.replace(/\\s+/g,' ').trim());
   if(opts.filter(x=>valid.test(x)).length<2)continue;
   const label=sel.selectedOptions?.[0]?.textContent?.replace(/\\s+/g,' ').trim()||'';
   if(valid.test(label))return label;
  }
 }
 return '—';
}
function getUnits(){let d=data();let pool=Object.keys(d?.unitPools||{}).filter(k=>k.startsWith(selectedMonth+'|')).map(k=>k.slice(8));let el=document.getElementById('autoUnit');let opts=el?[...el.options].map(o=>o.value).filter(Boolean):[];let known=['POLİKLİNİK RÖNTGEN','PORTABL + SKOPİ'];return [...new Set([...opts,...pool,...known])].filter(Boolean)}
function slots(){let f=fn('unitSlots');if(!f)throw Error('RPYS unitSlots fonksiyonu yüklenmedi.');let units=getUnits();let out=[];for(let u of units){let a;try{a=f(u)}catch{continue}if(!Array.isArray(a))continue;for(let s of a){if(!s?.col?.key)continue;out.push({unit:u,type:s.type,col:s.col,key:s.col.key})}}return out}
function makeKey(s,d){let f=fn('keyFor');if(!f)throw Error('RPYS keyFor fonksiyonu yüklenmedi.');/* keyFor reads the active RPYS month; never change it. */let active=fn('ym')?.();if(active!==selectedMonth)throw Error('Önce ana RPYS ay seçicisini '+selectedMonth+' olarak ayarlayın. Şu an: '+(active||'bilinmiyor')+'. Bu modül ana sistemin ayını değiştirmez.');return f(s.type,d,s.key)}
function applicable(s,d){let f=fn('isDutyCellApplicable');try{return f?!!f(s.type,s.col,d):true}catch{return false}}
function getRecords(){let d=data();if(!d)throw Error('RPYS oturumu/verileri yüklenmedi.');let all=slots().filter(s=>unit==='all'||s.unit===unit);let seen=new Set(),rows=[];for(let s of all){for(let day=1;day<=monthDays(selectedMonth);day++){if(!applicable(s,day))continue;let key=makeKey(s,day);if(seen.has(key))continue;seen.add(key);let pid=draft.has(key)?draft.get(key):d.assign?.[key];rows.push({key,day,unit:s.unit,type:s.type,col:s.col,pid:pid||'',original:d.assign?.[key]||'',locked:!!d.rpysCellLocks?.[key],manual:!!(d.manualDutyOverrides?.[key]||d.assignmentMeta?.[key]?.manual)})}}return rows}
function poolFor(u){let d=data(),pool=d?.unitPools?.[selectedMonth+'|'+u];return Array.isArray(pool)?pool.map(String):[]}
function stat(rows){let filled=rows.filter(x=>x.pid).length,locked=rows.filter(x=>x.locked).length,manual=rows.filter(x=>x.manual).length;let byDay=new Map(),clashes=0;for(let x of rows.filter(x=>x.pid)){let k=x.day+'|'+x.pid;byDay.set(k,(byDay.get(k)||0)+1)}for(let n of byDay.values())if(n>1)clashes+=n-1;return {filled,locked,manual,clashes}}
function mount(){if(!host){host=document.createElement('div');host.id='rpysV2Module';host.style.cssText='position:fixed;inset:0;z-index:2147483600;background:#edf3f9;color:#17365d;overflow:auto;font:14px system-ui,Arial';host.innerHTML=`<style>
#rpysV2Module *{box-sizing:border-box}#rpysV2Module .v2head{background:linear-gradient(100deg,#0b315b,#185c9d);color:white;padding:17px 22px;display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}#rpysV2Module .v2body{padding:16px;max-width:1900px;margin:auto}#rpysV2Module .v2box{background:white;border:1px solid #d9e4ef;border-radius:12px;padding:14px;margin-bottom:12px}#rpysV2Module .v2tools{display:flex;gap:10px;flex-wrap:wrap;align-items:center}#rpysV2Module button,#rpysV2Module select,#rpysV2Module input{font:inherit;padding:9px;border:1px solid #b8cbe0;border-radius:8px;background:white;color:#17365d}#rpysV2Module button{cursor:pointer}#rpysV2Module button.primary{background:#1766b3;color:white}#rpysV2Module .v2stats{display:flex;gap:10px;flex-wrap:wrap}#rpysV2Module .v2stats span{padding:10px;background:#eff5fc;border-radius:8px;min-width:120px}#rpysV2Module .v2scroll{max-height:68vh;overflow:auto}#rpysV2Module table{border-collapse:separate;border-spacing:0;min-width:950px;width:100%}#rpysV2Module th,#rpysV2Module td{border:1px solid #e0e8f2;padding:9px;min-width:150px;text-align:center}#rpysV2Module th{background:#164f8e;color:white;position:sticky;top:0;z-index:2}#rpysV2Module th:first-child,#rpysV2Module td:first-child{position:sticky;left:0;z-index:1;min-width:105px}#rpysV2Module th:first-child{z-index:3}#rpysV2Module td:first-child{background:#f1f6fd}#rpysV2Module td.cell{cursor:pointer}#rpysV2Module td.cell:hover{outline:2px solid #1379d4}#rpysV2Module td.locked{background:#eee8ff}#rpysV2Module td.manual{background:#eaf5ff}#rpysV2Module td.edited{background:#e7faeb}#rpysV2Module .v2warn{background:#fff4dc;padding:12px;border-radius:8px}#rpysV2Module .v2error{color:#a5212e;white-space:pre-wrap}#rpysV2Module .v2edit{position:fixed;inset:0;background:#001b3988;display:grid;place-items:center;z-index:20}#rpysV2Module .v2edit[hidden]{display:none}#rpysV2Module .v2dialog{background:white;border-radius:12px;padding:20px;width:min(430px,96vw)}#rpysV2Module .v2dialog>*{display:block;width:100%;margin:10px 0}#rpysV2Module .v2pill{font-size:12px;color:#657a93}
</style><div class="v2head"><div><h2 style="margin:0">RPYS · Nöbet Listesi V2 <small>GERÇEK VERİ TESTİ</small></h2><div>Bağımsız çalışma ekranı · mevcut kayıtlar korunur</div></div><button id="v2Close">✕ RPYS'ye dön</button></div><div class="v2body"><div class="v2box v2warn">Aralık 2026 için gerçek RPYS personeli, birimleri ve görev hücreleri kullanılır. Hücre değişiklikleri yalnızca bu geçici taslakta tutulur; veritabanına veya Saymanlık'a kaydedilmez. Otomatik dağıtım motoru henüz güvenli şekilde bağlanmadı.</div><div class="v2box v2tools"><label>Ay <input type="month" id="v2Month" value="2026-12"></label><label>Birim <select id="v2Unit"><option value="all">Tüm birimler</option></select></label><button id="v2Refresh">↻ Gerçek veriyi oku</button><button id="v2Undo">↶ Geri al</button><button id="v2Export">↓ Taslak JSON</button><button id="v2Motor" class="primary">⚙ Motor Kontrol Merkezi</button><button id="v2Full">⛶ Tam ekran</button></div><div class="v2box v2stats" id="v2Stats"></div><div class="v2box"><div id="v2Info"></div><div class="v2scroll" id="v2Table"></div></div></div><div class="v2edit" id="v2Edit" hidden><div class="v2dialog"><h3 id="v2EditTitle"></h3><label>Personel <select id="v2Person"></select></label><p class="v2pill" id="v2EditInfo"></p><button id="v2Apply" class="primary">Taslakta değiştir</button><button id="v2Cancel">İptal</button></div></div>`;document.body.appendChild(host);host.querySelector('#v2Close').onclick=()=>host.remove();host.querySelector('#v2Refresh').onclick=draw;host.querySelector('#v2Unit').onchange=e=>{unit=e.target.value;draw()};host.querySelector('#v2Month').onchange=e=>{selectedMonth=e.target.value;unit='all';draft.clear();history=[];draw()};host.querySelector('#v2Undo').onclick=()=>{if(history.length){draft=new Map(history.pop());draw()}};host.querySelector('#v2Full').onclick=()=>{let x=host.querySelector('.v2body');x.style.maxWidth=x.style.maxWidth==='none'?'1900px':'none'};host.querySelector('#v2Export').onclick=exportDraft;host.querySelector('#v2Motor').onclick=motor;host.querySelector('#v2Cancel').onclick=()=>host.querySelector('#v2Edit').hidden=true;}if(!host.isConnected)document.body.appendChild(host);draw()}
function draw(){if(!host?.isConnected)return;try{let rows=getRecords();last=rows;let units=[...new Set(slots().map(s=>s.unit))],sel=host.querySelector('#v2Unit');sel.innerHTML='<option value="all">Tüm birimler</option>'+units.map(u=>'<option value="'+E(u)+'">'+E(u)+'</option>').join('');sel.value=unit;if(sel.value!==unit){unit='all';sel.value='all'}let st=stat(rows);host.querySelector('#v2Stats').innerHTML=[['Gerçek personel',getPeople().length],['Görev hücresi',rows.length],['Dolu görev',st.filled],['Kilitli',st.locked],['Manuel',st.manual],['Aynı gün tekrar',st.clashes],['Taslak değişikliği',draft.size]].map(x=>'<span>'+x[0]+'<br><b style="font-size:21px">'+x[1]+'</b></span>').join('');let cols=[...new Map(rows.map(r=>[r.unit+'|'+r.type+'|'+r.col.key,{id:r.unit+'|'+r.type+'|'+r.col.key,label:r.unit+' · '+(r.col.name||r.col.label||r.col.key)}])).values()];host.querySelector('#v2Info').innerHTML='<p><b>'+E(selectedMonth)+'</b> · '+cols.length+' gerçek görev sütunu · <span class="v2pill">Boş hücreler dahil RPYS tanımlarından oluşturuldu. Hücreyi sürükleyip başka hücreye taşıyabilir veya sağ tık menüsünü kullanabilirsin.</span></p>';let map=new Map(rows.map(r=>[r.day+'|'+r.unit+'|'+r.type+'|'+r.col.key,r]));let html='<table><thead><tr><th>Tarih</th>'+cols.map(c=>'<th>'+E(c.label)+'</th>').join('')+'</tr></thead><tbody>';for(let day=1;day<=monthDays(selectedMonth);day++){html+='<tr><td>'+day+'.'+selectedMonth.split('-').reverse().join('.')+'</td>';for(let c of cols){let r=map.get(day+'|'+c.id);if(!r){html+='<td style="background:#f6f8fb">—</td>';continue}html+='<td class="cell '+(r.locked?'locked ':r.manual?'manual ':'')+(draft.has(r.key)?'edited':'')+'" data-key="'+E(r.key)+'">'+(r.locked?'🔒 ':r.manual?'✎ ':'')+(r.pid?E(person(r.pid)):'＋ Boş')+'</td>'}html+='</tr>'}host.querySelector('#v2Table').innerHTML=html+'</tbody></table>';host.querySelectorAll('td[data-key]').forEach(x=>{
 const row=last.find(r=>r.key===x.dataset.key);
 x.draggable=!!row&&!row.locked&&!row.manual&&!!row.pid;
 x.ondragstart=e=>{dragKey=x.dataset.key;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragKey)};
 x.ondragover=e=>{e.preventDefault();e.dataTransfer.dropEffect='move'};
 x.ondrop=e=>{e.preventDefault();const from=dragKey||e.dataTransfer.getData('text/plain');dragKey=null;moveDraft(from,x.dataset.key)};
 x.ondragend=()=>{dragKey=null};
 x.onclick=()=>edit(x.dataset.key);
 x.oncontextmenu=e=>{e.preventDefault();showCellMenu(x.dataset.key,e.clientX,e.clientY)};
});}catch(e){host.querySelector('#v2Stats').innerHTML='';host.querySelector('#v2Info').innerHTML='<p class="v2error">'+E(e.message)+'</p><p>RPYS ana ekranından Aralık 2026 ayını seçip yeniden deneyin.</p>';host.querySelector('#v2Table').innerHTML=''}}
function edit(key){let r=last.find(x=>x.key===key);if(!r)return;let box=host.querySelector('#v2Edit');box.hidden=false;host.querySelector('#v2EditTitle').textContent=r.day+'.12.2026 · '+r.unit+' · '+(r.col.name||r.col.key);let pool=poolFor(r.unit),people=getPeople();if(!pool.length)pool=people.map(p=>String(p.id));let options=people.filter(p=>pool.includes(String(p.id)));host.querySelector('#v2Person').innerHTML='<option value="">— Boş —</option>'+options.map(p=>'<option value="'+E(p.id)+'">'+E(person(p.id))+'</option>').join('');host.querySelector('#v2Person').value=String(r.pid||'');let protectedCell=r.locked||r.manual;host.querySelector('#v2Person').disabled=protectedCell;host.querySelector('#v2Apply').disabled=protectedCell;host.querySelector('#v2EditInfo').textContent=protectedCell?'Bu hücre kilitli veya manuel korunuyor; taslakta değiştirilemez.':'Yalnızca bu tarayıcı oturumundaki taslağı değiştirir.';host.querySelector('#v2Apply').onclick=()=>{if(protectedCell)return;const previous=new Map(draft);history.push([...draft]);draft.set(key,host.querySelector('#v2Person').value);const warnings=spouseWarnings(allUnitRecords());if(warnings.length&&!confirm('Eş nöbeti uyumsuzluğu:\\n'+warnings.slice(0,5).join('\\n')+'\\nYine de taslakta değiştirilsin mi?')){draft=previous;history.pop();return}box.hidden=true;draw()}}
function allUnitRecords(){const previous=unit;try{unit='all';return getRecords()}finally{unit=previous}}
function spouseId(id){const f=fn('spouseOf');if(!f)return null;try{return f(Number(id))||null}catch{return null}}
function spouseWarnings(rows){const warnings=[];const byId=new Map();for(const r of rows){if(!r.pid||Number(r.col.hours||0)<16)continue;let id=String(r.pid);if(!byId.has(id))byId.set(id,new Set());byId.get(id).add(r.day)}
 for(const [id,days] of byId){const partner=spouseId(id);if(!partner)continue;const theirs=byId.get(String(partner))||new Set();for(const day of days)if(!theirs.has(day))warnings.push(person(id)+' / '+person(partner)+': '+day+'. gün nöbetleri eşleşmiyor')}
 return [...new Set(warnings)];
}
function moveDraft(from,to){
 if(!from||!to||from===to)return;
 const rows=getRecords(),a=rows.find(r=>r.key===from),b=rows.find(r=>r.key===to);
 if(!a||!b||a.locked||a.manual||b.locked||b.manual)return alert('Kilitli veya elle korunan hücre taşınamaz.');
 if(!a.pid)return alert('Kaynak hücre boş.');
 const original=new Map(draft);
 history.push([...draft]);
 draft.set(a.key,b.pid||'');draft.set(b.key,a.pid||'');
 const now=getRecords(),status=fn('personStatusAt'),who=getPeople();
 const violations=[];
 for(const r of now.filter(r=>r.key===a.key||r.key===b.key)){
  if(!r.pid)continue;
  const p=who.find(x=>String(x.id)===String(r.pid));
  const date=selectedMonth+'-'+String(r.day).padStart(2,'0');
  try{if(!status||!p||String(status(p,date)).trim().toLocaleLowerCase('tr-TR')!=='aktif')violations.push(person(r.pid)+' izin/uygunluk doğrulanamadı')}catch(e){violations.push(e.message)}
  if(now.some(z=>z.key!==r.key&&z.day===r.day&&String(z.pid)===String(r.pid)))violations.push(person(r.pid)+' aynı gün başka görevde');
 }
 if(violations.length){draft=original;history.pop();return alert('Taşıma yapılmadı: '+[...new Set(violations)].join('; '))}
 const spouseIssues=spouseWarnings(allUnitRecords());if(spouseIssues.length&&!confirm('Eşlerin aynı gün nöbet kuralı bozuluyor:\\n'+spouseIssues.slice(0,5).join('\\n')+'\\nBu taslak değişikliğine özel izin verilsin mi?')){draft=original;history.pop();return}
 draw();
}
function showCellMenu(key,x,y){
 host.querySelector('#v2CellMenu')?.remove();
 const r=getRecords().find(z=>z.key===key);if(!r)return;
 const menu=document.createElement('div');menu.id='v2CellMenu';
 menu.style.cssText='position:fixed;z-index:9999;left:'+Math.max(4,Math.min(x,window.innerWidth-285))+'px;top:'+Math.max(4,Math.min(y,window.innerHeight-250))+'px;width:280px;max-height:80vh;overflow:auto;background:white;border:1px solid #b8cbe0;border-radius:10px;padding:8px;box-shadow:0 8px 25px #17365d55';
 const options=[['eligible','O Güne Uygun Personeli Bul'],['edit','Personeli Değiştir'],['clear','Hücreyi Boşalt (taslak)'],['close','Kapat']];
 menu.innerHTML=options.map(([id,label])=>'<button data-menu="'+id+'" style="display:block;width:100%;text-align:left;margin:3px 0">'+E(label)+'</button>').join('');
 host.appendChild(menu);
 menu.querySelectorAll('[data-menu]').forEach(b=>b.onclick=()=>{
  const action=b.dataset.menu;menu.remove();
  if(action==='eligible')showEligible(key,x,y);
  if(action==='edit')edit(key);
  if(action==='clear'){if(r.locked||r.manual)return alert('Korunan hücre değiştirilemez');history.push([...draft]);draft.set(key,'');draw()}
 });
}
function eligibleForCell(key){
 const r=getRecords().find(x=>x.key===key);if(!r)return {error:'Hücre bulunamadı'};
 const people=getPeople(),pool=poolFor(r.unit),month=selectedMonth,date=month+'-'+String(r.day).padStart(2,'0');
 const status=fn('personStatusAt'),dateFn=fn('dateStr');
 if(!status)return {error:'RPYS izin denetimi yüklenmedi'};
 const d=data(),assignments=getRecords(),kind=Number(r.col.hours||0)>=16?'night':'day',names=[];
 const targetPanel=host.querySelector('#v2MotorPanel');
 const before=targetPanel?.querySelector('#v2BeforeLeave')?.checked===true;
 const rest=targetPanel?.querySelector('#v2Rest')?.checked!==false;
 const candidateIds=targetPanel?[...targetPanel.querySelectorAll('[data-select]')].filter(x=>x.checked).map(x=>x.dataset.select):pool;
 for(const p of people.filter(p=>candidateIds.includes(String(p.id)))){
  const id=String(p.id);
  try{
   const active=(day)=>String(status(p,dateFn?dateFn(day):month+'-'+String(day).padStart(2,'0'))||'').trim().toLocaleLowerCase('tr-TR')==='aktif';
   if(!active(r.day))continue;
   if(before&&r.day<monthDays(month)&&!active(r.day+1))continue;
   const conflict=assignments.some(x=>x.key!==key&&String(x.pid)===id&&x.day===r.day);
   if(conflict)continue;
   if(rest&&r.day>1&&assignments.some(x=>String(x.pid)===id&&x.day===r.day-1&&Number(x.col.hours||0)>=16))continue;
   const input=targetPanel?.querySelector('[data-'+kind+'="'+id+'"]');
   if(input){let target=Number(input.value||0),assigned=assignments.filter(x=>String(x.pid)===id&&(Number(x.col.hours||0)>=16?'night':'day')===kind).length;if(assigned>=target)continue}
   names.push(person(id));
  }catch(e){return {error:'İzin kontrolü başarısız: '+e.message}}
 }
 return {names,date,unit:r.unit};
}
function showEligible(key,x,y){
 const info=eligibleForCell(key),old=host.querySelector('#v2EligiblePopup');old?.remove();
 const popup=document.createElement('div');popup.id='v2EligiblePopup';popup.style.cssText='position:fixed;z-index:9999;left:'+Math.min(x,window.innerWidth-330)+'px;top:'+Math.min(y,window.innerHeight-320)+'px;width:310px;max-height:300px;overflow:auto;background:white;color:#17365d;border:1px solid #7b9dbb;border-radius:10px;box-shadow:0 8px 30px #17365d55;padding:12px';
 popup.innerHTML='<div style="display:flex;justify-content:space-between"><b>Uygun personeller · '+E(info.date||'')+'</b><button id="v2PopupClose" style="padding:2px 8px">✕</button></div>'+(info.error?'<p>'+E(info.error)+'</p>':info.names.length?'<ol>'+info.names.map(n=>'<li>'+E(n)+'</li>').join('')+'</ol>':'<p>Bu kontrollerle uygun personel bulunamadı.</p>')+'<small>İzin, aynı gün çakışması, dinlenme ve girilmiş hedefler dikkate alınır. Saatleri farklı çift görev ve diğer aylar henüz doğrulanmadı.</small>';
 host.appendChild(popup);popup.querySelector('#v2PopupClose').onclick=()=>popup.remove();
}
function motor(){try{
const rows=getRecords(),people=getPeople(),existing=host.querySelector('#v2MotorPanel');existing?.remove();
if(unit==='all')throw Error('Dağıtım için önce tek bir birim seç. Tüm birimler görünümü yalnızca listeleme içindir.');
const pool=poolFor(unit);if(!pool.length)throw Error('Bu birim için RPYS personel havuzu boş. Önce mevcut RPYS içinde birim personellerini seç.');
const members=people.filter(p=>pool.includes(String(p.id)));
const p=document.createElement('section');p.id='v2MotorPanel';p.className='v2box';
p.innerHTML='<h2>⚙ Nöbet V2 · Yeni Bağımsız Dağıtım Motoru</h2><div class="v2warn">Deneysel motor v0.2: seçilen hedeflere göre tam veya kısmi önizleme üretir. İzin şeması, vardiya saatleri ve özel Skopi kuralları henüz tam doğrulanmadı. Bu sonuçlar canlı kullanıma hazır değildir.</div><p><b>Birim:</b> '+E(unit)+' · <b>Ay:</b> '+E(selectedMonth)+' · <b>Havuz:</b> '+members.length+' personel</p><div class="v2scroll"><table id="v2TargetTable"><thead><tr><th>Seç</th><th>Personel</th><th>Fazla mesai tercihi (RPYS)</th><th>Gündüz hedefi</th><th>Nöbet hedefi</th></tr></thead><tbody>'+members.map(x=>'<tr><td><input type="checkbox" data-select="'+E(x.id)+'" checked></td><td>'+E(person(x.id))+'</td><td>'+E(overtimePreference(x))+'</td><td><input type="number" data-day="'+E(x.id)+'" min="0" max="100" value="0" style="width:85px"></td><td><input type="number" data-night="'+E(x.id)+'" min="0" max="100" value="0" style="width:85px"></td></tr>').join('')+'</tbody></table></div><div class="v2tools" style="margin-top:12px"><label><input type="checkbox" id="v2BeforeLeave" checked> İzin öncesi boşluk</label><label><input type="checkbox" id="v2Rest" checked> 16 saat sonrası dinlenme</label><label><input type="checkbox" id="v2Double"> Saatleri çakışmayan aynı gün çift görev</label></div><div class="v2tools" style="margin-top:12px"><button id="v2Equal">Hedefleri eşit öner</button><button id="v2Solve" class="primary">▶ Yeni motorla dağıt (önizleme)</button></div><div id="v2SolveResult" style="margin-top:12px"></div>';
host.querySelector('.v2body').insertBefore(p,host.querySelector('#v2Stats'));
const kind=r=>Number(r.col.hours||0)>=16?'night':'day';
const editable=rows.filter(r=>!r.locked&&!r.manual);
const totals={day:editable.filter(r=>kind(r)==='day').length,night:editable.filter(r=>kind(r)==='night').length};
function availabilityFor(ids){
 const all=data(),month=selectedMonth,statusFn=fn('personStatusAt'),dateFn=fn('dateStr'),people=getPeople(),errors=[],result={};
 if(!statusFn)throw Error('RPYS personStatusAt uygunluk denetimi bulunamadı; izinli personele görev vermemek için işlem durduruldu.');
 for(const id of ids){
  const who=people.find(x=>String(x.id)===String(id)),blocked=new Set();
  if(!who){errors.push(person(id)+': personel bulunamadı');continue}
  for(let d=1;d<=monthDays(month);d++){
   const date=month+'-'+String(d).padStart(2,'0');
   try{const status=String(statusFn(who,dateFn?dateFn(d):date)||'').trim();if(!status){errors.push(person(id)+': '+date+' durum bilgisi boş');break}if(status.toLocaleLowerCase('tr-TR')!=='aktif')blocked.add(date)}
   catch(e){errors.push(person(id)+': '+date+' '+e.message);break}
  }
  for(const l of all.leaves||[]){
   if(String(l.personId??l.idPerson??l.person?.id??'')!==String(id))continue;
   const a=String(l.start||''),b=String(l.end||'');
   if(!/^\d{4}-\d{2}-\d{2}$/.test(a)||!/^\d{4}-\d{2}-\d{2}$/.test(b))continue; // legacy formats: authoritative personStatusAt remains in force
   for(let d=1;d<=monthDays(month);d++){const date=month+'-'+String(d).padStart(2,'0');if(date>=a&&date<=b)blocked.add(date)}
  }
  result[id]=blocked;
 }
 if(errors.length)throw Error('Personel izin uygunluğu doğrulanamadı: '+errors.slice(0,5).join('; '));
 return result;
}
p.querySelector('#v2Equal').onclick=()=>{try{
 const ids=members.filter(x=>p.querySelector('[data-select="'+x.id+'"]').checked).map(x=>String(x.id));
 if(!ids.length)throw Error('Personel seç.');
 const blocked=availabilityFor(ids),before=p.querySelector('#v2BeforeLeave').checked;
 const next=(date,n)=>{let x=new Date(date+'T12:00:00');x.setDate(x.getDate()+n);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')};
 const eligible={};for(const id of ids){let set=new Set(blocked[id]);if(before)for(const date of blocked[id])set.add(next(date,-1));eligible[id]=set}
 const assigned=Object.fromEntries(ids.map(id=>[id,{day:0,night:0}]));
 const byKind={day:editable.filter(r=>kind(r)==='day'),night:editable.filter(r=>kind(r)==='night')};
 const unfilled=[];
 for(const t of ['day','night']){
  const slots=byKind[t].slice().sort((a,b)=>ids.filter(id=>!eligible[id].has(selectedMonth+'-'+String(a.day).padStart(2,'0'))).length-ids.filter(id=>!eligible[id].has(selectedMonth+'-'+String(b.day).padStart(2,'0'))).length);
  for(const row of slots){
   const date=selectedMonth+'-'+String(row.day).padStart(2,'0');
   const candidates=ids.filter(id=>!eligible[id].has(date)).sort((a,b)=>assigned[a][t]-assigned[b][t]||a.localeCompare(b));
   if(!candidates.length){unfilled.push(date+' '+t);continue}
   assigned[candidates[0]][t]++;
  }
 }
 for(const id of ids)for(const t of ['day','night'])p.querySelector('[data-'+t+'="'+id+'"]').value=assigned[id][t];
 p.querySelector('#v2SolveResult').textContent='İzin uygunluğuna göre hedef önerildi. '+(unfilled.length?'Uygun personel bulunamayan '+unfilled.length+' hücre var. ':'')+'Bu yalnızca hedef önerisidir; kesin dağıtım ve dinlenme kontrolleri dağıtım sırasında yapılır.';
}catch(e){p.querySelector('#v2SolveResult').textContent='⚠ '+e.message}};
p.querySelector('#v2Solve').onclick=()=>{try{
if(!window.RPYSV2Independent)throw Error('Bağımsız motor dosyası yüklenmedi.');
const ids=members.filter(x=>p.querySelector('[data-select="'+x.id+'"]').checked).map(x=>String(x.id));if(!ids.length)throw Error('En az bir personel seç.');
const targets={};for(let id of ids){let day=Number(p.querySelector('[data-day="'+id+'"]').value),night=Number(p.querySelector('[data-night="'+id+'"]').value);if(!Number.isInteger(day)||!Number.isInteger(night)||day<0||night<0)throw Error('Hedefler negatif olmayan tam sayı olmalı.');targets[id]={day,night}}
const all=data(),month=selectedMonth;
const fixed=rows.filter(r=>r.locked||r.manual).filter(r=>r.pid).map(r=>({key:r.key,id:r.pid,kind:kind(r),date:month+'-'+String(r.day).padStart(2,'0'),selected:true}));
const other=Object.entries(all.assign||{}).filter(([key,id])=>key.startsWith(month+'|')&&id&&!rows.some(r=>r.key===key)).map(([key,id])=>{let z=key.split('|');return {key,id,date:month+'-'+String(Number(z[2])).padStart(2,'0'),selected:false}});
const blocked=availabilityFor(ids),leaves=ids.map(id=>({id,days:[...blocked[id]]}));
const polCols=[...new Set(rows.map(r=>r.col.key))];const slots=editable.map(r=>({key:r.key,date:month+'-'+String(r.day).padStart(2,'0'),kind:kind(r),hours:Number(r.col.hours||0),allowed:ids,rotation:unit.toLocaleUpperCase('tr-TR').includes('POL')?{column:polCols.indexOf(r.col.key),columns:polCols.length,week:Math.floor((r.day-1+(new Date(Number(month.slice(0,4)),Number(month.slice(5,7))-1,1).getDay()+6)%7)/7),order:ids}:null}));
const output=window.RPYSV2Independent.solve({slots,staff:ids.map(id=>({id})),targets,existing:[...fixed,...other],leaves,options:{beforeLeave:p.querySelector('#v2BeforeLeave').checked,rest16:p.querySelector('#v2Rest').checked,noConsecutive:false,allowDifferentHours:p.querySelector('#v2Double').checked}});
if(!output.ok)throw Error(output.error);
history.push([...draft]);for(let r of editable)draft.set(r.key,'');for(let [key,id] of output.assignments)if(editable.some(r=>r.key===key))draft.set(key,id);const spouseIssues=spouseWarnings(getRecords());if(spouseIssues.length){draft=new Map(history.pop());throw Error('Eş nöbeti kuralı sağlanamadı; taslak uygulanmadı: '+spouseIssues.slice(0,6).join('; '))}
p.querySelector('#v2SolveResult').innerHTML='<p style="color:#16743e"><b>✓ '+(output.assignments.length)+' atama içeren '+(output.complete?'tam':'kısmi')+' önizleme.</b> '+output.nodes+' arama adımı. Kaydedilmedi.</p><p><b>Boş kalan:</b> '+output.unfilled.length+' · <b>Hedef sapması:</b> '+output.differences.length+'</p><p>'+E(output.reasons.join(' | '))+'</p><p>Sonuçları görmek için üstteki çizelgeye dön veya aşağıdaki listeyi incele.</p><div class="v2scroll"><table><tr><th>Tarih</th><th>Görev</th><th>Personel</th></tr>'+editable.map(r=>'<tr><td>'+r.day+'.12.2026</td><td>'+E(r.col.name||r.col.key)+'</td><td>'+(draft.get(r.key)?E(person(draft.get(r.key))):'— BOŞ —')+'</td></tr>').join('')+'</table></div>';draw();
}catch(e){p.querySelector('#v2SolveResult').textContent='⚠ '+e.message}};
p.scrollIntoView({behavior:'smooth',block:'start'});
}catch(e){alert('Motor açılamadı: '+e.message)}}
function exportDraft(){let payload={test:true,month:selectedMonth,changes:[...draft].map(([key,pid])=>({key,pid}))};let blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='RPYS_NOBET_V2_GECICI_TASLAK.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function init(){if(document.getElementById('rpysV2Launch'))return;let page=document.getElementById('nobet');if(!page)return;let b=document.createElement('button');b.id='rpysV2Launch';b.type='button';b.textContent='📅 Nöbet Listesi V2 · Ayrı Modül';b.style.cssText='background:#1559a0;color:white;border:0;border-radius:9px;padding:12px 16px;margin:10px;cursor:pointer';b.onclick=mount;page.insertBefore(b,page.firstChild)}
let count=0,t=setInterval(()=>{init();if(document.getElementById('rpysV2Launch')||++count>90)clearInterval(t)},1000);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();