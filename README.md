# Proyeksi Pertumbuhan Penduduk

Aplikasi web sederhana (PHP) untuk **simulasi proyeksi pertumbuhan penduduk** menggunakan tiga metode: **Aritmatik**, **Geometrik**, dan **Eksponensial**. Metode terbaik dipilih otomatis berdasarkan RMSE dari validasi deret waktu (rolling validation).

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
- Berjalan di **PHP 7.0+** tanpa framework/dependensi server.

## Struktur Proyek

```
.
├── index.php              # Controller tipis (entry point)
├── calculations.php       # Shims kompatibilitas mundur
├── assets/
│   ├── styles.css         # Gaya tampilan
│   └── app.js             # Grafik & interaksi klien
├── src/
│   ├── Support.php        # Batas angka & parsing input
│   ├── Format.php         # Format angka/teks & escaping
│   ├── Statistics.php     # Korelasi, regresi, RMSE/MAE/R²
│   ├── Projection.php     # Model & proyeksi populasi
│   ├── InputValidation.php# Validasi input form
│   └── SampleData.php     # Data contoh bawaan
├── templates/
│   ├── head.php
│   ├── form.php
│   ├── results.php
│   └── foot.php
└── tests/
    └── test_projection.php# Uji cepat tanpa framework
```

## Menjalankan

Perlu PHP 7.0 atau lebih baru.

```bash
# Server pengembangan bawaan PHP
php -S localhost:8000

# Buka http://localhost:8000 di peramban
```

## Pengujian

```bash
php tests/test_projection.php
```

## Lisensi

Bebas digunakan untuk keperluan pembelajaran.
