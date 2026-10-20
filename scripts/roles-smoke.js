// scripts/roles-smoke.js — humo de carga de vistas POR USUARIO/ROL (2026-10-20).
// Inicia sesión por la pantalla real con usuarios de prueba y visita una lista de rutas
// por cada uno, recolectando: hash final (redirecciones de guards), errores de consola,
// respuestas HTTP >= 400, barra de navegación colgada (>2 s tras aquietarse la red) y capturas.
//   node scripts/roles-smoke.js [--url=http://localhost:5173] [--email=<correo> --password=<clave>]
// Credenciales a mano sustituyen la lista de usuarios de prueba integrada (solo visitan --rutas).
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = join(import.meta.dirname, '..');
const OUT_DIR = join(ROOT, 'docs', 'metrics', 'roles-smoke');

const opt = (nombre, defecto = '') => {
  const arg = process.argv.find((a) => a.startsWith(`--${nombre}=`));
  return arg ? arg.slice(nombre.length + 3) : defecto;
};
const BASE = (opt('url', 'http://localhost:5173')).replace(/\/+$/, '');
const EMAIL = opt('email');
const CLAVE = opt('password');
const RUTAS_REQUEST = opt('rutas', '');

const usuarios = EMAIL && CLAVE
  ? [{ nombre: 'personalizado', email: EMAIL, clave: CLAVE, rutas: RUTAS_REQUEST ? RUTAS_REQUEST.split(',') : ['/dashboard', '/terceros'] }]
  : [
      {
        nombre: 'afiliado+conductor',
        email: 'prueba.aficond@example.test',
        clave: '900000101',
        rutas: ['/dashboard', '/dashboard/conductor', '/vehiculos', '/vehiculos-documentos', '/terceros/conductores', '/rastreo/mapa-en-vivo', '/extracto-de-contrato', '/inspeccion-vehiculos', '/planilla-de-control-de-prestacion-servicios'],
      },
      {
        nombre: 'empleado+coordinador',
        email: 'prueba.emplcoord@example.test',
        clave: '900000102',
        // El rol COORDINADOR_CALI tiene permisos de vehículos, proyectos, planillas y rastreo,
        // no de terceros/usuarios (esas rutas responden 401 y es lo correcto).
        rutas: ['/dashboard', '/dashboard/conductor', '/vehiculos', '/proyectos', '/planillas-de-control-de-servicios', '/planilla-de-control-de-prestacion-servicios', '/rastreo/mapa-en-vivo', '/rastreo/geocercas', '/notificaciones'],
      },
      {
        nombre: 'empleado',
        email: 'prueba.empleado@example.test',
        clave: '900000103',
        rutas: ['/dashboard', '/dashboard/conductor', '/terceros', '/vehiculos'],
      },
    ];

const CHROME = opt('chrome', [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p)) ?? '');
if (!CHROME) {
  console.error('No se encontró Chrome/Edge; indica --chrome=<ruta>');
  process.exit(2);
}

mkdirSync(OUT_DIR, { recursive: true });
const resumen = { fecha: new Date().toISOString(), entorno: BASE, usuarios: [] };
const navegador = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

try {
  for (const usuario of usuarios) {
    const datosUsuario = { nombre: usuario.nombre, meetingHash: null, rutas: [], errores: [], imagenesDir: join('docs', 'metrics', 'roles-smoke', usuario.nombre.replace(/[^a-z0-9+]+/gi, '-')) };
    const dirCapturas = join(OUT_DIR, usuario.nombre.replace(/[^a-z0-9+]+/gi, '-'));
    mkdirSync(dirCapturas, { recursive: true });

    const contexto = await navegador.createBrowserContext();
    const pagina = await contexto.newPage();
    await pagina.setViewport({ width: 1366, height: 900 });

    const httpMalos = [];
    const consolaMala = [];
    pagina.on('response', (respuesta) => {
      if (respuesta.status() >= 400 && respuesta.url().includes('/api/')) {
        httpMalos.push({ ruta: respuesta.url().replace(/^https?:\/\/[^/]+/, '').split('?')[0], estado: respuesta.status() });
      }
    });
    pagina.on('console', (mensaje) => {
      if (['error', 'warning'].includes(mensaje.type())) consolaMala.push({ tipo: mensaje.type(), texto: mensaje.text().slice(0, 300) });
    });
    pagina.on('pageerror', (error) => consolaMala.push({ tipo: 'pageerror', texto: String(error).slice(0, 300) }));

    // Inicio de sesión por la pantalla real
    await pagina.goto(`${BASE}/#/login`, { waitUntil: 'networkidle2' });
    await pagina.waitForSelector('#login-email', { visible: true, timeout: 30000 });
    await pagina.type('#login-email', usuario.email);
    await pagina.type('#login-password', usuario.clave);
    await pagina.click('button.btn-main[type="submit"]');
    const loginOk = await pagina.waitForFunction(
      () => !/^#\/(login)?$/.test(location.hash) && !document.querySelector('.nav-progress-bar'),
      { timeout: 30000, polling: 300 },
    ).then(() => true).catch(() => false);
    if (!loginOk) {
      datosUsuario.errores.push({ tipo: 'login', texto: 'El login no llegó a ninguna vista (revisar credenciales o consola)' });
      await pagina.screenshot({ path: join(dirCapturas, 'login-fallido.png') });
      contexto.close().catch(() => {});
      resumen.usuarios.push(datosUsuario);
      continue;
    }

    await pagina.waitForNetworkIdle({ idleTime: 800, timeout: 30000 }).catch(() => {});
    datosUsuario.hashInicio = await pagina.evaluate(() => location.hash);

    for (const ruta of usuario.rutas) {
      const registro = { ruta, hashFinal: null, http400: [], barraColgada: false, erroresConsola: [] };
      const antesConsola = consolaMala.length;
      const antesHttp = httpMalos.length;

      await pagina.evaluate((destino) => { performance.mark('rsmoke-t0'); location.hash = `#${destino}`; }, ruta);
      await pagina.waitForNetworkIdle({ idleTime: 500, timeout: 15000 }).catch(() => {});
      await new Promise((resolver) => setTimeout(resolver, 1200));
      // Salvaguarda del fix: la barra de navegación no debe seguir viva después de aquietarse la red
      await new Promise((resolver) => setTimeout(resolver, 2000));
      registro.hashFinal = await pagina.evaluate(() => location.hash);
      registro.barraColgada = await pagina.evaluate(() => !!document.querySelector('.nav-progress-bar'));
      registro.http400 = httpMalos.slice(antesHttp);
      registro.erroresConsola = consolaMala.slice(antesConsola);
      registro.redirigida = registro.hashFinal !== `#${ruta}`;

      const nombreCaptura = `${ruta.replace(/^\/+/, '').replace(/[/:]/g, '_') || 'raiz'}.png`;
      await pagina.screenshot({ path: join(dirCapturas, nombreCaptura) });
      datosUsuario.rutas.push(registro);
      const senales = [
        registro.redirigida ? 'redirígida' : '',
        registro.barraColgada ? 'BARRA COLGADA' : '',
        registro.http400.length ? `HTTP400(${registro.http400.map((h) => `${h.estado} ${h.ruta}`).join('; ')})` : '',
        registro.erroresConsola.length ? `consola(${registro.erroresConsola.length})` : '',
      ].filter(Boolean).join(' · ');
      console.log(`  ${usuario.nombre} ${ruta} -> ${registro.hashFinal}${senales ? `  [${senales}]` : ''}`);
    }

    datosUsuario.errores.push(...consolaMala.map((c) => ({ ...c })));
    contexto.close().catch(() => {});
    resumen.usuarios.push(datosUsuario);
  }

  const salidaResumen = join(ROOT, 'docs', 'metrics', `roles-smoke-${resumen.fecha.slice(0, 10)}.json`);
  writeFileSync(salidaResumen, `${JSON.stringify(resumen, null, 2)}\n`);

  const conSenales = resumen.usuarios.flatMap((u) => u.rutas.filter((r) => r.barraColgada || r.http400.length || r.erroresConsola.length));
  console.log(`\nUsuarios evaluados: ${resumen.usuarios.length} · rutas con señales: ${conSenales.length}`);
  console.log(`Reporte: ${salidaResumen} · capturas: ${OUT_DIR}/<usuario>/`);
} finally {
  await navegador.close().catch(() => {});
}
