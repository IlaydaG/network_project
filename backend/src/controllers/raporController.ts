// PATTERN: Request-Reply Pattern
// Rapor Controller: Gözetmen için analitik verileri sunar

import { Request, Response } from 'express';
import { kullaniciRepository } from '../repositories/kullaniciRepository';
import { skorService } from '../services/skorService';
import { aktifOgrenciler } from '../socket/socketYoneticisi';

export const raporController = {
  aktifOgrencileriListele: async (_req: Request, res: Response): Promise<void> => {
    try {
      // Bellekteki anlık durumları döndür (gerçek zamanlı)
      const liste = Array.from(aktifOgrenciler.values());
      res.status(200).json({
        basarili: true,
        veri: liste,
        toplam: liste.length,
      });
    } catch (hata) {
      res.status(500).json({ basarili: false, hata: 'Liste getirilemedi' });
    }
  },

  tumOgrencileriListele: async (_req: Request, res: Response): Promise<void> => {
    try {
      const ogrenciler = await kullaniciRepository.rolIleListele('OGRENCI');
      res.status(200).json({
        basarili: true,
        veri: ogrenciler,
        toplam: ogrenciler.length,
      });
    } catch (hata) {
      res.status(500).json({ basarili: false, hata: 'Öğrenci listesi getirilemedi' });
    }
  },

  ogrenciRaporuGetir: async (req: Request, res: Response): Promise<void> => {
    try {
      const { ogrenciId } = req.params;
      const rapor = await skorService.ogrenciRaporuGetir(ogrenciId);

      if (!rapor) {
        res.status(404).json({ basarili: false, hata: 'Rapor bulunamadı' });
        return;
      }

      res.status(200).json({ basarili: true, veri: rapor });
    } catch (hata) {
      res.status(500).json({ basarili: false, hata: 'Rapor getirilemedi' });
    }
  },

  tumSkorlariListele: async (_req: Request, res: Response): Promise<void> => {
    try {
      const skorlar = await skorService.tumOgrenciSkorlariniGetir();
      res.status(200).json({ basarili: true, veri: skorlar });
    } catch (hata) {
      res.status(500).json({ basarili: false, hata: 'Skorlar getirilemedi' });
    }
  },
};
