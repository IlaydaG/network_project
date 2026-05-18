// Frontend TypeScript tipleri

export type Rol = 'OGRENCI' | 'GOZATMEN';
export type OgrenciDurum = 'NORMAL' | 'DIKKAT' | 'SUPHELI' | 'TAMAMLANDI';

export type EventTipi =
  | 'KOPYALAMA_GIRISIMI'
  | 'SEKME_DEGISIMI'
  | 'ODAK_KAYBI'
  | 'MOUSE_HAREKETSIZ'
  | 'HIZLI_GECIS';

export interface KullaniciBilgi {
  id: string;
  ad: string;
  email: string;
  rol: Rol;
}

export interface AuthDurum {
  kullanici: KullaniciBilgi | null;
  token: string | null;
  yukleniyor: boolean;
}

export interface Oturum {
  id: string;
  ogrenciId: string;
  baslangicZamani: string;
  bitisZamani?: string;
  aktif: boolean;
}

export interface SinavEvent {
  id: string;
  oturumId: string;
  tip: EventTipi;
  zaman: string;
  veri?: Record<string, unknown>;
}

export interface EventSayilari {
  kopyalama: number;
  sekmeDegisimi: number;
  odakKaybi: number;
  mouseHareketsiz: number;
  hizliGecis: number;
}

export interface OgrenciDurumu {
  kullanici: KullaniciBilgi;
  oturum: Oturum;
  mevcutSoru: number;
  toplamSkor: number;
  eventSayilari: EventSayilari;
  durum: OgrenciDurum;
  socketId?: string;
}

export interface Soru {
  id: number;
  soru: string;
  secenekler: string[];
  dogruCevap: number;
}

export interface ApiYaniti<T = unknown> {
  basarili: boolean;
  veri?: T;
  hata?: string;
  mesaj?: string;
}

export interface GirisIstegi {
  email: string;
  sifre: string;
}

export interface KayitIstegi {
  ad: string;
  email: string;
  sifre: string;
  rol: Rol;
}

export interface SinavBaslatYaniti {
  oturumId: string;
  baslangicZamani: string;
}
