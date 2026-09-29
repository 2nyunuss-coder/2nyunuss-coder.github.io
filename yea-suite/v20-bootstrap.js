'use strict';
(() => {
  const base = document.createElement('script');
  base.src = './v17-bootstrap.js?hp=2';
  document.head.appendChild(base);

  window.YeaBoot.waitUntil(
    () => window.__YEA_V17_BOOTED && window.v13AppOpen && document.querySelector('#tabs') && document.querySelector('[data-page="settings"]'),
    setup
  );

  function setup() {
    if (window.__YEA_V20_BOOTED) return;
    window.__YEA_V20_BOOTED = true;
    document.title = 'YEA Suite 2.0 · Mobil Uygulama';
    document.querySelectorAll('.eyebrow').forEach(el => { el.textContent = 'YEA SUITE · 2.0'; });

    const tabs = document.querySelector('#tabs');
    if (!tabs.querySelector('[data-tab="kaza"]')) {
      tabs.insertAdjacentHTML('beforeend', '<button data-tab="kaza">☾ Kaza Namazı</button>');
    }

    const settings = document.querySelector('[data-page="settings"]');
    if (!document.querySelector('[data-page="kaza"]')) {
      settings.insertAdjacentHTML('beforebegin', `
        <section data-page="kaza" class="hidden kazaPage">
          <div class="panel kazaHero">
            <div><span class="kazaKicker">KAZA NAMAZI TAKİBİ</span><h2>Adım adım tamamla.</h2><p>Başlangıç borcunu gir, kıldıkça kaydet. Kalan sayı ve ilerlemen otomatik hesaplansın.</p></div>
            <div id="kazaProgress" class="kazaProgress" role="progressbar" aria-label="Toplam ilerleme" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><strong id="kazaPercent">%0</strong><span>tamamlandı</span></div>
          </div>
          <div class="kazaStats">
            <article><small>Kalan toplam</small><strong id="kazaRemaining">0</strong></article>
            <article><small>Tamamlanan</small><strong id="kazaDone">0</strong></article>
            <article><small>Bugün</small><strong id="kazaToday">0</strong></article>
          </div>
          <div class="panel">
            <div class="sectionHead"><div><h2>Vakitler</h2><p>Bir kaza kıldığında ilgili vakitte “1 kıldım” düğmesine dokun.</p></div></div>
            <div id="kazaPrayerCards" class="kazaPrayerCards"></div>
          </div>
          <div class="kazaGrid">
            <form id="kazaAddForm" class="panel kazaForm">
              <div class="sectionHead"><div><h2>Toplu kayıt</h2><p>Aynı anda birden fazla kaza ekleyebilirsin.</p></div></div>
              <label>Vakit<select id="kazaPrayer" required><option value="sabah">Sabah</option><option value="ogle">Öğle</option><option value="ikindi">İkindi</option><option value="aksam">Akşam</option><option value="yatsi">Yatsı</option></select></label>
              <label>Adet<input id="kazaCount" type="number" min="1" max="500" inputmode="numeric" value="1" required/></label>
              <label>Tarih<input id="kazaDate" type="date" required/></label>
              <button type="submit">Kıldım olarak ekle</button>
            </form>
            <form id="kazaDebtForm" class="panel kazaForm">
              <div class="sectionHead"><div><h2>Başlangıç borcu</h2><p>Her vakit için mevcut kaza sayını yaz. Daha sonra güncelleyebilirsin.</p></div></div>
              <div id="kazaDebtInputs" class="kazaDebtInputs"></div>
              <button type="submit">Başlangıç sayılarını kaydet</button>
            </form>
          </div>
          <div class="panel">
            <div class="sectionHead"><div><h2>Kayıt geçmişi</h2><p>Yanlış bir kayıt eklediysen “Geri al” ile silebilirsin.</p></div></div>
            <div id="kazaHistory" class="kazaHistory"></div>
          </div>
          <p class="kazaPrivacy">🔒 Kaza takip kayıtların yalnızca bu cihazda saklanır.</p>
          <div id="kazaMessage" class="kazaMessage" role="status" aria-live="polite"></div>
        </section>`);
    }

    const start = document.querySelector('#v13StartMenu .v13StartApps');
    if (start && !document.querySelector('#v20StartKaza')) {
      start.insertAdjacentHTML('beforeend', '<button id="v20StartKaza" type="button">☾ Kaza Namazı</button>');
    }

    const mobile = document.createElement('script');
    mobile.src = './v18-mobile.js';
    mobile.onload = () => {
      window.__YEA_V18_BOOTED = true;
      document.querySelectorAll('a[href^="./arcade/"]').forEach(a => { a.href = './arcade/v2.html'; });
      const core = document.createElement('script');
      core.src = './v20-kaza.js';
      document.head.appendChild(core);
      const footer = document.querySelector('footer');
      if (footer) footer.textContent = 'YEA Suite 2.0 · Mobil uygulama';
    };
    document.head.appendChild(mobile);
  }
})();
