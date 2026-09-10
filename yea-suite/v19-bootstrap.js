'use strict';
(() => {
  const script=document.createElement('script');script.src='./v18-bootstrap.js?hp=2';document.head.append(script);
  window.YeaBoot.waitUntil(()=>document.querySelector('#v18Nav'),()=>{
    document.title='YEA Suite · Mobil Uygulama';
    document.querySelectorAll('a[href^="./arcade/"]').forEach(a=>{a.href='./arcade/v2.html';});
    const footer=document.querySelector('footer');if(footer)footer.textContent='YEA Suite 1.9 · Mobil uygulama';
  });
})();
