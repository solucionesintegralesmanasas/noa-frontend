// scripts/critical-css.cjs — Genera critical/login.css (CSS crítico de la pantalla de login).
// Renderiza el login en Chrome (desktop y móvil) y conserva, de los CSS que bloquean el
// render (simplebar, FontAwesome, theme, user), solo las reglas cuyo selector coincide con
// el DOM real. Vite lo inlinea en index.html al compilar (plugin `criticalCss` en vite.config.js).
//
// Uso (requiere `npm run build && npm run preview` en otra terminal):
//   node scripts/critical-css.cjs [--url=http://localhost:4173]
// Regenerar cuando cambie el login, theme.min.css o user.min.css.
const puppeteer = require('puppeteer-core');
const postcss = require('postcss');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const OUT = path.join(ROOT, 'critical', 'login.css');
const URL_BASE = (process.argv.find((a) => a.startsWith('--url=')) || '--url=http://localhost:4173').slice(6);
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

// [archivo, carpeta pública del archivo] — la carpeta sirve para reescribir url(../x).
const SHEETS = [
  ['vendors/simplebar/simplebar.min.css', '/vendors/simplebar/'],
  ['vendors/FontAwesome-pro/css/all.min.css', '/vendors/FontAwesome-pro/css/'],
  ['assets/css/theme.min.css', '/assets/css/'],
  ['assets/css/user.min.css', '/assets/css/'],
];
const VIEWPORTS = [
  { width: 1366, height: 768 },
  { width: 390, height: 844, isMobile: true, hasTouch: true },
];

const esKeyframes = (ru) => ru.parent?.type === 'atrule' && /keyframes/.test(ru.parent.name);

(async () => {
  const parsed = SHEETS.map(([f]) => postcss.parse(fs.readFileSync(path.join(PUBLIC, f), 'utf8')));
  const selectores = new Set();
  parsed.forEach((root) => root.walkRules((ru) => { if (!esKeyframes(ru)) ru.selectors.forEach((s) => selectores.add(s)); }));

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const coinciden = new Set();
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport(vp);
    await page.goto(`${URL_BASE}/#/`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.brand-desc', { timeout: 10000 });
    const ok = await page.evaluate((lista) => lista.filter((s) => {
      // Se quitan pseudo-clases/elementos: :hover, ::before, :not(...) se conservan por su selector base.
      const base = s.replace(/::?[\w-]+(\([^)]*\))?/g, '').trim() || '*';
      if (/^(html|body)\b/.test(s.trim()) || s.trim().startsWith(':root')) return true;
      try { return !!document.querySelector(base); } catch { return true; }
    }), [...selectores]);
    ok.forEach((s) => coinciden.add(s));
    await page.close();
  }
  await browser.close();

  const partes = parsed.map((root, i) => {
    const base = SHEETS[i][1].replace(/[^/]+\/$/, ''); // carpeta padre: resuelve ../webfonts, ../img
    root.walkDecls((d) => {
      d.value = d.value.replace(/url\((['"]?)\.\.\/([^)'"]+)\1\)/g, (_, _q, p) => `url(${base}${p})`);
    });
    root.walkRules((ru) => {
      if (esKeyframes(ru)) return;
      const f = ru.selectors.filter((s) => coinciden.has(s));
      if (!f.length) ru.remove(); else ru.selectors = f;
    });
    root.walkAtRules((a) => { if (/^(media|supports)$/.test(a.name) && !a.nodes?.length) a.remove(); });
    // Fuentes: solo woff2 (los navegadores objetivo lo soportan); se descartan eot/svg/ttf/woff.
    root.walkAtRules('font-face', (a) => {
      const srcs = [];
      a.walkDecls('src', (d) => srcs.push(d));
      if (srcs.some((d) => /woff2/.test(d.value))) {
        srcs.forEach((d) => { if (/woff2/.test(d.value)) d.value = d.value.split(',').filter((x) => /woff2/.test(x)).join(','); else d.remove(); });
      }
    });
    return root.toString();
  });

  let css = partes.join('\n');
  const usados = new Set([...css.matchAll(/animation(?:-name)?\s*:\s*([^;}]+)/g)].flatMap((m) => m[1].split(/[\s,]+/)));
  parsed.forEach((root) => root.walkAtRules((a) => { if (/keyframes/.test(a.name) && usados.has(a.params)) css += `\n${a.toString()}`; }));
  css = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '').replace(/;}/g, '}');

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, css);
  const original = SHEETS.reduce((n, [f]) => n + fs.statSync(path.join(PUBLIC, f)).size, 0);
  console.log(`critical/login.css: ${(css.length / 1024).toFixed(1)} kB (de ${(original / 1024).toFixed(0)} kB originales)`);
})();
