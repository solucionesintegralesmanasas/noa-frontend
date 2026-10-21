<template>
    <nav v-if="showSidebar" class="navbar navbar-light navbar-vertical navbar-expand-xl" aria-label="Navegación principal">
        <div>
            <router-link class="navbar-brand" to="/dashboard" aria-label="Ir al dashboard">
                <div class="d-flex align-items-center py-2 gap-2">
                    <img loading="lazy" src="/logo-solo-simbolo.svg" alt="Transportes Sin Barreras" class="sidebar-brand-symbol" width="48" height="36" />
                    <img loading="lazy" src="/logo-solo-letras.svg" alt="Transportes Especiales Sin Barreras" class="sidebar-brand-letters" width="140" height="30" />
                </div>
            </router-link>
        </div>

        <div class="collapse navbar-collapse" id="navbarVerticalCollapse">
            <div class="navbar-vertical-content scrollbar">
                <ul class="navbar-nav flex-column mb-3" id="navbarVerticalNav">
                    <template v-for="section in visibleSections" :key="section.id">
                        <!-- Título de sección -->
                        <li v-if="section.label" class="nav-item">
                            <div class="row navbar-vertical-label-wrapper mt-3 mb-2">
                                <div class="col-auto navbar-vertical-label">{{ section.label }}</div>
                                <div class="col ps-0">
                                    <hr class="mb-0 navbar-vertical-divider" />
                                </div>
                            </div>
                        </li>

                        <template v-for="item in section.items" :key="item.id">
                            <!-- Grupo con submenú -->
                            <li v-if="item.children" class="nav-item">
                                <button class="nav-link dropdown-indicator w-100 text-start bg-transparent border-0"
                                    :aria-expanded="isOpen(item.id)" :aria-controls="`sidebar-${item.id}`"
                                    @click="toggleCollapse(item.id)" type="button">
                                    <span class="d-flex align-items-center">
                                        <span class="nav-link-icon" aria-hidden="true"><span class="fas" :class="item.icon"></span></span>
                                        <span class="nav-link-text ps-1">{{ item.label }}</span>
                                    </span>
                                </button>
                                <ul class="nav collapse" :class="{ show: isOpen(item.id) }" :id="`sidebar-${item.id}`">
                                    <li v-for="child in visibleChildren(item)" :key="child.id" class="nav-item">
                                        <router-link class="nav-link" :class="{ active: isItemActive(child) }"
                                            :to="routeOf(child)"
                                            :aria-current="isItemActive(child) ? 'page' : undefined">
                                            <span class="d-flex align-items-center">
                                                <span class="nav-link-text ps-1">{{ child.label }}</span>
                                            </span>
                                        </router-link>
                                    </li>
                                </ul>
                            </li>

                            <!-- Enlace directo -->
                            <li v-else class="nav-item">
                                <router-link class="nav-link" :class="{ active: isItemActive(item) }"
                                    :to="routeOf(item)"
                                    :aria-current="isItemActive(item) ? 'page' : undefined">
                                    <span class="d-flex align-items-center">
                                        <span class="nav-link-icon" aria-hidden="true"><span class="fas" :class="item.icon"></span></span>
                                        <span class="nav-link-text ps-1">{{ item.label }}</span>
                                        <span v-if="item.badge === 'notifications' && unreadCount > 0"
                                            class="badge rounded-pill bg-primary ms-auto"
                                            :aria-label="`${unreadCount} notificaciones sin leer`">
                                            {{ unreadBadge }}
                                        </span>
                                    </span>
                                </router-link>
                            </li>
                        </template>
                    </template>
                </ul>
                <div class="settings my-3"></div>
            </div>
        </div>
    </nav>
</template>

<script setup>
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore, usePermissionsStore, useUserStore } from '@store';
import { useSidebar } from '@/hooks/useSidebar.js';
import { useNotificationsStore } from '@/features/notifications/store/notifications.store.js';

const route = useRoute();
const authStore = useAuthStore();
const permissionsStore = usePermissionsStore();
const userStore = useUserStore();
const notificationsStore = useNotificationsStore();
const { toggleCollapse, isOpen } = useSidebar();

const isConductorRole = computed(() => {
    return permissionsStore.hasRole('CONDUCTOR');
});

const isConductorDashboard = computed(() => {
    if (route.query.view === 'admin') return false;
    if (route.path.includes('/dashboard/conductor')) return true;
    if (route.query.view === 'conductor') return true;
    return route.path === '/dashboard' && isConductorRole.value;
});

const showSidebar = computed(() => {
    if (!authStore.isAuthenticated) return false;
    if (route.meta?.hideSidebar) return false;
    if (isConductorDashboard.value) return false;
    return true;
});

const unreadCount = computed(() => notificationsStore.unreadCount || 0);
const unreadBadge = computed(() => (unreadCount.value > 99 ? '99+' : String(unreadCount.value)));

const can = (action, subject) => permissionsStore.can(action, subject);

const isAdminRole = () =>
    permissionsStore.hasRole('superadmin') ||
    permissionsStore.hasRole('administrador') ||
    permissionsStore.hasRole('admin_empresa');

const canAny = (permissions = []) =>
    permissions.length === 0 || permissions.some((permission) => can(permission));

// Los catálogos de configuración abren por rol (ver meta.roles de sus rutas)
// aunque el rol no tenga el permiso granular sembrado.
const canOrAdmin = (...permissions) => isAdminRole() || canAny(permissions);

/**
 * Menú declarativo.
 *
 * Cada entrada admite:
 * - permissions: lista de permisos (basta uno) para mostrarla.
 * - visibleWhen / hiddenWhen: condiciones adicionales (roles o datos del usuario).
 * - exact / activeWhen: control fino del estado activo cuando hay rutas hermanas.
 * - children: submenú colapsable (el id debe coincidir con useSidebar.js para autoabrirlo).
 */
const MENU_SECTIONS = [
    {
        id: 'general',
        label: null,
        items: [
            { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie', to: '/dashboard', exact: true },
            { id: 'notificaciones', label: 'Notificaciones', icon: 'fa-bell', to: '/notificaciones', badge: 'notifications' },
        ],
    },
    {
        id: 'empresa',
        label: 'Empresa',
        items: [
            {
                id: 'company',
                label: 'Perfil de Empresa',
                icon: 'fa-building',
                children: [
                    { id: 'empresas', label: 'Empresas', to: '/empresa/listas-empresa', permissions: ['companies.index'] },
                    {
                        id: 'mi-empresa',
                        label: 'Mi empresa',
                        to: () => `/empresa/perfil/${userStore.company_uuid}`,
                        permissions: ['companies.profile'],
                        hiddenWhen: () => can('companies.index') || !userStore.company_uuid,
                    },
                    { id: 'sedes', label: 'Sedes', to: '/empresas/sucursales/listas-sucursal', permissions: ['branches.index'] },
                    { id: 'actividades-economicas', label: 'Actividades Económicas', to: '/empresas/actividades-economicas/listas-actividades-economicas', permissions: ['economic_activities.index'] },
                    { id: 'datos-bancarios', label: 'Datos Bancarios', to: '/empresas/datos-bancarios', permissions: ['bank_details.index'] },
                    { id: 'informacion-tributaria', label: 'Información Tributaria', to: '/empresas/informacion-tributaria', permissions: ['tax_information.index'] },
                    { id: 'resoluciones-habilitacion', label: 'Resoluciones de Habilitación', to: '/empresas/resoluciones-habilitacion', permissions: ['enabling_resolutions.index'] },
                    { id: 'capacidad-transportadora', label: 'Capacidad Transportadora', to: '/empresas/capacidad-transportadora', permissions: ['conveyor_capacity.index'] },
                ],
            },
            {
                id: 'informacion-tecnica',
                label: 'Información Técnica',
                icon: 'fa-tools',
                children: [
                    { id: 'experiencias', label: 'Experiencias', to: '/empresas/experiencias', permissions: ['experiences.index'] },
                    { id: 'convenios', label: 'Convenios de Colaboración', to: '/convenios-colaboracion', permissions: ['business_collaboration_agreements.index'] },
                ],
            },
            {
                id: 'informacion-financiera',
                label: 'Información Financiera',
                icon: 'fa-chart-line',
                children: [
                    { id: 'rup', label: 'RUP', to: '/empresas/registro-unico-de-proponentes', permissions: ['rup_records.index'] },
                    { id: 'declaraciones-renta', label: 'Declaraciones de Renta', to: '/empresas/declaraciones-de-renta', permissions: ['tax_declarations.index'] },
                    { id: 'estados-financieros', label: 'Estados Financieros', to: '/empresas/estados-financieros', permissions: ['financial_statements.index'] },
                ],
            },
        ],
    },
    {
        id: 'personas',
        label: 'Personas y Contratos',
        items: [
            { id: 'afiliados', label: 'Afiliados', icon: 'fa-handshake', to: '/terceros/afiliados', permissions: ['affiliate.index'] },
            { id: 'conductores', label: 'Conductores', icon: 'fa-id-card', to: '/terceros/conductores', permissions: ['driver.index'] },
            { id: 'clientes', label: 'Clientes', icon: 'fa-user-tie', to: '/terceros/clientes', permissions: ['customer.index'] },
            { id: 'proveedores', label: 'Proveedores', icon: 'fa-boxes', to: '/terceros/proveedores', permissions: ['supplier.index'] },
            { id: 'empleados', label: 'Empleados', icon: 'fa-users', to: '/terceros/empleados', permissions: ['employee.index'] },
            { id: 'todos-terceros', label: 'Todos los Terceros', icon: 'fa-address-book', to: '/terceros', permissions: ['third_parties.index'], exact: true },
            { id: 'contratos-laborales', label: 'Contratos Laborales', icon: 'fa-user-clock', to: '/recursos-humanos/contratos-laborales/listas', permissions: ['employmentContracts.index'] },
        ],
    },
    {
        id: 'flota',
        label: 'Flota y Mantenimiento',
        items: [
            { id: 'vehiculos', label: 'Vehículos', icon: 'fa-truck-moving', to: '/vehiculos', permissions: ['vehicles.index'] },
            { id: 'documentos-vehiculares', label: 'Documentos Vehiculares', icon: 'fa-file-alt', to: '/vehiculos-documentos', permissions: ['vehicle_documents.index'] },
            { id: 'inspecciones', label: 'Inspecciones', icon: 'fa-clipboard-check', to: '/inspeccion-vehiculos', permissions: ['vehicle_inspections.index'] },
            {
                id: 'mantenimientos',
                label: 'Mantenimientos',
                icon: 'fa-toolbox',
                to: '/mantenimiento',
                permissions: ['maintenance.index'],
                activeWhen: (path) => path === '/mantenimiento' || (path.startsWith('/mantenimiento/') && !path.startsWith('/mantenimiento/proyeccion')),
            },
            { id: 'proyeccion-mantenimiento', label: 'Proyección de Mantenimiento', icon: 'fa-calendar-check', to: '/mantenimiento/proyeccion', permissions: ['maintenance.forecast'], activeWhen: (path) => path.startsWith('/mantenimiento/proyeccion') },
            { id: 'combustible', label: 'Combustible', icon: 'fa-gas-pump', to: '/flota/combustible', permissions: ['fuel_logs.index'] },
            { id: 'solicitudes-tanqueo', label: 'Solicitudes de tanqueo', icon: 'fa-qrcode', to: '/flota/solicitudes-tanqueo', permissions: ['fuel_requests.index'], visibleWhen: () => canOrAdmin('fuel_requests.index') },
        ],
    },
    {
        id: 'operacion',
        label: 'Operación de Servicios',
        items: [
            { id: 'proyectos', label: 'Proyectos', icon: 'fa-briefcase', to: '/proyectos', permissions: ['projects.index'] },
            { id: 'planillas-control', label: 'Planillas de Control', icon: 'fa-clipboard-list', to: '/planillas-de-control-de-servicios', permissions: ['control_sheets.index'] },
            { id: 'pcp', label: 'Prestación de Servicios (PCP)', icon: 'fa-route', to: '/planilla-de-control-de-prestacion-servicios', permissions: ['service_delivery_control_sheets.index'] },
            { id: 'fuec', label: 'FUEC', icon: 'fa-passport', to: '/extracto-de-contrato', permissions: ['fuec.index'] },
            { id: 'tarjetas-operacion', label: 'Tarjetas de Operación', icon: 'fa-credit-card', to: '/tarjetas-de-operacion', permissions: ['operation_cards.index'] },
            { id: 'radicacion-to', label: 'Radicación TO', icon: 'fa-file-signature', to: '/radicacion', permissions: ['radicacion_to.index'] },
        ],
    },
    {
        id: 'finanzas',
        label: 'Finanzas',
        items: [
            {
                id: 'facturacion',
                label: 'Facturación',
                icon: 'fa-file-invoice',
                to: '/facturacion',
                permissions: ['commercial_invoices.index'],
                activeWhen: (path) => {
                    if (path === '/facturacion') return true;
                    if (path.startsWith('/facturacion/facturas') || path.startsWith('/facturacion/cotizaciones')) return true;
                    const rutasHermanas = ['/facturacion/proveedores', '/facturacion/documentos-electronicos', '/facturacion/configuracion', '/facturacion/resoluciones'];
                    return path.startsWith('/facturacion/') && !rutasHermanas.some((ruta) => path === ruta || path.startsWith(`${ruta}/`));
                },
            },
            { id: 'documentos-electronicos', label: 'Documentos Electrónicos', icon: 'fa-paper-plane', to: '/facturacion/documentos-electronicos', permissions: ['electronic_documents.index'] },
            { id: 'resoluciones-facturacion', label: 'Resoluciones de Facturación', icon: 'fa-scroll', to: '/facturacion/resoluciones', permissions: ['billing_resolutions.index'] },
            { id: 'proveedores-facturacion', label: 'Proveedores de Facturación', icon: 'fa-server', to: '/facturacion/proveedores', permissions: ['billing_providers.index'], exact: true },
            {
                id: 'configuracion-apidian',
                label: 'Configuración API DIAN',
                icon: 'fa-sliders-h',
                to: '/facturacion/configuracion',
                permissions: ['billing_providers.update'],
                activeWhen: (path) => path === '/facturacion/configuracion' || (path.startsWith('/facturacion/proveedores/') && path.endsWith('/configuracion')),
            },
            { id: 'cuotas-administracion', label: 'Cuotas de Administración', icon: 'fa-file-invoice-dollar', to: '/pagos-de-administracion', permissions: ['affiliate_admin_charges.index'] },
        ],
    },
    {
        id: 'geolocalizacion',
        label: 'Geolocalización',
        items: [
            { id: 'mapa-vivo', label: 'Mapa en Vivo', icon: 'fa-map-marked-alt', to: '/rastreo/mapa-en-vivo', permissions: ['locations.view'], activeWhen: (path) => path === '/rastreo/mapa-en-vivo' },
            { id: 'rastreo-conductores', label: 'Rastreo de Conductores', icon: 'fa-satellite-dish', to: '/rastreo', permissions: ['locations.view'], activeWhen: (path) => path === '/rastreo' || path.startsWith('/rastreo/historial') },
            { id: 'geocercas', label: 'Geocercas', icon: 'fa-draw-polygon', to: '/rastreo/geocercas', permissions: ['locations.geofences'], activeWhen: (path) => path.startsWith('/rastreo/geocercas') },
        ],
    },
    {
        id: 'seguridad',
        label: 'Seguridad y Acceso',
        items: [
            { id: 'usuarios', label: 'Usuarios', icon: 'fa-users', to: '/usuarios', permissions: ['users.index'] },
            { id: 'roles-permisos', label: 'Roles y Permisos', icon: 'fa-shield-alt', to: '/roles-permissions', visibleWhen: () => can('roles.index') || permissionsStore.hasRole('admin_empresa') },
        ],
    },
    {
        id: 'reportes',
        label: 'Reportes',
        items: [
            { id: 'reporte-vehiculos', label: 'Reporte de Vehículos', icon: 'fa-chart-bar', to: '/reportes/vehiculos', permissions: ['reports.vehicles.index'] },
        ],
    },
    {
        id: 'configuracion',
        label: 'Configuración',
        visibleWhen: isAdminRole,
        items: [
            { id: 'marcas', label: 'Marcas', icon: 'fa-tags', to: '/configuracion/marcas', visibleWhen: () => canOrAdmin('brands.index') },
            { id: 'clases-vehiculos', label: 'Clases de Vehículos', icon: 'fa-truck', to: '/configuracion/clases-vehiculos', visibleWhen: () => canOrAdmin('vehicle_classes.index') },
            { id: 'objetos-contrato', label: 'Objetos de Contrato', icon: 'fa-file-contract', to: '/configuracion/objetos-contrato', visibleWhen: () => canOrAdmin('objects_contracts.index') },
            { id: 'items-inspeccion', label: 'Ítems de Inspección', icon: 'fa-clipboard-check', to: '/configuracion/items-inspeccion', visibleWhen: () => canOrAdmin('inspection_items.index') },
            { id: 'retenciones', label: 'Retenciones', icon: 'fa-percent', to: '/configuracion/retenciones', visibleWhen: () => canOrAdmin('withholdings.index') },
        ],
    },
];

function routeOf(item) {
    return typeof item.to === 'function' ? item.to() : item.to;
}

function isItemVisible(item) {
    if (item.visibleWhen && !item.visibleWhen()) return false;
    if (item.hiddenWhen && item.hiddenWhen()) return false;
    if (item.children) return visibleChildren(item).length > 0;
    return canAny(item.permissions);
}

function visibleChildren(group) {
    return (group.children || []).filter(isItemVisible);
}

function isItemActive(item) {
    if (typeof item.activeWhen === 'function') return item.activeWhen(route.path);
    const target = routeOf(item);
    if (!target) return false;
    if (item.exact) return route.path === target;
    return route.path === target || route.path.startsWith(`${target}/`);
}

const visibleSections = computed(() =>
    MENU_SECTIONS
        .filter((section) => !section.visibleWhen || section.visibleWhen())
        .map((section) => ({ ...section, items: section.items.filter(isItemVisible) }))
        .filter((section) => section.items.length > 0)
);

const closeMobileSidebar = () => {
    const collapseEl = document.getElementById('navbarVerticalCollapse');
    if (collapseEl && collapseEl.classList.contains('show')) {
        collapseEl.classList.remove('show');
        const toggler = document.querySelector('.navbar-toggler-humburger-icon');
        if (toggler) {
            toggler.setAttribute('aria-expanded', 'false');
            toggler.classList.add('collapsed');
        }
    }
};

watch(() => route.path, () => {
    closeMobileSidebar();
});
</script>

<style scoped>
.sidebar-brand-symbol {
    height: 36px;
    width: auto;
    flex-shrink: 0;
    background: transparent;
}

.sidebar-brand-letters {
    height: 28px;
    width: auto;
    flex-shrink: 1;
    min-width: 0;
    background: transparent;
    mix-blend-mode: multiply;
}
</style>
