# RPYS Stable 3.1.36

Kararlı dağıtım tarihi: 1 Eylül 2026

- Uygulama sürümü: **3.1.36-stable**
- Dağıtım motoru: **6.1.1**
- Canlı kaynak: Supabase `rpys-app-source`
- Veri koruması: monoton revizyon, stale write reddi, şüpheli büyük state küçülmesi koruması ve otomatik snapshot.
- SDS / STD Görüntüleme Hizmetleri modülü aylık veri girişi, 2.1–2.8 değerlendirme/sorgu alanları, aylık arşiv ve kaynak tutarsızlığı uyarılarını korur. Resmi sabit toplantı metinleri ve imza metinleri veri alanlarından ayrıdır.
- **390.6A Hastane Excel okuyucu:** hastane MR/BT raporunun Branş, Doktor, Poliklinik/Acil/Klinik MR ve BT sütunlarını doğrudan tanır. `GENEL TOPLAM` satırı hekim verisi olarak ikinci kez sayılmaz; hesaplanan satır toplamlarıyla doğrulama amacıyla kullanılır. Fark varsa onay engellenir. `Doktor Seçiniz!` gibi hekimi seçilmemiş istemler sessizce silinmez, kontrol uyarısı olarak gösterilir.
- Aynı Excel dosyasının tekrar yüklenmesi çift sayım üretmez; önceki aynı dosya kayıtları değiştirilir. Onay sonrası MR/BT için Poliklinik, Acil, Klinik ve toplam değerler SDS aylık kaydına işlenir; USG ve diğer elle girilen alanlar korunur.
- **390.6B Word/OOXML motoru:** resmi DOCX şablonunun `word/document.xml` içeriğini istemci tarafında işler. Belge gövdesini tek hücreye sıkıştıran dış tablo yapısı açılarak normal sayfa akışına taşınır. MR/BT hekim-branş tablosu güncel Excel kayıtlarından yeniden oluşturulur; ilgili MR/BT toplamları, ay bilgisi ve veriyle değişen seçili açıklamalar güncellenir. Hedef dışındaki sabit evrak metinleri değiştirilmez.
- **390.6C Tam Evrak:** SDS içinde `Tam Evrak` sekmesi vardır. Resmi Word şablonu bir kez yüklenip RPYS bulut durumunda SHA-256 ile saklanır. `Evrakı Oluştur` ile güncel DOCX üretilir ve Word sayfaları sayfa kırımlarıyla ekranda render edilir. `Word İndir` ve `Yazdır / PDF` işlemleri vardır.
- Yerel kaynak DOCX üzerinde dış tablo açma testi, daha önce 2–3 sayfada sıkışan içeriğin **22 sayfalık** normal belge akışına açıldığını doğrulamıştır. Canlı tarayıcı görsel DOM testi ayrı olarak kullanıcı ekranında doğrulanacaktır.
- Canlı SDS yükleme sırası: `388.1`, `389.1`, `390.6A`, `390.6B`, `390.6C`.
- Canlı HTTP doğrulaması: Excel okuyucu, Word motoru, Tam Evrak arayüzü ve ana `rpys-app-source` ayrı ayrı HTTP **200** dönmüştür. `rpys-app-source` yanıt başlıkları `X-RPYS-Version: 3.1.36-stable` ve `X-RPYS-Engine: 6.1.1` olarak doğrulanmıştır.

Eski Edge Function yamaları rollback/audit amacıyla saklanır. SDS bileşenleri eski kararlı paket zincirindeki bir hata SDS'yi engellemesin diye `rpys-app-source` tarafından ayrıca doğrudan yüklenir.
