# 🦅 NextFUEC App

NextFUEC es una plataforma robusta de **Gestión Avanzada de Transporte** (FUEC). Diseñada bajo una arquitectura empresarial escalable ("Feature-Driven") que garantiza un mantenimiento sencillo, alta seguridad y un rendimiento excepcional.

---

## 🛠️ Stack Tecnológico

El proyecto está construido utilizando las últimas y más eficientes herramientas del ecosistema frontend:

- **Core:** Vue 3 (Composition API / `<script setup>`)
- **Build Tool:** Vite 8 (Ultra rápido)
- **Estado Global:** Pinia 3
- **Enrutamiento:** Vue Router 4 (con Guards de seguridad avanzados)
- **Diseño y UI:** Plantilla *Falcon Admin* + Bootstrap 5 + PrimeVue 4
- **Conectividad:** Axios (con interceptores para manejo de tokens)
- **Seguridad:** Encriptación de variables locales (AES-GCM, WebCrypto API)

---

## 🏗️ Arquitectura del Proyecto

El proyecto se aleja de las estructuras tradicionales de Vue para adoptar un modelo **"Enterprise-Ready"**:

1. **Feature-Driven Design (`src/features/`):** 
   La aplicación está dividida por módulos (Ej: `auth`, `vehiculos`, `facturacion`). Cada módulo es independiente y contiene sus propias rutas, vistas y lógica.
2. **Lógica separada en Hooks (`src/hooks/`):** 
   Toda la lógica de negocio (formularios, tablas, notificaciones, menús) se extrae a *Composables* (`useTable.js`, `useFormManager.js`). Los archivos `.vue` son exclusivamente para la interfaz gráfica (HTML/CSS).
3. **Layouts Globales (`src/components/layout/`):** 
   Componentes estructurales como `Navbar.vue` y `Sidebar.vue` residen aquí y se comunican con los Hooks para mantener el código visual limpio.
4. **Router Seguro:**
   Múltiples capas de seguridad (`authGuard` -> `twoFAGuard` -> `tenantGuard` -> `permissionsGuard`) bloquean el acceso no autorizado de forma secuencial.

---

## 🚀 Comandos Rápidos

Para empezar a trabajar con el proyecto, utiliza los siguientes comandos en tu terminal:

### Instalar dependencias
```bash
npm install
```

### Iniciar servidor de desarrollo
Levanta un servidor local con recarga rápida (HMR).
```bash
npm run dev
```

### Compilar para producción
Genera la carpeta `dist/` con el código optimizado, minificado y dividido en *chunks*.
```bash
npm run build
```

### Previsualizar el Build
Permite probar la carpeta `dist/` localmente antes de subirla a producción.
```bash
npm run preview
```

---

## 🔒 Variables de Entorno
El proyecto utiliza archivos `.env` para la configuración. Las variables públicas deben empezar con `VITE_`.
Ejemplo:
- `VITE_API_BASE_URL`: URL del backend.
- `VITE_ENCRYPTION_KEY`: Llave de encriptación para el almacenamiento local.

*(Asegúrate de revisar el archivo `AGENTS.md` para conocer las reglas completas de contribución y convenciones de código).*

---

## 📋 Estado de la Revisión de Código (2026-10-26) y Tareas Pendientes

Durante la jornada del 26 de octubre de 2026 se llevó a cabo una revisión integral de código (`/code-review`) cubriendo estándares arquitectónicos y especificaciones de producto para el **Rediseño del módulo de Hoja de Control de Servicio**, la **Normalización de ordenamiento server-side** y los **Datos de Persona en Terceros (Issue #9)**.

A continuación se resume lo completado y los ítems pendientes por abordar.

### ✅ Corregido y Verificado en la Sesión

1. **Normalización del Ordenamiento Server-Side (Pinia + Backend):**
   - Corregidos **16 stores Pinia** para soportar el formato `'desc'`/`'asc'` enviado por `useServerSort.js`, garantizando que la dirección del orden no se pierda ni quede indefinida en los payloads de la API, y normalizando a `1`/`-1` para el indicador visual de orden en PrimeVue.
   - En backend, [`ServiceDeliveryControlSheetService.php`](file:///C:/xampp/htdocs/tsb-design/noa-backend/app/Services/ServiceDeliveryControlSheet/ServiceDeliveryControlSheetService.php) soporta ordenamiento por `vehicle_license_plate`, `start_date` y `service_date` mediante subconsultas `COALESCE` entre vehículos internos y subcontratados.

2. **Filtro de Estado `con_pendientes` y Métricas en Lote (Backend):**
   - [`ServiceDeliveryControlSheetService.php`](file:///C:/xampp/htdocs/tsb-design/noa-backend/app/Services/ServiceDeliveryControlSheet/ServiceDeliveryControlSheetService.php): Reescrito el filtro `con_pendientes` utilizando `whereNotExists` con constantes formales (`PcpEvidence::ENTITY_COORDINADOR`, `Signature::ROL_COORDINADOR`, `Signature::STATUS_VIGENTE`), soportando hojas de 1 día y multi-día (hijos) y excluyendo justificaciones de excepción (`exception_reason`).
   - [`PcpEvidence.php`](file:///C:/xampp/htdocs/tsb-design/noa-backend/app/Services/ServiceDeliveryControlSheet/PcpEvidence.php): `resumenProyecto` delega directamente en `resumenProyectosEnLote`, eliminando 55 líneas de código duplicado.

3. **Consistencia Visual y UX en el Rediseño de Hojas de Control (Frontend):**
   - [`ProjectSwitcherCards.vue`](file:///C:/xampp/htdocs/tsb-design/noa-frontend-tsb/src/features/serviceDeliveryControlSheet/components/ProjectSwitcherCards.vue): 
     - Sustituida la abreviatura ambigua `"Inc"` por `"Incompletos"`.
     - Corregido el cálculo de la barra de progreso para descontar días en curso y evitar sumatorias superiores al 100%.
     - Eliminada la etiqueta `"Seleccionado"` que se sobreponía al contador de vehículos.
     - Botón `"Agregar proyecto"` estilizado en verde (`btn-success`) con transiciones suaves en hover.
   - [`ServiceDeliveryControlSheetListView.vue`](file:///C:/xampp/htdocs/tsb-design/noa-frontend-tsb/src/features/serviceDeliveryControlSheet/views/ServiceDeliveryControlSheetListView.vue):
     - Unificados y agrupados los botones de acción del proyecto (`Reporte Consolidado`, `Ver Proyecto`, `Editar Proyecto`) con estilo azul, contraste consistente e iconos representativos.
     - Eliminado el botón duplicado `"Reportes"` que estaba junto a `"Actualizar datos"`.
     - Acciones por vehículo simplificadas a `"Continuar servicio"`, `"Descargar PDF"` y `"Firma coordinador"`; removidos `"Editar"` y `"Eliminar"`.
     - Eliminado el uso de `v-html` en el listado (`formatKmValor`) previniendo riesgos XSS.
     - Botón de `"Reporte Consolidado"` visible también en vista plana (sin proyecto seleccionado).
   - [`ServiceReportsDialog.vue`](file:///C:/xampp/htdocs/tsb-design/noa-frontend-tsb/src/features/serviceDeliveryControlSheet/components/ServiceReportsDialog.vue):
     - Icono actualizado a `fad fa-file-chart-line` (FontAwesome 5 Pro).
     - Pre-carga automática de rango de fechas (`fecha_desde` / `fecha_hasta`) y propagación del `project_uuid` seleccionado.

---

### ⏳ Pendientes por Completar de la Revisión de Código

Los siguientes puntos fueron identificados durante la auditoría de estándares y especificaciones y deben completarse en las siguientes iteraciones:

#### 1. Gestión de Ramas y Commits en Git (Working Tree Limpio)
- **Problema:** En el working tree actual coinciden dos tareas de negocio distintas:
  1. El rediseño y ordenamiento de Hojas de Control de Servicio (`serviceDeliveryControlSheet`, stores Pinia y `PcpEvidence`).
  2. El Issue #9: Datos de nacimiento y cédula en Terceros (`ThirdParty`, `ValidaDatosPersona`, migraciones y vistas de terceros).
- **Acción requerida:**
  - Crear una rama específica para el Issue #9 (ej. `feature/issue-9-terceros-datos-nacimiento`) y commitear sus cambios de forma aislada.
  - Crear una rama para el rediseño de Hojas de Control (ej. `feature/redisenio-hojas-control-servicio`) con los cambios de frontend y backend correspondientes.

#### 2. Estandarización de Alertas Modales (`sweetalert2` vs `@/utils/toast.js`)
- **Problema:** [`ServiceDeliveryControlSheetListView.vue`](file:///C:/xampp/htdocs/tsb-design/noa-frontend-tsb/src/features/serviceDeliveryControlSheet/views/ServiceDeliveryControlSheetListView.vue) y [`ServiceDeliveryControlSheetFormView.vue`](file:///C:/xampp/htdocs/tsb-design/noa-frontend-tsb/src/features/serviceDeliveryControlSheet/views/ServiceDeliveryControlSheetFormView.vue) aún importan `Swal from 'sweetalert2'` directamente en vez de emplear la utilidad centralizada del proyecto.
- **Acción requerida:**
  - Migrar todas las invocaciones a `showSwalModal()` desde `@/utils/toast.js` para mantener una única fuente de verdad en temas, accesibilidad y configuración de modales.

#### 3. Deprecación y Retiro Definitivo de Vista Legacy
- **Problema:** [`ServiceDeliveryControlSheetFormView.vue`](file:///C:/xampp/htdocs/tsb-design/noa-frontend-tsb/src/features/serviceDeliveryControlSheet/views/ServiceDeliveryControlSheetFormView.vue) se encuentra marcada como deprecated tras el cambio de paradigma hacia "Control en Ruta" y la firma rápida del coordinador.
- **Acción requerida:**
  - Remover la ruta `ServiceDeliveryControlSheetEdit` del archivo de rutas cuando se dé por finalizada la fase de transición.
  - Eliminar el componente o dejar una redirección informativa temporal.

#### 4. Validación de Fechas y Zona Horaria en Terceros (Issue #9)
- **Problema:** En [`ThirdPartiesFormView.vue`](file:///C:/xampp/htdocs/tsb-design/noa-frontend-tsb/src/features/thirdParties/views/ThirdPartiesFormView.vue), la regla `before:today` para `birth_date` puede disparar falsos positivos si la conversión de la fecha local a medianoche UTC adelanta o retrasa el día según el huso horario del cliente.
- **Acción requerida:**
  - Normalizar el formateo de fecha a formato ISO estricto `YYYY-MM-DD` sin desfase de zona antes de someterlo a validación en el hook y en VeeValidate.

#### 5. Optimización de Consultas y Caching de Métricas PCP (Backend)
- **Problema:** Para proyectos de transporte a gran escala (con más de 50 vehículos y cientos de días acumulados), `resumenProyectosEnLote` realiza agregaciones en tiempo de consulta que evalúan firmas y días incompletos.
- **Acción requerida:**
  - Evaluar la incorporación de un índice compuesto en la tabla de evidencias/firmas (`service_delivery_control_sheet_uuid`, `rol`, `status`).
  - Analizar un mecanismo de cacheo ligero para proyectos cuyo estado operativo esté `"Cerrado"` o `"Inactivo"`.

#### 6. Pruebas Automatizadas de Integración / E2E
- **Acción requerida:**
  - Incorporar pruebas automáticas para el flujo completo del modal de firma del coordinador (aprobación/rechazo de evidencias) y para la descarga consolidada de PDF filtrada por proyecto.
