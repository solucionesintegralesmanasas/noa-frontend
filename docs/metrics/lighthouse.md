# Lighthouse manual — NOA Transportes

Medición oficial de rendimiento frontend. Es la única herramienta de medición
vigente tras retirar la Fase 0 (2026-09-22): complementa `test:perf` (pesos del
bundle) y `test:a11y` (antipatrones estáticos) con medición real en navegador.

## Reglas (obligatorias para que las cifras sean comparables)

1. Medir siempre contra **producción**:
   `https://apptransportessinbarreras.transportessinbarreras.com`.
   Nunca contra `localhost:5173` (modo dev, sin minificar).
2. Chrome **incógnito, sin extensiones**. No interactuar con la página
   durante la corrida; esperar a que termine el informe.
3. DevTools → pestaña **Lighthouse** → categorías **Performance + Accessibility**.
4. Modo **Navigation**, dispositivo **Desktop**.
5. **3 corridas por página** y anotar la **mediana** (Lighthouse varía ±5 puntos).
6. Páginas autenticadas: iniciar sesión primero en la misma ventana incógnita
   y luego navegar a cada URL. No cerrar la ventana entre corridas.
7. Anotar fecha, hora y si era hora pico (las páginas con datos dependen
   de la API real y su latencia afecta al LCP).

## Páginas de la baseline

El router usa hash (`createWebHashHistory`): las URLs llevan `#/`.

| # | Página | URL producción | Por qué se mide |
|---|---|---|---|
| 1 | Login | `/#/` (vista inicial = login) o `/#/login` | Entrada pública, sin llamadas a la API |
| 2 | Dashboard | `/#/dashboard` | La más pesada: gráficos + varias llamadas API |
| 3 | Mapa en vivo | `/#/rastreo/mapa-en-vivo` | Leaflet por CDN + refresco de ubicaciones |
| 4 | Historial conductor | `/#/rastreo/historial/:uuid` (abrir uno real desde Rastreo y copiar la URL) | `DriverHistoryView.vue` carga `html2canvas` (194,9 kB en el bundle inicial) |
| 5 | Geocercas | `/#/rastreo/geocercas` | Listado con mapa |

## Umbrales objetivo (post-optimización)

| Métrica | Objetivo desktop |
|---|---|
| Performance | ≥ 85 |
| Accessibility | 100 |
| LCP | ≤ 2,5 s |
| TBT | ≤ 300 ms |
| CLS | ≤ 0,1 |

La baseline solo registra el punto de partida; no tiene que cumplirlos.

## Resultados

### Históricos (modo dev contra localhost — no comparables con producción)

| Fecha | Fase | Página | Performance | Accessibility | Notas |
|---|---|---|---|---|---|
| 2026-09-15 | base (fases 1-3) | login | 57 | 100 | navigation desktop, incógnito |
| 2026-09-15 | base (fases 1-3) | dashboard | 55 | 94 | navigation desktop, incógnito; a11y pendiente: button-name, contraste |
| 2026-09-16 | lote L dashboard | dashboard | 55 | 100 | navigation desktop; heading-order, button-name y contraste corregidos |

### Baseline producción (2026-09-23, 09:47–10:07 hora local UTC-5)

Medianas de 3 corridas por página, navigation desktop, incógnito, Lighthouse 13.4.1.
Reportes fuente: carpeta `Lighthouse_23_09_2026` (15 JSON).

| Fecha/hora | Página | Perf (mediana 3x) | A11y | LCP | TBT | CLS | Hora pico | Notas |
|---|---|---|---|---|---|---|---|---|
| 2026-09-23 09:47 | Login | 81 | 96 | 2,2 s | 0 ms | 0,000 | mañana local | Sin autenticar |
| 2026-09-23 09:50 | Dashboard | 67 | 100 | 3,7 s | 0 ms | 0,016 | mañana local | Autenticado |
| 2026-09-23 09:55 | Mapa en vivo | 65 | 100 | 3,8 s | 0 ms | 0,001 | mañana local | Autenticado |
| 2026-09-23 10:00 | Historial conductor | 62 | 91 | 3,9 s | 0 ms | 0,002 | mañana local | URL: `/#/rastreo/historial/29548f69-5078-440a-a7e3-b9072be80f98` |
| 2026-09-23 10:04 | Geocercas | 69 | 96 | 2,8 s | 0 ms | 0,018 | mañana local | Autenticado |

### Segunda jornada (2026-09-23, 16:15–16:31 hora local UTC-5)

Mismo protocolo, 3 corridas por página. Reportes fuente:
`Lighthouse_23_09_2026/Segunda Jornada` (15 JSON, Lighthouse 13.4.1, desktop).

Evidencia de build: la mañana sirvió `vendor-primevue-BE7D1_9o.js` (build previo);
la tarde sirve `vendor-primevue-A2awspw1.js` (build con los frentes 1–4 ya desplegado).
La comparación es un antes/después real del trabajo.

| Página | Perf mañana → tarde | A11y mañana → tarde | LCP mañana → tarde | TBT | CLS |
|---|---|---|---|---|---|
| Login | 81 → **85** (+4) | 96 → 96 | 2,2 s → **1,9 s** (−15 %) | 0 ms | 0,000 |
| Dashboard | 67 → **72** (+5) | 100 → 100 | 3,7 s → **3,0 s** (−20 %) | 0 ms | 0,016 |
| Mapa en vivo | 65 → **75** (+10) | 100 → 100 | 3,8 s → **3,1 s** (−20 %) | 0 ms | 0,001 |
| Historial conductor | 62 → **69** (+7) | 91 → 91 | 3,9 s → **3,1 s** (−21 %) | 0 ms | 0,003 |
| Geocercas | 69 → **74** (+5) | 96 → 96 | 2,8 s → **2,4 s** (−17 %) | 0 ms | 0,018 |

Peso total transferido (mediana por página): login 792 → 695 kB (−12 %);
dashboard ~1520 → ~1420 kB (−7 %); historial ~1682 → ~1575 kB (−6 %);
mapa ~1839 → 1742 kB (−5 %); geocercas ~978 → 958 kB (−2 %).

Umbrales tras la segunda jornada: Perf ≥ 85 solo en login (85); LCP ≤ 2,5 s en
login (1,85 s) y geocercas (2,35 s); TBT y CLS cumplen en todas.

Lectura honesta: la mejora mezcla el bundle nuevo (vendor-primevue −600 kB sin
comprimir) con una tarde de servidor más tranquila (el pico de 2,3 s en geocercas
de la mañana no se repitió; server-ms típico ~200 ms en ambas jornadas). El mapa
sigue con alta varianza entre corridas (una corrida de tarde dio Perf 63 / LCP 4,0 s):
tiles y red, no JS.

Ninguna página cumple aún el objetivo (Perf ≥ 85); accesibilidad al 100 solo en
dashboard y mapa en vivo.

### Tercera jornada (2026-10-05, mañana local UTC-5, parcial sin sesión)

Script `lighthouse.js` (Lighthouse 12.8.2, desktop, 3 corridas, mediana) + página `fuec` agregada al mapa del script. Solo páginas sin auth; las privadas (dashboard, mapa, historial, geocercas, fuec) quedan pendientes de un `--profile` con sesión iniciada.

| Página | Perf (mediana 3x) | A11y | LCP | TBT | CLS | Notas |
|---|---|---|---|---|---|---|
| Login | 91 | 95 | 1,3 s | 0 ms | 0 | vs 81→85 del 23-09; objetivo Perf ≥ 85 cumplido |
| Conductor (`/?view=conductor`) | 89 | 95 | 1,5 s | 0 ms | 0 | Pública (sin redirect a login) |

Reportes fuente: `docs/metrics/lighthouse-apptransportessinbarreras-transportessinbarreras-com-desktop-2026-10-05.json`, `perf-2026-10-05.json`, `perf-apptransportessinbarreras-transportessinbarreras-com-2026-10-05.json`.

### Diagnóstico de la baseline (corrida mediana por página)

| Página | Peso total | Peticiones | JS sin usar | Respuesta servidor | Lectura |
|---|---|---|---|---|---|
| Login | 792 kB | 50 | ~150 ms | ~300 ms | La más liviana; base de comparación |
| Dashboard | 1519 kB | 99 | ~20 ms | ~250 ms | LCP 3,7 s con TBT 0: el costo es red/datos, no bloqueo JS |
| Mapa en vivo | 1839 kB | 104 | ~120 ms | ~435 ms | La más pesada en bytes (tiles + vendor) |
| Historial | 1682 kB | 111 | ~300 ms | ~680 ms | Peor Perf (62) y más peticiones; coherente con `html2canvas` en el bundle inicial (ARQ-014) |
| Geocercas | 980 kB | 64 | ~80 ms | ~2310 ms | Respuesta del servidor > 2 s: revisar ese endpoint en backend |

TBT = 0 ms en las 5 páginas: el hilo principal no se bloquea; el problema es
volumen de bytes + latencia de red/API, no JS pesado en ejecución.

## Reportes automáticos

- `a11y-YYYY-MM-DD.json`: conteo de antipatrones (`npm run test:a11y`).
- `perf-YYYY-MM-DD.json`: pesos de `dist/` + chequeos de `index.html` (`npm run test:perf`).
- `perf-<host>-YYYY-MM-DD.json`: mismo presupuesto contra el HTML desplegado
  (`npm run perf:budget:prod` o `node scripts/perf-budget.js --url=<base>`).
- `lighthouse-<local|prod>-<desktop|mobile>-YYYY-MM-DD.json`: bucle de navegador
  (`node scripts/lighthouse.js --url=<base> --device=<desktop|mobile> --page=<paginas> --runs=3`).
  Mismo comando en local (`vite preview`) y en producción; Lighthouse 12.8.2
  fijado, corridas secuenciales, mediana por página.

## Bucle automatizado (Fase 0, 2026-09-29)

El protocolo manual de arriba sigue vigente para la cifra oficial. Para iterar
se usa el mismo test en ambos entornos:

```bash
# Pesos (incluye public/ + buildId; --url mide el desplegado)
npm run perf:budget:local
npm run perf:budget:prod

# Navegador (requiere `npm run preview` en otra terminal para local)
node scripts/lighthouse.js --url=http://localhost:4173 --page=login --runs=3
node scripts/lighthouse.js --url=http://localhost:4173 --device=mobile --page=conductor --runs=3
node scripts/lighthouse.js --url=https://apptransportessinbarreras.transportessinbarreras.com --page=login,mapa
```

Páginas: `login`, `dashboard`, `mapa`, `historial` (requiere `--uuid=<id>`),
`geocercas`, `conductor` (`/?view=conductor`). Rutas privadas sin `--profile`
miden el login tras el redirect (el informe registra `finalUrl`).
Con `--profile=<dir>` se reutiliza una sesión de Chrome iniciada a mano una vez.

Baseline local 2026-09-29 (build BVZL8Rlr, `vite preview`):
login desktop perf 95 / LCP 1200 ms; conductor móvil perf 65 / LCP 6047 ms.
