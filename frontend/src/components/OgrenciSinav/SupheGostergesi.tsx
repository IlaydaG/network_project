import React from 'react';
import { OgrenciDurum } from '../../types';

interface SupheGostergesiProps {
  skor: number;
  durum: OgrenciDurum;
}

const DURUM_RENK: Record<OgrenciDurum, { bg: string; text: string; border: string; emoji: string; etiket: string }> = {
  NORMAL:     { bg: 'bg-green-50',  text: 'text-green-800',  border: 'border-green-300',  emoji: '✅', etiket: 'Normal'      },
  DIKKAT:     { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-300', emoji: '⚠️', etiket: 'Dikkat'      },
  SUPHELI:    { bg: 'bg-red-50',    text: 'text-red-800',    border: 'border-red-300',    emoji: '🚨', etiket: 'Şüpheli'     },
  TAMAMLANDI: { bg: 'bg-gray-50',   text: 'text-gray-600',   border: 'border-gray-300',   emoji: '🏁', etiket: 'Tamamlandı'  },
};

const SupheGostergesi: React.FC<SupheGostergesiProps> = ({ skor, durum }) => {
  const renk = DURUM_RENK[durum];
  const dolulukOrani = Math.min((skor / 100) * 100, 100);

  const cubukRengi =
    durum === 'NORMAL' ? 'bg-green-500' :
    durum === 'DIKKAT' ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className={`rounded-xl border-2 ${renk.border} ${renk.bg} p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`font-semibold text-sm ${renk.text}`}>
          {renk.emoji} Şüphe Durumu: <strong>{renk.etiket}</strong>
        </span>
        <span className={`text-lg font-bold ${renk.text}`}>{skor} puan</span>
      </div>

      {/* İlerleme çubuğu */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${cubukRengi}`}
          style={{ width: `${dolulukOrani}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>0 - Normal</span>
        <span>30 - Dikkat</span>
        <span>60+ - Şüpheli</span>
      </div>
    </div>
  );
};

export default SupheGostergesi;
