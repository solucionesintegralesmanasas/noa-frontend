// scripts/perf-fuec.js — cuánto tarda en pintarse el paso 1 ("Seleccionar vehículo") de "Nuevo FUEC".
// Lighthouse mide la carga de una página; esto mide una interacción real dentro de la SPA autenticada:
// desde que se navega a /extracto-de-contrato/crear hasta que el selector de vehículo está visible.
//   node scripts/perf-fuec.js --url=http://localhost:5173 --email=<correo> --password=<clave> [--runs=6] [--label=antes|despues] [--cpu=1] [--route=/ruta] [--selector=css | --ready="expresión JS"]
// Credenciales también por PERF_EMAIL / PERF_PASSWORD (no se guardan en el reporte).
// Corrida 1 = "fría" (carga los chunks de la ruta); el resto son "cálidas": se informa la mediana de las cálidas.
// Misma regla que Lighthouse (docs/metrics/lighthouse.md): para cifras oficiales medir contra `vite preview` o
// producción; contra el dev server (5173) sirve para comparar antes/después en la misma máquina.
// Reporte: docs/metrics/fuec-paso1-<env>-<label>-<fecha>.json
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = join(import.meta.dirname, '..');
const OUT_DIR = join(ROOT, 'docs', 'metrics');

const opt = (nombre, defecto = '') => {
  const arg = process.argv.find((a) => a.startsWith(`--${nombre}=`));
  return arg ? arg.slice(nombre.length + 3) : defecto;
};

const BASE = opt('url').replace(/\/+$/, '');
const EMAIL = opt('email', process.env.PERF_EMAIL ?? '');
const CLAVE = opt('password', process.env.PERF_PASSWORD ?? '');
const CORRIDAS = Number(opt('runs', '6'));
const ETIQUETA = opt('label', 'corrida');
const CPU = Number(opt('cpu', '1'));
const RUTA = opt('route', '/extracto-de-contrato/crear');
const SELECTOR = opt('selector', '#f-vehicle_uuid');
const LISTO = opt('ready', ''); // expresión JS alternativa al selector (p. ej. que ya haya filas o datos cargados)

if (!BASE || !EMAIL || !CLAVE) {
  console.error('Uso: node scripts/perf-fuec.js --url=<base> --email=<correo> --password=<clave> [--runs=6] [--label=antes] [--cpu=1]');
  process.exit(2);
}

const CHROME = opt('chrome', [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p)) ?? '');
if (!CHROME) {
  console.error('No se encontró Chrome/Edge; indica --chrome=<ruta>');
  process.exit(2);
}

const mediana = (xs) => {
  const v = [...xs].sort((a, b) => a - b);
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};
const redondear = (n) => Math.round(n);

const navegador = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
try {
  const contexto = await navegador.createBrowserContext();
  const pagina = await contexto.newPage();
  await pagina.setViewport({ width: 1366, height: 900 });
  if (CPU > 1) await (await pagina.createCDPSession()).send('Emulation.setCPUThrottlingRate', { rate: CPU });

  // Inicio de sesión por la pantalla real (la sesión se guarda cifrada: no se puede inyectar un token).
  await pagina.goto(`${BASE}/#/`, { waitUntil: 'networkidle2' });
  await pagina.waitForSelector('#login-email', { visible: true });
  await pagina.type('#login-email', EMAIL);
  await pagina.type('#login-password', CLAVE);
  await pagina.click('button.btn-main[type="submit"]');
  await pagina.waitForFunction(() => !/^#\/(login)?$/.test(location.hash), { timeout: 30000 });
  await pagina.waitForNetworkIdle({ idleTime: 800, timeout: 30000 }).catch(() => {});

  const corridas = [];
  for (let i = 1; i <= CORRIDAS; i += 1) {
    // Punto neutro antes de cada corrida, para que la navegación al formulario sea la única novedad.
    // Punto neutro SIN mapa ni tablas (notificaciones): si no, la condición de "listo" se cumpliría con el
    // contenido de la pantalla anterior (el dashboard también tiene un mapa Leaflet).
    await pagina.evaluate((r) => { location.hash = r === '/notificaciones' ? '#/vehiculos' : '#/notificaciones'; }, RUTA);
    await pagina.waitForNetworkIdle({ idleTime: 800, timeout: 30000 }).catch(() => {});

    await pagina.evaluate((ruta) => { performance.clearResourceTimings(); window.__t0 = performance.now(); location.hash = `#${ruta}`; }, RUTA);
    if (LISTO) await pagina.waitForFunction(LISTO, { timeout: 60000 });
    else await pagina.waitForSelector(SELECTOR, { visible: true, timeout: 60000 });
    const listoMs = await pagina.evaluate(() => Math.round(performance.now() - window.__t0));
    // La última respuesta de la API cuenta como "datos completos": espera a que la red se aquiete antes de leerla.
    await pagina.waitForNetworkIdle({ idleTime: 500, timeout: 20000 }).catch(() => {});
    const medicion = await pagina.evaluate((listo) => {
      const t0 = window.__t0;
      const api = performance.getEntriesByType('resource')
        .filter((e) => e.startTime >= t0 && e.name.includes('/api/'))
        .map((e) => ({
          peticion: e.name.replace(/^https?:\/\/[^/]+/, '').split('?')[0].replace(/^\/api\/v1\//, ''),
          inicioMs: Math.round(e.startTime - t0),
          finMs: Math.round(e.responseEnd - t0),
        }));
      return { pasoUnoMs: listo, ultimaRespuestaApiMs: api.length ? Math.max(...api.map((p) => p.finMs)) : null, api };
    }, listoMs);
    corridas.push({ corrida: i, tipo: i === 1 ? 'fria' : 'calida', ...medicion });
    console.log(`  #${i} ${i === 1 ? '(fría) ' : '(cálida)'} listo en ${medicion.pasoUnoMs} ms · última respuesta API a ${medicion.ultimaRespuestaApiMs} ms · ${medicion.api.length} peticiones`);
    await pagina.waitForNetworkIdle({ idleTime: 600, timeout: 30000 }).catch(() => {});
  }

  const calidas = corridas.filter((c) => c.tipo === 'calida').map((c) => c.pasoUnoMs);
  const resumen = {
    fecha: new Date().toISOString(),
    entorno: /localhost|127\.0\.0\.1/.test(BASE) ? 'local' : new URL(BASE).hostname,
    etiqueta: ETIQUETA,
    ruta: RUTA,
    selector: SELECTOR,
    cpuThrottle: CPU,
    corridas: CORRIDAS,
    friaMs: corridas[0]?.pasoUnoMs ?? null,
    medianaCalidasMs: calidas.length ? redondear(mediana(calidas)) : null,
    minCalidasMs: calidas.length ? Math.min(...calidas) : null,
    maxCalidasMs: calidas.length ? Math.max(...calidas) : null,
    desglosePeticiones: corridas.at(-1)?.api ?? [],
    detalle: corridas,
  };
  mkdirSync(OUT_DIR, { recursive: true });
  const salida = join(OUT_DIR, `fuec-paso1-${resumen.entorno}-${ETIQUETA}-${resumen.fecha.slice(0, 10)}.json`);
  writeFileSync(salida, `${JSON.stringify(resumen, null, 2)}\n`);

  console.log(`\n[${ETIQUETA}] fría ${resumen.friaMs} ms · mediana cálidas ${resumen.medianaCalidasMs} ms (mín ${resumen.minCalidasMs}, máx ${resumen.maxCalidasMs})`);
  console.log('Peticiones de la última corrida (inicio → fin, ms desde la navegación):');
  for (const p of resumen.desglosePeticiones) console.log(`   ${String(p.inicioMs).padStart(5)} → ${String(p.finMs).padStart(5)}  ${p.peticion}`);
  console.log(`\nReporte: ${salida}`);
} finally {
  await navegador.close().catch(() => {});
}
