// PATTERN: Ventilator-Worker-Sink (Pipeline Pattern)
// Queue (Kuyruk): Olayları tamponlar ve işçilere iletmek için bekletir.
//
// Mod seçimi (RABBITMQ_URL env'e göre otomatik):
//   RABBITMQ_URL varsa  → ekle() mesajı RabbitMQ'ya yayınlar (production)
//   RABBITMQ_URL yoksa  → ekle() EventEmitter ile in-memory çalışır (local dev)

import { EventEmitter } from 'events';
import { SinavEvent } from '../types';

class EventKuyrugu extends EventEmitter {
  private kuyruk: SinavEvent[] = [];

  async ekle(event: SinavEvent): Promise<void> {
    if (process.env.RABBITMQ_URL) {
      // RabbitMQ modu: durable kuyruğa yayınla
      const { eventYayinla } = await import('../rabbitmq/uretici');
      await eventYayinla(event);
    } else {
      // Bellek modu: EventEmitter fallback (RABBITMQ_URL olmadan çalışır)
      this.kuyruk.push(event);
      this.emit('yeniEvent', event);
      console.log(`[KUYRUK] Event eklendi: ${event.tip} | Boyut: ${this.kuyruk.length}`);
    }
  }

  al(): SinavEvent | undefined {
    return this.kuyruk.shift();
  }

  boyut(): number {
    return this.kuyruk.length;
  }

  durumu(): { boyut: number } {
    return { boyut: this.kuyruk.length };
  }
}

export const eventKuyrugu = new EventKuyrugu();
