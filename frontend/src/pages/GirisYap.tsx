// PATTERN: Client-Server Pattern + Request-Reply Pattern
// Giriş sayfası - JWT token alır ve localStorage'a kaydeder

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GirisYap: React.FC = () => {
  const { girisYap, kullanici } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', sifre: '' });
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  // Zaten giriş yapılmışsa yönlendir
  React.useEffect(() => {
    if (kullanici) {
      navigate(kullanici.rol === 'OGRENCI' ? '/sinav' : '/gozatmen');
    }
  }, [kullanici, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);

    try {
      await girisYap(form);
      // AuthContext giriş yapıldıktan sonra kullanici state güncellenecek
      // yukarıdaki useEffect yönlendirme yapacak
    } catch (err) {
      setHata(err instanceof Error ? err.message : 'Giriş başarısız');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎓</div>
          <h1 className="text-2xl font-bold text-gray-800">Sınav İzleme Sistemi</h1>
          <p className="text-gray-500 mt-1">Hesabınıza giriş yapın</p>
        </div>

        {hata && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
            {hata}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="ornek@mail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
            <input
              type="password"
              required
              value={form.sifre}
              onChange={(e) => setForm({ ...form, sifre: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={yukleniyor}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors duration-200"
          >
            {yukleniyor ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Hesabınız yok mu?{' '}
          <Link to="/kayit" className="text-indigo-600 hover:underline font-medium">
            Kayıt Ol
          </Link>
        </p>
      </div>
    </div>
  );
};

export default GirisYap;
