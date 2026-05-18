import { Soru } from '../types';

export const SORULAR: Soru[] = [
  {
    id: 1,
    soru: 'Aşağıdaki veri yapılarından hangisi LIFO (Last In First Out) prensibine göre çalışır?',
    secenekler: ['A) Kuyruk (Queue)', 'B) Yığın (Stack)', 'C) Bağlı Liste', 'D) İkili Ağaç'],
    dogruCevap: 1,
  },
  {
    id: 2,
    soru: 'HTTP protokolünde 404 hata kodu ne anlama gelir?',
    secenekler: ['A) Sunucu Hatası', 'B) Yetkilendirme Hatası', 'C) Kaynak Bulunamadı', 'D) İstek Zaman Aşımı'],
    dogruCevap: 2,
  },
  {
    id: 3,
    soru: 'Aşağıdaki hangi sıralama algoritması en iyi durumda O(n) zaman karmaşıklığına sahiptir?',
    secenekler: ['A) Quick Sort', 'B) Merge Sort', 'C) Heap Sort', 'D) Insertion Sort'],
    dogruCevap: 3,
  },
  {
    id: 4,
    soru: 'TCP/IP modelinde kaç katman bulunur?',
    secenekler: ['A) 3', 'B) 4', 'C) 5', 'D) 7'],
    dogruCevap: 1,
  },
  {
    id: 5,
    soru: 'SQL\'de bir tablonun tüm kayıtlarını silip tabloyu sıfırlamak için hangi komut kullanılır?',
    secenekler: ['A) REMOVE', 'B) DROP TABLE', 'C) TRUNCATE', 'D) DELETE ALL'],
    dogruCevap: 2,
  },
  {
    id: 6,
    soru: 'REST API\'de mevcut bir kaynağı güncellemek için hangi HTTP metodu kullanılır?',
    secenekler: ['A) GET', 'B) POST', 'C) PUT', 'D) DELETE'],
    dogruCevap: 2,
  },
  {
    id: 7,
    soru: 'Nesne yönelimli programlamanın temel prensiplerinden biri DEĞİLDİR:',
    secenekler: ['A) Kalıtım (Inheritance)', 'B) Kapsülleme (Encapsulation)', 'C) Çok Biçimlilik (Polymorphism)', 'D) Sıralama (Sorting)'],
    dogruCevap: 3,
  },
  {
    id: 8,
    soru: 'Git\'te değişiklikleri yerel depoya işlemek (kaydetmek) için hangi komut kullanılır?',
    secenekler: ['A) git push', 'B) git commit', 'C) git merge', 'D) git add'],
    dogruCevap: 1,
  },
  {
    id: 9,
    soru: 'JavaScript\'te asenkron işlemler için kullanılan modern yaklaşım hangisidir?',
    secenekler: ['A) Callbacks', 'B) setTimeout', 'C) async/await', 'D) for döngüsü'],
    dogruCevap: 2,
  },
  {
    id: 10,
    soru: 'n düğüm içeren bir ikili ağacın maksimum yüksekliği nedir?',
    secenekler: ['A) log₂(n)', 'B) n/2', 'C) n-1', 'D) √n'],
    dogruCevap: 2,
  },
];

export const TOPLAM_SORU = SORULAR.length;
