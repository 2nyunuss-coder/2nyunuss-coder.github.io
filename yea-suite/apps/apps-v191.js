'use strict';
fetch('https://api.github.com/repos/2nyunuss-coder/2nyunuss-coder.github.io/releases?per_page=20').then(r=>{if(!r.ok)throw new Error();return r.json();}).then(releases=>{
  const release=releases.find(r=>!r.draft&&/^yea-apps-\d+\.\d+\.\d+-\d+$/.test(r.tag_name)&&r.assets.some(a=>/^YEA-Suite-[\d.]+\.apk$/.test(a.name))&&r.assets.some(a=>/^YEA-Oyun-[\d.]+\.apk$/.test(a.name)));
  if(!release){document.querySelector('#release-status').textContent='APK paketleri hazırlanıyor. Şimdilik web uygulamalarını açabilirsin.';return;}
  for(const [id,prefix] of [['suite-apk','YEA-Suite-'],['arcade-apk','YEA-Oyun-']]){const asset=release.assets.find(a=>a.name.startsWith(prefix)&&a.name.endsWith('.apk')),url=new URL(asset.browser_download_url);if(url.origin!=='https://github.com'||!url.pathname.startsWith('/2nyunuss-coder/2nyunuss-coder.github.io/releases/download/'))continue;const el=document.getElementById(id);el.href=url.href;el.hidden=false;}
  document.querySelector('#release-status').textContent='Android deneme paketleri hazır. Sürüm: '+release.tag_name.split('-')[2]+'. Yeni APK kurmadan önce oyun ilerlemeni yedekle.';
}).catch(()=>{document.querySelector('#release-status').textContent='Android sürüm bilgisi alınamadı. Tüm uygulama sürümleri bağlantısından kontrol edebilirsin.';});
