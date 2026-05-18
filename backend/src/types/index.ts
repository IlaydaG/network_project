// Sistem genelinde kullanılan TypeScript tipleri ve arayüzler

export type Rol = 'OGRENCI' | 'GOZATMEN';

export type EventTipi =
  | 'KOPYALAMA_GIRISIMI'   // Ctrl+C tuşuna basma girişimi
  | 'SEKME_DEGISIMI'        // Tarayıcı sekmesi değiştirme
  | 'ODAK_KAYBI'      // Pencereyi küçültme / odak kaybı
  | 'MOUSE_HAREKETSIZ'      // Fare 10 saniye hareketsiz
  | 'HIZLI_GECIS';          // Soruyu 3 saniyeden kısa sürede geçme

export type OgrenciDurum = 'NORMAL' | 'DIKKAT' | 'SUPHELI' | 'TAMAMLANDI';

export interface Kullanici {
  id: string;
  ad: string;
  email: string;
  sifreHash: string;
  rol: Rol;
  olusturmaTarihi: Date;
}

export interface KullaniciBilgi {
  id: string;
  ad: string;
  email: string;
  rol: Rol;
}

export interface Oturum {
  id: string;
  ogrenciId: string;
  baslangicZamani: Date;
  bitisZamani?: Date;
  aktif: boolean;
}

export interface SinavEvent {
  id: string;
  oturumId: string;
  tip: EventTipi;
  zaman: Date;
  veri?: Record<string, unknown>;
}

export interface Skor {
  id: string;
  oturumId: string;
  toplamSkor: number;
  guncellemeTarihi: Date;
}

export interface EventYuku {
  oturumId: string;
  tip: EventTipi;
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

export interface JwtYuku {
  kullaniciId: string;
  rol: Rol;
  iat?: number;
  exp?: number;
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

export interface ApiYaniti<T = unknown> {
  basarili: boolean;
  veri?: T;
  hata?: string;
  mesaj?: string;
}

export interface SinavBaslatYaniti {
  oturumId: string;
  baslangicZamani: Date;
}

export interface OgrenciRaporu {
  kullanici: KullaniciBilgi;
  oturum: Oturum;
  toplamSkor: number;
  eventSayilari: EventSayilari;
  durum: OgrenciDurum;
  sonEventler: SinavEvent[];
}
