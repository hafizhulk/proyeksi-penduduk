<?php
// Kompatibilitas mundur: kode lama yang require calculations.php tetap berfungsi.
// Implementasi kini berada di src/*. PHP 7.0+ compatible.
require_once __DIR__.'/src/Support.php';
require_once __DIR__.'/src/Statistics.php';
require_once __DIR__.'/src/Projection.php';
require_once __DIR__.'/src/InputValidation.php';
