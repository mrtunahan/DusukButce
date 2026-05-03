# DusukButce — Fiş Okuma ve Fiyat Takip Sistemi

Market fişi fotoğraflarını dijitalleştiren, ürün fiyatlarını takip eden ve enflasyon analizi yapan REST API backend.

## Özellikler

- **GİB QR Kod** öncelikli ayrıştırma (OCR'a göre çok daha doğru)
- **Hibrit Parser**: Regex → Güven skoru düşükse Claude Haiku LLM fallback
- **Ayrıştırılmış veri modeli**: Ölçeklenebilir `price_history` koleksiyonu
- **Asenkron işleme**: BullMQ kuyruk sistemi ile non-blocking yükleme
- **Duplicate detection**: pHash ile aynı fişin iki kez kaydedilmesini önleme
- **Güvenlik**: JWT + refresh token rotasyonu, bcrypt, presigned S3 URL

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Runtime | Node.js 20 LTS |
| API | Express.js |
| Veritabanı | MongoDB 7+ |
| Kuyruk | BullMQ + Redis |
| OCR | Tesseract.js (Türkçe) |
| QR | jsQR |
| Görüntü İşleme | Sharp |
| LLM Fallback | Claude Haiku (Anthropic) |
| Depolama | S3 uyumlu (MinIO / Backblaze B2) |
| Process Manager | PM2 |

## Kurulum

```bash
npm install
cp .env.example .env
# .env dosyasını düzenle
npm run seed
npm run dev
```

## API Endpoint'leri

### Kimlik Doğrulama
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/auth/register` | Kullanıcı kaydı |
| POST | `/auth/login` | JWT döndürür |
| POST | `/auth/refresh` | Token yenileme |

### Fişler
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/receipts` | Fiş yükleme (multipart/form-data, `image` alanı) |
| GET | `/receipts` | Fiş listesi |
| GET | `/receipts/:id` | Fiş detayı + kalemler |
| GET | `/receipts/:id/status` | İşleme durumu (polling) |
| DELETE | `/receipts/:id` | Fiş silme |

### Ürünler ve İçgörüler
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/products/:id/price-history` | Fiyat trendi (`?days=90`) |
| GET | `/products/:id/markets` | Market karşılaştırması |
| GET | `/insights/inflation` | Sepet enflasyonu |
| GET | `/insights/anomalies` | Şüpheli fiyatlar |

## Çalışma Akışı

```
POST /receipts → S3'e yükle → BullMQ job → 202 Accepted

[Worker]
  QR kod → OCR → Regex parser → (güven < 0.7) Claude Haiku
  → Ürün eşleştir → price_history kaydet → DONE
```

## Prodüksiyon

```bash
npx pm2 start ecosystem.config.js
```

## Testler

```bash
npm test
```
