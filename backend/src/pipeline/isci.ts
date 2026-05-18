// PATTERN: Ventilator-Worker-Sink (Pipeline Pattern)
// Worker (İşçi): Kuyruktan gelen olayları işler, temel puanı belirler.
//
// Mod seçimi (RABBITMQ_URL env'e göre otomatik):
//   RABBITMQ_URL varsa  → RabbitMQ consumer olarak başlar
//   RABBITMQ_URL yoksa  → EventEmitter listener olarak çalışır (local dev)

import { eventKuyrugu } from './kuyruk';
import { havuzaGonder } from './havuz';
import { SinavEvent, EventTipi } from '../types';

const SKOR_TABLOSU: Record<EventTipi, number> = {
  KOPYALAMA_GIRISIMI: 40,
  SEKME_DEGISIMI:     40,
  ODAK_KAYBI:   35,
  MOUSE_HAREKETSIZ:   15,
  HIZLI_GECIS:        15,
};

// Hem RabbitMQ consumer hem de EventEmitter listener tarafından çağrılır
export const eventIsleme = async (event: SinavEvent): Promise<void> => {
  const temelSkor = SKOR_TABLOSU[event.tip] ?? 0;
  console.log(`[İŞÇİ] İşleniyor: ${event.tip} | Temel puan: ${temelSkor}`);
  await havuzaGonder(event, temelSkor);
};

export const isciBaslat = async (): Promise<void> => {
  if (process.env.RABBITMQ_URL) {
    // RabbitMQ modu: consumer kuyruğu dinler, manuel ACK ile event kaybı önlenir
    const { tuketiciBaslat } = await import('../rabbitmq/tuketici');
    await tuketiciBaslat(eventIsleme);
    console.log('[İŞÇİ] RabbitMQ consumer başlatıldı');
  } else {
    // Bellek modu: EventEmitter fallback
    eventKuyrugu.on('yeniEvent', async (event: SinavEvent) => {
      try {
        await eventIsleme(event);
      } catch (hata) {
        console.error('[İŞÇİ] Event işlenirken hata:', hata);
      }
    });
    console.log('[İŞÇİ] Bellek kuyruğu dinleniyor (RabbitMQ devre dışı)');
  }
};
