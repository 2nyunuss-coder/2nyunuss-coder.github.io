(()=>{
  if(window.__RPYS_DATA_SAFETY_ARCHIVE_V395__)return;
  window.__RPYS_DATA_SAFETY_ARCHIVE_V395__=true;

  const ARCHIVE_KEY="signedDocumentArchive";
  const COUNTER_KEY="signedDocumentCounters";
  const pending=new Set();

  function markEdit(){window.__RPYS_LAST_USER_EDIT_V395__=Date.now()}
  window.__RPYS_LAST_USER_EDIT_V395__=Date.now();
  ["input","change","keydown","pointerdown","paste","drop"].forEach(name=>document.addEventListener(name,markEdit,true));

  function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  function monthKey(){try{return typeof ym==="function"?String(ym()||""):String(document.getElementById("month")?.value||"")}catch(_){return String(document.getElementById("month")?.value||"")}}
  function userName(){try{return String(currentUser?.name||currentUser?.username||"RPYS kullanıcısı")}catch(_){return "RPYS kullanıcısı"}}
  function archiveRows(){try{if(!Array.isArray(db[ARCHIVE_KEY]))db[ARCHIVE_KEY]=[];return db[ARCHIVE_KEY]}catch(_){return []}}
  function archiveCounters(){try{if(!db[COUNTER_KEY]||typeof db[COUNTER_KEY]!=="object")db[COUNTER_KEY]={};return db[COUNTER_KEY]}catch(_){return {}}}

  function activeDocument(kind){
    const period=monthKey();
    if(kind==="nobet"){
      const acil=document.getElementById("acilPanel"),pol=document.getElementById("polPanel");
      const isAcil=!!(acil&&getComputedStyle(acil).display!=="none");
      return {kind,period,section:isAcil?"Acil":"Poliklinik",title:isAcil?"Radyoloji Acil Çalışma / Nöbet Listesi":"Radyoloji Poliklinik Çalışma / Nöbet Listesi",orientation:"portrait",element:isAcil?acil:pol,type:isAcil?"acil":"pol"}
    }
    const say2=document.getElementById("say2Panel"),say1=document.getElementById("say1Panel");
    const isSay2=!!(say2&&getComputedStyle(say2).display!=="none");
    return {kind:"saymanlik",period,section:isSay2?"Sayfa 2":"Sayfa 1",title:"Radyoloji Saymanlık / Puantaj — "+(isSay2?"Sayfa 2":"Sayfa 1"),orientation:"landscape",element:isSay2?say2:say1,page:isSay2?2:1}
  }

  function printableBody(meta){
    try{
      if(meta.kind==="nobet"&&typeof stableDutyDoc==="function")return stableDutyDoc(meta.type);
      if(meta.kind==="saymanlik"&&typeof stableSayDoc==="function"&&typeof sayNamesForPage==="function")return '<div class="forceOneSay">'+stableSayDoc(sayNamesForPage(meta.page),meta.page===2?"SAYFA 2/2":"SAYFA 1/2")+'</div>'
    }catch(e){console.warn("İmza arşivi yazdırma gövdesi alınamadı; ekran kopyası kullanılacak",e)}
    return staticClone(meta.element)
  }

  function printedMeta(doc){
    const title=String(doc?.title||""),body=String(doc?.body||"");
    if(!body)return null;
    if(/Nöbet Listesi/i.test(title)){
      const acil=/Acil/i.test(title);
      return {kind:"nobet",period:monthKey(),section:acil?"Acil":"Poliklinik",title,orientation:String(doc.orientation||"portrait"),body}
    }
    if(/Saymanlık/i.test(title)){
      let section=/SAY1\s*\/\s*SAY2/i.test(title)?"Sayfa 1 + Sayfa 2":/SAY2/i.test(title)?"Sayfa 2":"Sayfa 1";
      return {kind:"saymanlik",period:monthKey(),section,title,orientation:String(doc.orientation||"landscape"),body}
    }
    return null
  }

  function staticClone(element){
    if(!element)throw new Error("Arşivlenecek belge bölümü bulunamadı.");
    const clone=element.cloneNode(true);
    clone.style.display="block";
    clone.querySelectorAll("script,button,.rpysSignedArchiveBar,.screenZoomControls,.no-print,input[type=file]").forEach(x=>x.remove());
    clone.querySelectorAll("input,select,textarea").forEach(field=>{
      const span=document.createElement("span");
      if(field.type==="checkbox"||field.type==="radio")span.textContent=field.checked?"✓":"□";
      else if(field.tagName==="SELECT")span.textContent=field.selectedOptions?.[0]?.textContent||field.value||"";
      else span.textContent=field.value||"";
      span.className="rpysArchivedValue";field.replaceWith(span)
    });
    clone.querySelectorAll("*").forEach(node=>[...node.attributes].forEach(a=>{if(/^on/i.test(a.name)||a.name==="contenteditable")node.removeAttribute(a.name)}));
    return clone.outerHTML
  }

  function printDocument(meta,body,number){
    return '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(number)+" • "+esc(meta.title)+'</title><style>'+archiveCss(meta.orientation)+'</style></head><body><header class="archiveHead"><div><b>'+esc(number)+'</b><span>Son İmzalatılan • Değiştirilemez Arşiv Kopyası</span></div><div><b>'+esc(meta.period)+'</b><span>'+esc(meta.section)+' • '+esc(new Date().toLocaleString("tr-TR"))+'</span></div></header>'+body+'</body></html>'
  }

  function archiveCss(orientation="landscape"){return '*{box-sizing:border-box}html,body{margin:0;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif}body{padding:5mm}.archiveHead{display:flex;justify-content:space-between;gap:12px;border:1px solid #94a3b8;border-radius:8px;padding:5px 8px;margin-bottom:5px}.archiveHead div{display:flex;flex-direction:column;gap:2px}.archiveHead b{font-size:8pt}.archiveHead span{font-size:6pt;color:#475569}.panel{display:block!important;border:0!important;box-shadow:none!important;padding:0!important;margin:0!important}.tablewrap{overflow:visible!important;max-height:none!important}.ph{text-align:center;line-height:1;margin-bottom:1mm}.ph b,.ph strong{display:block;font-size:6pt}.ph h2{font-size:8pt;margin:.5mm 0}.monthTitle{font-size:6pt;font-weight:700}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #667;padding:.28mm .18mm;text-align:center;vertical-align:middle}th{background:#17365d;color:#fff;font-weight:800}.stableDuty th,.stableDuty td{font-size:5.5pt;line-height:1.05;height:6.7mm;padding:.35mm .22mm}.stableDuty tr.wkrow td,.stableDuty .wk{background:#fff0f0}.stableDuty .off{background:#f1f2f4;color:#999}.stableSay{page-break-inside:avoid;break-inside:avoid;table-layout:fixed}.stableSay th,.stableSay td{font-size:4.25pt;line-height:.95;height:3.35mm;padding:.10mm .08mm;overflow:hidden}.stableSay .dateCol{width:7mm}.stableSay .nameHead{font-size:3.95pt;line-height:.9;white-space:normal;word-break:break-word;font-weight:800}.stableSay tr.wkrow td{background:#fff0f0}.stableSay .sum td{background:#edf3f8;font-weight:800}.stableSayPage{page-break-inside:avoid;break-inside:avoid}.forceOneSay .stableSayPage{height:190mm;max-height:190mm;overflow:hidden;display:flex;flex-direction:column}.sigs{display:grid;grid-template-columns:1fr 1.2fr 1fr;gap:4mm;text-align:center;margin-top:1.5mm;break-inside:avoid;page-break-inside:avoid}.sigs div{display:flex;flex-direction:column}.sigs i{height:4.5mm}.sigs b{font-size:4.9pt}.sigs span,.sigs em{font-size:4.2pt;font-style:normal}.rpysArchivedValue{white-space:pre-wrap}@page{size:A4 '+(orientation==="portrait"?"portrait":"landscape")+';margin:5mm}@media print{body{padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}.archiveHead{break-inside:avoid}}'}

  async function digest(text){
    const buf=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(x=>x.toString(16).padStart(2,"0")).join("")
  }
  function toBase64(bytes){let out="";for(let i=0;i<bytes.length;i+=32768)out+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(out)}
  function fromBase64(value){const raw=atob(value),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out}
  async function encodePayload(text){
    if(typeof CompressionStream!=="function"||typeof DecompressionStream!=="function")return {encoding:"plain",payload:text};
    const stream=new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
    return {encoding:"gzip-base64",payload:toBase64(new Uint8Array(await new Response(stream).arrayBuffer()))}
  }
  async function decodePayload(item){
    if(item.encoding!=="gzip-base64")return String(item.payload||"");
    const stream=new Blob([fromBase64(String(item.payload||""))]).stream().pipeThrough(new DecompressionStream("gzip"));
    return await new Response(stream).text()
  }

  function nextNumber(kind,period){
    const year=/^\d{4}/.test(period)?period.slice(0,4):String(new Date().getFullYear());
    const prefix=kind==="nobet"?"NÖB":"SAY",key=kind+":"+year,counters=archiveCounters();
    let max=archiveRows().filter(x=>x.kind===kind&&String(x.number||"").startsWith(prefix+"-"+year+"-")).reduce((m,x)=>Math.max(m,Number(String(x.number).split("-").pop())||0),0);
    const n=Math.max(Number(counters[key]||0),max)+1;counters[key]=n;
    return prefix+"-"+year+"-"+String(n).padStart(4,"0")
  }

  function toast(message,bad=false){
    let box=document.getElementById("rpysArchiveToastV395");if(!box){box=document.createElement("div");box.id="rpysArchiveToastV395";document.body.appendChild(box)}
    box.textContent=message;box.className=bad?"bad":"ok";box.style.display="block";clearTimeout(box._timer);box._timer=setTimeout(()=>box.style.display="none",4200)
  }

  async function archiveCurrent(kind,source="manual",prepared=null){
    let pendingKey="";
    try{
      if(typeof db==="undefined"||!db)throw new Error("RPYS verisi henüz hazır değil.");
      if(typeof saveNowV245!=="function")throw new Error("Güvenli kayıt motoru hazır değil.");
      const meta=prepared||activeDocument(kind),body=prepared?.body||printableBody(meta);
      if(body.length>2000000)throw new Error("Belge arşiv sınırını aşıyor.");
      const hash=await digest([meta.kind,meta.section,meta.period,body].join("|"));
      pendingKey=[meta.kind,meta.section,meta.period,hash].join("|");if(pending.has(pendingKey))return;
      const old=archiveRows().find(x=>x.contentHash===hash&&x.kind===meta.kind&&x.section===meta.section&&x.period===meta.period);
      if(old){if(source==="manual")toast("Bu belge zaten arşivde: "+old.number);return old}
      pending.add(pendingKey);
      const number=nextNumber(meta.kind,meta.period),full=printDocument(meta,body,number),encoded=await encodePayload(full);
      const item={id:crypto.randomUUID?crypto.randomUUID():"arc-"+Date.now()+"-"+Math.random().toString(36).slice(2),number,kind:meta.kind,section:meta.section,period:meta.period,title:meta.title,orientation:meta.orientation,createdAt:new Date().toISOString(),createdBy:userName(),contentHash:hash,encoding:encoded.encoding,payload:encoded.payload,source};
      archiveRows().unshift(item);markEdit();
      saveNowV245({label:"Son imzalatılan arşivi • "+number});
      try{if(typeof _storageWriteChain!=="undefined")await _storageWriteChain}catch(_){}
      const waiting=typeof _savePending!=="undefined"&&_savePending;
      if(!waiting)try{if(typeof v24FetchJson==="function")await v24FetchJson("/api/snapshot",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({label:"Son imzalatılan • "+number})})}catch(e){console.warn("İmza arşivi ek snapshot oluşturulamadı",e)}
      toast(number+(waiting?" yerel kasaya kaydedildi; bulut sırası bekleniyor.":" güvenli arşive kaydedildi."));
      refreshBars();return item
    }catch(e){console.error("RPYS imza arşivi",e);toast("Arşiv kaydı yapılamadı: "+String(e?.message||e),true)}
    finally{if(pendingKey)pending.delete(pendingKey)}
  }

  function archiveList(kind){return archiveRows().filter(x=>!kind||x.kind===kind).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))}
  function modal(){let m=document.getElementById("rpysSignedArchiveModal");if(!m){m=document.createElement("div");m.id="rpysSignedArchiveModal";document.body.appendChild(m)}return m}
  function closeModal(){document.getElementById("rpysSignedArchiveModal")?.remove()}

  function openList(kind){
    const items=archiveList(kind),m=modal();
    m.innerHTML='<div class="rpysArchiveCard"><div class="rpysArchiveTitle"><div><b>🗂 Son İmzalatılanlar</b><span>'+(kind==="nobet"?"Nöbet listeleri":"Saymanlık / puantajlar")+'</span></div><button data-arc-close>✕</button></div><div class="rpysArchiveList">'+(items.length?items.map(x=>'<article><div><b>'+esc(x.number)+'</b><span>'+esc(x.period)+' • '+esc(x.section)+'</span><small>'+esc(new Date(x.createdAt).toLocaleString("tr-TR"))+' • '+esc(x.createdBy)+'</small></div><button data-arc-view="'+esc(x.id)+'">Görüntüle / Yazdır</button></article>').join(""):'<div class="rpysArchiveEmpty">Henüz bu bölümde imzalatılan belge yok.</div>')+'</div></div>';
    m.querySelector("[data-arc-close]").onclick=closeModal;m.onclick=e=>{if(e.target===m)closeModal()};
    m.querySelectorAll("[data-arc-view]").forEach(b=>b.onclick=()=>openArchive(b.dataset.arcView))
  }

  async function openArchive(id){
    const item=archiveRows().find(x=>String(x.id)===String(id));if(!item)return toast("Arşiv kaydı bulunamadı.",true);
    const m=modal();m.innerHTML='<div class="rpysArchiveCard preview"><div class="rpysArchiveTitle"><div><b>'+esc(item.number)+'</b><span>'+esc(item.title)+' • '+esc(item.period)+'</span></div><div><button data-arc-print>Yazdır</button><button data-arc-close>✕</button></div></div><iframe title="'+esc(item.number)+'"></iframe></div>';
    const iframe=m.querySelector("iframe");iframe.srcdoc=await decodePayload(item);
    m.querySelector("[data-arc-close]").onclick=closeModal;m.querySelector("[data-arc-print]").onclick=()=>{try{iframe.contentWindow.focus();iframe.contentWindow.print()}catch(e){toast("Arşiv yazdırılamadı.",true)}}
  }

  function bar(kind){
    const page=document.getElementById(kind==="nobet"?"nobet":"saymanlik");if(!page||page.querySelector('.rpysSignedArchiveBar[data-kind="'+kind+'"]'))return;
    const box=document.createElement("div");box.className="rpysSignedArchiveBar";box.dataset.kind=kind;
    box.innerHTML='<div><b>İmza Arşivi</b><span data-arc-count>0 kayıt</span></div><div><button data-arc-save="'+kind+'">✅ İmzaya Çıktı Olarak Kaydet</button><button data-arc-list="'+kind+'">🗂 Son İmzalatılanlar</button></div>';
    page.insertAdjacentElement("afterbegin",box)
  }
  function refreshBars(){
    bar("nobet");bar("saymanlik");
    document.querySelectorAll(".rpysSignedArchiveBar").forEach(x=>{const n=archiveList(x.dataset.kind).length,el=x.querySelector("[data-arc-count]");if(el)el.textContent=n+" kayıt"});
    document.querySelectorAll('#nobet [data-rpys383print="say"][onclick*="stablePrintDuty"]').forEach(b=>b.removeAttribute("data-rpys383print"))
  }

  function addStyle(){if(document.getElementById("rpysArchiveStyleV395"))return;const s=document.createElement("style");s.id="rpysArchiveStyleV395";s.textContent='.rpysSignedArchiveBar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;margin:0 0 10px;border:1px solid #9ab3c8;border-radius:11px;background:linear-gradient(135deg,#eef7ff,#f8fbff);color:#17365d}.rpysSignedArchiveBar>div{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.rpysSignedArchiveBar span{font-size:11px;color:#64748b}.rpysSignedArchiveBar button{border:1px solid #8da9c1;border-radius:8px;background:#fff;color:#17365d;padding:7px 10px;font-weight:800;cursor:pointer}#rpysArchiveToastV395{position:fixed;right:18px;bottom:18px;z-index:2147483647;max-width:min(430px,90vw);padding:11px 14px;border-radius:10px;color:#fff;font:700 12px Arial;box-shadow:0 12px 35px #0005}#rpysArchiveToastV395.ok{background:#137047}#rpysArchiveToastV395.bad{background:#b42318}#rpysSignedArchiveModal{position:fixed;inset:0;z-index:2147483646;background:#0f172acc;display:flex;align-items:center;justify-content:center;padding:14px}.rpysArchiveCard{width:min(820px,96vw);max-height:92vh;overflow:auto;background:#fff;color:#172033;border-radius:14px;padding:14px;box-shadow:0 24px 90px #0008}.rpysArchiveCard.preview{width:min(1200px,98vw);height:94vh;display:flex;flex-direction:column}.rpysArchiveTitle{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #d8e2ec;padding-bottom:10px;margin-bottom:10px}.rpysArchiveTitle>div{display:flex;flex-direction:column;gap:3px}.rpysArchiveTitle span{font-size:11px;color:#64748b}.rpysArchiveTitle button,.rpysArchiveList button{border:1px solid #9fb4c7;border-radius:8px;background:#f6faff;color:#17365d;padding:8px 11px;font-weight:800;cursor:pointer}.rpysArchiveList{display:grid;gap:8px}.rpysArchiveList article{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid #d7e2ec;border-radius:10px;padding:10px}.rpysArchiveList article>div{display:flex;flex-direction:column;gap:3px}.rpysArchiveList span,.rpysArchiveList small{color:#64748b;font-size:11px}.rpysArchiveEmpty{padding:25px;text-align:center;color:#64748b}.rpysArchiveCard iframe{width:100%;flex:1;border:1px solid #cbd5e1;border-radius:8px;background:#fff}@media(max-width:700px){.rpysSignedArchiveBar,.rpysArchiveList article{align-items:stretch;flex-direction:column}.rpysSignedArchiveBar>div,.rpysArchiveList article button{width:100%}.rpysSignedArchiveBar button{flex:1}.rpysArchiveCard{padding:9px}}';document.head.appendChild(s)}

  document.addEventListener("click",e=>{
    const save=e.target.closest?.("[data-arc-save]");if(save){e.preventDefault();archiveCurrent(save.dataset.arcSave,"manual");return}
    const list=e.target.closest?.("[data-arc-list]");if(list){e.preventDefault();openList(list.dataset.arcList);return}
  },true);

  window.__RPYS_ARCHIVE_PRINT_DOCUMENT_V395__=doc=>{
    const meta=printedMeta(doc);
    if(meta)archiveCurrent(meta.kind,"print",meta)
  };

  function setup(){addStyle();refreshBars();const obs=new MutationObserver(()=>{clearTimeout(window.__rpysArchiveScanV395);window.__rpysArchiveScanV395=setTimeout(refreshBars,80)});obs.observe(document.body,{childList:true,subtree:true});let iv=setInterval(refreshBars,1000);setTimeout(()=>clearInterval(iv),30000)}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup);else setup();
})();
