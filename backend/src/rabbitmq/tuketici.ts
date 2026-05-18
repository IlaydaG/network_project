// Consumer: sinav.eventler kuyruğunu dinler, her mesajı isleyici'ye iletir.
// Manual ACK modu: hata olursa mesaj DLQ'ya gönderilir, kaybolmaz.

import { kanalOlustur } from './baglanti';
import { SINAV_EVENTLERI_KUYRUGU, SINAV_EVENTLERI_DLQ, SINAV_DLX } from './kuyrukAdlari';
import { SinavEvent } from '../types';

// Aynı anda kaçtan fazla işlenmemiş mesaj tutabileceği (backpressure kontrolü)
const PREFETCH_SAYISI = 10;

export const tuketiciBaslat = async (
  isleyici: (event: SinavEvent) => Promise<void>
): Promise<void> => {
  const kanal = await kanalOlustur();

  // Producer ile aynı parametrelerle assert — idempotent, zaten varsa sorun olmaz
  await kanal.assertExchange(SINAV_DLX, 'direct', { durable: true });
  await kanal.assertQueue(SINAV_EVENTLERI_DLQ, { durable: true });
  await kanal.bindQueue(SINAV_EVENTLERI_DLQ, SINAV_DLX, 'dlq');
  await kanal.assertQueue(SINAV_EVENTLERI_KUYRUGU, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange':    SINAV_DLX,
      'x-dead-letter-routing-key': 'dlq',
    },
  });

  // Consumer, aynı anda en fazla PREFETCH_SAYISI kadar onaysız mesaj alır
  await kanal.prefetch(PREFETCH_SAYISI);

  await kanal.consume(
    SINAV_EVENTLERI_KUYRUGU,
    async (msg) => {
      if (!msg) return; // Consumer iptal edildi

      // 1. Mesajı parse et — hata varsa DLQ'ya gönder (retry yaramaz)
      let event: SinavEvent;
      try {
        event = JSON.parse(msg.content.toString()) as SinavEvent;
      } catch {
        console.error('[TÜKETİCİ] Parse hatası → DLQ:', msg.content.toString().slice(0, 100));
        kanal.nack(msg, false, false); // requeue=false → DLQ
        return;
      }

      // 2. İşle — hata varsa DLQ'ya gönder
      try {
        await isleyici(event);
        kanal.ack(msg); // Başarılı → onayla, kuyruktan çıkar
      } catch (hata) {
        console.error('[TÜKETİCİ] İşleme hatası → DLQ:', (hata as Error).message, '| Event:', event.id);
        kanal.nack(msg, false, false); // requeue=false → DLQ
      }
    },
    { noAck: false } // Manuel ACK modu — otomatik silinmez
  );

  console.log(`[TÜKETİCİ] Dinleniyor → ${SINAV_EVENTLERI_KUYRUGU} | prefetch=${PREFETCH_SAYISI}`);
};
