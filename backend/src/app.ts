import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// dotenv en başta yüklenmeli - diğer modüller process.env'i okuyacak
dotenv.config();

import authRoutes from './routes/authRoutes';
import sinavRoutes from './routes/sinavRoutes';
import raporRoutes from './routes/raporRoutes';
import { socketYoneticisiniBaslat } from './socket/socketYoneticisi';
import { ioAyarla } from './socket/ioOrnegi';
import { firebaseBaslat } from './config/firebase';
import { isciBaslat } from './pipeline/isci';
import { rabbitmqBaslat } from './rabbitmq/baglanti';

const uygulama = express();
const sunucu   = http.createServer(uygulama);

// PATTERN: Publish-Subscribe - Socket.io sunucusu
const io = new Server(sunucu, {
  cors: {
    origin:  process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

ioAyarla(io);

uygulama.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
uygulama.use(express.json());

// PATTERN: Request-Reply - REST API rotaları
uygulama.use('/api/auth',  authRoutes);
uygulama.use('/api/sinav', sinavRoutes);
uygulama.use('/api/rapor', raporRoutes);

uygulama.get('/api/saglik', (_req, res) => {
  res.json({ durum: 'çalışıyor', veritabani: 'firebase', zaman: new Date().toISOString() });
});

// PATTERN: Publish-Subscribe - Socket.io yöneticisini başlat
socketYoneticisiniBaslat(io);

const PORT = parseInt(process.env.PORT || '3001');

sunucu.listen(PORT, async () => {
  // Firebase Firestore bağlantısını kur
  firebaseBaslat();

  // RabbitMQ bağlantısını kur
  await rabbitmqBaslat();

  // PATTERN: Ventilator-Worker-Sink - Pipeline işçisini başlat
  await isciBaslat();

  console.log(`📡 Sunucu   : http://localhost:${PORT}`);
  console.log(`🔌 WebSocket : ws://localhost:${PORT}`);
  console.log(`🐇 RabbitMQ  : ${process.env.RABBITMQ_URL}`);
});

export { io };
