(()=>{
if(window.__RPYS382_V3__)return;window.__RPYS382_V3__=1;
const U=s=>String(s||'').replace(/\s+/g,' ').trim().toLocaleUpperCase('tr-TR');
function norm(v){v=String(v||'').trim().toLowerCase();return ['landscape','yatay','horizontal','land'].includes(v)?'landscape':'portrait'}
function ori(){try{return norm(document.getElementById('pcOrientation')?.value||db?.printCenter?.orientation||db?.printSettings?.orientation||'portrait')}catch(_){return'portrait'}}
function persist(){let o=ori();try{db.printCenter=db.printCenter||{};db.printSettings=db.printSettings||{};db.printCenter.orientation=o;db.printSettings.orientation=o;try{savePrintCenterSettingsSilent()}catch(_){};let s=document.getElementById('pcOrientation');if(s){let hit=[...s.options].find(x=>norm(x.value)===o);if(hit)s.value=hit.value}}catch(_){}return o}
function visible(el){if(!el)return false;try{let s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&el.getClientRects().length>0}catch(_){return false}}
function inCenter(){let p=document.getElementById('printCenterPreview');return visible(p)}
function go(){persist();if(typeof window.rpysPrintCenter387==='function')return window.rpysPrintCenter387();let doc=String(db?.printCenter?.doc||'pol'),o=ori(),body='';if(doc==='pol'||doc==='acil')body=stableDutyDoc(doc);else if(doc==='say1'||doc==='say2'){let pg=doc==='say2'?2:1;body=stableSayDoc(sayNamesForPage(pg),'SAYFA '+pg+'/2')}else body=(typeof getPrintCenterBody==='function'?getPrintCenterBody():'')||document.getElementById('printCenterPreview')?.innerHTML||'';return stablePrintDocument('RPYS Yazdırma Merkezi',body,o)}
window.rpysPrintCenter382=go;
document.addEventListener('change',e=>{if(e.target?.id==='pcOrientation'){persist();try{updatePrintCenterPreview()}catch(_){}}},true);
document.addEventListener('click',e=>{if(!inCenter())return;let b=e.target.closest('button,a');if(!b)return;let t=U(b.textContent);if(!(t==='YAZDIR / PDF'||t==='YAZDIR/PDF'||t==='YAZDIR'))return;e.preventDefault();e.stopPropagation();try{e.stopImmediatePropagation()}catch(_){};go()},true);
})();