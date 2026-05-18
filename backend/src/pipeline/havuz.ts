// PATTERN: Ventilator-Worker-Sink (Pipeline Pattern)
// Sink (Havuz): İşlenmiş olayları veritabanına kaydeder ve gözetmenlere yayınlar.
// PATTERN: Multicast - Aynı event tüm gözetmenlere gider.
//
// Skor hesaplama burada yapılır çünkü:
//   1. Zaman ağırlığı: oturum başlangıcına göre hesapla (sınav ilerledikçe etki artar)
//   2. Frekans bonusu: event DB'ye kaydedildikten SONRA sayılmalı (doğru sonuç için)

import { SinavEvent, OgrenciDurum, EventTipi } from '../types';
import { eventRepository } from '../repositories/eventRepository';
import { skorRepository } from '../repositories/skorRepository';
import { aktifOgrenciler } from '../socket/socketYoneticisi';
import { ioAl } from '../socket/ioOrnegi';

const durumBelirle = (skor: number): OgrenciDurum => {
  if (skor <= 30) return 'NORMAL';
  if (skor <= 60) return 'DIKKAT';
  return 'SUPHELI';
};

// Sınav başlangıcına göre zaman ağırlığı
// Sınav ilerledikçe yapılan anomaliler daha şüpheli kabul edilir
const zamanAgirligiHesapla = (oturumBaslangici: Date): number => {
  const gecenDakika = (Date.now() - new Date(oturumBaslangici).getTime()) / 60000;
  if (gecenDakika >= 7) return 1.5;   // Sınavın son dönemi → yüksek etki
  if (gecenDakika >= 3) return 1.2;   // Orta dönem → orta etki
  return 1.0;                          // Başlangıç → normal etki
};

// Çok sık sekme değişimi → ekstra risk puanı
// Event kaydedildikten SONRA çağrılır — böylece mevcut event de sayıma dahil olur
const frekansEkstraPuani = async (oturumId: string, tip: EventTipi): Promise<number> => {
  if (tip !== 'SEKME_DEGISIMI') return 0;
  const sonBirDakika = await eventRepository.sonDakikaSayisi(oturumId, 'SEKME_DEGISIMI', 1);
  // Son 1 dakikada 3 veya daha fazla sekme değişimi → +20 ekstra
  return sonBirDakika >= 3 ? 20 : 0;
};

export const havuzaGonder = async (event: SinavEvent, temelPuan: number): Promise<void> => {
  // 1. Aktif öğrenci durumunu al
  const ogrenciDurumu = aktifOgrenciler.get(event.oturumId);
  if (!ogrenciDurumu) {
    console.warn(`[HAVUZ] Aktif oturum bulunamadı: ${event.oturumId}`);
    return;
  }

  // TAMAMLANDI durumundaki öğrencilerin skoru değiştirilmez
  if (ogrenciDurumu.durum === 'TAMAMLANDI') return;

  // 2. Event'i veritabanına kaydet
  await eventRepository.kaydet(event);

  // 3. Zaman ağırlığını hesapla (oturum başlangıcına göre)
  const agirlik = zamanAgirligiHesapla(ogrenciDurumu.oturum.baslangicZamani);
  const agirlikliPuan = Math.round(temelPuan * agirlik);

  // 4. Frekans bonusu — event DB'ye kaydedildikten SONRA hesaplanır
  const ekstraPuan = await frekansEkstraPuani(event.oturumId, event.tip);

  const toplamEklenecekPuan = agirlikliPuan + ekstraPuan;

  // 5. Skoru güncelle
  const mevcutSkor = await skorRepository.oturumSkorAl(event.oturumId);
  const yeniToplamSkor = (mevcutSkor?.toplamSkor ?? 0) + toplamEklenecekPuan;

  if (mevcutSkor) {
    await skorRepository.guncelle(event.oturumId, yeniToplamSkor);
  } else {
    await skorRepository.olustur(event.oturumId, yeniToplamSkor);
  }

  // 6. Bellekteki öğrenci durumunu güncelle
  ogrenciDurumu.toplamSkor = yeniToplamSkor;
  ogrenciDurumu.durum = durumBelirle(yeniToplamSkor);

  switch (event.tip) {
    case 'KOPYALAMA_GIRISIMI':   ogrenciDurumu.eventSayilari.kopyalama++;       break;
    case 'SEKME_DEGISIMI':       ogrenciDurumu.eventSayilari.sekmeDegisimi++;   break;
    case 'ODAK_KAYBI':     ogrenciDurumu.eventSayilari.odakKaybi++; break;
    case 'MOUSE_HAREKETSIZ':     ogrenciDurumu.eventSayilari.mouseHareketsiz++; break;
    case 'HIZLI_GECIS':          ogrenciDurumu.eventSayilari.hizliGecis++;      break;
  }

  aktifOgrenciler.set(event.oturumId, ogrenciDurumu);

  const io = ioAl();

  // 7. PATTERN: Multicast — Tüm gözetmenlere yayınla
  io.to('gozatmenler').emit('ogrenci:guncellendi', ogrenciDurumu);
  io.to('gozatmenler').emit('event:islendi', {
    oturumId: event.oturumId,
    event,
    temelPuan,
    agirlik,
    ekstraPuan,
    toplamEklenecek: toplamEklenecekPuan,
    yeniSkor: yeniToplamSkor,
    durum: ogrenciDurumu.durum,
    ogrenciAd: ogrenciDurumu.kullanici.ad,
  });

  // 8. Öğrenciye skor/durum bildir (sayısal değer gösterilmez, sadece mantık için)
  io.to(`ogrenci:${ogrenciDurumu.kullanici.id}`).emit('skor:guncellendi', {
    toplamSkor: yeniToplamSkor,
    durum: ogrenciDurumu.durum,
  });

  console.log(
    `[HAVUZ] ${ogrenciDurumu.kullanici.ad} | ${event.tip} | ` +
    `Temel:${temelPuan} × ${agirlik} + Ekstra:${ekstraPuan} = +${toplamEklenecekPuan} | ` +
    `Toplam:${yeniToplamSkor} | ${ogrenciDurumu.durum}`
  );
};
