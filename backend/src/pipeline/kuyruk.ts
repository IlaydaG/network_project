// PATTERN: Ventilator-Worker-Sink (Pipeline Pattern)
// Queue (Kuyruk): Olayları RabbitMQ'ya iletir.

import { SinavEvent } from '../types';

class EventKuyrugu {
  async ekle(event: SinavEvent): Promise<void> {
    const { eventYayinla } = await import('../rabbitmq/uretici');
    await eventYayinla(event);
  }
}

export const eventKuyrugu = new EventKuyrugu();
