'use strict';
(() => {
  const scriptURL=new URL(document.currentScript.src),base=new URL('./',scriptURL),arcade=document.body.dataset.app==='arcade',native=!!window.YeaNative||/YeaNative\//.test(navigator.userAgent);
  const installed=()=>native||matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  let prompt=null,ready=false,dialog=null,button=document.querySelector('#install-app');
  if(!button){button=document.createElement('button');button.id='install-app';button.className='yea-install-launch';button.textContent='Uygulamayı kur';document.body.append(button);}
  if(installed())button.hidden=true;
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();prompt=e;});addEventListener('appinstalled',()=>{button.hidden=true;prompt=null;if(dialog?.open){dialog.close();}});
  function show(){
    if(installed()){button.hidden=true;return;}
    if(!dialog){dialog=document.createElement('dialog');dialog.className='yea-install-dialog';document.body.append(dialog);}
    const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),name=arcade?'YEA Oyun':'YEA Suite';
    dialog.innerHTML=`<h2>${name}’yi telefona kur</h2><div class="install-steps"></div><p class="yea-install-status" role="status"></p><button class="install-close">Kapat</button>`;
    const steps=dialog.querySelector('.install-steps');
    if(prompt){const p=document.createElement('p');p.textContent='Uygulama kendi simgesiyle, ayrı pencerede açılır.';steps.append(p);const b=document.createElement('button');b.className='install-primary';b.textContent='Uygulamayı kur';b.onclick=async()=>{const pending=prompt;if(!pending)return;await pending.prompt();await pending.userChoice;prompt=null;dialog.close();};steps.append(b);}
    else if(ios){steps.innerHTML='<ol><li>Bu sayfayı <b>Safari</b> ile aç.</li><li><b>Paylaş</b> menüsünden <b>Ana Ekrana Ekle</b> seç.</li><li>Görünüyorsa <b>Web Uygulaması Olarak Aç</b> seçeneğini açıp <b>Ekle</b> de.</li></ol><p>Simgeye dokunduğunda uygulama tam ekran açılır.</p>';}
    else steps.innerHTML='<ol><li>Sayfayı <b>Chrome</b> veya <b>Edge</b> ile aç.</li><li>Tarayıcı menüsünden <b>Uygulamayı yükle</b> ya da <b>Ana ekrana ekle</b> seç.</li></ol>';
    if(!ios){const a=document.createElement('a');a.href=new URL('apps/',base).href;a.textContent='Android APK indirme sayfası';steps.append(a);}
    dialog.querySelector('.yea-install-status').textContent=arcade?(ready?'Çevrimdışı oyunlar bu cihaza hazır.':'İlk çevrimdışı hazırlık için bağlantını açık tut.'):'Kişisel verilerinle çalışmak için internet bağlantısı gerekebilir.';
    dialog.querySelector('.install-close').onclick=()=>dialog.close();dialog.showModal();
  }
  button.addEventListener('click',show);
  if('serviceWorker' in navigator&&!native&&location.protocol==='https:'){
    const url=arcade?new URL('arcade/sw.js',base):new URL('sw.js',base),scope=arcade?new URL('arcade/',base):base;
    navigator.serviceWorker.register(url.href,{scope:scope.pathname,updateViaCache:'none'}).then(reg=>{
      reg.update().catch(()=>{});
      const check=()=>{if(reg.active){ready=true;const el=dialog?.querySelector('.yea-install-status');if(el&&arcade)el.textContent='Çevrimdışı oyunlar bu cihaza hazır.';}};
      check();reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',check);});
    }).catch(()=>{const el=dialog?.querySelector('.yea-install-status');if(el)el.textContent='Çevrimdışı hazırlık tamamlanamadı. İnternete bağlanıp yeniden aç.';});
  }
  if(new URLSearchParams(location.search).has('install')&&!installed())setTimeout(show,400);
})();
