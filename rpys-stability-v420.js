/* Repair legacy presentation writers before execution; no database mutations. */
(()=>{
 if(window.rpysStability420)return;
 const owner='if(window.__RPYS_INTERACTION_GUARD_V400__)return;';
 const htmlByElement=new WeakMap();
 function updateHtml(element,html,marker){
  if(htmlByElement.get(element)===html&&(!marker||element.querySelector(marker)))return;
  element.innerHTML=html;htmlByElement.set(element,html);
 }
 function repairPatch(js,slug){
  if(slug==='rpys-patch371')js=js.replace('function scanSayButtons(){','function scanSayButtons(){if(window.rpysTargets399?.isBusy?.())return;');
  if(slug==='rpys-patch383')js=js.replace('function rename(){','function rename(){if(window.rpysTargets399?.isBusy?.())return;');
  if(slug==='rpys-patch319fixed')js=js.replace("if(!m||$('#'+id))continue;", "if(!m||$('#'+id)||window.rpysStability420.hasEquivalent(m,lab))continue;");
  const names={
   'rpys-patch332':['bindSuitable','stableSuitable','openSuitable332'],
   'rpys-patch336':['bindSuitable336','render336'],
   'rpys-patch337':['bindSuitable','render337'],
   'rpys-patch338':['installSuitable','render338','dedupeMenu'],
   'rpys-patch339':['bindSuitable','suitableBox','renderSuitable339','scheduleContextRefresh']
  }[slug]||[];
  for(const name of names)js=js.replace(new RegExp('(function '+name+'\\([^)]*\\)\\{)'), '$1'+owner);
  if(slug==='rpys-patch322'){
   js=js.replace(/x\.innerHTML=(`[^\n]*`);/g,"window.rpysStability420.updateHtml(x,$1,'#p322Start');");
   js=js.replace(/h\.innerHTML=(`[^\n]*`)/g,"window.rpysStability420.updateHtml(h,$1,'.p322chips')");
  }
  if(slug==='rpys-patch337')js=js.replace('function renderPeopleChecks(){','function renderPeopleChecks(){if(window.__RPYS_PATCH339__)return false;');
  if(slug==='rpys-patch339')js=js.replace(/^ host\.innerHTML=(.+);$/m,
   ' const sig=JSON.stringify(staff.map(p=>[p.id,p.name,ids.has(Number(p.id))]));if(host.dataset.rpysPeople420!==sig){host.innerHTML=$1;host.dataset.rpysPeople420=sig;}');
  if(slug==='rpys-patch352'){
   js=js.replace('function cleanup(menu){','function cleanup(menu){'+owner);
   js=js.replace('function addLock(menu){',"function addLock(menu){if(window.__RPYS_INTERACTION_GUARD_V400__&&menu&&window.rpysStability420.hasEquivalent(menu,'KİLİTLE'))return;");
  }
  if(slug==='rpys-patch353'){
   js=js.replace("function menu(){","function menu(){if(document.getElementById('rpysCopy353')&&document.getElementById('rpysPaste353'))return;");
   js=js.replace('lab.textContent=String(meta.shift)',"if(lab.textContent!==String(meta.shift))lab.textContent=String(meta.shift)");
  }
  if(slug==='rpys-patch388'){
   js=js.replace('b.parentNode===ref.parentNode)ref.parentNode.insertBefore(b,ref)', 'b.parentNode===ref.parentNode&&b.nextSibling!==ref)ref.parentNode.insertBefore(b,ref)');
   js=js.replace("&&t)t.textContent='SDS / STD Görüntüleme Hizmetleri'","&&t&&t.textContent!=='SDS / STD Görüntüleme Hizmetleri')t.textContent='SDS / STD Görüntüleme Hizmetleri'");
  }
  if(slug==='rpys-patch383')js=js.replace(/\\nfunction (docFor|stripSignatures)\(/g,'\nfunction $1(').replace("else el.textContent='🖨 Listeyi Yazdır';","else if(el.textContent!=='🖨 Listeyi Yazdır')el.textContent='🖨 Listeyi Yazdır';");
  if(slug==='rpys-patch340')js=js.replaceAll("badge.textContent=String(meta.shift)+(meta.hours!=null?' • '+meta.hours+'s':'')", "{const text=String(meta.shift)+(meta.hours!=null?' • '+meta.hours+'s':'');if(badge.textContent!==text)badge.textContent=text}");
  return js;
 }
 function repairEmbedded(js){
  if(js.includes('rpys383print'))js=js.replace('function rename(){','function rename(){if(window.rpysTargets399?.isBusy?.())return;');
  js=js.replace('function scanSayButtons(){','function scanSayButtons(){if(window.rpysTargets399?.isBusy?.())return;');
  // The print patch is also embedded in the core, not only fetched remotely.
  js=js.replace("else el.textContent='🖨 Listeyi Yazdır';","else if(el.textContent!=='🖨 Listeyi Yazdır')el.textContent='🖨 Listeyi Yazdır';");
  if(js.includes('rpysF20UnitTotal'))js=js.replace(/^function totalsRows\(\)\{[^\n]*$/m,'function totalsRows(){window.rpysStability420.renderGrandTotals()}');
  js=js.replace(/^const spouseBad=\(ids\)=>[^\n]*$/m,"const spouseBad=(ids)=>(window.rpysScheduler398?.spouseDayViolations?.(ym())||[]).filter(x=>ids.map(Number).includes(x.first)||ids.map(Number).includes(x.second)).length;").replace(/^const spouseBad10=ids=>[^\n]*$/m,"const spouseBad10=ids=>(window.rpysScheduler398?.spouseDayViolations?.(ym())||[]).filter(x=>ids.map(Number).includes(x.first)||ids.map(Number).includes(x.second)).length;");
  if(js.includes('rpysF20PolTrackSummary'))js=js.replace(/(function summary\(\)\{[^\n]*?)h\.innerHTML=(`[^\n]*`)/g,"$1window.rpysStability420.updateHtml(h,$2,'.tablewrap')");
  if(!js.includes('__RPYS_FIXPACK_319__'))return js;
  js=js.replace(/  function addSayGrandTotals\(\)\{[^\n]*\}/,'  function addSayGrandTotals(){window.rpysStability420.renderGrandTotals()}');
  js=js.replace('function enrichSuitable(){','function enrichSuitable(){'+owner);
  js=js.replace('if(!b){b=document.createElement(\'button\');',"if(!b){if(window.rpysStability420.hasEquivalent(menu,label))return;b=document.createElement('button');");
  js=js.replace('b.textContent=label;b.onclick=', 'if(b.textContent!==label)b.textContent=label;b.onclick=');
  js=js.replace('th.textContent=th.dataset.base+(i===Number(cfg.idx)?(Number(cfg.dir)>0?\' ▲\':\' ▼\'):\'\');',"{const text=th.dataset.base+(i===Number(cfg.idx)?(Number(cfg.dir)>0?' ▲':' ▼'):'');if(th.textContent!==text)th.textContent=text;}");
  js=js.replace('rows.forEach(r=>body.appendChild(r))','rows.forEach((r,i)=>{if(body.children[i]!==r)body.insertBefore(r,body.children[i]||null)})');
  return js;
 }
 function repair(html){
  return html.replace(/(["'])([A-Za-z0-9+/=]{200,})\1/g,(whole,quote,b64)=>{
   try{const original=new TextDecoder().decode(Uint8Array.from(atob(b64),c=>c.charCodeAt(0))),next=repairEmbedded(original);if(next===original)return whole;const bytes=new TextEncoder().encode(next);let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return quote+btoa(binary)+quote}catch{return whole}
  });
 }
 function action(text){text=String(text).toLocaleUpperCase('tr-TR');if(text.includes('KİLİTLE')||text.includes('KİLİDİ AÇ'))return 'lock';if(text.includes('SEÇİLİ')&&/ÇALIŞMAYI DEĞİŞTİR|HÜCREYİ DEĞİŞTİR/.test(text))return 'swap';return ''}
 function hasEquivalent(menu,label){const key=action(label);return !!key&&[...menu.querySelectorAll('button')].some(b=>action(b.textContent)===key)}
 function removeSayGrandTotals(){
  for(const table of document.querySelectorAll('table.say,table.stableSay,table.rpys393saytable'))for(const row of [...table.rows]){
   const label=String(row.cells[0]?.textContent||'').trim().toLocaleUpperCase('tr-TR').replace(/\s+/g,' ');
   if(row.matches('.rpys319GrandRow,.rpysF20UnitTotal,.rpys393grand,.rpys393grand2,.rpysSay414Grand')||/^(?:TÜM )?BİRİM TOPLAM/.test(label)||/^TOPLAM (MÜKELLEF|FAZLA MESAİ)/.test(label))row.remove();
  }
 }
 function installPuantajAction(){
  const page=document.getElementById('saymanlik');if(!page)return;
  if(!document.getElementById('rpysPuantajActionStyle422')){const style=document.createElement('style');style.id='rpysPuantajActionStyle422';style.textContent='@media print{#rpysPuantajReset422{display:none!important}}';document.head.append(style)}
  page.querySelectorAll('button[onclick*="resetAllPuantajOverrides"]').forEach(b=>b.remove());
  const host=page.querySelector('.toolbar');if(!host||document.getElementById('rpysPuantajReset422'))return;
  const button=document.createElement('button');button.id='rpysPuantajReset422';button.type='button';button.className='btn alt';button.textContent='Elle girilen toplamları kaldır';button.title='Seçili ayın puantaj özetindeki elle girilen değerleri kaldırır; görevlerden hesaplanan değerleri gösterir.';button.onclick=()=>window.resetAllPuantajOverrides?.();host.append(button);
 }
 function renderGrandTotals(){removeSayGrandTotals();installPuantajAction()}
 window.rpysStability420={updateHtml,repair,repairPatch,repairEmbedded,renderGrandTotals,removeSayGrandTotals,installPuantajAction,hasEquivalent};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',renderGrandTotals);else renderGrandTotals();
})();
