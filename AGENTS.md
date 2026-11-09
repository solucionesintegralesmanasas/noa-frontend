# AGENTS.md — Noa App

## Solo Español
- **name**: solo-espanol
- **description**: IDIOMA: Activa SOLO cuando detectes que el usuario se comunica en español. TODAS las respuestas, explicaciones, análisis, sugerencias y comentarios en código deben estar estrictamente en ESPAÑOL. Prohíbe terminantemente el uso de inglés u otros idiomas en la comunicación humana.

## Stack

- **Core:** Vue 3 (`<script setup>` SFCs, version `^3.5.34`)
- **Build Tool:** Vite 8 (version `^8.0.12`)
- **State Management:** Pinia 3 (version `^3.0.4`)
- **Routing:** Vue Router 4 (version `^4.6.4`)
- **Internationalization (i18n):** vue-i18n 11 (version `^11.4.4`)
- **UI Library:** PrimeVue 4 (`^4.5.5`) + `@primeuix/themes` (`^2.0.3`) con preset Aura. Sin registro global desde 2026-09-23 (ARQ-013): cada vista importa localmente lo que usa.
- **HTTP Client:** Axios (version `^1.16.1`)
- **Alerts & Toasts:** SweetAlert2 (`^11.26.25`) con `import()` diferido vía `utils/toast.js` + Vue Toastification (`^2.0.0-rc.5`)
- **Iconografía:** FontAwesome Pro (CSS + webfonts). `primeicons` eliminado 2026-09-15.
- **Native Mobile:** Capacitor (`^8.4.2`) + Plugins (`android`, `ios`, `filesystem`, `geolocation`, `preferences`, `share`, `CapacitorHttp`)
- **Mobile CI/CD (Appflow):** `@ionic/cli` (`^7.2.1`) para builds nativos en la nube de Ionic Appflow. Repo Appflow: `noa-os` (remote `noa-os`). Guía completa en `APPFLOW.md`.
- **Helpers:** DayJS (`^1.11.21`)
- **Testing/Formatting:** ESLint flat (`npm run lint`, en verde) + `vue-tsc` con `checkJs` (`npm run typecheck`; fase 2, baseline con errores pendientes de tipar). Scripts informativos `test:a11y` / `test:perf` (ver Comandos).

> **Eliminados 2026-09-15:** jQuery, Select2, `primeicons`, `signature_pad`. No reintroducir.

## Commands

| Command           | Purpose                                             |
| ----------------- | --------------------------------------------------- |
| `npm run dev`     | Vite dev server                                     |
| `npm run build`   | Vite production build (outputs to `dist/`)          |
| `npm run preview` | Serve `dist/` localmente (usar para medir prod)     |
| `npm run test`    | `test:a11y` + `test:perf` + `lint` + `test:unit` — lint y unit bloquean, el resto informa |
| `npm run test:a11y` | Conteo de antipatrones a11y en `src/`             |
| `npm run test:perf` | Presupuesto de peso de `dist/` y chequeos HTML (`--strict` con `test:perf:strict` para validar) |
| `npm run test:unit` | Vitest (node/jsdom): canal realtime, componentes de formulario, `secure-storage` (`src/**/__tests__/`) |
| `npm run lint`    | ESLint (flat config, 0 errores en línea base 2026-09-23) |
| `npm run typecheck` | `vue-tsc --noEmit` (fase 2: baseline ~1740 errores, no bloquea `test`) |
| `npm run cap:sync` | `npm run build && npx cap sync` (copia `dist/` a ios/)android/) |
| `npm run cap:assets` | Regenera iconos/splash nativos desde `assets/` (`@capacitor/assets`) |
| `npm run cap:add:android` / `cap:add:ios` | Agrega la plataforma nativa a Capacitor |
| `npm run cap:open:android` / `cap:open:ios` | Abre Android Studio / Xcode |
| `ionic build` / `ionic cap sync` | Builds vía Ionic CLI (mismas operaciones que `build`/`cap:sync`) |

CI (`.github/workflows/ci.yml`): `lint` + `test:a11y` + `build` + `test:unit` en push/PR a `feature`/`develop`/`main`.
CI/CD nativo (`.github/workflows/appflow.yml`): builds en Appflow — Android debug por push a `main`/`develop`; iOS+Android release por tag `v*`. Requiere secrets `APPFLOW_TOKEN`, `APPFLOW_APP_ID`, `APPFLOW_ANDROID_CERT`, `APPFLOW_IOS_CERT`.

> **Para Lighthouse:** medir contra `npm run preview` o el Apache de producción, **nunca** contra `localhost:5173` (dev sirve módulos sin minificar y distorsiona el puntaje).

## Entrypoints & Boot Order

- `index.html` → `src/main.js` (async bootstrap with error UI fallback)
- `main.js` calls `registerPlugins(app)` from `src/utils/plugins.js` — **el orden importa**:
  1. Pinia (state)
  2. PrimeVue (`configurarPrimeVue`): **diferido en el login** (ver abajo); en el resto de rutas se instala antes de montar.
  3. Token Manager + hidratación de stores (auth/permissions/user) **en paralelo** (el router depende de los stores; timeout 1 s)
  4. Router + i18n (idioma por defecto `en` dentro del entry; `es` se carga bajo demanda)
  5. Global error handlers
- **Ruta crítica del login (2026-09-30):** el login es la vista de entrada (`VITE_INITIAL_VIEW=login`) y el objetivo es pintarla lo antes posible:
  - `LoginView` se importa **estáticamente** en `router/index.js` y `features/auth/routes.js` (Vite la precarga en paralelo con el entry). No volver a importarla de forma dinámica.
  - `index.html` inlinea `critical/login.css` (generado por `node scripts/critical-css.cjs` con `npm run preview` activo; regenerar si cambia el login, `theme.min.css` o `user.min.css`) y fija `window.__noaLogin`. Con `__noaLogin` (hash vacío/`#/`/`#/login`, sin clave `secure_` en `localStorage` y fuera de Capacitor) los CSS completos (simplebar, FontAwesome, theme, user) y los scripts de Falcon (simplebar, popper, bootstrap, anchor, is, lodash, theme.js) se cargan **tras el primer pintado** y en el mismo orden; en cualquier otra ruta, con sesión o en la app nativa se cargan bloqueantes como siempre (`document.write`).
  - PrimeVue se instala en idle o, como respaldo, en un `router.beforeEach` antes de salir del login. Los componentes de la vista de entrada, `App.vue` y los stores **no deben usar PrimeVue**.
  - `DashboardLayout` es un componente async en `App.vue` (se precarga en idle desde el login y de inmediato fuera de él).
  - El CSS de SweetAlert2 se importa en `main.js` tras el montaje (idle), no de forma estática.
  - Sin datos guardados no se deriva la clave PBKDF2 al arrancar (`secureStorage.hasStoredData()`).
  - Medición local con CPU 4x + 4G lenta (login móvil): FCP 2,6 s → 1,5 s, LCP 2,65 s → 1,5 s; `inicialJS` 748 → 398 kB.

## Path Aliases (vite.config.js)

`@` → `src/`, `@store`, `@router`, `@utils`, `@services`, `@components`, `@features`, `@pages`, `@assets`

## Auth & Security

- **Laravel Sanctum** PAT-based auth. Token stored encrypted (AES-GCM, WebCrypto API + PBKDF2) in `secureStorage` (`@capacitor/preferences`).
- Login flow: `authService.login()` → returns `{ user, token }` → stores in Pinia + Token Manager.
- 401 responses trigger `auth:unauthorized` custom event, token wipe, and redirect to `/login`.
- Encryption key comes from `VITE_ENCRYPTION_KEY` var.
- Logger masks sensitive fields (`token`, `password`, `secret`, `authorization`, `otp`).
- **Autenticación 2FA & Perfil**: El módulo de seguridad expone flujos interactivos para activar/desactivar 2FA mediante códigos TOTP QR dinámicos procedentes del backend laravel. El panel de configuración e historial de sesión reside unificado dentro de `UserProfileView.vue` bajo la ruta `/profile?tab=security`.
- **Resolución Reactiva de Iniciales**: El Navbar e interfaces resuelven dinámicamente las iniciales y roles del usuario cruzando reactivamente `userStore` y `permissionsStore` para evitar parpadeos o placeholders de carga genéricos.

## Router & Guards

- `src/router/index.js` with guards in sequential order: `authGuard → twoFAGuard → tenantGuard → permissionsGuard`. Utiliza `createWebHashHistory()` para garantizar la compatibilidad híbrida sin pantalla en blanco en Capacitor.
- Guards reales en `src/router/guards/*.js` (`auth.js`, `2fa.js`, `permissions.js`). `tenantGuard` es un pass-through pendiente de implementar.
- Route meta flags: `auth`, `public`, `requiresTenant`, `requires2FA`.
- Error routes: `/401`, `/403`, `/404`, `/500`. Catch-all redirects to `/404`.
- `permissionsStore.hasRole()` normaliza separadores: `super-admin` = `super_admin` = `SUPERADMIN`. Usar `hasRole('superadmin')` / `hasRole('administrador')`.
- **Roles reservados (2026-10-19):** SUPERADMIN y ADMIN_EMPRESA solo se muestran y gestionan para `hasRole('superadmin')`: el backend los oculta de `auth/roles` y `auth/roles/list` para el resto y el frontend filtra además con `features/auth/utils/rolesPrivilegiados.js` (usado en `UsersListView` y `Rolepermissionsform`; en el listado de usuarios se ocultan "Editar roles" y "Quitar rol" para quien tenga un rol reservado). Prueba: `rolesPrivilegiados.test.js`.
- **Terceros multi-tipo y multi-rol (2026-10-19):** se retiró del formulario (`ThirdPartiesFormView.vue`, uses y validación inline) la regla "empleado = único tipo y único rol": ahora se pueden marcar varios tipos de tercero y varios roles de acceso (un empleado también puede ser el coordinador de una sede). El backend acepta la combinación y preserva los roles no gestionados al guardar; los roles reservados siguen ocultos según el bullet anterior.
- **Licencia autollena con el documento (2026-10-19):** en el formulario de conductor (crear y editar), el número de licencia de conducción se autollena con el número de documento (coinciden en Colombia). Espejo de una sola vía, documento → licencia, nunca licencia → documento: si la licencia se tecleó distinta del documento, se respeta; borrar el documento completo limpia la licencia solo si va espejada (una tecleada a mano no se borra). Utilidad `utils/licenciaDeConductor.js` con su prueba. Ajuste de revisión (mismo día): el autollenado NO corre durante la carga del registro (`cargandoRegistro` con watchers flush sincrónico), para no activar la validación dura de licencia (categoría, fechas, afiliado) en un conductor guardado sin licencia; queda solo para el tecleo del usuario o al marcar Conductor después de escribir el documento. La casilla "Seleccionar todos" refleja su estado real (marcada cuando todas las visibles están elegidas, respetando el filtro; cubierto en `PrimeMultiSelect.test.js`) y ya no hay fallback manual del toggle (era código especulativo con bug latente).
- **Terceros: roles reservados fuera del formulario (2026-10-19):** `ThirdPartiesFormView` filtra el catálogo de roles con `rolesVisibles` (`../../auth/utils/rolesPrivilegiados.js`): un actor no SUPERADMIN no puede marcar ni ver SUPERADMIN/ADMIN_EMPRESA; al cargar edición un rol reservado existente se deja fuera de la selección (el backend lo conserva al sincronizar, no se pierde).

## Dynamic Layout Resolution

- **App.vue Layout Manager**: Layouts are resolved reactively inside `src/App.vue` based on the active route's `to.meta.layout` attribute.
- Routes matching `meta: { layout: 'dashboard' }` are automatically rendered wrapped within `src/components/DashboardLayout.vue`.
- Public/Authentication/Error routes with flat structures are rendered directly without extra boilerplate.

## API Layer

- Axios client in `src/services/api/client.js` — instancia canónica única (`apiClient.global`) sin cachés ni mapas de instancias múltiples (SPEC-016).
- Interceptors (`src/services/api/interceptors.js`) auto-inject Bearer token, inyectan dinámicamente `X-Company-UUID` por petición, log requests y handle 401.
- `BaseService` (`src/services/api/base.service.js`) wraps CRUD + RBAC permission checks y delega en `apiClient.global` (inyectando `X-Company-UUID` por petición si el servicio tiene `tenantId` explícito vía Proxy).

## Multi-tenant

- Resolución dinámica de empresa activa (SPEC-016): `requestInterceptor` inyecta en cada solicitud `X-Company-UUID` directamente desde `auth.currentTenant.id` (fallback a `user.company_uuid`). Se eliminaron `apiClient.forTenant()` y los mapas de instancias cacheadas.
- Si una solicitud provee explícitamente `X-Company-UUID` en `config.headers`, esta prevalece. El backend (`SetCompanyContext`) también acepta `X-Tenant-ID`, pero el frontend envía `X-Company-UUID`.
- Tenant ID stored in `auth.currentTenant.id` Pinia state.
- `BaseService` inyecta `third_party_uuid` como parámetro plano en los GET cuando el usuario es afiliado, empleado o conductor (Spatie QueryBuilder falla con filtros anidados).
## i18n

- Locale files at `src/assets/locales/{es,en}.json` loaded via `import.meta.glob`.
- Default locale: `es` (`.env`). Supported: `es`, `en`. Fallback chain: requested → `en` → error.

## Env

- `.env` (development), `.env.production` — both committed. Only `VITE_*` vars exposed.
- `VITE_API_BASE_URL`, `VITE_API_NATIVE_URL` (Capacitor), `VITE_AUTH_TOKEN_KEY`, `VITE_ENCRYPTION_KEY`, `VITE_FEATURE_*` flags.
- **Deuda de seguridad:** `VITE_ENCRYPTION_KEY` viaja en el bundle y en los `.env` versionados, por lo que el cifrado del `secureStorage` no protege contra quien tenga el bundle.

## Key Conventions & Architecture

- **Feature-Driven Design**: Modulares encapsulados en `src/features/{feature}/`. Cada _feature_ debe contener sus propias rutas (`routes.js`), vistas (`views/`), stores (`store/`) y servicios (`services/`). El router principal importa las rutas modulares de cada _feature_.
- **Separación de Lógica y UI (Hooks)**: La lógica compleja, manejo de estado local y llamadas recurrentes se extraen a `src/hooks/` (ej: `useTable.js`, `useFormManager.js`, `useSidebar.js`). Los archivos `.vue` deben mantenerse lo más "limpios" posibles, dedicados primariamente al HTML/UI.
- **Layouts Centralizados**: Los componentes de estructura principal (Navbar, Sidebar, Footer) deben residir estrictamente en `src/components/layout/` y conectarse a la lógica a través de hooks.
- **Store & Plugins (Encrypted Persistence)**:
  - Módulos globales de estado en `src/store/modules/`.
  - Los plugins de persistencia en `src/store/plugins/persistence.js` sincronizan reactivamente el estado de los stores (`auth`, `permissions`, `ui`, `user`) de forma encriptada (AES-GCM) utilizando `secureStorage` respaldado nativamente por `@capacitor/preferences`. Incorporan debouncing (300 ms) por store, omisión de propiedades volátiles (`OMIT_KEYS`), comparación de serialización para no repetir ciclos criptográficos en el hilo principal y vaciado forzado (`flushAllPersistence`) en eventos críticos (SPEC-016).
  - El estado `isHydrated` se resuelve asíncronamente en pocos milisegundos tras leer la base de almacenamiento seguro, eliminando bloqueos de 2 segundos durante el bootstrap de la app.
- **APIs & Seguridad**: Servicios API en `src/services/api/`, servicios de seguridad en `src/services/security/`.
- **Manejo de Errores**: Manejo a través de `handleGlobalError()` que despacha eventos personalizados `app:toast`.
- **Monitoreo**: El monitoreo de conectividad se suscribe a los eventos `online`/`offline` nativos y al endpoint `/health`.
- **Media Utility**: `src/utils/media.js` provee la función robusta `getMediaUrl(path, fallback)` para reconstruir de forma absoluta y limpia las rutas de imágenes y archivos cargados en el storage del Backend.
- **Notifications System**: `src/features/notifications/store/notifications.store.js` provee un estado centralizado para alertas tempranas de documentos vehiculares vencidos (SOAT, Tecnicomecánica, Licencias) manteniendo la UI reactiva y dinámica. El control de alertas mostradas opera en memoria (`Map<uuid, ts>`, no-repetición de 55 min) con persistencia ligera en una sola clave JSON, eliminando lecturas bloqueantes `Preferences.get()` en el arranque móvil (SPEC-016).
- **Importación Obligatoria de Componentes Comunes**: Los componentes compartidos como `BaseFormActions` y `BasePageHeader` no están registrados globalmente. Cada vista que los use debe importarlos explícitamente en `<script setup>` (ej. `import BaseFormActions from '@/components/BaseFormActions.vue';`).

## Accesibilidad y Formularios (obligatorio)

Reglas cerradas en las fases 1-3 (2026-09-15). Verificables con `npm run test:a11y` (objetivo: no aumentar los conteos).

- **Formularios nuevos:** usar `useAccessibleForm.js` (o `useFormManager.js`, su envoltura compatible).
- **Asociación label/control:** `label for` ↔ `id` del control. En `PrimeSelect` usar `:input-id` con el mismo valor del `for`.
- **ARIA por campo:** `:aria-invalid="!!validationErrors['<campo>']"` y `:aria-describedby` condicional al `id` de error.
- **IDs:** control `f-<campo>` (puntos → guiones); error `f-<campo>-error` con `role="alert"`.
- **Foco al primer error:** `.focus()` real (no solo `scrollIntoView`). Selector: `'[aria-invalid="true"], .is-invalid'`.
- **Aislados:** `type="hidden"` no lleva etiqueta ni `id`. `readonly`/`disabled` de cálculo llevan `aria-readonly`/`aria-hidden` según corresponda.
- **Validación:** vacíos con `isEmpty` (equivalente a `!v` + `trim()` para strings); nunca `!value` directo en strings.
- **Iconos decorativos:** `aria-hidden="true"`. Botones icon-only: `aria-label` en español.
- **Prohibido:** `role="button"` en `router-link`, `<a>` sin `href`, `href="#"`, `javascript:void(0)`, `aria-label` en inglés, `console.*` directo (usar `logger`), imports directos de `sweetalert2` (usar `utils/toast.js`).

## Estado del Proyecto y Medición (2026-09-15, actualizado 2026-11-03)

- **Fases 1-3 cerradas:** a11y estructural global, los 25 `*FormView` migrados, dashboard con accesibilidad 100.
- **Rendimiento P0-P2 cerrado:** primeicons y SweetAlert2 fuera del arranque, FontAwesome JS eliminado (−1.2 MB), jQuery/Select2 eliminados (−148 kB) y 28 vistas migradas al wrapper `PrimeSelect`.
- **Medición vigente (2026-11-03):** `totalJS` ~2854 kB · `inicialJS` **429.8 kB** (límite 750 kB) · `totalCSS` **266.9 kB** (límite 350 kB) · `vendor-primevue` **225.4 kB** (límite 250 kB) · `indexJS` **128.4 kB** (límite 150 kB). Todas las vistas diferidas < 150 kB. Presupuesto de peso estricto validado con `npm run test:perf` y compilación Vite en ~2.18 s. Reportes en `docs/metrics/` (`a11y-*`, `perf-*`, `lighthouse-<env>-<device>-*` y `lighthouse.md`).
- **Lighthouse producción (2026-09-23, tarde):** Perf 69–85, LCP 2,4–3,1 s, TBT 0 ms. El cuello son bytes y latencia de API, no JS bloqueante. Local (`vite preview`, 2026-09-29): login desktop 95; conductor móvil 65 con LCP 6 s.
- **Plan de rendimiento:** `PLAN-ARQUITECTURA-RENDIMIENTO-NOA.md` fue retirado del backend (2026-10-15, `aea765c`); el backlog y las cifras viven en SPEC-004 y en el AGENTS del backend. Medir siempre en producción o `preview`, nunca contra `localhost:5173`.
- **Perfil autenticado para Lighthouse (2026-10-05):** `--profile="C:\Users\trans_nn1on\lighthouse-profile"` NO retiene la sesión en las corridas headless del script (las privadas caen a `#/login?redirect=...` aunque el perfil tenga token): las páginas privadas se miden manual en DevTools (protocolo de `docs/metrics/lighthouse.md`, 3 corridas, guardar JSON). El script solo sirve para públicas (`login`, `conductor`). Perfil creado con `--user-data-dir` apuntando ahí; no navegar a otros sitios con él.
- **No eliminar `lodash.min.js`:** `public/assets/js/theme.js` usa `window._` 11 veces.
- **Deuda conocida:** `theme.min.css` 892 kB sin purga, `public/assets/js/theme.js` 438 kB, `bootstrap.min.js` global (Modal/Tooltip), Leaflet por CDN, Google Fonts con 5 familias (ahora no bloqueantes; recortar las no usadas), `tenantGuard` sin implementar, `vue-tsc` con ~1740 errores de baseline y muy poca cobertura de tests.
- **Migración a `DateInput` completada (2026-10-26):** Todos los formularios del sistema migraron los inputs de fecha nativos a `DateInput.vue` (normalización ISO `YYYY-MM-DD`, soporte para pegado `DD/MM/AAAA` con `parsearFechaFlexible`, estilos y accesibilidad homogéneos, propagación de clases `.is-invalid` y bordes de validación del sistema). Se limpiaron además los `console.*` residuales por `logger`, imports directos de `sweetalert2` en vistas públicas y el enlace muerto de `RuesLookupPanel.vue`.
- **Componentes de formulario compartidos:** `PrimeSelect`, `PrimeMultiSelect` y `DateInput` viven en `src/components/form/` (importar localmente). `PrimeSelect` fija `focusOnHover=false` y `autoFilterFocus=true`, e incorpora el centinela interno `__noa_opcion_vacia__` para traducir opciones vacías `'Todas…'` sin que PrimeVue pinte `p-select-label-empty` ni deje el lector en blanco. `DateInput` acepta `dd/mm/aaaa` vía `parsearFechaFlexible` (`src/utils/date.js`). El estado de documentos se normaliza con `src/utils/documentStatus.js` (`SI`/`NO` → `VIGENTE`/`NO VIGENTE`). `PrimeMultiSelect` integra control propio "Seleccionar todos" en la cabecera del panel (PrimeVue 4 `Checkbox` real delegando en `onToggleAll`). `ListPagination.vue` calcula `opcionesEfectivas` para anteponer el `perPage` activo si difiere del estándar `[10, 25, 50, 100]`. Peso medido: sin cambio en JS (3139.1 kB) y +0.2 kB de CSS. Pruebas: `PrimeMultiSelect.test.js`, `PrimeSelect.test.js`, `DateInput.test.js`, `ListPagination.test.js`.
- **Pruebas de componentes:** vitest con `jsdom` + `@vue/test-utils`; cada archivo declara `// @vitest-environment jsdom` en la primera línea (entorno por defecto: `node`).
- **Ramas y releases (2026-10-19):** el trabajo va en `feature`; `main` es la rama de release (tag `v1.0.0` → `5531e3d`, merge del 2026-10-16). **Release v1.0.1:** `main` quedó con el squash de TODO el árbol de `feature` (commit `4ce46ac` "NOA v1.0.1", ya empujado a `origin/main`) y **tag `v1.0.1` (annotated) local, no publicado**. El squash reincluyó los heredados `src/hooks/useForm.js`, `src/hooks/useSelect2.js` y `src/router/guards.js` (residuos del reintegro del remoto, sin referencias usadas): se eliminaron en `feature` el 2026-10-20, después del release (salen en el próximo squash; no confundir con `src/router/guards/auth.js`, que sí está en uso). El siguiente release repite el procedimiento: squash de `feature` a `main` + tag local.
- **Novedades 2026-10-30:**
  - **Estabilidad de cabecera y `.noa-results` en listados:** La regla de desacoplar `:loading="isViewLoading"` de `BasePageHeader` (sin `store.loading`) y preservar `.noa-results` (`v-if="!isViewLoading"`) se extendió a `BillingListView`, `FuelLogListView`, `FuelRequestListView`, `NotificationsListView`, `VehicleReportView` y `VehiclesListView`, eliminando la desaparición del encabezado y parpadeos al buscar o filtrar. Botones responsivos con texto oculto en móvil (`d-none d-sm-inline`) provistos de `aria-label` en español.
  - **Reporte de vehículos (`VehicleReportView` y `vehicleReports.store`):** Barra superior de filtros de consulta con criterio principal (Documentos, Convenio, Sede operativa, Tarjeta de operación, Afiliado, Conductor, Proyecto, Mantenimiento), vencimientos rápidos (vencidas, hoy, por vencer 5d, +15d), vinculación/propiedad (Empresa / Terceros), persistencia y restauración completa en la URL de todos los subfiltros (`doc_type`, `doc_status`, `agreement_status`, `card_status`, `mtto_status`, `filter_value`, `ownership_type`), indicador de sede y badge Propio/Tercero bajo la placa, y pastilla "Exento · Particular" en RCC/RCE y Tarjeta de Operación para vehículos particulares.
  - **Navbar y alertas (`Navbar.vue`):** Soporte de toggle (abrir/cerrar) en los accesos directos de alertas (empresa y terceros) cuando el menú ya está abierto en esa sección, sincronizado con los eventos Bootstrap `shown.bs.dropdown` y `hidden.bs.dropdown`. Prueba: `NavbarNotificationsToggle.test.js` (3).
  - **Configuración de proveedores de facturación (`billing.store.js` y `BillingProviderConfigView.vue`):** Validación de UUID centralizada en `billingProviderConfigService._validarUuid` y watcher reactivo de `uuid` para recarga limpia. Prueba: `billingProviderConfig.test.js`.
- **Novedades 2026-10-20:** la barra de navegación se colgaba al ~85% en el PRIMER login (se encendía en `LoginView.handleLogin` y `endNavigation()` solo se llamaba en el catch): ahora se apaga en el `finally` para éxito, fallo y 2FA, y hay salvaguarda en `router.afterEach`/`router.onError` (`src/router/index.js`) que la apaga tras cualquier navegación. Pruebas: `NavProgressBar.test.js` (3) y `LoginView.barra.test.js` (2, mocks de `vue-router`/`auth.store.js`). Config de vitest: `transformAssetUrls: false` en el plugin Vue para que los `<img src="/...">` del template no se conviertan en imports de archivos al correr en Node.
- **Humo de carga por rol (`scripts/roles-smoke.js`, 2026-10-20):** arnés de Puppeteer (basado en `perf-fuec.js`) que inicia sesión por pantalla con usuarios de prueba y visita rutas por rol, marcando redirecciones de guards, HTTP>=400, errores de consola, barra colgada (>2 s) y capturas en `docs/metrics/roles-smoke/<usuario>/`; reporte JSON en `docs/metrics/roles-smoke-<fecha>.json` (sin versionar como el resto de métricas). Usuarios en la BD local (contraseña = número de documento): combinado AFILIADO+CONDUCTOR `prueba.aficond@example.test`/`900000101`, EMPLEADO+COORDINADOR_CALI `prueba.emplcoord@example.test`/`900000102`, empleado puro `/900000103`, conductor puro `900000201`. Hallazgos: **(1)** el combinado veía la flota de TODA la empresa en `/vehiculos` (bug del backend `VehicleService`, corregido allí); **(2)** cualquier EMPLEADO con tercero vinculado (p. ej. un coordinador de sede creado desde terceros) viajaba con `third_party_uuid=suyo` en TODOS los GET de `base.service` y sus listados quedaban en 0: ahora el filtro se inyecta solo con el rol AFILIADO (`BaseService.parametrosDeLectura`, prueba en `src/services/api/__tests__/BaseService.filtroAfiliado.test.js`, 4 casos); **(3)** el combinado SIEMPRE aterriza en `/dashboard/conductor` (el guard prioriza CONDUCTOR sobre los demás roles: `src/router/guards/auth.js`) — decisión de UX pendiente; **(4)** las rutas sin permiso redirigen a `/401` correctamente; auditoría `authz` del backend solo registra denegaciones esperadas (`third-parties.index`, `projects.list`, `administration.*` para el combinado y el coordinador: habría que decidir permisos antes de activar enforce).
- **Novedades 2026-10-15/19:** facturación y protección por permisos en rutas/vistas llegaron con el merge `10e68ca`; catálogos con guard de roles; puerta de licencia desactivada (`LICENSE_REQUIRED = false` en `src/router/index.js:179`, con comentario de reactivación; el guard queda como no-op de ~150 líneas — `LicenseInput.vue` quedó huérfano, decidir si se elimina); `deploy.yml` eliminado de CI (quedan `ci.yml` + `appflow.yml`, con `VITE_API_BASE_URL` provista por `7921327` para tests sin `.env` versionado); asistente de chat restaurado sin backend (ver módulo `assistant`); billing agregó 3 `type="date"` nativos a la deuda conocida. Verificado el 2026-10-19: radicaciónTO/licencia coherentes con el backend v1.0.0 (radicación 30/30 vitest, backend 62 pruebas en verde).

## Módulos y Features del Sistema (`src/features/`)

Listado de submódulos de negocio disponibles y activos en la aplicación:

- **`affiliateAdminCharges`**: Gestión de cobros de afiliación y cuotas de administración mensual de vehículos.
- **`auth`**: Autenticación, inicio de sesión y gestión de credenciales.
- **`assistant`**: Asistente de chat con burbuja flotante (restaurado `e77a83a`). **Defecto abierto:** llama a `/chat/sessions` y `/chat/messages/{uuid}/feedback`, rutas que el backend eliminó el 2026-10-02 (`5723016`); 404 garantizado hasta portar el module del backend o retirar la feature de nuevo.
- **`bankDetails`**: Configuración de cuentas y detalles bancarios de los actores.
- **`billing`**: Facturación comercial (cotizaciones, facturas internas, notas crédito/débito, resoluciones de facturación, **proveedores tecnológicos ApiDian** —el formulario pide solo nombre, URL y **correo + contraseña de login**; al guardar el backend inicia sesión y guarda el token, que se renueva solo si ApiDian responde 401— con **configuración básica ApiDian** en `/facturacion/proveedores/:uuid/configuracion` —empresa, software, certificado, resoluciones, ambiente y webhook— y **documentos electrónicos genéricos** —soporte, equivalentes POS, nómina 102, eventos RADIAN, con registro, emisión, estado DIAN y borrado con salvaguardas—). Vistas en `/facturacion` + `/facturacion/proveedores` + `/facturacion/proveedores/:uuid/configuracion` + `/facturacion/documentos-electronicos`; rutas protegidas con `meta.permissions` + `permissionsStore.can(...)`; el fetch de catálogos del formulario (`getFormOptions`) degrada a lista vacía pero deja `logger.warn`. Los permisos `electronic_documents.*` se sembraron en la base local por SQL (NO con el seeder, regla vigente) y van en `PermissionSeeder`/`RoleSeeder` para bases nuevas.
- **`branches`**: Gestión de sucursales u oficinas de las empresas transportadoras.
- **`businessCollaborationAgreements`**: Convenios de colaboración empresarial y contratos entre entidades.
- **`companies`**: Configuración de empresas operadoras (multi-tenant context).
- **`brands` / `vehicleClasses` / `inspectionItems` / `objectsContracts` / `withholdings`**: Catálogos compartidos del sistema que abren solo a roles de administración (`meta.roles/permissions`; el backend bloquea su escritura desde 2026-10-01 aunque `authz` siga en auditoría).
- **`conveyorCapacity`**: Capacidad transportadora y control de cupos de la flota.
- **`dashboard`**: Panel principal y widgets de resumen operativo y alertas.
- **`economicactivity`**: Gestión de actividades económicas homologadas por la DIAN.
- **`enablingResolutions`**: Resoluciones de habilitación emitidas por el Ministerio de Transporte.
- **`experiences`**: Experiencia acumulada y contratos previos.
- **`financialStatements`**: Registro de estados financieros y solvencia de la organización.
- **`fuec`**: Gestión completa de Planillas de Viaje FUEC (Formato Único de Extracto del Contrato).
- **`maintenance`**: Historial e inspecciones de mantenimiento mecánico preventivo/correctivo.
- **`notifications`**: Panel de notificaciones internas y alertas tempranas de vencimientos.
- **`operationCards`**: Tarjetas de operación de los vehículos de la flota.
- **`rupRecords`**: Registro Único de Proponentes (RUP).
- **`taxDeclarations`**: Declaraciones tributarias e impuestos de las empresas.
- **`taxInformation`**: Rut y perfiles tributarios.
- **`thirdParties`**: Gestión de terceros (conductores, propietarios, clientes, contratistas).
- **`vehicleDocuments`**: Control de documentos vehiculares (SOAT, Tecnicomecánica, Pólizas).
- **`vehicleInspections`**: Bitácora de inspecciones preoperacionales diarias de vehículos.
- **`vehicles`**: Registro principal del parque automotor (placas, marcas, modelos, etc.).
- **`radicacionTO`**: Expedientes de radicación de tarjeta de operación (listado, wizard de pasos, firma por enlace y TXT RUNT).
- **`controlSheets`**: Planillas de control con PDFs subidos.
- **`humanResources`**: Contratos laborales y recursos humanos.
- **`projects`**: Proyectos con vehículos, conductores y terceros asignados.
- **`serviceDeliveryControlSheet`**: Planilla de control de prestación de servicio (PCP), con firmas y cierre.
- **`systemConfiguration`**: Configuración del sistema (branding, nombres de la empresa).
- **`tracking`**: Rastreo GPS: mapa en vivo, historial de conductor, geocercas y tracking en segundo plano (Leaflet por CDN).
- **`vehicleReports`**: Reportes de vehículos con exportación.

## Hooks Composables (`src/hooks/`)

Abstracciones de lógica reutilizable para mantener los componentes `.vue` dedicados a la interfaz:

- **`useAccessibleForm.js`**: Composable estándar para formularios accesibles (trim, reglas `required/minLength/maxLength/email/pattern`, mensajes con etiqueta, `validateAndFocus`, `fieldAria`/`errorId`, `submit` anti-doble-envío). **Usar en formularios nuevos.**
- **`useFormManager.js`**: Envoltura compatible sobre `useAccessibleForm` (misma firma histórica). `useForm.js` fue eliminado.
- **`useNotifications.js`**: Hook para disparar notificaciones visuales contextuales.
- **`useSidebar.js`**: Control del estado colapsable y responsivo de la barra lateral.
- **`useTable.js`**: Abstracción para el control de tablas, filtros, búsqueda debounced y paginación.
- **`useTableActions.js`**: Manejo de eventos comunes en tablas como confirmación de eliminación con SweetAlert2.
- **`useRealtimeChannel.js`**: Canal realtime unificado (SSE con polling de recuperación): ciclo `setTimeout`, `AbortController`, pausa con la pestaña oculta y backoff. Las vistas no deben crear temporizadores ni conexiones SSE propias.
- **`usePlatform.js`**: Detección de plataforma (web / Android / iOS).
- **`useServerSort.js`**: Hook para ordenamiento server-side en `DataTable` lazy. Traduce `@sort` (1/-1/0) a `sort_by`/`sort_order`, mantiene reactividad con `:sortField` y `:sortOrder`, y sincroniza bidireccionalmente los parámetros `?sort=` y `?order=` en la URL del navegador.
- Otros: `useDocumentWizard.js`, `useGeolocation.js`, `useNitLookup.js`, `useNoAutocomplete.js`.

## Utilidades del Sistema (`src/utils/`)

Funciones auxiliares y configuraciones globales:

- **`connectivity.js`**: Monitorea conectividad `online`/`offline` nativa y realiza health checks al backend.
- **`date.js`**: Helpers para manipulación y visualización consistente de fechas.
- **`env.js`**: Carga y validación segura de variables de entorno con prefijo `VITE_`.
- **`error-handler.js`**: Capturador global de errores de Vue y errores de promesas rechazadas.
- **`i18n.js`**: Configuración y carga asíncrona de lenguajes (`es`, `en`).
- **`logger.js`**: Logging en consola con enmascaramiento automático de información confidencial.
- **`mask.js`**: Utilidades de máscara para inputs (teléfonos, identificación, placas).
- **`media.js`**: `getMediaUrl` para construir URLs absolutas a recursos del servidor.
- **`plugins.js`**: Orquestador principal de inicialización y registro de plugins con logs de rendimiento.
- **`security.js`**: Helpers de cifrado local para la persistencia en `secureStorage`.

## Estado Global y Plugins (`src/store/`)

Estructura de la persistencia de datos y estado global con Pinia:

- **Módulos (`modules/`)**:
  - `auth.js`: Estado de la sesión actual de usuario y token persistente.
  - `config.js`: Configuraciones generales de la app e interfaz de usuario.
  - `permissions.js`: Control de permisos (RBAC) heredados del backend.
  - `user.js`: Información de perfil del usuario logueado.
- **Plugins (`plugins/`)**:
  - `encryption.js`: Abstracción de cifrado para datos del store.
  - `logger.js`: Logger del ciclo de vida de acciones en Pinia.
  - `persistence.js`: Sincronización encriptada reactiva con `secureStorage`.

## Rediseño Stitch en Listados Genéricos (2026-10-23)

Estandarización visual y funcional de las vistas de listado basada en la maqueta Stitch (*Listados - genérico*). Reemplaza la doble tarjeta desalineada y la barra de acciones sobrecargada por componentes y estilos centralizados.

- **Componentes base:**
  - `src/components/RowActions.vue`: Agrupación consistente de acciones de fila. Máximo 2 acciones en línea (`inline: true`, ej. Ver y Editar); el resto pasa a un menú flotante (`⋮`) accesible mediante PrimeVue `Menu`, con las acciones destructivas (`tone: 'danger'`) al final separadas. Reserva un espaciador visual si una fila no tiene acciones en menú para mantener la vertical alineada.
  - `src/components/ListPagination.vue`: Paginador propio que reemplaza al paginador embebido de PrimeVue (`:paginator="false"` en `DataTable`). Muestra a la izquierda `Mostrando X a Y de Z registros | Filas: [N ▾]` y a la derecha los botones de páginas `« ‹ 1 2 3 … N › »` con elipsis inteligente y tamaño cuadrado de 28px. Emite `{ page, rows, first }` compatible con `@page`.
  - `src/assets/styles/components/_data-list.css`: Hoja de estilos compartida. **No se importa en `main.js`** (SPEC-008, historia 16: no debe entrar al arranque): la importan `ListPagination.vue` y `RowActions.vue`, así que viaja con el chunk de cada listado.
    - **Tokens de diseño (`:root`):** `--noa-list-border: #e5e9f0`, `--noa-list-head-bg: #f8fafc`, `--noa-list-head-text: #64748b`, `--noa-list-row-hover: #f8fafc`, `--noa-list-text: #1e293b`, `--noa-list-muted: #64748b`, `--noa-list-radius: 0.5rem`, `--noa-row-action-size: 34px`.
    - **Estructura y layout:** contenedor `.noa-list-card` (toolbar + tabla + paginador en una tarjeta integrada con border-radius `0.75rem`), `.noa-table-fixed` (`table-layout: fixed`) con anchos porcentuales explícitos y scroll horizontal (`min-width`) en tablas extensas.
    - **Buscador `.noa-search`:** input con lupa izquierda, botón limpiar derecho (`.noa-search__clear`), foco accesible (anillo azul `rgba(44, 123, 229, 0.15)`) y supresión del botón nativo de cancelar del navegador (`::-webkit-search-cancel-button`, `::-ms-clear`) para evitar duplicidad de controles.
    - **Jerarquía tipográfica en celdas:** `.noa-cell-strong` (font-weight 600, dato principal como placa, documento o código) y `.noa-cell-sub` (tamaño `0.75rem` color muted, subtexto informativo bajo el dato principal).
    - **Píldoras de estado y Badges:** indicador circular con punto `.noa-status` (`success`, `warning`, `danger`, `muted`) y catálogo completo de `.badge-subtle-*` (`primary`, `secondary`, `success`, `info`, `warning`, `danger`).
    - **Acciones de fila `.noa-row-actions`:** botones cuadrados de 34px (`.noa-row-action`) en reposo neutral con tono sutil activado en hover/foco (`primary`, `warning`, `success`, `danger`) con contraste AA garantizado, más placeholder espaciador (`.noa-row-action--placeholder`) para alinear filas sin menú. Menú flotante `.noa-row-menu` montado en body con ítems tipados y separadores de peligro.
- **Pendientes del rediseño y de las piezas compartidas:** el plan por pasos y módulos vive en `noa-backend/docs/specs/SPEC-008-listados-reutilizables-y-medidos.md` (sección "Avance y pendientes por pasos"). **Antes de migrar un listado o crear una pieza nueva de listado, léela y sigue su orden.**
- **Todo buscador de listado lleva `id="f-<modulo>-busqueda"`** (accesibilidad); un buscador nuevo sin `id` incumple el estándar.

- **Estado de migración de vistas:**
  - **Migradas y verificadas (Bloques 1, 2, 3 + Terceros, Combustible, Convenios y Geocercas):**
    - `ThirdPartiesListView.vue` (Terceros)
    - `VehiclesListView.vue` (Vehículos)
    - `VehicleDocumentsListView.vue` (Documentos vehiculares: SOAT, RTM y Pólizas RCC/RCE)
    - `OperationCardsListView.vue` (Tarjetas de Operación)
    - `RadicacionListView.vue` (Radicación TO)
    - `VehicleInspectionListView.vue` (Inspecciones vehiculares — conserva métricas y vista móvil Capacitor)
    - `MaintenanceListView.vue` (Mantenimiento vehicular)
    - `FuecListView.vue` (FUEC — conserva vista móvil Capacitor)
    - `ProjectsListView.vue` (Proyectos)
    - `ControlSheetsListView.vue` (Planillas de control — conserva vista móvil Capacitor)
    - `ServiceDeliveryControlSheetListView.vue` (Hojas de control de servicio PCP — conserva vista móvil Capacitor)
    - `FuelLogListView.vue` (Control de combustible y kilometraje)
    - `FuelRequestListView.vue` (Solicitudes de tanqueo)
    - `BusinessCollaborationAgreementsListView.vue` (Convenios de colaboración)
    - `GeofenceListView.vue` (Geocercas)
    - `BillingListView.vue` (Facturación)
    - `AffiliateAdminChargesListView.vue` (Cobros y cuotas de administración — conserva métricas de resumen y modal de historial)
    - `EmploymentContractsListView.vue` (Contratos laborales)
    - `FinancialStatementsListView.vue` (Estados financieros)
    - `TaxDeclarationsListView.vue` (Declaraciones de renta)
    - `TaxInformationListView.vue` (Información tributaria)
    - `WithholdingsListView.vue` (Retenciones)
    - `BankDetailsListView.vue` (Datos bancarios)
    - `ExperiencesListView.vue` (Experiencias)
    - `RupRecordsListView.vue` (Registros RUP)
    - `NotificationsListView.vue` (Notificaciones / Alertas y vencimientos)
    - `InspectionItemsListView.vue` (Ítems de inspección)
    - `EconomicActivitiesListView.vue` (Actividades económicas)
    - `EnablingResolutionsListView.vue` (Resoluciones de habilitación)
    - `ConveyorCapacityListView.vue` (Capacidad transportadora)
    - `ObjectsContractsListView.vue` (Objetos de contratos)
    - `VehicleReportView.vue` (Reporte de vehículos)
    - `UsersListView.vue` (Gestión de usuarios y asignación de roles)
    - `CompaniesListView.vue` (Empresas)
    - `BranchesListView.vue` (Sucursales)
    - `BrandsListView.vue` (Marcas de vehículos)
    - `VehicleClassesListView.vue` (Clases de vehículos)

## Ordenamiento de listados server-side (2026-10-23)

- **Comportamiento en `DataTable`:** En modo `lazy`, las columnas con `sortable` requieren `:sortField="sortField"` (o `store.sortField`), `:sortOrder="sortOrdenPrimeVue"` (o `store.sortOrder`) y `@sort="onSort"` (o `@sort="handleSort"`).
- **Hook `useServerSort.js`:** Admite tanto el objeto de opciones `{ field, order, onChange }` como la función directa `useServerSort((field, order) => ..., options)`. Expone `{ sortField, sortOrder, sortOrdenPrimeVue, onSort, handleSort: onSort, restore, reset }`, traduce las direcciones de PrimeVue (`1` -> asc, `-1` -> desc, `0` -> null) y sincroniza los parámetros en la URL con `router.replace({ query: { ...route.query, sort, order } })`.
- **Ciclo de vida en vistas:** antes de `store.fetchItems()` se recupera `route.query.sort`/`order` **sin doble petición**. Hay dos patrones válidos: (a) la vista enlaza `:sortField`/`:sortOrder` al **store** y en `onMounted` asigna `store.sortField`/`store.sortOrder` (p. ej. `UsersListView`); (b) la vista enlaza los refs del composable y llama `restore(sortParam, orderParam)`. No mezclar ambos en una misma vista: si el DataTable lee del composable, `restore()` es obligatorio.
- **Pendientes de ordenamiento y búsqueda:** helper común de `sort_order` para los stores y otras mejoras en SPEC-008 (Pasos 4 y 5).
- **Búsqueda (2026-10-24):** `useTable.debouncedSearch` ignora el `InputEvent` que Vue le pasa con `@input="debouncedSearch"` y espera 400 ms (antes caía a 0 ms y lanzaba una petición por tecla). `BaseService` cancela el `getAll` previo del mismo recurso (`AbortController`) y `runStoreAction` ignora las cancelaciones y mantiene `loading` hasta que termina la última petición en vuelo. Los catálogos de terceros y vehículos para selectores pasan por `src/utils/catalogFormatters.js` (`formatThirdPartyList`, `formatVehicleList`): el selector de placa usa `option-label="display_plate"` y `PrimeSelect` amplía solo el filtro (documento, apellido, razón social, móvil) cuando las opciones traen esos campos.
- **Regla en Stores:** Las acciones `fetchItems()` envían `sort_by` y `sort_order` normalizando tanto valores numéricos (`1`/`-1`) como textuales (`asc`/`desc`). La acción `clearFilters()` limpia únicamente la búsqueda y resetea a página 1, **sin alterar** `sortField` ni `sortOrder`.
- **Cobertura total implementada:** Todos los listados paginados de la aplicación (Bloques 1, 2, 3 y 4 completos) cuentan con ordenamiento server-side sincronizado en URL tanto en Backend (`$sortableFields`, `applySorting`, validación de dirección) como en Frontend (Pinia + PrimeVue DataTable + `useServerSort`).

## Corrección de filtros y estabilidad visual en listados (2026-10-26)

- **Estabilidad de toolbar y encabezado en Hojas de Control (`ServiceDeliveryControlSheetListView`):**
  - Se desacopló el `:loading="isViewLoading || store.loading"` del `BasePageHeader` a `:loading="isViewLoading"`. Anteriormente, cada vez que el usuario escribía en el buscador o cambiaba un filtro, `store.loading` activaba el estado esqueleto del header, haciendo desaparecer los botones de acción e iconos ("Actualizar", "Reportes", "Nuevo", "Control en Ruta").
  - El contador de resultados `.noa-results` ya no se destruye con `v-if="!isViewLoading && !store.loading"`. Ahora permanece visible en la toolbar y alterna un indicador de carga sutil cuando `store.loading` está activo, eliminando el parpadeo y la desaparición del icono `<i class="fas fa-filter">`.
- **Filtros en Reporte de Vehículos (`VehicleReportView` y `vehicleReports.store`):**
  - Se corrigió `currentParams` en el store para evaluar `hasActiveFilter` de forma segura: `filter_type` solo se envía a la API cuando el filtro dependiente tiene un valor asignado.
  - Al cambiar de tipo de filtro (`onFilterTypeChange`), la tabla recarga los datos generales de inmediato en lugar de dejar filas huérfanas o provocar errores 422 en el backend.
  - Se normalizó el manejo de opciones dependientes (afiliados, conductores, proyectos, tarjetas de operación, mantenimiento, convenios y sedes operativas) y la limpieza total (`clearAll`).
  - Persistencia bidireccional en URL de todos los subfiltros (`doc_type`, `doc_status`, `agreement_status`, `card_status`, `mtto_status`, `filter_value`, `ownership_type`), garantizando que recargas y enlaces compartidos conserven los datos filtrados y el estado del formulario.
  - Paridad de columnas Propiedad y Sede en tabla, Excel y PDF; en vehículos particulares, las pólizas RCC/RCE y Tarjeta de Operación muestran la pastilla "Exento · Particular" (Decreto 1079/2015).
  - Eliminación de métodos redundantes `getBranches()` y `loadBranches()` (el catálogo de sedes se integra en `getFilterOptions("branch")`).

## Portal Conductor y Componentes Móviles (2026-10-20 / 2026-10-25)

Estandarización de la experiencia móvil nativa y web para el rol conductor (`src/components/mobile/` y `src/components/layout/MobileConductorLayout.vue`):

- **Layout Móvil Dedicado (`MobileConductorLayout.vue`):**
  - Shell exclusivo para móvil/conductor que aplica la clase `mobile-conductor-active` en `body` y expande el ancho completo (`mobile-full-width`).
  - Barra superior compacta (`mobile-topnav`): en inicio (`/dashboard` o `/dashboard/conductor`) muestra el logo institucional y subtítulo; en subpáginas operativas muestra botón atrás con icono `fas fa-arrow-left`, título dinámico y subtexto "Portal Conductor". Acciones a la derecha: campana de notificaciones con punto indicador no leído (`mobile-bell-dot`), avatar circular de iniciales enlazado al perfil y botón accesible de cierre de sesión con confirmación SweetAlert2.
  - Barra de navegación inferior fija (`mobile-bottomnav`): zona de pulgar con 4-5 destinos operativos, icono FontAwesome, etiqueta corta y punto indicador activo (`mobile-nav-dot`).
  - Enlace de salto de accesibilidad (`mobile-skip-link`) al contenido principal (`#contenido-movil`).
- **Sistema de Componentes Móviles:**
  - `MobileCard.vue`: tarjeta base con borde de radio `16px`, padding compacto `12px 12px 10px`, línea de acento superior de `3px` con 5 variantes cromáticas (`blue`, `orange`, `green`, `teal`, `neutral`), pastilla de conteo `mc-count` en esquina superior derecha, y slots estructurados (`icon`, `badge`, `default`, `actions`).
  - `MobileSectionHeader.vue`: separador de sección con tipografía seminegrita, icono temático y contador opcional.
  - `MobileEmptyState.vue`: ilustración y mensaje descriptivo para listas vacías en dispositivos móviles.
- **Regla Única de Modo Conductor (`src/utils/modoConductor.js`):**
  - `ANCHO_MOVIL_MAX = 768px`.
  - Rutas operativas del conductor (`RUTAS_OPERATIVAS_CONDUCTOR`): `/dashboard`, `/inspeccion-vehiculos`, `/planillas-de-control-de-servicios`, `/planilla-de-control-de-prestacion-servicios`, `/extracto-de-contrato`, `/vehiculos`, `/profile`, `/notificaciones`, `/flota/solicitudes-tanqueo`. En estas rutas el conductor utiliza siempre el shell móvil de Android, tanto en web como en la app Capacitor.
  - Soporte para previsualización mediante query string: `?view=conductor` fuerza el modo conductor en rutas operativas para pruebas de diseño/administración; `?view=admin` lo desactiva.
- **Utilidades de Presentación del Conductor (`src/features/dashboard/utils/presentacionConductor.js`):**
  - Funciones puras compartidas: `primerNombre` (capitalización adecuada del nombre de pila), `iniciales` (dos letras mayúsculas para avatar), `saludoPorHora` ("Buenos días", "Buenas tardes", "Buenas noches"), `filtrarVehiculos` (búsqueda insensible a mayúsculas por placa, marca, línea o interno) y `formatearPlaca` (formato estándar colombiano `ABC · 123`).

## Hojas de Control por Proyecto y Conmutador de Proyectos (SPEC-009, 2026-10-21 / 2026-10-29)

Rediseño integral de la gestión de Hojas de Control de Servicios (PCP) en `ServiceDeliveryControlSheetListView.vue` y `ServiceDeliveryControlSheetFormView.vue`:

- **Conmutador de Vista (Modo Proyectos vs Lista Plana):**
  - Barra global superior con selector segmentado: `Vista Proyectos` (organizada por tarjetas de proyecto) y `Lista Plana Todos los Vehículos` (con selector auxiliar `filtro-proyecto-flat` vía `PrimeSelect`).
- **Tarjetas de Proyectos (`ProjectSwitcherCards.vue`):**
  - Cuadrícula de tarjetas interactivas de proyecto con foco y selección accesible (`role="button"`, `:aria-pressed`, `@keydown.enter.space`).
  - Barra superior del conmutador con conteo global de proyectos y vehículos activos.
  - Filtros rápidos en tarjeta: `Todos`, `Con Pendientes` (badge amarillo) y `Al Día` (badge verde).
  - Paginador de proyectos (de 4 en 4) para evitar sobrecarga vertical en empresas con múltiples frentes de operación.
  - Botón de creación rápida "Agregar Proyecto" condicionado por permisos (`projects.create`).
  - Cabecera contextual del proyecto seleccionado integrada en `.noa-list-card` con placa, fechas de vigencia y accesos a planillas.
- **Creación Masiva por Proyecto (SPEC-009):**
  - En tipo "Control Directo con la Empresa", el formulario reemplaza los selects individuales por una tabla sobria con casillas de verificación de los vehículos asignados al proyecto (placa, interno, conductor y documento), marcados por defecto y con selector maestro "Seleccionar todos".
  - Resumen vivo de creación: cálculo automático *"Se crearán N hojas (una por coche) y M planillas diarias"*.
  - Llamada a endpoint masivo `POST /bulk` con transacción única en backend y feedback inmediato.
- **Edición de hojas de control de servicio (2026-10-29):**
  - Un solo `ServiceDeliveryControlSheetFormView.vue` atiende crear y editar (`isEditMode`): mismo marcado, diferencias por computados y `v-if`.
  - En edición: tipo de hoja deshabilitado (inmutable; el backend responde 422 si se cambia), bloque «Estado» oculto e `is_active` fuera del payload (reservado al cierre, SPEC-002 §7.2), fecha de servicio sincronizada con `start_date`, selects individuales de vehículo/conductor (la tabla masiva por proyecto es solo de creación) y `buildPayload` con lista explícita de campos (nunca `children` ni `internal_control` del show).
  - Multi-día: al cambiar proyecto, fechas, tipo o pareja se propaga a las hojas hijas abiertas y se conservan las cerradas; extender el rango crea planillas diarias faltantes y recortarlo elimina solo días abiertos sin evidencia (422 si el día tiene km, horas, recorridos o firmas).
  - Listado: acciones en línea **Continuar servicio + Editar**; PDF y Firma del coordinador pasan al menú ⋮; en móvil «Editar» solo aparece con `service_delivery_control_sheets.update` y hoja abierta.
  - Pruebas: `formularioEdicion.test.js` (3) y `listadoEdicion.test.js` (2); backend `EdicionHojaControlTest` (13 casos, 154 aserciones).
- **Planillas de Control (`ControlSheetsListView.vue`):**
  - Agrupación por proyectos y persistencia del orden server-side.

## Rastreo GPS en Vivo y Gestión de Combustible (2026-10-22 / 2026-10-28)

- **Mapa GPS en Vivo a Pantalla Completa (`src/features/tracking/views/LiveTrackingView.vue`):**
  - Interfaz depurada a pantalla completa, eliminando leyendas de estado flotantes que obstruían el mapa.
  - Umbral de frescura de 12 horas (`src/features/tracking/utils/conductoresVigentes.js`): conductores sin reporte en las últimas 12 horas se ocultan automáticamente del trazado activo.
  - Auto-arranque del GPS al iniciar sesión y servicio de latido en segundo plano para conductores activos.
- **Módulo de Combustible y Tanqueo:**
  - Modal de Estado de Combustible (`FuelStatusDialog.vue`): semaforización de consumo de flota (`EXCEDIDO`, `PROXIMO`, `OK`, `SIN_DATOS`) con fórmulas financieras precisas (redondeo half-even).
  - Solicitudes de Tanqueo (`FuelRequestListView.vue`): listado unificado con búsqueda y filtros por estado de autorización.
  - Portal móvil conductor: visualización de solicitudes de tanqueo activas y generación de código QR para redención en estación de servicio.

## Vinculación de conductores existentes (2026-11-01)

Al crear un conductor, `ThirdPartiesFormView` consulta `GET /third-parties/driver-lookup` al salir del documento. Si el documento ya corresponde a un conductor de la empresa, el formulario normal se oculta y aparece un panel de **vínculo** con identidad y licencia en solo lectura; al guardar se llama `POST /third-parties/{uuid}/affiliates` y **no** se crea tercero, licencia ni usuario. Un afiliado solo puede vincularse a sí mismo; administración elige el afiliado destino en el panel. Si el conductor ya está vinculado, el botón queda deshabilitado. El lookup no expone correo, teléfono, dirección, banco ni seguridad social. Prueba: `vinculacionConductor.test.js`.

## Credenciales de inicio de sesión

Las credenciales de prueba ya no se guardan en este archivo. Pídelas al equipo o usa el `UsuariosSeeder` / `DemoCompanySeeder` del backend en un entorno local.

## Convención de Commits

- Mensajes directos en español, en una sola línea, formato `tipo(scope): descripción corta`.
- Sin cuerpo ni bullets, salvo que el cambio lo exija para entenderse. Cuando lo exija: un cuerpo breve (una o dos frases, o tres puntos como máximo), nunca el listado de archivos o de cambios punto por punto.
- **Cuándo commitear:** solo después de revisar el código, mediante una skill de revisión (`/code-review`) o una revisión propia contra los estándares de este archivo, o cuando el usuario lo solicite explícitamente. No commitear código sin revisar; si la revisión encuentra hallazgos, se corrigen antes de commitear y las métricas de rendimiento/a11y se miden antes y después.
- **Propuesta previa de commits obligatoria:** después de cada revisión de código o del uso de cualquier skill relacionada con revisar código (como `/code-review`), se debe recomendar la propuesta concreta de commits antes de crearlos: el nombre recomendado (si corresponde a un único commit atómico) o la secuencia de múltiples commits con sus respectivos nombres y alcances si los cambios tocan distintas responsabilidades. Se debe **esperar siempre la confirmación o selección explícita del usuario antes de crear o ejecutar cualquier commit**. Prohibido terminantemente commitear sin permiso expreso del usuario.
- **Sin commits de relleno:** los ajustes de `AGENTS.md` que documentan un cambio van en el mismo commit de ese cambio (nada de commits `docs` separados para este archivo ni correcciones sucesivas de la misma prosa), y la instalación o actualización de skills va en un único commit.
- Tipos: feat, fix, refactor, perf, style, docs, test, build, ci, chore.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout. See `docs/agents/domain.md`.
