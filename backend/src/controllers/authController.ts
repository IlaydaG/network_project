// PATTERN: Request-Reply Pattern
// Auth Controller: HTTP istek/yanıt döngüsünü yönetir

import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { KayitIstegi, GirisIstegi } from '../types';

export const authController = {
  kayitOl: async (req: Request, res: Response): Promise<void> => {
    try {
      const veri = req.body as KayitIstegi;
      const sonuc = await authService.kayitOl(veri);
      res.status(201).json({
        basarili: true,
        mesaj: 'Kayıt başarılı',
        veri: sonuc,
      });
    } catch (hata) {
      const mesaj = hata instanceof Error ? hata.message : 'Kayıt işlemi başarısız';
      res.status(400).json({ basarili: false, hata: mesaj });
    }
  },

  girisYap: async (req: Request, res: Response): Promise<void> => {
    try {
      const veri = req.body as GirisIstegi;
      const sonuc = await authService.girisYap(veri);
      res.status(200).json({
        basarili: true,
        mesaj: 'Giriş başarılı',
        veri: sonuc,
      });
    } catch (hata) {
      const mesaj = hata instanceof Error ? hata.message : 'Giriş işlemi başarısız';
      res.status(401).json({ basarili: false, hata: mesaj });
    }
  },

  benimBilgilerim: async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json({
        basarili: true,
        veri: {
          kullaniciId: req.kullaniciId,
          rol: req.kullaniciRol,
        },
      });
    } catch (hata) {
      res.status(500).json({ basarili: false, hata: 'Sunucu hatası' });
    }
  },
};
