/* Simple RPYS workspace. UI preferences are separate from personnel/planning data. */
(()=>{
'use strict';
const UI_KEY='birim_plan_ui_v2';
const titles={schedule:'Nöbet listesi',calendar:'İzin / rezerve',payroll:'Saymanlık / FHZ',overview:'Salon özeti',people:'Personel',rules:'Salon / vardiya',rulebook:'Kurallar',settings:'Ayarlar ve yedek'};
let prefs={tab:'schedule',view:'matrix',room:'',day:''},context='';
try{const old=JSON.parse(localStorage.getItem(UI_KEY)||'{}');for(const k of ['tab','view','room','day'])if(typeof old[k]==='string')prefs[k]=old[k]}catch{}
if(!titles[prefs.tab])prefs.tab='schedule';if(!['matrix','list'].includes(prefs.view))prefs.view='matrix';
const writeUI=()=>{try{localStorage.setItem(UI_KEY,JSON.stringify(prefs))}catch{}};
function menu(open){document.body.classList.toggle('menu-open',open);document.getElementById('menu-toggle').setAttribute('aria-expanded',String(open));document.getElementById('menu-backdrop').hidden=!open;document.getElementById('app-sidebar').inert=innerWidth<=760&&!open}
function syncContext(all){const next=state.unit+'|'+state.month;if(context&&context!==next){prefs.room='';prefs.day='';selected.clear()}context=next;if(prefs.day&&!prefs.day.startsWith(state.month+'-'))prefs.day='';if(prefs.room&&!all.some(c=>(c.t.room||'Ortak ekip')===prefs.room))prefs.room=''}
function visibleCells(all){syncContext(all);return all.filter(c=>(!prefs.room||(c.t.room||'Ortak ekip')===prefs.room)&&(!prefs.day||E.date(state.month,c.d)===prefs.day))}
function updateSelection(){document.getElementById('selected-count').textContent=selected.size?selected.size+' hücre seçili':'Hücreleri işaretleyerek toplu ata'}
function controls(c,notes){
 const id=state.assign[c.key],p=state.people.find(p=>p.id===id),locked=!!state.locks[c.key],manual=!!state.assignmentMeta[c.key]?.manual;
 return '<div class="duty-cell'+(!p?' is-empty':'')+'"><select class="slot-select" data-slot="'+esc(c.key)+'" aria-label="'+E.date(state.month,c.d)+' '+esc(c.t.name)+' personel" '+(locked?'disabled':'')+'><option value="">— Boş —</option>'+state.people.filter(p=>p.active||p.id===id).map(p=>'<option value="'+esc(p.id)+'" '+(p.id===id?'selected':'')+'>'+esc(p.name)+'</option>').join('')+'</select><span class="print-person">'+esc(p?.name||'BOŞ')+' · '+c.t.hours+' sa</span><div class="cell-tools"><label title="Toplu atama için seç"><input type="checkbox" data-select-slot="'+esc(c.key)+'" '+(selected.has(c.key)?'checked':'')+' aria-label="'+E.date(state.month,c.d)+' '+esc(c.t.name)+' seç"></label><small>'+c.t.hours+' sa'+(manual?' · Elle':'')+'</small><button type="button" data-lock="'+esc(c.key)+'" aria-label="'+E.date(state.month,c.d)+' '+esc(c.t.name)+' hücre kilidi">'+(locked?'🔒':'🔓')+'</button></div>'+(notes.length?'<span class="cell-warning" title="'+esc(notes.join(' · '))+'">⚠ '+esc(notes.join(' · '))+'</span>':'')+'</div>';
}
function table(all,byKey){
 const cells=visibleCells(all);
 if(!cells.length)return '<div class="empty-list">'+(all.length?'Seçili filtrede görev yok.':'Bu ay için vardiya tanımlanmadı.')+'</div>';
 const selectAll='<input id="select-all-slots" type="checkbox" aria-label="Görünen hücreleri seç" '+(cells.every(c=>selected.has(c.key))?'checked':'')+'>';
 if(prefs.view==='list')return '<table class="duty-list"><thead><tr><th>'+selectAll+'</th><th>Tarih</th><th>Salon / vardiya</th><th>Personel ve kontrol</th></tr></thead><tbody>'+cells.map(c=>'<tr class="'+(E.weekend(state.month,c.d)?'weekend':'')+'"><td>'+c.d+'</td><td>'+E.date(state.month,c.d)+'</td><td><b>'+esc(c.t.room||'Ortak ekip')+'</b><small>'+esc(c.t.name)+' · '+(c.n+1)+'</small></td><td>'+controls(c,byKey.get(c.key)||[])+'</td></tr>').join('')+'</tbody></table>';
 const colKey=c=>JSON.stringify([c.t.room||'Ortak ekip',c.t.id,c.n]),columns=[...new Map(cells.map(c=>[colKey(c),c])).values()].sort((a,b)=>(a.t.room||'Ortak ekip').localeCompare(b.t.room||'Ortak ekip','tr')||a.t.start-b.t.start||a.t.name.localeCompare(b.t.name,'tr')||a.n-b.n),indexed=new Map(cells.map(c=>[c.d+'|'+colKey(c),c])),days=[...new Set(cells.map(c=>c.d))].sort((a,b)=>a-b),groups=[];
 for(const c of columns){const room=c.t.room||'Ortak ekip',last=groups.at(-1);if(last?.room===room)last.count++;else groups.push({room,count:1})}
 return '<table class="monthly-grid"><thead><tr><th rowspan="2" class="day-col">'+selectAll+' Gün</th>'+groups.map(g=>'<th colspan="'+g.count+'">'+esc(g.room)+'</th>').join('')+'</tr><tr>'+columns.map(c=>'<th>'+esc(c.t.name)+'<small>'+esc(c.t.role||'')+(c.t.role?' · ':'')+(c.n+1)+'. kişi · '+c.t.hours+' sa</small></th>').join('')+'</tr></thead><tbody>'+days.map(day=>'<tr class="'+(E.weekend(state.month,day)?'weekend':'')+'"><th class="day-col"><b>'+day+'</b><small>'+new Intl.DateTimeFormat('tr-TR',{weekday:'short',timeZone:'UTC'}).format(new Date(E.date(state.month,day)+'T12:00:00Z'))+'</small></th>'+columns.map(col=>{const c=indexed.get(day+'|'+colKey(col));return c?'<td class="'+((byKey.get(c.key)||[]).length?'invalid':'')+'">'+controls(c,byKey.get(c.key)||[])+'</td>':'<td class="not-applicable" aria-label="Bu gün görev yok">—</td>'}).join('')+'</tr>').join('')+'</tbody></table>';
}
function render(){
 const active=document.querySelector('.tab:not([hidden])')?.id||'schedule';document.getElementById('module-title').textContent=titles[active]||'RPYS Mini';document.getElementById('facility-label').textContent=state.hospital||state.unit;document.querySelectorAll('nav [data-tab]').forEach(b=>{b.classList.toggle('selected',b.dataset.tab===active);if(b.dataset.tab===active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
 if(active==='schedule'){
  const all=E.cells(state);syncContext(all);document.getElementById('schedule-view').value=prefs.view;const room=document.getElementById('schedule-room');room.innerHTML='<option value="">Tüm salonlar</option>'+[...new Set(all.map(c=>c.t.room||'Ortak ekip'))].map(r=>'<option>'+esc(r)+'</option>').join('');room.value=prefs.room;const day=document.getElementById('schedule-day');day.value=prefs.day;day.min=state.month+'-01';day.max=E.date(state.month,E.days(state.month));document.getElementById('schedule-empty').hidden=!!(state.people.length&&all.length);updateSelection();
 }
 if(active==='rulebook'){
  const cfg=E.rules(state);document.getElementById('rulebook-context').textContent=state.unit+' birimine uygulanır. Diğer birimlerin ayarları korunur.';
  document.getElementById('mini-custom-rules').innerHTML=cfg.custom.map((r,i)=>'<div class="custom-rule-row"><div><b>'+esc(r.name)+'</b><small>'+esc(R.customTypes[r.type])+' · '+esc(state.people.find(p=>String(p.id)===String(r.personId))?.name||'Tüm personeller')+'</small></div><span class="status-pill '+(r.enabled===false?'muted':'')+'">'+(r.enabled===false?'Kapalı':'Etkin')+'</span><button type="button" data-edit-custom-rule="'+i+'">Düzenle</button></div>').join('')||'<p>Henüz özel kural yok. Kural ekle ile başlayabilirsin.</p>';
  document.getElementById('mini-enabled-rules').innerHTML=R.catalogue.filter(r=>!r.scope||r.scope==='standalone').map(r=>'<span class="rule-chip '+(cfg[r.key]===false?'off':'')+'">'+(cfg[r.key]===false?'○ ':'✓ ')+esc(r.label)+'</span>').join('');
 }
 const q=document.getElementById('people-search').value.toLocaleLowerCase('tr');for(const p of document.querySelectorAll('[data-person]'))p.hidden=!p.querySelector('[data-person-name]').value.toLocaleLowerCase('tr').includes(q);
}
window.miniWorkspace={table,visibleCells,render,updateSelection,onTab(id){prefs.tab=id;writeUI();history.replaceState(null,'','#'+id);menu(false)}};
document.addEventListener('DOMContentLoaded',()=>{
 const go=id=>{if(!busy)tab(id)};
 document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));document.getElementById('quick-backup').onclick=()=>document.getElementById('backup').click();
 document.getElementById('menu-toggle').onclick=()=>menu(!document.body.classList.contains('menu-open'));document.getElementById('menu-backdrop').onclick=()=>menu(false);document.addEventListener('keydown',e=>{if(e.key==='Escape')menu(false)});window.addEventListener('resize',()=>menu(false));
 for(const [id,key] of [['schedule-view','view'],['schedule-room','room'],['schedule-day','day']])document.getElementById(id).onchange=e=>{if(!e.target.reportValidity())return;prefs[key]=e.target.value;selected.clear();writeUI();window.render();document.getElementById('schedule-table').scrollTop=0};
 document.getElementById('clear-schedule-filter').onclick=()=>{prefs.room='';prefs.day='';selected.clear();writeUI();window.render()};
 document.getElementById('people-search').oninput=render;
 const moveMonth=delta=>{if(busy)return;const date=new Date(state.month+'-01T12:00:00Z');date.setUTCMonth(date.getUTCMonth()+delta);const input=document.getElementById('month');input.value=date.toISOString().slice(0,7);input.dispatchEvent(new Event('change',{bubbles:true}))};
 document.getElementById('previous-month').onclick=()=>moveMonth(-1);document.getElementById('next-month').onclick=()=>moveMonth(1);
 document.getElementById('rulebook').onclick=e=>{const edit=e.target.closest('[data-edit-custom-rule]'),create=e.target.closest('[data-create-rule]');if(!edit&&!create)return;const panel=openRules();panel.box.querySelector(create?'[data-new-rule]':'[data-edit="'+edit.dataset.editCustomRule+'"]').click()};
 const fromHash=location.hash.slice(1);go(titles[fromHash]?fromHash:prefs.tab);window.addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(titles[id]&&!busy)go(id)});
});
})();
