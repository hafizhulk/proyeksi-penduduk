// Uji port statis. Jalankan: node tests/projection.test.js (tanpa dependensi).
const fs = require('node:fs');
const path = require('node:path');
const calc = require(path.join(__dirname, '..', 'js', 'calculations.js'));

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log('OK ' + name); }
  else { fail++; console.log('FAIL ' + name); }
}
function near(actual, expected, tol) {
  tol = tol === undefined ? 1e-9 : tol;
  return Math.abs(actual - expected) <= tol * Math.max(1, Math.abs(expected));
}
function throwsMsg(fn, msg) {
  try { fn(); } catch (e) { return e.message === msg; }
  return false;
}

const YEARS = [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
const POPS = [220450, 228300, 236500, 244900, 253800, 263200, 273000, 283200, 294000, 305400, 317200, 329500, 342300, 355700];

// --- Port langsung tests/test_projection.php ---
check('corr-konstan-null', calc.pearsonCorr([2020, 2020, 2020], [1, 2, 3]) === null);
check('corr-konstan-y-null', calc.pearsonCorr([1, 2, 3], [5, 5, 5]) === null);

const r = calc.calculateProjection(YEARS, POPS, 2024, 2045, 5);
check('best-ada', ['arith', 'geom', 'expo'].indexOf(r.bestMethod) !== -1);
check('rmse-validasi-ada', r.validation.rmse.arith !== undefined && r.validation.rmse.geom !== undefined && r.validation.rmse.expo !== undefined);
check('r2-populasi', r.r2G !== null && r.r2G > 0.99 && r.r2G < 1.0);
check('detail-validasi', r.validation.actual.length === r.validation.count);

const bad = calc.validateProjectionInput({
  projStart: 2024, projEnd: 2045, projInterval: 5,
  years: [2020, 2020, 2020, 2020, 2020],
  populations: [1, 2, 3, 4, 5]
});
check('duplikat-ditolak', bad.errors.length > 0);
check('deltaT-nol-ditolak', throwsMsg(function () { calc.fitPopulationModels([2020, 2020], [100, 200]); }, 'Rentang tahun historis harus lebih besar dari nol.'));

// --- Kesetaraan numerik vs PHP (nilai referensi dari php -r) ---
check('best-geom', r.bestMethod === 'geom');
check('tied-geom-saja', r.tiedMethods.length === 1 && r.tiedMethods[0] === 'geom');
check('Ka', near(r.Ka, 10364.725274725275));
check('r_g', near(r.r_g, 0.03748684111621637));
check('k', near(r.k, 0.03684440293954252));
check('rmseV-arith', near(r.validation.rmse.arith, 5096.25030347605));
check('rmseV-geom', near(r.validation.rmse.geom, 488.90887673991864));
check('rmseV-expo', near(r.validation.rmse.expo, 1205.3571327486252));
check('rmseA', near(r.rmseA, 3430.0959293833744));
check('rmseG', near(r.rmseG, 1342.8735179820603));
check('rmseE', near(r.rmseE, 693.4998540869353));
check('maeA', near(r.maeA, 2997.9591836734658));
check('r2G', near(r.r2G, 0.9989739133248084));
check('rA', near(r.rA, 0.9966470655967009));
check('rE', near(r.rE, 0.9998683501832266));
check('projYears', JSON.stringify(r.projYears) === JSON.stringify([2024, 2029, 2034, 2039, 2044, 2045]));
check('projBest', JSON.stringify(r.projBest) === JSON.stringify([369034, 443588, 533203, 640922, 770404, 799284]));
check('projA', JSON.stringify(r.projA) === JSON.stringify([359696, 411520, 463343, 515167, 566991, 577355]));
check('projG-samadengan-best', JSON.stringify(r.projG) === JSON.stringify(r.projBest));
check('projE', JSON.stringify(r.projE) === JSON.stringify([367627, 441992, 531399, 638892, 768128, 796957]));
check('validasi-count-initial', r.validation.initial === 5 && r.validation.count === 9);
check('pearson-sempurna', near(calc.pearsonCorr([1, 2, 3], [2, 4, 6]), 1, 1e-12));
const lr = calc.linearRegression([0, 1, 2], [2, 4, 6]);
check('regresi-a-b', near(lr.a, 2) && near(lr.b, 2));

// --- Kasus tepi ---
const minimal = calc.calculateProjection([2000, 2001, 2002, 2003, 2004], [100, 110, 121, 133, 146], 2005, 2010, 5);
check('data-minimal-5', minimal.projYears.length > 0 && minimal.validation.count === 2 && minimal.validation.initial === 3);
check('tahun-tak-terurut-ditolak', throwsMsg(function () {
  calc.calculateProjection([2000, 2002, 2001, 2003, 2004], [100, 110, 121, 133, 146], 2005, 2010, 1);
}, 'Tahun historis harus unik dan terurut.'));
check('pop-nol-ditolak', throwsMsg(function () {
  calc.fitPopulationModels([2000, 2001, 2002], [100, 0, 121]);
}, 'Penduduk harus positif dan berhingga.'));
check('pop-negatif-ditolak', throwsMsg(function () {
  calc.fitPopulationModels([2000, 2001, 2002], [100, -5, 121]);
}, 'Penduduk harus positif dan berhingga.'));
check('rentang-proyeksi-invalid', throwsMsg(function () {
  calc.calculateProjection(YEARS, POPS, 2045, 2024, 5);
}, 'Pengaturan proyeksi tidak valid.'));
check('metode-takdikenal', throwsMsg(function () {
  calc.predictPopulation({ base: 2000, a: 1, b: 1 }, 'kuadrat', 2005);
}, 'Metode proyeksi tidak dikenal.'));
check('pasangan-taklengkap', throwsMsg(function () {
  calc.pearsonCorr([1, 2], [1]);
}, 'Data berpasangan tidak lengkap.'));
check('regresi-x-sama', throwsMsg(function () {
  calc.linearRegression([2020, 2020], [1, 2]);
}, 'Regresi memerlukan tahun yang berbeda.'));
const tie = calc.selectBestMethod({ arith: 100, geom: 100, expo: 100 });
check('seri-urut-tetap', tie.method === 'arith' && tie.tied.length === 3);
check('limit-2pangkat53-kurang1', calc.populationLimit() === 9007199254740991);

// --- Pesan validasi dipertahankan sama persis ---
function hasErr(res, msg) { return res.errors.indexOf(msg) !== -1; }
const vSet = calc.validateProjectionInput({ projStart: 'abc', projEnd: 2201, projInterval: 0, years: [], populations: [] });
check('msg-tahun-mulai', hasErr(vSet, 'Tahun mulai harus berupa bilangan bulat antara 1900 dan 2200.'));
check('msg-tahun-akhir', hasErr(vSet, 'Tahun akhir harus berupa bilangan bulat antara 1900 dan 2200.'));
check('msg-interval', hasErr(vSet, 'Interval harus berupa bilangan bulat antara 1 dan 20.'));
check('msg-min5', hasErr(vSet, 'Masukkan minimal 5 data valid dengan tahun yang berbeda.'));
const vEnd = calc.validateProjectionInput({ projStart: 2045, projEnd: 2045, projInterval: 5, years: [], populations: [] });
check('msg-akhir-lebih-besar', hasErr(vEnd, 'Tahun akhir proyeksi harus lebih besar dari tahun mulai.'));
const vRow = calc.validateProjectionInput({
  projStart: 2024, projEnd: 2045, projInterval: 5,
  years: ['1700', '2020', '2021', '2022', '2023'],
  populations: ['10', '20', '30', '40', '50']
});
check('msg-baris-tahun', hasErr(vRow, 'Baris 1: tahun harus berupa bilangan bulat antara 1800 dan 2200.'));
const vPop = calc.validateProjectionInput({
  projStart: 2024, projEnd: 2045, projInterval: 5,
  years: ['2019', '2020', '2021', '2022', '2023'],
  populations: ['1,000', '20', '30', '40', '50']
});
check('msg-baris-penduduk', hasErr(vPop, 'Baris 1: penduduk harus berupa bilangan bulat positif tanpa pemisah ribuan dan dalam batas angka yang didukung.'));
check('msg-duplikat-teks', hasErr(bad, 'Baris 2: tahun 2020 duplikat; gunakan satu jumlah penduduk per tahun.'));
const vOk = calc.validateProjectionInput({
  projStart: 2024, projEnd: 2045, projInterval: 5,
  years: ['2019', '2020', '2021', '2022', '2023'],
  populations: ['100', '110', '121', '133', '146']
});
check('input-valid-tanpa-error', vOk.errors.length === 0 && vOk.data.length === 5 && vOk.data[0].year === 2019);

// --- parseIntegerInput ala PHP ---
check('int-plain', calc.parseIntegerInput('2024', 1800, 2200) === 2024);
check('int-spasi', calc.parseIntegerInput(' 2024 ', 1800, 2200) === 2024);
check('int-eksponen', calc.parseIntegerInput('1e3', 1, 9007199254740991) === 1000);
check('int-desimal-nol', calc.parseIntegerInput('2024.0', 1800, 2200) === 2024);
check('int-desimal-tolak', calc.parseIntegerInput('20.5', 1, 100) === null);
check('int-heksa-tolak', calc.parseIntegerInput('0x10', 1, 100) === null);
check('int-infinity-tolak', calc.parseIntegerInput('Infinity', 1, 100) === null);
check('int-kosong-tolak', calc.parseIntegerInput('', 1, 100) === null);
check('int-bool-tolak', calc.parseIntegerInput(true, 1, 100) === null);
check('int-number-langsung', calc.parseIntegerInput(2024, 1800, 2200) === 2024);

// --- Format tampilan (string persis seperti number_format PHP) ---
check('fmt-ribuan', calc.fmtNum(1234567.5, 0) === '1.234.568');
check('fmt-negatif-half-away', calc.fmtNum(-1234.5, 0) === '-1.235');
check('fmt-null', calc.fmtNum(null) === '—');
check('fmt-nan', calc.fmtNum(NaN) === '—');
check('fmt-float6', calc.fmtFloat(0.03551234, 6) === '0.035512');
check('fmt-float4', calc.fmtFloat(1 / 3, 4) === '0.3333');
check('fmt-jiwa', calc.fmtNum(355700, 0) === '355.700');
check('esc-html', calc.esc('<a href="x">o\'y</a>&') === '&lt;a href=&quot;x&quot;&gt;o&#039;y&lt;/a&gt;&amp;');

// --- Data contoh ---
const sample = calc.samplePopulationData();
check('sample-14-baris', sample.length === 14 && sample[0][0] === 2010 && sample[0][1] === 220450 && sample[13][0] === 2023);

// --- calculations.js murni tanpa DOM ---
const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'calculations.js'), 'utf8');
check('tanpa-dom', src.indexOf('document') === -1 && src.indexOf('window') === -1);
check('guard-module-exports', /typeof module\s*!==\s*'undefined'/.test(src));

// --- index.html statis: aset relatif, tanpa referensi PHP ---
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
check('tanpa-referensi-php', html.indexOf('.php') === -1);
const needIds = ['dataBody', 'mainForm', 'projStart', 'projEnd', 'projInterval', 'results', 'formMessages'];
check('id-stabil', needIds.every(function (id) { return html.indexOf('id="' + id + '"') !== -1; }));
const needScripts = ['js/calculations.js', 'js/ui.js', 'js/projection.js', 'js/app.js'];
check('script-relatif-ada', needScripts.every(function (p) {
  return html.indexOf(p) !== -1 && fs.existsSync(path.join(__dirname, '..', p));
}));
check('css-relatif-ada', html.indexOf('css/style.css') !== -1 && fs.existsSync(path.join(__dirname, '..', 'css', 'style.css')));

console.log('\n' + pass + ' lolos, ' + fail + ' gagal.');
process.exit(fail > 0 ? 1 : 0);
