// PATTERN: Publish-Subscribe Pattern (Gerçek Zamanlı)
// Öğrenciler event üretir (publish), gözetmenler bu eventleri alır (subscribe).
// PATTERN: Multicast - Aynı event tüm gözetmenlere gider.

import { Server, Socket } from 'socket.io';
import { tokenDogrula } from '../config/jwt';
import { JwtYuku, OgrenciDurumu } from '../types';

// Aktif ve tamamlanmış öğrenci durumlarını bellekte sakla
export const aktifOgrenciler = new Map<string, OgrenciDurumu>();

export const socketYoneticisiniBaslat = (io: Server): void => {
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Token eksik'));
    try {
      const yuk: JwtYuku = tokenDogrula(token);
      (socket as Socket & { kullaniciYuku: JwtYuku }).kullaniciYuku = yuk;
      next();
    } catch {
      next(new Error('Geçersiz token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const yuk = (socket as Socket & { kullaniciYuku: JwtYuku }).kullaniciYuku;
    console.log(`[SOCKET] Bağlandı: ${yuk.kullaniciId} (${yuk.rol})`);

    // ─── GÖZETMEN ────────────────────────────────────────────────────────
    if (yuk.rol === 'GOZATMEN') {
      socket.join('gozatmenler');
      // Bağlanınca tüm öğrencileri (aktif + tamamlanmış) gönder
      socket.emit('ogrenciler:liste', Array.from(aktifOgrenciler.values()));

      socket.on('disconnect', () => {
        socket.leave('gozatmenler');
      });
    }

    // ─── ÖĞRENCİ ─────────────────────────────────────────────────────────
    if (yuk.rol === 'OGRENCI') {
      socket.join(`ogrenci:${yuk.kullaniciId}`);

      socket.on('sinav:kayit', (veri: { oturumId: string }) => {
        const ogrenciDurumu = aktifOgrenciler.get(veri.oturumId);
        if (ogrenciDurumu) {
          ogrenciDurumu.socketId = socket.id;
          aktifOgrenciler.set(veri.oturumId, ogrenciDurumu);
          io.to('gozatmenler').emit('ogrenci:baglandi', ogrenciDurumu);
        }
      });

      socket.on('disconnect', () => {
        console.log(`[SOCKET] Öğrenci bağlantısı kesildi: ${yuk.kullaniciId}`);
        // Değişiklik 1: Panelden SILME — aktif oturumu kapat ama map'te tut
        for (const [oturumId, durum] of aktifOgrenciler.entries()) {
          if (durum.kullanici.id === yuk.kullaniciId && durum.oturum.aktif) {
            durum.oturum.aktif = false;
            aktifOgrenciler.set(oturumId, durum);
            io.to('gozatmenler').emit('ogrenci:guncellendi', durum);
            break;
          }
        }
      });
    }
  });

  console.log('[SOCKET] Socket.io yöneticisi başlatıldı.');
};
