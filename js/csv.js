// csv.js — parser CSV sederhana untuk data historis penduduk (murni tanpa DOM).
// Format: setiap baris = "Tahun,Jumlah Penduduk" (tanpa header, delimiter koma).
// Berkas ini tidak menyentuh DOM; aman dipakai di Node maupun peramban.
'use strict';

// Pisahkan satu baris CSV menjadi field; mendukung field berkutip ("...").
function splitCsvLine(line) {
  var fields = [];
  var current = '';
  var inQuotes = false;
  for (var i = 0; i < line.length; i++) {
    var ch = line.charAt(i);
    if (inQuotes) {
      if (ch === '"') {
        if (line.charAt(i + 1) === '"') { current += '"'; i++; }
        else inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

// Ubah teks CSV menjadi daftar pasangan [tahun, penduduk] (string, belum divalidasi angka).
function parsePopulationCsv(text) {
  var rows = [];
  var errors = [];
  if (typeof text !== 'string') {
    return { rows: rows, errors: ['File CSV tidak dapat dibaca.'], count: 0 };
  }
  // Buang BOM di awal dan seragamkan akhir baris (CRLF/CR -> LF).
  var clean = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  var lines = clean.split('\n');
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    var fields = splitCsvLine(lines[i]);
    for (var f = 0; f < fields.length; f++) fields[f] = fields[f].trim();
    if (fields.length !== 2) {
      errors.push('Baris ' + (i + 1) + ': format harus "Tahun,Jumlah Penduduk".');
      continue;
    }
    rows.push([fields[0], fields[1]]);
  }
  if (rows.length === 0 && errors.length === 0) {
    errors.push('File CSV tidak berisi data.');
  }
  return { rows: rows, errors: errors, count: rows.length };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    splitCsvLine: splitCsvLine,
    parsePopulationCsv: parsePopulationCsv
  };
}
