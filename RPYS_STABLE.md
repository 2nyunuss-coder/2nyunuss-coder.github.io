# RPYS Stable 3.1.37 Recovery + SDS Ay Düzeltmesi

Kararlı/kurtarma dağıtım tarihi: 1 Eylül 2026

- Uygulama sürümü: **3.1.37-recovery**
- Dağıtım motoru: **6.1.1**
- Canlı kaynak: Supabase `rpys-app-source`
- Veri koruması: monoton revizyon, stale write reddi, şüpheli büyük state küçülmesi koruması ve otomatik snapshot.
- Kurtarma sırasında `RPYS_MAIN` revizyon **680** ayrıca `KURTARMA ÖNCESİ SABİT YEDEK • r680` etiketiyle snapshot olarak sabitlenmiştir.
- Bulut doğrulaması: 35 personel, 161 izin/rapor, toplam 3.051 görev kaydı ve Eylül 2026 için 359 görev kaydı mevcuttur. r678 ile r680 arasında görev ve izin verilerinde fark yoktur.
- Önceki `rpys-stable-bundle` tek istekte çok sayıda Edge Function çağırdığı için Supabase trace rate-limit'e girip HTTP 500 üretebiliyordu. Bu durum veri silinmiş gibi boş/eksik ekran oluşturabiliyordu.
- **3.1.37 kurtarma yükleyicisi:** tek toplu bundle çağrısı kaldırıldı. Çekirdek yamalar tarayıcı tarafından sırayla ve ayrı isteklerle yüklenir. 332.1 yamasındaki bilinen sözdizimi hatası yükleme sırasında güvenli metin düzeltmesiyle çalıştırılır.
- Ana kaynak HTTP 200 ile doğrulanmıştır; `X-RPYS-Version: 3.1.37-recovery`, `X-RPYS-Engine: 6.1.1`, `X-RPYS-Bundle: direct-sequential-recovery`. Eski `rpys-stable-bundle` çağrısı ana HTML'den kaldırılmıştır.
- SDS veri güvenliği için revizyon **684** ayrıca `SDS TEMMUZ-AĞUSTOS AYIRMA ÖNCESİ • r684` etiketiyle snapshot (id 296) olarak saklanmıştır.
- Ağustos MR/BT Excel'i yanlışlıkla Temmuz seçiliyken yüklenmiş olduğu tespit edilmiş ve yalnız SDS alanlarında güvenli biçimde ayrıştırılmıştır. Sonuç revizyon **685**: Temmuz resmi MR/BT değerleri geri korunmuş, Ağustos ayrı `2026-08` aylık SDS kaydı olarak oluşturulmuştur.
- Temmuz MR/BT: Poliklinik **MR 5542 / BT 1978**, Acil **MR 706 / BT 3692**, Klinik **MR 178 / BT 754**, toplam **MR 6426 / BT 6424**.
- Ağustos MR/BT: Poliklinik **MR 4861 / BT 1543**, Acil **MR 728 / BT 3521**, Klinik **MR 159 / BT 699**, toplam **MR 5748 / BT 5763**. Ağustos kaydında `prevYm=2026-07` ve Excel'den gelen **266** hekim/branş kırılımı bulunur.
- **390.8A Hastane Excel okuyucu:** yükleme önizlemesinde dosyanın hangi SDS ayına yazılacağını açıkça gösterir. Mevcut resmi tarihsel MR/BT kaydının üstüne yeni Excel yazılacaksa kullanıcıdan ayrıca onay ister. Yeni aya Excel işlendiğinde bir önceki SDS ayının mevcut MR/BT/USG değerlerini `Prev` alanlarına otomatik taşır; geçmiş ayı silmez.
- **390.8B Word/OOXML motoru:** Word karşılaştırmalarında sabit Haziran verisini taşımak yerine seçili SDS ayının gerçek önceki ay kaydını kullanır. Ağustos evrağında karşılaştırma **Temmuz → Ağustos** olur. MR/BT hekim ve branş sıralamaları Ağustos Excel detaylarından güncellenir; Temmuz değerleri önceki ay olarak korunur. Ağustos USG/diğer alanları girilmemişse veri uydurulmaz, eksik alan `—` olarak gösterilir.
- 390.8A ve 390.8B canlı Edge Function uçları ayrı ayrı HTTP **200** ile doğrulanmıştır.
- SDS / STD canlı parçaları: 388.1, 389.1, 390.8A Hastane Excel okuyucu, 390.8B Word/OOXML karşılaştırma motoru, 390.6C Tam Evrak.

Bu düzeltmeler personel, nöbet, saymanlık veya 6.1.1 dağıtım motoru verisini değiştirmez; yalnız SDS ay ayrımı, Excel içe aktarma güvenliği ve Word aylık karşılaştırma üretimini düzeltir.
