# 🚀 Chrome Multi-Account Remote Launcher

Aplikasi untuk membuka multiple akun Chrome secara remote dari satu perangkat ke perangkat lainnya. Cocok untuk keperluan automation, testing, atau manajemen multiple account di berbagai platform (TikTok, Instagram, dll).

## ✨ Fitur

- **Remote Control**: Kontrol perangkat lain dari jarak jauh
- **Multi-Account**: Buka beberapa profile Chrome sekaligus
- **Dual Mode**: Bisa berfungsi sebagai Controller atau Worker
- **Real-time Status**: Pantau status perangkat secara live
- **Simple UI**: Antarmuka yang mudah digunakan
- **Cross-Platform**: Bekerja di Windows, Linux, dan MacOS

## 📋 Prasyarat

- [Node.js](https://nodejs.org/) (v14 atau lebih baru)
- [Google Chrome](https://www.google.com/chrome/) terinstall
- Koneksi jaringan lokal (LAN) antar perangkat

## 🛠️ Instalasi

### 1. Clone atau Download

```bash
# Clone repository
git clone https://github.com/IhsanBaihaqii/Chrome-Multiple-Account.git
cd Chrome-Multiple-Account

# Atau download ZIP dan extract
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Jalankan Aplikasi

```bash
npm start
# atau untuk development dengan auto-reload
npm run dev
```

Akses aplikasi di: `http://localhost:3000`

atau untuk menjalankan dengan dengan 1 jaringan yang sama `http://ipconfig_kamu:3000` didapatkan pada terminal IP Anda saat menjalankan `npm run dev` dan gunakan port `:3000`

## 📱 Cara Penggunaan

### Mode Controller (Pengontrol)

1. Buka aplikasi di perangkat yang akan menjadi pengontrol
2. Klik tombol **"Controller"** di bagian atas
3. Masukkan **IP Address** perangkat worker
4. Isi **jumlah akun** yang ingin dibuka
5. Masukkan **URL tujuan** (contoh: https://www.tiktok.com)
6. Klik **"Kirim Perintah"**

### Mode Worker (Yang Dikontrol)

1. Buka aplikasi di perangkat yang akan dikontrol
2. Klik tombol **"Worker"** di bagian atas
3. Status akan berubah menjadi "Mode Worker aktif"
4. Tunggu perintah dari controller

## 🌐 Mengetahui IP Address

### Windows

```bash
ipconfig
# Cari "IPv4 Address" pada adapter yang aktif
```

### Linux / MacOS

```bash
ifconfig
# atau
ip addr show
# Cari "inet" pada interface yang aktif (biasanya eth0 atau wlan0)
```

## 📁 Struktur File

```
Chrome-Multi-Remote/
│
├── package.json          # Daftar dependency
├── package-lock.json     # Lock file dependency
├── server.js             # Server utama
├── config.json           # Konfigurasi otomatis
│
├── public/               # Asset frontend
│   ├── index.html        # Halaman utama
│   ├── style.css         # Styling
│   └── script.js         # Logic client-side
│
└── README.md             # Dokumentasi ini
```

## ⚙️ Konfigurasi

File `config.json` akan dibuat otomatis saat pertama kali dijalankan:

```json
{
  "mode": "controller",
  "controllerIP": "",
  "deviceName": "NAMA-COMPUTER-ANDA"
}
```

### Manual Configuration

Anda juga bisa mengubah mode melalui API:

```bash
# Mengubah ke mode worker
curl -X POST http://localhost:3000/config \
  -H "Content-Type: application/json" \
  -d '{"mode":"worker"}'

# Mengubah ke mode controller
curl -X POST http://localhost:3000/config \
  -H "Content-Type: application/json" \
  -d '{"mode":"controller"}'
```

## 🔧 API Endpoints

| Endpoint   | Method | Deskripsi                                  |
| ---------- | ------ | ------------------------------------------ |
| `/execute` | POST   | Menerima perintah dari controller (worker) |
| `/control` | POST   | Mengirim perintah ke worker (controller)   |
| `/status`  | GET    | Mendapatkan status perangkat               |
| `/config`  | POST   | Update konfigurasi                         |

### Contoh Request

**Kirim perintah ke worker:**

```json
POST /control
{
  "jumlah": 3,
  "url": "https://www.tiktok.com",
  "workerIP": "192.168.1.100"
}
```

**Worker menerima perintah:**

```json
POST /execute
{
  "jumlah": 3,
  "url": "https://www.tiktok.com"
}
```

## 🖥️ Contoh Penggunaan

### Skenario 1: Testing Multi-Account di TikTok

1. **Perangkat A (Controller)**: Setup di ruangan server
2. **Perangkat B (Worker)**: Setup di ruangan testing
3. Dari Perangkat A, kirim perintah untuk membuka 5 account TikTok
4. Perangkat B akan otomatis membuka 5 window Chrome dengan profile berbeda

### Skenario 2: Manajemen Social Media

1. **Tim Marketing**: Mengontrol dari laptop utama
2. **Worker Devices**: 3 komputer di ruangan berbeda
3. Kirim perintah ke semua worker untuk membuka Instagram
4. Setiap worker membuka akun yang sudah di-setup sebelumnya

## 🐛 Troubleshooting

### Chrome tidak ditemukan

**Solusi**: Pastikan Chrome terinstall di path default:

- Windows: `C:\Program Files\Google\Chrome\Application\chrome.exe`
- Linux: `/usr/bin/google-chrome`
- MacOS: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`

### Tidak bisa terhubung ke worker

**Solusi**:

1. Pastikan kedua perangkat dalam jaringan yang sama
2. Matikan firewall sementara untuk testing
3. Cek IP address worker benar
4. Pastikan server worker berjalan (npm start)

### Port 3000 sudah digunakan

**Solusi**: Ganti port dengan environment variable:

```bash
PORT=3001 npm start
```

## 🤝 Kontribusi

Pull request sangat diterima! Untuk perubahan besar, silakan buka issue terlebih dahulu untuk diskusi.
