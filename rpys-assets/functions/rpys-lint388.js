(()=>{
if(window.__SDS390WU_V6)return;window.__SDS390WU_V6=1;window.__SDS390WU_V5=1;window.__SDS390WU_V4=1;
let tm=0,ro=null;
function imp(el,p,v){if(!el)return;if(el.style.getPropertyValue(p)!==v||el.style.getPropertyPriority(p)!=='important')el.style.setProperty(p,v,'important')}
function fit(){try{let v=document.getElementById('wv');if(!v)return;imp(v,'max-width','100%');imp(v,'width','100%');imp(v,'box-sizing','border-box');imp(v,'overflow-x','hidden');let w=v.querySelector('.docx-wrapper');if(w){imp(w,'width','100%');imp(w,'max-width','100%');imp(w,'min-width','0');imp(w,'box-sizing','border-box');imp(w,'overflow','visible')}for(const sec of v.querySelectorAll('section.docx,.docx-wrapper>section')){if(sec.dataset.rpysPreviewExpanded==='1'){sec.style.removeProperty('width');delete sec.dataset.rpysPreviewExpanded}imp(sec,'max-width','100%');imp(sec,'box-sizing','border-box');imp(sec,'overflow','visible');for(const t of sec.querySelectorAll('table')){imp(t,'width','100%');imp(t,'max-width','100%');imp(t,'table-layout','fixed');imp(t,'box-sizing','border-box');for(const c of t.querySelectorAll('col')){imp(c,'width','auto');imp(c,'max-width','none')}}for(const x of sec.querySelectorAll('td,th,p,span')){imp(x,'white-space','normal');imp(x,'overflow-wrap','anywhere');imp(x,'word-break','break-word');imp(x,'max-width','100%');imp(x,'box-sizing','border-box')}}v.dataset.rpysFitV6='1';if(!ro&&window.ResizeObserver){ro=new ResizeObserver(()=>schedule());ro.observe(v)}}catch(e){console.warn('SDS preview fit V6',e)}}
function schedule(){clearTimeout(tm);tm=setTimeout(fit,40)}
function isSdsBtn(x){return !!x?.closest?.('#rpysSdsPermanent,[data-sds-permanent="1"],.nav[data-p="sds"],[data-p="sds"]')}
function forceSds(){
 try{if(typeof window.__SDS_FULL_TAB__==='function')window.__SDS_FULL_TAB__()}catch(e){console.warn('SDS nav fulltab',e)}
 for(const fn of ['openSds','openSDS','showSds','showSDS']){try{if(typeof window[fn]==='function')window[fn]()}catch(_){}}
 for(const fn of ['renderPage','showPage','setPage','openPage']){try{if(typeof window[fn]==='function')window[fn]('sds')}catch(_){}}
 let s=document.getElementById('sds');
 if(!s){try{let alt=[...document.querySelectorAll('[data-p="sds"]')].find(x=>x.id!=='rpysSdsPermanent'&&x.dataset.sdsPermanent!=='1');if(alt&&typeof alt.click==='function')alt.click()}catch(_){}s=document.getElementById('sds')}
 if(!s)return false;
 try{document.querySelectorAll('.page.active').forEach(p=>{if(p!==s)p.classList.remove('active')})}catch(_){}
 s.classList.add('active');s.hidden=false;s.removeAttribute('hidden');s.setAttribute('aria-hidden','false');
 try{s.style.setProperty('display','block','important');s.style.setProperty('visibility','visible','important');s.style.setProperty('opacity','1','important')}catch(_){}
 try{document.querySelectorAll('.nav.active,[data-p].active').forEach(n=>n.classList.remove('active'));let b=document.getElementById('rpysSdsPermanent')||document.querySelector('[data-sds-permanent="1"],.nav[data-p="sds"]');if(b)b.classList.add('active')}catch(_){}
 try{window.scrollTo(0,0)}catch(_){}
 setTimeout(fit,80);return true
}
function repairSds(){forceSds();setTimeout(forceSds,40);setTimeout(forceSds,160);setTimeout(forceSds,420)}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
document.addEventListener('click',e=>{if(isSdsBtn(e.target))repairSds();if(e.target?.closest?.('#sds [data-t="full"],#wb')){setTimeout(fit,80);setTimeout(fit,250);setTimeout(fit,700)}},true);
document.addEventListener('pointerup',e=>{if(isSdsBtn(e.target))setTimeout(forceSds,0)},true);
window.addEventListener('resize',schedule);[100,400,900,1800,4000].forEach(t=>setTimeout(fit,t));
let st=document.getElementById('sdsPreviewFitV6Style')||document.createElement('style');st.id='sdsPreviewFitV6Style';st.textContent='@media screen{#wv{width:100%!important;max-width:100%!important;overflow-x:hidden!important;box-sizing:border-box!important}#wv .docx-wrapper{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;margin:0 auto!important}#wv section.docx{max-width:100%!important;box-sizing:border-box!important}#wv section.docx table{width:100%!important;max-width:100%!important;table-layout:fixed!important;box-sizing:border-box!important}#wv section.docx col{width:auto!important}#wv section.docx td,#wv section.docx th,#wv section.docx p,#wv section.docx span{white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;max-width:100%!important;box-sizing:border-box!important}}';if(!st.isConnected)document.head.appendChild(st);
window.__SDS_PREVIEW_FIT_V6=fit;window.__SDS_NAV_REPAIR_V6=forceSds;
})();