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
 function renderGrandTotals(){
  if(typeof totals!=='function'||typeof puantajValue!=='function')return;
  let values;try{const all=totals();values=[all.reduce((n,r)=>n+Number(puantajValue(r,'muk')||0),0),all.reduce((n,r)=>n+Math.max(0,Number(puantajValue(r,'diff')||0)),0)]}catch{return}
  const labels=['TÜM BİRİM TOPLAM MÜKELLEF','TÜM BİRİM TOPLAM FAZLA MESAİ'];
  for(const table of document.querySelectorAll('table.say')){
   const body=table.tBodies[0];if(!body)continue;
   const existing=[...table.querySelectorAll('.rpys319GrandRow')];existing.slice(2).forEach(r=>r.remove());
   for(let i=0;i<2;i++){
    let row=existing[i];if(!row){row=body.insertRow();row.className='puantajRow rpys319GrandRow';row.insertCell();row.insertCell();}
    if(row.cells[0].textContent!==labels[i])row.cells[0].textContent=labels[i];
    const colspan=Math.max(1,(table.rows[1]?.cells.length||2)-1);if(row.cells[1].colSpan!==colspan)row.cells[1].colSpan=colspan;
    const value=values[i].toLocaleString('tr-TR',{maximumFractionDigits:2})+' SAAT';if(row.cells[1].textContent!==value)row.cells[1].textContent=value;
   }
  }
 }
 window.rpysStability420={updateHtml,repair,repairPatch,repairEmbedded,renderGrandTotals,hasEquivalent};
})();
