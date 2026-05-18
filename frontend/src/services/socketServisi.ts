// PATTERN: Publish-Subscribe Pattern
// Socket Servisi: Backend WebSocket bağlantısını yönetir

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

class SocketServisi {
  private soket: Socket | null = null;

  baglan(token: string): Socket {
    if (this.soket?.connected) return this.soket;

    this.soket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.soket.on('connect', () => {
      console.log('[SOCKET] Bağlantı kuruldu:', this.soket?.id);
    });

    this.soket.on('disconnect', (sebep) => {
      console.log('[SOCKET] Bağlantı kesildi:', sebep);
    });

    this.soket.on('connect_error', (hata) => {
      console.error('[SOCKET] Bağlantı hatası:', hata.message);
    });

    return this.soket;
  }

  ayril(): void {
    if (this.soket) {
      this.soket.disconnect();
      this.soket = null;
    }
  }

  soketAl(): Socket | null {
    return this.soket;
  }

  bagliMi(): boolean {
    return this.soket?.connected ?? false;
  }
}

export const socketServisi = new SocketServisi();
