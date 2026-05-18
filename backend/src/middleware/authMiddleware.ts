// PATTERN: Request-Reply Pattern
// JWT kimlik doğrulama middleware - yetkisiz erişimi engeller

import { Request, Response, NextFunction } from 'express';
import { tokenDogrula } from '../config/jwt';
import { JwtYuku, Rol } from '../types';

// Express Request'e kullaniciId ve rol ekliyoruz
declare global {
  namespace Express {
    interface Request {
      kullaniciId?: string;
      kullaniciRol?: Rol;
    }
  }
}

export const tokenDogrulama = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ basarili: false, hata: 'Yetkilendirme token\'ı eksik' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const yuk: JwtYuku = tokenDogrula(token);
    req.kullaniciId = yuk.kullaniciId;
    req.kullaniciRol = yuk.rol;
    next();
  } catch {
    res.status(401).json({ basarili: false, hata: 'Geçersiz veya süresi dolmuş token' });
  }
};

// Sadece belirli rollere erişim
export const rolKontrol = (...izinliRoller: Rol[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.kullaniciRol || !izinliRoller.includes(req.kullaniciRol)) {
      res.status(403).json({
        basarili: false,
        hata: `Bu işlem için yetkiniz yok. Gerekli rol: ${izinliRoller.join(' veya ')}`,
      });
      return;
    }
    next();
  };
};
