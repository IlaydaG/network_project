// PATTERN: Client-Server Pattern + Request-Reply Pattern
// API Servisi: Backend REST API ile iletişimi yönetir

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  GirisIstegi,
  KayitIstegi,
  KullaniciBilgi,
  ApiYaniti,
  SinavBaslatYaniti,
  EventTipi,
  OgrenciDurumu,
} from '../types';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiServisi {
  private istemci: AxiosInstance;

  constructor() {
    this.istemci = axios.create({
      baseURL: `${BACKEND_URL}/api`,
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    this.istemci.interceptors.response.use(
      (response) => response,
      (hata: AxiosError<{ hata?: string }>) => {
        const backendMesaj = hata.response?.data?.hata;
        throw new Error(backendMesaj || 'Bir hata oluştu, lütfen tekrar deneyin');
      }
    );
  }

  tokenAyarla(token: string | null): void {
    if (token) {
      this.istemci.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.istemci.defaults.headers.common['Authorization'];
    }
  }

  // ─── AUTH ───────────────────────────────────────────────────────────────
  async girisYap(veri: GirisIstegi): Promise<{ kullanici: KullaniciBilgi; token: string }> {
    const yanit = await this.istemci.post<ApiYaniti<{ kullanici: KullaniciBilgi; token: string }>>(
      '/auth/giris',
      veri
    );
    if (!yanit.data.basarili || !yanit.data.veri) throw new Error(yanit.data.hata || 'Giriş başarısız');
    return yanit.data.veri;
  }

  async kayitOl(veri: KayitIstegi): Promise<{ kullanici: KullaniciBilgi; token: string }> {
    const yanit = await this.istemci.post<ApiYaniti<{ kullanici: KullaniciBilgi; token: string }>>(
      '/auth/kayit',
      veri
    );
    if (!yanit.data.basarili || !yanit.data.veri) throw new Error(yanit.data.hata || 'Kayıt başarısız');
    return yanit.data.veri;
  }

  // ─── SINAV ──────────────────────────────────────────────────────────────
  async sinavBaslat(): Promise<SinavBaslatYaniti> {
    const yanit = await this.istemci.post<ApiYaniti<SinavBaslatYaniti>>('/sinav/baslat');
    if (!yanit.data.basarili || !yanit.data.veri) throw new Error(yanit.data.hata || 'Sınav başlatılamadı');
    return yanit.data.veri;
  }

  async sinavBitir(oturumId: string): Promise<void> {
    await this.istemci.post('/sinav/bitir', { oturumId });
  }

  async soruGuncelle(oturumId: string, soruNo: number): Promise<void> {
    await this.istemci.post('/sinav/soru-guncelle', { oturumId, soruNo });
  }

  // PATTERN: Ventilator - Event gönderimi (pipeline'a giriş)
  async eventGonder(oturumId: string, tip: EventTipi, veri?: Record<string, unknown>): Promise<void> {
    await this.istemci.post('/sinav/events', { oturumId, tip, veri });
  }

  // ─── RAPOR ──────────────────────────────────────────────────────────────
  async aktifOgrencileriGetir(): Promise<OgrenciDurumu[]> {
    const yanit = await this.istemci.get<ApiYaniti<OgrenciDurumu[]>>('/rapor/aktif-ogrenciler');
    return yanit.data.veri ?? [];
  }

  async tumOgrencileriGetir(): Promise<KullaniciBilgi[]> {
    const yanit = await this.istemci.get<ApiYaniti<KullaniciBilgi[]>>('/rapor/tum-ogrenciler');
    return yanit.data.veri ?? [];
  }
}

export const apiServisi = new ApiServisi();
