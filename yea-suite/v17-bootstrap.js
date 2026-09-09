'use strict';
(()=>{
  const base=document.createElement('script');base.src='./v16-bootstrap.js';document.head.appendChild(base);
  const wait=()=>window.YeaBoot.waitUntil(()=>window.__YEA_V16_BOOTED&&window.v13AppOpen&&document.querySelector('#tabs')&&document.querySelector('[data-page="settings"]'),setup);
  function setup(){
    if(window.__YEA_V17_BOOTED)return;window.__YEA_V17_BOOTED=true;
    document.title='YEA Suite V1.7 Desktop';
    document.querySelectorAll('.eyebrow').forEach(e=>e.textContent='YEA SUITE • V1.7 DESKTOP');
    const footer=document.querySelector('footer');if(footer)footer.textContent='YEA Suite V1.7 • Geçmiş nöbet ve saymanlık istatistikleri • RPYS’den bağımsız';
    const tabs=document.querySelector('#tabs'),settings=document.querySelector('[data-page="settings"]');
    if(tabs&&!tabs.querySelector('[data-tab="history"]'))tabs.querySelector('[data-tab="radiology"]')?.insertAdjacentHTML('afterend','<button data-tab="history">📚 Geçmiş İstatistik</button>');
    if(settings&&!document.querySelector('[data-page="history"]'))settings.insertAdjacentHTML('beforebegin',`
      <section data-page="history" class="hidden v17History">
        <div class="panel v17Hero"><div><span class="v17Kicker">NÖBET + SAYMANLIK ARŞİVİ</span><h2>📚 Geçmiş İstatistik Merkezi</h2><p>Eski Excel dosyalarını yükle; birimleri Gündüz, Nöbet veya Hariç olarak sınıflandır ve kişi–ay–yıl–tüm zamanlar sonuçlarını gör.</p></div><div class="v17HeroBadge">RPYS’den bağımsız</div></div>
        <div class="v17Stats"><article><small>Yüklenen dosya</small><strong id="histFileCount">0</strong></article><article><small>Tekil görev</small><strong id="histRecordCount">0</strong></article><article><small>Personel</small><strong id="histPersonCount">0</strong></article><article><small>Kapsanan dönem</small><strong id="histPeriod">—</strong></article></div>
        <div class="v17Grid">
          <div class="panel"><div class="sectionHead"><div><h2>1. Excel Dosyalarını Oku</h2><p>Birden fazla .xlsx, .xls veya .csv dosyasını birlikte seçebilirsin.</p></div></div>
            <div class="v17FormGrid"><label>Dosyalar<input id="histFiles" type="file" accept=".xlsx,.xls,.csv" multiple /></label><label>Dosya düzeni<select id="histMode"><option value="auto">Otomatik algıla</option><option value="person_rows">Personel satırlarda</option><option value="unit_rows">Birim/vardiya satırlarda</option></select></label><label>Sabit birim<select id="histDefaultUnit"><option value="">Excel/sayfa adından algıla</option><option>Poliklinik Röntgen</option><option>Acil Röntgen</option><option>BT</option><option>Skopi</option><option>Portable</option><option>Mamografi</option><option>DEXA</option><option>KETEM</option><option>Birim Sorumlusu</option><option>Sekreterlik</option></select></label><label>Yıl (gerekirse)<input id="histYearOverride" type="number" min="1990" max="2100" placeholder="Örn. 2024" /></label><label>Ay (gerekirse)<select id="histMonthOverride"><option value="">Dosyadan algıla</option><option value="1">Ocak</option><option value="2">Şubat</option><option value="3">Mart</option><option value="4">Nisan</option><option value="5">Mayıs</option><option value="6">Haziran</option><option value="7">Temmuz</option><option value="8">Ağustos</option><option value="9">Eylül</option><option value="10">Ekim</option><option value="11">Kasım</option><option value="12">Aralık</option></select></label></div>
            <div class="formActions"><button id="histPreview" type="button">Excel’i Kontrol Et</button><button id="histUpload" type="button" disabled>Buluta Kaydet</button><button id="histPreviewClear" type="button" class="ghost">Önizlemeyi Temizle</button></div><div id="histImportMsg" class="v17Msg"></div><div id="histPreviewArea"></div>
          </div>
          <div class="panel"><div class="sectionHead"><div><h2>2. Birimleri Sınıflandır</h2><p>Her birimi Gündüzden say, Nöbetten say veya hesaba katma.</p></div></div><div id="histUnitRules" class="v17Rules"><div class="empty">Önce Excel yükle.</div></div></div>
        </div>
        <div class="panel"><div class="sectionHead split"><div><h2>3. İstatistik Sonuçları</h2><p>Filtreleri değiştirince sonuçlar anında yeniden hesaplanır.</p></div><div class="formActions"><button id="histExportXlsx" type="button" class="ghost">Excel İndir</button><button id="histExportCsv" type="button" class="ghost">CSV İndir</button></div></div>
          <div class="v17Filters"><label>Personel<select id="histPersonFilter"><option value="">Tüm personel</option></select></label><label>Yıl<select id="histYearFilter"><option value="">Tüm yıllar</option></select></label><label>Ay<select id="histMonthFilter"><option value="">Tüm aylar</option><option value="1">Ocak</option><option value="2">Şubat</option><option value="3">Mart</option><option value="4">Nisan</option><option value="5">Mayıs</option><option value="6">Haziran</option><option value="7">Temmuz</option><option value="8">Ağustos</option><option value="9">Eylül</option><option value="10">Ekim</option><option value="11">Kasım</option><option value="12">Aralık</option></select></label></div>
          <div id="histReportInfo" class="v17ReportInfo"></div><div class="tablewrap"><table class="v17Table"><thead><tr><th>Personel</th><th>Gündüz</th><th>Nöbet</th><th>Toplam görev</th><th>Gündüz saat</th><th>Nöbet saat</th><th>Toplam saat</th></tr></thead><tbody id="histPeopleBody"></tbody></table></div>
          <h3 class="v17Subhead">Aylık dağılım</h3><div class="tablewrap"><table class="v17Table"><thead><tr><th>Ay</th><th>Personel</th><th>Gündüz</th><th>Nöbet</th><th>Toplam görev</th><th>Toplam saat</th></tr></thead><tbody id="histMonthsBody"></tbody></table></div>
        </div>
        <div class="panel"><div class="sectionHead"><div><h2>Yüklenen Arşivler</h2><p>Aynı dosya ikinci kez kaydedilmez. Silme işlemi yalnız bu arşiv modülünü etkiler.</p></div></div><div id="histImports" class="v17Imports"></div></div>
      </section>`);
    const start=document.querySelector('#v13StartMenu .v13StartApps');if(start&&!document.querySelector('#v17StartHistory'))start.insertAdjacentHTML('beforeend','<button id="v17StartHistory" type="button">📚 Geçmiş İstatistik</button>');
    const taskbar=document.querySelector('#v13Taskbar');if(taskbar&&!document.querySelector('#v17TaskHistory'))taskbar.querySelector('.v13TaskbarSpacer')?.insertAdjacentHTML('beforebegin','<button id="v17TaskHistory" type="button" title="Geçmiş İstatistik">📚</button>');
    const x=document.createElement('script');x.src='./v17-core.js';document.head.appendChild(x);
  }
  wait();
})();
