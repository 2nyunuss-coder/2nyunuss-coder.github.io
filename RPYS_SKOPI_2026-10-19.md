# Skopi dağıtımında dinlenme kontrolü düzeltmesi

Skopi ardışık dağıtımında, liste tamamlandıktan sonra v398 işlemi “16 saat ve üzeri çalışma sonrası ertesi gün dinlenme” ihlaliyle geri alıyordu.

Neden: v397 uygunluk sarmalayıcısı, `manual16` koşulunu gerçek bir kullanıcı onayı olmadan otomatik aday seçiminde de istisna sayıyordu. Ayrıca başarısız dinlenme kontrolü eski uygunluk işlevine düşebiliyordu. Böylece Skopi'nin son boş nöbetleri doldurması sırasında ardışık uzun görev oluşturulabiliyor; son işlem kontrolü tüm dağıtımı geri alıyordu.

Uygunluk artık dinlenme kontrolü başarısızsa adayı reddeder. Elle atama onayı yalnız otomatik işlem dışında kullanılabilir; önceki bir elle atamadan kalmış onay belirteci otomatik işlemi geçersiz kılamaz. Elle atama için mevcut açık onay yolu korunur. Dinlenme kuralı ve son işlem doğrulaması kaldırılmadı.

## Doğrulama

Gerçek bulut uygulama çekirdeği, onarılmış yükleyici ve v397/v398 ile Chromium'da örnek Kasım 2026 Skopi havuzu çalıştırıldı: altı aktif örnek personel, standart gündüz ve 24 saatlik nöbet vardiyaları.

- Önce: motor 51 dolu slot mesajı üretse de 9–10 Kasım arasında yeni dinlenme ihlali saptandı; işlem geri alındı, 0 atama ve 0 kayıt kaldı.
- Sonra: 51 atama, 1 kayıt, 0 dinlenme ihlali; geri alma hata mesajı yok.

Regresyon testleri, dinlenmesi gereken aday yerine uygun başka personelin seçilmesini, eski elle onay belirtecinin otomatik dağıtımı etkilememesini ve hiç uygun aday yoksa vardiyanın boş kalmasını doğrular. Mevcut korumalı hücreler/diğer aylar/işlem geri alma kontrolleri dahil toplam 92 test geçti. Yükleyici sayfa yapısı ve inline script sözdizimi de doğrulandı.

Bu örnek test, her personel havuzunun bütün vardiyaları doldurabileceği anlamına gelmez. Üretim görev verileri değiştirilmedi; güncellenenler kod ve script önbellek sürümleridir.
