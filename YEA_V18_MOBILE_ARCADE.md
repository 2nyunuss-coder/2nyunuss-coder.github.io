# YEA Suite 1.8 — Mobil merkez ve Oyun Odası

9 Eylül 2026. Temel kaynak: `92a2c6b077f54a22f1b78d8761695e01154a3cc4` (V1.7).

## Mobil geliştirmeler

- Yeni cep merkezi: açık görevler, aylık bakiye, sıradaki üç iş ve hızlı işlem bağlantıları.
- Tek dokunuşlu modül açılışı; beş bölümlü alt gezinme; aranabilir ve favorilenebilir modüller.
- Eski görev, gider, not, takvim, belge ve geçmiş istatistik işlevleri korunur.
- Telefonlarda okunabilir form boyutları, en az 44 piksel kontroller, güvenli ekran kenarları, tam ekran not/araç pencereleri.
- Sürüm dosyaları için önbellek öncelikli açılış. Eski V1.7 dosyaları silinmez.

## Oyunlar

| Oyun | Mekanik | Bölüm |
| --- | --- | ---: |
| Kale Atışı | Açı, güç, rüzgâr ve blok çarpışması | 20 |
| Ok Yolu | Doğru sırada çıkış; 3 hak, ipucu, geri alma | 20 |
| Ahşap Atölyesi | Sanal profil kesme, hedef uyumu, üç renk | 12 |
| Yutan Halka | Dokunmatik toplama, boyut büyümesi, süre | 20 |
| Bölge Akışı | Güç üretimi, aktarım, bilgisayar rakip | 20 |
| Renkli Rota | İki boyutlu kaydırma ve eşleşen çıkışlar | 30 |

Bu oyunlar özgün, basitleştirilmiş mini oyunlardır; referans ticari oyunların kodu veya görselleri kullanılmadı. Ahşap oyunu tam üç boyutlu fizik motoru değil, dinamik profil/ışıklandırma ile çizilen sanal şekillendirme oyunudur.

Oyunlar YEA hesabını, finansı veya RPYS verisini okumaz. Rekorlar ve açılan bölümler yalnız `yea_arcade_progress_v1` cihaz kaydında tutulur. JSON yedek dışa aktarma ve kayıp yaratmadan birleştirme bulunur. Aktif bölüm hamleleri yenilemede sıfırlanır. Duraklatma ve görünürlük değişiminde oyun zamanı durur; bulmacalar boşta sürekli çizim yapmaz.

## Doğrulama

`node --test tests/reliability.test.cjs tests/arcade.test.cjs`: 31/31 başarılı.

- Tüm 20 ok ve 30 blok bölümünün çözülebilirliği doğrulandı.
- Tüm 20 toplama bölümünde büyüme yolu ve süre içinde bitiş kontrol edildi.
- Ayrı simülasyonda 20 kale bölümünün tümü atış bütçesiyle tamamlandı.
- Ahşap profilleri kesim işlemiyle %83–94 uyuma ulaşabiliyor; teslim eşiği %80.
- Önbellekteki yerel dosyaların varlığı ve JavaScript sözdizimi kontrol edildi.
- Mevcut güvenilirlik kontrolleri de geçti. RPYS kodu ve veritabanı değişmedi.

Gerçek iPhone/Android veya tarayıcı üzerinden görsel/uçtan uca test yapılmadı. Bulut görev/finans yazma işlemleri gerçek kullanıcı hesabıyla bu çalışmada denenmedi. Eski oturum mekanizması değiştirilmedi; mevcut açılış/oturum sorunlarının tümü çözülmüş sayılmamalıdır.

## Sürüm sınırı

Giriş: `yea-suite/v18.html`. Oyunlar: `yea-suite/arcade/index.html`.

Bu geliştirme ayrı dalda saklanır. Ana dala birleştirme veya canlı yayın bu çalışma kapsamında yapılmadı. Yayımlamadan önce telefon kontrolü önerilir. Uygulama önbelleği yenilendiğinde yalnız YEA kabuk önbelleğinin eski sürümleri kaldırılır; kullanıcı kayıtları veya diğer uygulama önbellekleri temizlenmez.
