import { Router } from 'express';
import { raporController } from '../controllers/raporController';
import { tokenDogrulama, rolKontrol } from '../middleware/authMiddleware';

const router = Router();

// Tüm rapor rotaları gözetmen yetkisi gerektirir
router.use(tokenDogrulama, rolKontrol('GOZATMEN'));

// PATTERN: Request-Reply - Gözetmen veri sorguları
router.get('/aktif-ogrenciler', raporController.aktifOgrencileriListele);
router.get('/tum-ogrenciler', raporController.tumOgrencileriListele);
router.get('/ogrenci/:ogrenciId', raporController.ogrenciRaporuGetir);
router.get('/skorlar', raporController.tumSkorlariListele);

export default router;
