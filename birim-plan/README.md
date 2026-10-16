# Birim Plan

RPYS'den bağımsız, sunucu ve hesap gerektirmeyen birim nöbet ve saat özeti uygulaması.

Depo kökünden `python3 -m http.server 8000` çalıştırın ve `/birim-plan/` yolunu açın. Kaynak GitHub Pages'e yayımlandığında aynı alt yol kullanılabilir. HTTPS veya localhost gerekir (personel kimlikleri için Web Crypto).

1. Kurum, birim ve ayı seçin.
2. Personelleri, hedef saatlerini ve uygun olmadıkları tarihleri girin.
3. Dinlenme / aylık üst sınırları ve vardiyaları tanımlayın. Vardiya süresi gece yarısını aşabilir. Her vardiya için hafta içi / hafta sonu gereken kişi sayısı ayrıdır.
4. Otomatik listeyi oluşturun; boş görevleri ve uyarıları kontrol edin. Elle atamalar da aynı kurallarla denetlenir. Yeniden oluşturma seçili ayın atamalarını değiştirir; diğer aylar korunur.
5. Nöbet listesi ve saat özetini yazdırın veya CSV indirin. JSON yedeğini düzenli indirin.

Veriler yalnız tarayıcının localStorage alanındadır; sunucuya gönderilmez. Tarayıcı temizleme / farklı cihaz verileri taşımaz. JSON yedeği personel bilgileri içerir; güvenli saklayın. Yedek yükleme mevcut verileri değiştirir.

Sınırlar: aynı gün kişi başına tek görev; vardiyalar tüm ay için geçerli; resmî tatil takvimi, unvan / yetkinlik kotası, ücret katsayıları ve çok kullanıcılı eşitleme yoktur. Hedef saat manuel girilir. Fazla saat ödeme hakkı anlamına gelmez. Dinlenme kontrolü kayıtlı önceki / sonraki ay atamalarını da kapsar. Dağıtım basit ve açgözlüdür; matematiksel olarak mümkün olan her çözümü bulmayı garanti etmez. Vardiya silmek geçmiş atamalarını da siler ve onay gerektirir.

Test: `node --test tests/unit-planner.test.cjs`
