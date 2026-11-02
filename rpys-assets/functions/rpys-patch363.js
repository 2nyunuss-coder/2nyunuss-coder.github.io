(()=>{
if(window.__RPYS363_V6__)return;window.__RPYS363_V6__=1;
/* Saymanlık verisine/DOM satırlarına dokunmaz. Yalnız personel başlık tıklamasının yanlış işlem tetiklemesini engeller. */
function stop(e){let th=e.target.closest('#say1Grid th,#say2Grid th');if(!th)return;let tr=th.parentElement;if(!tr)return;let idx=[...tr.children].indexOf(th);if(idx<=0)return;e.preventDefault();e.stopPropagation();try{e.stopImmediatePropagation()}catch(_){}return false}
['pointerdown','mousedown','touchstart','touchend','click','dblclick'].forEach(ev=>document.addEventListener(ev,stop,true));
})();