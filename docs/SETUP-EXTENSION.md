# Setup Extension Chrome

## Satu Chrome Profile = satu worker

Jika ingin 4 akun Google berbeda:
- Profile 1 → extension terpasang
- Profile 2 → extension terpasang
- Profile 3 → extension terpasang
- Profile 4 → extension terpasang

Masing-masing profile mempunyai cookie/session sendiri.

## Install
1. Buka `chrome://extensions`
2. Aktifkan **Developer mode**
3. Klik **Load unpacked**
4. Pilih folder `extension-google`

Lakukan pada setiap Chrome Profile.

## Isi Options
Contoh Profile 1:

- Apps Script URL: URL `/exec`
- Device name: `Laptop-Ihsan`
- Profile name: `Account-1`
- Device group: `laptop-ihsan`
- Worker token: sama dengan `WORKER_TOKEN` di Apps Script

Profile 2:

- Device name: `Laptop-Ihsan`
- Profile name: `Account-2`
- group: `laptop-ihsan`

dan seterusnya.

## Status
Extension akan sync sekitar 30 detik sekali.

Klik icon extension → `Sync sekarang` untuk tes manual.
