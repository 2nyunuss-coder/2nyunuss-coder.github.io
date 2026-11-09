"use strict";
const el = id => document.getElementById(id);
const key = "rpys.sds2.draft.v1";
const ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const children = (node, tag) => [...node.children].filter(child => child.localName === tag);
const textNodes = node => [...node.getElementsByTagNameNS(ns, "t")];
const text = node => textNodes(node).map(t => t.textContent).join("");
const tell = message => { el("status").textContent = message; };
const action = fn => async e => { try { await fn(e); } catch (error) { tell(error.message); } };
const num = value => /^\d+$/.test(String(value).trim()) ? Number(value) : NaN;

function requestRows(book) {
  const normalize = value => String(value ?? "").trim().toLocaleUpperCase("tr").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const result = [];
  for (const name of book.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(book.Sheets[name],{header:1,raw:true});
    const headerIndex = rows.findIndex(row => normalize(row[0]) === "BRANS" && normalize(row[1]) === "DOKTOR");
    if (headerIndex < 0) continue;
    const header = rows[headerIndex].map(normalize);
    for (const type of ["MR","BT","USG"]) {
      for (const [group,prefix] of ["POLIKLINIKTEN","ACIL SERVISTEN","KLINIKLERDEN"].entries()) {
        const col = header.findIndex(label => label.startsWith(prefix) && label.split(/\s+/).includes(type));
        if (col < 0) continue;
        let total = 0;
        const branches = new Map();
        const doctors = new Map();
        const addCount = (map, key, label, value, branch) => {
          const entry = map.get(key) || {key,label,branch,count:0};
          entry.count += value;
          map.set(key,entry);
        };
        for (const row of rows.slice(headerIndex+1)) {
          const branch = normalize(row[0]), doctor = normalize(row[1]);
          if (!branch || !doctor || /TOPLAM/.test(branch) || /TOPLAM|DOKTOR SEC/.test(doctor)) continue;
          const value = row[col] == null || row[col] === "" ? 0 : num(String(row[col]));
          if (!Number.isSafeInteger(value)) throw Error(name + " sayfasında geçersiz istem sayısı.");
          total += value;
          addCount(branches,branch,String(row[0]).trim(),value);
          addCount(doctors,branch+" / "+doctor,String(row[1]).trim(),value,String(row[0]).trim());
        }
        if (result.some(item => item.group === group && item.type === type)) throw Error("Aynı tetkik sütunu birden fazla sayfada bulundu.");
        const leaders = map => {
          const ordered = [...map.values()].filter(item => item.count > 0).sort((a,b) => b.count-a.count);
          return ordered.filter(item => item.count === ordered[0].count);
        };
        result.push({group,type,total,branches:leaders(branches),doctors:leaders(doctors).map(item => ({...item,label:item.label+" ("+item.branch+")"})),branchRows:[...branches.values()],doctorRows:[...doctors.values()]});
      }
    }
  }
  return result;
}

async function start() {
  const response = await fetch("rpys-assets/sds2.docx");
  if (!response.ok) throw Error("Word şablonu yüklenemedi.");
  const template = await response.arrayBuffer();
  const zip = await JSZip.loadAsync(template);
  const source = await zip.file("word/document.xml").async("string");
  const parse = () => new DOMParser().parseFromString(source, "application/xml");
  const documentBody = doc => doc.getElementsByTagNameNS(ns, "body")[0];
  const doc = parse();
  const fields = [];
  let section = "Toplantı bilgileri";
  let activeSection = "";
  let grid;
  function add(label, write, table, row, column) {
    if (section !== activeSection) {
      const details = document.createElement("details");
      const summary = document.createElement("summary");
      grid = document.createElement("div");
      grid.className = "fields";
      summary.textContent = section;
      details.open = !activeSection;
      details.append(summary, grid);
      el("form").append(details);
      activeSection = section;
    }
    const wrapper = document.createElement("label");
    const input = document.createElement(label === "Analiz bulguları ve önceki aya göre değişim" ? "textarea" : "input");
    wrapper.textContent = label;
    wrapper.append(input);
    grid.append(wrapper);
    fields.push({id:"S" + (fields.length+1), section, label, input, write, table, row, column});
  }

  [...documentBody(doc).children].forEach((node, index) => {
    if (node.localName === "tbl") {
      const rows = children(node, "tr");
      const headers = children(rows[0], "tc").map(text);
      rows.slice(1).forEach((row, ri) => {
        const cells = children(row, "tc");
        cells.forEach((cell, ci) => {
          if (text(cell).trim()) return;
          add(headers[ci] + " · " + (text(cells[0]) || "Satır " + (ri+1)), (body, value) => {
            const target = children(children(body.children[index], "tr")[ri+1], "tc")[ci];
            const run = body.ownerDocument.createElementNS(ns,"w:r");
            const t = body.ownerDocument.createElementNS(ns,"w:t");
            t.textContent = value;
            run.append(t);
            target.getElementsByTagNameNS(ns,"p")[0].append(run);
          }, index, ri, ci);
        });
      });
    }
    if (node.localName !== "p") return;
    const line = text(node);
    if (/^(2\.[1-7]|4\.5)\s{2}|^(Kurum içi süre aşımı takibi|Komite kararları ve imzalar)$/.test(line)) section = line;
    const pattern = /_{4,}|☐ Evet\s+☐ Hayır|☐ K\s+☐ KK\s+☐ KM/g;
    const matches = [...line.matchAll(pattern)];
    for (const [i,match] of matches.entries()) {
      const prefix = line.slice(i ? matches[i-1].index + matches[i-1][0].length : 0,match.index).trim();
      const label = prefix || (match[0].startsWith("☐") ? "Değerlendirme" : "Açıklama");
      add(label, (body, value) => {
        const nodes = textNodes(body.children[index]);
        if (!nodes.length) return;
        // Apply replacements right to left so earlier field offsets stay stable.
        const current = nodes.map(t => t.textContent).join("");
        nodes[0].textContent = current.slice(0, match.index) + value + current.slice(match.index + match[0].length);
        nodes[0].setAttributeNS("http://www.w3.org/XML/1998/namespace","xml:space","preserve");
        nodes.slice(1).forEach(t => { t.textContent = ""; });
      });
      fields.at(-1).paragraphIndex = index;
    }
  });
  const snapshot = () => Object.fromEntries(fields.map(f => [f.id,f.input.value]));
  let importedMonths = {};
  let savedDraft = {};
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    fields.forEach(f => { f.input.value = saved?.[f.id] || ""; });
    savedDraft = saved || {};
    importedMonths = savedDraft.importedMonths || {};
  } catch {
    tell("Tarayıcı taslak kaydına erişemedi. Excel aktarımı ve Word indirme kullanılabilir.");
  }
  const modalities = ["MR","BT","USG"];
  const appointmentTypes = ["MR","BT","Batın USG","Tiroid USG","Doppler USG","Meme USG","Alt ekstremite USG"];
  const mhrsText = "10 hasta randomize olarak kontrol edildi ve MHRS üzerinden randevularının verildiği görüldü.";
  const committee = fields.find(f => f.label === "Komitenin adı · Satır 1");
  committee.input.value = "STD Komitesi - Görüntüleme Hizmetleri";
  committee.input.readOnly = true;

  const sectionGrid = code => [...el("form").children].find(d => d.firstElementChild.textContent.startsWith(code+" ")).lastElementChild;
  const hide = predicate => fields.filter(predicate).forEach(f => { f.input.parentElement.hidden = true; });
  const inSection = (f,code) => f.section.startsWith(code+" ");
  function make(tag, value) {
    const node = document.createElement(tag);
    if (value !== undefined) node.textContent = value;
    return node;
  }
  function block(code) {
    const container = make("div");
    container.className = "report-block";
    sectionGrid(code).prepend(container);
    return container;
  }
  function screenTable(parent, headers, rows) {
    const wrap = make("div"), table = make("table"), head = make("thead"), body = make("tbody");
    wrap.className = "table-scroll";
    const row = values => {
      const tr = make("tr");
      values.forEach(v => tr.append(make("td",v)));
      return tr;
    };
    const titles = make("tr");
    headers.forEach(h => titles.append(make("th",h)));
    head.append(titles);
    body.append(...rows.map(row));
    table.append(head,body);
    wrap.append(table);
    parent.append(wrap);
    return body;
  }
  const checked = make("input");
  checked.type = "checkbox";
  checked.checked = savedDraft.mhrsSample === true;
  hide(f => inSection(f,"2.4"));
  const mhrs = block("2.4"), checkLabel = make("label"), mhrsResult = make("p");
  checkLabel.className = "check-label";
  checkLabel.append(checked,make("span","Örnek inceleme yapıldı mı?"));
  mhrs.append(checkLabel,make("small","10 hasta kontrol edildi ve 10 randevunun tamamı MHRS üzerinden verildiyse işaretle."),mhrsResult);
  checked.onchange = () => { mhrsResult.textContent = checked.checked ? mhrsText : ""; };
  checked.onchange();

  const appointment = block("2.5");
  const appointments = {};
  hide(f => inSection(f,"2.5") && f.table === 76);
  const appointmentBody = screenTable(appointment,["Tetkik","Randevu verme süresi (gün)"],appointmentTypes.map(type => [type,""]));
  appointmentTypes.forEach((type,index) => {
    const input = make("input");
    input.type = "number"; input.min = "0"; input.step = "any";
    input.setAttribute("aria-label",type+" randevu süresi (gün)");
    const oldType = type === "Batın USG" ? "" : type;
    input.value = savedDraft.appointments?.[type] ?? fields.find(f => f.table === 76 && f.label === "Ortalama (gün) · "+oldType)?.input.value ?? "";
    appointments[type] = input;
    appointmentBody.rows[index].cells[1].append(input);
  });
  hide(f => inSection(f,"2.7") && f.table === 102);
  const resultDays = block("2.7");
  const reportFields = (row,col) => fields.find(f => f.table === 102 && f.row === row && f.column === col);
  const reportBody = screenTable(resultDays,["Tetkik","İncelenen sayı","Ortalama sonuç / rapor süresi (gün)"],modalities.map(type => [type,"",""]));
  modalities.forEach((type,row) => [1,2].forEach(col => {
    const input = reportFields(row,col).input;
    input.type = "number"; input.min = "0"; input.step = col === 1 ? "1" : "any";
    input.setAttribute("aria-label",type+(col === 1 ? " incelenen sayı" : " rapor süresi (gün)"));
    reportBody.rows[row].cells[col].append(input);
  }));

  const emergency = block("4.5");
  const emergencyTable = 117;
  const emergencyFields = (row,col) => fields.find(f => f.table === emergencyTable && f.row === row && f.column === col);
  const emergencyHeaders = ["Tetkik","İncelenen sayı","Süre birimi","Ortalama sonuç / rapor süresi","Hedef süre"];
  const emergencyTargets = {};
  hide(f => f.table === emergencyTable);
  emergency.append(make("p","Ortalama ve hedef süreyi aynı birimde gir. Örneğin dakika seçtiysen iki süreyi de dakika olarak yaz."));
  const emergencyBody = screenTable(emergency,emergencyHeaders,modalities.map(type => [type,"","","",""]));
  modalities.forEach((type,row) => {
    [1,2,3].forEach(col => {
      const input = emergencyFields(row,col).input;
      if (col !== 2) {
        input.type = "number";
        input.min = "0";
        input.step = col === 1 ? "1" : "any";
      } else input.placeholder = "Dakika / saat / gün";
      input.setAttribute("aria-label",type+" "+emergencyHeaders[col]);
      emergencyBody.rows[row].cells[col].append(input);
    });
    const target = make("input");
    target.type = "number"; target.min = "0"; target.step = "any";
    target.setAttribute("aria-label",type+" hedef süre");
    target.value = savedDraft.emergencyTargets?.[type] ?? "";
    emergencyTargets[type] = target;
    emergencyBody.rows[row].cells[4].append(target);
  });

  const tracking = block("Kurum içi süre aşımı takibi");
  hide(f => f.table === 130);
  const cohorts = [
    ["Poliklinik BT","72 saat"],["Acil BT","1 saat"],["Acil MR","24 saat"],
    ["Yatan hasta MR","24 saat"],["Rutin MR","72 saat"],["Yatan hasta BT","24 saat"]
  ];
  const trackingHeaders = ["Hasta grubu / tetkik","Süre sınırı","Toplam çekim","Süreyi geçen","Süreyi geçmeyen","Geçen / toplam","Geçmeyen / toplam","Geçen / geçmeyen"];
  tracking.append(make("p","Her grup için toplam çekim sayısını, süre içinde çekilen ve süreyi geçen hasta sayılarını gir. Tam sınırda yapılan çekimleri süre içinde say."));
  const trackingBody = screenTable(tracking,trackingHeaders,cohorts.map(([name,limit]) => [name,limit,"","","","—","—","—"]));
  const trackingInputs = cohorts.map(([name],row) => [2,4,3].map((col,index) => {
    const input = make("input");
    input.type = "number"; input.min = "0"; input.step = "1";
    const limit = cohorts[row][1];
    const oldLimit = savedDraft.timingLimits?.[row] ?? ([2,3].includes(row) ? "4 saat" : limit);
    input.value = oldLimit === limit ? savedDraft.timingCounts?.[row]?.[index] ?? "" : "";
    input.setAttribute("aria-label",name+" "+trackingHeaders[col]);
    trackingBody.rows[row].cells[col].append(input);
    return input;
  }));
  const trackingStatus = make("p");
  trackingStatus.setAttribute("role","status");
  tracking.append(trackingStatus);
  const trackingSummary = make("div");
  const trackingChart = make("div");
  trackingChart.className = "timing-chart";
  tracking.append(trackingSummary,trackingChart);
  const trackingNote = "Geçen / geçmeyen oranı, süre sınırını geçen çekim sayısının süreyi geçmeyen çekim sayısına bölünmesiyle hesaplanır.";
  const timingValues = () => trackingInputs.map(row => row.map(input => input.value));
  function trackingRatios(values) {
    if (values.every(v => v === "")) return {rates:["—","—","—"],issue:""};
    if (values.some(v => v === "")) return {rates:["—","—","—"],issue:"Üç sayı da girilmeli."};
    const [total,within,over] = values.map(num);
    if (![total,within,over].every(Number.isSafeInteger)) {
      return {rates:["—","—","—"],issue:"Sayılar sıfır veya pozitif tam sayı olmalı."};
    }
    if (within+over !== total) {
      return {rates:["—","—","—"],issue:"Süre içinde ve süreyi geçen sayıların toplamı, toplam çekime eşit olmalı."};
    }
    const ratio = (a,b) => b ? "%"+(a*100/b).toLocaleString("tr-TR",{maximumFractionDigits:2}) : "—";
    return {rates:[ratio(over,total),ratio(within,total),ratio(over,within)],issue:""};
  }
  function updateTracking() {
    const issues = [];
    const rows = [];
    const chartRows = [];
    timingValues().forEach((values,index) => {
      const {rates,issue} = trackingRatios(values);
      if (issue) issues.push(cohorts[index][0]+" · "+issue);
      rates.forEach((rate,i) => { trackingBody.rows[index].cells[i+5].textContent = rate; });
      if (issue || values.every(v => v === "")) return;
      const [total,within,over] = values.map(num);
      rows.push([...cohorts[index],String(total),String(over),String(within),...rates]);
      if (total) chartRows.push({label:cohorts[index].join(" · "),total,over,rates});
    });
    const combined = ["72 saat","1 saat","24 saat"].flatMap(limit => {
      const group = rows.filter(row => row[1] === limit);
      if (group.length < 2) return [];
      const [total,over,within] = [2,3,4].map(col => group.reduce((sum,row) => sum+Number(row[col]),0));
      return [["TOPLAM",limit,String(total),String(over),String(within),...trackingRatios([total,within,over].map(String)).rates]];
    });
    const reportRows = ["72 saat","1 saat","24 saat"].flatMap(limit => [
      ...rows.filter(row => row[1] === limit),...combined.filter(row => row[1] === limit)
    ]);
    trackingStatus.textContent = issues.join(" ");
    trackingSummary.replaceChildren();
    if (combined.length) {
      trackingSummary.append(make("h3","Aynı süre sınırına göre toplamlar"));
      screenTable(trackingSummary,trackingHeaders,combined);
    }
    trackingChart.replaceChildren();
    if (chartRows.length) {
      trackingChart.append(make("h3","Çekimlerin süre sınırına göre dağılımı"));
      for (const {label,total,over,rates} of chartRows) {
        const caption = make("p",label+" · Geçmeyen "+rates[1]+" · Geçen "+rates[0]);
        const bar = make("div");
        bar.className = "timing-bar";
        bar.setAttribute("aria-hidden","true");
        const segment = make("span");
        segment.style.width = over*100/total+"%";
        bar.append(segment);
        trackingChart.append(caption,bar);
      }
      trackingChart.append(make("small",trackingNote));
    }
    return {rows:reportRows,chartRows,issues};
  }
  tracking.addEventListener("input",updateTracking);
  updateTracking();

  const committeeTables = block("Komite kararları ve imzalar");
  for (const [index,title,headers,labels] of [
    [134,"Kararlar",["Karar / faaliyet","Sorumlu","Termin","İzlem durumu"],["","","",""]],
    [136,"Ekler",["Ek no","Döküm / grafik / kanıt adı"],["","","","",""]],
    [138,"İmzalar",["Görev","Ad soyad","İmza"],["Başhekim","Başhekim yardımcısı","Radyoloji sorumlu hekimi","Sağlık tesisi değerlendirme sorumlusu","Kalite birimi temsilcisi","Radyoloji birim sorumlusu","MR sorumlusu"]]
  ]) {
    hide(f => f.table === index);
    committeeTables.append(make("h3",title));
    const body = screenTable(committeeTables,headers,labels.map(label => [label,...headers.slice(1).map(() => "")]));
    for (const f of fields.filter(field => field.table === index)) {
      f.input.setAttribute("aria-label",f.label);
      body.rows[f.row].cells[f.column].append(f.input);
    }
  }

  const expert = block("2.6");
  hide(f => inSection(f,"2.6") && f.table === 91);
  const expertHeads = ["Raporlayan uzman","Kurum / hizmet alımı",...modalities];
  const experts = screenTable(expert,[...expertHeads,""],[]);
  const addExpert = make("button","Hekim ekle");
  addExpert.type = "button";
  expert.append(addExpert);
  function expertRow(values = []) {
    const row = experts.insertRow();
    expertHeads.forEach((label,index) => {
      const input = make("input");
      input.type = index > 1 ? "number" : "text";
      if (index > 1) { input.min = "0"; input.step = "1"; }
      input.setAttribute("aria-label",label);
      input.placeholder = label;
      input.value = values[index] ?? "";
      row.insertCell().append(input);
    });
    const remove = make("button","Kaldır");
    remove.type = "button";
    remove.onclick = () => row.remove();
    row.insertCell().append(remove);
  }
  const oldExperts = [0,1,2].map(row => expertHeads.map((_,col) => fields.find(f => f.table === 91 && f.row === row && f.column === col)?.input.value || "")).filter(row => row.some(Boolean));
  (savedDraft.experts ?? (oldExperts.length ? oldExperts : [[]])).forEach(expertRow);
  addExpert.onclick = () => { expertRow(); experts.lastElementChild.querySelector("input").focus(); };
  const expertValues = () => [...experts.rows].map(row => [...row.querySelectorAll("input")].map(input => input.value.trim())).filter(row => row.some(Boolean));

  const groups = [0,1,2];
  const comparisons = groups.map(group => {
    const code = "2."+(group+1);
    hide(f => inSection(f,code) && ([16,34,49].includes(f.table) || f.label.startsWith("Son ayın en çok")));
    return block(code);
  });
  const periods = () => [1,2,3].map(month => fields.find(f => f.section === "Toplantı bilgileri" && f.label === month+". ay")?.input.value.trim() || month+". ay");
  function comparison(group, kind) {
    const entries = new Map();
    const available = new Set();
    const headers = kind === "doctorRows" ? ["Branş","Hekim",...modalities] : ["Branş",...modalities];
    [1,2,3].forEach((month,mi) => {
      for (const report of importedMonths[month] || []) {
        if (report.group !== group || !report[kind]) continue;
        const ti = modalities.indexOf(report.type);
        available.add(mi*3+ti);
        for (const item of report[kind]) {
          if (!entries.has(item.key)) entries.set(item.key,{label:item.label,branch:item.branch,counts:Array(9).fill(0)});
          entries.get(item.key).counts[mi*3+ti] = item.count;
        }
      }
    });
    const ordered = [...entries.values()].sort((a,b) => (a.branch || a.label).localeCompare(b.branch || b.label,"tr") || a.label.localeCompare(b.label,"tr"));
    const fmt = new Intl.NumberFormat("tr-TR",{maximumFractionDigits:2});
    const rows = ordered.map(item => {
      const labels = kind === "doctorRows" ? [item.branch,item.label] : [item.label];
      return labels.concat(modalities.map((_,ti) => {
        const values = [0,1,2].map(mi => available.has(mi*3+ti) ? item.counts[mi*3+ti] : null);
        const [first,,last] = values;
        const change = first === null || last === null ? "" : first ? " ("+fmt.format((last-first)*100/first)+"%)" : last ? " (yeni)" : "";
        return values.map(v => v === null ? "—" : fmt.format(v)).join(" → ")+change;
      }));
    });
    const top = kind === "doctorRows" ? ordered.map(item => {
      const byType = modalities.map((_,ti) => item.counts[ti]+item.counts[ti+3]+item.counts[ti+6]);
      return {...item,byType,total:byType.reduce((a,b) => a+b,0)};
    }).filter(item => item.total > 0).sort((a,b) => b.total-a.total || a.label.localeCompare(b.label,"tr")).slice(0,10)
      .map((item,i) => (i+1)+". "+item.label+" ("+item.branch+") · "+fmt.format(item.total)+" istem (MR "+fmt.format(item.byType[0])+", BT "+fmt.format(item.byType[1])+", USG "+fmt.format(item.byType[2])+").") : [];
    return {headers,rows,top};
  }
  function renderComparisons() {
    groups.forEach(group => {
      const node = comparisons[group];
      const doctors = comparison(group,"doctorRows"), branches = comparison(group,"branchRows");
      node.replaceChildren();
      if (!doctors.rows.length && !branches.rows.length) {
        node.append(make("p","Branş ve hekim tabloları için ayların HBYS Excel dosyalarını yükle."));
        return;
      }
      node.append(make("p",periods().join(" → ")+" · Parantez içinde ilk ve son ay arasındaki değişim"));
      if (doctors.top.length) {
        node.append(make("h3","En çok istem yapan hekimler"));
        for (const line of doctors.top) node.append(make("strong",line));
      }
      node.append(make("h3","Branşlara göre üç aylık istemler"));
      screenTable(node,branches.headers,branches.rows);
      node.append(make("h3","Hekimlere göre üç aylık istemler"));
      screenTable(node,doctors.headers,doctors.rows);
    });
  }
  renderComparisons();
  el("save").onclick = action(() => {
    const inputValues = inputs => Object.fromEntries(Object.entries(inputs).map(([name,input]) => [name,input.value]));
    localStorage.setItem(key,JSON.stringify({
      ...snapshot(),importedMonths,mhrsSample:checked.checked,
      appointments:inputValues(appointments),experts:expertValues(),
      emergencyTargets:inputValues(emergencyTargets),timingCounts:timingValues(),timingLimits:cohorts.map(([,limit]) => limit)
    }));
    tell("Taslak kaydedildi.");
  });
  el("sample").onclick = action(() => {
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([["Alan kodu","Bölüm","Alan","Değer"],...fields.map(f => [f.id,f.section,f.label,""])]),"SDS2");
    XLSX.writeFile(book,"RPYS_SDS2_Veri_Sablonu.xlsx");
  });
  function updateAnalysis() {
    const countText = value => value.toLocaleString("tr-TR");
    const changeText = (first,last) => first === 0
      ? (last === 0 ? "değişim yok (0 istem)" : "0’dan " + countText(last) + " isteme çıktı (yüzde hesaplanamaz)")
      : "%" + countText(Math.round(Math.abs((last-first)*100/first)*100)/100) +
        (last > first ? " artış" : last < first ? " azalış" : " değişim");
    const leaderText = list => list.map(({label,count}) => label + " · " + countText(count)).join(", ");
    const months = [1,2,3];
    const names = months.map(month => fields.find(f => f.section === "Toplantı bilgileri" && f.label === month+". ay")?.input.value.trim() || month+". ay");
    for (const group of [0,1,2]) {
      const section = fields.filter(f => f.section.startsWith("2."+(group+1)+" "));
      const field = label => section.find(f => f.label === label);
      const set = (label,value) => { const f = field(label); if (f) f.input.value = value; };
      const lines = [];
      for (const type of ["MR","BT","USG"]) {
        const values = months.map(month => num(field(month+". ay · "+type)?.input.value || ""));
        const [first,second,last] = values;
        const all = values.every(Number.isFinite);
        if (Number.isFinite(first) && Number.isFinite(last)) {
          set("İlk ve son ay değişimi (%) · "+type,first === 0 ? "Hesaplanamaz" : countText(Math.round((last-first)*10000/first)/100) + " %");
        }
        const reports = months.map(month => importedMonths[month]?.find(item => item.group === group && item.type === type));
        const latest = reports[2];
        if (latest) {
          const branches = leaderText(latest.branches), doctors = leaderText(latest.doctors);
          set(type+" · Branş",branches || "İstem yok");
          set(type+" · Hekim",doctors || "İstem yok");
          set("Son ayın en çok isteyen branşı ve hekimi · "+type,branches && doctors ? branches + " / " + doctors : "İstem yok");
        }
        if (!values.some(Number.isFinite)) continue;
        const totals = values.map((value,index) => names[index]+": "+(Number.isFinite(value) ? countText(value) : "veri girilmedi"));
        let line = type+" istemleri ("+totals.join(", ")+").";
        if (all) {
          line += " Üç aylık toplam "+countText(first+second+last)+" istem. "+
            names[0]+" → "+names[1]+": "+changeText(first,second)+". "+
            names[1]+" → "+names[2]+": "+changeText(second,last)+". "+
            names[0]+" → "+names[2]+": "+changeText(first,last)+".";
        }
        for (const [index,report] of reports.entries()) {
          if (!report?.branches.length || !report.doctors.length) continue;
          line += " "+names[index]+" en çok isteyen branş: "+leaderText(report.branches)+
            ". En çok isteyen hekim: "+leaderText(report.doctors)+".";
        }
        lines.push(line);
      }
      if (lines.length) set("Analiz bulguları ve önceki aya göre değişim",lines.join(" "));
    }
  }

  el("analyze").onclick = action(() => {
    updateAnalysis();
    renderComparisons();
    tell("Üç aylık istem istatistikleri ve analiz metni güncellendi.");
  });
  const fileInput = el("file");
  const applyImport = el("apply-import");
  const monthInput = el("import-month");
  let pending = null;
  let selection = 0;

  function getUpdates() {
    if (!pending) return [];
    if (pending.totals) {
      const totals = pending.totals;
      const month = monthInput.value;
      return totals.map(({group,type,total}) => {
        const field = fields.find(f => f.section.startsWith("2."+(group+1)+" ") && f.label === month+". ay · "+type);
        if (!field) throw Error("Word şablonunda ay sütunu bulunamadı.");
        return [field,total];
      });
    }
    return pending.entries;
  }

  fileInput.disabled = false;
  fileInput.onchange = action(async () => {
    const currentSelection = ++selection;
    const file = fileInput.files[0];
    pending = null;
    applyImport.disabled = true;
    if (!file) return;
    if (file.size > 25*1024*1024) throw Error("En fazla 25 MB dosya yüklenebilir.");
    tell(file.name + " okunuyor…");
    const bytes = await file.arrayBuffer();
    if (currentSelection !== selection) return;
    if (!window.XLSX) throw Error("Excel okuyucu yüklenemedi. Sayfayı yenileyip tekrar deneyin.");
    const book = XLSX.read(bytes,{type:"array"});
    const sheet = book.Sheets.SDS2 || book.Sheets[book.SheetNames[0]];
    if (!sheet) throw Error("Excel dosyasında okunabilir sayfa bulunamadı.");
    const rows = XLSX.utils.sheet_to_json(sheet,{header:1,raw:false});
    if (rows[0]?.[0] !== "Alan kodu" || rows[0]?.[3] !== "Değer") {
      const totals = requestRows(book);
      if (!totals.length) throw Error("MR, BT veya USG istem sütunları bulunamadı.");
      pending = {totals};
      tell(file.name + " okundu. " + totals.length + " istem toplamı bulundu. Ayı seçip Forma aktar’a dokun.");
    } else {
      const updates = new Map();
      for (const [id,,,value] of rows.slice(1)) {
        const field = fields.find(f => f.id === id);
        if (!field || value == null || value === "") continue;
        if (updates.has(field)) throw Error("Yinelenen alan kodu " + id);
        updates.set(field,value);
      }
      if (!updates.size) throw Error("Doldurulmuş eşleşen alan bulunamadı.");
      pending = {entries:[...updates]};
      tell(file.name + " okundu. " + updates.size + " alan bulundu. Forma aktar’a dokun.");
    }
    applyImport.disabled = false;
  });
  applyImport.onclick = action(() => {
    const updates = getUpdates();
    if (!updates.length) return;
    for (const [field,value] of updates) field.input.value = value;
    const month = pending.totals ? monthInput.value + ". aya " : "";
    if (pending.totals) {
      const selectedMonth = monthInput.value;
      const previous = importedMonths[selectedMonth] || [];
      importedMonths[selectedMonth] = previous.filter(item =>
        !pending.totals.some(total => total.group === item.group && total.type === item.type)).concat(pending.totals);
      updateAnalysis();
      renderComparisons();
    }
    pending = null;
    applyImport.disabled = true;
    fileInput.value = "";
    const affected = new Set(updates.map(([field]) => field.input.closest("details")));
    for (const details of affected) if (details) details.open = true;
    tell(month + updates.length + " alan aktarıldı.");
  });
  el("word").onclick = action(async () => {
    const data = snapshot();
    const specialistRows = expertValues();
    const trackingReport = updateTracking();
    if (trackingReport.issues.length) throw Error(trackingReport.issues[0]);
    if (specialistRows.some(row => !row[0])) throw Error("2.6 bölümünde sayı girilen her satıra hekim adı yaz.");
    for (const field of fields) {
      if (field.table === 130) continue;
      const type = ["Kapatılma oranı","MHRS oranı","Aşım (%)","İlk ve son ay"].find(label => field.label.startsWith(label));
      if (!type) continue;
      const [denominator,numerator] = type === "Aşım (%)" ? [3,4] : type === "İlk ve son ay" ? [1,3] : [0,1];
      const at = column => fields.find(f => f.table === field.table && f.row === field.row && f.column === column);
      const total = num(data[at(denominator)?.id] || "");
      const part = num(data[at(numerator)?.id] || "");
      if (!Number.isFinite(total) || !Number.isFinite(part)) continue;
      const change = type === "İlk ve son ay";
      if (!change && part > total) throw Error(field.section + " bölümünde alt sayı toplamı aşıyor.");
      const rate = total ? 100*(change ? part-total : part)/total : null;
      data[field.id] = rate === null ? "Hesaplanamadı" : rate.toLocaleString("tr-TR",{maximumFractionDigits:2}) + " %";
      if (type === "Aşım (%)" && at(5)) data[at(5).id] = String(total-part);
    }
    const output = parse();
    const body = documentBody(output);
    for (const field of [...fields].reverse()) {
      const value = String(data[field.id]).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,"");
      if (value || field.paragraphIndex !== undefined) field.write(body,value);
    }
    const anchors = [...body.children];
    const word = (tag,attributes = {}) => {
      const node = output.createElementNS(ns,"w:"+tag);
      for (const [name,value] of Object.entries(attributes)) node.setAttributeNS(ns,"w:"+name,String(value));
      return node;
    };
    const paragraph = (value,bold = false) => {
      const p = word("p"), run = word("r"), t = word("t");
      if (bold) {
        const props = word("rPr");
        props.append(word("b"),word("sz",{val:22}));
        run.append(props);
      }
      t.textContent = value;
      t.setAttributeNS("http://www.w3.org/XML/1998/namespace","xml:space","preserve");
      run.append(t); p.append(run);
      return p;
    };
    const wordTable = (headers,rows) => {
      const table = word("tbl"), props = word("tblPr"), grid = word("tblGrid");
      props.append(word("tblStyle",{val:"TableGrid"}),word("tblW",{w:5000,type:"pct"}));
      const widths = headers.length === 5 ? [1800,2200,1900,1900,1900] :
        headers.length === 4 ? [3000,2200,2200,2300] : headers.length === 3 ? [3200,3200,3300] : headers.length === 8 ? [1800,1000,1100,1100,1100,1200,1200,1200] : [4800,4900];
      widths.forEach(w => grid.append(word("gridCol",{w})));
      table.append(props,grid);
      [headers,...rows].forEach((values,index) => {
        const row = word("tr"), trPr = word("trPr");
        trPr.append(word(index === 0 ? "tblHeader" : "cantSplit"));
        row.append(trPr);
        values.forEach((value,ci) => {
          const cell = word("tc"), tcPr = word("tcPr");
          tcPr.append(word("tcW",{w:widths[ci],type:"dxa"}));
          if (headers === trackingHeaders && (index === 0 || values[0] === "TOPLAM")) {
            tcPr.append(word("shd",{fill:index === 0 ? "D9EAF5" : "E5F1EA"}));
          }
          cell.append(tcPr,paragraph(value,index === 0 || (headers === trackingHeaders && values[0] === "TOPLAM")));
          row.append(cell);
        });
        table.append(row);
      });
      return table;
    };
    for (const [group,index] of [16,34,49].entries()) {
      const doctors = comparison(group,"doctorRows"), branches = comparison(group,"branchRows");
      if (!doctors.rows.length && !branches.rows.length) continue;
      const nodes = [paragraph(periods().join(" → ")+" · İlk ve son ay arasındaki değişim parantez içindedir.")];
      if (doctors.top.length) {
        nodes.push(paragraph("En çok istem yapan hekimler",true),...doctors.top.map(line => paragraph(line,true)));
      }
      nodes.push(paragraph("Branşlara göre üç aylık istemler",true),wordTable(branches.headers,branches.rows),
        paragraph("Hekimlere göre üç aylık istemler",true),wordTable(doctors.headers,doctors.rows));
      anchors[index].replaceWith(...nodes);
    }
    if (checked.checked) anchors[67].replaceWith(paragraph(mhrsText));
    else anchors[67].remove();
    for (const index of [68,69,70,71,72,73,74]) anchors[index].remove();
    function replaceInputTable(index,headers,rows) {
      if (rows.length) anchors[index].replaceWith(wordTable(headers,rows));
      else anchors[index].remove();
    }
    replaceInputTable(76,["Tetkik","Randevu verme süresi (gün)"],
      appointmentTypes.map(type => [type,appointments[type].value]).filter(row => row[1] !== ""));
    replaceInputTable(91,expertHeads,specialistRows);
    replaceInputTable(102,["Tetkik","İncelenen sayı","Ortalama sonuç / rapor süresi (gün)"],
      modalities.map((type,row) => [type,reportFields(row,1).input.value,reportFields(row,2).input.value])
        .filter(row => row.slice(1).some(Boolean)));
    replaceInputTable(117,emergencyHeaders,modalities.map((type,row) =>
      [type,...[1,2,3].map(col => emergencyFields(row,col).input.value),emergencyTargets[type].value])
      .filter(row => row.slice(1).some(Boolean)));
    replaceInputTable(130,trackingHeaders,trackingReport.rows);
    if (trackingReport.rows.length) anchors[129].replaceWith(paragraph(trackingNote));
    if (trackingReport.chartRows.length) {
      const chart = [paragraph("Çekimlerin süre sınırına göre dağılımı",true)];
      for (const {label,total,over,rates} of trackingReport.chartRows) {
        chart.push(paragraph(label+" · Geçmeyen "+rates[1]+" · Geçen "+rates[0]));
        const bar = word("tbl"), props = word("tblPr"), grid = word("tblGrid"), row = word("tr");
        props.append(word("tblW",{w:5000,type:"pct"}),word("tblLayout",{type:"fixed"}));
        bar.append(props,grid,row);
        for (const [count,fill] of [[total-over,"DCE5EC"],[over,"405C73"]]) {
          if (!count) continue;
          const width = Math.max(1,Math.round(count*9700/total));
          grid.append(word("gridCol",{w:width}));
          const cell = word("tc"), cellProps = word("tcPr");
          cellProps.append(word("tcW",{w:width,type:"dxa"}),word("shd",{fill}));
          cell.append(cellProps,paragraph(""));
          row.append(cell);
        }
        chart.push(bar);
      }
      anchors[131].before(...chart);
    }
    if (!trackingReport.rows.length) {
      anchors[129].remove();
      if (!fields.some(f => [131,132].includes(f.paragraphIndex) && String(data[f.id]).trim())) anchors[128].remove();
    }
    for (const index of new Set(fields.map(f => f.paragraphIndex).filter(index => index !== undefined))) {
      if (!fields.some(f => f.paragraphIndex === index && String(data[f.id]).trim())) anchors[index].remove();
    }
    for (const index of new Set(fields.map(f => f.table).filter(index => index !== undefined))) {
      const table = anchors[index];
      if (!table.parentNode) continue;
      const rows = children(table,"tr");
      rows.slice(1).forEach((row,i) => {
        const cells = fields.filter(f => f.table === index && f.row === i);
        if (cells.length && !cells.some(f => String(data[f.id]).trim())) row.remove();
      });
      if (children(table,"tr").length < 2) table.remove();
    }
    const result = await JSZip.loadAsync(template);
    result.file("word/document.xml",new XMLSerializer().serializeToString(output));
    const blob = await result.generateAsync({type:"blob",mimeType:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Radyoloji_SDS2_Komite_Raporu.docx";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url),1000);
    tell("Word evrakı hazırlandı.");
  });
}
start().catch(error => tell(error.message));
