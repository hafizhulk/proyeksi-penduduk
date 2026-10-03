<?php
// Hasil proyeksi. Butuh: $R ($result), $mNames.
$bestName = $mNames[$R['bestMethod']];
$bestKey = $R['bestMethod'];
$bestSuffix = array('arith' => 'A', 'geom' => 'G', 'expo' => 'E');
$bs = $bestSuffix[$bestKey];
$bestRMSEV = $R['validation']['rmse'][$bestKey];
$bestR2 = $R['r2'.$bs];
$bestMAE = $R['mae'.$bs];
$projBestArr = $R['projBest'];
$lastPop = end($projBestArr);
$projYearsArr = $R['projYears'];
$lastYear = end($projYearsArr);
$tiedTxt = count($R['tiedMethods']) > 1 ? 'Seri dalam toleransi numerik: '.implode(', ', $R['tiedMethods']) : 'Tidak ada seri dalam toleransi numerik.';
$methods = array(
    array('key' => 'arith', 'cls' => 'arith', 'title' => 'Aritmatik',
          'r' => $R['rA'], 'r2' => $R['r2A'], 'rmse' => $R['rmseA'], 'mae' => $R['maeA'], 'rmsev' => $R['validation']['rmse']['arith'],
          'lbl' => 'Ka (jiwa/tahun)', 'val' => fmtFloat($R['Ka'], 2),
          'note' => 'Regresi linier P vs t'),
    array('key' => 'geom', 'cls' => 'geom', 'title' => 'Geometrik',
          'r' => $R['rG'], 'r2' => $R['r2G'], 'rmse' => $R['rmseG'], 'mae' => $R['maeG'], 'rmsev' => $R['validation']['rmse']['geom'],
          'lbl' => 'r&#x261; (laju/tahun)', 'val' => fmtFloat($R['r_g'], 6),
          'note' => 'Geometric mean: (P&#x2099;/P&#8320;)^(1/&Delta;t)&minus;1'),
    array('key' => 'expo', 'cls' => 'expo', 'title' => 'Eksponensial',
          'r' => $R['rE'], 'r2' => $R['r2E'], 'rmse' => $R['rmseE'], 'mae' => $R['maeE'], 'rmsev' => $R['validation']['rmse']['expo'],
          'lbl' => 'k (laju kontinu)', 'val' => fmtFloat($R['k'], 6),
          'note' => 'Regresi least-squares ln(P) vs t'),
);
$rmsevVals = array($R['validation']['rmse']['arith'], $R['validation']['rmse']['geom'], $R['validation']['rmse']['expo']);
$minV = min($rmsevVals);
?>

<div class="best-banner">
  <h3>Metode Terpilih: <?php echo esc($bestName); ?></h3>
  <p>
    Dipilih berdasarkan <strong>RMSE validasi deret waktu terkecil</strong> (expanding-window, satu langkah ke depan).<br>
    RMSE validasi = <strong><?php echo fmtNum($bestRMSEV, 0); ?> jiwa</strong>
    &nbsp;|&nbsp; R&sup2; populasi = <strong><?php echo fmtFloat($bestR2); ?></strong>
    &nbsp;|&nbsp; MAE historis = <strong><?php echo fmtNum($bestMAE, 0); ?> jiwa</strong><br>
    <?php echo esc($tiedTxt); ?> Validasi memakai <?php echo (int)$R['validation']['count']; ?> titik uji
    (latih awal <?php echo (int)$R['validation']['initial']; ?> titik).<br>
    Proyeksi penduduk tahun <strong><?php echo (int)$lastYear; ?></strong>:
    <span class="pop-big"><?php echo fmtNum($lastPop); ?> jiwa</span>
  </p>
</div>

<div class="warn-box">
  <strong>Catatan Metodologi:</strong>
  Geometrik menggunakan <em>geometric mean rate</em> r&#x261; = (P&#x2099;/P&#8320;)^(1/&Delta;t)&minus;1 — hanya mempertimbangkan titik awal dan akhir.
  Eksponensial menggunakan <em>least-squares regression</em> pada ln(P) — meminimalkan total kuadrat residual semua data.
  R&sup2; dihitung pada skala jiwa: <em>R&sup2; = 1 &minus; SSE/SST</em>. Korelasi <em>r</em> = korelasi aktual vs fitting (tidak dipakai untuk memilih metode).
</div>

<div class="method-cards">
<?php foreach ($methods as $m):
    $isBest = ($m['key'] === $R['bestMethod']);
    $pct = $m['rmsev'] !== null ? round($minV / max($m['rmsev'], 1e-12) * 100) : 0;
    $pbarCls = ($m['cls'] === 'arith') ? 'pbar-a' : (($m['cls'] === 'geom') ? 'pbar-g' : 'pbar-e');
?>
<div class="mcard <?php echo $m['cls']; ?><?php echo $isBest ? ' best-sel' : ''; ?>">
  <h3><?php echo $m['title']; ?><?php echo $isBest ? '<span class="badge">TERPILIH</span>' : ''; ?></h3>
  <div class="stat-row"><span class="stat-label">RMSE validasi (jiwa) (penentu)</span><span class="stat-val"><?php echo fmtNum($m['rmsev'], 0); ?></span></div>
  <div class="stat-row"><span class="stat-label">R&sup2; populasi</span><span class="stat-val"><?php echo fmtFloat($m['r2']); ?></span></div>
  <div class="stat-row"><span class="stat-label">Korelasi aktual vs fitting (r)</span><span class="stat-val"><?php echo fmtFloat($m['r']); ?></span></div>
  <div class="stat-row"><span class="stat-label">RMSE historis (jiwa)</span><span class="stat-val"><?php echo fmtNum($m['rmse'], 0); ?></span></div>
  <div class="stat-row"><span class="stat-label">MAE historis (jiwa)</span><span class="stat-val"><?php echo fmtNum($m['mae'], 0); ?></span></div>
  <div class="stat-row"><span class="stat-label"><?php echo $m['lbl']; ?></span><span class="stat-val"><?php echo $m['val']; ?></span></div>
  <div class="pbar"><div class="pbar-fill <?php echo $pbarCls; ?>" style="width:<?php echo (int)$pct; ?>%"></div></div>
  <div class="method-note"><?php echo $m['note']; ?> RMSE validasi adalah penentu terbaik.</div>
</div>
<?php endforeach; ?>
</div>

<div class="card">
  <h2>Rincian Validasi Deret Waktu</h2>
  <p class="desc">Expanding-window satu langkah ke depan: model dilatih data awal lalu diuji pada tahun berikutnya. RMSE validasi terkecil menentukan metode terpilih.</p>
  <div style="overflow-x:auto">
    <table class="val-table">
      <thead><tr>
        <th>Tahun uji</th><th>Aktual</th>
        <th>Pred. Aritmatik</th><th>Pred. Geometrik</th><th>Pred. Eksponensial</th>
      </tr></thead>
      <tbody>
      <?php foreach ($R['validation']['years'] as $vi => $vyr): ?>
      <tr>
        <td><strong><?php echo (int)$vyr; ?></strong></td>
        <td><?php echo fmtNum($R['validation']['actual'][$vi], 0); ?></td>
        <td><?php echo fmtNum($R['validation']['predictions']['arith'][$vi], 0); ?></td>
        <td><?php echo fmtNum($R['validation']['predictions']['geom'][$vi], 0); ?></td>
        <td><?php echo fmtNum($R['validation']['predictions']['expo'][$vi], 0); ?></td>
      </tr>
      <?php endforeach; ?>
      </tbody>
      <tfoot><tr>
        <td colspan="2">RMSE validasi</td>
        <td><?php echo fmtNum($R['validation']['rmse']['arith'], 0); ?></td>
        <td><?php echo fmtNum($R['validation']['rmse']['geom'], 0); ?></td>
        <td><?php echo fmtNum($R['validation']['rmse']['expo'], 0); ?></td>
      </tr></tfoot>
    </table>
  </div>
</div>

<div class="card">
  <h2>Grafik Proyeksi Gabungan</h2>
  <div class="btn-row" style="margin-bottom:12px">
    <button type="button" class="btn btn-warning" onclick="exportCSV()">Export CSV</button>
    <button type="button" class="btn btn-secondary" onclick="window.print()">Print</button>
  </div>
  <div class="chart-wrap"><canvas id="projChart"></canvas></div>
  <p id="chartFallback" style="display:none;font-size:.82rem;color:var(--muted)">Grafik tidak dapat dimuat (Chart.js dari CDN tidak tersedia). Tabel di bawah tetap dapat digunakan.</p>
</div>

<div class="card">
  <h2>Tabel Hasil Proyeksi</h2>
  <div class="proj-wrap">
    <table>
      <thead><tr>
        <th>Tahun</th>
        <th style="color:#2F6FED">Aritmatik (jiwa)</th>
        <th style="color:#0E9F6E">Geometrik (jiwa)</th>
        <th style="color:#B45309">Eksponensial (jiwa)</th>
        <th style="background:#FFFBEB">Metode Terpilih (jiwa)</th>
      </tr></thead>
      <tbody>
      <?php foreach ($R['projYears'] as $i => $yr):
        $inHist = in_array($yr, $R['years']);
        $bA = ($R['bestMethod'] === 'arith') ? 'font-weight:700;background:#EAF1FE' : '';
        $bG = ($R['bestMethod'] === 'geom') ? 'font-weight:700;background:#E9F7F0' : '';
        $bE = ($R['bestMethod'] === 'expo') ? 'font-weight:700;background:#FFFBEB' : '';
      ?>
      <tr<?php echo $inHist ? ' style="background:#E9F7F0"' : ''; ?>>
        <td><strong><?php echo (int)$yr; ?></strong><?php echo $inHist ? ' <small style="color:#0E9F6E">(hist.)</small>' : ''; ?></td>
        <td class="num" style="<?php echo $bA; ?>"><?php echo fmtNum($R['projA'][$i]); ?></td>
        <td class="num" style="<?php echo $bG; ?>"><?php echo fmtNum($R['projG'][$i]); ?></td>
        <td class="num" style="<?php echo $bE; ?>"><?php echo fmtNum($R['projE'][$i]); ?></td>
        <td class="num" style="background:#FFFBEB;font-weight:700;color:#7C4A03"><?php echo fmtNum($R['projBest'][$i]); ?></td>
      </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>

<div class="card">
  <h2>Tabel Data &amp; Fitting (Historis)</h2>
  <div style="overflow-x:auto">
    <table>
      <thead><tr>
        <th>Tahun</th><th class="num">P Aktual</th><th class="num">t (rel)</th>
        <th class="num">P&#770; Aritmatik</th><th class="num">Resid. A</th>
        <th class="num">P&#770; Geometrik</th><th class="num">Resid. G</th>
        <th class="num">P&#770; Eksponensial</th><th class="num">Resid. E</th>
      </tr></thead>
      <tbody>
      <?php
      $ssA = $ssG = $ssE = 0;
      foreach ($R['years'] as $i => $yr):
        $p = $R['pops'][$i];
        $fA = $R['fitA'][$i]; $fG = $R['fitG'][$i]; $fE = $R['fitE'][$i];
        $rA = $p - $fA; $rG = $p - $fG; $rE = $p - $fE;
        $ssA += $rA * $rA; $ssG += $rG * $rG; $ssE += $rE * $rE;
        $clA = (abs($rA) > $R['rmseA']) ? 'res-neg' : 'res-pos';
        $clG = (abs($rG) > $R['rmseG']) ? 'res-neg' : 'res-pos';
        $clE = (abs($rE) > $R['rmseE']) ? 'res-neg' : 'res-pos';
      ?>
      <tr>
        <td><?php echo (int)$yr; ?></td>
        <td class="num"><strong><?php echo fmtNum($p); ?></strong></td>
        <td class="num"><?php echo (int)$R['t'][$i]; ?></td>
        <td class="num"><?php echo fmtNum($fA, 0); ?></td><td class="num <?php echo $clA; ?>"><?php echo fmtNum($rA, 0); ?></td>
        <td class="num"><?php echo fmtNum($fG, 0); ?></td><td class="num <?php echo $clG; ?>"><?php echo fmtNum($rG, 0); ?></td>
        <td class="num"><?php echo fmtNum($fE, 0); ?></td><td class="num <?php echo $clE; ?>"><?php echo fmtNum($rE, 0); ?></td>
      </tr>
      <?php endforeach; ?>
      </tbody>
      <tfoot><tr>
        <td colspan="3">Jumlah Kuadrat Residual (SSE)</td>
        <td colspan="2" class="num"><?php echo fmtNum($ssA, 0); ?></td>
        <td colspan="2" class="num"><?php echo fmtNum($ssG, 0); ?></td>
        <td colspan="2" class="num"><?php echo fmtNum($ssE, 0); ?></td>
      </tr></tfoot>
    </table>
  </div>
</div>
