// PATTERN: Request-Reply Pattern + Ventilator (Pipeline)
// Sınav Controller: Sınav başlatma/bitirme ve event kabulü

import { Request, Response } from 'express';
import { oturumService } from '../services/oturumService';
import { eventKabul } from '../pipeline/ventilator';

export const sinavController = {
  baslat: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.kullaniciId) {
        res.status(401).json({ basarili: false, hata: 'Kimlik doğrulama gerekli' });
        return;
      }

      const oturum = await oturumService.sinavBaslat(req.kullaniciId);
      res.status(201).json({
        basarili: true,
        mesaj: 'Sınav başlatıldı',
        veri: {
          oturumId: oturum.id,
          baslangicZamani: oturum.baslangicZamani,
        },
      });
    } catch (hata) {
      const mesaj = hata instanceof Error ? hata.message : 'Sınav başlatılamadı';
      res.status(500).json({ basarili: false, hata: mesaj });
    }
  },

  bitir: async (req: Request, res: Response): Promise<void> => {
    try {
      const { oturumId } = req.body as { oturumId: string };
      if (!oturumId) {
        res.status(400).json({ basarili: false, hata: 'oturumId zorunludur' });
        return;
      }

      const oturum = await oturumService.sinavBitir(oturumId);
      res.status(200).json({
        basarili: true,
        mesaj: 'Sınav tamamlandı',
        veri: oturum,
      });
    } catch (hata) {
      const mesaj = hata instanceof Error ? hata.message : 'Sınav bitirilemedi';
      res.status(500).json({ basarili: false, hata: mesaj });
    }
  },

  soruGuncelle: async (req: Request, res: Response): Promise<void> => {
    try {
      const { oturumId, soruNo } = req.body as { oturumId: string; soruNo: number };
      await oturumService.soruGuncelle(oturumId, soruNo);
      res.status(200).json({ basarili: true });
    } catch (hata) {
      res.status(500).json({ basarili: false, hata: 'Soru güncellenemedi' });
    }
  },

  // PATTERN: Ventilator - Event kabulü pipeline'ı başlatır
  eventGonder: eventKabul,
};
