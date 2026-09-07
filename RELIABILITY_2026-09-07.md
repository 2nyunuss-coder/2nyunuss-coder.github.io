# Mobil ve açılış güvenilirliği — 7 Eylül 2026

Bu değişiklik RPYS Cep ve YEA Suite'in birlikte kullanımında çevrimdışı dosyalarının korunmasını, YEA açılışını ve mobil kayıtların bulut onayını iyileştirir.

- Önbellek temizliği yalnız ilgili uygulamanın kendi eski sürümlerini kaldırır.
- HTTP hata yanıtı sağlam çevrimdışı sayfayı değiştirmez; JS isteğine HTML verilmez.
- YEA'da bir eski sürüm sayfasını açmak v16 önbelleğini ezmez.
- YEA arama kodundaki mevcut sözdizimi/karakter hatası düzeltildi.
- Açılış bağımlılıkları için 45 saniyelik bekleme sınırı, temel HTML isteği için 30 saniyelik bağlantı sınırı ve tekrar deneme ekranı eklendi.
- Mobil talep ve teslim kayıtları önce yerel kuyruğa yazılır; sunucudaki kimlik, kullanıcı ve alanlar doğrulanmadan kuyruktan kaldırılmaz.
- Gönderim sırasında yeni kayıt eklenmesi ve kullanıcı değişmesi kuyruk testleriyle kontrol edilir.
- Sahibi belirlenemeyen eski kuyruk kayıtları otomatik başka kullanıcı adına gönderilmez; mevcut kayıt dışa aktarmasına bekleyen kuyruk da eklenmiştir.
- YEA bildirim günü ve bütçe ayı Europe/Istanbul takvimine göre belirlenir.

## Doğrulama

`node --test tests/reliability.test.cjs` — 18 davranış/sözdizimi kontrolü.
Kontroller sentetik kayıtlar ve izole önbellek kullanır; gerçek personel veya finans verisi testlere kopyalanmaz.
Fiziksel iPhone/Android testi yapılmış kabul edilmemelidir. Başlangıçtaki yerel test adresi Cloud Browser tarafından açılmadı.

## Korunan alanlar

RPYS 6.1.1 motoru, nöbet dağıtımı, personel, izinler, saymanlık kayıtları, SDS belgeleri ve Supabase tablo yapıları bu Git değişikliğinde düzenlenmez. Yerel veri anahtarları değiştirilmez veya temizlenmez.

## Geri dönüş

Başlangıç commit'i: `5af0b3cd3830df7b9bf76b9d011b96fff9dd70c4`.
Mevcut yedek dalı: `backup/2026-09-06-174930-istanbul`.

Sorunlu değişiklik belirlenirse ilgili commit için yeni bir geri alma commit'i hazırlanır. Ana dal geçmişi zorla sıfırlanmaz. Geri dönüşte service worker önbellek sürümü yeniden yükseltilerek düzeltmenin cihazlara ulaştığı kontrol edilir. Eski service worker'lardaki uygulamalar arası silme hatası tekrar getirilmemelidir. Kod geri dönüşü için personel veritabanının eski tarihe alınması gerekmez; sonradan girilen kayıtlar korunur.
