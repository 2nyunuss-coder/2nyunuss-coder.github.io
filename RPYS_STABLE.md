# RPYS Stable 3.1.22

Kararlı dağıtım tarihi: 31 Ağustos 2026

- Uygulama sürümü: **3.1.22-stable**
- Dağıtım motoru: **6.1.1**
- Canlı kaynak: Supabase `rpys-app-source`
- Yama yükleme modeli: tek `rpys-stable-bundle` girişi; tarayıcı tarafında dağınık patch zinciri kaldırıldı.
- Veri koruması: `rpys_workspaces` için monoton revizyon zorunluluğu, stale write reddi, şüpheli büyük state küçülmesi koruması ve her başarılı revizyon öncesi otomatik snapshot.
- GitHub Pages açılış katmanı mevcut mobil güvenlik/onarım doğrulamalarını korur.

## Kararlı bundle içeriği

319fixed2, 320fixed1, 321.1, 322.1, 323.1, 326.1, 329.1, 332.1, 334.1, 335.1, 336.1, 337.1, 338.1, 339.1, 340.1, 351.2, 352.1, 353.4, 361.4, 363.6, 371.9, 372.2, 377.4, 381.1, 382.1, 384.2.

Eski Edge Function patchleri rollback/audit amacıyla saklanır; canlı `rpys-app-source` bunları ayrı ayrı yüklemez. Böylece canlı tarafta tek bundle bulunur ve patch sırası sabitlenmiştir.

## Veri kaybı koruması

`rpys_workspaces` güncellemelerinde yeni revision mevcut revision'dan büyük değilse kayıt reddedilir. Null state reddedilir. Büyük bir state'in %55'inden daha küçük beklenmedik bir state ile ezilmesi, açık bir restore/yedek işlemi değilse reddedilir. Her güncelleme öncesinde önceki revision `rpys_snapshots` tablosuna otomatik olarak güvence altına alınır.

## Doğrulama

Canlı kaynak servis katmanı temel HTML için boyut ve zorunlu sayfa kimliklerini doğrular. GitHub launcher ayrıca ana çalışma alanını, en az 40 sayfalık doğrudan sayfa yapısını, SAY1/SAY2 yapısını ve kritik sayfaları yükleme sırasında kontrol eder. Stable bundle, aktif patch sırasını tek manifest halinde sabitler.
