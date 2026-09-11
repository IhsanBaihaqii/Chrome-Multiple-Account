# Google Remote Chrome

Remote controller berbasis:

- Chrome Extension Manifest V3
- Google Apps Script Web App
- Google Spreadsheet sebagai database sederhana
- HTML Controller

## Arsitektur

```text
Controller HTML
      |
      v
Google Apps Script
      |
      v
Google Spreadsheet
      ^
      |
Chrome Extension Worker
```

## Penting

Extension tidak dapat membuka Chrome Profile lain dari satu profile.

Karena itu:

```text
1 Chrome Profile = 1 Worker
```

Untuk 4 akun Google berbeda, pasang extension pada 4 Chrome Profile.

## Fitur v1

- Register/update worker otomatis
- Heartbeat online/offline
- Multi-device
- Multi-profile
- OPEN_TAB
- CLOSE_TAB
- RELOAD_TAB
- FOCUS_TAB
- LIST_TABS
- CLOSE_ALL_MANAGED
- CLOSE_TABS_URL
- Command expiration
- Result logging
- Spreadsheet setup otomatis
- Controller HTML

## Setup cepat

1. Baca `docs/SETUP-SPREADSHEET.md`
2. Jalankan `setupSpreadsheet()` di Apps Script
3. Deploy Apps Script menjadi Web App
4. Install extension dari folder `extension-google`
5. Isi Options extension
6. Buka `controller/index.html`
7. Masukkan Apps Script URL + controller token
8. Load Devices
9. Pilih worker lalu kirim URL

## Sheet database

### DEVICES
Menyimpan device/profile extension.

### COMMANDS
Queue command untuk masing-masing worker.

### RESULTS
Hasil command.

### LOGS
Aktivitas sync dan result.

## Catatan keamanan

Jangan memakai token contoh untuk project public.

Ganti di:

`apps-script/Config.gs`

dan simpan token worker/controller secara rahasia.

Jangan menyimpan password akun Google di Spreadsheet atau extension.
