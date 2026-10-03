<?php
// PROYEKSI PERTUMBUHAN PENDUDUK — controller tipis. PHP 7.0+ compatible.
require_once __DIR__.'/src/Support.php';
require_once __DIR__.'/src/Format.php';
require_once __DIR__.'/src/Statistics.php';
require_once __DIR__.'/src/Projection.php';
require_once __DIR__.'/src/InputValidation.php';
require_once __DIR__.'/src/SampleData.php';

$sampleData = samplePopulationData();
$result = null;
$errors = array();
$formData = array('years' => array(), 'pops' => array(), 'projStart' => 2024, 'projEnd' => 2045, 'projInterval' => 5);
$submitted = isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'POST';

if ($submitted) {
    $input = validateProjectionInput($_POST);
    $errors = $input['errors'];
    $formData = $input['formData'];
    if (empty($errors)) {
        $years = array_column($input['data'], 'year');
        $pops = array_column($input['data'], 'pop');
        $settings = $input['settings'];
        try {
            $result = calculateProjection($years, $pops, $settings['projStart'], $settings['projEnd'], $settings['projInterval']);
        } catch (InvalidArgumentException $e) {
            $errors[] = $e->getMessage();
        } catch (OverflowException $e) {
            $errors[] = $e->getMessage();
        }
    }
}

$mNames = array('arith' => 'Aritmatik', 'geom' => 'Geometrik', 'expo' => 'Eksponensial');

require __DIR__.'/templates/head.php';
require __DIR__.'/templates/form.php';
if ($result) {
    $R = $result;
    require __DIR__.'/templates/results.php';
}
require __DIR__.'/templates/foot.php';
