/* A focus change is not evidence that the game has gone into the background. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.YeaGameInput=api;})(typeof window==='undefined'?globalThis:window,()=>{
  'use strict';
  function bindLifecycle(win,doc,{background,clearKeyboard}){
    const hidden=()=>{if(doc.hidden)background();},leave=()=>background(),blur=()=>clearKeyboard();
    doc.addEventListener('visibilitychange',hidden);win.addEventListener('pagehide',leave);win.addEventListener('yea:background',leave);win.addEventListener('blur',blur);
    return ()=>{doc.removeEventListener('visibilitychange',hidden);win.removeEventListener('pagehide',leave);win.removeEventListener('yea:background',leave);win.removeEventListener('blur',blur);};
  }
  function capture(canvas,event){
    // Touch focus can move Safari's focus to/from its surrounding viewer.
    if(event.pointerType==='mouse')canvas.focus?.({preventScroll:true});
    try{canvas.setPointerCapture?.(event.pointerId);return true;}catch{return false;}
  }
  return {bindLifecycle,capture};
});
