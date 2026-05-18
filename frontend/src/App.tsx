import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import KorunanSayfa from './components/Genel/KorunanSayfa';

// Sayfalar
import GirisYap from './pages/GirisYap';
import KayitOl from './pages/KayitOl';
import SinavSayfasi from './pages/SinavSayfasi';
import GozatmenPaneli from './pages/GozatmenPaneli';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Herkese açık rotalar */}
          <Route path="/giris" element={<GirisYap />} />
          <Route path="/kayit" element={<KayitOl />} />

          {/* Sadece öğrenciye açık - PATTERN: Request-Reply (JWT doğrulama) */}
          <Route
            path="/sinav"
            element={
              <KorunanSayfa gerekliRol="OGRENCI">
                <SinavSayfasi />
              </KorunanSayfa>
            }
          />

          {/* Sadece gözetmene açık */}
          <Route
            path="/gozatmen"
            element={
              <KorunanSayfa gerekliRol="GOZATMEN">
                <GozatmenPaneli />
              </KorunanSayfa>
            }
          />

          {/* Kök URL → giriş sayfasına */}
          <Route path="/" element={<Navigate to="/giris" replace />} />
          <Route path="*" element={<Navigate to="/giris" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
