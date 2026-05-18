// PATTERN: Client-Server + Publish-Subscribe + Ventilator
// Sınav sayfası: Öğrenci arayüzü, anomali takibi ve event üretimi

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiServisi } from '../services/apiServisi';
import { socketServisi } from '../services/socketServisi';
import { useAnomaliTakip } from '../hooks/useAnomaliTakip';
import SoruKarti from '../components/OgrenciSinav/SoruKarti';
import { SORULAR, TOPLAM_SORU } from '../data/sorular';
import { OgrenciDurum, SinavBaslatYaniti } from '../types';

type SinavAsamasi = 'BEKLEMEDE' | 'DEVAM_EDIYOR' | 'TAMAMLANDI' | 'IPTAL';

const SinavSayfasi: React.FC = () => {
  const { kullanici, token, cikisYap } = useAuth();
  const navigate = useNavigate();

  const [asama, setAsama] = useState<SinavAsamasi>('BEKLEMEDE');
  const [oturumId, setOturumId] = useState<string>('');
  const [mevcutSoruIndex, setMevcutSoruIndex] = useState(0);
  const [cevaplar, setCevaplar] = useState<(number | null)[]>(Array(TOPLAM_SORU).fill(null));
  const [seciliCevap, setSeciliCevap] = useState<number | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');

  // Değişiklik 2: Skor saklanır ama öğrenciye GÖSTERILMEZ
  // Sadece uyarı (>60) ve kapanış (>=80) mantığı için kullanılır
  const [supheSkoru, setSupheSkoru] = useState(0);
  const [uyariGoster, setUyariGoster] = useState(false);

  // Değişiklik 4: Zamanlayıcı state'leri
  const [soruSuresi, setSoruSuresi] = useState(0);
  const [toplamSure, setToplamSure] = useState(0);

  const { soruBaslangiciKaydet, soruGecisKontrol } = useAnomaliTakip({
    oturumId,
    aktif: asama === 'DEVAM_EDIYOR',
  });

  // Değişiklik 2: Öğrenciye skor/durum bildirimi (skor GÖSTERİLMEZ ama mantık için alınır)
  useEffect(() => {
    if (!token || asama !== 'DEVAM_EDIYOR') return;

    const soket = socketServisi.baglan(token);

    soket.on('skor:guncellendi', (veri: { toplamSkor: number; durum: OgrenciDurum }) => {
      setSupheSkoru(veri.toplamSkor);
      setUyariGoster(veri.toplamSkor > 60);
    });

    return () => {
      soket.off('skor:guncellendi');
    };
  }, [token, asama]);

  // Değişiklik 2: Skor 80'i geçince sınavı zorla kapat
  useEffect(() => {
    if (supheSkoru >= 80 && asama === 'DEVAM_EDIYOR') {
      if (oturumId) {
        apiServisi.sinavBitir(oturumId).catch(() => {});
      }
      socketServisi.ayril();
      setAsama('IPTAL');
    }
  }, [supheSkoru, asama, oturumId]);

  // Değişiklik 4: Soru zamanlayıcısı — her yeni soruda sıfırlanır
  useEffect(() => {
    if (asama !== 'DEVAM_EDIYOR') return;
    setSoruSuresi(0);
    const interval = setInterval(() => setSoruSuresi(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [mevcutSoruIndex, asama]);

  // Değişiklik 4: Toplam sınav süresi
  useEffect(() => {
    if (asama !== 'DEVAM_EDIYOR') return;
    const interval = setInterval(() => setToplamSure(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [asama]);

  const sinaviBaslat = useCallback(async () => {
    setYukleniyor(true);
    setHata('');
    try {
      const yanit: SinavBaslatYaniti = await apiServisi.sinavBaslat();
      setOturumId(yanit.oturumId);
      setAsama('DEVAM_EDIYOR');

      if (token) {
        const soket = socketServisi.baglan(token);
        soket.emit('sinav:kayit', { oturumId: yanit.oturumId });
      }

      soruBaslangiciKaydet();
    } catch (err) {
      setHata(err instanceof Error ? err.message : 'Sınav başlatılamadı');
    } finally {
      setYukleniyor(false);
    }
  }, [token, soruBaslangiciKaydet]);

  const sonrakiSoru = useCallback(async () => {
    if (seciliCevap === null) return;

    const yeniCevaplar = [...cevaplar];
    yeniCevaplar[mevcutSoruIndex] = seciliCevap;
    setCevaplar(yeniCevaplar);

    await soruGecisKontrol(mevcutSoruIndex + 1);

    const sonSoru = mevcutSoruIndex === TOPLAM_SORU - 1;

    if (sonSoru) {
      setYukleniyor(true);
      try {
        await apiServisi.sinavBitir(oturumId);
        socketServisi.ayril();
        setAsama('TAMAMLANDI');
      } catch {
        setHata('Sınav bitirilemedi, lütfen tekrar deneyin');
      } finally {
        setYukleniyor(false);
      }
    } else {
      const yeniIndex = mevcutSoruIndex + 1;
      setMevcutSoruIndex(yeniIndex);
      setSeciliCevap(null);
      soruBaslangiciKaydet();
      await apiServisi.soruGuncelle(oturumId, yeniIndex + 1).catch(() => {});
    }
  }, [seciliCevap, cevaplar, mevcutSoruIndex, oturumId, soruGecisKontrol, soruBaslangiciKaydet]);

  const dogruSayisi = cevaplar.filter(
    (cevap, index) => cevap === SORULAR[index]?.dogruCevap
  ).length;

  if (!kullanici) {
    navigate('/giris');
    return null;
  }

  // ─── BEKLEMEDE ──────────────────────────────────────────────────────────
  if (asama === 'BEKLEMEDE') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Sınava Hoş Geldiniz</h1>
          <p className="text-gray-600 mb-1">Merhaba, <strong>{kullanici.ad}</strong></p>
          <p className="text-gray-500 text-sm mb-6">
            Bu sınav <strong>{TOPLAM_SORU} sorudan</strong> oluşmaktadır.
            Sınav süresince davranışlarınız izlenmektedir.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left text-sm">
            <p className="font-semibold text-amber-800 mb-2">⚠️ Sınav Kuralları:</p>
            <ul className="text-amber-700 space-y-1">
              <li>• Başka sekmeye geçmeyin</li>
              <li>• Kopyala-yapıştır yapmayın (Ctrl+C)</li>
              <li>• Pencereyi küçültmeyin</li>
              <li>• Her soruyu dikkatlice okuyun</li>
            </ul>
          </div>

          {hata && <p className="text-red-600 text-sm mb-4">{hata}</p>}

          <button
            onClick={sinaviBaslat}
            disabled={yukleniyor}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-lg transition-colors"
          >
            {yukleniyor ? 'Başlatılıyor...' : '🚀 Sınavı Başlat'}
          </button>

          <button onClick={cikisYap} className="mt-3 text-sm text-gray-400 hover:text-gray-600">
            Çıkış Yap
          </button>
        </div>
      </div>
    );
  }

  // ─── TAMAMLANDI ─────────────────────────────────────────────────────────
  if (asama === 'TAMAMLANDI') {
    const basariYuzdesi = Math.round((dogruSayisi / TOPLAM_SORU) * 100);
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Sınav Tamamlandı!</h1>

          <div className="bg-gray-50 rounded-xl p-5 my-5">
            <div className="text-4xl font-bold text-indigo-600 mb-1">{dogruSayisi}/{TOPLAM_SORU}</div>
            <p className="text-gray-500">Doğru Cevap</p>
            <div className="text-2xl font-semibold mt-2 text-gray-700">%{basariYuzdesi} Başarı</div>
            <div className="text-sm text-gray-400 mt-2">
              Toplam süre: {Math.floor(toplamSure / 60)}dk {toplamSure % 60}sn
            </div>
          </div>

          <button
            onClick={cikisYap}
            className="mt-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl"
          >
            Çıkış Yap
          </button>
        </div>
      </div>
    );
  }

  // ─── Değişiklik 2: IPTAL — Skor 80'i geçti, sistem kapattı ─────────────
  if (asama === 'IPTAL') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center text-white max-w-sm">
          <div className="text-7xl mb-6">👋</div>
          <h1 className="text-4xl font-bold mb-3">Güle Güle</h1>
          <p className="text-gray-400 text-lg mb-2">Sınavınız sistem tarafından sonlandırıldı.</p>
          <p className="text-gray-500 text-sm">
            Sınav süresince tespit edilen şüpheli davranışlar nedeniyle oturumunuz kapatıldı.
          </p>
          <button
            onClick={cikisYap}
            className="mt-10 px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-gray-200 font-medium transition-colors"
          >
            Çıkış Yap
          </button>
        </div>
      </div>
    );
  }

  // ─── DEVAM_EDIYOR ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Değişiklik 2: 60+ skor uyarı bandı (skor sayısı gösterilmez) */}
      {uyariGoster && (
        <div className="bg-red-600 text-white text-center py-2.5 px-4 font-semibold text-sm animate-pulse">
          ⚠️ Sınavınıza odaklanın! Şüpheli davranışlar tespit edildi.
        </div>
      )}

      {/* Üst bilgi çubuğu */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📝</span>
          <div>
            <p className="font-semibold text-gray-800 text-sm">{kullanici.ad}</p>
            <p className="text-xs text-gray-500">Sınav devam ediyor</p>
          </div>
        </div>
        {/* Değişiklik 2: Skor rozeti YOK — sadece gözetmen panelinde görünür */}
      </div>

      {/* Ana içerik */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-4">
        {hata && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {hata}
          </div>
        )}

        {/* Değişiklik 4: Timer SoruKarti'na prop olarak gönderilir */}
        <SoruKarti
          soru={SORULAR[mevcutSoruIndex]}
          soruIndex={mevcutSoruIndex}
          toplamSoru={TOPLAM_SORU}
          seciliCevap={seciliCevap}
          onCevapSec={setSeciliCevap}
          onSonrakiSoru={sonrakiSoru}
          sonSoruMu={mevcutSoruIndex === TOPLAM_SORU - 1}
          yukleniyor={yukleniyor}
          soruSuresi={soruSuresi}
          toplamSure={toplamSure}
        />
      </div>
    </div>
  );
};

export default SinavSayfasi;
