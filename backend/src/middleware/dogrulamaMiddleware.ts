import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const dogrulamaHatalariniKontrolEt = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const hatalar = validationResult(req);
  if (!hatalar.isEmpty()) {
    res.status(400).json({
      basarili: false,
      hata: 'Doğrulama hatası',
      hatalar: hatalar.array(),
    });
    return;
  }
  next();
};

export const kayitKurallari = [
  body('ad').trim().notEmpty().withMessage('Ad zorunludur').isLength({ min: 2, max: 100 }),
  body('email').isEmail().withMessage('Geçerli bir e-posta adresi girin').normalizeEmail(),
  body('sifre').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalıdır'),
  body('rol').isIn(['OGRENCI', 'GOZATMEN']).withMessage('Geçersiz rol'),
  dogrulamaHatalariniKontrolEt,
];

export const girisKurallari = [
  body('email').isEmail().withMessage('Geçerli bir e-posta adresi girin').normalizeEmail(),
  body('sifre').notEmpty().withMessage('Şifre zorunludur'),
  dogrulamaHatalariniKontrolEt,
];

export const eventKurallari = [
  body('oturumId').notEmpty().withMessage('oturumId zorunludur'),
  body('tip')
    .isIn(['KOPYALAMA_GIRISIMI', 'SEKME_DEGISIMI', 'ODAK_KAYBI', 'MOUSE_HAREKETSIZ', 'HIZLI_GECIS'])
    .withMessage('Geçersiz event tipi'),
  dogrulamaHatalariniKontrolEt,
];
