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

## 📋 Estado de la Revisión de Código (2026-10-26 / 2026-10-27) y Tareas Pendientes

Durante las jornadas del 26 y 27 de octubre de 2026 se llevó a cabo una revisión integral de código (`/code-review`) cubriendo estándares arquitectónicos y especificaciones de producto para el **Rediseño del módulo de Hoja de Control de Servicio**, la **Normalización de ordenamiento server-side** y los **Datos de Persona en Terceros (Issue #9)**.

A continuación se resume lo completado y los ítems pendientes por abordar.

### ✅ Corregido, Verificado y Subido al Repositorio

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

4. **Gestión de Ramas y Commits en Git (Working Tree Limpio):**
   - Se estructuraron commits atómicos separados por tarea y módulo:
     - **Backend:** `fa6bf84` (Hojas de control y ordenamiento) y `421123c` (Issue #9 Terceros).
     - **Frontend:** `3c03b0b` (Hojas de control, rediseño y stores) y `be5b1bc` (Issue #9 Terceros).
   - Rebase lineal completado y ramas integradas y subidas a `origin/feature`.

5. **Estandarización de Alertas Modales (`confirm.js` con Carga Diferida):**
   - Centralizado el manejo de diálogos asíncronos y modales con `showSwalModal()`, `closeSwal()` y `showLoadingModal()` en [`src/utils/confirm.js`](file:///C:/xampp/htdocs/tsb-design/noa-frontend-tsb/src/utils/confirm.js).
   - Removido todo `import Swal from 'sweetalert2'` directo en las vistas de `serviceDeliveryControlSheet`, asegurando carga diferida por chunks (lazy chunking).

6. **Validación de Fechas y Zona Horaria en Terceros (Issue #9):**
   - En [`ThirdPartiesFormView.vue`](file:///C:/xampp/htdocs/tsb-design/noa-frontend-tsb/src/features/thirdParties/views/ThirdPartiesFormView.vue), normalizada la validación de `birth_date` y `id_card_issue_date` usando formato estándar local `YYYY-MM-DD` (`en-CA`), previniendo desajustes por medianoche UTC.
   - Verificado con suite de pruebas unitarias (`datosPersonaForm.test.js`) pasando al 100%.

7. **Limpieza de Linter y Suite de Pruebas:**
   - Retirado código muerto (`renderKmDia`), dejando ESLint con **0 errores**.
   - Suite completa de 318 pruebas unitarias pasando al 100%.

---

### ⏳ Pendientes por Completar de la Revisión de Código

#### 1. Deprecación y Retiro Definitivo de Vista Legacy (En curso)
- **Contexto:** La vista [`ServiceDeliveryControlSheetFormView.vue`](file:///C:/xampp/htdocs/tsb-design/noa-frontend-tsb/src/features/serviceDeliveryControlSheet/views/ServiceDeliveryControlSheetFormView.vue) corresponde a la edición legacy de hojas de control. El paradigma operativo actual traslada la gestión diaria a "Control en Ruta" y la aprobación ágil del coordinador.
- **Acción requerida:**
  - Retirar la ruta `ServiceDeliveryControlSheetEdit` del enrutador y redirigir intentos de acceso a la lista principal.
  - Eliminar o desacoplar el componente obsoleto de la aplicación.

#### 2. Optimización de Consultas y Caching de Métricas PCP (Backend)
- **Contexto:** Para proyectos con flotillas de más de 50 vehículos y meses acumulados, `resumenProyectosEnLote` computa evidencias y firmas en tiempo de ejecución.
- **Acción requerida:**
  - Incorporar migración con índice compuesto en la tabla de evidencias/firmas (`service_delivery_control_sheet_uuid`, `rol`, `status`).
  - Implementar cacheo ligero para proyectos cuyo estado operativo sea `"Cerrado"` o `"Inactivo"`.

#### 3. Pruebas Automatizadas de Integración / E2E
- **Acción requerida:**
  - Añadir pruebas automáticas para el modal de firma rápida del coordinador y la exportación consolidada de PDF filtrada por proyecto.
