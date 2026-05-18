import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Rol } from '../types';

const KayitOl: React.FC = () => {
  const { kayitOl, kullanici } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ ad: '', email: '', sifre: '', rol: 'OGRENCI' as Rol });
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

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
      await kayitOl(form);
    } catch (err) {
      setHata(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📋</div>
          <h1 className="text-2xl font-bold text-gray-800">Yeni Hesap Oluştur</h1>
          <p className="text-gray-500 mt-1">Sisteme kayıt olun</p>
        </div>

        {hata && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
            {hata}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
            <input
              type="text"
              required
              minLength={2}
              value={form.ad}
              onChange={(e) => setForm({ ...form, ad: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Adınız Soyadınız"
            />
          </div>

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
              minLength={6}
              value={form.sifre}
              onChange={(e) => setForm({ ...form, sifre: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="En az 6 karakter"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value as Rol })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="OGRENCI">👨‍🎓 Öğrenci</option>
              <option value="GOZATMEN">👨‍🏫 Gözetmen</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={yukleniyor}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors duration-200 mt-2"
          >
            {yukleniyor ? 'Kayıt oluşturuluyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Zaten hesabınız var mı?{' '}
          <Link to="/giris" className="text-indigo-600 hover:underline font-medium">
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  );
};

export default KayitOl;
