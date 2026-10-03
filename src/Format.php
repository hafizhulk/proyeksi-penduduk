<?php
// Format tampilan. PHP 7.0+ compatible.

function fmtNum($v, $d = 0) {
    return $v === null || !is_finite((float)$v) ? '—' : number_format((float)$v, $d, ',', '.');
}

function fmtFloat($v, $d = 4) {
    return $v === null || !is_finite((float)$v) ? '—' : number_format((float)$v, $d, '.', '');
}

function esc($value) {
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}
