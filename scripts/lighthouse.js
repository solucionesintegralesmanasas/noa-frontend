// scripts/lighthouse.js — Bucles de navegador parametrizables por URL.
// Mismo test en local y en producción:
//   node scripts/lighthouse.js --url=http://localhost:4173 --device=mobile --page=conductor
//   node scripts/lighthouse.js --url=https://apptransportessinbarreras.transportessinbarreras.com --page=login,mapa
// Protocolo (docs/metrics/lighthouse.md): 3 corridas por página y mediana.
// Las corridas son secuenciales: instancias de Chrome en paralelo falsean TBT.
// Versión de Lighthouse fijada para que las cifras sean comparables en el tiempo.
import { execFile } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const LIGHTHOUSE = 'lighthouse@12.8.2';
const ROOT = join(import.meta.dirname, '..');
const OUT_DIR = join(ROOT, 'docs', 'metrics');

// Páginas de la baseline (router con hash: las URLs llevan #/).
const PAGINAS = {
  login: '/#/',
  dashboard: '/#/dashboard',
  mapa: '/#/rastreo/mapa-en-vivo',
  historial: (uuid) => `/#/rastreo/historial/${uuid}`,
  geocercas: '/#/rastreo/geocercas',
  fuec: '/#/extracto-de-contrato/crear',
  conductor: '/?view=conductor',
};

const args = process.argv.slice(2);
const opt = (nombre, defecto) => {
  const a = args.find((x) => x.startsWith(`--${nombre}=`));
  return a ? a.slice(nombre.length + 3) : defecto;
};

const BASE = (opt('url', '') || '').replace(/\/+$/, '');
const DEVICE = opt('device', 'desktop'); // desktop | mobile
const RUNS = Math.max(1, parseInt(opt('runs', '3'), 10) || 3);
const PAGINAS_PEDIDAS = (opt('page', opt('pages', 'login')) || 'login').split(',').map((s) => s.trim()).filter(Boolean);
const UUID = opt('uuid', '');
const PERFIL = opt('profile', ''); // dir de datos de Chrome con sesión iniciada (rutas privadas)

if (!BASE) {
  console.error('Uso: node scripts/lighthouse.js --url=<base> [--device=desktop|mobile] [--runs=3] [--page=login] [--uuid=<id>] [--profile=<dir>]');
  process.exit(2);
}
if (!['desktop', 'mobile'].includes(DEVICE)) {
  console.error('--device debe ser desktop o mobile');
  process.exit(2);
}

// La etiqueta del reporte se deriva de la URL una vez validada.
const ENV = opt('env', '') || (/localhost|127\.0\.0\.1/.test(BASE) ? 'local' : new URL(BASE).hostname.replace(/\./g, '-'));

const mediana = (xs) => {
  const v = [...xs].sort((a, b) => a - b);
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};

function urls() {
  const lista = [];
  for (const nombre of PAGINAS_PEDIDAS) {
    const def = PAGINAS[nombre];
    if (!def) {
      console.log(` (página desconocida '${nombre}', se omite; válidas: ${Object.keys(PAGINAS).join(', ')})`);
      continue;
    }
    if (nombre === 'historial' && !UUID) {
      console.log(' (historial requiere --uuid=<id de conductor>; se omite)');
      continue;
    }
    const ruta = typeof def === 'function' ? def(UUID) : def;
    lista.push({ nombre, url: BASE + ruta });
  }
  return lista;
}

function existeInformeValido(salida) {
  try {
    const informe = JSON.parse(readFileSync(salida, 'utf8'));
    return Boolean(informe.categories?.performance && informe.finalDisplayedUrl);
  } catch {
    return false;
  }
}

async function corrida(url) {
  const dir = mkdtempSync(join(tmpdir(), 'lh-'));
  const salida = join(dir, 'informe.json');
  const banderas = ['--no-sandbox', '--disable-dev-shm-usage'];
  if (PERFIL) banderas.push(`--user-data-dir=${PERFIL}`);
  const cmd = ['--yes', LIGHTHOUSE, url,
    '--output=json', `--output-path=${salida}`, '--quiet',
    `--chrome-flags=${banderas.join(' ')}`,
  ];
  if (DEVICE === 'desktop') cmd.push('--preset=desktop');
  // En Windows se usa shell para resolver npx.cmd (el warning DEP0190 es
  // cosmético; los argumentos son internos y fijos).
  const npx = 'npx';
  try {
    await execFileAsync(npx, cmd, { timeout: 300000, shell: process.platform === 'win32' });
  } catch (e) {
    // La limpieza del perfil temporal de Chrome a veces falla en Windows
    // (EPERM) después de escribir el informe: si el JSON existe y es válido,
    // la medición sirve igual.
    if (!existeInformeValido(salida)) throw e;
    console.log('(aviso: falló la limpieza de Chrome, el informe es válido)');
  }
  const informe = JSON.parse(readFileSync(salida, 'utf8'));
  rmSync(dir, { recursive: true, force: true });
  const categoria = (id) => Math.round((informe.categories[id]?.score ?? 0) * 100);
  const auditoria = (id) => informe.audits[id]?.numericValue ?? null;
  return {
    performance: categoria('performance'),
    accessibility: categoria('accessibility'),
    lcpMs: auditoria('largest-contentful-paint') === null ? null : Math.round(auditoria('largest-contentful-paint')),
    tbtMs: auditoria('total-blocking-time') === null ? null : Math.round(auditoria('total-blocking-time')),
    cls: auditoria('cumulative-layout-shift') === null ? null : Math.round(auditoria('cumulative-layout-shift') * 1000) / 1000,
    finalUrl: informe.finalDisplayedUrl ?? informe.finalUrl ?? url,
  };
}

const paginas = urls();
if (!paginas.length) process.exit(2);

console.log(`\n Lighthouse (${DEVICE}) contra ${BASE} — ${RUNS} corrida(s) por página, mediana`);
if (!PERFIL) console.log(' (sin --profile: las rutas privadas medirán el login tras el redirect; ver finalUrl)');
const resultado = {
  fecha: new Date().toISOString().slice(0, 10),
  origen: BASE, env: ENV, device: DEVICE, runs: RUNS, lighthouse: LIGHTHOUSE,
  paginas: {},
};
for (const { nombre, url } of paginas) {
  console.log(`\n ${nombre}: ${url}`);
  const muestras = [];
  for (let i = 0; i < RUNS; i++) {
    process.stdout.write(`  corrida ${i + 1}/${RUNS}... `);
    try {
      const r = await corrida(url);
      muestras.push(r);
      console.log(`perf=${r.performance} a11y=${r.accessibility} LCP=${r.lcpMs}ms TBT=${r.tbtMs}ms CLS=${r.cls}`);
    } catch (e) {
      console.log(`falló (${String(e.message || e).split('\n')[0].slice(0, 120)})`);
    }
  }
  if (!muestras.length) {
    console.log('  sin muestras válidas; se omite la página');
    continue;
  }
  const med = (k) => {
    const v = muestras.map((m) => m[k]).filter((x) => x !== null);
    if (!v.length) return null;
    return k === 'cls' ? Math.round(mediana(v) * 1000) / 1000 : Math.round(mediana(v));
  };
  resultado.paginas[nombre] = {
    url,
    finalUrl: muestras[0].finalUrl,
    performance: med('performance'),
    accessibility: med('accessibility'),
    lcpMs: med('lcpMs'),
    tbtMs: med('tbtMs'),
    cls: med('cls'),
  };
  const p = resultado.paginas[nombre];
  console.log(`  mediana → perf=${p.performance} a11y=${p.accessibility} LCP=${p.lcpMs}ms TBT=${p.tbtMs}ms CLS=${p.cls}`);
  if (p.finalUrl && !p.finalUrl.includes(url.replace(BASE, '').slice(0, 12))) {
    console.log(`  ⚠️ redirigió a otra ruta (probable login): ${p.finalUrl.slice(0, 100)}`);
  }
}

mkdirSync(OUT_DIR, { recursive: true });
const ruta = join(OUT_DIR, `lighthouse-${ENV}-${DEVICE}-${resultado.fecha}.json`);
let previo = {};
try {
  previo = JSON.parse(readFileSync(ruta, 'utf8')).paginas ?? {};
} catch { /* primera corrida del día */ }
resultado.paginas = { ...previo, ...resultado.paginas };
writeFileSync(ruta, JSON.stringify(resultado, null, 2));
console.log(`\n Reporte: docs/metrics/lighthouse-${ENV}-${DEVICE}-${resultado.fecha}.json`);
