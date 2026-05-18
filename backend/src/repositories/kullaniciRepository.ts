import { v4 as uuidv4 } from 'uuid';
import { db, toDate } from '../config/firebase';
import { Kullanici, KullaniciBilgi, KayitIstegi, Rol } from '../types';

const KOLEKSIYON = 'kullanicilar';

export const kullaniciRepository = {
  emailIleAra: async (email: string): Promise<Kullanici | null> => {
    const snap = await db.collection(KOLEKSIYON).where('email', '==', email).limit(1).get();
    if (snap.empty) return null;
    const doc  = snap.docs[0];
    const data = doc.data();
    return { ...data, id: doc.id, olusturmaTarihi: toDate(data.olusturmaTarihi) } as Kullanici;
  },

  idIleAra: async (id: string): Promise<KullaniciBilgi | null> => {
    const doc = await db.collection(KOLEKSIYON).doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    return { id: doc.id, ad: data.ad, email: data.email, rol: data.rol };
  },

  olustur: async (veri: KayitIstegi & { sifreHash: string }): Promise<KullaniciBilgi> => {
    const id = uuidv4();
    await db.collection(KOLEKSIYON).doc(id).set({
      ad:              veri.ad,
      email:           veri.email,
      sifreHash:       veri.sifreHash,
      rol:             veri.rol,
      olusturmaTarihi: new Date(),
    });
    return { id, ad: veri.ad, email: veri.email, rol: veri.rol };
  },

  rolIleListele: async (rol: Rol): Promise<KullaniciBilgi[]> => {
    const snap = await db.collection(KOLEKSIYON).where('rol', '==', rol).get();
    return snap.docs
      .map(doc => {
        const data = doc.data();
        return { id: doc.id, ad: data.ad, email: data.email, rol: data.rol } as KullaniciBilgi;
      })
      .sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
  },
};
