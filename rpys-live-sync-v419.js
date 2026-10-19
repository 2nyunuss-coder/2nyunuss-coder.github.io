/* Observe remote revisions without replacing the active draft or reloading it. */
(()=>{
 if(window.rpysLiveSync419)return;
 const original=window.fetch.bind(window);let api='',auth='',revision=0,polling=false,remote=0;
 function header(h){try{return new Headers(h||{}).get('authorization')||''}catch{return ''}}
 function pending(){try{return !!(_savePending||_saveTimerV245)||Number(window.__RPYS_EDIT_GUARD_UNTIL_V400__||0)>Date.now()}catch{return true}}
 function show(){
  if(document.getElementById('rpysRemoteUpdate419'))return;
  const box=document.createElement('div');box.id='rpysRemoteUpdate419';box.setAttribute('role','status');
  box.style.cssText='position:fixed;right:14px;top:12px;z-index:2147483646;max-width:380px;padding:12px;background:#fff4d6;color:#17365d;border:1px solid #c99a31;border-radius:9px;font:13px Arial';
  const message=document.createElement('span');message.textContent='Başka bir oturumda yeni kayıt var. Açık çalışmanız korunuyor. ';
  const button=document.createElement('button');button.type='button';button.textContent='Güncel veriyi aç';
  button.onclick=()=>{if(pending()){message.textContent='Kaydınız henüz tamamlanmadı. Yeni veriye geçmeden önce kayıt veya çakışma durumunu çözün. ';return}if(confirm('Güncel bulut verisi için sayfa yeniden açılsın mı?'))location.reload()};
  box.append(message,button);document.body.append(box);
 }
 window.fetch=async function(input,init){
  const url=typeof input==='string'?input:String(input?.url||''),method=String(init?.method||input?.method||'GET').toUpperCase();
  const tracked=url.includes('/rpys-web/api/');if(tracked){api=url.split('/api/')[0];auth=header(init?.headers)||header(input?.headers)||auth}
  const response=await original(input,init);
  if(tracked&&response.ok&&(url.includes('/api/state')||url.includes('/api/login'))){
   try{const j=await response.clone().json(),n=Number(j.revision??j.seq??0);if(n>0){revision=Math.max(revision,n);if(method==='POST'&&url.includes('/api/state')&&revision>=remote)document.getElementById('rpysRemoteUpdate419')?.remove()}}catch{}
  }return response;
 };
 async function poll(){
  if(polling||document.hidden||!api||!auth||pending())return;polling=true;
  try{const response=await original(api+'/api/status?live='+Date.now(),{headers:{Authorization:auth},cache:'no-store'});if(!response.ok)return;const j=await response.json(),n=Number(j.revision??j.seq??0);if(!revision){revision=n;return}if(n>revision){remote=n;show()}}catch{}finally{polling=false}
 }
 window.rpysLiveSync419={poll,pending};setInterval(poll,4500);
 addEventListener('focus',()=>setTimeout(poll,180));document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(poll,180)});
})();
