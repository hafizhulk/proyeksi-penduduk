// app.js — init (hanya peramban). Berkas calculations/ui/projection dimuat sebelum berkas ini.
(function () {
  'use strict';
  loadSample();
  var form = document.getElementById('mainForm');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      calculateAndRender();
    });
  }
})();
