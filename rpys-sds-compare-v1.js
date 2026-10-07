(()=>{
  if(window.__RPYS_SDS_COMPARE_V1__)return;
  window.__RPYS_SDS_COMPARE_V1__=true;
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const norm=s=>String(s??"").trim().toLocaleUpperCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ");
  const isDoctorPlaceholder=s=>/^(DOKTOR|HEKIM)\s+SEC/.test(norm(s).replace(/[^A-Z0-9 ]/g," ").replace(/\s+/g," ").trim());
  const isAlwaysExcludedDoctor=s=>{
    const k=norm(s).replace(/[^A-Z0-9 ]/g," ").replace(/\s+/g," ").trim();
    return k==="GOKHAN OZDEMIR"||k==="OYKU MINE PAMUK"||/^BAHAR OZCELIK H?ANDEMIR$/.test(k);
  };
  const filteredMap=(map,excluded=new Set())=>new Map([...map].filter(([key,row])=>!excluded.has(key)&&!isAlwaysExcludedDoctor(row.doctor)&&!isDoctorPlaceholder(row.doctor)));
  const WORD_COMPARE_KEY="rpys_sds_compare_word_v1",EXCLUSIONS_KEY="rpys_sds_compare_excluded_v1";
  const readExclusions=()=>{try{return new Set(JSON.parse(localStorage.getItem(EXCLUSIONS_KEY)||"[]"))}catch(_){return new Set()}};
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
        if(!key||isDoctorPlaceholder(doctor)||isAlwaysExcludedDoctor(doctor)||norm(branch)==="GENEL TOPLAM")continue;
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
  const metric=(oldV,newV,oldKnown=true)=>{
    if(!oldKnown)return `<span class="v">– → ${newV}</span><small>–</small>`;
    const pct=(newV-oldV)/oldV*100;
    const diff=oldV===0?(newV>0?"Yeni":"—"):`${pct>0?"+":""}${pct.toFixed(1)}%`;
    return `<span class="v">${oldV} → ${newV}</span><small>${diff}</small>`;
  };
  const saveWordComparison=(html,oldMonth,newMonth)=>{const payload={html,oldMonth,newMonth,savedAt:new Date().toISOString()};window.__RPYS_SDS_WORD_COMPARE__=payload;try{localStorage.setItem(WORD_COMPARE_KEY,JSON.stringify(payload))}catch(e){console.warn("SDS Word karşılaştırma verisi saklanamadı",e)}};
  const xmlEsc=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
  const wordPara=(value,{bold=false,size=18,color="111111",align="left",after=80}={})=>{
    const lines=String(value??"").split(/\n+/).filter(x=>x.trim());
    return (lines.length?lines:[""]).map(line=>`<w:p><w:pPr><w:spacing w:after="${after}"/><w:jc w:val="${align}"/></w:pPr><w:r><w:rPr>${bold?"<w:b/>":""}<w:sz w:val="${size}"/><w:color w:val="${color}"/></w:rPr><w:t xml:space="preserve">${xmlEsc(line.trim())}</w:t></w:r></w:p>`).join("");
  };
  const comparisonSections=doc=>{
    const branch=[...doc.querySelectorAll(".branch-line")].map(x=>x.innerText||x.textContent||"").filter(Boolean);
    const queries=[...doc.querySelectorAll(".comparison-list li")].map(x=>x.innerText||x.textContent||"").filter(Boolean);
    const note=doc.querySelector(".note")?.innerText||doc.querySelector(".note")?.textContent||"";
    let out="";
    if(branch.length){out+=wordPara("Branş Karşılaştırmaları",{bold:true,size:22,after:100});for(const x of branch)out+=wordPara(x,{size:18,after:50})}
    if(queries.length){out+=wordPara("Karşılaştırmalar",{bold:true,size:22,after:100});for(const x of queries)out+=wordPara(x,{size:18,after:70})}
    if(note)out+=wordPara(note,{size:15,after:80});
    return out;
  };
  const comparisonTableXml=table=>{
    const widths=[1050,1450,878,878,878,878,878,878,878,878,878],total=widths.reduce((a,b)=>a+b,0);
    const borders=`<w:tblBorders><w:top w:val="single" w:sz="5" w:color="667085"/><w:left w:val="single" w:sz="5" w:color="667085"/><w:bottom w:val="single" w:sz="5" w:color="667085"/><w:right w:val="single" w:sz="5" w:color="667085"/><w:insideH w:val="single" w:sz="4" w:color="8795A5"/><w:insideV w:val="single" w:sz="4" w:color="8795A5"/></w:tblBorders>`;
    const grid=`<w:tblGrid>${widths.map(w=>`<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>`;
    const rows=[...table.rows].map((row,ri)=>{
      const isHead=ri===0||!!row.closest("thead"),cl=String(row.className||""),fill=isHead?"17365D":cl.includes("grand")?"D9E5F1":cl.includes("max")?"F2F4F7":cl.includes("summary")?"EAF0F6":"FFFFFF",bold=isHead||cl.includes("summary");
      let col=0,cells="";
      for(const c of [...row.cells]){
        const span=Math.max(1,Number(c.colSpan)||1),width=widths.slice(col,col+span).reduce((a,b)=>a+b,0)||Math.floor(total/11);col+=span;
        const raw=(c.innerText||c.textContent||"").replace(/\r/g,"").replace(/[ \t]+/g," ").trim(),lines=raw.split(/\n+/).map(x=>x.trim()).filter(Boolean),font=isHead?12:cl.includes("max")?10:11,color=isHead?"FFFFFF":"111111";
        const paras=(lines.length?lines:[""]).map(line=>`<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="150" w:lineRule="auto"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr>${bold?"<w:b/>":""}<w:sz w:val="${font}"/><w:color w:val="${color}"/></w:rPr><w:t xml:space="preserve">${xmlEsc(line)}</w:t></w:r></w:p>`).join("");
        cells+=`<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${span>1?`<w:gridSpan w:val="${span}"/>`:""}<w:shd w:fill="${fill}"/><w:vAlign w:val="center"/></w:tcPr>${paras}</w:tc>`;
      }
      return `<w:tr><w:trPr><w:cantSplit/></w:trPr>${cells}</w:tr>`;
    }).join("");
    return `<w:tbl><w:tblPr><w:tblW w:w="${total}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="40" w:type="dxa"/><w:left w:w="30" w:type="dxa"/><w:bottom w:w="40" w:type="dxa"/><w:right w:w="30" w:type="dxa"/></w:tblCellMar>${borders}</w:tblPr>${grid}${rows}</w:tbl>`;
  };
  const applyComparisonToWord=(xml,payload)=>{
    const htmlDoc=new DOMParser().parseFromString(payload.html,"text/html"),table=htmlDoc.querySelector("table");
    if(!table)return{xml,count:0};
    const replacement=comparisonTableXml(table)+comparisonSections(htmlDoc),norm=s=>String(s||"").toLocaleUpperCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^A-Z0-9]+/g," ").trim(),W="http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    const wordDoc=new DOMParser().parseFromString(xml,"application/xml"),all=[...wordDoc.getElementsByTagNameNS(W,"tbl")],top=all.filter(t=>{for(let p=t.parentNode;p&&p!==wordDoc;p=p.parentNode)if(p.namespaceURI===W&&p.localName==="tbl")return false;return true});
    const targets=top.filter(t=>{
      const firstRows=[...t.childNodes].filter(n=>n.nodeType===1&&n.namespaceURI===W&&n.localName==="tr").slice(0,3).map(row=>norm([...row.getElementsByTagNameNS(W,"t")].map(n=>n.textContent||"").join(" "))),head=firstRows.join(" "),u=norm([...t.getElementsByTagNameNS(W,"t")].map(n=>n.textContent||"").join(" "));
      const metricTitle=head.includes("MR VE BT TETKIK SAYILARI")||head.includes("USG TETKIK SAYILARI");
      const doctorMetric=/^BRANS HEKIM/.test(head)&&/(MR|BT|USG)/.test(head)&&/(POLIKLINIK|ACIL|KLINIK)/.test(head);
      const emergencyMetric=/^ACIL SERVIS/.test(head)&&/(MR|BT|USG)/.test(head)&&(head.includes("TOPLAM")||head.includes("HEKIM")||head.includes("BRANS"));
      return metricTitle||doctorMetric||emergencyMetric;
    });
    if(!targets.length)return{xml,count:0};
    const fragment=new DOMParser().parseFromString(`<w:root xmlns:w="${W}">${replacement}</w:root>`,"application/xml"),nodes=[...fragment.documentElement.childNodes].filter(n=>n.nodeType===1).map(n=>wordDoc.importNode(n,true)),parent=targets[0].parentNode;
    for(const n of nodes)parent.insertBefore(n,targets[0]);
    for(const t of targets)t.parentNode?.removeChild(t);
    return{xml:new XMLSerializer().serializeToString(wordDoc),count:targets.length};
  };
  function installFullWordIntegration(){
    const core=window.SDS_WORD_CORE;if(!core?.gen||!core.gen.__sds18||core.gen.__rpysSdsCompareV1)return false;
    const old=core.gen,gen=async function(m,tpl){const ab=await old.call(this,m,tpl);try{let payload=window.__RPYS_SDS_WORD_COMPARE__;try{payload=JSON.parse(localStorage.getItem(WORD_COMPARE_KEY)||"null")||payload}catch(_){}if(!payload?.html)return ab;const z=await JSZip.loadAsync(ab),f=z.file("word/document.xml");if(!f)return ab;const result=applyComparisonToWord(await f.async("string"),payload);if(!result.count){console.warn("SDS karşılaştırma: şablonda değiştirilecek tetkik tablosu bulunamadı");return ab}z.file("word/document.xml",result.xml);window.__RPYS_SDS_WORD_COMPARE_APPLIED__={tables:result.count,at:new Date().toISOString(),months:[payload.oldMonth,payload.newMonth]};return await z.generateAsync({type:"arraybuffer",compression:"DEFLATE"})}catch(e){console.error("SDS Tam Evrak karşılaştırma entegrasyonu",e);return ab}};
    gen.__sds18=true;gen.__s392v4=true;gen.__sdsCompareV1=true;gen.__rpysSdsCompareV1=true;core.gen=gen;return true;
  }
  const wordWrapTimer=setInterval(()=>{if(installFullWordIntegration())clearInterval(wordWrapTimer)},200);
  setTimeout(()=>clearInterval(wordWrapTimer),30000);
  window.addEventListener("rpys-direct-core-ready",()=>setTimeout(installFullWordIntegration,160));
  const branchRows=map=>{
    const branches=new Map();
    for(const d of map.values()){
      const name=String(d.branch||"").trim();if(!name)continue;
      const k=norm(name);let b=branches.get(k);
      if(!b){b={name,mr:[0,0,0],bt:[0,0,0],usg:[0,0,0]};branches.set(k,b)}
      for(const g of ["mr","bt","usg"])for(let i=0;i<3;i++)b[g][i]+=Number(d[g]?.[i]||0);
    }
    return branches;
  };
  const buildHtml=(oldMap,newMap,oldMonth,newMonth,excluded=new Set())=>{
    oldMap=filteredMap(oldMap,excluded);newMap=filteredMap(newMap,excluded);
    const keys=new Set([...oldMap.keys(),...newMap.keys()]);
    const docs=[...keys].map(k=>({k,o:oldMap.get(k)||null,n:newMap.get(k)||null})).sort((a,b)=>String(a.n?.branch||a.o?.branch||"").localeCompare(String(b.n?.branch||b.o?.branch||""),"tr")||String(a.n?.doctor||a.o?.doctor||"").localeCompare(String(b.n?.doctor||b.o?.doctor||""),"tr"));
    const heads=["Branş","Hekim",...["MR","BT","USG"].flatMap(m=>["Pol","Acil","Klinik"].map(s=>`${m}<br>${s}`))];
    const body=docs.map(({o,n})=>{const d=n||o;const cells=[`<td>${esc(n?.branch||o?.branch||"")}</td>`,`<td class="doctor">${esc(d.doctor)}</td>`];for(const group of ["mr","bt","usg"])for(let i=0;i<3;i++)cells.push(`<td class="metric">${metric(o?.[group]?.[i]||0,n?.[group]?.[i]||0,!!o)}</td>`);return `<tr>${cells.join("")}</tr>`}).join("");
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
    const oldBranches=branchRows(oldMap),newBranches=branchRows(newMap),branchKeys=new Set([...oldBranches.keys(),...newBranches.keys()]);
    const branchComparisons=[...branchKeys].map(k=>{
      const o=oldBranches.get(k)||null,n=newBranches.get(k)||null,b=n||o;
      const modalityLine=["mr","bt","usg"].map((g,i)=>{
        const ov=o?o[g].reduce((s,v)=>s+v,0):0,nv=n?n[g].reduce((s,v)=>s+v,0):0;
        return `${groupLabels[g]} ${metric(ov,nv,!!o)}`;
      }).join("; ");
      const ov=o?[...o.mr,...o.bt,...o.usg].reduce((s,v)=>s+v,0):0,nv=n?[...n.mr,...n.bt,...n.usg].reduce((s,v)=>s+v,0):0;
      return `<p class="branch-line"><b>${esc(b.name)}:</b> ${modalityLine}; Genel ${metric(ov,nv,!!o)}</p>`;
    }).join("");
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
    const metricText=(oldV,newV,oldKnown)=>{
      if(!oldKnown)return `– → ${newV} (–)`;
      if(oldV===0)return newV>0?`0 → ${newV} (Yeni)`:"0 → 0 (—)";
      const pct=(newV-oldV)/oldV*100;return `${oldV} → ${newV} (${pct>0?"+":""}${pct.toFixed(1)}%)`;
    };
    const doctorComparisons=docs.map(({o,n})=>{
      const doctor=n?.doctor||o?.doctor||"",changes=groups.flatMap(g=>[0,1,2].map(i=>`${groupLabels[g]} ${["Poliklinik","Acil","Klinik"][i]} ${metricText(Number(o?.[g]?.[i]||0),Number(n?.[g]?.[i]||0),!!o)}`));
      return `<li><b>${esc(doctor)}:</b> ${changes.join("; ")}.</li>`;
    }).join("");
    return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>SDS Görüntüleme İstem Karşılaştırması</title><style>
      @page{size:A4 landscape;margin:6mm}*{box-sizing:border-box}body{font:8pt Arial,sans-serif;color:#111;margin:0}h1{font-size:13pt;text-align:center;margin:0 0 2mm}h2{font-size:10pt;font-weight:bold;margin:3mm 0 1mm}p{font-size:7pt;text-align:center;margin:0 0 3mm}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:.35pt solid #667085;padding:.8mm .45mm;text-align:center;vertical-align:middle;overflow-wrap:anywhere}th{background:#17365d;color:white;font-size:6.2pt}td{font-size:5.9pt}.doctor{text-align:left;font-weight:bold;white-space:normal;overflow-wrap:anywhere}.metric .v{display:block;white-space:nowrap;font-weight:bold}.metric small{display:block;font-size:5.2pt;color:#374151}.summary,.summary th,.summary td{background:#eaf0f6;font-weight:900!important;color:#000!important;border:1pt solid #24364b!important}.summary.grand th,.summary.grand td{background:#d9e5f1!important}.summary.max th,.summary.max td{background:#f2f4f7!important}.summary .metric,.summary .metric .v,.summary .metric small{font-weight:900!important;color:#000!important}.max-cell{font-size:4.8pt;line-height:1.05}.max-cell span{display:block}.branch-line{font-size:8.5pt;line-height:1.3;text-align:left;margin:1mm 0}.comparison-list{margin:0;padding-left:5mm}.comparison-list li{font-size:8.5pt;line-height:1.3;margin:1mm 0}.note{font-size:7.5pt;text-align:left;margin-top:2mm}@media screen{body{padding:10mm}table{max-width:1200px;margin:auto}h1,p,.note,ol,h2,.branch-line{max-width:1200px;margin-left:auto;margin-right:auto}}
      </style></head><body><h1>SDS Görüntüleme Tetkik İstemleri</h1><p>${esc(oldMonth)} → ${esc(newMonth)} | Hekim verileri ve toplamlar tek tabloda; hücrelerde önceki sayı → yeni sayı ve yüzde değişim</p><table><colgroup><col style="width:10%"><col style="width:18%">${Array.from({length:9},()=>'<col style="width:8%">').join("")}</colgroup><thead><tr>${heads.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${body}${summaries}</tbody></table><h2>Branş Karşılaştırmaları</h2>${branchComparisons}<h2>Karşılaştırmalar</h2><ol class="comparison-list">${queryComparisons}${doctorComparisons}</ol><div class="note">Yüzde değişim = (yeni ay − önceki ay) / önceki ay. Önceki ay değeri 0 ve yeni ay değeri pozitifse “Yeni”, iki ay da 0 ise “—” gösterilir. Önceki ay hekim veya branş kaydı bulunmuyorsa hücrelerde “–” gösterilir. En büyük artış/azalış satırında önceki ay değeri sıfırdan büyük hekimlerin yüzde değişimleri gösterilir. “Doktor Seçiniz” satırları ve karşılaştırmadan çıkarmak için seçtiğiniz hekimler tablo, toplam ve metin listelerine alınmaz.</div></body></html>`;
  };
  function openDialog(){
    if(document.getElementById("rpysSdsCompareModal"))return;
    const m=document.createElement("div");m.id="rpysSdsCompareModal";m.innerHTML=`<div class="sc-card"><button class="sc-close" type="button" aria-label="Kapat">×</button><h2>SDS aylık hekim karşılaştırması</h2><p>Önceki ay ve yeni ay dosyalarını yükleyin. Dosyalarda MR&BT ile USG sayfaları ve hekim bazında Pol, Acil, Klinik sütunları bulunmalı.</p><div class="sc-grid"><label>Önceki ay adı<input id="scOldMonth" type="text" value="Önceki ay"></label><label>Yeni ay adı<input id="scNewMonth" type="text" value="Yeni ay"></label><label>Önceki ay Excel dosyası<input id="scOldFile" type="file" accept=".xlsx,.xls"></label><label>Yeni ay Excel dosyası<input id="scNewFile" type="file" accept=".xlsx,.xls"></label></div><section class="sc-exclusions"><b>Karşılaştırmadan çıkarılacak diğer hekimler</b><small>Seçtikleriniz tabloya, toplamlara, branşlara ve madde metinlerine alınmaz; tercihiniz saklanır. Belirttiğiniz hekimler ile “Doktor Seçiniz” her zaman dışarıda kalır.</small><div id="scDoctorList" class="sc-doctor-list">Önce iki dosyayı seçip tabloyu oluşturun.</div></section><div class="sc-actions"><button id="scBuild" type="button">Tabloyu oluştur / seçimi uygula</button><button id="scDownload" type="button" disabled>Word evrakını indir</button><button id="scPrint" type="button" disabled>Yazdır / PDF</button></div><div id="scStatus" role="status"></div><div id="scPreview"></div></div>`;
    m.style.cssText="position:fixed;inset:0;background:#071426b8;z-index:2147483600;display:grid;place-items:center;padding:14px;font:14px Arial,sans-serif";
    const style=document.createElement("style");style.textContent="#rpysSdsCompareModal .sc-card{position:relative;background:#fff;color:#17365d;width:min(1100px,96vw);max-height:92vh;overflow:auto;border-radius:14px;padding:22px;box-shadow:0 16px 60px #0005}#rpysSdsCompareModal h2{margin:0 0 8px;font-size:20px}#rpysSdsCompareModal p{line-height:1.5}#rpysSdsCompareModal .sc-close{position:absolute;right:12px;top:8px;border:0;background:none;font-size:28px;cursor:pointer}#rpysSdsCompareModal .sc-grid{display:grid;grid-template-columns:repeat(2,minmax(220px,1fr));gap:10px}#rpysSdsCompareModal label{display:grid;gap:5px;font-weight:700;font-size:12px}#rpysSdsCompareModal input{padding:8px;border:1px solid #b8c7d8;border-radius:6px;min-width:0}#rpysSdsCompareModal .sc-actions{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}#rpysSdsCompareModal button:not(.sc-close){padding:9px 12px;border:0;border-radius:7px;background:#17365d;color:white;font-weight:700;cursor:pointer}#rpysSdsCompareModal button:disabled{opacity:.45;cursor:not-allowed}#rpysSdsCompareModal #scStatus{font-size:12px;margin:8px 0}#rpysSdsCompareModal .sc-exclusions{margin-top:12px;padding:10px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc}#rpysSdsCompareModal .sc-exclusions>small{display:block;margin:4px 0 8px;color:#475569}#rpysSdsCompareModal .sc-doctor-list{display:grid;grid-template-columns:repeat(3,minmax(150px,1fr));gap:4px;max-height:145px;overflow:auto}#rpysSdsCompareModal label.sc-doctor-option{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:500}#rpysSdsCompareModal .sc-doctor-option input{width:auto;padding:0}#rpysSdsCompareModal #scPreview{overflow:auto}#rpysSdsCompareModal table{border-collapse:collapse;width:100%;table-layout:fixed;font-size:10px}#rpysSdsCompareModal th,#rpysSdsCompareModal td{border:1px solid #8795a5;padding:4px;text-align:center}#rpysSdsCompareModal th{background:#17365d;color:white}#rpysSdsCompareModal td:first-child,#rpysSdsCompareModal td:nth-child(2){text-align:left}#rpysSdsCompareModal #scPreview small{display:block;color:#475569}@media(max-width:650px){#rpysSdsCompareModal .sc-grid{grid-template-columns:1fr}#rpysSdsCompareModal .sc-doctor-list{grid-template-columns:1fr 1fr}#rpysSdsCompareModal .sc-card{padding:16px}}";document.head.append(style);document.body.append(m);
    m.querySelector(".sc-close").onclick=()=>{m.remove();style.remove()};m.addEventListener("click",e=>{if(e.target===m){m.remove();style.remove()}});
    let output="",loaded=null;
    const status=m.querySelector("#scStatus"),preview=m.querySelector("#scPreview"),download=m.querySelector("#scDownload"),print=m.querySelector("#scPrint"),doctorList=m.querySelector("#scDoctorList");
    const selectedDoctors=()=>new Set([...doctorList.querySelectorAll("input:checked")].map(x=>x.value));
    const drawDoctorOptions=(om,nm)=>{
      const names=new Map();for(const row of [...om.values(),...nm.values()])names.set(norm(row.doctor),row.doctor);
      const saved=readExclusions();
      doctorList.innerHTML=[...names].sort((a,b)=>a[1].localeCompare(b[1],"tr")).map(([key,name])=>`<label class="sc-doctor-option"><input type="checkbox" value="${esc(key)}"${saved.has(key)?" checked":""}><span>${esc(name)}</span></label>`).join("")||"Karşılaştırılacak hekim bulunamadı.";
    };
    const renderResult=()=>{
      if(!loaded)return;
      const excluded=selectedDoctors();try{localStorage.setItem(EXCLUSIONS_KEY,JSON.stringify([...excluded]))}catch(_){}
      const om=filteredMap(loaded.om,excluded),nm=filteredMap(loaded.nm,excluded);
      const oldMonth=m.querySelector("#scOldMonth").value||"Önceki ay",newMonth=m.querySelector("#scNewMonth").value||"Yeni ay";
      output=buildHtml(om,nm,oldMonth,newMonth,excluded);saveWordComparison(output,oldMonth,newMonth);
      const d=new DOMParser().parseFromString(output,"text/html"),sections=[...d.querySelectorAll("h2, .branch-line, .comparison-list")].map(x=>x.outerHTML).join("");
      preview.innerHTML=`<div><b>${om.size}</b> önceki ay, <b>${nm.size}</b> yeni ay hekim kaydı karşılaştırmaya alındı. Tabloda <b>${d.querySelectorAll("tbody tr:not(.summary)").length}</b> hekim var.</div>`+d.querySelector("table").outerHTML+sections;
      status.textContent="Karşılaştırma hazır. Hekim seçiminiz tablo, toplam, branş ve madde metinlerine uygulandı. Tam Evrak > Word oluştur çıktısına da eklenecek.";download.disabled=print.disabled=false;
    };
    doctorList.addEventListener("change",()=>renderResult());
    for(const id of ["scOldMonth","scNewMonth"])m.querySelector("#"+id).addEventListener("change",()=>renderResult());
    for(const id of ["scOldFile","scNewFile"])m.querySelector("#"+id).addEventListener("change",()=>{loaded=null;output="";preview.innerHTML="";download.disabled=print.disabled=true});
    m.querySelector("#scBuild").onclick=async()=>{try{
      if(!window.XLSX)throw new Error("Excel okuma bileşeni yüklenemedi.");
      const of=m.querySelector("#scOldFile").files[0],nf=m.querySelector("#scNewFile").files[0];if(!of||!nf)throw new Error("İki ay için de Excel dosyası seçin.");
      if(!loaded||loaded.of!==of||loaded.nf!==nf){status.textContent="Dosyalar okunuyor…";const [ob,nb]=await Promise.all([of.arrayBuffer(),nf.arrayBuffer()]);const om=inputRows(XLSX.read(ob,{type:"array"})),nm=inputRows(XLSX.read(nb,{type:"array"}));if(!om.size||!nm.size)throw new Error("Dosyalarda geçerli hekim kaydı bulunamadı. “Doktor Seçiniz” ve belirtilen dışlama hekimleri karşılaştırmaya alınmaz.");loaded={om,nm,of,nf};drawDoctorOptions(om,nm)}
      renderResult();
    }catch(e){output="";download.disabled=print.disabled=true;status.textContent=e?.message||"Dosyalar okunamadı."}};
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
