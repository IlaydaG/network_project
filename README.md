# Dağıtık Sınav İzleme Sistemi

Öğrencilerin online sınav sırasında davranışlarını gerçek zamanlı izleyen ve şüphe skoru hesaplayan tam kapsamlı bir sistem.

---

## Kullanılan Tasarım Desenleri (Patterns)

| Pattern | Konum | Açıklama |
|---|---|---|
| **Client-Server** | React ↔ Express | Kayıt, giriş, sınav başlatma |
| **Request-Reply** | REST API | Tüm HTTP istek/yanıt döngüleri |
| **Publish-Subscribe** | Socket.io | Öğrenci → event üretir, gözetmen → event alır |
| **Ventilator-Worker-Sink** | Pipeline | Event kabulü → kuyruk → işleme → DB + yayın |
| **Multicast** | Socket.io Rooms | Tek event → tüm gözetmenler (gozatmenler odası) |

---

## Proje Yapısı

```
network_project/
├── backend/
│   └── src/
│       ├── config/          # DB bağlantısı, JWT yardımcıları
│       ├── controllers/     # HTTP istek/yanıt işleyicileri
│       ├── middleware/      # JWT doğrulama, input validation
│       ├── pipeline/        # ventilator → kuyruk → isci → havuz
│       │   ├── ventilator.ts  # Event kabulü (REST endpoint)
│       │   ├── kuyruk.ts      # Bellek içi event kuyruğu
│       │   ├── isci.ts        # Skor hesaplama ve işleme
│       │   └── havuz.ts       # DB kayıt + Socket.io yayın
│       ├── repositories/    # Veritabanı işlemleri
│       ├── routes/          # Express rotaları
│       ├── services/        # İş mantığı katmanı
│       ├── socket/          # Socket.io yöneticisi
│       └── types/           # TypeScript tipleri
└── frontend/
    └── src/
        ├── components/
        │   ├── GozatmenPanel/   # OgrenciKart, EventAkisi
        │   ├── OgrenciSinav/    # SoruKarti, SupheGostergesi
        │   └── Genel/           # KorunanSayfa (JWT guard)
        ├── context/         # AuthContext (JWT state)
        ├── data/            # 10 soruluk sınav verisi
        ├── hooks/           # useAnomaliTakip, useSocket
        ├── pages/           # GirisYap, KayitOl, Sinav, Gozatmen
        ├── services/        # apiServisi, socketServisi
        └── types/           # TypeScript tipleri
```

---

## Kurulum

### 1. RabbitMQ'yu Docker ile Başlat

```bash
docker compose up -d
```

RabbitMQ yönetim paneli: http://localhost:15672 (kullanıcı: `guest`, şifre: `guest`)

### 2. Firebase / Firestore Veritabanını Hazırla

Firebase Console'dan proje oluştur, `.env` içindeki Firebase değişkenlerini güncelle.

### 3. Backend Kurulumu

```bash
cd backend
npm install

# .env dosyasını oluştur
cp .env.example .env
# .env dosyasını düzenle (DB şifren, JWT secret vb.)

npm run dev
```

Backend `http://localhost:3001` adresinde çalışır.

### 3. Frontend Kurulumu

```bash
cd frontend
npm install
npm run dev
```

Frontend `http://localhost:5173` adresinde çalışır.

---

## Kullanım

### Öğrenci Akışı
1. `/kayit` → Öğrenci olarak kayıt ol
2. `/giris` → Giriş yap
3. Otomatik olarak `/sinav` sayfasına yönlendirilirsin
4. "Sınavı Başlat" butonuna tıkla
5. 10 soruyu cevapla
6. Sınav boyunca davranışların izlenir ve şüphe skoru güncellenir

### Gözetmen Akışı
1. `/kayit` → Gözetmen olarak kayıt ol
2. `/giris` → Giriş yap
3. Otomatik olarak `/gozatmen` paneline yönlendirilirsin
4. Aktif öğrencileri gerçek zamanlı izle

---

## Event Skor Tablosu

| Event | Puan | Açıklama |
|---|---|---|
| Ctrl+C | +40 | Kopyalama girişimi |
| Sekme değiştirme | +40 | Başka sekmeye geçiş |
| Pencere küçültme | +35 | Odak kaybı |
| Mouse 10s hareketsiz | +15 | Dikkat dağınıklığı |
| Soru < 3 saniye | +15 | Hızlı geçiş |
| 3+ sekme/dakika | +20 ekstra | Frekans cezası |

> **Zaman ağırlıklandırması:** Son 2 dakika → ×1.5, Son 5 dakika → ×1.2

### Durum Eşikleri
- **0–30 puan** → ✅ Normal (Yeşil)
- **31–60 puan** → ⚠️ Dikkat (Sarı)
- **61+ puan** → 🚨 Şüpheli (Kırmızı)

---

## API Rotaları

```
POST /api/auth/kayit           → Kayıt ol
POST /api/auth/giris           → Giriş yap (JWT alır)
GET  /api/auth/ben             → Mevcut kullanıcı

POST /api/sinav/baslat         → Sınav oturumu başlat (OGRENCI)
POST /api/sinav/bitir          → Sınav oturumu bitir (OGRENCI)
POST /api/sinav/soru-guncelle  → Mevcut soru güncelle (OGRENCI)
POST /api/sinav/events         → Anomali event gönder - Ventilator (OGRENCI)

GET  /api/rapor/aktif-ogrenciler → Canlı öğrenci listesi (GOZATMEN)
GET  /api/rapor/tum-ogrenciler   → Tüm öğrenciler (GOZATMEN)
GET  /api/rapor/ogrenci/:id      → Öğrenci detay raporu (GOZATMEN)
GET  /api/rapor/skorlar          → Tüm skor listesi (GOZATMEN)
```

## Socket.io Olayları

```
# Gözetmen alır (subscribe):
ogrenciler:liste    → Bağlanınca mevcut öğrenci listesi
ogrenci:baglandi    → Yeni öğrenci sınava girdi
ogrenci:guncellendi → Öğrenci skoru/durumu değişti
ogrenci:ayrildi     → Öğrenci sınavı bitirdi / bağlantı kesildi
event:islendi       → Anomali event işlendi (skor, durum bilgisi)

# Öğrenci gönderir (publish):
sinav:kayit         → Sınav başlatıldı, socket kaydı
```
