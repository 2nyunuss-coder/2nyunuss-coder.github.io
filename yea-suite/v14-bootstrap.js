'use strict';
(()=>{
  const base=document.createElement('script');base.src='./v13-bootstrap.js';document.head.appendChild(base);
  const wait=()=>{if(window.__YEA_V13_BOOTED&&window.v13AppOpen&&document.querySelector('#v13Desktop')&&document.querySelector('#v13PdfPageNo'))setup();else setTimeout(wait,50)};
  function setup(){
    if(window.__YEA_V14_BOOTED)return;window.__YEA_V14_BOOTED=true;
    document.title='YEA Suite V1.4 Desktop';
    document.querySelectorAll('.eyebrow').forEach(e=>e.textContent='YEA SUITE • V1.4 DESKTOP');
    const footer=document.querySelector('footer');if(footer)footer.textContent='YEA Suite V1.4 • Masaüstü pencereleri • Yerel dosyalar/PDF • RPYS’den bağımsız';
    const tabs=document.querySelector('#tabs');
    const deskBtn=tabs?.querySelector('[data-tab="desktop"]');
    if(deskBtn&&!tabs.querySelector('[data-tab="files"]'))deskBtn.insertAdjacentHTML('afterend','<button data-tab="files">🗃 Dosyalar</button>');
    const desktop=document.querySelector('[data-page="desktop"]');
    if(desktop&&!document.querySelector('[data-page="files"]'))desktop.insertAdjacentHTML('afterend',`<section data-page="files" class="panel hidden v14FilesPage"><div class="sectionHead split"><div><h2>🗃 Dosya Yöneticisi</h2><p>Sanal klasörler, kısayollar ve izin verdiğin gerçek dosya/klasör bağlantıları.</p></div><div class="v14FileActions"><button id="v14FileNewFolder" type="button">📁 Sanal Klasör</button><button id="v14FileAddShortcut" type="button" class="ghost">🔗 Kısayol</button><button id="v14FileRefresh" type="button" class="ghost">↻ Yenile</button></div></div><div class="v14Explorer"><aside><div class="v14TreeTitle">Konumlar</div><button data-v14-location="desktop" class="active">🖥 Masaüstü</button><button data-v14-location="all">🗂 Tümü</button><button data-v14-location="trash">🗑 Çöp Kutusu</button><div id="v14FolderTree"></div></aside><main><div class="v14ExplorerBar"><b id="v14ExplorerTitle">Masaüstü</b><span id="v14ExplorerCount"></span></div><div id="v14FileGrid" class="v14FileGrid"></div></main></div></section>`);
    const pdfTools=document.querySelector('.v13PdfTools');
    if(pdfTools&&!document.querySelector('#v14PdfPickPanel'))pdfTools.insertAdjacentHTML('afterbegin',`<div id="v14PdfPickPanel" class="v14PdfPickPanel"><h3>🎯 Tıkla-Yerleştir</h3><p class="tiny">PDF sayfasına tıklayınca Soldan/Üstten alanları otomatik dolar.</p><div class="v14PickMode"><button id="v14PickText" type="button" class="active">Metin Konumu</button><button id="v14PickCover" type="button" class="ghost">Kapama Alanı</button></div><button id="v14PdfRenderPick" type="button" class="ghost">Önizlemeyi Yenile</button></div>`);
    const viewer=document.querySelector('.v13PdfViewer');
    if(viewer&&!document.querySelector('#v14PdfCanvasWrap'))viewer.insertAdjacentHTML('afterbegin','<div id="v14PdfCanvasWrap" class="v14PdfCanvasWrap hidden"><canvas id="v14PdfCanvas"></canvas><div id="v14PdfPickMark" class="v14PdfPickMark hidden"></div></div>');
    const settings=document.querySelector('[data-page="settings"]');
    if(settings&&!document.querySelector('#v14Appearance'))settings.insertAdjacentHTML('beforeend',`<div id="v14Appearance" class="v14Appearance"><h3>🎨 Masaüstü Görünümü</h3><div class="formGrid two"><label>Duvar kağıdı<select id="v14Wallpaper"><option value="blue">YEA Mavi</option><option value="night">Gece</option><option value="aurora">Aurora</option><option value="graphite">Grafit</option><option value="light">Açık</option><option value="image">Kendi görselim</option></select></label><label>Kendi görselin<input id="v14WallpaperFile" type="file" accept="image/*" /></label></div><p class="tiny">Kendi görselin yalnız bu cihazda saklanır. En fazla 1 MB önerilir.</p></div>`);
    if(!document.querySelector('#v14WindowLayer'))document.body.insertAdjacentHTML('beforeend',`<div id="v14WindowLayer" class="v14WindowLayer"></div><div id="v14TrashWindow" class="v14Window hidden" data-v14-window="trash"><div class="v14WinBar"><b>🗑 Çöp Kutusu</b><div><button data-v14-min="trash">—</button><button data-v14-max="trash">□</button><button data-v14-close="trash">✕</button></div></div><div class="v14WinBody"><div class="v14TrashActions"><button id="v14TrashEmpty" type="button" class="danger">Çöp Kutusunu Boşalt</button></div><div id="v14TrashList" class="v14TrashList"></div></div><div class="v14Resize"></div></div>`);
    const taskbar=document.querySelector('#v13Taskbar');
    if(taskbar&&!document.querySelector('#v14TaskbarFiles'))taskbar.querySelector('.v13TaskbarSpacer')?.insertAdjacentHTML('beforebegin','<button id="v14TaskbarFiles" type="button" title="Dosyalar">🗃</button><button id="v14TaskbarTrash" type="button" title="Çöp Kutusu">🗑</button>');
    const startApps=document.querySelector('#v13StartMenu .v13StartApps');
    if(startApps&&!document.querySelector('#v14StartFiles'))startApps.insertAdjacentHTML('beforeend','<button id="v14StartFiles" type="button">🗃 Dosya Yöneticisi</button><button id="v14StartTrash" type="button">🗑 Çöp Kutusu</button>');
    const x=document.createElement('script');x.src='./v14-core.js';document.head.appendChild(x);
  }
  wait();
})();
