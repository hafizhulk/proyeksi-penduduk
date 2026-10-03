// ui.js — helper DOM + baris form dinamis (hanya peramban).
function sv(id, value) {
  var e = document.getElementById(id);
  if (e) e.textContent = value;
}

function showMessages(errors, okText) {
  var box = document.getElementById('formMessages');
  if (!box) return;
  box.innerHTML = '';
  (errors || []).forEach(function (msg) {
    var div = document.createElement('div');
    div.className = 'alert alert-err';
    var strong = document.createElement('strong');
    strong.textContent = 'Peringatan: ';
    div.appendChild(strong);
    div.appendChild(document.createTextNode(msg));
    box.appendChild(div);
  });
  if ((!errors || errors.length === 0) && okText) {
    var ok = document.createElement('div');
    ok.className = 'alert alert-ok';
    var s = document.createElement('strong');
    s.textContent = 'Berhasil: ';
    ok.appendChild(s);
    ok.appendChild(document.createTextNode(okText));
    box.appendChild(ok);
  }
}

function renumberRows() {
  var rows = document.querySelectorAll('#dataBody tr');
  for (var i = 0; i < rows.length; i++) rows[i].cells[0].textContent = i + 1;
}

function addRow(yr, pp) {
  yr = yr === undefined ? '' : yr;
  pp = pp === undefined ? '' : pp;
  var tb = document.getElementById('dataBody');
  if (!tb) return;
  var tr = document.createElement('tr');
  var td0 = document.createElement('td');
  td0.style.color = '#94a3b8';
  td0.style.fontSize = '.78rem';
  td0.textContent = tb.rows.length + 1;
  var td1 = document.createElement('td');
  var td2 = document.createElement('td');
  var td3 = document.createElement('td');
  var inY = document.createElement('input');
  inY.type = 'number'; inY.name = 'years[]'; inY.placeholder = 'Tahun';
  inY.min = '1800'; inY.max = '2200'; inY.required = true;
  inY.value = yr;
  var inP = document.createElement('input');
  inP.type = 'number'; inP.name = 'populations[]'; inP.placeholder = 'Jumlah Penduduk';
  inP.min = '1'; inP.required = true;
  inP.value = pp;
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'btn btn-danger'; btn.textContent = 'Hapus';
  btn.setAttribute('onclick', 'removeRow(this)');
  td1.appendChild(inY); td2.appendChild(inP); td3.appendChild(btn);
  tr.appendChild(td0); tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3);
  tb.appendChild(tr);
  renumberRows();
}

function removeRow(btn) {
  var tr = btn.closest ? btn.closest('tr') : btn.parentNode.parentNode;
  if (tr && tr.parentNode) tr.parentNode.removeChild(tr);
  renumberRows();
}

function clearRows() {
  var tb = document.getElementById('dataBody');
  if (tb) tb.innerHTML = '';
}

function loadSample() {
  clearRows();
  var data = samplePopulationData();
  for (var i = 0; i < data.length; i++) addRow(data[i][0], data[i][1]);
}
