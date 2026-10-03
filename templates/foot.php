<?php /* Penutup halaman + data JSON untuk app.js. Butuh: $sampleData, $result. */ ?>
</div>
<script>
window.SAMPLE_DATA = <?php echo json_encode($sampleData); ?>;
<?php if ($result): ?>
window.PROJ_DATA = <?php echo json_encode(array(
    'histYears' => array_values($result['years']),
    'histPops' => array_values($result['pops']),
    'projYears' => array_values($result['projYears']),
    'projA' => array_values($result['projA']),
    'projG' => array_values($result['projG']),
    'projE' => array_values($result['projE']),
    'fitAR' => array_values($result['fitAR']),
    'fitGR' => array_values($result['fitGR']),
    'fitER' => array_values($result['fitER']),
    'best' => $result['bestMethod'],
)); ?>;
<?php endif; ?>
</script>
<script src="assets/app.js"></script>
</body>
</html>
