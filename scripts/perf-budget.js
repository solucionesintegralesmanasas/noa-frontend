// scripts/perf-budget.js — Presupuesto de peso y HTML.
// - Informa: npm run test:perf (siempre exit 0; requiere build previo para dist/).
// - Valida: node scripts/perf-budget.js --strict (exit 1 si hay incumplimientos).
// - Remoto: node scripts/perf-budget.js --url=<base> (mide el HTML desplegado;
//   mismo test contra producción; el archivo sale como perf-<host>-<fecha>.json).
// Mide dist/assets (bundles de Vite) Y los assets de public/ que index.html
// carga en el primer pintado (/vendors/*, /assets/js/*, /assets/css/*), que el
// presupuesto anterior no veía (~1,7 MB reales no medidos).
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const OUT_DIR = join(ROOT, 'docs', 'metrics');
const DIST = join(ROOT, 'dist', 'assets');

// Umbrales de aviso (kB). Solo informan, no fallan.
// (publicInicialJS/CSS aún sin tope: se fijan tras el primer baseline honesto.)
const BUDGETS = { totalJS: 1800, inicialJS: 1150, totalCSS: 1200, vendorPrimevue: 900, vendorUI: 200, indexJS: 150 };
// Presupuesto por chunk de ruta (vista): solo informa.
const BUDGET_RUTA_KB = 150;

const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const urlArg = args.find((a) => a.startsWith('--url='));
const REMOTO = urlArg ? urlArg.slice('--url='.length).replace(/\/+$/, '') : null;

const kb1 = (bytes) => Math.round((bytes / 1024) * 10) / 10;

// ---- parseo del HTML (local o remoto): mismos patrones, misma lectura ----
function extraer(html) {
  // Carga inicial = entry + modulepreload declarados en el HTML servido.
  // Todo lo demás en dist/assets es diferido (lazy routes, chunks bajo demanda).
  const inicial = new Set();
  for (const m of html.matchAll(/(?:modulepreload[^>]*href|script[^>]*src)="([^"]+)"/g)) {
    const f = m[1].split('/').pop();
    if (f) inicial.add(f);
  }
  const estilos = [];
  for (const m of html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)) estilos.push(m[1]);
  for (const m of html.matchAll(/<link[^>]*href="([^"]+)"[^>]*rel="stylesheet"[^>]*>/g)) {
    if (!estilos.includes(m[1])) estilos.push(m[1]);
  }
  const clasicos = [];
  for (const m of html.matchAll(/<script\s+src="([^"]+)"([^>]*)>/g)) clasicos.push({ src: m[1], attrs: m[2] });
  return { inicial, estilos, clasicos };
}

// Assets de public/: /vendors/*, /assets/js/*, /assets/css/* (los bundles de
// Vite viven en /assets/<hash> y NO son public/).
function esPublico(ruta) {
  return typeof ruta === 'string'
    && (ruta.startsWith('/vendors/') || ruta.startsWith('/assets/js/') || ruta.startsWith('/assets/css/'));
}

function medirPublicoLocal(estilos, clasicos) {
  const items = [];
  const vistos = new Set();
  const rutas = [
    ...estilos.map((href) => ({ ruta: href, tipo: 'css-publico' })),
    ...clasicos.map((c) => ({ ruta: c.src, tipo: 'js-publico' })),
  ];
  for (const { ruta, tipo } of rutas) {
    if (!esPublico(ruta) || vistos.has(ruta)) continue;
    vistos.add(ruta);
    const archivo = join(ROOT, 'public', ruta.replace(/^\//, ''));
    if (!existsSync(archivo) || !statSync(archivo).isFile()) continue;
    items.push({ archivo: ruta.split('/').pop(), kb: kb1(statSync(archivo).size), tipo });
  }
  items.sort((a, b) => b.kb - a.kb);
  return items;
}

function idDeBuild(inicialSet, chunks) {
  const entry = [...inicialSet].find((f) => /^index-[A-Za-z0-9_-]+\.js$/.test(f))
    ?? chunks.find((c) => c.tipo.startsWith('js') && /^index-[A-Za-z0-9_-]+\.js$/.test(c.archivo))?.archivo;
  const m = entry && entry.match(/^index-([A-Za-z0-9_-]+)\.js$/);
  return m ? m[1] : null;
}

function resumen(chunks, publicos) {
  const totalJS = chunks.filter((c) => c.tipo.startsWith('js')).reduce((a, c) => a + c.kb, 0);
  const inicialJS = chunks.filter((c) => c.tipo === 'js-inicial').reduce((a, c) => a + c.kb, 0);
  const pick = (frag) => chunks.find((c) => c.archivo.includes(frag))?.kb ?? null;
  return {
    totalJS: Math.round(totalJS * 10) / 10,
    inicialJS: Math.round(inicialJS * 10) / 10,
    diferidoJS: Math.round((totalJS - inicialJS) * 10) / 10,
    totalCSS: Math.round(chunks.filter((c) => c.tipo === 'css').reduce((a, c) => a + c.kb, 0) * 10) / 10,
    vendorPrimevue: pick('vendor-primevue'),
    vendorUI: pick('vendor-ui'),
    vendorFeedback: pick('vendor-feedback'),
    vendorHttp: pick('vendor-http'),
    vendorVue: pick('vendor-vue'),
    indexJS: pick('/index-') ?? chunks.find((c) => c.tipo.startsWith('js') && c.archivo.startsWith('index-'))?.kb ?? null,
    publicInicialJS: Math.round(publicos.filter((c) => c.tipo === 'js-publico').reduce((a, c) => a + c.kb, 0) * 10) / 10,
    publicInicialCSS: Math.round(publicos.filter((c) => c.tipo === 'css-publico').reduce((a, c) => a + c.kb, 0) * 10) / 10,
    numChunksJS: chunks.filter((c) => c.tipo.startsWith('js')).length,
    numChunksInicial: chunks.filter((c) => c.tipo === 'js-inicial').length,
    numChunksDiferidos: chunks.filter((c) => c.tipo === 'js-diferido').length,
    numChunksCSS: chunks.filter((c) => c.tipo === 'css').length,
    numPublicos: publicos.length,
  };
}

function chequearHtml(htmlCompleto) {
  // Los <noscript> son respaldo sin JS (duplican scripts y hojas a propósito): no cuentan.
  const html = htmlCompleto.replace(/<noscript>[\s\S]*?<\/noscript>/g, '');
  const classicScripts = [...html.matchAll(/<script\s+src="([^"]+)"([^>]*)>/g)];
  const sinDefer = classicScripts.filter((m) => !/defer|async/.test(m[2])).map((m) => m[1]);
  const fontSheets = (html.match(/fonts\.googleapis\.com\/css2/g) || []).length;
  const deadCss = (html.match(/jquery\.toast/i) || []).length;
  return { scriptsSinDefer: sinDefer, hojasGoogleFonts: fontSheets, cssMuertoJqueryToast: deadCss };
}

// ---- modo local: dist/ en disco + public/ en disco ----
function medirLocal() {
  const distHtml = join(ROOT, 'dist', 'index.html');
  const htmlLocal = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const { inicial, estilos, clasicos } = extraer(existsSync(distHtml) ? readFileSync(distHtml, 'utf8') : '');
  const chunks = [];
  let distOk = false;
  if (existsSync(DIST)) {
    distOk = true;
    for (const f of readdirSync(DIST)) {
      const st = statSync(join(DIST, f));
      if (!st.isFile()) continue;
      const kb = kb1(st.size);
      if (f.endsWith('.js')) {
        const esInicial = inicial.has(f);
        chunks.push({ archivo: f, kb, tipo: esInicial ? 'js-inicial' : 'js-diferido' });
      } else if (f.endsWith('.css')) {
        chunks.push({ archivo: f, kb, tipo: 'css' });
      }
    }
    chunks.sort((a, b) => b.kb - a.kb);
  }
  const publicos = medirPublicoLocal(estilos, clasicos);
  return { html: htmlLocal, chunks, publicos, distOk, buildId: idDeBuild(inicial, chunks), origen: 'local' };
}

// ---- modo remoto: HTML desplegado + tamaños por red ----
async function tamanoRemoto(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    return kb1(buf.length);
  } catch {
    return null;
  }
}

async function medirRemoto(base) {
  let html;
  try {
    const r = await fetch(base, { signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    html = await r.text();
  } catch (e) {
    console.error(`No se pudo leer ${base}: ${String(e.message || e).split('\n')[0]}`);
    process.exit(1);
  }
  const { inicial, estilos, clasicos } = extraer(html);
  const ver = async (rutas, tipo) => {
    const unicas = [...new Set(rutas.filter((r) => typeof r === 'string' && r.startsWith('/')))];
    const lotes = [];
    for (let i = 0; i < unicas.length; i += 20) lotes.push(unicas.slice(i, i + 20));
    const items = [];
    for (const lote of lotes) {
      const res = await Promise.all(lote.map(async (ruta) => {
        const kb = await tamanoRemoto(new URL(ruta, base + '/').href);
        return kb === null ? null : { archivo: ruta.split('/').pop(), kb, tipo };
      }));
      for (const it of res) if (it) items.push(it);
    }
    items.sort((a, b) => b.kb - a.kb);
    return items;
  };
  const rutasJs = [...inicial].filter((f) => f.endsWith('.js'));
  const rutasCss = estilos.filter((e) => e.startsWith('/') && !e.includes('fonts.googleapis.com'));
  // Reclasifica inicial/diferido por nombre (el HTML ya dice qué es inicial).
  const chunks = (await ver(rutasJs.map((f) => `/assets/${f}`), 'js-diferido')).map((it) => ({
    ...it, tipo: inicial.has(it.archivo) ? 'js-inicial' : 'js-diferido',
  }));
  const cssBundles = await ver(rutasCss.filter((e) => !esPublico(e)), 'css');
  chunks.push(...cssBundles);
  chunks.sort((a, b) => b.kb - a.kb);
  const publicos = [
    ...(await ver(clasicos.map((c) => c.src).filter(esPublico), 'js-publico')),
    ...(await ver(estilos.filter(esPublico), 'css-publico')),
  ];
  publicos.sort((a, b) => b.kb - a.kb);
  return { html, chunks, publicos, distOk: chunks.length > 0, buildId: idDeBuild(inicial, chunks), origen: base };
}

const { html, chunks, publicos, distOk, buildId, origen } = REMOTO
  ? await medirRemoto(REMOTO)
  : medirLocal();

const metrics = resumen(chunks, publicos);

// Presupuesto por ruta: chunks de vistas (carga diferida típica) con su peso.
const rutas = chunks
  .filter((c) => c.tipo.startsWith('js') && /view|page/i.test(c.archivo))
  .sort((a, b) => b.kb - a.kb)
  .slice(0, 15)
  .map((c) => ({ archivo: c.archivo, kb: c.kb, inicial: c.tipo === 'js-inicial' }));

const checks = chequearHtml(html);

const stamp = new Date().toISOString().slice(0, 10);
const slug = REMOTO ? new URL(REMOTO).hostname.replace(/\./g, '-') + '-' : '';
const report = {
  fecha: stamp, origen, buildId, dist: distOk,
  metricas: metrics, rutas, html: checks,
  topChunks: chunks.slice(0, 10), topPublicos: publicos.slice(0, 10),
};
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, `perf-${slug}${stamp}.json`), JSON.stringify(report, null, 2));

// Uso: npm run test:perf (informa, exit 0) o node scripts/perf-budget.js --strict
// (valida: exit 1 si algún presupuesto se excede; para CI).
const incumplimientos = [];
const exigir = (condicion, detalle) => { if (!condicion) incumplimientos.push(detalle); };

console.log('\n Presupuesto de rendimiento' + (REMOTO ? ` (${origen})` : ''));
if (buildId) console.log(` build: ${buildId}`);
if (!distOk) console.log(' (sin dist/: ejecuta npm run build primero)');
for (const [k, v] of Object.entries(metrics)) {
  if (v === null || v === undefined) continue;
  if (k.startsWith('num')) {
    console.log(` ${k.padEnd(16)} ${String(v).padStart(8)}     (conteo)`);
    continue;
  }
  const b = BUDGETS[k];
  const excede = b !== undefined && v > b;
  if (b !== undefined) exigir(!excede, `${k}: ${v} kB > presupuesto ${b} kB`);
  const flag = b !== undefined ? (excede ? '⚠️ sobre presupuesto' : '✅') : '';
  console.log(` ${k.padEnd(16)} ${String(v).padStart(8)} kB  ${flag}`);
}
console.log(` hojasGoogleFonts: ${checks.hojasGoogleFonts} (objetivo ≤1)  ${checks.hojasGoogleFonts <= 1 ? '✅' : '⚠️'}`);
exigir(checks.hojasGoogleFonts <= 1, `hojasGoogleFonts: ${checks.hojasGoogleFonts} > 1`);
console.log(` scriptsSinDefer: ${checks.scriptsSinDefer.length}  ${checks.scriptsSinDefer.length === 0 ? '✅' : '⚠️ ' + checks.scriptsSinDefer.join(', ')}`);
exigir(checks.scriptsSinDefer.length === 0, `scriptsSinDefer: ${checks.scriptsSinDefer.join(', ')}`);
console.log(` cssMuertoJqueryToast: ${checks.cssMuertoJqueryToast}  ${checks.cssMuertoJqueryToast === 0 ? '✅' : '⚠️'}`);
exigir(checks.cssMuertoJqueryToast === 0, 'cssMuertoJqueryToast presente');
console.log(`\n Rutas más pesadas (presupuesto ${BUDGET_RUTA_KB} kB por vista):`);
for (const r of rutas) {
  const excede = r.kb > BUDGET_RUTA_KB;
  exigir(!excede, `ruta ${r.archivo}: ${r.kb} kB > presupuesto ${BUDGET_RUTA_KB} kB`);
  const flag = excede ? '⚠️ sobre presupuesto' : '✅';
  const tag = r.inicial ? '(inicial)' : '(diferido)';
  console.log(` ${r.archivo.padEnd(48)} ${String(r.kb).padStart(8)} kB  ${tag} ${flag}`);
}
console.log(`\n Reporte: docs/metrics/perf-${slug}${stamp}.json`);
if (STRICT && incumplimientos.length) {
  console.log(`\n⛔ --strict: ${incumplimientos.length} incumplimiento(s):`);
  for (const d of incumplimientos) console.log(`  - ${d}`);
  process.exit(1);
}
process.exit(0);
