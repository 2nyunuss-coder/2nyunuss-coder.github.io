# Saymanlık ekran döngüsü ve ŞUA aylık saatleri

## Düzeltmeler

Eski bulut eklentileri aynı ekranı birbirinin ardından yeniden değiştiriyordu. Yükleyici artık bu eklentilere çalıştırmadan önce dar kapsamlı düzeltmeler uygular; diğer işlevleri korunur.

- Gömülü v319 eklentisinin tüm birim toplamları satırları silinip eklenmez. Var olan iki satırın yalnız değişen metinleri güncellenir.
- Kilit düğmesini sürekli silip yeniden ekleyen v352, kopyala/yapıştır düğmelerini sürekli yeniden oluşturan v353 ve aynı yazdırma etiketini her taramada değiştiren v383 düzeltilir. v383 kaynağındaki iki işlev arası yanlış literal satır ayıracı da düzeltilir.
- v332/v336/v337/v338/v339 uygun personel çizicileri, menü v400 tarafından yönetilirken bu alana yazmaz. v339 personel seçim alanı yalnız personel/isim/seçim değişirse kurulur. v340 özel vardiya etiketi değişmedikçe yazılmaz.
- v319 menü düğmesi eklerken aynı işlemin mevcut düğmesini korur; istatistik sıralaması ve etiketleri değişmedikçe DOM'a yazmaz. v400 uygun personel düğmeleri sonuç değişmedikçe korunur.

## ŞUA saat girişi

Hakediş Saatleri tablosunda ay hücresine tıklanır:

1. **Dış kurumda çalışılan saat**: RPYS'deki o aya ait saate eklenir. Virgüllü sayı kabul edilir.
2. **Düzeltilmiş aylık toplam**: isteğe bağlıdır; doluysa o ayın toplamı olarak kullanılır. Boşsa RPYS + dış kurum hesabına dönülür. “Otomatiğe dön” bu alanı boşaltır; Kaydet ile uygulanır. Dış kurum saati korunur; onu kaldırmak için dış kurum alanı da boşaltılır.

Dış kurum değerleri `db.sua.externalHours420`, toplam düzeltmeleri `db.sua.monthHoursOverride420` içinde `YYYY-MM|personelId` anahtarıyla saklanır. Ay/yıl/kişi ayrıdır; yıllık toplam ve hakediş günleri bu değerleri kullanır. Görev listesine sahte atama eklenmez. Görüntüleyici ve ŞUA yetkisi olmayan kullanıcı düzenleyemez. Aylık sınır ayın takvim saati sayısıdır; negatif, belirsiz binlik ayraçlı ve geçersiz değerler reddedilir.

Otomatik saat hesabında açık vardiya aralığı varsa gerçek dakika farkı kullanılır. Böylece örneğin `08:00-15:00` vardiyasında hatalı saklanmış `7,92` saat yerine 7 saat hesaplanır. Geceyi aşan ve 24 saatlik vardiyalar desteklenir. Kimliği farklı kaydın yalnız adı eşleşiyor diye kişiye eklenmesi engellenir; yinelenen aynı tarih/birim/vardiya kaydı tek sayılır. Gerçek yarım saat/dakikalı çalışma korunur; tüm küsuratlar keyfî biçimde yuvarlanmaz. Vardiyası olmayan eski bir kaynak değeri doğrulanamıyorsa aylık toplam elle düzeltilebilir. Kaynak görev verisi topluca yeniden yazılmaz.

## Doğrulama

84 test geçti:

```
node --test tests/stability.test.cjs tests/say-hakedis.test.cjs tests/live-sync.test.cjs tests/scheduler-safety.test.cjs tests/first-edit-durability.test.cjs tests/opening-loader.test.cjs tests/monthly-list-variants.test.cjs tests/reliability.test.cjs tests/desktop-live.test.cjs
```

Test ortamında jsdom gerekir. Canlı uygulama HTML'sinin yükleyici dönüşümü ve inline script sözdizimi de doğrulandı. Chromium'da gerçek uygulama çekirdeği, gömülü v319 ve on eski eklenti, v396/v400/masaüstü katmanları birlikte örnek verilerle çalıştırıldı. Kurulumdan sonra 2,5 saniyelik gözlemde iki alt toplam satırı ve açık menünün düğmeleri aynı kaldı; bu alanlarda sıfır child-list mutasyonu ve sıfır tarayıcı JavaScript hatası görüldü. Dış kurum saatini açılan pencereden kaydetme ve hatalı saat yerine gerçek vardiya süresini kullanma da doğrulandı. Bu gözlem kimlik doğrulanmış üretim oturumuyla yapılmadı.

## Devam eden yenilenme: tüm ekran katmanlarıyla takip düzeltmesi

İlk test yalnız alt toplam ve menü alanlarını izliyordu. Tam ekran katmanları birlikte çalıştırıldığında kalan üç kaynak ölçüldü:

- İmza Arşivi sayacı, aynı metni yazıp kendi MutationObserver'ını tekrar tetikliyordu: 2,5 saniyede 66 yazım. Sayaç yalnız değer değişince yazılır.
- SDS düğmesinin zaten doğru konumdayken `insertBefore` ile yeniden taşınması, tüm sayfanın izleyicilerini tetikliyordu: 15 saniyede 588 sidebar mutasyonu. Düğme yalnız konumu farklıysa taşınır.
- Gizli v322 takip paneli ve özeti, her sayfa mutasyonunda yeniden kuruluyordu: 15 saniyede her iki alanda 122 yeniden yazım. Şablon/veri değişmedikçe mevcut alanlar ve kaydedilmemiş girişler korunur; gerçek değişiklikte panel/özet güncellenir.

Sayfa sığdırma çubuğunun aynı `output.value` değerini yeniden yazması da engellendi. Sayfa dışındaki kayıt/durum bildirimleri artık uzun Saymanlık listesini yeniden ölçeklemez. Not stilinin mevcut kimliğiyle kontrol edilen kimliği eşleştirildi; gecikmeli başlangıç ve ay değişikliklerinde aynı stil tekrar eklenmez. Etkilenen dosyaların önbellek sürümleri yenilendi.

Ek doğrulama: uygulama çekirdeği, yükleme listesindeki bütün eski eklentiler (kaldırılmış veri çekme eklentisi v372 hariç), yerel arşiv/zoom/not/yazdırma/liste/menü katmanları örnek verilerle Chromium'da birlikte çalıştırıldı. Başlangıç tamamlandıktan sonraki 15 saniyede **tüm body üzerinde sıfır child-list mutasyonu**, sıfır tarayıcı hatası görüldü. Saymanlık tablolarının her birinde iki toplam satırı ve açık menünün düğmeleri korundu. Bu, üretim hesabıyla yapılmış canlı oturum testi değildir.

Güncel test komutu 89 test çalıştırır ve tamamı geçti:

```
node --test tests/page-idle.test.cjs tests/stability.test.cjs tests/say-hakedis.test.cjs tests/live-sync.test.cjs tests/scheduler-safety.test.cjs tests/first-edit-durability.test.cjs tests/opening-loader.test.cjs tests/monthly-list-variants.test.cjs tests/reliability.test.cjs tests/desktop-live.test.cjs
```
