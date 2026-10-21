# Ameliyathane ve Birim Plan

RPYS hesabından ve Supabase verisinden bağımsız, tarayıcıda çalışan salon ve personel planlayıcı. `/birim-plan/` adresinden açılır. Veriler mevcut `birim_plan_v1` anahtarında kalır; eski yedekler okunur. Açılış eski kaydı kendiliğinden yeniden yazmaz. Eski yedeklerde otomatik/manuel ayrımı bulunmadığı için mevcut görevler korunan manuel kayıt olarak alınır.

## Ameliyathane kurulumu

1. Birimi seçin veya yeni birim ekleyin. **Salonlar ve vardiyalar** sekmesinde salonlarınızı oluşturun. Başlangıç şablonu seçili birime 1–12 salon için hafta içi gündüz ekibi ve ortak nöbet vardiyası ekler; tekrarda aynı şablonu çoğaltmaz.
2. Vardiyada salon, başlangıç, süre, çalışma günleri ve ihtiyaç duyulan kişi sayısını girin. İsterseniz görev grubu ve gerekli yetkinlikleri belirleyin. Personelin görev gruplarını ve yetkinliklerini aynı adlarla girin; büyük/küçük harf farkı gözetilmez. Boş alanlar personeli kısıtlamaz.
3. **İzin / rezerve** sekmesinde personel × gün tablosundan veya tarih aralığı seçerek izin, rapor ve rezerve girin. Bu durumlar personelin tüm birimlerindeki uygunluğunu etkiler. Önceden girilmiş görevler silinmez; çelişkiler uyarılır. Bu tablo görevlerden hesaplanan gerçek saatleri ve aylık toplamı da gösterir.
4. **Kurallar** ekranında ayarları birim bazında kaydedin. İzin/rapor ve rezerve kontrolü ayrı açılıp kapatılır. Aynı gün, saat çakışması, nöbet ertesi, asgari/azami gün aralığı, eşler, izin dönüşü, aylık üst sınır ve denge tercihleri bulunur. Gün aşırı uzun görev uyarıdır; etkin aynı gün, çakışma ve dinlenme kuralları uygunsuz atamayı engeller.
5. **Nöbet listesi** sekmesinde bir veya birden fazla birimi seçerek toplu dağıtın. **Salon özeti** günlük ekipleri, dolulukları ve boş görevleri gösterir. Dağıtılamayan görevlerin nedenleri nöbet listesinde ayrıca listelenir.

## Kural ekleme ve düzenleme

RPYS menüsündeki **Kural ekle / düzenle** alanı ve bağımsız planlayıcıdaki **Kurallar** düğmeleri aynı düzenleyiciyi kullanır. Birim, personel, sınır veya tarihlerle kural tanımlayın. Altı tür desteklenir: aylık en fazla görev/saat, ardışık gün sınırı, yasak tarihler, zorunlu çalışma tarihleri ve haftanın belirli günlerini kapatma. Açıklama alanı nottur; serbest yazılan açıklama kendiliğinden yeni bir hesaplama kuralı oluşturmaz.

Kuralı düzenleyebilir, kopyalayabilir, kaldırabilir veya geçici kapatabilirsiniz. Düzenleme sırasında kimlik korunur; kopyaya yeni kimlik verilir. **Kural ekle / Kuralı güncelle**, taslak listesine işler; **Kuralları kaydet**, seçili birime uygular. **Vazgeç** ve Escape kaydı değiştirmez. Diğer birimlerin ayarları korunur. Eş izinli veya raporluysa eşlerin aynı gün çalışma şartı diğer eşin görev almasını engellemez.

## Güvenli planlama ve çıktılar

- Hesap Worker'da geçici kopyada yapılır; iptal, Worker hatası veya kayıt hatasında önceki liste korunur. Sonuç doğrulandıktan sonra tek kayıt yapılır.
- Yeniden oluşturma yalnız seçili birim/aydaki korumasız otomatik görevleri temizler. Manuel ve kilitli görevler, boş kilitli hücreler ve diğer ay/birimler korunur. Diğer birim ve komşu ay görevleri çakışma/dinlenme hesabına katılır.
- Hücreleri seçerek toplu elle atayın. Bir hücre uygunsuzsa toplu atamanın tamamı iptal edilir.
- FHZ kapsamını vardiyada işaretleyin. Hesap: **gerçek FHZ saati / günlük saat × 360 güne ilave gün / 360**. Varsayılan 7 saat ve 90 gündür; RPYS ile aynı yöntem kullanılır. Kapsamı belirsiz eski vardiyalar ve şablonlar kendiliğinden FHZ kapsamına alınmaz.
- Görevlerin vardiya bilgileri kayıt anında saklanır. Vardiya düzenleme veya salon/vardiya arşivleme geçmiş saat, salon ve FHZ hesaplarını değiştirmez. Arşivli salon/vardiyaya yeni boş görev üretilmez; mevcut kayıtlar görünür.
- Saat/FHZ özeti, nöbet listesi ve aylık izin/rezerve puantajı CSV veya yazdır/PDF ile alınır. JSON yedeği salon, personel, vardiya, durum takvimi, kural, kilit ve tarihsel görevleri içerir.

Kayıt yalnız bu tarayıcıdadır; sunucuya gönderilmez. Yedek yükleme mevcut bağımsız planlayıcı kaydını onayla değiştirir; RPYS kayıtlarına dokunmaz. Saat hedefleri kullanıcı tarafından belirlenir. Bu alan mali ücret/bordro hesabı yapmaz. Dağıtım dengeli bir taslak üretir; en büyük matematiksel çözümü garanti etmez. Resmî tatiller otomatik okunmaz; uygun olmayan tarihleri personelde veya özel kuralda girin.

Sürüm: `20261021-or-12`.

Doğrulama: `node tests/unit-planner.test.cjs`, `node tests/target-integration.test.cjs` ve Chromium/Playwright bulunan ortamda `node tests/unit-planner.browser.test.cjs`.
