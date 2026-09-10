'use strict';
(()=>{
const $h=s=>document.querySelector(s),P=window.YeaHistoryParser;
let histImports=[],histRules={},histPreview=[],histLoadId=0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n||0).toLocaleString('tr-TR',{maximumFractionDigits:2});
const monthName=m=>['','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'][Number(m)]||m;
function msg(t,type=''){const e=$h('#histImportMsg');if(e){e.textContent=t||'';e.className='v17Msg '+type}}
function openHistory(){window.v13AppOpen('history');loadCloud()}
$h('#v17StartHistory')?.addEventListener('click',openHistory);$h('#v17TaskHistory')?.addEventListener('click',openHistory);$h('#tabs [data-tab="history"]')?.addEventListener('click',()=>setTimeout(loadCloud,0));
function workbookAdapter(wb){return {SheetNames:wb.SheetNames,toRows:name=>XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,raw:true,defval:'',blankrows:false})}}
async function readFiles(){
  if(!P)return msg('Geçmiş istatistik motoru yüklenemedi. Sayfayı yenileyin.','err');if(!window.XLSX)return msg('Excel motoru yüklenemedi. İnternet bağlantısını kontrol edin.','err');
  const files=[...($h('#histFiles')?.files||[])];if(!files.length)return msg('En az bir Excel veya CSV dosyası seçin.','warn');
  const opts={mode:$h('#histMode').value,defaultUnit:$h('#histDefaultUnit').value,year:$h('#histYearOverride').value,month:$h('#histMonthOverride').value};histPreview=[];msg('Dosyalar okunuyor…');
  for(const file of files){
    try{if(file.size>12*1024*1024)throw new Error('12 MB sınırını aşıyor');const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true,dense:false});const out=P.parseWorkbook(workbookAdapter(wb),opts,file.name);if(out.records.length>30000)throw new Error('30.000 kayıt sınırını aşıyor');histPreview.push({file,fileName:file.name,sourceType:opts.mode,records:out.records,sheets:out.sheets,warnings:out.warnings})}catch(e){histPreview.push({fileName:file.name,sourceType:opts.mode,records:[],sheets:[],warnings:[e.message||String(e)]})}
  }
  renderPreview();renderRules();$h('#histUpload').disabled=!histPreview.some(x=>x.records.length);
}
function renderPreview(){
  const box=$h('#histPreviewArea');if(!box)return;const total=histPreview.reduce((s,x)=>s+x.records.length,0),warn=histPreview.flatMap(x=>x.warnings||[]);
  box.innerHTML=`<div class="v17PreviewSummary"><span class="v17Chip">${histPreview.length} dosya</span><span class="v17Chip">${total.toLocaleString('tr-TR')} görev</span>${histPreview.map(x=>`<span class="v17Chip">${esc(x.fileName)} • ${x.records.length}</span>`).join('')}</div>${warn.length?`<div class="v17Msg warn">${warn.map(esc).join('<br>')}</div>`:''}`;
  msg(total?`${total.toLocaleString('tr-TR')} görev bulundu. Önizlemeyi kontrol edip Buluta Kaydet'e basın.`:'Dosyalarda görev bulunamadı. Yıl/ay veya dosya düzenini elle seçip tekrar deneyin.',total?'ok':'warn');
  const rows=histPreview.flatMap(x=>x.records.map(r=>({...r,fileName:x.fileName}))).slice(0,100);
  if(rows.length)box.insertAdjacentHTML('beforeend','<p>İlk '+rows.length+' kayıt: ad, tarih, birim ve saatleri kaydetmeden önce doğrulayın. Saat bulunamadığında tahmin yapılmaz.</p><div class="tablewrap"><table class="v17Table"><thead><tr><th>Personel</th><th>Tarih</th><th>Birim</th><th>Vardiya</th><th>Saat</th><th>Kaynak</th></tr></thead><tbody>'+rows.map(r=>'<tr>'+[r.person,r.date,r.unit,r.shift,r.hours||'Bilinmiyor',r.fileName+' / '+r.sheet+' / '+r.row+':'+r.col].map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>');
}
function previewClear(){histPreview=[];$h('#histFiles').value='';$h('#histUpload').disabled=true;$h('#histPreviewArea').innerHTML='';msg('');renderRules()}
async function sha(text){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function uploadPreview(){
  if(!histPreview.some(x=>x.records.length))return;const btn=$h('#histUpload');btn.disabled=true;msg('Kayıtlar güvenli bulut arşivine aktarılıyor…');let saved=0,skipped=0;
  try{for(const item of histPreview){if(!item.records.length)continue;const dates=item.records.map(x=>x.date).sort(),bodyText=JSON.stringify(item.records),hash=await sha(bodyText);try{await api('/rest/v1/yea_shift_imports',{method:'POST',body:JSON.stringify({user_id:session.user.id,file_name:item.fileName,source_type:item.sourceType||'auto',period_start:dates[0],period_end:dates.at(-1),record_count:item.records.length,content_hash:hash,records:item.records})});saved++}catch(e){if(/duplicate|unique|zaten/i.test(e.message||''))skipped++;else throw e}}
    previewClear();await loadCloud();msg(`${saved} dosya kaydedildi${skipped?`, ${skipped} mükerrer dosya atlandı`:''}.`,'ok');
  }catch(e){msg('Kaydetme başarısız: '+(e.message||e),'err')}finally{btn.disabled=!histPreview.some(x=>x.records.length)}
}
async function loadCloud(){
  if(!session?.user?.id)return;const owner=session.user.id,ticket=++histLoadId;
  try{const im=[];let count=0;for(let offset=0;;offset+=25){const batch=await api('/rest/v1/yea_shift_imports?select=id,file_name,source_type,period_start,period_end,record_count,records,created_at&order=id.asc&limit=25&offset='+offset);if(ticket!==histLoadId||session?.user?.id!==owner)return;if(!Array.isArray(batch))throw new Error('Geçersiz arşiv yanıtı');im.push(...batch);count+=batch.reduce((s,x)=>s+(x.records||[]).length,0);if(count>300000)throw new Error('Arşiv 300.000 kayıt sınırını aştı. Tam rapor için sunucu tarafı sorgu gerekiyor; kısmi sonuç gösterilmedi.');if(batch.length<25)break;}
    const ru=await api('/rest/v1/yea_shift_unit_rules?select=unit_name,category&order=unit_name.asc&limit=300');if(ticket!==histLoadId||session?.user?.id!==owner)return;histImports=im;histRules=Object.fromEntries((ru||[]).map(x=>[x.unit_name,x.category]));renderAllHistory();
  }catch(e){if(ticket===histLoadId)msg('Arşiv yenilenemedi; varsa önceki görünüm korunuyor: '+(e.message||e),'err')}
}
function allRecords(){return histImports.flatMap(i=>(i.records||[]).map(r=>({...r,importId:i.id,fileName:i.file_name}))) }
function allUnits(){return [...new Set([...allRecords(),...histPreview.flatMap(x=>x.records||[])].map(r=>P.canonicalUnit(r.unit)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'tr'))}
function renderRules(){const box=$h('#histUnitRules');if(!box||!P)return;const units=allUnits();box.innerHTML=units.length?units.map(u=>{const c=histRules[u]||P.defaultCategory(u);return `<label class="v17Rule"><b>${esc(u)}</b><select data-hist-unit="${esc(u)}"><option value="day" ${c==='day'?'selected':''}>Gündüzden say</option><option value="night" ${c==='night'?'selected':''}>Nöbetten say</option><option value="exclude" ${c==='exclude'?'selected':''}>Hesaba katma</option></select></label>`}).join(''):'<div class="empty">Önce Excel yükleyin.</div>'}
async function saveRule(unit,category){const control=[...document.querySelectorAll('[data-hist-unit]')].find(x=>x.dataset.histUnit===unit);if(control)control.disabled=true;try{await api('/rest/v1/yea_shift_unit_rules?on_conflict=user_id,unit_name',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:session.user.id,unit_name:unit,category,updated_at:new Date().toISOString()})});histRules[unit]=category;renderReports()}catch(e){msg('Birim ayarı kaydedilemedi; önceki kural korunuyor: '+(e.message||e),'err')}finally{renderRules()}}
function filters(){return {person:$h('#histPersonFilter').value,year:$h('#histYearFilter').value,month:$h('#histMonthFilter').value}}
function renderFilterOptions(){const records=allRecords(),people=[...new Set(records.map(x=>x.person))].sort((a,b)=>a.localeCompare(b,'tr')),years=[...new Set(records.map(x=>String(x.date).slice(0,4)))].sort().reverse(),p=$h('#histPersonFilter'),y=$h('#histYearFilter'),pv=p.value,yv=y.value;p.innerHTML='<option value="">Tüm personel</option>'+people.map(x=>`<option>${esc(x)}</option>`).join('');y.innerHTML='<option value="">Tüm yıllar</option>'+years.map(x=>`<option>${esc(x)}</option>`).join('');p.value=people.includes(pv)?pv:'';y.value=years.includes(yv)?yv:''}
function tdRow(x){return `<tr><td>${esc(x.person)}</td><td>${fmt(x.dayCount)}</td><td>${fmt(x.nightCount)}</td><td>${fmt(x.totalCount)}</td><td>${fmt(x.dayHours)}</td><td>${fmt(x.nightHours)}</td><td>${fmt(x.totalHours)}</td></tr>`}
function renderReports(){
  if(window.YeaHistoryPro){window.YeaHistoryPro.render();return;}
  if(!P)return;const out=P.aggregate(allRecords(),histRules,filters()),people=out.people.sort((a,b)=>b.totalCount-a.totalCount||a.person.localeCompare(b.person,'tr')),months=out.months.sort((a,b)=>b.month.localeCompare(a.month)||a.person.localeCompare(b.person,'tr'));
  $h('#histPeopleBody').innerHTML=people.length?people.map(tdRow).join(''):'<tr class="v17EmptyRow"><td colspan="7">Bu filtrede kayıt yok.</td></tr>';
  $h('#histMonthsBody').innerHTML=months.length?months.map(x=>`<tr><td>${esc(x.month)}</td><td>${esc(x.person)}</td><td>${fmt(x.dayCount)}</td><td>${fmt(x.nightCount)}</td><td>${fmt(x.totalCount)}</td><td>${fmt(x.totalHours)}</td></tr>`).join(''):'<tr class="v17EmptyRow"><td colspan="6">Aylık kayıt yok.</td></tr>';
  $h('#histReportInfo').innerHTML=`<span class="v17Chip">${out.recordCount.toLocaleString('tr-TR')} tekil görev</span><span class="v17Chip">${people.length} personel</span>${out.unknownHours?`<span class="v17Chip">${out.unknownHours} kayıtta saat bulunamadı</span>`:''}`;
  window.__YEA_HISTORY_REPORT={people,months,filters:filters(),generatedAt:new Date().toISOString()};
}
function renderStats(){const r=allRecords(),dates=r.map(x=>x.date).sort(),people=new Set(r.map(x=>x.person));$h('#histFileCount').textContent=histImports.length.toLocaleString('tr-TR');$h('#histRecordCount').textContent=r.length.toLocaleString('tr-TR');$h('#histPersonCount').textContent=people.size.toLocaleString('tr-TR');$h('#histPeriod').textContent=dates.length?dates[0].slice(0,7)+' → '+dates.at(-1).slice(0,7):'—'}
function renderImports(){const box=$h('#histImports');box.innerHTML=histImports.length?histImports.map(x=>`<div class="v17Import"><div><b>${esc(x.file_name)}</b><small>${esc(x.period_start)} → ${esc(x.period_end)} • ${Number(x.record_count||0).toLocaleString('tr-TR')} kayıt</small></div><span>${new Date(x.created_at).toLocaleDateString('tr-TR')}</span><button type="button" class="danger" data-hist-delete="${esc(x.id)}">Sil</button></div>`).join(''):'<div class="empty">Henüz arşiv dosyası yüklenmedi.</div>'}
function renderAllHistory(){renderStats();renderFilterOptions();renderRules();renderImports();renderReports()}
async function deleteImport(id){const x=histImports.find(a=>a.id===id);if(!x||!confirm(`${x.file_name} arşivden silinsin mi?\nBu işlem RPYS'yi etkilemez.`))return;try{await api('/rest/v1/yea_shift_imports?id=eq.'+encodeURIComponent(id),{method:'DELETE'});await loadCloud()}catch(e){msg('Dosya silinemedi: '+(e.message||e),'err')}}
function csvText(rows){const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';return '\ufeff'+rows.map(r=>r.map(q).join(';')).join('\r\n')}
function download(name,blob){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function exportCsv(){const r=window.__YEA_HISTORY_REPORT?.people||[],rows=[['Personel','Gündüz','Nöbet','Toplam Görev','Gündüz Saat','Nöbet Saat','Toplam Saat'],...r.map(x=>[x.person,x.dayCount,x.nightCount,x.totalCount,x.dayHours,x.nightHours,x.totalHours])];download('YEA_Gecmis_Istatistik_'+new Date().toISOString().slice(0,10)+'.csv',new Blob([csvText(rows)],{type:'text/csv;charset=utf-8'}))}
function exportXlsx(){if(!window.XLSX)return msg('Excel motoru yüklenemedi.','err');const r=window.__YEA_HISTORY_REPORT||{people:[],months:[]},wb=XLSX.utils.book_new(),a=r.people.map(x=>({'Personel':x.person,'Gündüz':x.dayCount,'Nöbet':x.nightCount,'Toplam Görev':x.totalCount,'Gündüz Saat':x.dayHours,'Nöbet Saat':x.nightHours,'Toplam Saat':x.totalHours})),b=r.months.map(x=>({'Ay':x.month,'Personel':x.person,'Gündüz':x.dayCount,'Nöbet':x.nightCount,'Toplam Görev':x.totalCount,'Toplam Saat':x.totalHours}));XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(a),'Kişi Toplamları');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(b),'Aylık Dağılım');XLSX.writeFile(wb,'YEA_Gecmis_Istatistik_'+new Date().toISOString().slice(0,10)+'.xlsx')}
$h('#histPreview')?.addEventListener('click',readFiles);$h('#histUpload')?.addEventListener('click',uploadPreview);$h('#histPreviewClear')?.addEventListener('click',previewClear);$h('#histUnitRules')?.addEventListener('change',e=>{const s=e.target.closest('[data-hist-unit]');if(s)saveRule(s.dataset.histUnit,s.value)});['#histPersonFilter','#histYearFilter','#histMonthFilter'].forEach(s=>$h(s)?.addEventListener('change',renderReports));$h('#histImports')?.addEventListener('click',e=>{const b=e.target.closest('[data-hist-delete]');if(b)deleteImport(b.dataset.histDelete)});$h('#histExportCsv')?.addEventListener('click',exportCsv);$h('#histExportXlsx')?.addEventListener('click',exportXlsx);
window.YeaHistoryBridge={snapshot:()=>({records:allRecords(),rules:{...histRules},imports:histImports.map(x=>({id:x.id,file_name:x.file_name})),userId:session?.user?.id||'guest'}),refresh:loadCloud};
setTimeout(()=>{if(!$h('#appView')?.classList.contains('hidden'))loadCloud()},1000);
})();
