/* Targeted Saymanlık text-deduction and ŞUA hours refresh repair. */
(()=>{'use strict';
if(window.__RPYS_SAY_HAKEDIS_FIX_V4__)return;window.__RPYS_SAY_HAKEDIS_FIX_V4__=true;
const round2=n=>Math.round((Number(n)||0)*100)/100;
const norm=s=>String(s||'').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/\s+/g,' ').trim();
function monthKeyOf(r){let k=String(r?.monthKey||r?.month||'');if(/^\d{4}-\d{2}$/.test(k))return k;let key=String(r?._assignKey||'').split('|')[0];if(/^\d{4}-\d{2}$/.test(key))return key;let d=String(r?.date||r?.tarih||'').slice(0,10);if(/^\d{4}-\d{2}-\d{2}$/.test(d))return d.slice(0,7);return ''}
function numericHours(value){
 if(typeof value==='number')return Number.isFinite(value)?value:NaN;
 const text=String(value??'').trim();if(!text)return NaN;
 if(!/^\d+(?:[.,]\d{1,4})?$/.test(text))return NaN;return Number(text.replace(',','.'));
}
function shiftMinutes(shift){
 const m=String(shift||'').match(/(\d{1,2})[:.](\d{2})\s*[-–—]\s*(\d{1,2})[:.](\d{2})/);if(!m)return null;
 const [sh,sm,eh,em]=m.slice(1).map(Number);if(sh>23||sm>59||eh>24||em>59||(eh===24&&em!==0))return null;
 let minutes=eh*60+em-sh*60-sm;if(minutes<=0)minutes+=1440;return minutes;
}
function hoursOf(r){
 const shift=r?.col?.shift||r?.shift||(r?.start&&r?.end?`${r.start}-${r.end}`:'');
 const minutes=shiftMinutes(shift);if(minutes!==null)return minutes/60;
 const n=numericHours(r?.col?.hours??r?.hours??r?.saat);return Number.isFinite(n)&&n>=0&&n<=24?n:0;
}
function personMatches(r,p){
 const id=r?.person?.id??r?.personId??r?.pid;
 if(id!==undefined&&id!==null&&String(id)!=='')return String(id)===String(p.id);
 const name=r?.person?.name??r?.personName??r?.name??r?.adSoyad;
 try{return !!name&&personNameVariants(p).some(x=>norm(x)===norm(name))}catch{return !!name&&norm(name)===norm(p.name)}
}
function rawMonthRows(p,mk){
 const rows=[];
 for(const [key,pid] of Object.entries(db.assign||{})){
  const [monthKey,type,day,...parts]=key.split('|');if(monthKey!==mk||String(pid)!==String(p.id))continue;
  const base=typeof dutyColumnByKey==='function'?dutyColumnByKey(type,parts.join('|')):null;if(!base)continue;
  const meta=db.assignmentMeta?.[key]||{};rows.push({monthKey,type,day:Number(day),personId:pid,col:{...base,hours:meta.hours??base.hours,shift:meta.shift??base.shift}});
 }
 for(const r of db.importedRecords||[]){if(monthKeyOf(r)!==mk||!personMatches(r,p))continue;if(typeof isImportedShiftBlocked==='function'&&isImportedShiftBlocked(r))continue;rows.push(r)}
 return rows;
}
function localMonthHours(p,year,month){
 const mk=`${year}-${String(month+1).padStart(2,'0')}`;let rows;
 try{if(typeof allAssignmentsAllMonths==='function')rows=allAssignmentsAllMonths().filter(r=>monthKeyOf(r)===mk&&personMatches(r,p))}catch{}
 if(!rows?.length)rows=rawMonthRows(p,mk);
 const seen=new Set();let minutes=0;
 for(const r of rows){
  const date=String(r.date||`${mk}-${String(r.day).padStart(2,'0')}`).slice(0,10),shift=r.col?.shift||r.shift||'',unit=r.col?.unit||r.col?.key||r.unit||'',identity=JSON.stringify([date,r.type||'',unit,shift]);
  if(seen.has(identity))continue;seen.add(identity);minutes+=Math.round(hoursOf(r)*60);
 }
 return round2(minutes/60);
}
function hourKey(p,y,m){return `${y}-${String(m+1).padStart(2,'0')}|${p.id}`}
function monthBreakdown(p,y,m){
 const key=hourKey(p,y,m),local=localMonthHours(p,y,m),external=numericHours(db.sua?.externalHours420?.[key]??0),raw=db.sua?.monthHoursOverride420?.[key],override=numericHours(raw);
 const auto=round2(local+(Number.isFinite(external)?external:0));return {key,local,external:Number.isFinite(external)?external:0,override:Number.isFinite(override)?override:null,total:Number.isFinite(override)?override:auto,auto};
}
function monthHours(p,y,m){return monthBreakdown(p,y,m).total}
// The cloud renderer calls fmt(), but the original formatter is function-local elsewhere.
if(typeof window.fmt!=='function')window.fmt=n=>new Intl.NumberFormat('tr-TR',{maximumFractionDigits:2}).format(Number(n)||0);
const absent=new Set(['izin','sua','yillik','idari','mazeret','rapor','gecici','ketem','ketemgecici']);
function textAbsence(value){const t=String(value??'').trim();return !!t&&/[a-zçğıöşü]/i.test(t)&&!/^\s*\d{1,2}[:.]\d{2}\s*[-–—]/.test(t)}
function leaveFor(name,day){
 const p=(db.staff||[]).find(p=>p.name===name);if(!p)return null;const date=dateStr(Number(day));
 // Explicit leave records take precedence over stale imported/manual display values.
 return (db.leaves||[]).find(l=>String(l.personId)===String(p.id)&&l.start<=date&&l.end>=date&&!['saymanlik-status','excel-say-status'].includes(l.source))||null;
}
function leaveStatus(l){return l?(l.status||sayStatusFromText(l.type)||'izin'):''}
function calendarHours(date){const d=new Date(date+'T12:00:00'),w=d.getDay();if(w===0||w===6)return 0;if(typeof isHolidayDate==='function'&&isHolidayDate(date))return 0;return typeof isHalfHolidayDate==='function'&&isHalfHolidayDate(date)?5:7}
function absenceDates(p){
 const dates=new Set();for(let d=1;d<=daysInMonth();d++){
  const date=dateStr(d);if(!calendarHours(date))continue;
  const key=sayOverrideKey(p.name,d),text=db.sayCellOverrides?.[key],status=getCellStatus(p.name,d);
  const leave=(db.leaves||[]).some(l=>String(l.personId)===String(p.id)&&l.start<=date&&l.end>=date);
  const special=['gecici','ketem'].some(k=>(db.specialAssignments?.[k]||[]).some(r=>String(r.personId)===String(p.id)&&r.start<=date&&r.end>=date));
  if(leave||special||absent.has(status)||textAbsence(text))dates.add(date);
 }return dates;
}
const monthNames=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function editableHours(){try{if(typeof currentUser!=='undefined'&&(!currentUser||currentUser.role==='viewer'))return false;if(typeof userCan==='function'&&!userCan('sua'))return false;return true}catch{return false}}
function setMonthHours(pid,year,month,externalText,overrideText){
 if(!editableHours())throw Error('ŞUA saatlerini düzenleme yetkiniz yok.');
 const person=(db.staff||[]).find(p=>String(p.id)===String(pid));if(!person)throw Error('Personel bulunamadı.');
 if(!Number.isInteger(year)||year<2000||year>2100||!Number.isInteger(month)||month<0||month>11)throw Error('Ay/yıl geçersiz.');
 const limit=new Date(year,month+1,0).getDate()*24;
 const read=(text,optional)=>{if(String(text??'').trim()==='')return optional?null:0;const n=numericHours(text);if(!Number.isFinite(n)||n<0||n>limit)throw Error(`Saat 0–${limit} arasında olmalı. Örnek: 160 veya 160,5`);return round2(n)};
 const external=read(externalText,false),override=read(overrideText,true),key=hourKey(person,year,month);
 if(override!==null&&override<external)throw Error('Düzeltilmiş toplam, dış kurum saatinden az olamaz.');
 if(typeof pushUndoPoint==='function')pushUndoPoint('ŞUA aylık dış kurum / saat düzeltmesi');
 db.sua??={};db.sua.externalHours420??={};db.sua.monthHoursOverride420??={};
 if(external)db.sua.externalHours420[key]=external;else delete db.sua.externalHours420[key];
 if(override!==null)db.sua.monthHoursOverride420[key]=override;else delete db.sua.monthHoursOverride420[key];
 if(typeof logAction==='function')logAction(`ŞUA ${person.name} · ${year}-${String(month+1).padStart(2,'0')} · Dış kurum: ${external} saat · Toplam: ${override===null?'otomatik':override}`);
 if(typeof saveNowV245==='function')saveNowV245({label:'ŞUA aylık dış kurum ve saat düzeltmesi'});else save();
 refreshHours();
}
function openMonthHours(pid,year,month){
 if(!editableHours())return alert('ŞUA saatlerini düzenleme yetkiniz yok.');
 const person=(db.staff||[]).find(p=>String(p.id)===String(pid));if(!person)return;
 document.getElementById('suaMonthHours420')?.remove();const dialog=document.createElement('dialog');dialog.id='suaMonthHours420';
 const b=monthBreakdown(person,year,month);dialog.style.cssText='border:1px solid #b8c9dc;border-radius:14px;padding:24px;max-width:520px;width:92vw;color:#17365d';
 dialog.innerHTML=`<h3>${esc(person.name)} · ${monthNames[month]} ${year}</h3><p>RPYS kayıtlarından hesaplanan: <b>${window.fmt(b.local)} saat</b></p><form><label style="display:block">Dış kurumda çalışılan saat<input name="external" inputmode="decimal" value="${b.external||''}" placeholder="Örn. 160" style="display:block;width:100%;padding:10px;margin:6px 0 16px"></label><small>Dış kurum saati RPYS saatine eklenir.</small><label style="display:block;margin-top:18px">Düzeltilmiş aylık toplam (isteğe bağlı)<input name="override" inputmode="decimal" value="${b.override??''}" placeholder="Boş: RPYS + dış kurum" style="display:block;width:100%;padding:10px;margin:6px 0"></label><small>Kaynak ay hatalıysa doğru toplamı yazın. Boş bırakırsanız otomatik hesap kullanılır.</small><p data-error role="alert" style="color:#b42318"></p><button type="submit">Kaydet</button> <button type="button" data-auto>Otomatiğe dön</button> <button type="button" data-close>Vazgeç</button></form>`;
 document.body.append(dialog);const form=dialog.querySelector('form');
 form.onsubmit=e=>{e.preventDefault();try{setMonthHours(pid,year,month,form.elements.external.value,form.elements.override.value);dialog.close()}catch(error){dialog.querySelector('[data-error]').textContent=error.message}};
 dialog.querySelector('[data-auto]').onclick=()=>{form.elements.override.value='';form.elements.override.focus()};
 dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
}
function renderHours(people,year){
 const table=document.getElementById('suaHoursTable');if(!table)return;
 const rows=people.map(p=>{const months=monthNames.map((_,m)=>monthBreakdown(p,year,m)),total=round2(months.reduce((n,b)=>n+b.total,0)),days=typeof suaEntitlementDays==='function'?suaEntitlementDays(total):Math.min(30,Math.ceil(total/50));return {p,months,total,days}});
 const grand=round2(rows.reduce((n,r)=>n+r.total,0)),summary=document.getElementById('suaHoursSummary');
 if(summary)summary.innerHTML=`<div><b>${people.length}</b><span>Personel</span></div><div><b>${window.fmt(grand)}</b><span>Toplam Çalışma Saati</span></div><div><b>${window.fmt(people.length?grand/people.length:0)}</b><span>Kişi Başı Ortalama</span></div><div><b>${window.fmt(Math.max(0,...rows.map(r=>r.total)))}</b><span>En Yüksek Saat</span></div><p style="grid-column:1/-1">Ay hücresine tıklayarak dış kurum saati ekleyebilir veya hatalı aylık toplamı düzeltebilirsiniz. D: dış kurum eklendi · M: toplam elle düzeltildi.</p>`;
 table.innerHTML=`<thead><tr><th>#</th><th>İSİM</th>${monthNames.map(n=>`<th>${n.slice(0,3).toLocaleUpperCase('tr-TR')}</th>`).join('')}<th>YILLIK TOPLAM</th><th>HAK EDİLEN ŞUA</th><th>SONRAKİ GÜNE KALAN</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td class="stickyName"><b>${esc(r.p.name)}</b></td>${r.months.map((b,m)=>`<td><button type="button" data-sua-hours-pid="${esc(r.p.id)}" data-year="${year}" data-month="${m}" ${editableHours()?'':'disabled'} style="border:1px solid #c3d3e4;border-radius:5px;background:${b.override!==null?'#fff3cc':b.external?'#e8f5ef':'transparent'};color:inherit;padding:6px;min-width:48px" title="RPYS: ${window.fmt(b.local)} · Dış kurum: ${window.fmt(b.external)}${b.override!==null?' · Manuel toplam: '+window.fmt(b.override):''}">${window.fmt(b.total)}${b.override!==null?' <small>M</small>':b.external?' <small>D</small>':''}</button></td>`).join('')}<td class="suaHoursTotal"><b>${window.fmt(r.total)}</b></td><td class="suaEntitlement">${r.days} GÜN</td><td>${r.days>=30?'TAM':window.fmt(Math.max(0,(r.days?r.days*50+1:1)-r.total))+' saat'}</td></tr>`).join('')}</tbody>`;
 const stat=document.getElementById('suaStatHours');if(stat)stat.textContent=window.fmt(grand);
}
function refreshHours(){
 try{
  if(typeof suaPeople!=='function'||typeof renderSuaHours!=='function')return;
  _allAssignCache=null;_calcCache={};
  const year=Number(db?.sua?.year)||Number(ym().slice(0,4)),people=suaPeople();renderSuaHours(people,year);
  const stat=document.getElementById('suaStatHours');if(stat)stat.textContent=window.fmt(people.reduce((n,p)=>n+Array.from({length:12},(_,m)=>monthHours(p,year,m)).reduce((a,b)=>a+b,0),0));
 }catch(e){console.warn('RPYS ŞUA hakediş yenileme',e);const box=document.getElementById('suaHoursSummary');if(box)box.textContent='Hakediş tablosu hesaplanamadı: '+e.message}
}
function installHours(){
 if(typeof renderSuaHours==='function'&&renderSuaHours!==renderHours)renderSuaHours=renderHours;
 if(typeof suaHoursForPersonMonth==='function'&&!suaHoursForPersonMonth.__rpysHakFixV3){
  const wrapped=function(p,y,m){return monthHours(p,y,m)};wrapped.__rpysHakFixV3=true;suaHoursForPersonMonth=wrapped;
 }
 if(typeof suaTab==='function'&&!suaTab.__rpysHakFixV3){const old=suaTab;const wrapped=function(tab){const result=old.apply(this,arguments);if(tab==='hours')refreshHours();return result};wrapped.__rpysHakFixV3=true;suaTab=wrapped}
}
function persist(){_assignCache={};_allAssignCache=null;_calcCache={};_peopleCache=null;if(typeof saveNowV245==='function')saveNowV245({label:'Saymanlık metin ve takvim düşümü'});else save();renderAll()}
function editText(){
 if(!selectedSayCells.length)return;if(isMonthLocked())return alert('Bu ay kilitli.');
 const cells=[...new Map(selectedSayCells.map(el=>[sayOverrideKey(el.dataset.person,Number(el.dataset.day)),el])).values()];
 const first=cells[0],value=prompt(`Seçili ${cells.length} hücreye yazılacak metin / saat:`,sayData(first.dataset.person,Number(first.dataset.day)));if(value===null)return;
 const text=String(value).trim(),status=sayStatusFromText(text),reduce=textAbsence(text);
 const people=[...new Set(cells.map(el=>el.dataset.person))].map(n=>(db.staff||[]).find(p=>p.name===n)).filter(Boolean);
 const before=new Map(people.map(p=>[p.id,automaticObligation(p)]));
 pushUndoPoint('Saymanlık metin / takvim mükellef düşümü');db.sayTextObligation??={};db.cellStatus??={};db.sayCellOverrides??={};
 for(const el of cells){
  const n=el.dataset.person,d=Number(el.dataset.day),key=sayOverrideKey(n,d),sk=statusKey(n,d),oldText=db.sayCellOverrides[key];
  if(status){db.cellStatus[sk]=status;delete db.sayCellOverrides[key];delete db.sayTextObligation[key]}
  else{
   if(text)db.sayCellOverrides[key]=text;else delete db.sayCellOverrides[key];
   if(reduce){db.cellStatus[sk]='izin';db.sayTextObligation[key]=true}
   else{if(textAbsence(oldText)||db.sayTextObligation[key]||absent.has(db.cellStatus[sk]))delete db.cellStatus[sk];delete db.sayTextObligation[key]}
  }
  if(db.sayStatusCleared)delete db.sayStatusCleared[key];
 }
 people.forEach(p=>syncSayStatusesToLeavePage(p.name));
 // Existing explicit totals are adjusted only by this edit's delta, once per person.
 for(const p of people){const delta=automaticObligation(p)-before.get(p.id),ok=obligationKey(p.id),pk=puantajOverrideKey(p.id,'muk');
  if(db.obligationOverride?.[ok]!=null&&db.obligationOverride[ok]!=='')db.obligationOverride[ok]=Math.max(0,round2(Number(db.obligationOverride[ok])+delta));
  if(db.puantajOverride?.[pk]!=null&&db.puantajOverride[pk]!=='')db.puantajOverride[pk]=Math.max(0,round2(Number(db.puantajOverride[pk])+delta));
 }
 const menu=document.getElementById('cellContextMenu');if(menu)menu.style.display='none';persist();
}
function install(){
 installHours();
 if(typeof getCellStatus==='function'&&!getCellStatus.__rpysHakFixV3){const old=getCellStatus;const f=function(n,d){const l=leaveFor(n,d);return l?leaveStatus(l):old.apply(this,arguments)};f.__rpysHakFixV3=true;getCellStatus=f}
 if(typeof sayData==='function'&&!sayData.__rpysHakFixV3){const old=sayData;const f=function(n,d){const l=leaveFor(n,d);return l?String(l.type||sayStatusLabel(leaveStatus(l))).toLocaleUpperCase('tr-TR'):old.apply(this,arguments)};f.__rpysHakFixV3=true;sayData=f}
 if(typeof automaticObligation==='function'&&!automaticObligation.__rpysHakFixV3){const f=function(p){let base=0;for(let d=1;d<=daysInMonth();d++)base+=calendarHours(dateStr(d));return Math.max(0,round2(base-[...absenceDates(p)].reduce((n,ds)=>n+calendarHours(ds),0)))};f.__rpysHakFixV3=true;automaticObligation=f}
 if(typeof rawPuantajValue==='function'&&!rawPuantajValue.__rpysHakFixV3){const old=rawPuantajValue;const f=function(r,key){return key==='muk'?finalObligation(r.p):old.apply(this,arguments)};f.__rpysHakFixV3=true;rawPuantajValue=f}
 if(typeof editSelectedSayCellText==='function'&&editSelectedSayCellText!==editText)editSelectedSayCellText=editText;
}
window.rpysSayHakedis419={install,absenceDates,calendarHours,monthHours,localMonthHours,monthBreakdown,setMonthHours,openMonthHours,refreshHours,textAbsence};
window.rpysRefreshSuaHoursV1=refreshHours;
install();if(document.querySelector('#sua.page.active'))refreshHours();
window.addEventListener('rpys-direct-core-ready',()=>{install();if(document.querySelector('#sua.page.active'))refreshHours()});
document.addEventListener('click',e=>{const cell=e.target.closest?.('[data-sua-hours-pid]');if(cell){openMonthHours(cell.dataset.suaHoursPid,Number(cell.dataset.year),Number(cell.dataset.month));return}if(e.target.closest?.('.suaTabs [data-suatab="hours"]'))setTimeout(refreshHours,0)},true);
})();
