'use strict';
(()=>{function load(src,next){const s=document.createElement('script');s.src=src;s.onload=next;s.onerror=()=>{const box=document.querySelector('#appMsg')||document.querySelector('#authMsg');if(box){box.textContent='YEA V0.9 dosyası yüklenemedi. Sayfayı yenileyin.';box.classList.remove('hidden')}};document.head.appendChild(s)}
load('./v07.js',()=>load('./v08-assistant.js',()=>load('./v09-decision.js')));
})();