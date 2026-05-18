// PATTERN: Ventilator-Worker-Sink (Pipeline Pattern)
// Ventilator: /api/events REST endpoint üzerinden gelen olayları kuyruğa ekler.
// "Kapı" görevi görür - dışarıdan gelen istekleri iç pipeline'a bağlar.

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { eventKuyrugu } from './kuyruk';
import { EventYuku, SinavEvent } from '../types';
import { oturumRepository } from '../repositories/oturumRepository';

export const eventKabul = async (req: Request, res: Response): Promise<void> => {
  const { oturumId, tip, veri } = req.body as EventYuku;

  // Oturumun geçerliliğini doğrula
  const oturum = await oturumRepository.idIleAra(oturumId);
  if (!oturum || !oturum.aktif) {
    res.status(404).json({ basarili: false, hata: 'Aktif oturum bulunamadı' });
    return;
  }

  const event: SinavEvent = {
    id: uuidv4(),
    oturumId,
    tip,
    zaman: new Date(),
    veri: veri ?? {},
  };

  // Kuyruğa ekle - Worker bu noktadan itibaren işleyecek
  await eventKuyrugu.ekle(event);

  // 202 Accepted: İstek alındı, işlem asenkron devam ediyor
  res.status(202).json({
    basarili: true,
    mesaj: 'Event kuyruğa alındı',
    eventId: event.id,
  });
};
