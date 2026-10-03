<?php
// Statistik dasar. PHP 7.0+ compatible.

function checkPairedValues($x, $y, $minCount = 1) {
    if (count($x) !== count($y) || count($x) < $minCount) {
        throw new InvalidArgumentException('Data berpasangan tidak lengkap.');
    }
}

function pearsonCorr($x, $y) {
    checkPairedValues($x, $y);
    if (count($x) < 2 || min($x) == max($x) || min($y) == max($y)) return null;
    $mx = array_sum($x) / count($x);
    $my = array_sum($y) / count($y);
    $num = $ssxx = $ssyy = 0.0;
    foreach ($x as $i => $value) {
        $dx = $value - $mx;
        $dy = $y[$i] - $my;
        $num += $dx * $dy;
        $ssxx += $dx * $dx;
        $ssyy += $dy * $dy;
    }
    if ($ssxx <= 0 || $ssyy <= 0) return null;
    return max(-1.0, min(1.0, $num / (sqrt($ssxx) * sqrt($ssyy))));
}

function linearRegression($x, $y) {
    checkPairedValues($x, $y, 2);
    $mx = array_sum($x) / count($x);
    $my = array_sum($y) / count($y);
    $sxx = $sxy = 0.0;
    foreach ($x as $i => $value) {
        $dx = $value - $mx;
        $sxx += $dx * $dx;
        $sxy += $dx * ($y[$i] - $my);
    }
    if ($sxx <= 0) throw new InvalidArgumentException('Regresi memerlukan tahun yang berbeda.');
    $b = $sxy / $sxx;
    return array('a' => $my - $b * $mx, 'b' => $b, 'r' => pearsonCorr($x, $y));
}

function calcSSE($obs, $pred) {
    checkPairedValues($obs, $pred);
    $ss = 0.0;
    foreach ($obs as $i => $value) $ss += pow($value - $pred[$i], 2);
    return $ss;
}

function calcRMSE($obs, $pred) {
    return sqrt(calcSSE($obs, $pred) / count($obs));
}

function calcMAE($obs, $pred) {
    checkPairedValues($obs, $pred);
    $sum = 0.0;
    foreach ($obs as $i => $value) $sum += abs($value - $pred[$i]);
    return $sum / count($obs);
}

function calcR2($obs, $pred) {
    checkPairedValues($obs, $pred);
    if (min($obs) == max($obs)) return null;
    $mean = array_sum($obs) / count($obs);
    $sst = 0.0;
    foreach ($obs as $value) $sst += pow($value - $mean, 2);
    return $sst > 0 ? 1 - calcSSE($obs, $pred) / $sst : null;
}
