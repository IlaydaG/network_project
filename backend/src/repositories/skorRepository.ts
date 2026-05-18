import { v4 as uuidv4 } from 'uuid';
import { db, toDate } from '../config/firebase';
import { Skor } from '../types';

const KOLEKSIYON              = 'skorlar';
const OTURUMLAR_KOLEKSIYON    = 'oturumlar';
const KULLANICILAR_KOLEKSIYON = 'kullanicilar';

const docToSkor = (oturumId: string, data: FirebaseFirestore.DocumentData): Skor => ({
  id:               data.id ?? oturumId,
  oturumId,
  toplamSkor:       data.toplamSkor,
  guncellemeTarihi: toDate(data.guncellemeTarihi),
});

export const skorRepository = {
  // Doc ID = oturumId → oturumSkorAl için O(1) erişim
  olustur: async (oturumId: string, toplamSkor: number): Promise<Skor> => {
    const id   = uuidv4();
    const data = { id, oturumId, toplamSkor, guncellemeTarihi: new Date() };
    await db.collection(KOLEKSIYON).doc(oturumId).set(data);
    return data;
  },

  oturumSkorAl: async (oturumId: string): Promise<Skor | null> => {
    const doc = await db.collection(KOLEKSIYON).doc(oturumId).get();
    if (!doc.exists) return null;
    return docToSkor(oturumId, doc.data()!);
  },

  guncelle: async (oturumId: string, toplamSkor: number): Promise<Skor> => {
    const guncellemeTarihi = new Date();
    const ref = db.collection(KOLEKSIYON).doc(oturumId);
    await ref.update({ toplamSkor, guncellemeTarihi });
    const doc = await ref.get();
    return docToSkor(oturumId, doc.data()!);
  },

  tumSkorlariListele: async (): Promise<Array<Skor & { ogrenciAd: string; ogrenciEmail: string }>> => {
    const skorSnap = await db.collection(KOLEKSIYON).get();
    if (skorSnap.empty) return [];

    const skorlar = skorSnap.docs.map(doc => docToSkor(doc.id, doc.data()));

    // İlgili oturumları batch olarak çek
    const oturumIds  = [...new Set(skorlar.map(s => s.oturumId))];
    const oturumDocs = await Promise.all(
      oturumIds.map(id => db.collection(OTURUMLAR_KOLEKSIYON).doc(id).get())
    );
    const oturumMap  = new Map(oturumDocs.filter(d => d.exists).map(d => [d.id, d.data()!]));

    // İlgili kullanıcıları batch olarak çek
    const ogrenciIds    = [...new Set(Array.from(oturumMap.values()).map(o => o.ogrenciId as string))];
    const kullaniciDocs = await Promise.all(
      ogrenciIds.map(id => db.collection(KULLANICILAR_KOLEKSIYON).doc(id).get())
    );
    const kullaniciMap  = new Map(kullaniciDocs.filter(d => d.exists).map(d => [d.id, d.data()!]));

    return skorlar
      .map(skor => {
        const oturum    = oturumMap.get(skor.oturumId);
        const kullanici = oturum ? kullaniciMap.get(oturum.ogrenciId) : undefined;
        return {
          ...skor,
          ogrenciAd:    kullanici?.ad    ?? 'Bilinmiyor',
          ogrenciEmail: kullanici?.email ?? '',
        };
      })
      .sort((a, b) => b.toplamSkor - a.toplamSkor);
  },
};
