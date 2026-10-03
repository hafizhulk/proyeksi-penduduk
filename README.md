# Proyeksi Pertumbuhan Penduduk

Aplikasi web statis (tanpa PHP, tanpa build step) untuk **simulasi proyeksi pertumbuhan penduduk** menggunakan tiga metode: **Aritmatik**, **Geometrik**, dan **Eksponensial**. Metode terbaik dipilih otomatis berdasarkan RMSE dari validasi deret waktu (rolling validation).

## 🔗 Demo Langsung

Coba aplikasinya di: **https://play.reloop.id/proyeksi-penduduk**

## Fitur

- Input data historis tahun & jumlah penduduk (minimal 5 data, tahun unik).
- Tiga model proyeksi:
  - **Aritmatik** — regresi linier pada jumlah penduduk.
  - **Geometrik** — laju pertumbuhan dari geometric mean (dihitung dalam skala log agar stabil).
  - **Eksponensial** — regresi linier pada `ln(P)`.
- Validasi deret waktu (rolling validation) + pemilihan metode terbaik via RMSE.
- Metrik kelayakan model: RMSE, MAE, R², dan korelasi Pearson.
- Grafik interaktif (Chart.js) dan tabel hasil proyeksi.
- 100% statis: tidak ada server, framework, dependensi, atau build step.

## Struktur Proyek

```
.
├── index.html               # Entry point (form + wadah hasil)
├── css/
│   └── style.css            # Gaya tampilan
├── js/
│   ├── calculations.js      # Perhitungan murni tanpa DOM (port 1:1 logika PHP)
│   ├── ui.js                # Helper DOM + baris form dinamis
│   ├── projection.js        # Baca form, validasi, render hasil, grafik, CSV
│   └── app.js               # Init
└── tests/
    └── projection.test.js   # Uji Node tanpa dependensi
```

## Menjalankan

Tidak perlu PHP. Cukup sajikan folder ini sebagai situs statis dan buka `index.html`:

```bash
# Server statis apa saja, contoh:
python3 -m http.server 8000

# Buka http://localhost:8000 di peramban
```

### Deploy ke Cloudflare Pages

1. Push folder ini ke repositori Git.
2. Di Cloudflare Pages: **Create Project → Connect to Git**, tanpa build command dan tanpa output directory khusus (root).
3. Deploy — `index.html` di root otomatis menjadi halaman utama.

## Pengujian

Butuh Node.js (tanpa `npm install` apa pun):

```bash
node tests/projection.test.js
```

## Lisensi

Bebas digunakan untuk keperluan pembelajaran.
