import { skorRepository } from '../repositories/skorRepository';
import { eventRepository } from '../repositories/eventRepository';
import { oturumRepository } from '../repositories/oturumRepository';
import { kullaniciRepository } from '../repositories/kullaniciRepository';
import { OgrenciDurum, OgrenciRaporu, EventSayilari } from '../types';

const durumBelirle = (skor: number): OgrenciDurum => {
  if (skor <= 30) return 'NORMAL';
  if (skor <= 60) return 'DIKKAT';
  return 'SUPHELI';
};

export const skorService = {
  ogrenciRaporuGetir: async (ogrenciId: string): Promise<OgrenciRaporu | null> => {
    const kullanici = await kullaniciRepository.idIleAra(ogrenciId);
    if (!kullanici) return null;

    const oturum = await oturumRepository.aktifOturumAra(ogrenciId);
    if (!oturum) return null;

    const skor = await skorRepository.oturumSkorAl(oturum.id);
    const tumSayilar = await eventRepository.tumEventSayilariGetir(oturum.id);
    const sonEventler = await eventRepository.sonEventleriGetir(oturum.id, 10);

    const eventSayilari: EventSayilari = {
      kopyalama: tumSayilar.KOPYALAMA_GIRISIMI ?? 0,
      sekmeDegisimi: tumSayilar.SEKME_DEGISIMI ?? 0,
      odakKaybi: tumSayilar.ODAK_KAYBI ?? 0,
      mouseHareketsiz: tumSayilar.MOUSE_HAREKETSIZ ?? 0,
      hizliGecis: tumSayilar.HIZLI_GECIS ?? 0,
    };

    const toplamSkor = skor?.toplamSkor ?? 0;

    return {
      kullanici,
      oturum,
      toplamSkor,
      eventSayilari,
      durum: durumBelirle(toplamSkor),
      sonEventler,
    };
  },

  tumOgrenciSkorlariniGetir: async () => {
    return skorRepository.tumSkorlariListele();
  },
};
