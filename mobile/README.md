# DüşükBütçe — Mobil Uygulama (Expo SDK 54)

React Native + Expo ile yazılmış fiş tarama uygulaması. Expo Go ile çalışır.

## Kurulum

```bash
cd mobile
npm install
npx expo start
```

## ⚠️ Backend IP Ayarı (Zorunlu)

`src/services/api.js` dosyasında kendi bilgisayarının yerel IP'sini yaz:

```js
const DEV_API_URL = 'http://192.168.1.42:3000';  // ← Bunu değiştir
```

IP'ni öğrenmek için:
```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I | awk '{print $1}'
```

Telefon ve bilgisayar aynı Wi-Fi'da olmalı.

## Ekranlar

| Ekran | Açıklama |
|-------|----------|
| Giriş / Kayıt | JWT kimlik doğrulama |
| Fişlerim | Sayfalı fiş listesi, pull-to-refresh |
| Fiş Ekle | Kamera veya galeriden yükleme |
| Fiş Detayı | Kalemler, fiyatlar, işlem durumu (auto-poll) |
| Analizler | Sepet enflasyonu, şüpheli fiyatlar |

## Sorun Giderme

**"Network request failed"**
1. Telefon ve bilgisayar aynı Wi-Fi'da mı?
2. `DEV_API_URL` doğru IP'yi gösteriyor mu?
3. Backend `0.0.0.0:3000`'de çalışıyor mu?

**Wi-Fi engelleniyorsa** tunnel modunu kullan:
```bash
npx expo start --tunnel
```

**Paket uyumsuzluğu varsa:**
```bash
npx expo-doctor
```
