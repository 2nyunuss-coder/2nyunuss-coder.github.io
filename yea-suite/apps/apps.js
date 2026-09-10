'use strict';
fetch('https://api.github.com/repos/2nyunuss-coder/2nyunuss-coder.github.io/releases?per_page=20').then(r=>{if(!r.ok)throw new Error();return r.json();}).then(releases=>{
  const r=releases.find(r=>!r.draft&&r.tag_name.startsWith('yea-apps-1.9.0-')&&r.assets.some(a=>a.name==='YEA-Suite-1.9.0.apk')&&r.assets.some(a=>a.name==='YEA-Oyun-1.9.0.apk'));
  if(!r){document.querySelector('#release-status').textContent='APK paketleri henüz yayımlanmadı. Şimdilik üstteki web uygulamalarını kullanabilirsin.';return;}
  for(const [id,name] of [['suite-apk','YEA-Suite-1.9.0.apk'],['arcade-apk','YEA-Oyun-1.9.0.apk']]){const a=r.assets.find(a=>a.name===name),u=new URL(a.browser_download_url);if(u.origin!=='https://github.com'||!u.pathname.startsWith('/2nyunuss-coder/2nyunuss-coder.github.io/releases/download/'))continue;const el=document.getElementById(id);el.href=u.href;el.hidden=false;}
  document.querySelector('#release-status').textContent='Android deneme paketleri hazır. Sürüm: 1.9.0';
}).catch(()=>{document.querySelector('#release-status').textContent='Android sürüm bilgisi alınamadı. Aşağıdaki Tüm uygulama sürümleri bağlantısından kontrol edebilirsin.';});
