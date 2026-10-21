# Birim Plan

RPYS hesabından ve Supabase verisinden bağımsız, tarayıcıda çalışan birim planlayıcı. `/birim-plan/` adresinden açılır. Veriler mevcut `birim_plan_v1` anahtarında kalır; eski yedekler okunur. Açılış eski kaydı kendiliğinden yeniden yazmaz. Eski yedeklerde otomatik/manuel ayrımı bulunmadığı için mevcut görevler korunan manuel kayıt olarak alınır.

- Birim ekleyin; vardiyanın başlangıcını, süresini ve hafta içi/hafta sonu kişi ihtiyacını o birime tanımlayın. Personeller birimler arasında ortaktır; çakışmalar diğer birim ve komşu ay görevlerini de içerir.
- **Kurallar** düğmesi her birimin ayarlarını ayrı tutar. İzin, aynı gün, saat çakışması, nöbet ertesi, asgari/azami gün aralığı, eşler, izin dönüşü, aylık üst sınır ve denge tercihleri açılıp kapatılır. Gün aşırı uzun görev uyarıdır. Etkin aynı gün, çakışma ve dinlenme kuralları uygunsuz atamayı engeller.
- Özel kural ekleyin/kaldırın: aylık görev/saat üst sınırı, ardışık gün sınırı, yasak tarihler, zorunlu çalışma tarihleri. Personel seçimi boşsa birimin tüm personellerine uygulanır. Zorunlu gün ve azami boşluk tamamlanamıyorsa uyarıda görünür.
- Birden fazla birimi seçip tek işlemde dağıtın. Hesap Worker'da geçici kopyada yapılır; iptal/hata durumunda liste korunur. Sonuç tamamlandığında tek kayıt yapılır. Yeniden oluşturma seçilse bile manuel ve kilitli görevler ile diğer ay/birimler korunur.
- Hücreleri seçerek toplu elle atayın. Bir hücre uygunsuzsa toplu atamanın tamamı iptal edilir. Hücre kilitleri boş hücrelere de uygulanır.
- FHZ kapsamını vardiyada işaretleyin. Hesap: **gerçek FHZ saati / günlük saat × 360 güne ilave gün / 360**. Varsayılan 7 saat ve 90 gündür; RPYS ile aynı yöntem kullanılır. Önceki sürümde kapsam seçimi olmayan vardiyalar otomatik olarak kapsama alınmaz.
- Görevlerin vardiya bilgileri kayıt anında saklanır. Vardiya düzenleme veya arşivleme geçmiş saat/FHZ hesaplarını değiştirmez. Arşivlenen vardiyanın mevcut görevleri listede görünür; yeni boş görevleri üretilmez.
- Listeyi ve saat/FHZ özetini CSV veya yazdır/PDF ile alın. JSON yedeği birim, personel, vardiya, kural, kilit ve tarihsel görev bilgilerini içerir.

Kayıt yalnız bu tarayıcıdadır. Sunucuya gönderilmez. Yedek yükleme mevcut bağımsız planlayıcı kaydını onayla değiştirir; RPYS kayıtlarına dokunmaz. Vardiya dağıtımı dengeli bir taslak üretir; en büyük matematiksel çözümü garanti etmez. Resmî tatiller otomatik okunmaz; uygun olmayan tarihleri personelde girin.

Doğrulama: `node tests/unit-planner.test.cjs` ve Chromium/Playwright bulunan ortamda `node tests/unit-planner.browser.test.cjs`.
