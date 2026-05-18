// PATTERN: Publish-Subscribe Pattern
// useSocket Hook: Socket.io bağlantısını React lifecycle ile entegre eder

import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { socketServisi } from '../services/socketServisi';
import { useAuth } from '../context/AuthContext';

export const useSocket = () => {
  const { token } = useAuth();
  const soketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const soket = socketServisi.baglan(token);
    soketRef.current = soket;

    return () => {
      socketServisi.ayril();
      soketRef.current = null;
    };
  }, [token]);

  const olayDinle = useCallback(<T>(olay: string, isleyici: (veri: T) => void) => {
    soketRef.current?.on(olay, isleyici);
  }, []);

  const olayiBirak = useCallback(<T>(olay: string, isleyici: (veri: T) => void) => {
    soketRef.current?.off(olay, isleyici);
  }, []);

  const olayGonder = useCallback((olay: string, veri?: unknown) => {
    soketRef.current?.emit(olay, veri);
  }, []);

  return { soket: soketRef.current, olayDinle, olayiBirak, olayGonder };
};
