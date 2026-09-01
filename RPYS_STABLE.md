# RPYS Stable 3.1.38 — Cache Integrity Root Fix

Kararlı dağıtım tarihi: 1 Eylül 2026

- Uygulama sürümü: **3.1.38-stable**
- Dağıtım motoru: **6.1.1**
- Canlı kaynak: Supabase `rpys-app-source`
- Veri koruması: monoton revizyon, stale write reddi, şüpheli büyük state küçülmesi koruması ve otomatik snapshot.
- Kök cache düzeltmesi öncesinde güncel RPYS verisi ayrıca **`KÖK CACHE DÜZELTME ÖNCESİ • r686`** etiketiyle snapshot olarak sabitlenmiştir (snapshot id 302; snapshot oluşturulduğu anda bulut revizyonu 689'a ilerlemişti).
- Son veri bütünlüğü doğrulaması: **35 personel, 3.051 ana görev, Eylül 2026 için 359 görev, 161 izin/rapor**. 3.1.38 deployu bu verileri değiştirmemiştir.

## Kök sorun

Saymanlık ve bazı görev görünümleri `db.assign` verisini doğrudan göstermiyordu; `assignmentsMonth()` tarafından üretilen `_assignCache`, `_peopleCache`, `_allAssignCache` ve `_calcCache` türetilmiş önbelleklerini kullanıyordu. Uygulama açılırken ilk render bulut verisi gelmeden gerçekleşirse boş aylık görev önbelleği oluşabiliyor; sonrasında Supabase MASTER verisi başarıyla 3.051 görev ile yüklense bile eski boş cache bazı açılışlarda kullanılmaya devam edebiliyordu. Sonuç: izin/rapor hücreleri görünürken görev hücreleri boş, puantaj ve birim toplamları 0 görünebiliyordu. Veri gerçekte silinmiyordu.

## 3.1.38 kalıcı düzeltmesi — v391 Cache Integrity

- `repairCoreData()` artık çalışma verisi her yenilendiğinde tüm türetilmiş görev/personel cache'lerini geçersiz kılan koruma katmanıyla sarılır. Böylece Supabase/yerel MASTER yüklenir yüklenmez eski boş cache kullanılamaz.
- `assignmentsMonth()` cache'i artık **seçili ay + bulut revizyonu + son kayıt zamanı + runtime boot zamanı + toplam görev sayısı + o ayın ham görev sayısı + personel sayısı** imzasıyla denetlenir. İmza değişirse cache otomatik temizlenir.
- Açılışın ilk 20 saniyesinde, pencere yeniden odaklandığında ve sekme tekrar görünür olduğunda cache sağlık kontrolü çalışır.
- Seçili ayda en az 5 ham görev bulunmasına rağmen `assignmentsMonth()` 0 görev döndürürse sistem bunu **catastrophic-empty-cache** olarak algılar, cache'i tekrar kurar ve Saymanlık/Nöbet ekranını otomatik yeniden render eder.
- Bu koruma yalnız türetilmiş önbellek/render katmanını değiştirir; `db.assign`, izinlar, personel, puantaj kayıtları veya 6.1.1 dağıtım motoru verisine yazmaz.
- Canlı ana kaynak HTTP **200** ile doğrulandı: `X-RPYS-Version: 3.1.38-stable`, `X-RPYS-Engine: 6.1.1`, `X-RPYS-Bundle: direct-sequential-cache-integrity`.
- Canlı HTML içinde `rpys-cache-integrity-v391` bulunduğu ve SDS yükleyici etiketlerinin `390.8A` / `390.7B` olarak geldiği doğrulandı.
- v391 cache guard JavaScript kodu ayrıca `node --check` sözdizimi testinden geçti.

## Önceki kurtarma ve SDS düzeltmeleri korunur

- Eski tek `rpys-stable-bundle` çağrısı kaldırılmış durumda; çekirdek yamalar tarayıcı tarafından sırayla yüklenir. 332.1 yamasındaki bilinen sözdizimi bozukluğu yükleme sırasında güvenli biçimde düzeltilir.
- Temmuz ve Ağustos SDS kayıtları ayrıdır. Ağustos kaydı `prevYm=2026-07` ile Temmuz → Ağustos karşılaştırmasını kullanır.
- Temmuz MR/BT: Poliklinik **MR 5542 / BT 1978**, Acil **MR 706 / BT 3692**, Klinik **MR 178 / BT 754**, toplam **MR 6426 / BT 6424**.
- Ağustos MR/BT: Poliklinik **MR 4861 / BT 1543**, Acil **MR 728 / BT 3521**, Klinik **MR 159 / BT 699**, toplam **MR 5748 / BT 5763**. Ağustos kaydında Excel'den gelen **266** hekim/branş kırılımı bulunur.
- SDS canlı parçaları: 388.1, 389.1, **390.8A** Hastane Excel okuyucu, **390.7B** Word/OOXML karşılaştırma motoru, 390.6C Tam Evrak.

Bu sürümde amaç yalnız hatayı görünürde gidermek değil, bulut veri yükleme sırası ile türetilmiş görev cache'leri arasındaki yarış durumunu sistemik olarak ortadan kaldırmaktır.