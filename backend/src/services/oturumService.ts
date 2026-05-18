import { oturumRepository } from '../repositories/oturumRepository';
import { skorRepository } from '../repositories/skorRepository';
import { kullaniciRepository } from '../repositories/kullaniciRepository';
import { aktifOgrenciler } from '../socket/socketYoneticisi';
import { ioAl } from '../socket/ioOrnegi';
import { Oturum, OgrenciDurumu } from '../types';

export const oturumService = {
  sinavBaslat: async (ogrenciId: string): Promise<Oturum> => {
    // Zaten aktif oturum varsa önce bitir, ardından yeni oturum aç
    const aktifOturum = await oturumRepository.aktifOturumAra(ogrenciId);
    if (aktifOturum) {
      await oturumRepository.bitir(aktifOturum.id);
      aktifOgrenciler.delete(aktifOturum.id);
    }

    const oturum = await oturumRepository.olustur(ogrenciId);
    await skorRepository.olustur(oturum.id, 0);

    const kullanici = await kullaniciRepository.idIleAra(ogrenciId);
    if (!kullanici) throw new Error('Kullanıcı bulunamadı');

    const ogrenciDurumu: OgrenciDurumu = {
      kullanici,
      oturum,
      mevcutSoru: 1,
      toplamSkor: 0,
      eventSayilari: {
        kopyalama: 0,
        sekmeDegisimi: 0,
        odakKaybi: 0,
        mouseHareketsiz: 0,
        hizliGecis: 0,
      },
      durum: 'NORMAL',
    };

    aktifOgrenciler.set(oturum.id, ogrenciDurumu);

    try {
      const io = ioAl();
      io.to('gozatmenler').emit('ogrenci:baglandi', ogrenciDurumu);
    } catch {
      // Socket henüz bağlı olmayabilir
    }

    return oturum;
  },

  sinavBitir: async (oturumId: string): Promise<Oturum | null> => {
    const oturum = await oturumRepository.bitir(oturumId);

    // Değişiklik 1: aktifOgrenciler'den SİLME — TAMAMLANDI olarak işaretle.
    // Gözetmen panelinde öğrenci sonuçlarıyla birlikte görünmeye devam eder.
    const ogrenciDurumu = aktifOgrenciler.get(oturumId);
    if (ogrenciDurumu) {
      ogrenciDurumu.durum = 'TAMAMLANDI';
      ogrenciDurumu.oturum.aktif = false;
      if (oturum?.bitisZamani) {
        ogrenciDurumu.oturum.bitisZamani = oturum.bitisZamani;
      }
      aktifOgrenciler.set(oturumId, ogrenciDurumu);

      try {
        const io = ioAl();
        // Gözetmenlere "tamamlandı" bildirimi — panelde kalır
        io.to('gozatmenler').emit('ogrenci:tamamlandi', ogrenciDurumu);
      } catch {
        // Sessizce geç
      }
    }

    return oturum;
  },

  soruGuncelle: async (oturumId: string, soruNo: number): Promise<void> => {
    const ogrenciDurumu = aktifOgrenciler.get(oturumId);
    if (!ogrenciDurumu) return;

    ogrenciDurumu.mevcutSoru = soruNo;
    aktifOgrenciler.set(oturumId, ogrenciDurumu);

    try {
      const io = ioAl();
      io.to('gozatmenler').emit('ogrenci:guncellendi', ogrenciDurumu);
    } catch {
      // Sessizce geç
    }
  },
};
