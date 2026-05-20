// PATTERN: Ventilator-Worker-Sink (Pipeline Pattern)
// Worker (İşçi): RabbitMQ'dan gelen olayları işler, temel puanı belirler.

import { havuzaGonder } from './havuz';
import { SinavEvent, EventTipi } from '../types';

const SKOR_TABLOSU: Record<EventTipi, number> = {
  KOPYALAMA_GIRISIMI: 40,
  SEKME_DEGISIMI:     40,
  ODAK_KAYBI:         35,
  MOUSE_HAREKETSIZ:   15,
  HIZLI_GECIS:        15,
};

export const eventIsleme = async (event: SinavEvent): Promise<void> => {
  const temelSkor = SKOR_TABLOSU[event.tip] ?? 0;
  console.log(`[İŞÇİ] İşleniyor: ${event.tip} | Temel puan: ${temelSkor}`);
  await havuzaGonder(event, temelSkor);
};

export const isciBaslat = async (): Promise<void> => {
  const { tuketiciBaslat } = await import('../rabbitmq/tuketici');
  await tuketiciBaslat(eventIsleme);
  console.log('[İŞÇİ] RabbitMQ consumer başlatıldı');
};
