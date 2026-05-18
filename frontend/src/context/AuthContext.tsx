// PATTERN: Request-Reply Pattern
// Auth Context - JWT token ve kullanıcı durumunu global olarak yönetir

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { KullaniciBilgi, AuthDurum, GirisIstegi, KayitIstegi, Rol } from '../types';
import { apiServisi } from '../services/apiServisi';

interface AuthContextTipi extends AuthDurum {
  girisYap: (veri: GirisIstegi) => Promise<void>;
  kayitOl: (veri: KayitIstegi) => Promise<void>;
  cikisYap: () => void;
}

const AuthContext = createContext<AuthContextTipi | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [kullanici, setKullanici] = useState<KullaniciBilgi | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  // Sayfa yenilendiğinde localStorage'dan oturumu geri yükle
  useEffect(() => {
    const kayitliToken = localStorage.getItem('sinav_token');
    const kayitliKullanici = localStorage.getItem('sinav_kullanici');

    if (kayitliToken && kayitliKullanici) {
      setToken(kayitliToken);
      setKullanici(JSON.parse(kayitliKullanici) as KullaniciBilgi);
      apiServisi.tokenAyarla(kayitliToken);
    }
    setYukleniyor(false);
  }, []);

  const girisYap = useCallback(async (veri: GirisIstegi) => {
    const yanit = await apiServisi.girisYap(veri);
    const { kullanici: k, token: t } = yanit;

    setKullanici(k);
    setToken(t);
    apiServisi.tokenAyarla(t);
    localStorage.setItem('sinav_token', t);
    localStorage.setItem('sinav_kullanici', JSON.stringify(k));
  }, []);

  const kayitOl = useCallback(async (veri: KayitIstegi) => {
    const yanit = await apiServisi.kayitOl(veri);
    const { kullanici: k, token: t } = yanit;

    setKullanici(k);
    setToken(t);
    apiServisi.tokenAyarla(t);
    localStorage.setItem('sinav_token', t);
    localStorage.setItem('sinav_kullanici', JSON.stringify(k));
  }, []);

  const cikisYap = useCallback(() => {
    setKullanici(null);
    setToken(null);
    apiServisi.tokenAyarla(null);
    localStorage.removeItem('sinav_token');
    localStorage.removeItem('sinav_kullanici');
  }, []);

  return (
    <AuthContext.Provider value={{ kullanici, token, yukleniyor, girisYap, kayitOl, cikisYap }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextTipi => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth, AuthProvider içinde kullanılmalıdır');
  return context;
};
