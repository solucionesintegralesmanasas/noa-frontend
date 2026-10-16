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

## Dynamic Layout Resolution

- **App.vue Layout Manager**: Layouts are resolved reactively inside `src/App.vue` based on the active route's `to.meta.layout` attribute.
- Routes matching `meta: { layout: 'dashboard' }` are automatically rendered wrapped within `src/components/DashboardLayout.vue`.
- Public/Authentication/Error routes with flat structures are rendered directly without extra boilerplate.

## API Layer

- Axios client in `src/services/api/client.js` — singleton with tenant-aware instances.
- Interceptors (`src/services/api/interceptors.js`) auto-inject Bearer token, log requests, handle 401.
- `BaseService` (`src/services/api/base.service.js`) wraps CRUD + RBAC permission checks.

## Multi-tenant

- `apiClient.forTenant(tenantId)` crea una instancia Axios dedicada (cacheada) con el header `X-Company-UUID`. El backend (`SetCompanyContext`) también acepta `X-Tenant-ID`, pero el frontend envía `X-Company-UUID`.
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
  - Los plugins de persistencia en `src/store/plugins/persistence.js` sincronizan reactivamente el estado de los stores (`auth`, `permissions`, `ui`, `user`) de forma encriptada (AES-GCM) utilizando `secureStorage` respaldado nativamente por `@capacitor/preferences`.
  - El estado `isHydrated` se resuelve asíncronamente en pocos milisegundos tras leer la base de almacenamiento seguro, eliminando bloqueos de 2 segundos durante el bootstrap de la app.
- **APIs & Seguridad**: Servicios API en `src/services/api/`, servicios de seguridad en `src/services/security/`.
- **Manejo de Errores**: Manejo a través de `handleGlobalError()` que despacha eventos personalizados `app:toast`.
- **Monitoreo**: El monitoreo de conectividad se suscribe a los eventos `online`/`offline` nativos y al endpoint `/health`.
- **Media Utility**: `src/utils/media.js` provee la función robusta `getMediaUrl(path, fallback)` para reconstruir de forma absoluta y limpia las rutas de imágenes y archivos cargados en el storage del Backend.
- **Notifications System**: `src/features/notifications/store/notifications.store.js` provee un estado centralizado para alertas tempranas de documentos vehiculares vencidos (SOAT, Tecnicomecánica, Licencias) manteniendo la UI reactiva y dinámica.
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

## Estado del Proyecto y Medición (2026-09-15, actualizado 2026-09-29)

- **Fases 1-3 cerradas:** a11y estructural global, los 25 `*FormView` migrados, dashboard con accesibilidad 100.
- **Rendimiento P0-P2 cerrado:** primeicons y SweetAlert2 fuera del arranque, FontAwesome JS eliminado (−1.2 MB), jQuery/Select2 eliminados (−148 kB) y 28 vistas migradas al wrapper `PrimeSelect`.
- **Medición (2026-09-29):** `totalJS` 2854 kB · `inicialJS` 748 kB · `totalCSS` 277 kB · `vendor-primevue` 228 kB. El presupuesto mide también el `public/` que carga `index.html` (`publicInicialJS` 634 kB + `publicInicialCSS` 1066 kB). Reportes en `docs/metrics/` (`a11y-*`, `perf-*`, `lighthouse-<env>-<device>-*` y `lighthouse.md`).
- **Lighthouse producción (2026-09-23, tarde):** Perf 69–85, LCP 2,4–3,1 s, TBT 0 ms. El cuello son bytes y latencia de API, no JS bloqueante. Local (`vite preview`, 2026-09-29): login desktop 95; conductor móvil 65 con LCP 6 s.
- **Plan de rendimiento:** `noa-backend/PLAN-ARQUITECTURA-RENDIMIENTO-NOA.md` (el backlog ARQ-xxx). Medir siempre en producción o `preview`, nunca contra `localhost:5173`.
- **Perfil autenticado para Lighthouse (2026-10-05):** `--profile="C:\Users\trans_nn1on\lighthouse-profile"` NO retiene la sesión en las corridas headless del script (las privadas caen a `#/login?redirect=...` aunque el perfil tenga token): las páginas privadas se miden manual en DevTools (protocolo de `docs/metrics/lighthouse.md`, 3 corridas, guardar JSON). El script solo sirve para públicas (`login`, `conductor`). Perfil creado con `--user-data-dir` apuntando ahí; no navegar a otros sitios con él.
- **No eliminar `lodash.min.js`:** `public/assets/js/theme.js` usa `window._` 11 veces.
- **Deuda conocida:** `theme.min.css` 892 kB sin purga, `public/assets/js/theme.js` 438 kB, `bootstrap.min.js` global (Modal/Tooltip), Leaflet por CDN, Google Fonts con 5 familias (ahora no bloqueantes; recortar las no usadas), `tenantGuard` sin implementar, ~18 `type="date"` sin migrar a `DateInput`, `vue-tsc` con ~1740 errores de baseline y muy poca cobertura de tests.
- **Componentes de formulario compartidos:** `PrimeSelect`, `PrimeMultiSelect` y `DateInput` viven en `src/components/form/` (importar localmente). `PrimeSelect` fija `focusOnHover=false` y `autoFilterFocus=true`; `DateInput` acepta `dd/mm/aaaa` vía `parsearFechaFlexible` (`src/utils/date.js`). El estado de documentos se normaliza con `src/utils/documentStatus.js` (`SI`/`NO` → `VIGENTE`/`NO VIGENTE`).
- **Pruebas de componentes:** vitest con `jsdom` + `@vue/test-utils`; cada archivo declara `// @vitest-environment jsdom` en la primera línea (entorno por defecto: `node`).

## Módulos y Features del Sistema (`src/features/`)

Listado de submódulos de negocio disponibles y activos en la aplicación:

- **`affiliateAdminCharges`**: Gestión de cobros de afiliación y cuotas de administración mensual de vehículos.
- **`auth`**: Autenticación, inicio de sesión y gestión de credenciales.
- **`bankDetails`**: Configuración de cuentas y detalles bancarios de los actores.
- **`branches`**: Gestión de sucursales u oficinas de las empresas transportadoras.
- **`businessCollaborationAgreements`**: Convenios de colaboración empresarial y contratos entre entidades.
- **`companies`**: Configuración de empresas operadoras (multi-tenant context).
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

## Credenciales de inicio de sesión

Las credenciales de prueba ya no se guardan en este archivo. Pídelas al equipo o usa el `UsuariosSeeder` / `DemoCompanySeeder` del backend en un entorno local.

## Commits

- Una sola línea, en español, formato `tipo(scope): descripción directa`.
- Sin cuerpo ni bullets, salvo que el cambio lo exija para entenderse.
- Tipos: feat, fix, refactor, perf, style, docs, test, build, ci, chore.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout. See `docs/agents/domain.md`.
