# RPYS Stable 3.1.34

Kararlı dağıtım tarihi: 1 Eylül 2026

- Uygulama sürümü: **3.1.34-stable**
- Dağıtım motoru: **6.1.1**
- Canlı kaynak: Supabase `rpys-app-source`
- Veri koruması: monoton revizyon, stale write reddi, şüpheli büyük state küçülmesi koruması ve otomatik snapshot.
- SDS / STD Görüntüleme Hizmetleri modülü: aylık veri girişi, 2.1–2.8 değerlendirme/sorgu alanları, aylık arşiv ve kaynak tutarsızlığı uyarıları. Sabit toplantı kriterleri kilitlidir; aylık veri ve değerlendirme cevapları değişkendir.
- SDS modülü eski paket zincirindeki hatalardan etkilenmemesi için canlı `rpys-app-source` içinde ayrıca doğrudan yüklenir.
- SDS dosya içe aktarma: Excel (.xlsx/.xls/.xlsm), CSV/TXT/TSV, JSON, PDF ve DOCX desteklenir. Dosya toplamları yalnız boş SDS alanlarını doldurur; elle girilmiş değerlerin üzerine yazılmaz. Fark varsa çakışma uyarısı gösterilir.
- **Akıllı Excel okuyucu 390.4:** aynı Excel içinde Poliklinik, Acil ve Klinik/Servis bölümlerini ayrı kaynaklar olarak takip eder; bölüm başlıkları ve tekrar eden başlık blokları arasında bağlamı korur.
- **Tam Evrak görünümü 391.1:** SDS içinde başlıktan imzalara kadar tek parça resmi evrak görünümü oluşturulur. MR/BT ve USG hekim-branş ayrıntıları yüklenen dosya kayıtlarından tabloya dökülür; aylık toplamlar, randevu süreleri, MHRS, raporlama, sonuç süreleri, 2.1–2.8 değerlendirmeleri ve imza bölümü aynı ekranda gösterilir. Yazdır/PDF desteği vardır.
- Canlı SDS parçaları: `388.1`, `389.1`, `390.4`, `391.1-inline`.

Eski Edge Function patchleri rollback/audit için saklanır. SDS parçaları ayrıca doğrudan yüklenerek menü, dosya okuyucu ve tam evrak görünümü erişimi güvence altına alınmıştır.
