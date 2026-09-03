'use strict';
(()=>{
  const base=document.createElement('script');base.src='./v14-bootstrap.js';document.head.appendChild(base);
  const wait=()=>{if(window.__YEA_V14_BOOTED&&window.v13AppOpen&&document.querySelector('#v13Desktop')&&document.querySelector('#v14WindowLayer'))setup();else setTimeout(wait,50)};
  function setup(){
    if(window.__YEA_V15_BOOTED)return;window.__YEA_V15_BOOTED=true;
    document.title='YEA Suite V1.5 Desktop';
    document.querySelectorAll('.eyebrow').forEach(e=>e.textContent='YEA SUITE • V1.5 DESKTOP');
    const footer=document.querySelector('footer');if(footer)footer.textContent='YEA Suite V1.5 • Yerel masaüstü araçları • RPYS’den bağımsız';
    const tabs=document.querySelector('#tabs');
    const filesBtn=tabs?.querySelector('[data-tab="files"]');
    if(filesBtn&&!tabs.querySelector('[data-tab="notepad"]'))filesBtn.insertAdjacentHTML('afterend','<button data-tab="notepad">📝 Not Defteri</button><button data-tab="calculator">🧮 Hesap</button>');

    const files=document.querySelector('[data-page="files"]');
    if(files&&!document.querySelector('[data-page="notepad"]'))files.insertAdjacentHTML('afterend',`
      <section data-page="notepad" class="panel hidden"><div class="sectionHead"><div><h2>📝 Not Defteri</h2><p>Notlar yalnız bu cihazda tutulur. İstersen .txt olarak indir.</p></div></div><div class="v15NotePage"><button id="v15OpenNotepadWindow" type="button">Pencerede Aç</button><div id="v15NotePreview" class="v15NotePreview"></div></div></section>
      <section data-page="calculator" class="panel hidden"><div class="sectionHead"><div><h2>🧮 Hesap Makinesi</h2><p>Temel dört işlem, yüzde ve parantez.</p></div></div><div class="v15CalcPage"><button id="v15OpenCalcWindow" type="button">Pencerede Aç</button><div id="v15CalcInline"></div></div></section>`);

    const start=document.querySelector('#v13StartMenu .v13StartApps');
    if(start&&!document.querySelector('#v15StartNotepad'))start.insertAdjacentHTML('beforeend','<button id="v15StartNotepad" type="button">📝 Not Defteri</button><button id="v15StartCalc" type="button">🧮 Hesap Makinesi</button>');
    const taskbar=document.querySelector('#v13Taskbar');
    if(taskbar&&!document.querySelector('#v15TaskNotepad'))taskbar.querySelector('.v13TaskbarSpacer')?.insertAdjacentHTML('beforebegin','<button id="v15TaskNotepad" type="button" title="Not Defteri">📝</button><button id="v15TaskCalc" type="button" title="Hesap Makinesi">🧮</button>');

    if(!document.querySelector('#v15NotepadWindow'))document.body.insertAdjacentHTML('beforeend',`
      <div id="v15NotepadWindow" class="v14Window v15Window hidden" data-v14-window="notepad">
        <div class="v14WinBar"><b>📝 Not Defteri</b><div><button data-v14-min="notepad">—</button><button data-v14-max="notepad">□</button><button data-v14-close="notepad">✕</button></div></div>
        <div class="v14WinBody v15NoteBody">
          <div class="v15NoteToolbar"><button id="v15NoteNew" type="button">＋ Yeni</button><button id="v15NoteSave" type="button">💾 Kaydet</button><button id="v15NoteDownload" type="button" class="ghost">⬇ TXT</button><button id="v15NoteDelete" type="button" class="danger">Sil</button><select id="v15NoteSelect"></select></div>
          <input id="v15NoteTitle" maxlength="120" placeholder="Not başlığı" />
          <textarea id="v15NoteText" spellcheck="true" placeholder="Notunu yaz…"></textarea>
          <div class="v15NoteStatus"><span id="v15NoteStatus">Kaydedilmedi</span><span id="v15NoteCount">0 karakter</span></div>
        </div><div class="v14Resize"></div>
      </div>
      <div id="v15CalcWindow" class="v14Window v15CalcWindow hidden" data-v14-window="calculator">
        <div class="v14WinBar"><b>🧮 Hesap Makinesi</b><div><button data-v14-min="calculator">—</button><button data-v14-max="calculator">□</button><button data-v14-close="calculator">✕</button></div></div>
        <div class="v14WinBody v15CalcBody">
          <div id="v15CalcHistory" class="v15CalcHistory"></div>
          <input id="v15CalcDisplay" inputmode="decimal" autocomplete="off" placeholder="0" />
          <div id="v15CalcKeys" class="v15CalcKeys">
            <button data-calc="clear" class="fn">C</button><button data-calc="(" class="fn">(</button><button data-calc=")" class="fn">)</button><button data-calc="/" class="op">÷</button>
            <button data-calc="7">7</button><button data-calc="8">8</button><button data-calc="9">9</button><button data-calc="*" class="op">×</button>
            <button data-calc="4">4</button><button data-calc="5">5</button><button data-calc="6">6</button><button data-calc="-" class="op">−</button>
            <button data-calc="1">1</button><button data-calc="2">2</button><button data-calc="3">3</button><button data-calc="+" class="op">+</button>
            <button data-calc="percent" class="fn">%</button><button data-calc="0">0</button><button data-calc=".">,</button><button data-calc="=" class="equals">=</button>
          </div>
        </div><div class="v14Resize"></div>
      </div>
      <div id="v15DesktopContext" class="v13Context v15DesktopContext hidden">
        <button data-v15-dctx="folder">📁 Yeni klasör</button><button data-v15-dctx="shortcut">🔗 Yeni kısayol</button><button data-v15-dctx="note">📝 Not Defteri</button><button data-v15-dctx="paste">📋 Yapıştır</button><button data-v15-dctx="refresh">↻ Yenile</button><button data-v15-dctx="wallpaper">🎨 Duvar kağıdı</button>
      </div>
      <div id="v15FileContext" class="v13Context v15FileContext hidden">
        <button data-v15-fctx="open">Aç</button><button data-v15-fctx="copy">Kopyala</button><button data-v15-fctx="cut">Kes / Taşı</button><button data-v15-fctx="rename">Yeniden adlandır</button><button data-v15-fctx="trash" class="dangerText">Çöp Kutusuna Taşı</button>
      </div>
      <div id="v15DropHint" class="v15DropHint hidden"><b>Dosyayı YEA Masaüstüne bırak</b><span>Chrome/Edge kalıcı dosya bağlantısını destekler.</span></div>`);
    const x=document.createElement('script');x.src='./v15-core.js';document.head.appendChild(x);
  }
  wait();
})();
