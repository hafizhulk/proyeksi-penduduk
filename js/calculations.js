// Proyeksi Penduduk — perhitungan murni (port 1:1 dari kode PHP di src/).
// Berkas ini tidak menyentuh DOM; aman dipakai di Node maupun peramban.
'use strict';

function populationLimit() {
  // Bilangan bulat harus tetap aman untuk PHP dan grafik JavaScript.
  return 9007199254740991;
}

function inputText(value) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value).trim();
  return '';
}

function isNumericText(text) {
  // Setara is_numeric() PHP untuk teks yang sudah di-trim:
  // desimal + notasi eksponen saja (tanpa heksa/biner/Infinity).
  return /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(text);
}

function parseIntegerInput(value, min, max) {
  var text = inputText(value);
  if (text === '' || !isNumericText(text)) return null;
  var number = Number(text);
  if (!Number.isFinite(number) || Math.floor(number) !== number || number < min || number > max) return null;
  return number === 0 ? 0 : number;
}

// Pembulatan ala PHP number_format/round: setengah menjauhi nol.
function phpRoundHalfAway(value, decimals) {
  var f = Math.pow(10, decimals);
  var scaled = Math.round(Math.abs(value) * f);
  if (scaled === 0) return 0;
  return (value < 0 ? -scaled : scaled) / f;
}

function groupThousands(digits, sep) {
  var sign = '';
  if (digits.charAt(0) === '-') { sign = '-'; digits = digits.slice(1); }
  var out = '';
  while (digits.length > 3) { out = sep + digits.slice(-3) + out; digits = digits.slice(0, -3); }
  return sign + digits + out;
}

function fmtNum(v, d) {
  if (d === undefined) d = 0;
  if (v === null || v === undefined) return '—';
  var num = Number(v);
  if (!Number.isFinite(num)) return '—';
  var r = phpRoundHalfAway(num, d);
  if (!Number.isFinite(r)) return '—';
  var parts = r.toFixed(d).split('.');
  var head = groupThousands(parts[0], '.');
  return d > 0 ? head + ',' + parts[1] : head;
}

function fmtFloat(v, d) {
  if (d === undefined) d = 4;
  if (v === null || v === undefined) return '—';
  var num = Number(v);
  if (!Number.isFinite(num)) return '—';
  var r = phpRoundHalfAway(num, d);
  if (!Number.isFinite(r)) return '—';
  return r.toFixed(d);
}

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function checkPairedValues(x, y, minCount) {
  if (minCount === undefined) minCount = 1;
  if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length || x.length < minCount) {
    throw new Error('Data berpasangan tidak lengkap.');
  }
}

function pearsonCorr(x, y) {
  checkPairedValues(x, y);
  if (x.length < 2) return null;
  var minX = x[0], maxX = x[0], minY = y[0], maxY = y[0], i;
  for (i = 1; i < x.length; i++) {
    if (x[i] < minX) minX = x[i];
    if (x[i] > maxX) maxX = x[i];
    if (y[i] < minY) minY = y[i];
    if (y[i] > maxY) maxY = y[i];
  }
  if (minX === maxX || minY === maxY) return null;
  var mx = 0, my = 0;
  for (i = 0; i < x.length; i++) { mx += x[i]; my += y[i]; }
  mx /= x.length; my /= y.length;
  var num = 0, ssxx = 0, ssyy = 0, dx, dy;
  for (i = 0; i < x.length; i++) {
    dx = x[i] - mx;
    dy = y[i] - my;
    num += dx * dy;
    ssxx += dx * dx;
    ssyy += dy * dy;
  }
  if (ssxx <= 0 || ssyy <= 0) return null;
  return Math.max(-1.0, Math.min(1.0, num / (Math.sqrt(ssxx) * Math.sqrt(ssyy))));
}

function linearRegression(x, y) {
  checkPairedValues(x, y, 2);
  var mx = 0, my = 0, i;
  for (i = 0; i < x.length; i++) { mx += x[i]; my += y[i]; }
  mx /= x.length; my /= y.length;
  var sxx = 0, sxy = 0, dx;
  for (i = 0; i < x.length; i++) {
    dx = x[i] - mx;
    sxx += dx * dx;
    sxy += dx * (y[i] - my);
  }
  if (sxx <= 0) throw new Error('Regresi memerlukan tahun yang berbeda.');
  var b = sxy / sxx;
  return { a: my - b * mx, b: b, r: pearsonCorr(x, y) };
}

function calcSSE(obs, pred) {
  checkPairedValues(obs, pred);
  var ss = 0;
  for (var i = 0; i < obs.length; i++) ss += Math.pow(obs[i] - pred[i], 2);
  return ss;
}

function calcRMSE(obs, pred) {
  return Math.sqrt(calcSSE(obs, pred) / obs.length);
}

function calcMAE(obs, pred) {
  checkPairedValues(obs, pred);
  var sum = 0;
  for (var i = 0; i < obs.length; i++) sum += Math.abs(obs[i] - pred[i]);
  return sum / obs.length;
}

function calcR2(obs, pred) {
  checkPairedValues(obs, pred);
  var min = obs[0], max = obs[0], i;
  for (i = 1; i < obs.length; i++) {
    if (obs[i] < min) min = obs[i];
    if (obs[i] > max) max = obs[i];
  }
  if (min === max) return null;
  var mean = 0;
  for (i = 0; i < obs.length; i++) mean += obs[i];
  mean /= obs.length;
  var sst = 0;
  for (i = 0; i < obs.length; i++) sst += Math.pow(obs[i] - mean, 2);
  return sst > 0 ? 1 - calcSSE(obs, pred) / sst : null;
}

function fitPopulationModels(years, pops) {
  checkPairedValues(years, pops, 2);
  var base = years[0];
  var t = [], lnP = [], i;
  for (i = 0; i < years.length; i++) t.push(years[i] - base);
  for (i = 0; i < pops.length; i++) {
    if (!(pops[i] > 0) || !Number.isFinite(Number(pops[i]))) {
      throw new Error('Penduduk harus positif dan berhingga.');
    }
    lnP.push(Math.log(pops[i]));
  }
  var last = years.length - 1;
  var deltaT = years[last] - base;
  if (deltaT <= 0) throw new Error('Rentang tahun historis harus lebih besar dari nol.');
  var arith = linearRegression(t, pops);
  var expo = linearRegression(t, lnP);
  // Hitung dalam skala log agar rasio dan laju mendekati nol tetap stabil.
  var kg = (lnP[last] - lnP[0]) / deltaT;
  arith.base = base;
  expo.base = base;
  return {
    arith: arith,
    geom: { base: base, p0: pops[0], k: kg, rate: Math.expm1(kg) },
    expo: expo
  };
}

function predictPopulation(model, method, year) {
  var t = year - model.base;
  var value;
  if (method === 'arith') value = Math.max(0.0, model.a + model.b * t);
  else if (method === 'geom') value = model.p0 * Math.exp(model.k * t);
  else if (method === 'expo') value = Math.exp(model.a + model.b * t);
  else throw new Error('Metode proyeksi tidak dikenal.');
  if (!Number.isFinite(value) || value > populationLimit()) {
    throw new Error('Hasil proyeksi ' + method + ' pada tahun ' + year + ' melebihi batas angka yang didukung. Periksa data dan rentang proyeksi.');
  }
  return value;
}

function rollingValidation(years, pops) {
  checkPairedValues(years, pops, 5);
  var n = years.length;
  // Sisakan minimal dua titik uji, dengan pelatihan awal 3–5 titik.
  var initial = Math.min(5, n - 2);
  var actual = [];
  var predictions = { arith: [], geom: [], expo: [] };
  for (var cutoff = initial; cutoff < n; cutoff++) {
    var models = fitPopulationModels(years.slice(0, cutoff), pops.slice(0, cutoff));
    actual.push(pops[cutoff]);
    for (var method in models) {
      if (Object.prototype.hasOwnProperty.call(models, method)) {
        predictions[method].push(predictPopulation(models[method], method, years[cutoff]));
      }
    }
  }
  var scores = {};
  for (var m in predictions) {
    if (Object.prototype.hasOwnProperty.call(predictions, m)) scores[m] = calcRMSE(actual, predictions[m]);
  }
  return {
    rmse: scores,
    initial: initial,
    count: actual.length,
    years: years.slice(initial),
    actual: actual,
    predictions: predictions
  };
}

function selectBestMethod(scores) {
  var min = Math.min(scores.arith, scores.geom, scores.expo);
  var tolerance = 1e-9 * Math.max(1.0, min);
  var tied = [];
  // Urutan tetap untuk metode yang setara dalam toleransi numerik.
  var order = ['arith', 'geom', 'expo'];
  for (var i = 0; i < order.length; i++) {
    var method = order[i];
    if (Math.abs(scores[method] - min) <= tolerance) tied.push(method);
  }
  return { method: tied[0], tied: tied };
}

function calculateProjection(years, pops, start, end, interval) {
  checkPairedValues(years, pops, 5);
  if (interval < 1 || end <= start) throw new Error('Pengaturan proyeksi tidak valid.');
  for (var i = 0; i < years.length; i++) {
    if (i > 0 && years[i] <= years[i - 1]) throw new Error('Tahun historis harus unik dan terurut.');
  }
  var models = fitPopulationModels(years, pops);
  var validation = rollingValidation(years, pops);
  var selection = selectBestMethod(validation.rmse);
  var projYears = [];
  for (var year = start; year <= end; year += interval) projYears.push(year);
  if (projYears[projYears.length - 1] !== end) projYears.push(end);
  var result = {
    years: years, pops: pops, base: years[0], n: years.length,
    ra: models.arith, re: models.expo,
    Ka: models.arith.b, r_g: models.geom.rate, k: models.expo.b,
    t: [], projYears: projYears,
    validation: validation, bestMethod: selection.method, tiedMethods: selection.tied
  };
  for (i = 0; i < years.length; i++) result.t.push(years[i] - years[0]);
  var defs = { arith: 'A', geom: 'G', expo: 'E' };
  for (var method in defs) {
    if (!Object.prototype.hasOwnProperty.call(defs, method)) continue;
    var suffix = defs[method];
    var fit = [], proj = [], j;
    for (j = 0; j < years.length; j++) fit.push(predictPopulation(models[method], method, years[j]));
    for (j = 0; j < projYears.length; j++) proj.push(Math.round(predictPopulation(models[method], method, projYears[j])));
    result['fit' + suffix] = fit;
    result['fit' + suffix + 'R'] = fit.map(function (value) { return Math.round(value); });
    result['proj' + suffix] = proj;
    result['rmse' + suffix] = calcRMSE(pops, fit);
    result['mae' + suffix] = calcMAE(pops, fit);
    result['r2' + suffix] = calcR2(pops, fit);
    result['r' + suffix] = pearsonCorr(pops, fit);
  }
  var bestSuffix = { arith: 'A', geom: 'G', expo: 'E' };
  result.projBest = result['proj' + bestSuffix[result.bestMethod]];
  return result;
}

function validateProjectionInput(post) {
  post = post || {};
  var errors = [];
  var form = { years: [], pops: [] };
  var settings = {
    projStart: [2024, 1900, 2200],
    projEnd: [2045, 1900, 2200],
    projInterval: [5, 1, 20]
  };
  var labels = { projStart: 'Tahun mulai', projEnd: 'Tahun akhir', projInterval: 'Interval' };
  var parsed = {};
  for (var key in settings) {
    if (!Object.prototype.hasOwnProperty.call(settings, key)) continue;
    var range = settings[key];
    var raw = (post[key] === undefined || post[key] === null) ? range[0] : post[key];
    form[key] = inputText(raw);
    parsed[key] = parseIntegerInput(raw, range[1], range[2]);
    if (parsed[key] === null) errors.push(labels[key] + ' harus berupa bilangan bulat antara ' + range[1] + ' dan ' + range[2] + '.');
  }
  if (parsed.projStart !== null && parsed.projEnd !== null && parsed.projEnd <= parsed.projStart) {
    errors.push('Tahun akhir proyeksi harus lebih besar dari tahun mulai.');
  }

  var rawYears = post.years === undefined ? [] : post.years;
  var rawPops = post.populations === undefined ? [] : post.populations;
  if (!Array.isArray(rawYears) || !Array.isArray(rawPops)) {
    errors.push('Data tahun dan penduduk harus berupa daftar baris.');
    rawYears = [];
    rawPops = [];
  }
  rawYears = rawYears.slice();
  rawPops = rawPops.slice();
  if (rawYears.length !== rawPops.length) errors.push('Setiap tahun harus memiliki pasangan jumlah penduduk.');
  var rows = Math.max(rawYears.length, rawPops.length);
  // Ada paling banyak 401 tahun unik dalam rentang yang diterima.
  if (rows > 401) errors.push('Jumlah baris melebihi rentang tahun 1800–2200.');
  var data = [];
  var seen = {};
  var limit = Math.min(rows, 401);
  for (var idx = 0; idx < limit; idx++) {
    var yearText = inputText(idx < rawYears.length ? rawYears[idx] : '');
    var popText = inputText(idx < rawPops.length ? rawPops[idx] : '');
    // Pertahankan baris yang salah agar pengguna dapat memperbaikinya.
    form.years.push(yearText);
    form.pops.push(popText);
    var yr = parseIntegerInput(yearText, 1800, 2200);
    var pp = parseIntegerInput(popText, 1, populationLimit());
    if (yr === null) errors.push('Baris ' + (idx + 1) + ': tahun harus berupa bilangan bulat antara 1800 dan 2200.');
    if (pp === null) errors.push('Baris ' + (idx + 1) + ': penduduk harus berupa bilangan bulat positif tanpa pemisah ribuan dan dalam batas angka yang didukung.');
    if (yr !== null) {
      if (Object.prototype.hasOwnProperty.call(seen, yr)) {
        errors.push('Baris ' + (idx + 1) + ': tahun ' + yr + ' duplikat; gunakan satu jumlah penduduk per tahun.');
      }
      seen[yr] = true;
    }
    if (yr !== null && pp !== null) data.push({ year: yr, pop: pp });
  }
  if (data.length < 5) errors.push('Masukkan minimal 5 data valid dengan tahun yang berbeda.');
  data.sort(function (a, b) { return a.year - b.year; });
  if (data.length >= 2 && data[data.length - 1].year <= data[0].year) {
    errors.push('Rentang tahun historis harus lebih besar dari nol.');
  }
  return { errors: errors, formData: form, data: data, settings: parsed };
}

function samplePopulationData() {
  return [
    [2010, 220450], [2011, 228300], [2012, 236500],
    [2013, 244900], [2014, 253800], [2015, 263200],
    [2016, 273000], [2017, 283200], [2018, 294000],
    [2019, 305400], [2020, 317200], [2021, 329500],
    [2022, 342300], [2023, 355700]
  ];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    populationLimit: populationLimit,
    inputText: inputText,
    parseIntegerInput: parseIntegerInput,
    fmtNum: fmtNum,
    fmtFloat: fmtFloat,
    esc: esc,
    checkPairedValues: checkPairedValues,
    pearsonCorr: pearsonCorr,
    linearRegression: linearRegression,
    calcSSE: calcSSE,
    calcRMSE: calcRMSE,
    calcMAE: calcMAE,
    calcR2: calcR2,
    fitPopulationModels: fitPopulationModels,
    predictPopulation: predictPopulation,
    rollingValidation: rollingValidation,
    selectBestMethod: selectBestMethod,
    calculateProjection: calculateProjection,
    validateProjectionInput: validateProjectionInput,
    samplePopulationData: samplePopulationData
  };
}
