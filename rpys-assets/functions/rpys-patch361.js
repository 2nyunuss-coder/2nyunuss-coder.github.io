(()=>{
if(window.__RPYS361_V4__)return;window.__RPYS361_V4__=1;
function block(e){let th=e.target.closest('#say1Grid table.say thead th,#say2Grid table.say thead th,#say1Panel table.say thead th,#say2Panel table.say thead th');if(!th)return;let row=th.parentElement,idx=[...row.children].indexOf(th);if(idx<=0)return;e.preventDefault();e.stopPropagation();try{e.stopImmediatePropagation()}catch(_){}return false}
['pointerdown','mousedown','touchstart','touchend','click','dblclick'].forEach(ev=>document.addEventListener(ev,block,true));
})();