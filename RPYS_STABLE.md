# RPYS Stable 3.1.39 — Cache Integrity + SDS Görüntüleme Hotfix

Kararlı/hotfix tarihi: 1 Eylül 2026

- Ana uygulama sürümü: **3.1.39-stable**
- Dağıtım motoru: **6.1.1**
- Canlı kaynak: Supabase `rpys-app-source`
- Ana çalışma verisi korunur: monoton revizyon, stale-write reddi, şüpheli state küçülmesi koruması, snapshot ve v391 cache integrity.
- SDS hotfix öncesi **r740** ayrıca `SDS USG+MRBT BİRLEŞİK OKUYUCU ÖNCESİ • r740` etiketiyle snapshot **#355** olarak sabitlendi.
- Son veri bütünlüğü: **35 personel, 3.051 ana görev, Eylül 2026 için 359 görev, 161 izin/rapor**. SDS düzeltmeleri bu alanları değiştirmedi.

## v391 Cache Integrity — korunuyor

- Bulut/yerel MASTER veri yüklendiğinde türetilmiş görev/personel cache'leri geçersiz kılınır.
- `assignmentsMonth()` cache'i ay, bulut revizyonu, kayıt zamanı, runtime boot zamanı, toplam/aylık görev sayısı ve personel sayısıyla denetlenir.
- Ham görev varken görev görünümü 0 dönerse catastrophic-empty-cache koruması cache'i yeniden kurup Saymanlık/Nöbet ekranını tekrar render eder.
- Bu katman `db.assign`, izin, personel veya 6.1.1 dağıtım motoru verisine yazmaz.

## SDS birleşik Excel okuyucu — `__SDS390E_V10`

- Eski özel MR/BT okuyucunun tüm Excel `change` olayını yakalayıp USG dosyasını `MR/BT hekim satırı bulunamadı` hatasıyla engellemesi giderildi.
- Yeni okuyucu **MR + BT + USG** verilerini tek akışta okur.
- Bir Excel çalışma kitabındaki **tüm sayfalar** taranır. Önerilen tek dosya düzeni: `MR-BT` sayfası + `USG` sayfası.
- Ayrı MR/BT ve USG dosyaları da sırayla yüklenebilir; yalnız yeni dosyada bulunan modaliteler değiştirilir, diğer cihaz verileri korunur.
- Yeni birleşik dosya MR/BT/USG içeriyorsa önceki aynı modalite satırları otomatik değiştirilir; eski dosyayla çift sayım oluşmaz.
- Başlık satırı ilk satırda olmak zorunda değildir; ilk 100 satır taranır.
- `Branş/Bölüm`, `Doktor/Hekim/Uzman`, Poliklinik/Acil/Klinik ve MR/BT/USG sütunları tanınır. USG adlı ayrı sayfada sade `Poliklinik / Acil / Klinik / Toplam` sütunları da desteklenir.
- `Doktor Seçiniz! / Hekim Seçiniz!` satırları **detailRows'a eklenmez**, hekim/branş sıralamasına, temiz toplamlara ve Word evrakına katılmaz.
- Kaynak `GENEL TOPLAM` yalnız bu dışlanan satırlar nedeniyle temiz toplamdan farklıysa hata değil açıklamalı veri-kalite uyarısı gösterilir. Açıklanamayan fark varsa onay engellenir.
- Canlı `rpys-patch390` ucu DB-backed sürümlü script olarak servis edilir ve HTTP **200** ile `__SDS390E_V10` döndürdüğü doğrulandı.

## Ağustos `Doktor Seçiniz` temizliği

- Eski Ağustos MR/BT importunda `Acil Tıp / Doktor Seçiniz! / Acil BT / 1 istem` bulundu.
- Bu kayıt kullanıcı talebiyle mevcut Ağustos SDS verisinden de çıkarıldı.
- Ağustos detailRows: **266 → 265** gerçek satır.
- Ağustos Acil BT temiz değeri: **3.520**.
- Ağustos temiz BT toplamı: **5.762**. Kaynak rapor `GENEL TOPLAM` değeri **5.763** olup aradaki 1, dışlanan `Doktor Seçiniz!` kaydıdır; bu bilgi SDS uyarılarında korunur.
- Ağustos MR değerleri değişmedi: Poliklinik **4.861**, Acil **728**, Klinik **159**, toplam **5.748**.

## SDS evrak branş/hekim seçimi — `__SDS392_SELECTION_V4`

- MR / BT / USG ve Poliklinik / Acil / Klinik grupları ayrı gösterilir.
- Branşlar istem toplamına göre **büyükten küçüğe** sıralanır; kullanıcı evraka girecek en fazla **5 branşı** kutucukla seçer.
- Her branş altında yalnız o branştaki **en yüksek 3 hekim** büyükten küçüğe gösterilir ve branş başına en fazla **3 hekim** seçilebilir.
- `İlk 5 branşı seç` ve `İlk 3 hekimi seç` kısayolları bulunur.
- `Doktor Seçiniz / Hekim Seçiniz` kayıtları seçim listesine ve branş toplamına hiç alınmaz.
- Word üretiminde resmi şablonun veri alanlarına yalnız kullanıcının işaretlediği branş/hekimler yazılır.
- Canlı `rpys-lint385` ucu HTTP **200** ile `__SDS392_SELECTION_V4` döndürdüğü doğrulandı.

## 2.8 iki aylık değerlendirme

- Ağustos evrağında 2.8 bölümündeki performans kıyasları **Haziran → Temmuz yerine Temmuz → Ağustos** olarak üretilir.
- MR, BT ve USG için Poliklinik/Klinik/Acil `en çok istem yapan hekim` önceki ay ve bu ay kayıtları güncellenir.
- MR randevu süresi kıyası gerçek önceki ay ve seçili ay değerlerini kullanır.
- BT toplam kıyası Word çekirdeğinde gerçek `prevYm` ve seçili ay toplamlarını kullanır.
- Tarihsel olay cümleleri aylık karşılaştırma sanılarak değiştirilmez. Örneğin `Haziran ayında kurumumuzda göreve başlayan Radyoloji Dr. Tunç Burak BENKAYA` ifadesi kaynak tarihsel bilgi olarak korunur.

## Ay güvenliği

- Temmuz ve Ağustos SDS kayıtları ayrıdır. Ağustos `prevYm=2026-07` kullanır.
- Temmuz MR/BT resmi değerleri korunur: Poliklinik **MR 5542 / BT 1978**, Acil **MR 706 / BT 3692**, Klinik **MR 178 / BT 754**, toplam **MR 6426 / BT 6424**.
- Ağustos karşılaştırmaları Temmuz verisini önceki ay olarak kullanır; Haziran sabit değerleri yeni aya taşınmaz.

Bu hotfix ana RPYS uygulama verisini ve 6.1.1 dağıtım motorunu değiştirmez; SDS dosya okuma, veri temizleme, evrak seçimi ve iki-aylık Word karşılaştırma katmanını düzeltir.