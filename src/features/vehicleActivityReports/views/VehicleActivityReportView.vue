<template>
    <BasePageHeader
        title="Reporte de actividad vehicular"
        description="Inspecciones, mantenimiento, combustible, tanqueos y hojas de control en una sola consulta."
        icon="fad fa-clipboard-list text-primary"
        :show-bg="true"
        :loading="isViewLoading"
        :compact="true"
        :breadcrumbs="[{ label: 'Reportes' }, { label: 'Actividad vehicular' }]"
    >
        <template #actions>
            <button
                class="btn btn-falcon-default btn-sm px-2 px-sm-3"
                type="button"
                title="Actualizar reporte"
                aria-label="Actualizar reporte"
                :disabled="!hayRango"
                @click="refreshTable"
            >
                <i class="fad fa-sync" aria-hidden="true" />
                <span class="d-none d-sm-inline ms-1">Actualizar</span>
            </button>

            <div class="btn-group btn-group-sm" role="group" aria-label="Exportar reporte">
                <button
                    v-if="can('reports.vehicle_activity.export-excel')"
                    class="btn btn-falcon-default btn-sm text-success px-2 px-sm-3"
                    type="button"
                    title="Exportar a Excel" aria-label="Exportar a Excel"
                    :disabled="store.exporting || store.pagination.totalItems === 0"
                    @click="store.exportReport('excel')"
                >
                    <i class="fad fa-file-excel me-1" aria-hidden="true" />
                    <span class="d-none d-sm-inline">Excel</span>
                </button>
                <button
                    v-if="can('reports.vehicle_activity.export-pdf')"
                    class="btn btn-falcon-default btn-sm text-danger px-2 px-sm-3"
                    type="button"
                    title="Exportar a PDF" aria-label="Exportar a PDF"
                    :disabled="store.exporting || store.pagination.totalItems === 0"
                    @click="store.exportReport('pdf')"
                >
                    <i class="fad fa-file-pdf me-1" aria-hidden="true" />
                    <span class="d-none d-sm-inline">PDF</span>
                </button>
            </div>
        </template>
    </BasePageHeader>

    <!-- FILTROS DE CONSULTA (alineados a convención Stitch) -->
    <div class="card border-0 shadow-sm mb-3 fade-in-up" style="animation-delay: 0.05s;">
        <div class="card-body py-2 px-3">
            <form class="d-flex flex-wrap align-items-center gap-2" @submit.prevent="aplicar">
                <div class="d-flex align-items-center gap-2 me-1 text-muted">
                    <i class="fad fa-filter text-primary" aria-hidden="true" />
                    <span class="fw-semibold text-dark small text-nowrap">Rango:</span>
                </div>

                <!-- Fecha Desde -->
                <div style="min-width: 150px;">
                    <label class="visually-hidden" for="f-fecha-desde">Fecha desde</label>
                    <DateInput
                        id="f-fecha-desde"
                        v-model="store.fechaDesde"
                        class="form-control form-control-sm"
                        placeholder="Fecha desde"
                        title="Fecha desde"
                        :aria-invalid="!!errores.fecha_desde"
                        :aria-describedby="errores.fecha_desde ? 'f-fecha-desde-error' : undefined"
                    />
                </div>

                <span class="text-muted small">a</span>

                <!-- Fecha Hasta -->
                <div style="min-width: 150px;">
                    <label class="visually-hidden" for="f-fecha-hasta">Fecha hasta</label>
                    <DateInput
                        id="f-fecha-hasta"
                        v-model="store.fechaHasta"
                        class="form-control form-control-sm"
                        placeholder="Fecha hasta"
                        title="Fecha hasta"
                        :aria-invalid="!!errores.fecha_hasta"
                        :aria-describedby="errores.fecha_hasta ? 'f-fecha-hasta-error' : undefined"
                    />
                </div>

                <!-- Vehículo -->
                <div style="min-width: 190px;">
                    <label class="visually-hidden" for="f-vehicle_uuid">Vehículo</label>
                    <PrimeSelect
                        input-id="f-vehicle_uuid"
                        v-model="store.vehicleUuid"
                        :options="store.catalogs.vehiculos"
                        option-label="display_plate"
                        option-value="uuid"
                        placeholder="Todos los vehículos"
                        showClear filter size="small" class="w-100"
                    />
                </div>

                <!-- Proyecto -->
                <div v-if="can('projects.index')" style="min-width: 190px;">
                    <label class="visually-hidden" for="f-project_uuid">Proyecto</label>
                    <PrimeSelect
                        input-id="f-project_uuid"
                        v-model="store.projectUuid"
                        :options="store.catalogs.proyectos"
                        option-label="project_name"
                        option-value="uuid"
                        placeholder="Todos los proyectos"
                        showClear filter size="small" class="w-100"
                    />
                </div>

                <!-- Acciones de filtro -->
                <div class="d-flex align-items-center gap-2 ms-sm-auto">
                    <button class="btn btn-primary btn-sm px-3" type="submit" :disabled="store.loading">
                        <i class="fad fa-magnifying-glass me-1" aria-hidden="true" />
                        <span>Consultar</span>
                    </button>
                    <button v-if="store.fechaDesde || store.fechaHasta || store.vehicleUuid || store.projectUuid" class="btn btn-outline-secondary btn-sm px-2 px-sm-3" type="button" @click="limpiar">
                        <i class="fad fa-eraser me-1" aria-hidden="true" />
                        <span class="d-none d-sm-inline">Restablecer</span>
                    </button>
                </div>
            </form>

            <!-- Errores de validación en línea compactos si ocurren -->
            <div v-if="errores.fecha_desde || errores.fecha_hasta" class="text-danger small mt-1 d-flex align-items-center gap-1" role="alert">
                <i class="fas fa-circle-exclamation" aria-hidden="true" />
                <span>{{ errores.fecha_desde || errores.fecha_hasta }}</span>
            </div>
        </div>
    </div>

    <!-- LISTADO UNIFICADO: Toolbar + Tabla + Paginador en una sola tarjeta (.noa-list-card) -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar py-2 px-3">
            <span v-if="!isViewLoading && hayRango" class="noa-results">
                <i class="fas fa-filter" aria-hidden="true" />
                {{ store.pagination.totalItems }} registro{{ store.pagination.totalItems !== 1 ? 's' : '' }} de actividad
            </span>
            <span v-else class="text-muted small">
                <i class="fad fa-info-circle me-1 text-primary" aria-hidden="true" />
                Consulta consolidada por rango de fechas
            </span>
        </div>

        <!-- SKELETON -->
        <div v-if="isViewLoading" class="card-body p-0">
            <div class="table-responsive scrollbar">
                <table class="table table-sm mb-0">
                    <thead>
                        <tr>
                            <th v-for="w in ['15%', '15%', '25%', '15%', '18%', '12%']" :key="w" style="padding:12px 8px">
                                <div class="skeleton-text" :style="`height:16px;width:${w}`" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="n in 8" :key="`sk-${n}`">
                            <td v-for="i in 6" :key="i">
                                <div class="skeleton-text" style="height:18px;width:75%;" />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- AVISO: sin rango de fechas no se consulta -->
        <div v-else-if="!hayRango" class="card-body text-center py-5">
            <i class="fad fa-calendar-lines fa-2x text-muted mb-2 d-block" aria-hidden="true" />
            <h6 class="text-muted mb-1 fw-medium">Selecciona un rango de fechas</h6>
            <p class="mb-0 text-muted small">Ingresa la fecha inicial y final para consultar la actividad operativa de la flota.</p>
        </div>

        <!-- DATATABLE (Paginación Server-Side) -->
        <div v-else class="card-body p-0">
            <div class="table-responsive scrollbar">
                <DataTable :value="store.items" lazy :paginator="false" :rows="store.pagination.itemsPerPage"
                    :totalRecords="store.pagination.totalItems"
                    :first="(store.pagination.currentPage - 1) * store.pagination.itemsPerPage"
                    :loading="store.loading" responsiveLayout="scroll"
                    tableStyle="min-width: 55rem" class="table table-sm mb-0 professional-table"
                    emptyMessage="Sin actividad en el rango consultado" @page="onPageChange">

                    <!-- Fecha -->
                    <Column field="event_date" header="Fecha" style="min-width: 100px;">
                        <template #body="{ data }">
                            <span class="noa-cell-strong">{{ formatDate(data.event_date) }}</span>
                        </template>
                    </Column>

                    <!-- Vehículo -->
                    <Column field="vehicle_license_plate" header="Vehículo" style="min-width: 110px;">
                        <template #body="{ data }">
                            <router-link
                                v-if="data.vehicle_uuid"
                                :to="{ name: 'vehicles.profile', params: { id: data.vehicle_uuid } }"
                                class="noa-cell-strong font-monospace text-primary text-decoration-none"
                                :title="`Ver perfil de ${data.vehicle_license_plate}`">
                                {{ data.vehicle_license_plate || '—' }}
                            </router-link>
                            <span v-else class="noa-cell-strong font-monospace">{{ data.vehicle_license_plate || '—' }}</span>
                        </template>
                    </Column>

                    <!-- Proyecto -->
                    <Column field="project_name" header="Proyecto" style="min-width: 170px;">
                        <template #body="{ data }">
                            <span class="text-dark">{{ data.project_name || 'Sin proyecto' }}</span>
                        </template>
                    </Column>

                    <!-- Tipo -->
                    <Column field="event_type" header="Tipo" style="min-width: 140px;">
                        <template #body="{ data }">
                            <span :class="estiloBadgeTipo(data.event_type)" style="font-size: 0.72rem; font-weight: 500;">
                                {{ etiquetaTipo(data.event_type) }}
                            </span>
                        </template>
                    </Column>

                    <!-- Conductor -->
                    <Column field="driver_name" header="Conductor" style="min-width: 160px;">
                        <template #body="{ data }">
                            <span class="text-dark">{{ data.driver_name || '—' }}</span>
                        </template>
                    </Column>

                    <!-- Estado/Valor -->
                    <Column field="status_value" header="Estado/Valor" style="min-width: 110px;">
                        <template #body="{ data }">
                            <span class="noa-cell-strong">{{ data.status_value ?? '—' }}</span>
                        </template>
                    </Column>

                    <!-- Loading state -->
                    <template #loading>
                        <NoaTableSpinner message="Cargando actividad vehicular..." />
                    </template>

                    <template #empty>
                        <div class="text-center py-5">
                            <i class="fad fa-clipboard-list fs-1 text-muted opacity-50 mb-3 d-block" aria-hidden="true" />
                            <h6 class="text-muted mb-1 fw-medium">Sin actividad en el rango consultado</h6>
                            <p class="text-muted small mb-0">No se encontraron eventos para los filtros y fechas seleccionados.</p>
                        </div>
                    </template>
                </DataTable>
            </div>
            <ListPagination :page="store.pagination.currentPage" :per-page="store.pagination.itemsPerPage"
                :total="store.pagination.totalItems" :rows-options="[10, 25, 50, 100]" @change="onPageChange" />
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useVehicleActivityReportsStore } from '../store/vehicleActivityReports.store.js';
import { usePermissionsStore } from '@store';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import ListPagination from '@/components/ListPagination.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import PrimeSelect from '@/components/form/PrimeSelect.vue';
import DateInput from '@/components/form/DateInput.vue';

const route = useRoute();
const router = useRouter();
const store = useVehicleActivityReportsStore();
const permissionsStore = usePermissionsStore();
const can = (action) => permissionsStore.can(action);

const isViewLoading = ref(true);
const errores = ref({});

const hayRango = computed(() => !!store.fechaDesde && !!store.fechaHasta);

const ETIQUETAS_TIPO = {
    INSPECCION: 'Inspección',
    MANTENIMIENTO: 'Mantenimiento',
    COMBUSTIBLE: 'Combustible',
    TANQUEO: 'Tanqueo',
    HOJA_CONTROL: 'Hoja de control',
};

const ESTILOS_BADGE_TIPO = {
    INSPECCION: 'badge bg-info bg-opacity-10 text-info border border-info border-opacity-25',
    MANTENIMIENTO: 'badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25',
    COMBUSTIBLE: 'badge bg-success bg-opacity-10 text-success border border-success border-opacity-25',
    TANQUEO: 'badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25',
    HOJA_CONTROL: 'badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25',
};

const etiquetaTipo = (tipo) => ETIQUETAS_TIPO[tipo] ?? tipo ?? '—';
const estiloBadgeTipo = (tipo) => ESTILOS_BADGE_TIPO[tipo] ?? 'badge bg-light text-muted border';

const formatDate = (value) => {
    if (!value) return '—';
    const fecha = String(value).slice(0, 10);
    const d = new Date(`${fecha}T00:00:00`);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const syncQuery = () => {
    router.replace({
        query: {
            ...route.query,
            fecha_desde: store.fechaDesde || undefined,
            fecha_hasta: store.fechaHasta || undefined,
            vehicle_uuid: store.vehicleUuid || undefined,
            project_uuid: store.projectUuid || undefined,
            page: store.pagination.currentPage > 1 ? store.pagination.currentPage : undefined,
        },
    });
};

const validar = () => {
    const errs = {};
    if (!store.fechaDesde) errs.fecha_desde = 'Selecciona la fecha inicial.';
    if (!store.fechaHasta) errs.fecha_hasta = 'Selecciona la fecha final.';
    if (!errs.fecha_desde && !errs.fecha_hasta && store.fechaHasta < store.fechaDesde) {
        errs.fecha_hasta = 'La fecha final debe ser igual o posterior a la inicial.';
    }
    errores.value = errs;

    if (Object.keys(errs).length) {
        document.querySelector('[aria-invalid="true"]')?.focus();
        return false;
    }
    return true;
};

const aplicar = async () => {
    if (!validar()) return;
    store.pagination.currentPage = 1;
    await store.fetchItems();
    syncQuery();
};

const limpiar = async () => {
    errores.value = {};
    await store.clearFilters();
    syncQuery();
};

const onPageChange = async ({ page, first, rows }) => {
    store.pagination.itemsPerPage = rows;
    const targetPage = page !== undefined ? page : Math.floor(first / rows) + 1;
    await store.setPage(targetPage);
    syncQuery();
};

const refreshTable = () => {
    store.fetchItems();
};

onMounted(async () => {
    try {
        const q = route.query;
        if (q.fecha_desde) store.fechaDesde = String(q.fecha_desde);
        if (q.fecha_hasta) store.fechaHasta = String(q.fecha_hasta);
        if (q.vehicle_uuid) store.vehicleUuid = String(q.vehicle_uuid);
        if (q.project_uuid) store.projectUuid = String(q.project_uuid);
        if (q.page) store.pagination.currentPage = Math.max(1, parseInt(String(q.page), 10) || 1);

        // Una sola consulta con fechas; sin fechas solo se cargan los catálogos.
        const cargas = [store.loadCatalogos()];
        if (hayRango.value) cargas.push(store.fetchItems());
        await Promise.all(cargas);
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
</style>
