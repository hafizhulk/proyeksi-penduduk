<?php
// Support dasar: batas angka dan parsing input. PHP 7.0+ compatible.

function populationLimit() {
    // Bilangan bulat harus tetap aman untuk PHP dan grafik JavaScript.
    return min(PHP_INT_MAX, 9007199254740991);
}

function inputText($value) {
    return is_scalar($value) && !is_bool($value) ? trim((string)$value) : '';
}

function parseIntegerInput($value, $min, $max) {
    $text = inputText($value);
    if ($text === '' || !is_numeric($text)) return null;
    $number = (float)$text;
    if (!is_finite($number) || floor($number) != $number || $number < $min || $number > $max) return null;
    return (int)$number;
}
