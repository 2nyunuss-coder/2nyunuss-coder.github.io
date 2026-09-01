# RPYS Stable 3.1.31

Kararlı dağıtım tarihi: 1 Eylül 2026

- Uygulama sürümü: **3.1.31-stable**
- Dağıtım motoru: **6.1.1**
- Canlı kaynak: Supabase `rpys-app-source`
- Veri koruması: monoton revizyon, stale write reddi, şüpheli büyük state küçülmesi koruması ve otomatik snapshot.
- SDS / STD Görüntüleme Hizmetleri modülü: aylık veri girişi, 2.1–2.8 değerlendirme/sorgu alanları, aylık arşiv ve kaynak tutarsızlığı uyarıları. Sabit toplantı kriterleri kilitlidir; aylık veri ve değerlendirme cevapları değişkendir.
- SDS modülü eski paket zincirindeki hatalardan etkilenmemesi için canlı `rpys-app-source` içinde ayrıca doğrudan yüklenir.
- SDS dosya içe aktarma: Excel (.xlsx/.xls/.xlsm), CSV/TXT/TSV, JSON, PDF ve DOCX desteklenir. Dosya toplamları yalnız boş SDS alanlarını doldurur; elle girilmiş değerlerin üzerine yazılmaz. Fark varsa çakışma uyarısı gösterilir.
- **Akıllı Excel okuyucu 390.2:** hastane sistemlerinden gelen raporlarda başlık satırı ilk satırda olmasa bile otomatik aranır; Hekim/Doktor, Branş/Bölüm, İsteyen Birim/Kaynak, Tetkik/İşlem/Modalite, Adet/Sayı/Toplam ve MR/BT/USG sütunları farklı adlarla eşleştirilebilir. Sayı sütunu olmayan işlem bazlı listelerde her satır 1 istem olarak sayılabilir. Poliklinik/Acil/Klinik kaynağı dosyada bulunamazsa kullanıcıdan tek seçim istenir ve onaydan önce veri resmi SDS kaydına işlenmez.
- Canlı SDS parçaları: `388.1`, `389.1`, `390.2`.

Eski Edge Function patchleri rollback/audit için saklanır. SDS parçaları ayrıca doğrudan yüklenerek menü ve dosya okuyucu erişimi güvence altına alınmıştır.
