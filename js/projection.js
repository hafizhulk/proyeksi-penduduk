// projection.js — baca form, validasi, render hasil, grafik, ekspor CSV (hanya peramban).
var METHOD_NAMES = { arith: 'Aritmatik', geom: 'Geometrik', expo: 'Eksponensial' };
var projChart = null;

function readPostFromForm() {
  function vals(name) {
    var out = [];
    var nodes = document.querySelectorAll('#dataBody input[name="' + name + '"]');
    for (var i = 0; i < nodes.length; i++) out.push(nodes[i].value);
    return out;
  }
  return {
    projStart: document.getElementById('projStart').value,
    projEnd: document.getElementById('projEnd').value,
    projInterval: document.getElementById('projInterval').value,
    years: vals('years[]'),
    populations: vals('populations[]')
  };
}

function clearResults() {
  var box = document.getElementById('results');
  if (box) box.innerHTML = '';
  window.PROJ_DATA = null;
  if (projChart && projChart.destroy) projChart.destroy();
  projChart = null;
  var fb = document.getElementById('chartFallback');
  if (fb) fb.style.display = 'none';
}

function methodCardsHTML(R) {
  var rmsevVals = [R.validation.rmse.arith, R.validation.rmse.geom, R.validation.rmse.expo];
  var minV = Math.min.apply(null, rmsevVals);
  var methods = [
    { key: 'arith', cls: 'arith', title: 'Aritmatik',
      r: R.rA, r2: R.r2A, rmse: R.rmseA, mae: R.maeA, rmsev: R.validation.rmse.arith,
      lbl: 'Ka (jiwa/tahun)', val: fmtFloat(R.Ka, 2),
      note: 'Regresi linier P vs t' },
    { key: 'geom', cls: 'geom', title: 'Geometrik',
      r: R.rG, r2: R.r2G, rmse: R.rmseG, mae: R.maeG, rmsev: R.validation.rmse.geom,
      lbl: 'r&#x261; (laju/tahun)', val: fmtFloat(R.r_g, 6),
      note: 'Geometric mean: (P&#x2099;/P&#8320;)^(1/&Delta;t)&minus;1' },
    { key: 'expo', cls: 'expo', title: 'Eksponensial',
      r: R.rE, r2: R.r2E, rmse: R.rmseE, mae: R.maeE, rmsev: R.validation.rmse.expo,
      lbl: 'k (laju kontinu)', val: fmtFloat(R.k, 6),
      note: 'Regresi least-squares ln(P) vs t' }
  ];
  var html = '<div class="method-cards">';
  methods.forEach(function (m) {
    var isBest = m.key === R.bestMethod;
    var pct = m.rmsev !== null ? Math.round(minV / Math.max(m.rmsev, 1e-12) * 100) : 0;
    var pbarCls = m.cls === 'arith' ? 'pbar-a' : (m.cls === 'geom' ? 'pbar-g' : 'pbar-e');
    html += '<div class="mcard ' + m.cls + (isBest ? ' best-sel' : '') + '">';
    html += '<h3>' + m.title + (isBest ? '<span class="badge">TERPILIH</span>' : '') + '</h3>';
    html += '<div class="stat-row"><span class="stat-label">RMSE validasi (jiwa) (penentu)</span><span class="stat-val">' + fmtNum(m.rmsev, 0) + '</span></div>';
    html += '<div class="stat-row"><span class="stat-label">R&sup2; populasi</span><span class="stat-val">' + fmtFloat(m.r2) + '</span></div>';
    html += '<div class="stat-row"><span class="stat-label">Korelasi aktual vs fitting (r)</span><span class="stat-val">' + fmtFloat(m.r) + '</span></div>';
    html += '<div class="stat-row"><span class="stat-label">RMSE historis (jiwa)</span><span class="stat-val">' + fmtNum(m.rmse, 0) + '</span></div>';
    html += '<div class="stat-row"><span class="stat-label">MAE historis (jiwa)</span><span class="stat-val">' + fmtNum(m.mae, 0) + '</span></div>';
    html += '<div class="stat-row"><span class="stat-label">' + m.lbl + '</span><span class="stat-val">' + m.val + '</span></div>';
    html += '<div class="pbar"><div class="pbar-fill ' + pbarCls + '" style="width:' + pct + '%"></div></div>';
    html += '<div class="method-note">' + m.note + ' RMSE validasi adalah penentu terbaik.</div>';
    html += '</div>';
  });
  return html + '</div>';
}

function validationTableHTML(R) {
  var html = '<div class="card"><h2>Rincian Validasi Deret Waktu</h2>'
    + '<p class="desc">Expanding-window satu langkah ke depan: model dilatih data awal lalu diuji pada tahun berikutnya. RMSE validasi terkecil menentukan metode terpilih.</p>'
    + '<div style="overflow-x:auto"><table class="val-table"><thead><tr>'
    + '<th>Tahun uji</th><th>Aktual</th><th>Pred. Aritmatik</th><th>Pred. Geometrik</th><th>Pred. Eksponensial</th>'
    + '</tr></thead><tbody>';
  R.validation.years.forEach(function (vyr, vi) {
    html += '<tr><td><strong>' + vyr + '</strong></td>'
      + '<td>' + fmtNum(R.validation.actual[vi], 0) + '</td>'
      + '<td>' + fmtNum(R.validation.predictions.arith[vi], 0) + '</td>'
      + '<td>' + fmtNum(R.validation.predictions.geom[vi], 0) + '</td>'
      + '<td>' + fmtNum(R.validation.predictions.expo[vi], 0) + '</td></tr>';
  });
  html += '</tbody><tfoot><tr><td colspan="2">RMSE validasi</td>'
    + '<td>' + fmtNum(R.validation.rmse.arith, 0) + '</td>'
    + '<td>' + fmtNum(R.validation.rmse.geom, 0) + '</td>'
    + '<td>' + fmtNum(R.validation.rmse.expo, 0) + '</td>'
    + '</tr></tfoot></table></div></div>';
  return html;
}

function projectionTableHTML(R) {
  var html = '<div class="card"><h2>Tabel Hasil Proyeksi</h2><div class="proj-wrap"><table><thead><tr>'
    + '<th>Tahun</th>'
    + '<th style="color:#2F6FED">Aritmatik (jiwa)</th>'
    + '<th style="color:#0E9F6E">Geometrik (jiwa)</th>'
    + '<th style="color:#B45309">Eksponensial (jiwa)</th>'
    + '<th style="background:#FFFBEB">Metode Terpilih (jiwa)</th>'
    + '</tr></thead><tbody>';
  R.projYears.forEach(function (yr, i) {
    var inHist = R.years.indexOf(yr) !== -1;
    var bA = R.bestMethod === 'arith' ? 'font-weight:700;background:#EAF1FE' : '';
    var bG = R.bestMethod === 'geom' ? 'font-weight:700;background:#E9F7F0' : '';
    var bE = R.bestMethod === 'expo' ? 'font-weight:700;background:#FFFBEB' : '';
    html += '<tr' + (inHist ? ' style="background:#E9F7F0"' : '') + '>'
      + '<td><strong>' + yr + '</strong>' + (inHist ? ' <small style="color:#0E9F6E">(hist.)</small>' : '') + '</td>'
      + '<td class="num" style="' + bA + '">' + fmtNum(R.projA[i]) + '</td>'
      + '<td class="num" style="' + bG + '">' + fmtNum(R.projG[i]) + '</td>'
      + '<td class="num" style="' + bE + '">' + fmtNum(R.projE[i]) + '</td>'
      + '<td class="num" style="background:#FFFBEB;font-weight:700;color:#7C4A03">' + fmtNum(R.projBest[i]) + '</td></tr>';
  });
  return html + '</tbody></table></div></div>';
}

function fittingTableHTML(R) {
  var ssA = 0, ssG = 0, ssE = 0, html, i;
  html = '<div class="card"><h2>Tabel Data &amp; Fitting (Historis)</h2><div style="overflow-x:auto"><table>'
    + '<thead><tr><th>Tahun</th><th class="num">P Aktual</th><th class="num">t (rel)</th>'
    + '<th class="num">P&#770; Aritmatik</th><th class="num">Resid. A</th>'
    + '<th class="num">P&#770; Geometrik</th><th class="num">Resid. G</th>'
    + '<th class="num">P&#770; Eksponensial</th><th class="num">Resid. E</th>'
    + '</tr></thead><tbody>';
  for (i = 0; i < R.years.length; i++) {
    var p = R.pops[i];
    var fA = R.fitA[i], fG = R.fitG[i], fE = R.fitE[i];
    var rA = p - fA, rG = p - fG, rE = p - fE;
    ssA += rA * rA; ssG += rG * rG; ssE += rE * rE;
    var clA = Math.abs(rA) > R.rmseA ? 'res-neg' : 'res-pos';
    var clG = Math.abs(rG) > R.rmseG ? 'res-neg' : 'res-pos';
    var clE = Math.abs(rE) > R.rmseE ? 'res-neg' : 'res-pos';
    html += '<tr><td>' + R.years[i] + '</td>'
      + '<td class="num"><strong>' + fmtNum(p) + '</strong></td>'
      + '<td class="num">' + R.t[i] + '</td>'
      + '<td class="num">' + fmtNum(fA, 0) + '</td><td class="num ' + clA + '">' + fmtNum(rA, 0) + '</td>'
      + '<td class="num">' + fmtNum(fG, 0) + '</td><td class="num ' + clG + '">' + fmtNum(rG, 0) + '</td>'
      + '<td class="num">' + fmtNum(fE, 0) + '</td><td class="num ' + clE + '">' + fmtNum(rE, 0) + '</td></tr>';
  }
  html += '</tbody><tfoot><tr><td colspan="3">Jumlah Kuadrat Residual (SSE)</td>'
    + '<td colspan="2" class="num">' + fmtNum(ssA, 0) + '</td>'
    + '<td colspan="2" class="num">' + fmtNum(ssG, 0) + '</td>'
    + '<td colspan="2" class="num">' + fmtNum(ssE, 0) + '</td>'
    + '</tr></tfoot></table></div></div>';
  return html;
}

function renderResults(R) {
  var box = document.getElementById('results');
  if (!box) return;
  var bestName = METHOD_NAMES[R.bestMethod];
  var suffixMap = { arith: 'A', geom: 'G', expo: 'E' };
  var bs = suffixMap[R.bestMethod];
  var bestRMSEV = R.validation.rmse[R.bestMethod];
  var bestR2 = R['r2' + bs];
  var bestMAE = R['mae' + bs];
  var lastPop = R.projBest[R.projBest.length - 1];
  var lastYear = R.projYears[R.projYears.length - 1];
  var tiedTxt = R.tiedMethods.length > 1
    ? 'Seri dalam toleransi numerik: ' + R.tiedMethods.join(', ')
    : 'Tidak ada seri dalam toleransi numerik.';
  var html = '<div class="best-banner"><h3>Metode Terpilih: ' + esc(bestName) + '</h3><p>'
    + 'Dipilih berdasarkan <strong>RMSE validasi deret waktu terkecil</strong> (expanding-window, satu langkah ke depan).<br>'
    + 'RMSE validasi = <strong>' + fmtNum(bestRMSEV, 0) + ' jiwa</strong>'
    + ' &nbsp;|&nbsp; R&sup2; populasi = <strong>' + fmtFloat(bestR2) + '</strong>'
    + ' &nbsp;|&nbsp; MAE historis = <strong>' + fmtNum(bestMAE, 0) + ' jiwa</strong><br>'
    + esc(tiedTxt) + ' Validasi memakai ' + R.validation.count + ' titik uji'
    + ' (latih awal ' + R.validation.initial + ' titik).<br>'
    + 'Proyeksi penduduk tahun <strong>' + lastYear + '</strong>: '
    + '<span class="pop-big">' + fmtNum(lastPop) + ' jiwa</span></p></div>';
  html += '<div class="warn-box"><strong>Catatan Metodologi:</strong>'
    + ' Geometrik menggunakan <em>geometric mean rate</em> r&#x261; = (P&#x2099;/P&#8320;)^(1/&Delta;t)&minus;1 — hanya mempertimbangkan titik awal dan akhir.'
    + ' Eksponensial menggunakan <em>least-squares regression</em> pada ln(P) — meminimalkan total kuadrat residual semua data.'
    + ' R&sup2; dihitung pada skala jiwa: <em>R&sup2; = 1 &minus; SSE/SST</em>. Korelasi <em>r</em> = korelasi aktual vs fitting (tidak dipakai untuk memilih metode).</div>';
  html += methodCardsHTML(R);
  html += validationTableHTML(R);
  html += '<div class="card"><h2>Grafik Proyeksi Gabungan</h2>'
    + '<div class="btn-row" style="margin-bottom:12px">'
    + '<button type="button" class="btn btn-warning" onclick="exportCSV()">Export CSV</button>'
    + '<button type="button" class="btn btn-secondary" onclick="window.print()">Print</button>'
    + '</div><div class="chart-wrap"><canvas id="projChart"></canvas></div>'
    + '<p id="chartFallback" style="display:none;font-size:.82rem;color:var(--muted)">Grafik tidak dapat dimuat (Chart.js dari CDN tidak tersedia). Tabel di bawah tetap dapat digunakan.</p></div>';
  html += projectionTableHTML(R);
  html += fittingTableHTML(R);
  box.innerHTML = html;
}

function chartPoints(yArr, pArr) {
  return yArr.map(function (y, i) { return { x: y, y: pArr[i] }; });
}

function drawChart(d) {
  var canvas = document.getElementById('projChart');
  if (!d || !canvas) return;
  if (typeof Chart === 'undefined') {
    var fb = document.getElementById('chartFallback');
    if (fb) fb.style.display = 'block';
    return;
  }
  if (projChart && projChart.destroy) projChart.destroy();
  projChart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: { datasets: [
      { label: 'Data Historis', data: chartPoints(d.histYears, d.histPops), type: 'scatter',
        backgroundColor: '#1E3A5F', pointRadius: 6, pointHoverRadius: 8, order: 0 },
      { label: 'Fit Aritmatik', data: chartPoints(d.histYears, d.fitAR),
        borderColor: 'rgba(47,111,237,.4)', borderDash: [5, 3], borderWidth: 1.5, fill: false, pointRadius: 0 },
      { label: 'Fit Geometrik', data: chartPoints(d.histYears, d.fitGR),
        borderColor: 'rgba(14,159,110,.45)', borderDash: [5, 3], borderWidth: 1.5, fill: false, pointRadius: 0 },
      { label: 'Fit Eksponensial', data: chartPoints(d.histYears, d.fitER),
        borderColor: 'rgba(180,83,9,.45)', borderDash: [5, 3], borderWidth: 1.5, fill: false, pointRadius: 0 },
      { label: 'Proyeksi Aritmatik', data: chartPoints(d.projYears, d.projA),
        borderColor: '#2F6FED', borderWidth: 2.5, fill: false, tension: 0.1, pointRadius: 3 },
      { label: 'Proyeksi Geometrik', data: chartPoints(d.projYears, d.projG),
        borderColor: '#0E9F6E', borderWidth: 2.5, fill: false, tension: 0.1, pointRadius: 3 },
      { label: 'Proyeksi Eksponensial', data: chartPoints(d.projYears, d.projE),
        borderColor: '#B45309', borderWidth: 2.5, fill: false, tension: 0.1, pointRadius: 3 }
    ]},
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', labels: { usePointStyle: true, padding: 13, font: { size: 11 } } },
        tooltip: { callbacks: { label: function (c) { return c.dataset.label + ': ' + parseInt(c.parsed.y, 10).toLocaleString('id-ID') + ' jiwa'; } } }
      },
      scales: {
        x: { type: 'linear', title: { display: true, text: 'Tahun' }, ticks: { stepSize: 5, callback: function (v) { return Math.round(v); } } },
        y: { title: { display: true, text: 'Jumlah Penduduk (jiwa)' }, ticks: { callback: function (v) { return parseInt(v, 10).toLocaleString('id-ID'); } } }
      }
    }
  });
}

function exportCSV() {
  var d = window.PROJ_DATA;
  if (!d) return;
  var bd = d.best === 'arith' ? d.projA : (d.best === 'geom' ? d.projG : d.projE);
  var csv = 'Tahun,Aritmatik,Geometrik,Eksponensial,Terpilih (' + (METHOD_NAMES[d.best] || d.best) + ')\n';
  for (var i = 0; i < d.projYears.length; i++) {
    csv += d.projYears[i] + ',' + d.projA[i] + ',' + d.projG[i] + ',' + d.projE[i] + ',' + bd[i] + '\n';
  }
  var a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
  a.download = 'proyeksi_penduduk.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function calculateAndRender() {
  var input = validateProjectionInput(readPostFromForm());
  if (input.errors.length > 0) {
    showMessages(input.errors, null);
    clearResults();
    return false;
  }
  var years = input.data.map(function (d) { return d.year; });
  var pops = input.data.map(function (d) { return d.pop; });
  var settings = input.settings;
  var R;
  try {
    R = calculateProjection(years, pops, settings.projStart, settings.projEnd, settings.projInterval);
  } catch (e) {
    showMessages([e.message], null);
    clearResults();
    return false;
  }
  showMessages([], 'Proyeksi berhasil dihitung. Scroll ke bawah untuk hasil.');
  renderResults(R);
  window.PROJ_DATA = {
    histYears: R.years.slice(),
    histPops: R.pops.slice(),
    projYears: R.projYears.slice(),
    projA: R.projA.slice(),
    projG: R.projG.slice(),
    projE: R.projE.slice(),
    fitAR: R.fitAR.slice(),
    fitGR: R.fitGR.slice(),
    fitER: R.fitER.slice(),
    best: R.bestMethod
  };
  drawChart(window.PROJ_DATA);
  return true;
}
