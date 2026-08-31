# RPYS Stable 3.1.22

Kararlı dağıtım tarihi: 31 Ağustos 2026

- Uygulama sürümü: **3.1.22-stable**
- Dağıtım motoru: **6.1.1**
- Canlı kaynak: Supabase `rpys-app-source`
- Yama yükleme modeli: tek `rpys-stable-bundle` girişi; tarayıcı tarafında dağınık patch zinciri kaldırıldı.
- Veri koruması: monoton revizyon, stale write reddi, şüpheli büyük state küçülmesi koruması ve otomatik snapshot.

Canlı bundle sırası: 319fixed2, 320fixed1, 321.1, 322.1, 323.1, 326.1, 329.1, 332.1, 334.1, 335.1, 336.1, 337.1, 338.1, 339.1, 340.1, 351.2, 352.1, 353.4, 361.4, 363.6, 371.9, 372.2, 377.4, 381.1, 382.1, 384.2.

Eski Edge Function patchleri yalnız rollback/audit için saklanır; canlı `rpys-app-source` bunları ayrı ayrı çağırmaz.

GitHub launcher temel DOM yapısını, en az 40 sayfayı, SAY1/SAY2 ve kritik sayfaları açılışta doğrular. Supabase app-source ayrıca temel HTML boyutu ve kritik sayfa kimliklerini kontrol eder.
