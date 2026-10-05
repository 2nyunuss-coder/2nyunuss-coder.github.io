(()=>{
  if(window.__RPYS_SDS_COMPARE_V1__)return;
  window.__RPYS_SDS_COMPARE_V1__=true;
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const norm=s=>String(s??"").trim().toLocaleUpperCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ");
  const num=v=>{if(typeof v==="number"&&Number.isFinite(v))return v;const s=String(v??"").trim();if(!s)return 0;const n=Number(s.replace(/[^\d-]/g,""));return Number.isFinite(n)?n:0};
  const inputRows=wb=>{
    const result=new Map();
    const rowsFor=name=>{const sh=wb.Sheets[name];return sh?XLSX.utils.sheet_to_json(sh,{header:1,defval:null,raw:true}):[]};
    const process=(rows,kind)=>{
      let h=-1;
      for(let i=0;i<Math.min(rows.length,20);i++)if(norm(rows[i]?.[0])==="BRANS"&&norm(rows[i]?.[1]).startsWith("DOKTOR")){h=i;break}
      if(h<0)return;
      for(let i=h+1;i<rows.length;i++){
        const r=rows[i]||[],branch=String(r[0]??"").trim(),doctor=String(r[1]??"").trim(),key=norm(doctor);
        if(!key||norm(branch)==="GENEL TOPLAM")continue;
        let x=result.get(key);if(!x){x={doctor,branch,mr:[0,0,0],bt:[0,0,0],usg:[0,0,0]};result.set(key,x)}
        if(branch)x.branch=branch;
        if(kind==="mrbt"){
          [2,3,4].forEach((c,j)=>x.mr[j]+=num(r[c]));
          [6,7,8].forEach((c,j)=>x.bt[j]+=num(r[c]));
        }else [2,3,4].forEach((c,j)=>x.usg[j]+=num(r[c]));
      }
    };
    const mrName=wb.SheetNames.find(n=>norm(n).includes("MR")||norm(n).includes("BT"));
    const usgName=wb.SheetNames.find(n=>norm(n).includes("USG"));
    if(mrName)process(rowsFor(mrName),"mrbt");
    if(usgName)process(rowsFor(usgName),"usg");
    if(!mrName&&!usgName)throw new Error("MR&BT veya USG adlı sayfa bulunamadı.");
    return result;
  };
  const metric=(oldV,newV)=>{
    const pct=(newV-oldV)/oldV*100;
    const diff=oldV===0?(newV>0?"Yeni":"—"):`${pct>0?"+":""}${pct.toFixed(1)}%`;
    return `<span class="v">${oldV} → ${newV}</span><small>${diff}</small>`;
  };
  const buildHtml=(oldMap,newMap,oldMonth,newMonth)=>{
    const keys=new Set([...oldMap.keys(),...newMap.keys()]);
    const docs=[...keys].map(k=>({k,o:oldMap.get(k)||null,n:newMap.get(k)||null})).sort((a,b)=>String(a.n?.branch||a.o?.branch||"").localeCompare(String(b.n?.branch||b.o?.branch||""),"tr")||String(a.n?.doctor||a.o?.doctor||"").localeCompare(String(b.n?.doctor||b.o?.doctor||""),"tr"));
    const heads=["Branş","Hekim",...["MR","BT","USG"].flatMap(m=>["Pol","Acil","Klinik"].map(s=>`${m}<br>${s}`))];
    const body=docs.map(({o,n})=>{const d=n||o;const cells=[`<td>${esc(n?.branch||o?.branch||"")}</td>`,`<td class="doctor">${esc(d.doctor)}</td>`];for(const group of ["mr","bt","usg"])for(let i=0;i<3;i++)cells.push(`<td class="metric">${metric(o?.[group]?.[i]||0,n?.[group]?.[i]||0)}</td>`);return `<tr>${cells.join("")}</tr>`}).join("");
    const groups=["mr","bt","usg"],groupLabels={mr:"MR",bt:"BT",usg:"USG"};
    const total=(month,group,i)=>docs.reduce((s,d)=>s+Number(month==="old"?d.o?.[group]?.[i]||0:d.n?.[group]?.[i]||0),0);
    const settingTotals=groups.flatMap(g=>[0,1,2].map(i=>`<td class="metric total-cell">${metric(total("old",g,i),total("new",g,i))}</td>`)).join("");
    const modalityTotals=groups.map(g=>{const a=total("old",g,0)+total("old",g,1)+total("old",g,2),b=total("new",g,0)+total("new",g,1)+total("new",g,2);return `<td colspan="3" class="metric total-cell"><b>${groupLabels[g]} toplamı</b>${metric(a,b)}</td>`}).join("");
    const allOld=groups.reduce((s,g)=>s+total("old",g,0)+total("old",g,1)+total("old",g,2),0),allNew=groups.reduce((s,g)=>s+total("new",g,0)+total("new",g,1)+total("new",g,2),0);
    const maxChanges=groups.flatMap(g=>[0,1,2].map(i=>{
      const candidates=docs.map(d=>({name:d.n?.doctor||d.o?.doctor||"",old:Number(d.o?.[g]?.[i]||0),cur:Number(d.n?.[g]?.[i]||0)})).filter(x=>x.old>0).map(x=>({...x,pct:(x.cur-x.old)/x.old*100}));
      const up=candidates.filter(x=>x.pct>0).sort((a,b)=>b.pct-a.pct)[0],down=candidates.filter(x=>x.pct<0).sort((a,b)=>a.pct-b.pct)[0];
      return `<td class="max-cell"><span>↑ ${up?`${esc(up.name)} +${up.pct.toFixed(1)}%`:"—"}</span><span>↓ ${down?`${esc(down.name)} ${down.pct.toFixed(1)}%`:"—"}</span></td>`
    })).join("");
    const summaries=`<tr class="summary"><th colspan="2">BİRİM TOPLAMLARI</th>${settingTotals}</tr><tr class="summary"><th colspan="2">MODALİTE TOPLAMI</th>${modalityTotals}</tr><tr class="summary grand"><th colspan="2">GENEL TOPLAM</th><td colspan="9" class="metric">${metric(allOld,allNew)}</td></tr><tr class="summary max"><th colspan="2">HEKİM BAZINDA EN BÜYÜK ARTIŞ / AZALIŞ</th>${maxChanges}</tr>`;
    const topDoctor=(which,g,i)=>{
      const vals=docs.map(d=>({name:which==="old"?d.o?.doctor||d.n?.doctor||"":d.n?.doctor||d.o?.doctor||"",count:Number(which==="old"?d.o?.[g]?.[i]||0:d.n?.[g]?.[i]||0)}));
      const max=Math.max(0,...vals.map(x=>x.count));
      if(!max)return {name:"—",count:0};
      return {name:vals.filter(x=>x.count===max).map(x=>x.name).join(", "),count:max};
    };
    const queryComparisons=groups.flatMap(g=>[0,1,2].map(i=>{
      const oldTop=topDoctor("old",g,i),newTop=topDoctor("new",g,i),pct=oldTop.count===0?(newTop.count>0?"Yeni":"—"):`${((newTop.count-oldTop.count)/oldTop.count*100>0?"+":"")}${((newTop.count-oldTop.count)/oldTop.count*100).toFixed(1)}%`;
      return `<li><b>${groupLabels[g]} · ${["Poliklinik","Acil","Klinik"][i]}:</b> ${esc(oldMonth)} en yüksek: ${oldTop.name} (${oldTop.count}); ${esc(newMonth)} en yüksek: ${newTop.name} (${newTop.count}). En yüksek istem sayısı değişimi: ${pct}.</li>`
    })).join("");
    return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>SDS Görüntüleme İstem Karşılaştırması</title><style>
      @page{size:A4 landscape;margin:6mm}*{box-sizing:border-box}body{font:8pt Arial,sans-serif;color:#111;margin:0}h1{font-size:13pt;text-align:center;margin:0 0 2mm}h2{font-size:8pt;margin:3mm 0 1mm}p{font-size:7pt;text-align:center;margin:0 0 3mm}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:.35pt solid #667085;padding:.8mm .45mm;text-align:center;vertical-align:middle;overflow-wrap:anywhere}th{background:#17365d;color:white;font-size:6.2pt}td{font-size:5.9pt}.doctor{text-align:left;font-weight:bold}.metric .v{display:block;white-space:nowrap;font-weight:bold}.metric small{display:block;font-size:5.2pt;color:#374151}.summary th,.summary td{background:#eaf0f6;font-weight:bold}.summary.grand th,.summary.grand td{background:#d9e5f1}.summary.max th,.summary.max td{background:#f2f4f7}.max-cell{font-size:4.8pt;line-height:1.05}.max-cell span{display:block}ol{margin:0;padding-left:5mm}li{font-size:6pt;line-height:1.2;margin:.4mm 0}.note{font-size:5.8pt;text-align:left;margin-top:2mm}@media screen{body{padding:10mm}table{max-width:1200px;margin:auto}h1,p,.note,ol,h2{max-width:1200px;margin-left:auto;margin-right:auto}}
      </style></head><body><h1>SDS Görüntüleme Tetkik İstemleri</h1><p>${esc(oldMonth)} → ${esc(newMonth)} | Hekim verileri ve toplamlar tek tabloda; hücrelerde önceki sayı → yeni sayı ve yüzde değişim</p><table><thead><tr>${heads.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${body}${summaries}</tbody></table><h2>SDS Sorgu Karşılaştırmaları</h2><ol>${queryComparisons}</ol><div class="note">Yüzde değişim = (yeni ay − önceki ay) / önceki ay. Önceki ay değeri 0 ve yeni ay değeri pozitifse “Yeni”, iki ay da 0 ise “—” gösterilir. En büyük artış/azalış satırında önceki ay değeri sıfırdan büyük hekimlerin yüzde değişimleri gösterilir. Hekimler adlarına göre eşleştirilmiştir.</div></body></html>`;
  };
  function openDialog(){
    if(document.getElementById("rpysSdsCompareModal"))return;
    const m=document.createElement("div");m.id="rpysSdsCompareModal";m.innerHTML=`<div class="sc-card"><button class="sc-close" type="button" aria-label="Kapat">×</button><h2>SDS aylık hekim karşılaştırması</h2><p>Önceki ay ve yeni ay dosyalarını yükleyin. Dosyalarda MR&BT ile USG sayfaları ve hekim bazında Pol, Acil, Klinik sütunları bulunmalı.</p><div class="sc-grid"><label>Önceki ay adı<input id="scOldMonth" type="text" value="Önceki ay"></label><label>Yeni ay adı<input id="scNewMonth" type="text" value="Yeni ay"></label><label>Önceki ay Excel dosyası<input id="scOldFile" type="file" accept=".xlsx,.xls"></label><label>Yeni ay Excel dosyası<input id="scNewFile" type="file" accept=".xlsx,.xls"></label></div><div class="sc-actions"><button id="scBuild" type="button">Tabloyu oluştur</button><button id="scDownload" type="button" disabled>Word evrakını indir</button><button id="scPrint" type="button" disabled>Yazdır / PDF</button></div><div id="scStatus" role="status"></div><div id="scPreview"></div></div>`;
    m.style.cssText="position:fixed;inset:0;background:#071426b8;z-index:2147483600;display:grid;place-items:center;padding:14px;font:14px Arial,sans-serif";
    const style=document.createElement("style");style.textContent="#rpysSdsCompareModal .sc-card{position:relative;background:#fff;color:#17365d;width:min(1100px,96vw);max-height:92vh;overflow:auto;border-radius:14px;padding:22px;box-shadow:0 16px 60px #0005}#rpysSdsCompareModal h2{margin:0 0 8px;font-size:20px}#rpysSdsCompareModal p{line-height:1.5}#rpysSdsCompareModal .sc-close{position:absolute;right:12px;top:8px;border:0;background:none;font-size:28px;cursor:pointer}#rpysSdsCompareModal .sc-grid{display:grid;grid-template-columns:repeat(2,minmax(220px,1fr));gap:10px}#rpysSdsCompareModal label{display:grid;gap:5px;font-weight:700;font-size:12px}#rpysSdsCompareModal input{padding:8px;border:1px solid #b8c7d8;border-radius:6px;min-width:0}#rpysSdsCompareModal .sc-actions{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}#rpysSdsCompareModal button:not(.sc-close){padding:9px 12px;border:0;border-radius:7px;background:#17365d;color:white;font-weight:700;cursor:pointer}#rpysSdsCompareModal button:disabled{opacity:.45;cursor:not-allowed}#rpysSdsCompareModal #scStatus{font-size:12px;margin:8px 0}#rpysSdsCompareModal #scPreview{overflow:auto}#rpysSdsCompareModal table{border-collapse:collapse;width:100%;table-layout:fixed;font-size:10px}#rpysSdsCompareModal th,#rpysSdsCompareModal td{border:1px solid #8795a5;padding:4px;text-align:center}#rpysSdsCompareModal th{background:#17365d;color:white}#rpysSdsCompareModal td:first-child,#rpysSdsCompareModal td:nth-child(2){text-align:left}#rpysSdsCompareModal small{display:block;color:#475569}@media(max-width:650px){#rpysSdsCompareModal .sc-grid{grid-template-columns:1fr}#rpysSdsCompareModal .sc-card{padding:16px}}";document.head.append(style);document.body.append(m);
    m.querySelector(".sc-close").onclick=()=>{m.remove();style.remove()};m.addEventListener("click",e=>{if(e.target===m){m.remove();style.remove()}});
    let output="";
    const status=m.querySelector("#scStatus"),preview=m.querySelector("#scPreview"),download=m.querySelector("#scDownload"),print=m.querySelector("#scPrint");
    m.querySelector("#scBuild").onclick=async()=>{try{if(!window.XLSX)throw new Error("Excel okuma bileşeni yüklenemedi.");const of=m.querySelector("#scOldFile").files[0],nf=m.querySelector("#scNewFile").files[0];if(!of||!nf)throw new Error("İki ay için de Excel dosyası seçin.");status.textContent="Dosyalar okunuyor…";const [ob,nb]=await Promise.all([of.arrayBuffer(),nf.arrayBuffer()]);const om=inputRows(XLSX.read(ob,{type:"array"})),nm=inputRows(XLSX.read(nb,{type:"array"}));if(!om.size||!nm.size)throw new Error("Dosyalarda hekim kayıtları bulunamadı.");output=buildHtml(om,nm,m.querySelector("#scOldMonth").value||"Önceki ay",m.querySelector("#scNewMonth").value||"Yeni ay");const d=new DOMParser().parseFromString(output,"text/html");preview.innerHTML=`<div><b>${om.size}</b> önceki ay, <b>${nm.size}</b> yeni ay hekim kaydı eşleştirildi. Toplam <b>${d.querySelectorAll("tbody tr").length}</b> hekim.</div>`+d.querySelector("table").outerHTML;status.textContent="Karşılaştırma hazır. Tablo Word evrakında tek kez yer alır.";download.disabled=print.disabled=false}catch(e){output="";download.disabled=print.disabled=true;status.textContent=e?.message||"Dosyalar okunamadı."}};
    download.onclick=()=>{if(!output)return;const blob=new Blob(["\ufeff",output],{type:"application/msword;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="SDS_Goruntuleme_Karsilastirmasi.doc";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000)};
    print.onclick=()=>{if(!output)return;const w=window.open("","_blank");if(!w)return alert("Yazdırma penceresi engellendi. İzin verip tekrar deneyin.");w.onload=()=>setTimeout(()=>w.print(),200);w.document.open();w.document.write(output);w.document.close()};
  }
  function mount(){
    if(!document.body||document.getElementById("rpysSdsCompareOpen"))return;
    const card=[...document.querySelectorAll("section,div,article")].filter(el=>/Hekim\s*\/\s*Branş İstem Dosyalarını Yükle/i.test(el.innerText||"")&&el.querySelector("button")).sort((a,b)=>(a.innerText||"").length-(b.innerText||"").length)[0];
    if(!card)return;
    const b=document.createElement("button");b.id="rpysSdsCompareOpen";b.type="button";b.className="btn alt";b.textContent="Önceki Ay + Bu Ayı Karşılaştır";b.style.cssText="display:inline-block;margin:0 0 0 8px;padding:8px 10px;font-weight:700";b.onclick=openDialog;
    const fileButton=[...card.querySelectorAll("button")].find(x=>/^Dosya Seç$/i.test((x.innerText||x.textContent||"").trim()));
    if(fileButton)fileButton.insertAdjacentElement("afterend",b);else card.append(b);
  }
  const start=()=>{mount();new MutationObserver(mount).observe(document.body,{childList:true,subtree:true})};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
