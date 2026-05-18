import { db, toDate } from '../config/firebase';
import { SinavEvent, EventTipi } from '../types';

const KOLEKSIYON = 'eventler';

const docToEvent = (id: string, data: FirebaseFirestore.DocumentData): SinavEvent => ({
  id,
  oturumId: data.oturumId,
  tip:      data.tip,
  zaman:    toDate(data.zaman),
  veri:     data.veri ?? {},
});

export const eventRepository = {
  kaydet: async (event: SinavEvent): Promise<SinavEvent> => {
    await db.collection(KOLEKSIYON).doc(event.id).set({
      oturumId: event.oturumId,
      tip:      event.tip,
      zaman:    event.zaman,
      veri:     event.veri ?? {},
    });
    return event;
  },

  oturumEventleriniListele: async (oturumId: string): Promise<SinavEvent[]> => {
    const snap = await db.collection(KOLEKSIYON).where('oturumId', '==', oturumId).get();
    return snap.docs
      .map(doc => docToEvent(doc.id, doc.data()))
      .sort((a, b) => a.zaman.getTime() - b.zaman.getTime());
  },

  sonEventleriGetir: async (oturumId: string, limit = 20): Promise<SinavEvent[]> => {
    const snap = await db.collection(KOLEKSIYON).where('oturumId', '==', oturumId).get();
    return snap.docs
      .map(doc => docToEvent(doc.id, doc.data()))
      .sort((a, b) => b.zaman.getTime() - a.zaman.getTime())
      .slice(0, limit)
      .reverse();
  },

  tipeBoreEventSay: async (oturumId: string, tip: EventTipi): Promise<number> => {
    const snap = await db.collection(KOLEKSIYON)
      .where('oturumId', '==', oturumId)
      .where('tip', '==', tip)
      .get();
    return snap.size;
  },

  sonDakikaSayisi: async (oturumId: string, tip: EventTipi, dakika: number): Promise<number> => {
    // İlk iki filtre Firestore'da, zaman filtresi memory'de → composite index gereksiz
    const esik = new Date(Date.now() - dakika * 60000);
    const snap = await db.collection(KOLEKSIYON)
      .where('oturumId', '==', oturumId)
      .where('tip', '==', tip)
      .get();
    return snap.docs.filter(doc => toDate(doc.data().zaman) > esik).length;
  },

  tumEventSayilariGetir: async (oturumId: string): Promise<Record<EventTipi, number>> => {
    const sayilar: Record<string, number> = {
      KOPYALAMA_GIRISIMI: 0,
      SEKME_DEGISIMI:     0,
      ODAK_KAYBI:         0,
      MOUSE_HAREKETSIZ:   0,
      HIZLI_GECIS:        0,
    };
    const snap = await db.collection(KOLEKSIYON).where('oturumId', '==', oturumId).get();
    snap.docs.forEach(doc => {
      const tip = doc.data().tip as string;
      if (tip in sayilar) sayilar[tip]++;
    });
    return sayilar as Record<EventTipi, number>;
  },
};
