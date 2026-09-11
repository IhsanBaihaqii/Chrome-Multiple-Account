# Setup Google Spreadsheet + Apps Script

## 1. Buat Spreadsheet
1. Buka Google Sheets.
2. Buat spreadsheet baru.
3. Contoh nama: `Remote Chrome Database`.

## 2. Buka Apps Script
Di Spreadsheet:
- Extensions
- Apps Script

Hapus isi awal `Code.gs` jika perlu.

## 3. Buat file Apps Script
Buat file berikut dan salin isi dari folder `apps-script` ZIP:

- `Config.gs`
- `Code.gs`
- `Setup.gs`
- `DeviceService.gs`
- `CommandService.gs`
- `AuthService.gs`
- `Utils.gs`

## 4. Ganti token
Di `Config.gs`:

```js
CONTROLLER_TOKEN: "GANTI_CONTROLLER_TOKEN",
WORKER_TOKEN: "GANTI_WORKER_TOKEN",
```

Contoh:

```js
CONTROLLER_TOKEN: "admin-7f3f9a-ubah-ini",
WORKER_TOKEN: "worker-b81d2c-ubah-ini",
```

Gunakan token panjang dan acak untuk pemakaian sungguhan.

## 5. Buat tabel Spreadsheet otomatis
Di Apps Script:
1. Pilih fungsi `setupSpreadsheet`.
2. Klik Run.
3. Izinkan permission jika diminta.

Fungsi ini otomatis membuat sheet:

- `DEVICES`
- `COMMANDS`
- `RESULTS`
- `LOGS`

Header juga dibuat otomatis.

## 6. Deploy Apps Script
1. Klik **Deploy**
2. **New deployment**
3. Pilih **Web app**
4. Execute as: **Me**
5. Who has access: pilih opsi yang memungkinkan extension/controller mengakses Web App sesuai akun dan kebijakan Google kamu.
6. Deploy.
7. Salin URL yang berakhir `/exec`

Contoh:

`https://script.google.com/macros/s/AKfycb.../exec`

Masukkan URL itu ke:
- Options extension
- Controller HTML

## 7. Tes API
Buka URL `/exec` di browser.

Jika benar akan muncul JSON seperti:

```json
{
  "success": true,
  "service": "Remote Chrome Controller API"
}
```
