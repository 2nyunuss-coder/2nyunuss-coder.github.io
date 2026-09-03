# RPYS 3.1.48 — Baskı Kararlı Noktası

Kayıt tarihi: 3 Eylül 2026

Kullanıcı tarafından "her şey çok güzel" diye onaylanan geri dönüş noktasıdır.

## Canlı temel
- RPYS app source: `rpys-app-source` v157
- RPYS dağıtım motoru: `6.1.1`
- Baskı yönlendirme / saymanlık fix: `rpys-patch371` v11
- Resmi liste evrak üretimi: `rpys-patch381` v1 (bu checkpointteki görünüm)
- Hızlı yazdırma: `rpys-patch383` v5

## Onaylanan davranışlar
- Acil / Poliklinik yazdırma renkli ve kurumsal görünür.
- Saymanlık aynı hızlı yazdırma/sığdırma ayarını kullanır.
- A4 yatay sığdırma ve dar kenarlar çalışır.
- POLİKLİNİK / ACİL / TOPLAM / MÜKELLEF / FARK satırları görünür.
- Alt bölümde TOPLAM MÜKELLEF ve TOPLAM FAZLA MESAİ hesapları bulunur.
- Personel, nöbet, izin, puantaj ve dağıtım verisine baskı patch'i yazmaz.

## Sonraki kozmetik düzeltme
Checkpoint alındıktan sonra yalnız `TOPLAM MÜKELLEF` ve `TOPLAM FAZLA MESAİ` etiketlerinin sol hücre genişliği artırılacaktır. Bu değişiklik hesaplama veya diğer tasarım davranışlarını değiştirmemelidir.

Bu dosya, ileride bir baskı değişikliği istenmeyen sonuç verirse 3.1.48 baskı görünümüne geri dönmek için referanstır.
