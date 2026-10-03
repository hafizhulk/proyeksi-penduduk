<?php
// Uji cepat tanpa framework. Jalankan: php tests/test_projection.php
require_once __DIR__.'/../src/Support.php';
require_once __DIR__.'/../src/Statistics.php';
require_once __DIR__.'/../src/Projection.php';
require_once __DIR__.'/../src/InputValidation.php';

$fail = 0;
function check($name, $cond) {
    global $fail;
    if ($cond) { echo "OK $name\n"; }
    else { $fail++; echo "FAIL $name\n"; }
}

$years = array(2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023);
$pops = array(220450, 228300, 236500, 244900, 253800, 263200, 273000, 283200, 294000, 305400, 317200, 329500, 342300, 355700);

// pearson: data konstan -> null, tidak NaN
check('corr-konstan-null', pearsonCorr(array(2020, 2020, 2020), array(1, 2, 3)) === null);
check('corr-konstan-y-null', pearsonCorr(array(1, 2, 3), array(5, 5, 5)) === null);

// R2 skala populasi konsisten
$r = calculateProjection($years, $pops, 2024, 2045, 5);
check('best-ada', in_array($r['bestMethod'], array('arith', 'geom', 'expo')));
check('rmse-validasi-ada', isset($r['validation']['rmse']['arith'], $r['validation']['rmse']['geom'], $r['validation']['rmse']['expo']));
check('r2-populasi', $r['r2G'] !== null && $r['r2G'] > 0.99 && $r['r2G'] < 1.0);
check('detail-validasi', count($r['validation']['actual']) === $r['validation']['count']);

// duplikat ditolak
$bad = validateProjectionInput(array(
    'projStart' => 2024, 'projEnd' => 2045, 'projInterval' => 5,
    'years' => array(2020, 2020, 2020, 2020, 2020),
    'populations' => array(1, 2, 3, 4, 5),
));
check('duplikat-ditolak', count($bad['errors']) > 0);

// rentang nol ditolak di model
$threw = false;
try { fitPopulationModels(array(2020, 2020), array(100, 200)); }
catch (InvalidArgumentException $e) { $threw = true; }
check('deltaT-nol-ditolak', $threw);

exit($fail > 0 ? 1 : 0);
