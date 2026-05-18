// PATTERN: Request-Reply Pattern
// Auth Service: Kimlik doğrulama iş mantığı

import bcrypt from 'bcrypt';
import { kullaniciRepository } from '../repositories/kullaniciRepository';
import { tokenOlustur } from '../config/jwt';
import { KayitIstegi, GirisIstegi, KullaniciBilgi } from '../types';

const TUZLAMA_TURU = 10;

export const authService = {
  kayitOl: async (veri: KayitIstegi): Promise<{ kullanici: KullaniciBilgi; token: string }> => {
    // E-posta benzersizliği kontrolü
    const mevcutKullanici = await kullaniciRepository.emailIleAra(veri.email);
    if (mevcutKullanici) {
      throw new Error('Bu e-posta adresi zaten kayıtlı');
    }

    const sifreHash = await bcrypt.hash(veri.sifre, TUZLAMA_TURU);
    const kullanici = await kullaniciRepository.olustur({ ...veri, sifreHash });

    const token = tokenOlustur({ kullaniciId: kullanici.id, rol: kullanici.rol });
    return { kullanici, token };
  },

  girisYap: async (veri: GirisIstegi): Promise<{ kullanici: KullaniciBilgi; token: string }> => {
    const kullanici = await kullaniciRepository.emailIleAra(veri.email);
    if (!kullanici) {
      throw new Error('Geçersiz e-posta veya şifre');
    }

    const sifreGecerli = await bcrypt.compare(veri.sifre, kullanici.sifreHash);
    if (!sifreGecerli) {
      throw new Error('Geçersiz e-posta veya şifre');
    }

    const kullaniciBilgi: KullaniciBilgi = {
      id: kullanici.id,
      ad: kullanici.ad,
      email: kullanici.email,
      rol: kullanici.rol,
    };

    const token = tokenOlustur({ kullaniciId: kullanici.id, rol: kullanici.rol });
    return { kullanici: kullaniciBilgi, token };
  },
};
