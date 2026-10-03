<?php
// Model populasi: aritmatik, geometrik, eksponensial + validasi deret waktu.

function fitPopulationModels($years, $pops) {
    checkPairedValues($years, $pops, 2);
    $base = $years[0];
    $t = $lnP = array();
    foreach ($years as $year) $t[] = $year - $base;
    foreach ($pops as $pop) {
        if ($pop <= 0 || !is_finite((float)$pop)) throw new InvalidArgumentException('Penduduk harus positif dan berhingga.');
        $lnP[] = log($pop);
    }
    $last = count($years) - 1;
    $deltaT = $years[$last] - $base;
    if ($deltaT <= 0) throw new InvalidArgumentException('Rentang tahun historis harus lebih besar dari nol.');
    $arith = linearRegression($t, $pops);
    $expo = linearRegression($t, $lnP);
    // Hitung dalam skala log agar rasio dan laju mendekati nol tetap stabil.
    $kg = ($lnP[$last] - $lnP[0]) / $deltaT;
    $arith['base'] = $expo['base'] = $base;
    return array(
        'arith' => $arith,
        'geom' => array('base' => $base, 'p0' => $pops[0], 'k' => $kg, 'rate' => expm1($kg)),
        'expo' => $expo,
    );
}

function predictPopulation($model, $method, $year) {
    $t = $year - $model['base'];
    if ($method === 'arith') $value = max(0.0, $model['a'] + $model['b'] * $t);
    elseif ($method === 'geom') $value = $model['p0'] * exp($model['k'] * $t);
    elseif ($method === 'expo') $value = exp($model['a'] + $model['b'] * $t);
    else throw new InvalidArgumentException('Metode proyeksi tidak dikenal.');
    if (!is_finite($value) || $value > populationLimit()) {
        throw new OverflowException('Hasil proyeksi '.$method.' pada tahun '.$year.' melebihi batas angka yang didukung. Periksa data dan rentang proyeksi.');
    }
    return $value;
}

function rollingValidation($years, $pops) {
    checkPairedValues($years, $pops, 5);
    $n = count($years);
    // Sisakan minimal dua titik uji, dengan pelatihan awal 3–5 titik.
    $initial = min(5, $n - 2);
    $actual = array();
    $predictions = array('arith' => array(), 'geom' => array(), 'expo' => array());
    for ($cutoff = $initial; $cutoff < $n; $cutoff++) {
        $models = fitPopulationModels(array_slice($years, 0, $cutoff), array_slice($pops, 0, $cutoff));
        $actual[] = $pops[$cutoff];
        foreach ($models as $method => $model) {
            $predictions[$method][] = predictPopulation($model, $method, $years[$cutoff]);
        }
    }
    $scores = array();
    foreach ($predictions as $method => $pred) $scores[$method] = calcRMSE($actual, $pred);
    return array('rmse' => $scores, 'initial' => $initial, 'count' => count($actual), 'years' => array_slice($years, $initial), 'actual' => $actual, 'predictions' => $predictions);
}

function selectBestMethod($scores) {
    $min = min($scores);
    $tolerance = 1e-9 * max(1.0, $min);
    $tied = array();
    // Urutan tetap untuk metode yang setara dalam toleransi numerik.
    foreach (array('arith', 'geom', 'expo') as $method) {
        if (abs($scores[$method] - $min) <= $tolerance) $tied[] = $method;
    }
    return array('method' => $tied[0], 'tied' => $tied);
}

function calculateProjection($years, $pops, $start, $end, $interval) {
    checkPairedValues($years, $pops, 5);
    if ($interval < 1 || $end <= $start) throw new InvalidArgumentException('Pengaturan proyeksi tidak valid.');
    foreach ($years as $i => $year) {
        if ($i > 0 && $year <= $years[$i - 1]) throw new InvalidArgumentException('Tahun historis harus unik dan terurut.');
    }
    $models = fitPopulationModels($years, $pops);
    $validation = rollingValidation($years, $pops);
    $selection = selectBestMethod($validation['rmse']);
    $projYears = array();
    for ($year = $start; $year <= $end; $year += $interval) $projYears[] = $year;
    if (end($projYears) !== $end) $projYears[] = $end;
    $result = array(
        'years' => $years, 'pops' => $pops, 'base' => $years[0], 'n' => count($years),
        'ra' => $models['arith'], 're' => $models['expo'],
        'Ka' => $models['arith']['b'], 'r_g' => $models['geom']['rate'], 'k' => $models['expo']['b'],
        't' => array(), 'projYears' => $projYears,
        'validation' => $validation, 'bestMethod' => $selection['method'], 'tiedMethods' => $selection['tied'],
    );
    foreach ($years as $year) $result['t'][] = $year - $years[0];
    foreach (array('arith' => 'A', 'geom' => 'G', 'expo' => 'E') as $method => $suffix) {
        $fit = $proj = array();
        foreach ($years as $year) $fit[] = predictPopulation($models[$method], $method, $year);
        foreach ($projYears as $year) $proj[] = (int)round(predictPopulation($models[$method], $method, $year));
        $result['fit'.$suffix] = $fit;
        $result['fit'.$suffix.'R'] = array_map(function ($value) { return (int)round($value); }, $fit);
        $result['proj'.$suffix] = $proj;
        $result['rmse'.$suffix] = calcRMSE($pops, $fit);
        $result['mae'.$suffix] = calcMAE($pops, $fit);
        $result['r2'.$suffix] = calcR2($pops, $fit);
        $result['r'.$suffix] = pearsonCorr($pops, $fit);
    }
    $bestSuffix = array('arith' => 'A', 'geom' => 'G', 'expo' => 'E');
    $result['projBest'] = $result['proj'.$bestSuffix[$result['bestMethod']]];
    return $result;
}
