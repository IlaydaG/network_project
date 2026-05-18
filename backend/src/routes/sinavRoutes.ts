import { Router } from 'express';
import { sinavController } from '../controllers/sinavController';
import { tokenDogrulama, rolKontrol } from '../middleware/authMiddleware';
import { eventKurallari } from '../middleware/dogrulamaMiddleware';

const router = Router();

// Tüm sınav rotaları kimlik doğrulama gerektirir
router.use(tokenDogrulama);

// PATTERN: Request-Reply - Sınav başlatma/bitirme (sadece öğrenci)
router.post('/baslat', rolKontrol('OGRENCI'), sinavController.baslat);
router.post('/bitir', rolKontrol('OGRENCI'), sinavController.bitir);
router.post('/soru-guncelle', rolKontrol('OGRENCI'), sinavController.soruGuncelle);

// PATTERN: Ventilator - Event kabulü (pipeline girişi)
router.post('/events', rolKontrol('OGRENCI'), eventKurallari, sinavController.eventGonder);

export default router;
