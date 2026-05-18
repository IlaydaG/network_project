// PATTERN: Request-Reply Pattern
// Korunan Sayfa: JWT token kontrolü yapar, yetkisiz erişimi engeller

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Rol } from '../../types';

interface KorunanSayfaProps {
  children: React.ReactNode;
  gerekliRol?: Rol;
}

const KorunanSayfa: React.FC<KorunanSayfaProps> = ({ children, gerekliRol }) => {
  const { kullanici, yukleniyor } = useAuth();

  if (yukleniyor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-lg">Yükleniyor...</div>
      </div>
    );
  }

  if (!kullanici) {
    return <Navigate to="/giris" replace />;
  }

  if (gerekliRol && kullanici.rol !== gerekliRol) {
    // Yanlış role sahip → kendi sayfasına yönlendir
    return <Navigate to={kullanici.rol === 'OGRENCI' ? '/sinav' : '/gozatmen'} replace />;
  }

  return <>{children}</>;
};

export default KorunanSayfa;
