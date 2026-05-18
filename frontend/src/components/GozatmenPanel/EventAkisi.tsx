import React from 'react';
import { SinavEvent, EventTipi } from '../../types';

interface EventAkisiProps {
  eventler: Array<SinavEvent & { ogrenciAd?: string }>;
  maxGosterim?: number;
}

const EVENT_BILGI: Record<EventTipi, { icon: string; renk: string; etiket: string }> = {
  KOPYALAMA_GIRISIMI: { icon: '📋', renk: 'text-red-600 bg-red-50',    etiket: 'Kopyalama Girişimi'  },
  SEKME_DEGISIMI:     { icon: '🔄', renk: 'text-orange-600 bg-orange-50', etiket: 'Sekme Değişimi'   },
  ODAK_KAYBI:         { icon: '🪟', renk: 'text-yellow-600 bg-yellow-50', etiket: 'Odak Değişimi'    },
  MOUSE_HAREKETSIZ:   { icon: '🖱️', renk: 'text-blue-600 bg-blue-50',    etiket: 'Mouse Hareketsiz'   },
  HIZLI_GECIS:        { icon: '⚡', renk: 'text-purple-600 bg-purple-50', etiket: 'Hızlı Soru Geçişi' },
};

const EventAkisi: React.FC<EventAkisiProps> = ({ eventler, maxGosterim = 15 }) => {
  const goruntulenecek = eventler.slice(-maxGosterim).reverse();

  if (goruntulenecek.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8 text-sm">
        Henüz event kaydedilmedi
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
      {goruntulenecek.map((event) => {
        const bilgi = EVENT_BILGI[event.tip];
        const saat = new Date(event.zaman).toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        return (
          <div
            key={event.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${bilgi.renk}`}
          >
            <span className="text-base flex-shrink-0">{bilgi.icon}</span>
            <div className="flex-1 min-w-0">
              <span className="font-medium">{bilgi.etiket}</span>
              {event.ogrenciAd && (
                <span className="text-xs opacity-75 ml-1">— {event.ogrenciAd}</span>
              )}
            </div>
            <span className="text-xs opacity-60 flex-shrink-0">{saat}</span>
          </div>
        );
      })}
    </div>
  );
};

export default EventAkisi;
