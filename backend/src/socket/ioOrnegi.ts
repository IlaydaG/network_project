// Socket.io singleton - döngüsel bağımlılıkları önler
import { Server } from 'socket.io';

let ioOrnegi: Server | null = null;

export const ioAyarla = (io: Server): void => {
  ioOrnegi = io;
};

export const ioAl = (): Server => {
  if (!ioOrnegi) throw new Error('Socket.io sunucusu henüz başlatılmadı');
  return ioOrnegi;
};
