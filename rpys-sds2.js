"use strict";
const el = id => document.getElementById(id);
const key = "rpys.sds2.draft.v1";
const ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const children = (node, tag) => [...node.children].filter(child => child.localName === tag);
const textNodes = node => [...node.getElementsByTagNameNS(ns, "t")];
const text = node => textNodes(node).map(t => t.textContent).join("");
const tell = message => { el("status").textContent = message; };
const action = fn => async e => { try { await fn(e); } catch (error) { tell(error.message); } };
const num = value => /^\d+$/.test(value.trim()) ? Number(value) : NaN;

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
    const input = document.createElement("input");
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
    }
  });
  const snapshot = () => Object.fromEntries(fields.map(f => [f.id,f.input.value]));
  const saved = JSON.parse(localStorage.getItem(key) || "{}");
  fields.forEach(f => { f.input.value = saved[f.id] || ""; });
  el("save").onclick = action(() => { localStorage.setItem(key,JSON.stringify(snapshot())); tell("Taslak kaydedildi."); });
  el("sample").onclick = action(() => {
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([["Alan kodu","Bölüm","Alan","Değer"],...fields.map(f => [f.id,f.section,f.label,""])]),"SDS2");
    XLSX.writeFile(book,"RPYS_SDS2_Veri_Sablonu.xlsx");
  });
  el("file").onchange = action(async event => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 25*1024*1024) throw Error("En fazla 25 MB dosya yüklenebilir.");
    const book = XLSX.read(await file.arrayBuffer(),{type:"array"});
    const sheet = book.Sheets.SDS2 || book.Sheets[book.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet,{header:1,raw:false});
    if (rows[0]?.[0] !== "Alan kodu" || rows[0]?.[3] !== "Değer") throw Error("SDS 2 Excel şablonunun sütunlarını kullan.");
    const updates = new Map();
    for (const [id,,,value] of rows.slice(1)) {
      const field = fields.find(f => f.id === id);
      if (!field || value == null || value === "") continue;
      if (updates.has(field)) throw Error("Yinelenen alan kodu " + id);
      updates.set(field,value);
    }
    if (!updates.size) throw Error("Doldurulmuş eşleşen alan bulunamadı.");
    if (!confirm(updates.size + " alan güncellenecek. Devam edilsin mi?")) return;
    updates.forEach((value,field) => { field.input.value = value; });
    tell(updates.size + " alan aktarıldı.");
  });
  el("word").onclick = action(async () => {
    const data = snapshot();
    for (const field of fields) {
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
      const value = data[field.id].replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,"");
      if (value) field.write(body,value);
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
