/* RPYS: isolated bulk print preview. Does not save or change workspace records. */
(()=>{
'use strict';
if(window.rpysBulkPrint412)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={say1:'Saymanlık SAYFA 1/2',say2:'Saymanlık SAYFA 2/2',mesai:'Personel Bazlı Mesai İstatistiği',nobet:'Nöbet Listesi',puantaj:'Puantaj Çizelgesi',izin:'İzin Cetveli',birim:'Birim Çalışma Saatleri Özeti',fazla:'Fazla Mesai Listesi'};
function period(row,base){
 const raw=row.period==='fixed'?row.fixed:base;
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(raw||''))throw Error('Geçerli bir ay seçmelisin.');
 if(!['this','prev','prev2','fixed'].includes(row.period))throw Error('Geçersiz dönem seçimi.');
 const [y,m]=raw.split('-').map(Number),n=y*12+m-1-({prev:1,prev2:2}[row.period]||0);
 return Math.floor(n/12)+'-'+String(n%12+1).padStart(2,'0');
}
function table(title,heads,rows){return stablePrintHeader(title)+'<table><thead><tr>'+heads.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table>'+stableSignatures();}
function documents(id){
 if(id==='say1'||id==='say2'){const n=id==='say2'?2:1;return [stableSayDoc(sayNamesForPage(n),'SAYFA '+n+'/2')];}
 if(id==='puantaj')return [stableSayDoc(sayNamesForPage(1),'SAYFA 1/2'),stableSayDoc(sayNamesForPage(2),'SAYFA 2/2')];
 if(id==='nobet')return [stableDutyDoc('pol'),stableDutyDoc('acil')];
 if(id==='izin')return [centerLeaveHtml()];
 if(id==='mesai'||id==='fazla'){
  const rows=totals().map(r=>({name:r.p.name,pol:puantajValue(r,'pol'),ac:puantajValue(r,'ac'),total:puantajValue(r,'total'),muk:puantajValue(r,'muk'),diff:puantajValue(r,'diff')}));
  return [table(names[id],['Personel','Poliklinik','Acil','Toplam Saat','Mükellef','Fark'],rows.filter(r=>id!=='fazla'||Number(r.diff)>0).map(r=>[r.name,r.pol,r.ac,r.total,r.muk,r.diff]))];
 }
 if(id==='birim'){
  const groups=new Map();for(const a of assignmentsMonth()){const key=a.col?.unit||'Diğer';let r=groups.get(key);if(!r)groups.set(key,r={count:0,hours:0,people:new Set()});r.count++;r.hours+=Number(a.col?.hours||0);r.people.add(a.person.id);}
  return [table(names[id],['Birim','Görev','Saat','Personel'],[...groups].map(([k,r])=>[k,r.count,Math.round(r.hours*100)/100,r.people.size]))];
 }
 throw Error('Desteklenmeyen evrak: '+id);
}
function build(pack){
 if(!pack?.rows?.length)throw Error('Pakete en az bir evrak eklemelisin.');
 const monthEl=document.getElementById('month');if(!monthEl||typeof db==='undefined'||!db)throw Error('RPYS verileri henüz hazır değil.');
 const base=monthEl.value;
 const rows=pack.rows.map(r=>{if(!names[r.doc])throw Error('Desteklenmeyen evrak.');const copies=Number(r.copies);if(!Number.isInteger(copies)||copies<1||copies>50)throw Error('Kopya sayısı 1–50 arasında olmalı.');return {...r,copies,month:period(r,base)};});
 if(rows.reduce((s,r)=>s+r.copies*(r.doc==='nobet'||r.doc==='puantaj'?2:1),0)>200)throw Error('Tek pakette en fazla 200 evrak hazırlayabilirsin.');
 // Render synchronously against a disposable snapshot. No change events, saves or awaits.
 // Restore references even if a legacy document renderer throws.
 const live=db,cache=[_allAssignCache,_peopleCache,_assignCache,_calcCache],extra=[];
 const snapshot=JSON.parse(JSON.stringify(live)),parts=[];
 try{
  db=snapshot;
  for(const r of rows){
   if(monthEl.tagName==='SELECT'&&![...monthEl.options].some(o=>o.value===r.month)){const o=document.createElement('option');o.value=r.month;o.textContent=r.month;monthEl.append(o);extra.push(o);}
   monthEl.value=r.month;
   _allAssignCache=null;_peopleCache=null;_assignCache={};_calcCache={};
   const bodies=documents(r.doc);
   for(let copy=1;copy<=r.copies;copy++)for(const body of bodies){
    if(!body||!body.includes('<table'))throw Error(names[r.doc]+' hazırlanamadı.');
    parts.push({doc:r.doc,month:r.month,copy,body});
   }
  }
 }finally{
  db=live;monthEl.value=base;extra.forEach(o=>o.remove());
  [_allAssignCache,_peopleCache,_assignCache,_calcCache]=cache;
 }
 return {title:pack.name||'Toplu Yazdırma',parts};
}
const css=`@page{size:A4 landscape;margin:6mm}*{box-sizing:border-box}html,body{margin:0;background:white;color:#111;font-family:Arial,sans-serif}body{padding:12px}.sheet{break-before:page;padding:0;font-size:8pt}.sheet:first-child{break-before:auto}.label{font-size:8pt;color:#475569;margin:0 0 5px}.ph{text-align:center;line-height:1.15;margin-bottom:3mm}.ph b,.ph strong{display:block;font-size:7pt}.ph h2{font-size:10pt;margin:1mm}.monthTitle{font-size:8pt;font-weight:bold}table{width:100%;border-collapse:collapse;table-layout:fixed;margin-bottom:3mm}th,td{border:1px solid #94a3b8;padding:1mm;text-align:center;overflow-wrap:anywhere}th{background:#17365d;color:white}tr{break-inside:avoid}thead{display:table-header-group}.stableDuty th,.stableDuty td{font-size:5.5pt;padding:.3mm;height:4.2mm}.stableSay th,.stableSay td{font-size:4.8pt;padding:.25mm;height:3.7mm}.stableSay .dateCol{width:10mm}.stableSay .sum{font-weight:bold;background:#edf3f8}.sigs{display:grid;grid-template-columns:1fr 1.2fr 1fr;text-align:center;gap:4mm;margin-top:3mm;break-inside:avoid}.sigs div{display:flex;flex-direction:column}.sigs i{height:4mm}.sigs b{font-size:6pt}.sigs span,.sigs em{font-size:5.5pt;font-style:normal}.off{background:#f1f5f9}.wkrow{background:#fff1f2}@media screen{body{background:#e2e8f0}.sheet{background:white;padding:18px;margin:0 auto 18px;max-width:1120px;box-shadow:0 2px 8px #0002}}@media print{body{padding:0}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`;
function html(result){return '<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>'+esc(result.title)+'</title><style>'+css+'</style></head><body>'+result.parts.map(p=>'<section class="sheet" data-doc="'+p.doc+'" data-month="'+p.month+'"><div class="label">'+esc(names[p.doc])+' • '+p.month+' • Kopya '+p.copy+'</div>'+p.body+'</section>').join('')+'</body></html>';}
function preview(result){
 document.getElementById('rpysBulkPreview412')?.remove();
 const oldFocus=document.activeElement,box=document.createElement('div');box.id='rpysBulkPreview412';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Toplu yazdırma önizlemesi');
 box.style.cssText='position:fixed;inset:12px;z-index:2147483600;background:#f8fafc;border:2px solid #17365d;border-radius:12px;display:flex;flex-direction:column;box-shadow:0 0 0 100vmax #0008;overflow:hidden;color:#17365d';
 box.innerHTML='<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:12px;background:#fff"><strong style="flex:1">'+esc(result.title)+' — '+result.parts.length+' evrak</strong><button type="button" data-bulk-print>Paketi Yazdır / PDF</button><button type="button" data-bulk-close>Kapat</button></div><div style="padding:0 12px 10px;background:white;font-size:12px">Kopyalar pakete eklendi. Yazıcı ekranındaki kopya sayısını 1 bırak. Nöbet listesi poliklinik ve acil belgelerini birlikte içerir.</div><iframe title="Toplu paket önizlemesi" style="flex:1;width:100%;border:0;background:white"></iframe>';
 const close=()=>{box.remove();oldFocus?.focus();};box.querySelector('[data-bulk-close]').onclick=close;
 box.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close();}});
 document.body.append(box);
 const frame=box.querySelector('iframe'),d=frame.contentDocument;d.open();d.write(html(result));d.close();
 box.querySelector('[data-bulk-print]').onclick=()=>{frame.contentWindow.focus();frame.contentWindow.print();};
 box.querySelector('[data-bulk-print]').focus();
}
// Window capture runs before legacy document print interceptors. Match only package actions.
window.addEventListener('click',e=>{
 const button=e.target.closest?.('#r377v4 .r377print, #rpysBulkPreview412 button');if(!button)return;
 e.preventDefault();e.stopImmediatePropagation();
 if(button.closest('#rpysBulkPreview412')){button.onclick?.call(button,e);return;}
 try{const packs=JSON.parse(localStorage.getItem('rpys_bulk_print_377')||'[]'),index=Number(button.closest('[data-pack]')?.dataset.pack);preview(build(packs[index]));}
 catch(error){alert('Paket hazırlanamadı: '+error.message);}
},true);
window.rpysBulkPrint412={build,period,html,preview};
})();
