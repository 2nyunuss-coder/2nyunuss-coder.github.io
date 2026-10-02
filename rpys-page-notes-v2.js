(()=>{'use strict';
const KEY='rpys_page_notes_v1',IDS=['nobet','saymanlik'];
const month=()=>{try{return document.getElementById('month')?.value||'genel'}catch(_){return'genel'}};
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(_){return{}}};
const key=id=>id+'|'+month();

function mount(id){
 const sec=document.getElementById(id);
 if(!sec || !sec.classList.contains('page'))return;
 let box=sec.querySelector('.rpysPageNote');
 if(box)return;
 box=document.createElement('div');
 box.className='rpysPageNote';
 box.innerHTML='<div class="rpysPageNoteTitle">📝 Not</div><textarea placeholder="Bu liste için kısa not..."></textarea><div class="rpysPageNotePrint"></div><div class="rpysPageNoteMeta"><span>Bu ay için saklanır</span><button type="button">Temizle</button></div>';
 const ta=box.querySelector('textarea'),print=box.querySelector('.rpysPageNotePrint'),btn=box.querySelector('button');
 const syncPrint=()=>{print.textContent=ta.value||''};
 ta.value=read()[key(id)]||'';syncPrint();
 let timer;
 ta.addEventListener('input',()=>{
   syncPrint();clearTimeout(timer);timer=setTimeout(()=>{
    const x=read();x[key(id)]=ta.value;
    try{localStorage.setItem(KEY,JSON.stringify(x))}catch(_){}
   },150);
 });
 btn.onclick=()=>{ta.value='';syncPrint();const x=read();delete x[key(id)];try{localStorage.setItem(KEY,JSON.stringify(x))}catch(_){}ta.focus()};
 const sig=sec.querySelector(':scope > .sayScreenSignatures');
 if(sig) sig.insertAdjacentElement('afterend',box);
 else{
   const panels=[...sec.querySelectorAll(':scope > .panel')];
   const last=panels[panels.length-1];
   if(last) last.insertAdjacentElement('afterend',box);
   else sec.appendChild(box);
 }
}

function css(){
 if(document.getElementById('rpys-page-notes-style-v5'))return;
 const st=document.createElement('style');st.id='rpys-page-notes-style-v4';
 st.textContent=`
.rpysPageNote{display:block!important;width:100%!important;clear:both!important;margin:6px 0 10px!important;padding:7px 9px!important;background:#fff!important;border:1px solid #d7e1ec!important;border-radius:7px!important;box-sizing:border-box!important}
.rpysPageNoteTitle{display:block!important;font-size:11px!important;font-weight:700!important;color:#17365d!important;margin-bottom:4px!important}
.rpysPageNote textarea{display:block!important;width:100%!important;height:42px!important;min-height:42px!important;resize:vertical!important;border:1px solid #cbd7e4!important;border-radius:5px!important;padding:5px 7px!important;font:11px Segoe UI,Arial,sans-serif!important;line-height:1.3!important;box-sizing:border-box!important}
.rpysPageNotePrint{display:none!important;white-space:pre-wrap!important;overflow-wrap:anywhere!important;word-break:break-word!important}
.rpysPageNotePrint br{display:block!important;content:""!important}
.rpysPageNoteMeta{display:flex!important;justify-content:space-between!important;font-size:8px!important;color:#718399!important;margin-top:3px!important}
.rpysPageNoteMeta button{border:0!important;background:none!important;color:#64748b!important;font-size:8px!important;cursor:pointer!important;padding:0!important}
#say1Grid td:first-child,#say2Grid td:first-child{overflow-wrap:anywhere!important;word-break:break-word!important;white-space:normal!important;line-height:1.05!important}
@media print{
 .rpysPageNote{display:block!important;width:100%!important;margin:3mm 0 2mm!important;padding:2mm!important;background:#fff!important;border:1px solid #777!important;border-radius:0!important;break-inside:avoid!important}
 .rpysPageNoteTitle,.rpysPageNoteMeta,.rpysPageNote textarea{display:none!important}
 .rpysPageNotePrint{display:block!important;width:100%!important;min-height:5mm!important;color:#111!important;background:#fff!important;font:6.5pt Arial,sans-serif!important;line-height:1.22!important;white-space:pre-wrap!important;overflow-wrap:anywhere!important;word-break:break-word!important}
 #say1Grid td:first-child,#say2Grid td:first-child{font-size:7pt!important;line-height:1.02!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;overflow:visible!important;padding-left:1mm!important;padding-right:1mm!important}
 #say1Grid td,#say2Grid td{overflow-wrap:anywhere!important;word-break:break-word!important}
}
`;
 document.head.appendChild(st);
}

function run(){css();IDS.forEach(mount)}
function start(){
 run();
 setTimeout(run,300);
 setTimeout(run,1200);
 document.addEventListener('change',e=>{if(e.target?.id==='month'){setTimeout(run,50);setTimeout(run,400)}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();