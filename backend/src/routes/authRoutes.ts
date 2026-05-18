import { Router } from 'express';
import { authController } from '../controllers/authController';
import { tokenDogrulama } from '../middleware/authMiddleware';
import { kayitKurallari, girisKurallari } from '../middleware/dogrulamaMiddleware';

const router = Router();

// PATTERN: Request-Reply - Kayıt ve giriş
router.post('/kayit', kayitKurallari, authController.kayitOl);
router.post('/giris', girisKurallari, authController.girisYap);
router.get('/ben', tokenDogrulama, authController.benimBilgilerim);

export default router;
