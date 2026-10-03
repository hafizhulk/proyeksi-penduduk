<?php
// Form input + pengaturan. Butuh: $errors, $submitted, $result, $formData, $sampleData.
$dispYears = !empty($formData['years']) ? $formData['years'] : array_column($sampleData, 0);
$dispPops = !empty($formData['pops']) ? $formData['pops'] : array_column($sampleData, 1);
?>
<form method="POST" id="mainForm">
  <div class="card">
    <h2>Input Data Historis Penduduk</h2>
    <?php if (!empty($errors)): ?>
      <?php foreach ($errors as $e): ?><div class="alert alert-err"><strong>Peringatan:</strong> <?php echo esc($e); ?></div><?php endforeach; ?>
    <?php elseif ($submitted && $result): ?>
      <div class="alert alert-ok"><strong>Berhasil:</strong> Proyeksi berhasil dihitung. Scroll ke bawah untuk hasil.</div>
    <?php endif; ?>
    <div style="overflow-x:auto">
      <table>
        <thead><tr><th>No.</th><th>Tahun</th><th>Jumlah Penduduk (jiwa)</th><th>Aksi</th></tr></thead>
        <tbody id="dataBody">
          <?php foreach ($dispYears as $idx => $yr): ?>
          <tr>
            <td style="color:#94a3b8;font-size:.78rem"><?php echo $idx + 1; ?></td>
            <td><input type="number" name="years[]" value="<?php echo esc($yr); ?>" min="1800" max="2200" required></td>
            <td><input type="number" name="populations[]" value="<?php echo esc(isset($dispPops[$idx]) ? $dispPops[$idx] : ''); ?>" min="1" required></td>
            <td><button type="button" class="btn btn-danger" onclick="removeRow(this)">Hapus</button></td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
    <div class="btn-row">
      <button type="button" class="btn btn-success" onclick="addRow()">Tambah Baris</button>
      <button type="button" class="btn btn-secondary" onclick="loadSample()">Load Contoh Data</button>
      <button type="button" class="btn btn-secondary" onclick="clearRows()">Hapus Semua</button>
    </div>
    <div class="info-box"><strong>Tips:</strong> Minimal 5 data dengan tahun berbeda (tidak harus berurutan tiap tahun). Semakin banyak data historis, semakin stabil validasi.</div>
  </div>

  <div class="card">
    <h2>Pengaturan Proyeksi</h2>
    <div class="grid3">
      <div><label for="projStart">Tahun Mulai Proyeksi</label><input id="projStart" type="number" name="projStart" value="<?php echo esc($formData['projStart']); ?>" min="1900" max="2200"></div>
      <div><label for="projEnd">Tahun Akhir Proyeksi</label><input id="projEnd" type="number" name="projEnd" value="<?php echo esc($formData['projEnd']); ?>" min="1900" max="2200"></div>
      <div><label for="projInterval">Interval (tahun)</label><input id="projInterval" type="number" name="projInterval" value="<?php echo esc($formData['projInterval']); ?>" min="1" max="20"></div>
    </div>
    <div class="sep"></div>
    <div class="formula-box">
      <div><strong style="color:var(--accent)">Aritmatik:</strong> <span class="f">Pt = a + Ka&middot;t</span> &rarr; regresi linier <span class="f">P vs t</span> &rarr; Ka = slope regresi (jiwa/th)</div>
      <div><strong style="color:var(--geom)">Geometrik:</strong> <span class="f">Pt = P&#8320;&middot;(1+r&#x261;)^t</span> &rarr; r&#x261; = (P&#x2099;/P&#8320;)^(1/&Delta;t) &minus; 1 &nbsp;<em style="color:var(--muted)">(geometric mean, titik awal &amp; akhir)</em></div>
      <div><strong style="color:var(--expo)">Eksponensial:</strong> <span class="f">Pt = e^(a + k&middot;t)</span> &rarr; k = slope regresi <span class="f">ln(P) vs t</span> &nbsp;<em style="color:var(--muted)">(least-squares seluruh data)</em></div>
    </div>
    <div style="margin-top:16px">
      <button type="submit" class="btn btn-primary" style="font-size:.97rem;padding:11px 30px">Hitung Proyeksi</button>
    </div>
  </div>
</form>
