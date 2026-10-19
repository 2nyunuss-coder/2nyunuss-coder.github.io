# RPYS — 19 Ekim 2026 düzeltmeleri

## Davranış

- Liste motorunun beklediği `allViolations` ve `runIndexed` API'leri dinlenme modülünde sağlandı; modülün yüklenmesini engelleyen eksik parantez giderildi. İşlem sırasında eklenen/silinen hücreler dinlenme kontrolünde anında görülür. Önceki/sonraki ay sınırları korunur.
- Eski otomatik sayfa yenileyen revizyon izleyicisi yerini `rpys-live-sync-v419.js` modülüne bırakır. Uzak revizyon, açık taslağı değiştirmez. Yeni kayıt bildirimi çıkar; geçiş kullanıcı düğmesiyle ve bekleyen kayıt yoksa yapılır. Eski `rpys-patch372` yüklenmez. Reddedilen MASTER yazımı da taslağı sessizce sunucu verisiyle değiştirmez; mevcut çakışma/kuyruk mekanizmasına bırakılır.
- ŞUA tablosunun çizimini durduran eksik global `fmt` için sayı biçimleyicisi sağlandı. Hakediş sekmesi açılırken saatler güncel atamalardan hesaplanır. Olmayan görevler üretilemez; veri bulunmayan ay sıfırdır.
- İzin/rapor sayfasındaki tarih aralıkları seçili ayın Saymanlık hücrelerine doğrudan yansır. Ayı aşan ve ileri tarihli izinler desteklenir. Hücrelere izin kopyası yazılmaz; dolayısıyla izin silinince türetilmiş eski kayıt bırakılmaz. Kullanıcının girdiği izin, eski Excel görünümünden önceliklidir.
- Serbest metin girilen günler otomatik mükellef hesabına katılır: iş günü 7 saat, arefe/yarım tatil 5 saat, hafta sonu/tam tatil 0. Sayı veya mesai saati aralığı izin sayılmaz. Aynı günün izin ve metin kaydı tek kez sayılır; aynı metni tekrar girmek tekrar düşmez. Metni boşaltmak otomatik düşümü kaldırır. Metin düzenlemesinde mevcut manuel mükellef/puantaj değerleri yalnız bu düzenlemenin farkıyla bir kez güncellenir. Başka bir tarihte yapılmış bilinçli manuel toplamlar topluca sıfırlanmaz.
- İçe aktarılmış eski mükellef toplamı, güncel izin/takvim hesabını gölgeleyemez. Açık manuel puantaj tercihi korunur.

## Doğrulama

Node test komutu (jsdom kurulu olmalı):

```
node --test tests/live-sync.test.cjs tests/say-hakedis.test.cjs tests/scheduler-safety.test.cjs tests/first-edit-durability.test.cjs tests/opening-loader.test.cjs tests/monthly-list-variants.test.cjs tests/reliability.test.cjs
```

69 test geçti. Eski statik güvenilirlik kontrolü, otomatik dağıtım işlemlerinin v398'de bulunmasını ve v397'nin beklenen API'leri gerçekten sağlamasını kontrol edecek şekilde güncellendi. Dinlenme hesapları ve geri alma davranışı ayrıca çalışan testlerle doğrulandı.

Canlı `rpys-app-source` yalnız okundu; yükleyici dönüşümü, sayfa yapısı ve tüm inline scriptlerin sözdizimi doğrulandı. Chromium'da gerçek çekirdek koduyla, örnek iki personel ve engellenmiş bulut çağrıları kullanılarak metin girişi/tekrar/silme, 7/5 saatlik takvim hesabı, Ekim–Kasım arası izin ve görünür ŞUA aylık tablosu doğrulandı. Tarayıcıda JavaScript hatası olmadı. Kimlik doğrulanmış üretim verileriyle uçtan uca çalışma yapılmadı.

Üretim verisi, şema, arşiv ve mevcut listeler üzerinde işlem yapılmadı. Değişiklikler yerel çalışma dalındadır; bu çalışma sırasında canlı yayın yapılmadı.
