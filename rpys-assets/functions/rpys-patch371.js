(()=>{
if(window.__RPYS371_V11__)return;window.__RPYS371_V11__=1;window.__RPYS371_V10__=1;
const U371=s=>String(s||'').toLocaleUpperCase('tr-TR').replace(/\s+/g,' ').trim();
function vis371(el){if(!el)return false;try{return el.getClientRects().length>0&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden'}catch(_){return false}}
function inSay371(){return vis371(document.getElementById('saymanlik'))||vis371(document.getElementById('say1Panel'))||vis371(document.getElementById('say2Panel'))}
document.addEventListener('click',e=>{let b=e.target.closest('button,a');if(!b||!inSay371())return;if(b.closest('#yazdir,#r377v3,#r377center,#r377nativeprint,[data-rpys-native-print]'))return;let t=U371(b.textContent);if(!(t==='YAZDIR'||t==='YAZDIR / PDF'||t==='YAZDIR/PDF'||(t.includes('SAYMANLIK')&&t.includes('YAZDIR'))))return;if(typeof window.rpysQuickPrint383==='function'){e.preventDefault();e.stopPropagation();try{e.stopImmediatePropagation()}catch(_){};window.rpysQuickPrint383('say',b)}},true);
})();
(()=>{
if(window.__RPYS393_V1__)return;window.__RPYS393_V1__=1;
const U=s=>String(s||'').toLocaleUpperCase('tr-TR').replace(/\s+/g,' ').trim();
const safe=(f,d)=>{try{return f()}catch(_){return d}};
const PALETTE=['#dff3ff','#e6f6e6','#fff0c9','#f4e3ff','#ffe0e8','#dff7f3','#e7e9ff','#ffeadb','#e5f0d0','#f9e2f3','#d9f0ff','#f3edcf'];
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function hash(s){let h=0;for(const ch of String(s||''))h=((h<<5)-h+ch.codePointAt(0))|0;return Math.abs(h)}
function num(v){let s=String(v??'').replace(/[^0-9,.-]/g,'').replace(',','.');let n=Number(s);return Number.isFinite(n)?n:0}
function htmlDoc(body){let d=document.implementation.createHTMLDocument('rpys393');d.body.innerHTML=String(body||'');return d}
function largestTable(d){return [...d.querySelectorAll('table')].sort((a,b)=>(b.rows?.length||0)-(a.rows?.length||0))[0]||null}
function printExactCss(){return `
<style id="rpys393printcss">
*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
.rpys393doc,.rpys393doc *{box-sizing:border-box!important}
.rpys393doc{width:100%!important;max-width:100%!important;overflow:hidden!important}
.rpys393doc .rpys381head{min-height:12mm!important;margin:0 0 1mm!important;padding:0 14mm .7mm!important;line-height:1!important}
.rpys393doc .rpys381head h2{margin:.7mm 0 .3mm!important;font-size:7.2pt!important}
.rpys393doc .rpys381head b{font-size:5.8pt!important;line-height:1!important}
.rpys393doc .rpys381head .monthTitle{font-size:5.5pt!important}
.rpys393doc .rpys381logo{width:11mm!important;height:11mm!important}
.rpys393doc .rpys381sigs{min-height:16mm!important;margin-top:1.4mm!important}
.rpys393doc .rpys381sigs>div{padding:1mm 2mm!important}
.rpys393doc .rpys381sigs b,.rpys393doc .rpys381sigs strong{font-size:5.2pt!important}
.rpys393doc .rpys381sigs span{font-size:4.5pt!important}
.rpys393doc .rpys381sigs i{margin-top:3.2mm!important}
.rpys393doc .printPage,.rpys393doc [class*=printPage],.rpys393doc [class*=page]{page-break-before:auto!important;page-break-after:auto!important;break-before:auto!important;break-after:auto!important;max-width:100%!important}
.rpys393duty{width:100%!important;table-layout:fixed!important;border-collapse:collapse!important;margin:0 auto!important;border:1px solid #91a8c0!important}
.rpys393duty th,.rpys393duty td{border:.25mm solid #b8c8d8!important;text-align:center!important;vertical-align:middle!important;overflow:hidden!important}
.rpys393duty thead tr:first-child th{background:#17365d!important;color:#fff!important;font:800 5.7pt Arial,sans-serif!important;padding:.5mm .35mm!important}
.rpys393duty thead tr:nth-child(2) th{background:#e9f1f8!important;color:#17365d!important;font:800 5.1pt Arial,sans-serif!important;padding:.35mm .25mm!important}
.rpys393duty tbody td{height:4.25mm!important;min-height:0!important;padding:.18mm .28mm!important;font:800 5.25pt Arial,sans-serif!important;line-height:1.02!important;white-space:nowrap!important}
.rpys393duty tbody td:first-child{width:14mm!important;background:#f7fafc!important;color:#26384b!important;font-weight:800!important}
.rpys393duty tbody tr:nth-child(even) td:first-child{background:#edf3f8!important}
.rpys393duty td.off,.rpys393duty .off{background:#f7f7f7!important;color:#9aa5b1!important}
.rpys393duty tr.wkrow td:first-child,.rpys393duty td.wk:first-child{background:#e8eef7!important;color:#17365d!important}
.rpys393saytable{width:100%!important;max-width:100%!important;table-layout:fixed!important;border-collapse:collapse!important;margin:0 auto!important}
.rpys393saytable th,.rpys393saytable td{border:.22mm solid #b7c8d9!important;text-align:center!important;vertical-align:middle!important;overflow:hidden!important;text-overflow:clip!important;white-space:nowrap!important;min-width:0!important;max-width:none!important}
.rpys393saytable thead th{font:900 4.75pt Arial,sans-serif!important;line-height:1!important;padding:.24mm .18mm!important;height:4.2mm!important}
.rpys393saytable tbody td{font:700 4.45pt Arial,sans-serif!important;line-height:1!important;padding:.14mm .18mm!important;height:3.7mm!important;min-height:0!important}
.rpys393saytable th:first-child,.rpys393saytable td:first-child{width:13mm!important;min-width:13mm!important;max-width:13mm!important}
.rpys393saytable tr{page-break-inside:avoid!important;break-inside:avoid!important;page-break-before:auto!important;page-break-after:auto!important}
.rpys393saytable tr.rpys393pol td{background:#edf8f5!important;font-weight:900!important}
.rpys393saytable tr.rpys393acil td{background:#eef4fb!important;font-weight:900!important}
.rpys393saytable tr.rpys393total td{background:#dfeaf5!important;font-weight:900!important;color:#10294e!important}
.rpys393saytable tr.rpys393obligation td{background:#edf0f4!important;font-weight:900!important}
.rpys393saytable tr.rpys393diff td{background:#fff6df!important;font-weight:900!important;color:#5c3b00!important}
.rpys393saytable tr.rpys393grand td{background:#17365d!important;color:#fff!important;font:900 5.1pt Arial,sans-serif!important;height:4.2mm!important}
.rpys393saytable tr.rpys393grand2 td{background:#d9ead3!important;color:#17330f!important;font:900 5.1pt Arial,sans-serif!important;height:4.2mm!important}
</style>`}
function decorateDuty(body){
  let d=htmlDoc(body),t=largestTable(d);if(!t)return body;
  t.classList.add('rpys393duty');
  for(const tr of [...t.tBodies].flatMap(tb=>[...tb.rows])){
    [...tr.cells].forEach((td,i)=>{
      if(i===0)return;let txt=U(td.textContent);if(!txt||txt==='â'||txt==='-'||td.classList.contains('off'))return;
      let bg=td.style.backgroundColor||td.style.background;
      if(!bg||bg==='transparent')td.style.backgroundColor=PALETTE[hash(txt.replace(/\d{1,2}:\d{2}.*/,''))%PALETTE.length];
      td.style.color='#10253f';
    });
  }
  let wrap=d.createElement('div');wrap.className='rpys393doc rpys393dutywrap';while(d.body.firstChild)wrap.appendChild(d.body.firstChild);d.body.appendChild(wrap);return printExactCss()+d.body.innerHTML;
}
function rowByLabel(t,label){let q=U(label);return [...t.rows].find(r=>U(r.cells?.[0]?.textContent)===q)||null}
function extractRowSum(html,label,positiveOnly=false){let d=htmlDoc(html),t=largestTable(d),r=t&&rowByLabel(t,label);if(!r)return 0;let vals=[...r.cells].slice(1).map(c=>num(c.textContent));return vals.reduce((s,n)=>s+(positiveOnly?Math.max(0,n):n),0)}
let oldSayRef=null,grandCache={sig:'',muk:0,extra:0};
function grandTotals(){
  if(typeof oldSayRef!=='function')return{muk:0,extra:0};
  let sig=safe(()=>String(typeof ym==='function'?ym():'')+'|'+String(db?._meta?.lastSavedAt||'')+'|'+String(Object.keys(db?.assign||{}).length),'x');
  if(grandCache.sig===sig)return grandCache;
  let muk=0,extra=0,seen=new Set();
  for(const pg of [1,2]){
    let names=safe(()=>typeof sayNamesForPage==='function'?sayNamesForPage(pg):[],[]);if(!Array.isArray(names)||!names.length)continue;
    let key=names.map(x=>typeof x==='string'?x:(x?.id||x?.name||'')).join('|');if(seen.has(key))continue;seen.add(key);
    let h=safe(()=>oldSayRef(names,'SAYFA '+pg+'/2'),'');
    muk+=extractRowSum(h,'MÃKELLEF',false);extra+=extractRowSum(h,'FARK',true);
  }
  grandCache={sig,muk:Math.round(muk*100)/100,extra:Math.round(extra*100)/100};return grandCache;
}
function decorateSay(body){
  let d=htmlDoc(body),t=largestTable(d);if(!t)return body;
  t.classList.add('rpys393saytable');
  const classes=[['POLÄ°KLÄ°NÄ°K','rpys393pol'],['ACÄ°L','rpys393acil'],['TOPLAM','rpys393total'],['MÃKELLEF','rpys393obligation'],['FARK','rpys393diff']];
  for(const [label,cl] of classes){let r=rowByLabel(t,label);if(r)r.classList.add(cl)}
  let exists=[...t.rows].some(r=>U(r.cells?.[0]?.textContent).includes('TOPLAM MÃKELLEF'));
  if(!exists){let g=grandTotals(),tb=t.tBodies[t.tBodies.length-1]||t.createTBody(),cols=Math.max(2,t.rows[0]?.cells?.length||2);
    let r1=tb.insertRow();r1.className='rpys393grand';let a=r1.insertCell();a.textContent='TOPLAM MÃKELLEF';let b=r1.insertCell();b.colSpan=cols-1;b.textContent=(Number.isInteger(g.muk)?g.muk:g.muk.toFixed(1))+' SAAT';
    let r2=tb.insertRow();r2.className='rpys393grand2';let c=r2.insertCell();c.textContent='TOPLAM FAZLA MESAÄ°';let e=r2.insertCell();e.colSpan=cols-1;e.textContent=(Number.isInteger(g.extra)?g.extra:g.extra.toFixed(1))+' SAAT';
  }
  let wrap=d.createElement('div');wrap.className='rpys393doc rpys393saywrap';while(d.body.firstChild)wrap.appendChild(d.body.firstChild);d.body.appendChild(wrap);return printExactCss()+d.body.innerHTML;
}
function setFitDefault(){try{const K='rpys_quick_print_settings_v5',q=JSON.parse(localStorage.getItem(K)||'{}')||{};q.fit=true;if(!q.orientation)q.orientation='landscape';if(!q.margin||Number(q.margin)>5)q.margin=5;localStorage.setItem(K,JSON.stringify(q));if(db){db.quickPrint383={...(db.quickPrint383||{}),fit:true,margin:Math.min(5,Number(db.quickPrint383?.margin||5)||5)}}}catch(_){}}
function scanSayButtons(){try{let on=safe(()=>{let x=document.getElementById('saymanlik');return !!(x&&x.getClientRects().length)},false)||document.querySelector('#say1Panel,#say2Panel');if(!on)return;for(const b of document.querySelectorAll('button,a,input[type=button],input[type=submit]')){let t=U(b.value||b.textContent);if(!t.includes('YAZDIR')||t.includes('YAZDIRMA MERKEZÄ°'))continue;if(b.closest('#yazdir'))continue;b.dataset.rpys383print='say';b.title='Sol tÄ±k: aynÄ± A4 sÄ±ÄdÄ±rma ayarÄ± â¢ SaÄ tÄ±k: yazdÄ±rma ayarlarÄ±';if(b.tagName!=='INPUT'&&t==='YAZDIR')b.textContent='ð¨ SaymanlÄ±ÄÄ± YazdÄ±r'}}catch(_){}}
function install(){
  let ok=false;
  try{if(typeof window.stableDutyDoc==='function'&&!window.stableDutyDoc.__rpys393){let old=window.stableDutyDoc,wrap=function(){return decorateDuty(old.apply(this,arguments))};wrap.__rpys393=1;window.stableDutyDoc=wrap;try{stableDutyDoc=wrap}catch(_){};ok=true}}catch(e){console.warn('RPYS393 duty',e)}
  try{if(typeof window.stableSayDoc==='function'&&!window.stableSayDoc.__rpys393){oldSayRef=window.stableSayDoc;let wrap=function(){return decorateSay(oldSayRef.apply(this,arguments))};wrap.__rpys393=1;window.stableSayDoc=wrap;try{stableSayDoc=wrap}catch(_){};ok=true}}catch(e){console.warn('RPYS393 say',e)}
  setFitDefault();scanSayButtons();
  if(ok)window.__RPYS393_STATUS__={ok:true,at:new Date().toISOString(),version:'3.1.48-print-fix'};
}
let n=0,iv=setInterval(()=>{install();if(++n>120)clearInterval(iv)},100);install();
new MutationObserver(()=>{clearTimeout(window.__rpys393mo);window.__rpys393mo=setTimeout(()=>{install();scanSayButtons()},60)}).observe(document.documentElement,{childList:true,subtree:true});
})();
