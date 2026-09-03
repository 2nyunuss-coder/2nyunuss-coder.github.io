'use strict';
(()=>{
 const q=s=>document.querySelector(s);
 const esc=s=>String(s??'');
 const wait=()=>{if(window.__YEA_V13_BOOTED&&q('#v13PdfAddText')&&q('#v13Context')&&window.PDFLib)install();else setTimeout(wait,80)};
 function loadItems(){try{const a=JSON.parse(localStorage.getItem('yea_v13_desktop_items')||'[]');return Array.isArray(a)?a:[]}catch{return[]}}
 function saveItems(a){localStorage.setItem('yea_v13_desktop_items',JSON.stringify(a));location.reload()}
 function install(){if(window.__YEA_V13_FIX__)return;window.__YEA_V13_FIX__=1;
   q('#v13DesktopGrid')?.addEventListener('contextmenu',e=>{const i=e.target.closest('.v13DeskIcon');if(i)q('#v13Context').dataset.itemId=i.dataset.id},true);
   q('#v13Context').addEventListener('click',e=>{const b=e.target.closest('[data-v13-ctx="rename"]');if(!b)return;const id=q('#v13Context').dataset.itemId,x=loadItems().find(i=>i.id===id);if(!x||['url','path','app'].includes(x.type))return;e.preventDefault();e.stopImmediatePropagation();const n=prompt('Yeni ad',x.name);if(!n?.trim())return;saveItems(loadItems().map(i=>i.id===x.id?{...i,name:n.trim()}:i))},true);
   const btn=q('#v13PdfAddText');btn.addEventListener('click',async e=>{e.preventDefault();e.stopImmediatePropagation();try{
     const frame=q('#v13PdfFrame'),src=frame?.src;if(!src||!src.startsWith('blob:'))return q('#v13PdfMsg').textContent='Önce PDF aç.';
     const text=q('#v13PdfText').value;if(!text.trim())return q('#v13PdfMsg').textContent='Metin yaz.';
     const bytes=await (await fetch(src.split('#')[0])).arrayBuffer(),doc=await PDFLib.PDFDocument.load(bytes),pageNo=Math.max(1,Math.min(doc.getPageCount(),Number(q('#v13PdfPageNo').value||1))),page=doc.getPage(pageNo-1),size=Math.max(6,Number(q('#v13PdfSize').value||12)),scale=4,lines=text.split(/\n/),cv=document.createElement('canvas'),ctx0=cv.getContext('2d');ctx0.font=`${size*scale}px Arial, sans-serif`;const widths=lines.map(l=>ctx0.measureText(l||' ').width);cv.width=Math.max(16,Math.ceil(Math.max(...widths)+8*scale));cv.height=Math.max(16,Math.ceil(lines.length*size*1.4*scale));const ctx=cv.getContext('2d');ctx.clearRect(0,0,cv.width,cv.height);ctx.font=`${size*scale}px Arial, sans-serif`;ctx.textBaseline='top';ctx.fillStyle=q('#v13PdfColor').value==='red'?'#cc1111':q('#v13PdfColor').value==='blue'?'#1144bb':'#000';lines.forEach((l,i)=>ctx.fillText(l,2*scale,i*size*1.4*scale));const img=await doc.embedPng(cv.toDataURL('image/png')),mm=n=>Number(n||0)*72/25.4,w=cv.width/scale,h=cv.height/scale,x=mm(q('#v13PdfX').value),top=mm(q('#v13PdfY').value),y=page.getHeight()-top-h;page.drawImage(img,{x,y,width:w,height:h});const out=await doc.save(),name=(q('#v13PdfInfo').textContent.split(' • ')[0]||'belge.pdf').replace(/\.pdf$/i,'')+'_duzenleniyor.pdf',file=new File([out],name,{type:'application/pdf'}),dt=new DataTransfer();dt.items.add(file);const input=q('#v13PdfFile');input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));q('#v13PdfMsg').textContent='Metin eklendi. Türkçe karakterler desteklenir.';
   }catch(err){q('#v13PdfMsg').textContent='Metin eklenemedi: '+esc(err.message)}},true);
 }
 wait();
})();
