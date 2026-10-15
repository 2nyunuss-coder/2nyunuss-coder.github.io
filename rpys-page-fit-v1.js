/* Fit only the Saymanlık and Nöbet work pages to the visible screen.
   Screen-only presentation: does not change data, print output, or other pages. */
(()=>{'use strict';
if(window.__RPYS_PAGE_FIT_V1__)return;window.__RPYS_PAGE_FIT_V1__=true;
const KEY='rpys_page_fit_zoom_v1',IDS=['nobet','saymanlik'];let prefs={};
try{prefs=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{}
const css=document.createElement('style');css.id='rpysPageFitStyleV1';css.textContent=`
.rpysPageFitBarV1{position:sticky;top:0;z-index:70;display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:5px;margin:0 0 8px;padding:6px 8px;background:#edf4fb;border:1px solid #c3d4e6;border-radius:7px;color:#17365d;font:12px Segoe UI,Arial,sans-serif}
.rpysPageFitBarV1 strong{margin-right:auto;font-size:11px}
.rpysPageFitBarV1 button{min-height:29px;padding:4px 8px;border:1px solid #aebfd3;border-radius:5px;background:#fff;color:#17365d;font:12px Segoe UI,Arial,sans-serif;cursor:pointer}
.rpysPageFitBarV1 output{min-width:42px;text-align:center;font-weight:700}
@media screen{#nobet #polGrid,#nobet #acilGrid,#saymanlik #say1Grid,#saymanlik #say2Grid{height:auto!important;max-height:none!important;min-height:0!important;overflow:visible!important}}
@media print{.rpysPageFitBarV1{display:none!important}}
`;document.head.append(css);
const q=(s,r=document)=>r.querySelector(s),visible=el=>!!(el&&el.getClientRects().length);
function persist(){try{localStorage.setItem(KEY,JSON.stringify(prefs))}catch{}}
function pageChildren(page,bar){return [...page.children].filter(el=>el!==bar&&!el.classList.contains('rpysWindowHead409'))}
function setZoom(page,bar,zoom){const children=pageChildren(page,bar);for(const el of children)el.style.zoom=String(zoom);page.dataset.rpysPageFitZoomV1=String(zoom);const out=q('output',bar);if(out)out.value=Math.round(zoom*100)+'%';return children}
function fitScale(page,bar){
 const children=pageChildren(page,bar);for(const el of children)el.style.zoom='1';
 const rect=page.getBoundingClientRect(),desktop=document.body.classList.contains('rpysDesktop409');
 const head=q(':scope > .rpysWindowHead409',page),barH=bar.getBoundingClientRect().height;
 const availableW=Math.max(180,page.clientWidth-12);
 const availableH=Math.max(160,desktop?page.clientHeight-(head?.offsetHeight||0)-barH-24:innerHeight-Math.max(0,rect.top)-barH-18);
 const contentW=Math.max(1,page.scrollWidth, ...children.map(el=>el.offsetLeft+el.scrollWidth));
 const contentH=Math.max(1,page.scrollHeight-barH,...children.map(el=>el.offsetTop+el.scrollHeight));
 return Math.max(.25,Math.min(1,availableW/contentW,availableH/contentH));
}
function apply(page,bar){
 if(!visible(page)||page.clientWidth<50)return;
 let pref=prefs[page.id];if(pref===undefined){pref='fit';prefs[page.id]=pref;persist()}
 const z=pref==='fit'?fitScale(page,bar):Math.max(.4,Math.min(1.5,Number(pref)||1));
 setZoom(page,bar,z);
}
function decorate(){for(const id of IDS){const page=document.getElementById(id);if(!page)continue;let bar=q(':scope > .rpysPageFitBarV1',page);if(!bar){bar=document.createElement('div');bar.className='rpysPageFitBarV1 no-print';bar.setAttribute('aria-label','Sayfa yakınlaştırma');bar.innerHTML='<strong>Sayfa görünümü</strong><button type="button" data-pfit="fit">Ekrana sığdır</button><button type="button" data-pfit="minus" aria-label="Küçült">−</button><output aria-live="polite">100%</output><button type="button" data-pfit="plus" aria-label="Büyüt">+</button><button type="button" data-pfit="reset">%100</button>';page.insertBefore(bar,page.firstChild);bar.addEventListener('click',e=>{const action=e.target.closest('[data-pfit]')?.dataset.pfit;if(!action)return;if(action==='fit')prefs[id]='fit';else if(action==='reset')prefs[id]=1;else{const cur=prefs[id]==='fit'?Number(page.dataset.rpysPageFitZoomV1||fitScale(page,bar)):Number(prefs[id]||1);prefs[id]=Math.max(.4,Math.min(1.5,cur+(action==='plus'?.1:-.1)));}persist();apply(page,bar)});}
 apply(page,bar);
 }}
let timer=0;function schedule(delay=100){clearTimeout(timer);timer=setTimeout(decorate,delay)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>schedule(0),{once:true});else schedule(0);
document.addEventListener('click',e=>{if(e.target.closest('.sidebar .nav[data-p]')||e.target.closest('#rpysDesktopHome409 [data-view-action=launch]')||e.target.closest('#nobet,#saymanlik'))schedule(180)},{capture:true});
addEventListener('resize',()=>schedule(80));addEventListener('rpys-direct-core-ready',()=>schedule(200));
new MutationObserver(()=>schedule(100)).observe(document.body,{childList:true,subtree:true});
})();
