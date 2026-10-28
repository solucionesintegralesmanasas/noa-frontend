<template>
    <BasePageHeader 
        title="Alertas y Vencimientos"
        description="Monitoreo en tiempo real de documentos vencidos o próximos a vencer." 
        icon="fad fa-bell text-primary" 
        :show-refresh="true"
        :show-create="false" 
        :show-bg="true" 
        :loading="isViewLoading || store.loading" 
        :compact="true"
        :breadcrumbs="[{ label: 'Notificaciones' }, { label: 'Listado' }]" 
        @refresh="refreshTable"
    />

    <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <!-- BARRA SUPERIOR DE ACCIONES Y FILTROS -->
        <div class="noa-list-toolbar flex-wrap gap-2 py-2 px-3">
            <div class="d-flex align-items-center gap-2 flex-wrap">
                <button class="btn btn-sm btn-primary shadow-sm" type="button" @click="handleSync" :disabled="store.loading">
                    <i class="fad fa-sync-alt me-1" :class="{ 'fa-spin': store.loading }" aria-hidden="true" />
                    Sincronizar Alertas
                </button>
                <button class="btn btn-sm btn-falcon-default" type="button" @click="handleMarkAllAsRead" :disabled="store.loading || store.unreadCount === 0">
                    <i class="fad fa-check-double me-1 text-success" aria-hidden="true" />
                    Marcar todo como leído
                </button>
            </div>

            <!-- Filtros: los tres por el mismo componente (PrimeSelect), con un
                 patrón a11y idéntico: etiqueta oculta + input-id. -->
            <div class="d-flex align-items-center gap-2 flex-wrap ms-auto">
                <label class="visually-hidden" for="f-notifications-status">Filtrar por estado</label>
                <PrimeSelect input-id="f-notifications-status" v-model="filterStatus" :options="estadoOpciones"
                    option-label="label" option-value="value" size="small" style="min-width: 140px;"
                    @change="applyFilters" />

                <label class="visually-hidden" for="f-notifications-type">Filtrar por tipo</label>
                <PrimeSelect input-id="f-notifications-type" v-model="filterType" :options="tipoOpciones"
                    option-label="label" option-value="value" size="small" style="min-width: 170px;"
                    @change="applyFilters" />

                <label class="visually-hidden" for="f-notifications-priority">Filtrar por prioridad</label>
                <PrimeSelect input-id="f-notifications-priority" v-model="filterPriority" :options="priorityOptions"
                    option-label="label" option-value="value" size="small" style="min-width: 160px;"
                    @change="applyFilters" />

                <span v-if="!isViewLoading && !store.loading" class="noa-results ms-1">
                    <i class="fas fa-filter" aria-hidden="true" />
                    {{ totalItems }} resultado{{ totalItems !== 1 ? 's' : '' }}
                </span>
            </div>
        </div>

        <!-- SKELETON -->
        <div v-if="isViewLoading" class="card-body p-0">
            <div class="table-responsive scrollbar">
                <table class="table table-sm mb-0">
                    <thead>
                        <tr>
                            <th v-for="w in ['10%', '16%', '34%', '14%', '12%', '14%']" :key="w" style="padding:12px 8px">
                                <div class="skeleton-text" :style="`height:16px;width:${w}`" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="n in 5" :key="`sk-${n}`">
                            <td v-for="i in 5" :key="i">
                                <div class="skeleton-text" style="height:18px;width:75%;" />
                            </td>
                            <td>
                                <div class="d-flex justify-content-end gap-1">
                                    <div class="skeleton-icon" style="height:28px;width:28px;" />
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- DATATABLE (Paginación Server-Side) -->
        <div v-else class="card-body p-0">
            <div class="table-responsive scrollbar">
                <DataTable
                    :value="store.notifications"
                    lazy
                    :paginator="false"
                    :rows="store.perPage"
                    :totalRecords="totalItems"
                    :first="(currentPage - 1) * store.perPage"
                    :loading="store.loading" 
                    responsiveLayout="scroll"
                    tableStyle="min-width: 55rem" 
                    class="table table-sm mb-0 professional-table noa-table-fixed"
                    emptyMessage="No se encontraron alertas registradas" 
                    :sortField="sortField"
                    :sortOrder="sortOrdenPrimeVue"
                    removableSort
                    @sort="onSort"
                >
                    <!-- Columna Prioridad -->
                    <Column field="priority" header="Prioridad" sortable style="width: 10%;">
                        <template #body="{ data }">
                            <span class="noa-status" :class="data.priority === 'PRIORITARIA' ? 'noa-status--danger' : 'noa-status--muted'">
                                {{ data.priority === 'PRIORITARIA' ? 'Prioritaria' : 'Normal' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Columna Tipo -->
                    <Column field="type" header="Tipo de Alerta" sortable style="width: 16%;">
                        <template #body="{ data }">
                            <div class="d-flex align-items-center">
                                <i :class="getTypeIcon(data.type) + ' me-2 fs-7'" aria-hidden="true" />
                                <span class="fw-medium text-800">{{ getTypeLabel(data.type) }}</span>
                            </div>
                        </template>
                    </Column>

                    <!-- Columna Título & Detalle -->
                    <Column field="message" header="Alerta / Detalles" style="width: 34%;">
                        <template #body="{ data }">
                            <div class="d-flex flex-column">
                                <span class="fw-semibold text-dark fs-10 mb-1">{{ data.title }}</span>
                                <span class="text-600 fs-11">
                                    <template v-for="(seg, i) in segmentarMensaje(data)" :key="i">
                                        <strong v-if="seg.tipo === 'fuerte'" :class="seg.peligro ? 'text-danger' : 'text-warning'">{{ seg.texto }}</strong>
                                        <router-link v-else-if="seg.tipo === 'enlace'" :to="seg.path" class="alerta-enlace" :title="seg.titulo" :aria-label="seg.aria">{{ seg.texto }}</router-link>
                                        <template v-else>{{ seg.texto }}</template>
                                    </template>
                                </span>
                            </div>
                        </template>
                    </Column>

                    <!-- Columna Días Restantes -->
                    <Column field="days_left" header="Plazo" sortable style="width: 14%;">
                        <template #body="{ data }">
                            <template v-if="data.type === 'VEHICLE_MAINTENANCE_ALERT'">
                                <span class="noa-status" :class="data.days_left < 0 ? 'noa-status--danger' : 'noa-status--warning'">
                                    {{ data.days_left < 0 ? `Vencido (${Math.abs(data.days_left)} km)` : `Vence en ${data.days_left} km` }}
                                </span>
                            </template>
                            <template v-else-if="data.type === 'VEHICLE_FUEL_ALERT'">
                                <span class="noa-status" :class="data.days_left < 0 ? 'noa-status--danger' : 'noa-status--warning'">
                                    {{ data.days_left < 0 ? `Excedido (${Math.abs(data.days_left)} km)` : `Restan ${data.days_left} km` }}
                                </span>
                            </template>
                            <template v-else>
                                <span v-if="data.days_left === null" class="noa-status noa-status--danger">
                                    Faltante / Crítico
                                </span>
                                <span v-else-if="data.days_left < 0" class="noa-status noa-status--danger">
                                    Vencido hace {{ Math.abs(data.days_left) }} d
                                </span>
                                <span v-else-if="data.days_left === 0" class="noa-status noa-status--warning">
                                    Vence Hoy
                                </span>
                                <span v-else-if="data.days_left <= 15" class="noa-status noa-status--warning">
                                    {{ data.days_left }} días restantes
                                </span>
                                <span v-else class="noa-status noa-status--success">
                                    {{ data.days_left }} días restantes
                                </span>
                            </template>
                        </template>
                    </Column>

                    <!-- Columna Fecha Expiración -->
                    <Column field="expiry_date" header="Fecha Límite" sortable style="width: 12%;">
                        <template #body="{ data }">
                            <span class="text-700 fw-medium">{{ formatDate(data.expiry_date) }}</span>
                        </template>
                    </Column>

                    <!-- Columna Acciones -->
                    <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 14%;">
                        <template #body="{ data }">
                            <RowActions :actions="accionesDe(data)" :row-label="data.title || 'alerta'" />
                        </template>
                    </Column>

                    <template #empty>
                        <div class="text-center py-5">
                            <i class="fad fa-bell-slash fs-1 text-muted opacity-50 mb-3 d-block" aria-hidden="true" />
                            <h6 class="text-muted mb-1 fw-medium">No se encontraron alertas registradas</h6>
                            <p class="text-muted small mb-0">No hay vencimientos pendientes con los filtros aplicados.</p>
                        </div>
                    </template>

                    <!-- Loading state -->
                    <template #loading>
                        <NoaTableSpinner message="Cargando alertas..." />
                    </template>
                </DataTable>
            </div>
            <ListPagination :page="currentPage" :per-page="store.perPage" :total="totalItems" @change="onPageChange" />
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useServerSort } from '@/hooks/useServerSort.js';
import { useNotificationsStore } from '../store/notifications.store.js';
import { usePermissionsStore } from '@store';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import RowActions from '@/components/RowActions.vue';
import ListPagination from '@/components/ListPagination.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import PrimeSelect from '@/components/form/PrimeSelect.vue';
import Swal from 'sweetalert2';

const route = useRoute();
const router = useRouter();
const store = useNotificationsStore();
const permissionsStore = usePermissionsStore();
const isViewLoading = ref(true);

const filterStatus = ref('');
const filterType = ref('');
const filterPriority = ref('');
const currentPage = ref(1);

const totalItems = computed(() => store.meta?.total ?? store.notifications?.length ?? 0);

const { sortField, sortOrdenPrimeVue, onSort, restore } = useServerSort({
    onChange: ({ field, order }) => {
        const filters = {};
        if (filterStatus.value) filters.status = filterStatus.value;
        if (filterType.value) filters.type = filterType.value;
        if (filterPriority.value) filters.priority = filterPriority.value;
        store.setSort(field, order, filters);
    },
});

const estadoOpciones = [
    { label: 'Todos los estados', value: '' },
    { label: 'Pendientes', value: 'PENDIENTE' },
    { label: 'Leídas', value: 'LEIDA' },
];

const tipoOpciones = [
    { label: 'Todos los tipos', value: '' },
    { label: 'Documentos de Vehículo', value: 'VEHICLE_DOCUMENT' },
    { label: 'Tarjetas de Operación', value: 'OPERATION_CARD' },
    { label: 'Licencias de Conducción', value: 'DRIVER_LICENSE' },
    { label: 'Primera RTM', value: 'FIRST_RTM' },
    { label: 'Convenios Colab.', value: 'AGREEMENT' },
    { label: 'Cobros de Administración', value: 'AFFILIATE_CHARGE' },
    { label: 'Inspección Pendiente', value: 'VEHICLE_INSPECTION_PENDING' },
    { label: 'Mantenimiento Prev.', value: 'VEHICLE_MAINTENANCE_ALERT' },
    { label: 'Combustible', value: 'VEHICLE_FUEL_ALERT' },
    { label: 'Seguridad Social', value: 'SOCIAL_SECURITY_MORA' },
];

const priorityOptions = [
    { label: 'Todas las prioridades', value: '' },
    { label: 'Prioritarias', value: 'PRIORITARIA' },
    { label: 'Normales', value: 'NORMAL' },
];

const getTypeIcon = (type) => {
    switch (type) {
        case 'VEHICLE_DOCUMENT': return 'fad fa-file-certificate text-info';
        case 'OPERATION_CARD': return 'fad fa-id-card text-warning';
        case 'DRIVER_LICENSE': return 'fad fa-id-badge text-success';
        case 'FIRST_RTM': return 'fad fa-wrench text-danger';
        case 'AGREEMENT': return 'fad fa-file-contract text-primary';
        case 'AFFILIATE_CHARGE': return 'fad fa-file-invoice-dollar text-success';
        case 'VEHICLE_INSPECTION_PENDING': return 'fad fa-clipboard-check text-danger';
        case 'VEHICLE_MAINTENANCE_ALERT': return 'fad fa-tools text-warning';
        case 'VEHICLE_FUEL_ALERT': return 'fad fa-gas-pump text-warning';
        case 'SOCIAL_SECURITY_MORA': return 'fad fa-shield-alt text-danger';
        default: return 'fad fa-bell text-secondary';
    }
};

const getTypeLabel = (type) => {
    switch (type) {
        case 'VEHICLE_DOCUMENT': return 'Documento Vehículo';
        case 'OPERATION_CARD': return 'Tarjeta Operación';
        case 'DRIVER_LICENSE': return 'Licencia Conducción';
        case 'FIRST_RTM': return 'Primera RTM';
        case 'AGREEMENT': return 'Convenio';
        case 'AFFILIATE_CHARGE': return 'Cuota Adm.';
        case 'VEHICLE_INSPECTION_PENDING': return 'Inspección Pend.';
        case 'VEHICLE_MAINTENANCE_ALERT': return 'Mantenimiento Prev.';
        case 'VEHICLE_FUEL_ALERT': return 'Combustible';
        case 'SOCIAL_SECURITY_MORA': return 'Seguridad Social';
        default: return 'Alerta';
    }
};

// Patrones de énfasis
const PATRON_ENFASIS = /(VENCIDO|VENCIDA|VENCIDAS|por vencer|vence en|PRÓXIMO|PRÓXIMA|PROXIMO|PROXIMA)/gi;
const CLASE_PELIGRO = /^(VENCIDO|VENCIDA|VENCIDAS)$/i;

const enfatizar = (texto) => {
    if (!texto) return [];
    const out = [];
    let ultimo = 0;
    PATRON_ENFASIS.lastIndex = 0;
    let m;
    while ((m = PATRON_ENFASIS.exec(texto)) !== null) {
        if (m.index > ultimo) out.push({ tipo: 'texto', texto: texto.slice(ultimo, m.index) });
        out.push({ tipo: 'fuerte', texto: m[0], peligro: CLASE_PELIGRO.test(m[0]) });
        ultimo = m.index + m[0].length;
        if (m[0].length === 0) PATRON_ENFASIS.lastIndex++;
    }
    if (ultimo < texto.length) out.push({ tipo: 'texto', texto: texto.slice(ultimo) });
    return out;
};

const segmentarMensaje = (data) => {
    const message = String(data?.message ?? '');
    let extra = data?.extra_data ?? null;
    if (typeof extra === 'string' && extra !== '') {
        try {
            extra = JSON.parse(extra);
        } catch {
            extra = null;
        }
    }
    const action = extra?.action ?? null;
    const etiqueta = action?.label ? String(action.label) : '';
    const conEnlace = etiqueta !== ''
        && typeof action.path === 'string' && action.path !== ''
        && message.includes(etiqueta)
        && (!action.permission || permissionsStore.can(action.permission));

    if (!conEnlace) return enfatizar(message);

    const i = message.indexOf(etiqueta);
    const segmentos = enfatizar(message.slice(0, i));
    segmentos.push({
        tipo: 'enlace',
        texto: etiqueta,
        path: action.path,
        titulo: action.aria_label || etiqueta,
        aria: action.aria_label || etiqueta,
    });
    segmentos.push(...enfatizar(message.slice(i + etiqueta.length)));
    return segmentos;
};

const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return dateStr;
    }
};

const loadData = async () => {
    const filters = {};
    if (filterStatus.value) filters.status = filterStatus.value;
    if (filterType.value) filters.type = filterType.value;
    if (filterPriority.value) filters.priority = filterPriority.value;
    
    await store.fetchNotifications(currentPage.value, filters);
};

const applyFilters = async () => {
    currentPage.value = 1;
    await loadData();
};

const refreshTable = async () => {
    await loadData();
};

const onPageChange = async ({ page, rows }) => {
    const filas = Number(rows) || store.perPage;
    if (filas !== store.perPage) {
        // Cambio de filas por página: el paginador emite page=1.
        store.perPage = filas;
        currentPage.value = 1;
    } else if (page !== undefined) {
        currentPage.value = page;
    }
    await loadData();
};

const handleSync = async () => {
    await store.syncNotifications();
};

const handleMarkAllAsRead = async () => {
    const result = await Swal.fire({
        title: '¿Marcar todo como leído?',
        text: 'Esta acción cambiará el estado de todas las alertas pendientes.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, marcar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#2c7be5'
    });

    if (result.isConfirmed) {
        await store.markAllAsRead();
    }
};

const handleMarkAsRead = async (uuid) => {
    await store.markAsRead(uuid);
};

// Acciones adicionales de la fila
const accionesVisibles = (data) => (data?.extra_data?.actions ?? [])
    .filter((a) => a && a.path && (!a.permission || permissionsStore.can(a.permission)));

const accionesDe = (data) => {
    const actions = [];
    if (data.status !== 'LEIDA') {
        actions.push({
            key: 'marcar-leida',
            label: 'Marcar leída',
            icon: 'far fa-check',
            tone: 'success',
            inline: true,
            onClick: () => handleMarkAsRead(data.uuid),
        });
    }
    const extras = accionesVisibles(data).map((acc) => ({
        key: acc.key || acc.path,
        label: acc.label,
        icon: 'far fa-arrow-right',
        tone: 'primary',
        onClick: () => router.push(acc.path),
    }));
    return [...actions, ...extras];
};

onMounted(async () => {
    try {
        const sortParam = route.query.sort;
        const orderParam = route.query.order;
        if (typeof sortParam === 'string' && sortParam) {
            restore(sortParam, orderParam);
            store.sortField = sortParam;
            store.sortOrder = orderParam === 'desc' ? 'desc' : 'asc';
        }
        await loadData();
    } finally {
        isViewLoading.value = false;
    }
});
</script>

<style scoped>
.fade-in-up {
    animation: fadeInUp 0.4s ease-out forwards;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translate3d(0, 15px, 0);
    }
    to {
        opacity: 1;
        transform: translate3d(0, 0, 0);
    }
}

.alerta-enlace {
    color: var(--bs-primary, #2c7be5);
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
}

.alerta-enlace:hover {
    color: #1a4fa0;
}

.alerta-enlace:focus-visible {
    outline: 2px solid var(--bs-primary, #2c7be5);
    outline-offset: 2px;
    border-radius: 2px;
}
</style>
