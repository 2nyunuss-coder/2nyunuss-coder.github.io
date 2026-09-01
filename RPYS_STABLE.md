# RPYS Stable 3.1.39 — Cache Integrity + SDS Evrak Seçimi

Kararlı dağıtım tarihi: 1 Eylül 2026

- Uygulama sürümü: **3.1.39-stable**
- Dağıtım motoru: **6.1.1**
- Canlı kaynak: Supabase `rpys-app-source`
- Veri koruması: monoton revizyon, stale write reddi, şüpheli büyük state küçülmesi koruması ve otomatik snapshot.
- Son veri bütünlüğü doğrulaması: **35 personel, 3.051 ana görev, Eylül 2026 için 359 görev, 161 izin/rapor**. 3.1.39 deployu görev/personel/izin verisini değiştirmemiştir.

## v391 Cache Integrity — korunuyor

- Bulut/yerel MASTER veri yüklendiğinde türetilmiş görev/personel cache'leri geçersiz kılınır.
- `assignmentsMonth()` cache'i seçili ay, bulut revizyonu, kayıt zamanı, runtime boot zamanı, toplam görev sayısı, o ayın ham görev sayısı ve personel sayısı ile denetlenir.
- Ham görev varken görev görünümü 0 dönerse catastrophic-empty-cache koruması cache'i yeniden kurup Saymanlık/Nöbet ekranını tekrar render eder.
- Bu katman yalnız render/cache davranışını değiştirir; `db.assign`, izin, personel veya 6.1.1 dağıtım motoru verisine yazmaz.

## SDS / STD — 392.1 Evrak Branş/Hekim Seçimi

- Dosyalardan okunan istem verileri **MR / BT / USG** için ayrı ayrı değerlendirilir.
- Her cihaz için **Poliklinik / Acil / Klinik** grupları ayrı gösterilir.
- Her grupta branşlar istem toplamına göre **büyükten küçüğe** sıralanır; tüm branşlar görülebilir.
- Kullanıcı evrakta olmasını istediği branşları kutucukla seçer; her cihaz/kaynak grubunda en fazla **5 branş** seçilebilir.
- Seçili branş açıldığında o branştaki hekimler istem sayısına göre büyükten küçüğe sıralanır; branş başına en fazla **5 hekim** seçilebilir.
- `İlk 5 branşı seç`, `İlk 5 hekimi seç`, grup temizleme ve tüm seçimleri temizleme kısayolları vardır; otomatik seçim zorunlu değildir.
- Seçimler ay bazında `db.sds.months[YYYY-MM].wordSelections` altında saklanır; başka ayın seçimini ezmez.
- Dosya silinir veya satırlar değişirse artık mevcut olmayan branş/hekim seçimleri otomatik temizlenir.
- Word üretimi 392.1 ile sarılmıştır; resmi Word şablonundaki `en fazla isteyen branşlar/hekimlerimiz` veri alanlarına **yalnız kullanıcının işaretlediği branş ve hekimler** yazılır. Seçim yapılmamış bir veri alanında eski aya ait isimlerin kalmaması için `Seçim yapılmadı` gösterilir.
- Hekim listesinde branş bilgisi hekim adıyla birlikte taşınır; böylece Acil gibi ayrı branş cümlesi bulunmayan bölümlerde de seçilen branş/hekim ilişkisi korunur.
- Mevcut Ağustos 2026 dosyasında sıralama mantığı canlı veride doğrulandı. Örnek Poliklinik BT: **Üroloji 351 → Genel Cerrahi 256 → Göğüs Hastalıkları 215 → Beyin ve Sinir Cerrahisi 152 → İç Hastalıkları 148**.
- 392.1 JavaScript kodu `node --check` ile doğrulandı. Canlı `rpys-lint385?v=3921` ucu HTTP **200** döndü.
- Ana RPYS kaynağı HTTP **200** ile doğrulandı: `X-RPYS-Version: 3.1.39-stable`, `X-RPYS-Engine: 6.1.1`, `X-RPYS-Bundle: direct-sequential-cache-integrity-sds-selection`.

## Önceki SDS düzeltmeleri korunur

- Temmuz ve Ağustos SDS kayıtları ayrıdır. Ağustos kaydı `prevYm=2026-07` ile Temmuz → Ağustos karşılaştırmasını kullanır.
- Temmuz MR/BT: Poliklinik **MR 5542 / BT 1978**, Acil **MR 706 / BT 3692**, Klinik **MR 178 / BT 754**, toplam **MR 6426 / BT 6424**.
- Ağustos MR/BT: Poliklinik **MR 4861 / BT 1543**, Acil **MR 728 / BT 3521**, Klinik **MR 159 / BT 699**, toplam **MR 5748 / BT 5763**. Ağustos kaydında Excel'den gelen **266** hekim/branş kırılımı bulunur.
- SDS canlı parçaları: 388.1, 389.1, **390.8A** Hastane Excel okuyucu, **390.7B** Word/OOXML karşılaştırma motoru, **392.1** Evrak Branş/Hekim Seçimi, 390.6C Tam Evrak.

Bu sürümde RPYS ana çalışma verisi ve 6.1.1 dağıtım motoru korunmuş; yalnız SDS dosya analizinden Word evrakına giden branş/hekim seçim akışı eklenmiştir.