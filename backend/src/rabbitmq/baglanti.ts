import amqp, { Channel } from 'amqplib';

// amqplib 0.10+ → connect() ChannelModel döndürür (createChannel/close buradadır)
type AmqpBaglanti = Awaited<ReturnType<typeof amqp.connect>>;

let _baglanti: AmqpBaglanti | null = null;

const RABBITMQ_URL      = process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';
const YENIDEN_DENEME_MS = 5000;

// Bağlantıyı kur, hata/kapanma durumunda otomatik yeniden bağlan
export const rabbitmqBaslat = async (): Promise<void> => {
  try {
    _baglanti = await amqp.connect(RABBITMQ_URL);

    _baglanti.on('error', (err: Error) => {
      console.error('[RabbitMQ] Bağlantı hatası:', err.message);
    });

    _baglanti.on('close', () => {
      console.warn('[RabbitMQ] Bağlantı kapandı, yeniden bağlanılıyor...');
      _baglanti = null;
      setTimeout(() => rabbitmqBaslat(), YENIDEN_DENEME_MS);
    });

    console.log('[RabbitMQ] Bağlantı kuruldu →', RABBITMQ_URL);
  } catch (hata) {
    console.error('[RabbitMQ] Başlatma hatası:', (hata as Error).message);
    console.log(`[RabbitMQ] ${YENIDEN_DENEME_MS / 1000}s sonra yeniden deneniyor...`);
    setTimeout(() => rabbitmqBaslat(), YENIDEN_DENEME_MS);
  }
};

// Her modül kendi kanalını açar (producer ve consumer için ayrı kanal)
export const kanalOlustur = async (): Promise<Channel> => {
  if (!_baglanti) throw new Error('[RabbitMQ] Bağlantı henüz kurulmadı');
  return _baglanti.createChannel();
};

export const rabbitmqKapat = async (): Promise<void> => {
  if (_baglanti) {
    try { await _baglanti.close(); } catch { /* yoksay */ }
    _baglanti = null;
  }
};
