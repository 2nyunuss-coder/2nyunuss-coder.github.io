'use strict';
function dDays(dateValue){
  if(!dateValue)return null;
  const now=new Date(); now.setHours(0,0,0,0);
  const d=new Date(String(dateValue).length===10?dateValue+'T23:59:59':dateValue);
  return Math.ceil((d-now)/86400000);
}
function decisionCriticalTaskRows(){
  return tasks.filter(t=>t.status!=='done'&&t.status!=='archived').map(t=>{
    let score=0; const reasons=[];
    if(isOverdue(t)){score+=100;reasons.push('gecikmiş')}
    if(Number(t.priority)===1){score+=45;reasons.push('yüksek öncelik')}
    if(isToday(t)){score+=30;reasons.push('bugün')}
    const dd=dDays(t.due_at);
    if(dd!==null&&dd>0&&dd<=3){score+=20+(4-dd)*4;reasons.push(dd+' gün içinde')}
    return {t,score,reasons};
  }).filter(x=>x.score>=30).sort((a,b)=>b.score-a.score);
}
function decisionProjectRows(){
  return projects.filter(p=>p.status==='active').map(p=>{
    let score=0;const reasons=[];const dd=dDays(p.due_date);
    if(dd!==null&&dd<0){score+=80;reasons.push('hedef tarihi geçti')}
    else if(dd!==null&&dd<=7){score+=45;reasons.push('hedef '+Math.max(0,dd)+' gün içinde')}
    if(!p.next_action){score+=35;reasons.push('sonraki adım boş')}
    if(Number(p.progress||0)<25){score+=10;reasons.push('ilerleme düşük')}
    return {p,score,reasons};
  }).sort((a,b)=>b.score-a.score);
}
function decisionMissingRadUnits(month=currentMonth()){
  const rows=radTotals(month).rows;
  return RAD_UNITS.filter(u=>!rows.some(r=>r.unit===u));
}
function decisionRadFlags(){
  const cur=radTotals(currentMonth()),prev=radTotals(prevMonth(currentMonth())),flags=[];
  for(const r of cur.rows){
    if(Number(r.outage_days||0)>0)flags.push(`${r.unit}: ${Number(r.outage_days)} gün kesinti kaydı var.`);
    if(Number(r.patient_count||0)===0&&Number(r.request_count||0)===0)flags.push(`${r.unit}: hasta ve istem 0; veri gerçekten 0 mı kontrol et.`);
    const p=prev.rows.find(x=>x.unit===r.unit);
    if(p&&Number(p.request_count||0)>0){
      const diff=(Number(r.request_count||0)-Number(p.request_count||0))/Number(p.request_count||0);
      if(Math.abs(diff)>=0.4)flags.push(`${r.unit}: istem sayısı önceki aya göre ${(diff*100).toFixed(0)}% değişmiş; veri ve operasyonu kontrol et.`);
    }
  }
  return flags;
}
function decisionFinanceFlags(){
  const rows=finance.filter(x=>x.entry_type==='expense'&&String(x.entry_date).slice(0,7)===currentMonth());
  if(!rows.length)return [];
  const vals=rows.map(x=>Number(x.amount||0)).sort((a,b)=>a-b);
  const mid=Math.floor(vals.length/2);
  const median=vals.length%2?vals[mid]:(vals[mid-1]+vals[mid])/2;
  const avg=vals.reduce((s,x)=>s+x,0)/vals.length;
  const threshold=Math.max(median*2.5,avg*2,1);
  return rows.filter(x=>Number(x.amount||0)>threshold).sort((a,b)=>Number(b.amount)-Number(a.amount)).map(x=>({
    row:x,why:`${fmtMoney(x.amount)}; bu ayki gider ortalamasının belirgin üzerinde`
  }));
}
function decisionVehicleFlags(){
  const now=new Date();now.setHours(0,0,0,0);
  const soon=new Date(now.getTime()+30*86400000);
  const overdue=[],upcoming=[];
  for(const v of vehicles.filter(x=>x.status!=='done'&&x.status!=='archived')){
    if(v.next_due_date){
      const d=new Date(v.next_due_date+'T23:59:59');
      if(d<now)overdue.push(v);
      else if(d<=soon)upcoming.push(v);
    }
  }
  overdue.sort((a,b)=>String(a.next_due_date).localeCompare(String(b.next_due_date)));
  upcoming.sort((a,b)=>String(a.next_due_date).localeCompare(String(b.next_due_date)));
  return {overdue,upcoming};
}
function decisionCounts(){
  const critical=decisionCriticalTaskRows();
  const missing=decisionMissingRadUnits();
  const fin=decisionFinanceFlags();
  const projectFlags=decisionProjectRows().filter(x=>x.score>=35);
  return {critical,missing,fin,projectFlags};
}
function renderDecisionDashboard(){
  const box=document.querySelector('#decisionCriticalTasks');if(!box)return;
  const c=decisionCounts();
  box.textContent=c.critical.length;
  document.querySelector('#decisionMissingRad').textContent=c.missing.length;
  document.querySelector('#decisionFinanceFlags').textContent=c.fin.length;
  document.querySelector('#decisionProjectFlags').textContent=c.projectFlags.length;
}
function decisionPlan(minutes=60){
  minutes=Math.max(30,Math.min(120,Number(minutes)||60));
  const candidates=[];
  decisionCriticalTaskRows().forEach(x=>candidates.push({score:x.score,label:x.t.title,why:x.reasons.join(', '),type:'Görev'}));
  decisionProjectRows().filter(x=>x.p.next_action).forEach(x=>candidates.push({score:Math.max(20,x.score),label:x.p.title+' → '+x.p.next_action,why:x.reasons.join(', ')||'aktif proje adımı',type:'Proje'}));
  const vf=decisionVehicleFlags();
  vf.overdue.forEach(v=>candidates.push({score:75,label:v.title,why:'araç hedef tarihi geçti',type:'Araç'}));
  vf.upcoming.slice(0,3).forEach(v=>candidates.push({score:28,label:v.title,why:'30 gün içinde yaklaşan araç işi',type:'Araç'}));
  candidates.sort((a,b)=>b.score-a.score);
  const block=minutes<=30?15:minutes<=60?20:30;
  const count=Math.max(1,Math.floor(minutes/block));
  const chosen=candidates.slice(0,count);
  let out=`${minutes} DAKİKALIK ODAK PLANI\n\n`;
  if(!chosen.length)return out+'Kayıtlarda acil veya önceliklendirilebilir bir iş görünmüyor. Yeni görev/proje eklediğinde plan otomatik oluşur.';
  chosen.forEach((x,i)=>{out+=`${i+1}. ${Math.min(block,minutes-i*block)} dk • ${x.type}: ${x.label}\n   Neden: ${x.why||'öncelik puanı yüksek'}\n`});
  const used=Math.min(minutes,chosen.length*block),left=minutes-used;
  if(left>0)out+=`\nKalan ${left} dk: tamamladıklarını işaretle ve sonraki adımı güncelle.`;
  out+='\n\nBu plan kayıtlarındaki öncelik/tarih bilgisine göre oluşturuldu; süreler tahminidir.';
  return out;
}
function decisionRisks(){
  const c=decisionCounts(),vr=decisionVehicleFlags(),rad=decisionRadFlags(),lines=['RİSK / DİKKAT LİSTESİ'];
  if(c.critical.length){lines.push('\nGörevler:');c.critical.slice(0,6).forEach(x=>lines.push(`• ${x.t.title} — ${x.reasons.join(', ')}`))}
  const pp=decisionProjectRows().filter(x=>x.score>=35);
  if(pp.length){lines.push('\nProjeler:');pp.slice(0,5).forEach(x=>lines.push(`• ${x.p.title} — ${x.reasons.join(', ')}`))}
  if(rad.length){lines.push('\nRadyoloji:');rad.slice(0,8).forEach(x=>lines.push('• '+x))}
  if(c.fin.length){lines.push('\nFinans:');c.fin.slice(0,5).forEach(x=>lines.push(`• ${finCat(x.row.category)} — ${x.why}`))}
  if(vr.overdue.length||vr.upcoming.length){lines.push('\nAraç:');vr.overdue.slice(0,5).forEach(v=>lines.push(`• GECİKMİŞ — ${v.title} — ${v.next_due_date}`));vr.upcoming.slice(0,5).forEach(v=>lines.push(`• Yaklaşıyor — ${v.title} — ${v.next_due_date}`))}
  if(lines.length===1)lines.push('\nKayıtlarda belirgin bir risk sinyali görünmüyor.');
  return lines.join('\n');
}
function decisionDataQuality(){
  const missing=decisionMissingRadUnits(),cur=radTotals(currentMonth()),lines=[`VERİ TAMLIK KONTROLÜ • ${currentMonth()}`];
  lines.push(`\nRadyoloji veri girilen birim: ${cur.rows.length}/${RAD_UNITS.length}`);
  if(missing.length)lines.push('Eksik birimler:\n'+missing.map(x=>'• '+x).join('\n'));
  else lines.push('Tüm radyoloji birimleri için bu ay kayıt var.');
  const zeros=cur.rows.filter(r=>Number(r.patient_count||0)===0&&Number(r.request_count||0)===0);
  if(zeros.length)lines.push('\n0/0 girilen birimler (doğru olabilir, kontrol et):\n'+zeros.map(r=>'• '+r.unit).join('\n'));
  const noNext=projects.filter(p=>p.status==='active'&&!p.next_action);
  if(noNext.length)lines.push('\nSonraki adımı boş aktif projeler:\n'+noNext.slice(0,8).map(p=>'• '+p.title).join('\n'));
  const tasksNoDate=tasks.filter(t=>t.status!=='done'&&t.status!=='archived'&&!t.due_at&&Number(t.priority)===1);
  if(tasksNoDate.length)lines.push('\nTarihi olmayan yüksek öncelikli görevler:\n'+tasksNoDate.slice(0,8).map(t=>'• '+t.title).join('\n'));
  return lines.join('\n');
}
function decisionProjectPriority(){
  const rows=decisionProjectRows();
  if(!rows.length)return 'PROJE ÖNCELİĞİ\n\nAktif proje bulunmuyor.';
  let out='PROJE ÖNCELİĞİ\n\n';
  rows.slice(0,6).forEach((x,i)=>{
    out+=`${i+1}. ${x.p.title} — öncelik puanı ${x.score}\n`;
    out+=`   ${x.p.next_action?'Sonraki adım: '+x.p.next_action:'⚠ Sonraki adım tanımlanmamış.'}\n`;
    if(x.reasons.length)out+=`   Neden: ${x.reasons.join(', ')}\n`;
  });
  out+='\nİlk sıradaki projede somut bir sonraki adım belirleyip onu göreve çevirmek en iyi devam noktası.';
  return out;
}
function decisionFocus(){
  const c=decisionCounts(),vr=decisionVehicleFlags(),radFlags=decisionRadFlags();
  const domains=[
    ['Görevler',c.critical.length*4,()=>decisionPlan(60)],
    ['Projeler',c.projectFlags.length*3,decisionProjectPriority],
    ['Radyoloji',c.missing.length*3+radFlags.length*2,decisionDataQuality],
    ['Finans',c.fin.length*3,()=>assistantFinance()],
    ['Araç',vr.overdue.length*4+vr.upcoming.length*2,()=>assistantVehicle()]
  ].sort((a,b)=>b[1]-a[1]);
  const top=domains[0];
  if(!top||top[1]===0)return 'ODAK ÖNERİSİ\n\nŞu anda belirgin bir aciliyet puanı yok. Aktif projelerden bir sonraki adımı seçip 30–60 dakikalık odak bloğu oluşturabilirsin.';
  return `ODAK ÖNERİSİ\n\nÖnce: ${top[0]}\nÖncelik sinyali: ${top[1]}\n\n${top[2]()}`;
}
function decisionFinanceAnomalies(){
  const flags=decisionFinanceFlags();
  if(!flags.length)return `${currentMonth()} HARCAMA KONTROLÜ\n\nBu ayki kayıtlar içinde ortalama/medyana göre belirgin yüksek tekil gider tespit edilmedi. Bu bir bütçe veya dolandırıcılık tespiti değildir.`;
  return `${currentMonth()} YÜKSEK TEKİL GİDERLER\n\n`+flags.slice(0,8).map((x,i)=>`${i+1}. ${fmtMoney(x.row.amount)} • ${finCat(x.row.category)}${x.row.note?' • '+x.row.note:''}\n   ${x.why}`).join('\n')+'\n\nBunlar istatistiksel olarak diğer kayıtlarından yüksek görünen kalemlerdir; hatalı oldukları anlamına gelmez.';
}
const _assistantAnswerForV1=assistantAnswerFor;
assistantAnswerFor=function(question){
  const q=normText(question);
  if(q.includes('plan')&&(q.includes('bugun')||q.includes('dakika')||q.includes('saat'))){
    const m=q.match(/\b(30|60|120)\b/);return decisionPlan(m?Number(m[1]):60);
  }
  if(q.includes('anormal')||q.includes('harcama uyar')||q.includes('yuksek gider'))return decisionFinanceAnomalies();
  if((q.includes('eksik')||q.includes('tamlik'))&&(q.includes('radyoloji')||q.includes('veri')))return decisionDataQuality();
  if(q.includes('hangi proje')||q.includes('projeye once')||q.includes('proje oncel'))return decisionProjectPriority();
  if(q.includes('risk')||q.includes('sorunlari bul'))return decisionRisks();
  if(q.includes('odak')||q.includes('neye once'))return decisionFocus();
  return _assistantAnswerForV1(question);
};
function decisionSetResult(text){const el=document.querySelector('#decisionResult');if(el)el.textContent=text}
document.querySelector('#decisionPlanBtn')?.addEventListener('click',()=>decisionSetResult(decisionPlan(document.querySelector('#decisionMinutes')?.value||60)));
document.querySelector('#decisionRiskBtn')?.addEventListener('click',()=>decisionSetResult(decisionRisks()));
document.querySelector('#decisionQualityBtn')?.addEventListener('click',()=>decisionSetResult(decisionDataQuality()));
document.querySelector('#decisionFocusBtn')?.addEventListener('click',()=>decisionSetResult(decisionFocus()));
document.querySelector('#tabs')?.addEventListener('click',e=>{if(e.target.closest('[data-tab="decision"]'))setTimeout(renderDecisionDashboard,0)});
const _refreshDataV09=refreshData;
refreshData=async function(){const r=await _refreshDataV09();renderDecisionDashboard();return r};
setTimeout(renderDecisionDashboard,800);
