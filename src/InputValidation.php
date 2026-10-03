<?php
// Validasi input form proyeksi.

function validateProjectionInput($post) {
    $errors = array();
    $form = array('years' => array(), 'pops' => array());
    $settings = array('projStart' => array(2024, 1900, 2200), 'projEnd' => array(2045, 1900, 2200), 'projInterval' => array(5, 1, 20));
    $labels = array('projStart' => 'Tahun mulai', 'projEnd' => 'Tahun akhir', 'projInterval' => 'Interval');
    $parsed = array();
    foreach ($settings as $key => $range) {
        $raw = isset($post[$key]) ? $post[$key] : $range[0];
        $form[$key] = inputText($raw);
        $parsed[$key] = parseIntegerInput($raw, $range[1], $range[2]);
        if ($parsed[$key] === null) $errors[] = $labels[$key].' harus berupa bilangan bulat antara '.$range[1].' dan '.$range[2].'.';
    }
    if ($parsed['projStart'] !== null && $parsed['projEnd'] !== null && $parsed['projEnd'] <= $parsed['projStart']) {
        $errors[] = 'Tahun akhir proyeksi harus lebih besar dari tahun mulai.';
    }

    $rawYears = isset($post['years']) ? $post['years'] : array();
    $rawPops = isset($post['populations']) ? $post['populations'] : array();
    if (!is_array($rawYears) || !is_array($rawPops)) {
        $errors[] = 'Data tahun dan penduduk harus berupa daftar baris.';
        $rawYears = $rawPops = array();
    }
    $rawYears = array_values($rawYears);
    $rawPops = array_values($rawPops);
    if (count($rawYears) !== count($rawPops)) $errors[] = 'Setiap tahun harus memiliki pasangan jumlah penduduk.';
    $rows = max(count($rawYears), count($rawPops));
    // Ada paling banyak 401 tahun unik dalam rentang yang diterima.
    if ($rows > 401) $errors[] = 'Jumlah baris melebihi rentang tahun 1800–2200.';
    $data = array();
    $seen = array();
    for ($i = 0; $i < min($rows, 401); $i++) {
        $yearText = inputText(isset($rawYears[$i]) ? $rawYears[$i] : '');
        $popText = inputText(isset($rawPops[$i]) ? $rawPops[$i] : '');
        // Pertahankan baris yang salah agar pengguna dapat memperbaikinya.
        $form['years'][] = $yearText;
        $form['pops'][] = $popText;
        $year = parseIntegerInput($yearText, 1800, 2200);
        $pop = parseIntegerInput($popText, 1, populationLimit());
        if ($year === null) $errors[] = 'Baris '.($i + 1).': tahun harus berupa bilangan bulat antara 1800 dan 2200.';
        if ($pop === null) $errors[] = 'Baris '.($i + 1).': penduduk harus berupa bilangan bulat positif tanpa pemisah ribuan dan dalam batas angka yang didukung.';
        if ($year !== null) {
            if (isset($seen[$year])) $errors[] = 'Baris '.($i + 1).': tahun '.$year.' duplikat; gunakan satu jumlah penduduk per tahun.';
            $seen[$year] = true;
        }
        if ($year !== null && $pop !== null) $data[] = array('year' => $year, 'pop' => $pop);
    }
    if (count($data) < 5) $errors[] = 'Masukkan minimal 5 data valid dengan tahun yang berbeda.';
    usort($data, function ($a, $b) { return $a['year'] - $b['year']; });
    if (count($data) >= 2 && $data[count($data) - 1]['year'] <= $data[0]['year']) {
        $errors[] = 'Rentang tahun historis harus lebih besar dari nol.';
    }
    return array('errors' => $errors, 'formData' => $form, 'data' => $data, 'settings' => $parsed);
}
