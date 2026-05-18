// PATTERN: Publish-Subscribe (Event Producer)
// Anomali Takip Hook: Öğrenci davranışlarını izler ve backend'e event gönderir.
//
// Olay ayırt etme mantığı:
//   visibilitychange (hidden=true) → SEKME_DEGISIMI
//     Hem sekme geçişini hem de pencere minimize'yi kapsar.
//     Aralarındaki fark tarayıcı seviyesinde ayırt edilemez.
//
//   blur → ODAK_KAYBI
//     100ms debounce ile beklenir:
//       - Süre içinde visibilitychange gelirse → zaten SEKME_DEGISIMI gönderildi, blur iptal
//       - Gelmezse ve sayfa hâlâ görünürse → split ekran / başka uygulama → ODAK_KAYBI
//
// Bu yaklaşım minimize+blur çift event sorununu çözer.

import { useEffect, useRef, useCallback } from 'react';
import { apiServisi } from '../services/apiServisi';
import { EventTipi } from '../types';

interface AnomaliTakipSecenekleri {
  oturumId: string;
  aktif: boolean;
}

export const useAnomaliTakip = ({ oturumId, aktif }: AnomaliTakipSecenekleri) => {
  const soruBaslangicRef   = useRef<number>(Date.now());
  const mouseZamanRef      = useRef<number>(Date.now());
  const mouseTimerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const blurTimerRef       = useRef<ReturnType<typeof setTimeout>  | null>(null);
  // Sayfa şu an gizli mi? (visibilitychange ile senkronize tutulur)
  const gizliMiRef         = useRef(false);

  const eventGonder = useCallback(
    async (tip: EventTipi, veri?: Record<string, unknown>) => {
      if (!aktif || !oturumId) return;
      try {
        await apiServisi.eventGonder(oturumId, tip, veri);
      } catch {
        // Ağ hatası — sessizce geç
      }
    },
    [oturumId, aktif]
  );

  // ─── CTRL+C — Kopyalama girişimi ──────────────────────────────────────────
  useEffect(() => {
    if (!aktif) return;
    const isleyici = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        eventGonder('KOPYALAMA_GIRISIMI', { tus: 'Ctrl+C' });
      }
    };
    document.addEventListener('keydown', isleyici);
    return () => document.removeEventListener('keydown', isleyici);
  }, [aktif, eventGonder]);

  // ─── SEKME DEĞİŞİMİ — visibilitychange ────────────────────────────────────
  // Hem sekme geçişi hem de pencere minimize/gizlenme document.hidden = true yapar.
  // İkisini tarayıcı API'si aracılığıyla kesin olarak ayırt etmek mümkün değildir.
  // blur'dan gelen bekleyen timer varsa iptal ederek çift event önlenir.
  useEffect(() => {
    if (!aktif) return;

    const isleyici = () => {
      if (document.hidden && !gizliMiRef.current) {
        gizliMiRef.current = true;
        // blur debounce timer aktifse iptal et — biz SEKME_DEGISIMI gönderiyoruz
        if (blurTimerRef.current) {
          clearTimeout(blurTimerRef.current);
          blurTimerRef.current = null;
        }
        eventGonder('SEKME_DEGISIMI', { sebep: 'gorununurluk-kaybi' });
      } else if (!document.hidden) {
        gizliMiRef.current = false;
      }
    };

    document.addEventListener('visibilitychange', isleyici);
    return () => document.removeEventListener('visibilitychange', isleyici);
  }, [aktif, eventGonder]);

  // ─── PENCERE KÜÇÜLTME / ODAK KAYBI — blur ─────────────────────────────────
  // Pencere odak kaybettiğinde tetiklenir. 100ms debounce:
  //   • visibilitychange 100ms içinde gelirse → minimize/sekme, timer iptal, olay atlanır
  //   • visibilitychange gelmezse ve !document.hidden → split ekran veya başka uygulama
  useEffect(() => {
    if (!aktif) return;

    const blurIsleyici = () => {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);

      blurTimerRef.current = setTimeout(() => {
        blurTimerRef.current = null;
        // Sayfa hâlâ görünürse = visibilitychange tetiklenmedi = gerçek odak kaybı
        if (!document.hidden) {
          eventGonder('ODAK_KAYBI', { sebep: 'odak-kaybi' });
        }
        // document.hidden = true ise visibilitychange SEKME_DEGISIMI'ni gönderdi — atla
      }, 100);
    };

    window.addEventListener('blur', blurIsleyici);
    return () => {
      window.removeEventListener('blur', blurIsleyici);
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current);
        blurTimerRef.current = null;
      }
    };
  }, [aktif, eventGonder]);

  // ─── MOUSE HAREKETSİZLİK — 10 saniye boyunca fare/klavye hareketi yok ─────
  useEffect(() => {
    if (!aktif) return;

    const hareketIsleyici = () => { mouseZamanRef.current = Date.now(); };
    document.addEventListener('mousemove', hareketIsleyici);
    document.addEventListener('click',     hareketIsleyici);
    document.addEventListener('keydown',   hareketIsleyici);

    mouseTimerRef.current = setInterval(() => {
      const gecenSaniye = (Date.now() - mouseZamanRef.current) / 1000;
      if (gecenSaniye >= 10) {
        eventGonder('MOUSE_HAREKETSIZ', { sureSaniye: Math.round(gecenSaniye) });
        mouseZamanRef.current = Date.now(); // Bir sonraki tetik için sıfırla
      }
    }, 5000);

    return () => {
      document.removeEventListener('mousemove', hareketIsleyici);
      document.removeEventListener('click',     hareketIsleyici);
      document.removeEventListener('keydown',   hareketIsleyici);
      if (mouseTimerRef.current) clearInterval(mouseTimerRef.current);
    };
  }, [aktif, eventGonder]);

  // Yeni soruya geçildiğinde zamanlayıcıyı sıfırla
  const soruBaslangiciKaydet = useCallback(() => {
    soruBaslangicRef.current = Date.now();
  }, []);

  // Soru geçişinde hızlı geçiş kontrolü — 3 saniyeden kısa ise anomali
  const soruGecisKontrol = useCallback(
    async (soruNo: number) => {
      const gecenSaniye = (Date.now() - soruBaslangicRef.current) / 1000;
      if (gecenSaniye < 3) {
        await eventGonder('HIZLI_GECIS', {
          soruNo,
          sureSaniye: Math.round(gecenSaniye * 10) / 10,
        });
      }
      soruBaslangicRef.current = Date.now();
    },
    [eventGonder]
  );

  return { soruBaslangiciKaydet, soruGecisKontrol };
};
