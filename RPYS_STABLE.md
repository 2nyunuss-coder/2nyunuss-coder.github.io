# RPYS Stable 3.1.37 Recovery

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
- SDS / STD özellikleri korunur: 388.1, 389.1, 390.6A Hastane Excel okuyucu, 390.6B Word/OOXML motoru, 390.6C Tam Evrak.

Bu kurtarma sürümünde veri geri yükleme yapılmamıştır; çünkü bulut görev/izin verileri sağlam ve son snapshotlarla tutarlıdır. Düzeltme yalnız çalışma/yükleme katmanına uygulanmıştır.
