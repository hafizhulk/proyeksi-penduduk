/* Proyeksi Penduduk — form dinamis + grafik + ekspor CSV. */
(function () {
  'use strict';

  function renumber() {
    var rows = document.querySelectorAll('#dataBody tr');
    for (var i = 0; i < rows.length; i++) rows[i].cells[0].textContent = i + 1;
  }

  window.addRow = function (yr, pp) {
    yr = yr === undefined ? '' : yr;
    pp = pp === undefined ? '' : pp;
    var tb = document.getElementById('dataBody');
    if (!tb) return;
    var idx = tb.rows.length + 1;
    var tr = document.createElement('tr');
    var td0 = document.createElement('td');
    td0.style.color = '#94a3b8';
    td0.style.fontSize = '.78rem';
    td0.textContent = idx;
    var td1 = document.createElement('td');
    var td2 = document.createElement('td');
    var td3 = document.createElement('td');
    var inY = document.createElement('input');
    inY.type = 'number'; inY.name = 'years[]'; inY.placeholder = 'Tahun';
    inY.min = '1800'; inY.max = '2200'; inY.required = true; inY.value = yr;
    var inP = document.createElement('input');
    inP.type = 'number'; inP.name = 'populations[]'; inP.placeholder = 'Jumlah Penduduk';
    inP.min = '1'; inP.required = true; inP.value = pp;
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'btn btn-danger'; btn.textContent = 'Hapus';
    btn.setAttribute('onclick', 'removeRow(this)');
    td1.appendChild(inY); td2.appendChild(inP); td3.appendChild(btn);
    tr.appendChild(td0); tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3);
    tb.appendChild(tr);
    renumber();
  };

  window.removeRow = function (btn) {
    var tr = btn.closest ? btn.closest('tr') : btn.parentNode.parentNode;
    if (tr && tr.parentNode) tr.parentNode.removeChild(tr);
    renumber();
  };

  window.clearRows = function () {
    var tb = document.getElementById('dataBody');
    if (tb) tb.innerHTML = '';
  };

  window.loadSample = function () {
    window.clearRows();
    var data = window.SAMPLE_DATA || [];
    for (var i = 0; i < data.length; i++) window.addRow(data[i][0], data[i][1]);
  };

  window.exportCSV = function () {
    var d = window.PROJ_DATA;
    if (!d) return;
    var names = { arith: 'Aritmatik', geom: 'Geometrik', expo: 'Eksponensial' };
    var bd = d.best === 'arith' ? d.projA : (d.best === 'geom' ? d.projG : d.projE);
    var csv = 'Tahun,Aritmatik,Geometrik,Eksponensial,Terpilih (' + (names[d.best] || d.best) + ')\n';
    for (var i = 0; i < d.projYears.length; i++) {
      csv += d.projYears[i] + ',' + d.projA[i] + ',' + d.projG[i] + ',' + d.projE[i] + ',' + bd[i] + '\n';
    }
    var a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
    a.download = 'proyeksi_penduduk.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  function pts(yArr, pArr) {
    return yArr.map(function (y, i) { return { x: y, y: pArr[i] }; });
  }

  function initChart() {
    var d = window.PROJ_DATA;
    var canvas = document.getElementById('projChart');
    if (!d || !canvas) return;
    if (typeof Chart === 'undefined') {
      var fb = document.getElementById('chartFallback');
      if (fb) fb.style.display = 'block';
      return;
    }
    new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: { datasets: [
        { label: 'Data Historis', data: pts(d.histYears, d.histPops), type: 'scatter',
          backgroundColor: '#1E3A5F', pointRadius: 6, pointHoverRadius: 8, order: 0 },
        { label: 'Fit Aritmatik', data: pts(d.histYears, d.fitAR),
          borderColor: 'rgba(47,111,237,.4)', borderDash: [5, 3], borderWidth: 1.5, fill: false, pointRadius: 0 },
        { label: 'Fit Geometrik', data: pts(d.histYears, d.fitGR),
          borderColor: 'rgba(14,159,110,.45)', borderDash: [5, 3], borderWidth: 1.5, fill: false, pointRadius: 0 },
        { label: 'Fit Eksponensial', data: pts(d.histYears, d.fitER),
          borderColor: 'rgba(180,83,9,.45)', borderDash: [5, 3], borderWidth: 1.5, fill: false, pointRadius: 0 },
        { label: 'Proyeksi Aritmatik', data: pts(d.projYears, d.projA),
          borderColor: '#2F6FED', borderWidth: 2.5, fill: false, tension: 0.1, pointRadius: 3 },
        { label: 'Proyeksi Geometrik', data: pts(d.projYears, d.projG),
          borderColor: '#0E9F6E', borderWidth: 2.5, fill: false, tension: 0.1, pointRadius: 3 },
        { label: 'Proyeksi Eksponensial', data: pts(d.projYears, d.projE),
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChart);
  } else {
    initChart();
  }
})();
