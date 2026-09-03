'use strict';
let v11SelectedDate=v10DateOnly(),v11EditingRecId=null,v11BackupData=null;
function v11RoundStart(){const d=new Date();d.setMinutes(Math.ceil(d.getMinutes()/15)*15,0,0);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
$('#v11PlanStart').value=v11RoundStart();

function v11TaskScore(t){
  let score=0,reasons=[];
  if(isOverdue(t)){score+=120;reasons.push('gecikmiş')}
  if(Number(t.priority)===1){score+=55;reasons.push('yüksek öncelik')}
  if(isToday(t)){score+=45;reasons.push('bugün')}
  const dd=dDays(t.due_at);if(dd!==null&&dd>0&&dd<=3){score+=25+(4-dd)*5;reasons.push(dd+' gün içinde')}
  return {kind:'Görev',title:t.title,score,reasons,minutes:score>=120?25:20};
}
function v11PlanCandidates(){
  const out=tasks.filter(t=>!['done','archived'].includes(t.status)).map(v11TaskScore).filter(x=>x.score>0);
  projects.filter(p=>p.status==='active').forEach(p=>{const dd=dDays(p.due_date);let score=0,reasons=[];if(dd!==null&&dd<0){score+=90;reasons.push('hedef geçti')}else if(dd!==null&&dd<=7){score+=50;reasons.push('hedef '+Math.max(0,dd)+' gün içinde')}if(!p.next_action){score+=25;reasons.push('sonraki adım eksik')}if(score)out.push({kind:'Proje',title:p.title+(p.next_action?' → '+p.next_action:''),score,reasons,minutes:25})});
  vehicleSoonDays(14).forEach(v=>out.push({kind:'Araç',title:v.title,score:45,reasons:['14 gün içinde'],minutes:15}));
  const missing=RAD_UNITS.filter(u=>!radRows(currentMonth()).some(r=>r.unit===u));if(missing.length)out.push({kind:'Radyoloji',title:'Eksik aylık veri: '+missing.slice(0,4).join(', ')+(missing.length>4?'…':''),score:35+missing.length,reasons:['veri tamamlama'],minutes:15});
  return out.sort((a,b)=>b.score-a.score);
}
function v11TimeAdd(hm,mins){const [h,m]=hm.split(':').map(Number),d=new Date(2000,0,1,h,m+mins);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
function buildDailyPlanV11(){
  const total=Number($('#v11PlanMinutes').value||60),start=$('#v11PlanStart').value||v11RoundStart(),cands=v11PlanCandidates();let used=0,clock=start,focus=0,lines=[`${total} DAKİKALIK GÜNLÜK PLAN • ${start}`,''];let n=1;
  for(const c of cands){
    if(used>=total)break;
    if(focus>=50&&total-used>=10){const b=Math.min(5,total-used);lines.push(`${clock}–${v11TimeAdd(clock,b)}  ☕ Kısa mola`);clock=v11TimeAdd(clock,b);used+=b;focus=0}
    const block=Math.min(c.minutes,total-used);if(block<10)break;
    lines.push(`${clock}–${v11TimeAdd(clock,block)}  ${n}. ${c.kind}: ${c.title}`);
    if(c.reasons.length)lines.push(`   ↳ ${c.reasons.join(' • ')}`);
    clock=v11TimeAdd(clock,block);used+=block;focus+=block;n++;
  }
  if(n===1){lines.push(`${clock}–${v11TimeAdd(clock,total)}  Serbest odak / planlama`);used=total}
  if(used<total)lines.push(`${clock}–${v11TimeAdd(clock,total-used)}  Tamamlama / tampon süre`);
  lines.push('',`Planlanan süre: ${total} dk • Öncelik sırası mevcut YEA kayıtlarından hesaplandı.`);
  $('#v11PlanResult').textContent=lines.join('\n');return lines.join('\n');
}
$('#v11BuildPlan')?.addEventListener('click',buildDailyPlanV11);
$('#v11CopyPlan')?.addEventListener('click',async()=>{const t=$('#v11PlanResult').textContent;try{await navigator.clipboard.writeText(t);$('#v11CopyPlan').textContent='Kopyalandı';setTimeout(()=>$('#v11CopyPlan').textContent='Kopyala',1200)}catch{showMsg('#appMsg','Kopyalama kullanılamadı.')}});

function v11OpenQuick(date){v11SelectedDate=date;$('#v11QuickDateLabel').textContent=date+' tarihine görev ekle';$('#v11QuickTaskForm').classList.remove('hidden');$('#v11QuickTitle').focus()}
$('#calendarGrid')?.addEventListener('click',e=>{const b=e.target.closest('[data-cal-date]');if(b)v11OpenQuick(b.dataset.calDate)});
$('#v11QuickClose')?.addEventListener('click',()=>$('#v11QuickTaskForm').classList.add('hidden'));
$('#v11QuickTaskForm')?.addEventListener('submit',async e=>{e.preventDefault();const time=$('#v11QuickTime').value||'09:00',due=new Date(v11SelectedDate+'T'+time),mins=$('#v11QuickReminder').value,rem=mins===''?null:new Date(due.getTime()-Number(mins)*60000).toISOString();try{await api('/rest/v1/yea_tasks',{method:'POST',body:JSON.stringify({user_id:session.user.id,title:$('#v11QuickTitle').value.trim(),notes:$('#v11QuickNotes').value.trim()||null,priority:Number($('#v11QuickPriority').value),due_at:due.toISOString(),reminder_at:rem})});e.target.reset();$('#v11QuickTime').value='09:00';$('#v11QuickPriority').value='2';$('#v11QuickTaskForm').classList.add('hidden');await refreshData();$('#calendarMonth').value=v11SelectedDate.slice(0,7);renderCalendarV10();showMsg('#appMsg',v11SelectedDate+' tarihine görev eklendi.');setTimeout(()=>showMsg('#appMsg',''),1800)}catch(err){showMsg('#appMsg',err.message)}});

const baseRenderRecurringV11=renderRecurringV10;
renderRecurringV10=function(){baseRenderRecurringV11();document.querySelectorAll('#recurringList [data-rec-toggle]').forEach(b=>{if(!b.parentElement.querySelector('[data-rec-edit]'))b.insertAdjacentHTML('beforebegin',`<button type="button" class="v11EditBtn" data-rec-edit="${b.dataset.recToggle}">Düzenle</button>`)})};
function v11ResetRecEdit(){v11EditingRecId=null;$('#recCreateBtn').classList.remove('hidden');$('#recUpdateBtn').classList.add('hidden');$('#recCancelEditV11').classList.add('hidden');$('#recurringForm').reset();$('#recTime').value='09:00';$('#recPriority').value='2';$('#recStart').value=v10DateOnly();$('#recFrequency').dispatchEvent(new Event('change'))}
function v11FillRec(r){v11EditingRecId=r.id;$('#recTitle').value=r.title||'';$('#recFrequency').value=r.frequency||'daily';$('#recTime').value=String(r.time_of_day||'09:00').slice(0,5);$('#recPriority').value=String(r.priority||2);$('#recStart').value=r.start_date||v10DateOnly();$('#recEnd').value=r.end_date||'';$('#recWeekday').value=String(r.weekday??1);$('#recDay').value=String(r.day_of_month??1);$('#recReminder').value=String(r.reminder_minutes??0);$('#recNotes').value=r.notes||'';$('#recCreateBtn').classList.add('hidden');$('#recUpdateBtn').classList.remove('hidden');$('#recCancelEditV11').classList.remove('hidden');$('#recFrequency').dispatchEvent(new Event('change'));$('#recTitle').focus()}
$('#recurringList')?.addEventListener('click',e=>{const b=e.target.closest('[data-rec-edit]');if(!b)return;const r=recurring.find(x=>x.id===b.dataset.recEdit);if(r)v11FillRec(r)});
$('#recCancelEditV11')?.addEventListener('click',v11ResetRecEdit);
$('#recUpdateBtn')?.addEventListener('click',async()=>{const r=recurring.find(x=>x.id===v11EditingRecId);if(!r)return;const f=$('#recFrequency').value,p={title:$('#recTitle').value.trim(),notes:$('#recNotes').value.trim()||null,priority:Number($('#recPriority').value),frequency:f,weekday:f==='weekly'?Number($('#recWeekday').value):null,day_of_month:f==='monthly'?Number($('#recDay').value):null,time_of_day:$('#recTime').value,reminder_minutes:Number($('#recReminder').value),start_date:$('#recStart').value,end_date:$('#recEnd').value||null,updated_at:new Date().toISOString()};if(!p.title||!p.start_date)return;try{await api('/rest/v1/yea_recurring_tasks?id=eq.'+encodeURIComponent(r.id),{method:'PATCH',body:JSON.stringify(p)});v11ResetRecEdit();await refreshData();goto('recurring')}catch(err){showMsg('#appMsg',err.message)}});

const baseMakeBackupV11=makeBackup;
$('#exportBackup')?.removeEventListener('click',baseMakeBackupV11);$('#exportBackupSettings')?.removeEventListener('click',baseMakeBackupV11);
makeBackup=function(){download('YEA_Suite_Yedek_'+todayISO()+'.json',JSON.stringify({version:'1.1',exported_at:new Date().toISOString(),tasks,drafts,projects,radiology,finance,vehicles,recurring},null,2))};
$('#exportBackup')?.addEventListener('click',makeBackup);$('#exportBackupSettings')?.addEventListener('click',makeBackup);

function v11Arr(o,k){return Array.isArray(o?.[k])?o[k]:[]}
function v11BackupSummary(o,size){return `Yedek sürümü: ${o.version||'eski'}\nDosya: ${bytesLabel(size)}\n\nGörev: ${v11Arr(o,'tasks').length}\nTekrarlayan: ${v11Arr(o,'recurring').length}\nBelge: ${v11Arr(o,'drafts').length}\nProje: ${v11Arr(o,'projects').length}\nRadyoloji: ${v11Arr(o,'radiology').length}\nFinans: ${v11Arr(o,'finance').length}\nAraç: ${v11Arr(o,'vehicles').length}`}
$('#v11BackupFile')?.addEventListener('change',async e=>{const f=e.target.files?.[0];v11BackupData=null;$('#v11RestoreBtn').disabled=true;if(!f)return;if(f.size>5*1024*1024){$('#v11BackupPreview').textContent='Dosya 5 MB sınırını aşıyor.';return}try{const o=JSON.parse(await f.text());if(!o||typeof o!=='object')throw new Error('Geçersiz JSON');const total=['tasks','recurring','drafts','projects','radiology','finance','vehicles'].reduce((s,k)=>s+v11Arr(o,k).length,0);if(total>10000)throw new Error('Yedekte 10.000’den fazla kayıt var.');for(const d of v11Arr(o,'drafts'))if(enc.encode(String(d.content||'')).byteLength>102400)throw new Error('Bir belge 100 KB sınırını aşıyor.');v11BackupData=o;$('#v11BackupPreview').textContent=v11BackupSummary(o,f.size)+'\n\nDosya doğrulandı.';$('#v11RestoreBtn').disabled=false}catch(err){$('#v11BackupPreview').textContent='Yedek doğrulanamadı: '+err.message}});
$('#v11RestoreMode')?.addEventListener('change',()=>$('#v11RestoreMode').classList.toggle('v11RestoreModeDanger',$('#v11RestoreMode').value==='replace'));

function v11Sig(...v){return v.map(x=>String(x??'')).join('|')}
function v11CleanRows(o,mode){
  const mk=(arr,sig)=>new Set(arr.map(sig));
  const sets=mode==='merge'?{tasks:mk(tasks,x=>v11Sig(x.title,x.due_at,x.notes)),drafts:mk(drafts,x=>v11Sig(x.title,x.content)),projects:mk(projects,x=>v11Sig(x.title,x.due_date)),finance:mk(finance,x=>v11Sig(x.entry_date,x.entry_type,x.category,x.amount,x.note)),vehicles:mk(vehicles,x=>v11Sig(x.record_date,x.title,x.cost)),recurring:mk(recurring,x=>v11Sig(x.title,x.frequency,x.start_date,x.time_of_day))}:null;
  const uid=session.user.id,rows={};
  const hasRecurringBackup=v11Arr(o,'recurring').length>0;
  rows.tasks=v11Arr(o,'tasks').filter(x=>!(hasRecurringBackup&&x.source_recurring_id)).map(x=>({user_id:uid,title:String(x.title||'').slice(0,180),notes:x.notes?String(x.notes).slice(0,500):null,status:['open','done'].includes(x.status)?x.status:'open',due_at:x.due_at||null,reminder_at:x.reminder_at||null,priority:[1,2,3].includes(Number(x.priority))?Number(x.priority):2})).filter(x=>x.title&&(!sets||!sets.tasks.has(v11Sig(x.title,x.due_at,x.notes))));
  rows.drafts=v11Arr(o,'drafts').map(x=>({user_id:uid,title:String(x.title||'').slice(0,180),document_type:String(x.document_type||'free').slice(0,40),content:String(x.content||'')})).filter(x=>x.title&&(!sets||!sets.drafts.has(v11Sig(x.title,x.content))));
  rows.projects=v11Arr(o,'projects').map(x=>({user_id:uid,title:String(x.title||'').slice(0,180),category:String(x.category||'other').slice(0,30),status:['active','paused','done'].includes(x.status)?x.status:'active',progress:Math.min(100,Math.max(0,Number(x.progress||0))),next_action:x.next_action?String(x.next_action).slice(0,500):null,due_date:x.due_date||null})).filter(x=>x.title&&(!sets||!sets.projects.has(v11Sig(x.title,x.due_date))));
  rows.radiology=v11Arr(o,'radiology').map(x=>({user_id:uid,period:x.period,unit:x.unit,patient_count:Math.max(0,Number(x.patient_count||0)),request_count:Math.max(0,Number(x.request_count||0)),outage_days:Math.max(0,Number(x.outage_days||0)),note:x.note?String(x.note).slice(0,1000):null})).filter(x=>x.period&&RAD_UNITS.includes(x.unit));
  rows.finance=v11Arr(o,'finance').map(x=>({user_id:uid,entry_date:x.entry_date,entry_type:x.entry_type==='income'?'income':'expense',category:String(x.category||'other').slice(0,30),amount:Math.max(0,Number(x.amount||0)),payment_method:String(x.payment_method||'other').slice(0,30),note:x.note?String(x.note).slice(0,300):null})).filter(x=>x.entry_date&&(!sets||!sets.finance.has(v11Sig(x.entry_date,x.entry_type,x.category,x.amount,x.note))));
  rows.vehicles=v11Arr(o,'vehicles').map(x=>({user_id:uid,record_date:x.record_date,record_type:String(x.record_type||'other').slice(0,30),title:String(x.title||'').slice(0,160),odometer:x.odometer==null?null:Math.max(0,Number(x.odometer)),cost:Math.max(0,Number(x.cost||0)),next_due_date:x.next_due_date||null,next_due_km:x.next_due_km==null?null:Math.max(0,Number(x.next_due_km)),status:['open','planned','done'].includes(x.status)?x.status:'open',note:x.note?String(x.note).slice(0,400):null})).filter(x=>x.record_date&&x.title&&(!sets||!sets.vehicles.has(v11Sig(x.record_date,x.title,x.cost))));
  rows.recurring=v11Arr(o,'recurring').map(x=>({user_id:uid,title:String(x.title||'').slice(0,180),notes:x.notes?String(x.notes).slice(0,500):null,priority:[1,2,3].includes(Number(x.priority))?Number(x.priority):2,frequency:['daily','weekdays','weekly','monthly'].includes(x.frequency)?x.frequency:'daily',weekday:x.weekday==null?null:Number(x.weekday),day_of_month:x.day_of_month==null?null:Number(x.day_of_month),time_of_day:String(x.time_of_day||'09:00').slice(0,8),reminder_minutes:Math.max(0,Number(x.reminder_minutes||0)),start_date:x.start_date||todayISO(),end_date:x.end_date||null,is_active:x.is_active!==false})).filter(x=>x.title&&(!sets||!sets.recurring.has(v11Sig(x.title,x.frequency,x.start_date,x.time_of_day))));
  return rows;
}
async function v11Batch(path,rows,headers={}){for(let i=0;i<rows.length;i+=50)await api(path,{method:'POST',headers:{Prefer:'return=minimal',...headers},body:JSON.stringify(rows.slice(i,i+50))})}
async function v11DeleteAll(){const uid=encodeURIComponent(session.user.id);for(const table of ['yea_tasks','yea_document_drafts','yea_projects','yea_radiology_metrics','yea_finance_entries','yea_vehicle_records','yea_recurring_tasks'])await api('/rest/v1/'+table+'?user_id=eq.'+uid,{method:'DELETE',headers:{Prefer:'return=minimal'}})}
$('#v11RestoreBtn')?.addEventListener('click',async()=>{if(!v11BackupData||!session)return;const mode=$('#v11RestoreMode').value;if(mode==='replace'&&!confirm('Mevcut YEA kayıtların silinip bu yedekle değiştirilecek. Devam edilsin mi?'))return;$('#v11RestoreBtn').disabled=true;$('#v11BackupPreview').textContent+='\n\nGeri yükleniyor…';try{if(mode==='replace')await v11DeleteAll();const r=v11CleanRows(v11BackupData,mode);await v11Batch('/rest/v1/yea_tasks',r.tasks);await v11Batch('/rest/v1/yea_document_drafts',r.drafts);await v11Batch('/rest/v1/yea_projects',r.projects);if(r.radiology.length)await v11Batch('/rest/v1/yea_radiology_metrics?on_conflict=user_id,period,unit',r.radiology,{Prefer:'resolution=merge-duplicates,return=minimal'});await v11Batch('/rest/v1/yea_finance_entries',r.finance);await v11Batch('/rest/v1/yea_vehicle_records',r.vehicles);await v11Batch('/rest/v1/yea_recurring_tasks',r.recurring);await refreshData();$('#v11BackupPreview').textContent='✅ Geri yükleme tamamlandı.\n\n'+v11BackupSummary(v11BackupData,0);showMsg('#appMsg','Yedek geri yüklendi.');setTimeout(()=>showMsg('#appMsg',''),2000)}catch(err){$('#v11BackupPreview').textContent+='\n\n❌ '+err.message;showMsg('#appMsg',err.message)}finally{$('#v11RestoreBtn').disabled=false}});

const baseGotoV11=goto;goto=function(tab){baseGotoV11(tab);if(tab==='recurring')renderRecurringV10();if(tab==='today'&&!$('#v11PlanStart').value)$('#v11PlanStart').value=v11RoundStart()};
renderRecurringV10();