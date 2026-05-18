// Producer: SinavEvent'i durable kuyruğa yayınlar.
// Persistent mesajlar RabbitMQ yeniden başlasa bile kaybolmaz.

import { Channel } from 'amqplib';
import { kanalOlustur } from './baglanti';
import { SINAV_EVENTLERI_KUYRUGU, SINAV_EVENTLERI_DLQ, SINAV_DLX } from './kuyrukAdlari';
import { SinavEvent } from '../types';

let ureticiKanali: Channel | null = null;

// İlk çağrıda kanal + kuyruk tanımlamalarını yapar, sonraki çağrılarda önbellekten döner
const kanalHazirla = async (): Promise<Channel> => {
  if (ureticiKanali) return ureticiKanali;

  const kanal = await kanalOlustur();

  // Dead Letter Exchange — başarısız mesajlar buraya düşer
  await kanal.assertExchange(SINAV_DLX, 'direct', { durable: true });

  // Dead Letter Queue
  await kanal.assertQueue(SINAV_EVENTLERI_DLQ, { durable: true });
  await kanal.bindQueue(SINAV_EVENTLERI_DLQ, SINAV_DLX, 'dlq');

  // Ana kuyruk: durable (broker yeniden başlasa da kalır) + DLX yönlendirmesi
  await kanal.assertQueue(SINAV_EVENTLERI_KUYRUGU, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange':    SINAV_DLX,
      'x-dead-letter-routing-key': 'dlq',
    },
  });

  kanal.on('error', (err: Error) => {
    console.error('[ÜRETİCİ] Kanal hatası:', err.message);
    ureticiKanali = null;
  });
  kanal.on('close', () => {
    console.warn('[ÜRETİCİ] Kanal kapandı');
    ureticiKanali = null;
  });

  ureticiKanali = kanal;
  return kanal;
};

export const eventYayinla = async (event: SinavEvent): Promise<void> => {
  const kanal  = await kanalHazirla();
  const mesaj  = Buffer.from(JSON.stringify(event));

  // persistent:true → mesaj diske yazılır, broker restart'ta kaybolmaz
  const basarili = kanal.sendToQueue(
    SINAV_EVENTLERI_KUYRUGU,
    mesaj,
    {
      persistent:   true,
      contentType:  'application/json',
      timestamp:    Date.now(),
      messageId:    event.id,
    }
  );

  if (!basarili) {
    // Kanal tamponu doldu — backpressure sinyali
    throw new Error(`[ÜRETİCİ] Gönderim başarısız (kanal tamponu dolu): ${event.id}`);
  }

  console.log(`[ÜRETİCİ] Yayınlandı → ${SINAV_EVENTLERI_KUYRUGU} | ${event.tip} | ${event.id}`);
};
