import React from 'react';
import { OgrenciDurumu, OgrenciDurum } from '../../types';

interface OgrenciKartProps {
  ogrenci: OgrenciDurumu;
}

const DURUM_STILLER: Record<OgrenciDurum, {
  kart: string; rozet: string; cubuk: string; etiket: string;
}> = {
  NORMAL:     { kart: 'border-green-200 bg-green-50',   rozet: 'bg-green-100 text-green-700',   cubuk: 'bg-green-500',  etiket: '✅ Normal'      },
  DIKKAT:     { kart: 'border-yellow-200 bg-yellow-50', rozet: 'bg-yellow-100 text-yellow-700', cubuk: 'bg-yellow-500', etiket: '⚠️ Dikkat'      },
  SUPHELI:    { kart: 'border-red-200 bg-red-50',       rozet: 'bg-red-100 text-red-700',       cubuk: 'bg-red-500',    etiket: '🚨 Şüpheli'     },
  // Değişiklik 1: Tamamlanan öğrenci gri tonlarda kalır, silinmez
  TAMAMLANDI: { kart: 'border-gray-200 bg-gray-50',     rozet: 'bg-gray-100 text-gray-500',     cubuk: 'bg-gray-400',   etiket: '🏁 Tamamlandı'  },
};

const zamaniBicimle = (tarihStr: string | Date | undefined): string => {
  if (!tarihStr) return '—';
  return new Date(tarihStr).toLocaleTimeString('tr-TR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
};

const OgrenciKart: React.FC<OgrenciKartProps> = ({ ogrenci }) => {
  const stil = DURUM_STILLER[ogrenci.durum];
  const doluluk = Math.min((ogrenci.toplamSkor / 100) * 100, 100);
  const tamamlandi = ogrenci.durum === 'TAMAMLANDI';

  return (
    <div className={`border-2 rounded-xl p-4 transition-all duration-300 ${stil.kart} ${tamamlandi ? 'opacity-75' : ''}`}>
      {/* Başlık */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-gray-800">{ogrenci.kullanici.ad}</h3>
          <p className="text-xs text-gray-500">{ogrenci.kullanici.email}</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${stil.rozet}`}>
          {stil.etiket}
        </span>
      </div>

      {/* Şüphe skoru çubuğu */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-600">Şüphe Skoru</span>
          <span className="font-bold text-gray-800">{ogrenci.toplamSkor} puan</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${stil.cubuk}`}
            style={{ width: `${doluluk}%` }}
          />
        </div>
      </div>

      {/* Soru + zaman bilgisi */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="bg-white/70 rounded-lg p-2 text-center">
          <div className={`font-bold text-base ${tamamlandi ? 'text-gray-500' : 'text-indigo-700'}`}>
            {tamamlandi ? '✓ Bitti' : `${ogrenci.mevcutSoru}/10`}
          </div>
          <div className="text-gray-500">{tamamlandi ? 'Tamamlandı' : 'Mevcut Soru'}</div>
        </div>
        <div className="bg-white/70 rounded-lg p-2 text-center">
          {tamamlandi && ogrenci.oturum.bitisZamani ? (
            <>
              <div className="font-bold text-gray-700 text-sm">
                {zamaniBicimle(ogrenci.oturum.bitisZamani)}
              </div>
              <div className="text-gray-500">Bitiş</div>
            </>
          ) : (
            <>
              <div className="font-bold text-gray-700 text-sm">
                {zamaniBicimle(ogrenci.oturum.baslangicZamani)}
              </div>
              <div className="text-gray-500">Başlangıç</div>
            </>
          )}
        </div>
      </div>

      {/* Event sayaçları */}
      <div className="grid grid-cols-5 gap-1 text-center">
        <EventBadge icon="📋" sayi={ogrenci.eventSayilari.kopyalama}      etiket="Kopya"   tehlikeli={ogrenci.eventSayilari.kopyalama > 0} />
        <EventBadge icon="🔄" sayi={ogrenci.eventSayilari.sekmeDegisimi}  etiket="Sekme"   tehlikeli={ogrenci.eventSayilari.sekmeDegisimi > 0} />
        <EventBadge icon="🪟" sayi={ogrenci.eventSayilari.odakKaybi}      etiket="Odak"    tehlikeli={ogrenci.eventSayilari.odakKaybi > 0} />
        <EventBadge icon="🖱️" sayi={ogrenci.eventSayilari.mouseHareketsiz} etiket="Mouse"  tehlikeli={false} />
        <EventBadge icon="⚡" sayi={ogrenci.eventSayilari.hizliGecis}     etiket="Hızlı"   tehlikeli={ogrenci.eventSayilari.hizliGecis > 2} />
      </div>
    </div>
  );
};

const EventBadge: React.FC<{
  icon: string; sayi: number; etiket: string; tehlikeli: boolean;
}> = ({ icon, sayi, etiket, tehlikeli }) => (
  <div className={`rounded-lg p-1.5 ${tehlikeli && sayi > 0 ? 'bg-red-100' : 'bg-white/60'}`}>
    <div className="text-base">{icon}</div>
    <div className={`text-sm font-bold ${tehlikeli && sayi > 0 ? 'text-red-700' : 'text-gray-700'}`}>
      {sayi}
    </div>
    <div className="text-gray-400 text-[10px] leading-tight">{etiket}</div>
  </div>
);

export default OgrenciKart;
