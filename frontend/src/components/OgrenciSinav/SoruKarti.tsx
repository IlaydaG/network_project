import React from 'react';
import { Soru } from '../../types';

interface SoruKartiProps {
  soru: Soru;
  soruIndex: number;
  toplamSoru: number;
  seciliCevap: number | null;
  onCevapSec: (cevapIndex: number) => void;
  onSonrakiSoru: () => void;
  sonSoruMu: boolean;
  yukleniyor: boolean;
  // Değişiklik 4: zamanlayıcı props
  soruSuresi: number;   // Bu soruda geçen saniye
  toplamSure: number;   // Toplam sınav süresi (saniye)
}

const sureFormatla = (saniye: number): string => {
  const dk = Math.floor(saniye / 60);
  const sn = saniye % 60;
  return `${String(dk).padStart(2, '0')}:${String(sn).padStart(2, '0')}`;
};

const SoruKarti: React.FC<SoruKartiProps> = ({
  soru,
  soruIndex,
  toplamSoru,
  seciliCevap,
  onCevapSec,
  onSonrakiSoru,
  sonSoruMu,
  yukleniyor,
  soruSuresi,
  toplamSure,
}) => {
  const ilerlemeOrani = (soruIndex / toplamSoru) * 100;

  // Soru süresi rengini belirle
  const soruSureRengi =
    soruSuresi < 30  ? 'text-green-600 bg-green-50 border-green-200' :
    soruSuresi < 90  ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
                       'text-red-600 bg-red-50 border-red-200';

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* İlerleme çubuğu */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-500 mb-1.5">
          <span>Soru {soruIndex + 1} / {toplamSoru}</span>
          <span>%{Math.round(ilerlemeOrani)} tamamlandı</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${ilerlemeOrani}%` }}
          />
        </div>
      </div>

      {/* Değişiklik 4: Zamanlayıcılar — soruların üstünde */}
      <div className="flex gap-3 mb-5">
        <div className={`flex-1 flex items-center justify-center gap-2 border rounded-xl py-2 px-3 ${soruSureRengi}`}>
          <span className="text-lg">⏱️</span>
          <div className="text-center">
            <div className="font-mono font-bold text-lg leading-none">{sureFormatla(soruSuresi)}</div>
            <div className="text-xs opacity-70 mt-0.5">Bu soru</div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center gap-2 border border-gray-200 bg-gray-50 rounded-xl py-2 px-3 text-gray-600">
          <span className="text-lg">🕐</span>
          <div className="text-center">
            <div className="font-mono font-bold text-lg leading-none">{sureFormatla(toplamSure)}</div>
            <div className="text-xs opacity-70 mt-0.5">Toplam süre</div>
          </div>
        </div>
      </div>

      {/* Soru metni */}
      <h2 className="text-lg font-semibold text-gray-800 mb-5 leading-relaxed">
        {soru.soru}
      </h2>

      {/* Seçenekler */}
      <div className="space-y-3 mb-6">
        {soru.secenekler.map((secenek, index) => {
          const secili = seciliCevap === index;
          return (
            <button
              key={index}
              onClick={() => onCevapSec(index)}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-150 font-medium
                ${secili
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                  : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-gray-700'
                }`}
            >
              {secenek}
            </button>
          );
        })}
      </div>

      {/* Sonraki / Bitir */}
      <button
        onClick={onSonrakiSoru}
        disabled={seciliCevap === null || yukleniyor}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors duration-200"
      >
        {yukleniyor ? 'İşleniyor...' : sonSoruMu ? '✅ Sınavı Bitir' : 'Sonraki Soru →'}
      </button>

      {seciliCevap === null && (
        <p className="text-center text-xs text-gray-400 mt-2">Devam etmek için bir seçenek seçin</p>
      )}
    </div>
  );
};

export default SoruKarti;
