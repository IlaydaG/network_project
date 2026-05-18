import { v4 as uuidv4 } from 'uuid';
import { db, toDate } from '../config/firebase';
import { Oturum } from '../types';

const KOLEKSIYON = 'oturumlar';

const docToOturum = (id: string, data: FirebaseFirestore.DocumentData): Oturum => ({
  id,
  ogrenciId:       data.ogrenciId,
  baslangicZamani: toDate(data.baslangicZamani),
  bitisZamani:     data.bitisZamani ? toDate(data.bitisZamani) : undefined,
  aktif:           data.aktif,
});

export const oturumRepository = {
  olustur: async (ogrenciId: string): Promise<Oturum> => {
    const id   = uuidv4();
    const data = { ogrenciId, baslangicZamani: new Date(), bitisZamani: null, aktif: true };
    await db.collection(KOLEKSIYON).doc(id).set(data);
    return { id, ...data, bitisZamani: undefined };
  },

  idIleAra: async (id: string): Promise<Oturum | null> => {
    const doc = await db.collection(KOLEKSIYON).doc(id).get();
    if (!doc.exists) return null;
    return docToOturum(doc.id, doc.data()!);
  },

  aktifOturumAra: async (ogrenciId: string): Promise<Oturum | null> => {
    const snap = await db.collection(KOLEKSIYON)
      .where('ogrenciId', '==', ogrenciId)
      .where('aktif', '==', true)
      .limit(1)
      .get();
    if (snap.empty) return null;
    return docToOturum(snap.docs[0].id, snap.docs[0].data());
  },

  bitir: async (oturumId: string): Promise<Oturum | null> => {
    const ref = db.collection(KOLEKSIYON).doc(oturumId);
    await ref.update({ aktif: false, bitisZamani: new Date() });
    const doc = await ref.get();
    if (!doc.exists) return null;
    return docToOturum(doc.id, doc.data()!);
  },

  ogrenciOturumlariListele: async (ogrenciId: string): Promise<Oturum[]> => {
    const snap = await db.collection(KOLEKSIYON).where('ogrenciId', '==', ogrenciId).get();
    return snap.docs
      .map(doc => docToOturum(doc.id, doc.data()))
      .sort((a, b) => b.baslangicZamani.getTime() - a.baslangicZamani.getTime());
  },
};
