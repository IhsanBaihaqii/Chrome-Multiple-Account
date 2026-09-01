# Chrome Multi Account Launcher

Aplikasi berbasis **Node.js** untuk membuka beberapa profil Google Chrome secara bersamaan menuju URL yang sama dengan sesi akun berbeda.

---

## 📋 Daftar Isi

- [Fitur](#-fitur)
- [Persyaratan Sistem](#-persyaratan-sistem)
- [Struktur Project](#-struktur-project)
- [Persiapan Chrome Profile](#-persiapan-chrome-profile)
- [Instalasi](#-instalasi)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Cara Penggunaan](#-cara-penggunaan)
- [Contoh Kasus](#-contoh-kasus)
- [Troubleshooting](#-troubleshooting)
- [Pengembangan Selanjutnya](#-pengembangan-selanjutnya)
- [Lisensi](#-lisensi)

---

## ✨ Fitur

- Buka beberapa profil Chrome sekaligus
- Setiap profil memiliki sesi/cookie terpisah
- Dukungan untuk semua website (TikTok, YouTube, Gmail, dll)
- Antarmuka web sederhana
- Mudah dikustomisasi

---

## 🖥️ Persyaratan Sistem

Pastikan komputer Anda telah terinstall:

| Komponen                       | Minimal Versi           |
| ------------------------------ | ----------------------- |
| [Node.js](https://nodejs.org/) | v14.x atau lebih baru   |
| npm                            | v6.x atau lebih baru    |
| Google Chrome                  | Versi terbaru           |
| Sistem Operasi                 | Windows / macOS / Linux |

**Cek versi terinstall:**

```bash
node -v
npm -v
```

---

## 📁 Struktur Project

```
Chrome-Multi/
│
├── package.json          # Daftar dependency
├── package-lock.json     # Lock file dependency
├── server.js             # Server utama
│
├── public/               # Asset frontend
│   ├── index.html        # Halaman utama
│   ├── style.css         # Styling
│   └── script.js         # Logic client-side
│
└── README.md             # Dokumentasi
```

---

## 🔧 Persiapan Chrome Profile

Aplikasi ini memanfaatkan profil Chrome yang sudah ada. Setiap profil harus sudah **login** dengan akun yang diinginkan.

### 1. Buat Profil Chrome

Buka Chrome dan buat beberapa profil, misalnya:

```
Default
Profile 1
Profile 2
Profile 3
```

### 2. Login ke Akun

Login ke akun yang diinginkan di setiap profil:

```
Default    → akun1@gmail.com  → TikTok Akun A
Profile 1  → akun2@gmail.com  → TikTok Akun B
Profile 2  → akun3@gmail.com  → TikTok Akun C
```

> **Catatan:** Login hanya perlu dilakukan **satu kali** agar sesi tersimpan.

---

## 🔍 Mengetahui Nama Profil Chrome

1. Buka Chrome dengan profil yang ingin diperiksa
2. Akses `chrome://version`
3. Cari bagian **Profile Path**

Contoh:

```
C:\Users\User\AppData\Local\Google\Chrome\User Data\Default
```

→ Nama profil: `Default`

```
C:\Users\User\AppData\Local\Google\Chrome\User Data\Profile 1
```

→ Nama profil: `Profile 1`

---

## ⚙️ Instalasi

### 1. Clone atau Download Project

```bash
git clone https://github.com/IhsanBaihaqii/Chrome-Multiple-Account
cd Chrome-Multiple-Account
```

### 2. Install Dependencies

```bash
npm install
```

### 3. (Opsional) Install Express secara manual

```bash
npm install express
```

---

## 🚀 Menjalankan Aplikasi

### Jalankan server:

```bash
node server.js
```

Jika berhasil, akan muncul:

```
Server berjalan di http://localhost:3000
```

### Buka di browser:

```
http://localhost:3000
```

---

## 🎮 Cara Penggunaan

1. Masukkan **jumlah profil** yang ingin dibuka
2. Masukkan **URL tujuan**
3. Klik tombol **Buka Semua**

Contoh input:

```
Jumlah akun: 3
URL tujuan: https://www.tiktok.com
```

### Hasil:

```
Chrome Default    → https://www.tiktok.com
Chrome Profile 1  → https://www.tiktok.com
Chrome Profile 2  → https://www.tiktok.com
```

---

## 📌 Contoh Kasus

### TikTok

Jika profil sudah disiapkan:

```
Default    → TikTok Akun A
Profile 1  → TikTok Akun B
Profile 2  → TikTok Akun C
```

Maka hasilnya:

```
Chrome Default    → TikTok Akun A
Chrome Profile 1  → TikTok Akun B
Chrome Profile 2  → TikTok Akun C
```

### YouTube

```
Jumlah akun: 3
URL: https://www.youtube.com
```

### Gmail

```
Jumlah akun: 3
URL: https://mail.google.com
```

---

## ⚠️ Troubleshooting

### Chrome Tidak Ditemukan

Jika muncul error `ENOENT` atau `Google Chrome tidak ditemukan`:

**Lokasi Chrome di Windows:**

```
C:\Program Files\Google\Chrome\Application\chrome.exe
C:\Program Files (x86)\Google\Chrome\Application\chrome.exe
C:\Users\%USERNAME%\AppData\Local\Google\Chrome\Application\chrome.exe
```

**Lokasi Chrome di macOS:**

```
/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
```

**Lokasi Chrome di Linux:**

```
/usr/bin/google-chrome
/usr/bin/chromium-browser
```

Periksa dan sesuaikan path di `server.js` jika diperlukan.

### Server Tidak Berjalan

- Pastikan port `3000` tidak digunakan aplikasi lain
- Coba jalankan dengan port berbeda: `node server.js --port=3001`

### Profil Tidak Terbuka

- Pastikan nama profil sesuai dengan yang ada di `chrome://version`
- Periksa kembali path profil di `server.js`

---

## 🔄 Menghentikan Server

Di terminal tempat server berjalan, tekan:

```
CTRL + C
```

Untuk menjalankan kembali:

```bash
node server.js
```

---

## 🚧 Pengembangan Selanjutnya

Fitur yang dapat ditambahkan:

- [ ] Deteksi profil Chrome secara otomatis
- [ ] Memilih profil tertentu
- [ ] Menampilkan nama akun yang sedang login
- [ ] Menyimpan URL favorit (TikTok, YouTube, Gmail, Instagram)
- [ ] Tombol pintasan untuk website populer
- [ ] Menampilkan jumlah profil yang tersedia
- [ ] Menyimpan konfigurasi profil
- [ ] Membuat aplikasi desktop dengan Electron
- [ ] Auto-start server tanpa mengetik `node server.js`

---

## 🛠️ Teknologi

- [Node.js](https://nodejs.org/) - Runtime JavaScript
- [Express.js](https://expressjs.com/) - Framework web
- HTML, CSS, JavaScript - Frontend
- Google Chrome - Browser target

---

## 📄 Lisensi

Project ini bersifat open-source. Silakan gunakan, modifikasi, dan distribusikan sesuai kebutuhan.

---

## 📝 Catatan Penting

⚠️ Aplikasi ini **tidak melakukan login otomatis**. Pastikan setiap profil Chrome sudah login ke akun yang diinginkan sebelum digunakan.

Aplikasi hanya membuka profil yang sudah ada dengan sesi yang tersimpan.
