// PATTERN: Publish-Subscribe Pattern (Subscribe tarafı)
// Gözetmen Paneli: Öğrenci eventlerini gerçek zamanlı olarak alır.
// PATTERN: Multicast - Tüm gözetmenler aynı anda aynı eventleri görür.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { socketServisi } from '../services/socketServisi';
import { apiServisi } from '../services/apiServisi';
import OgrenciKart from '../components/GozatmenPanel/OgrenciKart';
import EventAkisi from '../components/GozatmenPanel/EventAkisi';
import { OgrenciDurumu, SinavEvent } from '../types';

const GozatmenPaneli: React.FC = () => {
  const { kullanici, token, cikisYap } = useAuth();
  const navigate = useNavigate();

  const [ogrenciler, setOgrenciler] = useState<Map<string, OgrenciDurumu>>(new Map());
  const [sonEventler, setSonEventler] = useState<Array<SinavEvent & { ogrenciAd?: string }>>([]);
  const [bagliMi, setBagliMi] = useState(false);

  useEffect(() => {
    if (!kullanici) { navigate('/giris'); return; }
    if (kullanici.rol !== 'GOZATMEN') { navigate('/sinav'); return; }
  }, [kullanici, navigate]);

  const istatistik = React.useMemo(() => {
    const liste = Array.from(ogrenciler.values());
    return {
      toplam: liste.length,
      tamamlandi: liste.filter(o => o.durum === 'TAMAMLANDI').length,
      supheli: liste.filter(o => o.durum === 'SUPHELI').length,
      dikkat: liste.filter(o => o.durum === 'DIKKAT').length,
    };
  }, [ogrenciler]);

  useEffect(() => {
    if (!token) return;

    const soket = socketServisi.baglan(token);

    soket.on('connect', () => setBagliMi(true));
    soket.on('disconnect', () => setBagliMi(false));

    // Bağlanınca mevcut tüm öğrenciler (aktif + tamamlanmış)
    soket.on('ogrenciler:liste', (liste: OgrenciDurumu[]) => {
      const yeniMap = new Map<string, OgrenciDurumu>();
      for (const o of liste) yeniMap.set(o.oturum.id, o);
      setOgrenciler(yeniMap);
    });

    // Yeni öğrenci sınava girdi
    soket.on('ogrenci:baglandi', (ogrenci: OgrenciDurumu) => {
      setOgrenciler(prev => new Map(prev).set(ogrenci.oturum.id, ogrenci));
    });

    // Öğrenci durumu güncellendi (skor, event sayıları, soru no)
    soket.on('ogrenci:guncellendi', (ogrenci: OgrenciDurumu) => {
      setOgrenciler(prev => new Map(prev).set(ogrenci.oturum.id, ogrenci));
    });

    // Değişiklik 1: Sınav tamamlandı → SILME, map'te TAMAMLANDI olarak tut
    soket.on('ogrenci:tamamlandi', (ogrenci: OgrenciDurumu) => {
      setOgrenciler(prev => new Map(prev).set(ogrenci.oturum.id, ogrenci));
    });

    // Değişiklik 3: event:islendi artık ogrenciAd içeriyor (backend'den geliyor)
    soket.on('event:islendi', (veri: {
      oturumId: string;
      event: SinavEvent;
      puan: number;
      yeniSkor: number;
      durum: string;
      ogrenciAd: string;  // Backend'den gelen isim
    }) => {
      const eventBilgi = {
        ...veri.event,
        ogrenciAd: veri.ogrenciAd,  // Artık arama yapmaya gerek yok
      };
      setSonEventler(prev => [...prev.slice(-49), eventBilgi]);
    });

    // İlk yükleme: REST API ile aktif öğrenci listesi
    apiServisi.aktifOgrencileriGetir().then(liste => {
      setOgrenciler(prev => {
        const yeni = new Map(prev);
        for (const o of liste) yeni.set(o.oturum.id, o);
        return yeni;
      });
    }).catch(() => {});

    return () => {
      soket.off('connect');
      soket.off('disconnect');
      soket.off('ogrenciler:liste');
      soket.off('ogrenci:baglandi');
      soket.off('ogrenci:guncellendi');
      soket.off('ogrenci:tamamlandi');
      soket.off('event:islendi');
    };
  }, [token]);

  // Önce aktif olanlar, sonra tamamlananlar; kendi içinde skora göre azalan
  const ogrenciListesi = Array.from(ogrenciler.values()).sort((a, b) => {
    if (a.durum === 'TAMAMLANDI' && b.durum !== 'TAMAMLANDI') return 1;
    if (a.durum !== 'TAMAMLANDI' && b.durum === 'TAMAMLANDI') return -1;
    return b.toplamSkor - a.toplamSkor;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Üst bilgi çubuğu */}
      <div className="bg-white shadow-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👨‍🏫</span>
          <div>
            <h1 className="font-bold text-gray-800">Gözetmen Paneli</h1>
            <p className="text-xs text-gray-500">{kullanici?.ad}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${bagliMi ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">{bagliMi ? 'Canlı' : 'Bağlantı Kesik'}</span>
          </div>
          <button onClick={cikisYap} className="text-sm text-gray-500 hover:text-gray-700">
            Çıkış Yap
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* İstatistik kartları */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center border-t-4 border-blue-400">
            <div className="text-3xl font-bold text-blue-600">{istatistik.toplam}</div>
            <div className="text-sm text-gray-500 mt-1">Toplam Öğrenci</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center border-t-4 border-green-400">
            <div className="text-3xl font-bold text-green-600">{istatistik.tamamlandi}</div>
            <div className="text-sm text-gray-500 mt-1">Tamamlandı</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center border-t-4 border-yellow-400">
            <div className="text-3xl font-bold text-yellow-600">{istatistik.dikkat}</div>
            <div className="text-sm text-gray-500 mt-1">Dikkat Durumu</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center border-t-4 border-red-400">
            <div className="text-3xl font-bold text-red-600">{istatistik.supheli}</div>
            <div className="text-sm text-gray-500 mt-1">Şüpheli</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Öğrenci listesi */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>👥</span> Tüm Öğrenciler
                <span className="text-sm font-normal text-gray-400 ml-auto">
                  Aktif → Şüphe skoru sırası | Tamamlananlar alta
                </span>
              </h2>

              {ogrenciListesi.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <div className="text-5xl mb-3">📭</div>
                  <p>Henüz öğrenci yok</p>
                  <p className="text-sm mt-1">Öğrenciler sınava girdiğinde burada görünecek</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ogrenciListesi.map((ogrenci) => (
                    <OgrenciKart key={ogrenci.oturum.id} ogrenci={ogrenci} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sağ sütun */}
          <div className="space-y-4">
            {/* Canlı event akışı */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>⚡</span> Canlı Event Akışı
                {sonEventler.length > 0 && (
                  <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    {sonEventler.length}
                  </span>
                )}
              </h2>
              {/* Değişiklik 3: ogrenciAd backend'den geliyor, EventAkisi içinde görünür */}
              <EventAkisi eventler={sonEventler} />
            </div>

            {/* Skor tablosu */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>🚨</span> Şüphe Sıralaması
                <span className="ml-auto text-xs font-normal text-gray-400">↑ En şüpheli</span>
              </h2>
              {ogrenciListesi.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">Veri yok</p>
              ) : (
                <div className="space-y-2">
                  {ogrenciListesi.slice(0, 6).map((o, idx) => (
                    <div key={o.oturum.id} className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400 w-4">{idx + 1}.</span>
                      <span className="flex-1 truncate font-medium text-gray-700">
                        {o.kullanici.ad}
                        {o.durum === 'TAMAMLANDI' && (
                          <span className="ml-1 text-xs text-gray-400">✓</span>
                        )}
                      </span>
                      <span className={`font-bold px-2 py-0.5 rounded text-xs
                        ${o.durum === 'NORMAL'     ? 'bg-green-100 text-green-700'  : ''}
                        ${o.durum === 'DIKKAT'     ? 'bg-yellow-100 text-yellow-700': ''}
                        ${o.durum === 'SUPHELI'    ? 'bg-red-100 text-red-700'      : ''}
                        ${o.durum === 'TAMAMLANDI' ? 'bg-gray-100 text-gray-600'    : ''}
                      `}>
                        {o.toplamSkor}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GozatmenPaneli;
