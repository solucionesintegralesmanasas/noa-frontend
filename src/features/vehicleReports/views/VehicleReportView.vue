<template>
    <BasePageHeader title="Reporte de vehículos" description="Consulta y auditoría de la flota vehicular."
        icon="fad fa-file-chart-column text-primary" :show-refresh="true" :show-create="false" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true"
        :breadcrumbs="[{ label: 'Reportes' }, { label: 'Vehículos' }]" @refresh="refreshTable" />

    <!-- LISTADO: toolbar unificada + tabla + paginador en una sola tarjeta según el estándar Stitch -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <!-- TOOLBAR UNIFICADA STITCH -->
        <div class="noa-list-toolbar">
            <div class="noa-search">
                <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                <input id="f-vehicle-reports-busqueda" v-model="searchQuery" class="noa-search__input" type="search"
                    placeholder="Filtrar por placa o modelo..." aria-label="Buscar en reporte de vehículos"
                    @input="onSearchInput" />
                <button v-if="searchQuery" class="noa-search__clear" type="button"
                    title="Limpiar búsqueda" aria-label="Limpiar búsqueda" @click="clearSearch">
                    <i class="fal fa-times" aria-hidden="true" />
                </button>
            </div>

            <!-- FILTRO DE CRITERIO ESPECÍFICO (OPCIONAL) -->
            <div class="d-flex align-items-center gap-2">
                <div style="min-width: 170px;">
                    <PrimeSelect input-id="f-filter-type" v-model="store.filterType" :options="filterOptions"
                        option-label="label" option-value="value" placeholder="Filtrar por..." showClear
                        size="small" class="w-100" @change="onFilterTypeChange" />
                </div>

                <!-- Selector de valor dependiente según el criterio -->
                <div v-if="store.filterType" style="min-width: 220px; max-width: 320px;">
                    <div v-if="store.filterType === 'affiliate' || store.filterType === 'driver'">
                        <PrimeSelect :input-id="store.filterType === 'affiliate' ? 'f-affiliate' : 'f-driver'"
                            v-model="store.filterValue" :options="store.catalogs.terceros" option-value="uuid"
                            option-label="company_name" :placeholder="store.filterType === 'affiliate' ? 'Seleccionar afiliado...' : 'Seleccionar conductor...'" 
                            showClear filter size="small" class="w-100" @change="onFilterValueChange" />
                    </div>

                    <div v-else-if="store.filterType === 'project'">
                        <PrimeSelect input-id="f-project" v-model="store.filterValue" :options="store.catalogs.proyectos"
                            option-value="uuid" option-label="project_name" placeholder="Seleccionar proyecto..." showClear
                            filter size="small" class="w-100" @change="onFilterValueChange" />
                    </div>

                    <div v-else-if="store.filterType === 'document'">
                        <PrimeSelect input-id="f-document" v-model="store.documentType"
                            :options="documentOptions" option-label="label" option-value="value"
                            placeholder="Tipo (SOAT, RCC...)" showClear size="small" class="w-100" @change="onFilterValueChange" />
                    </div>

                    <div v-else-if="store.filterType === 'operation_card'" class="d-flex gap-1">
                        <PrimeSelect input-id="f-opcard-company" v-model="store.filterValue"
                            :options="store.catalogs.affiliatedCompanies" option-label="label" option-value="value"
                            placeholder="Empresa..." showClear filter size="small" class="w-100" @change="onFilterValueChange" />
                        <PrimeSelect input-id="f-opcard" v-model="store.operationCardStatus"
                            :options="operationCardOptions" option-label="label" option-value="value"
                            placeholder="Estado" showClear size="small" style="min-width: 100px;" @change="onFilterValueChange" />
                    </div>

                    <div v-else-if="store.filterType === 'agreement'">
                        <PrimeSelect input-id="f-agreement" v-model="store.filterValue" :options="store.catalogs.agreements"
                            option-label="label" option-value="value" placeholder="Seleccionar convenio..." showClear
                            filter size="small" class="w-100" @change="onFilterValueChange" />
                    </div>

                    <div v-else-if="store.filterType === 'maintenance'">
                        <PrimeSelect input-id="f-maintenance" v-model="store.maintenanceStatus"
                            :options="maintenanceOptions" option-label="label" option-value="value"
                            placeholder="Estado mtto..." showClear size="small" class="w-100" @change="onFilterValueChange" />
                    </div>
                </div>

                <button v-if="store.filterType || searchQuery" class="btn btn-outline-secondary btn-sm" type="button"
                    title="Restablecer filtros" aria-label="Restablecer filtros" @click="clearAll">
                    <i class="fad fa-eraser" aria-hidden="true" />
                </button>
            </div>

            <!-- CONTADOR Y EXPORTACIÓN -->
            <div class="d-flex align-items-center gap-2 ms-auto">
                <span v-if="!isViewLoading && !store.loading" class="noa-results me-2">
                    <i class="fas fa-filter" aria-hidden="true" />
                    {{ store.pagination.totalItems }} vehículo{{ store.pagination.totalItems !== 1 ? 's' : '' }}
                    <template v-if="store.search"> para "{{ store.search }}"</template>
                </span>

                <div class="btn-group btn-group-sm" role="group">
                    <button v-if="can('reports.vehicles.export-excel')" class="btn btn-falcon-default text-success" type="button"
                        title="Exportar a Excel" :disabled="store.exporting || store.pagination.totalItems === 0"
                        @click="store.exportReport('excel')">
                        <i class="fad fa-file-excel me-1" aria-hidden="true" />Excel
                    </button>
                    <button v-if="can('reports.vehicles.export-pdf')" class="btn btn-falcon-default text-danger" type="button"
                        title="Exportar a PDF" :disabled="store.exporting || store.pagination.totalItems === 0"
                        @click="store.exportReport('pdf')">
                        <i class="fad fa-file-pdf me-1" aria-hidden="true" />PDF
                    </button>
                </div>
            </div>
        </div>

        <!-- SKELETON -->
        <div v-if="isViewLoading" class="card-body p-0">
            <div class="table-responsive scrollbar">
                <table class="table table-sm mb-0">
                    <thead>
                        <tr>
                            <th v-for="w in ['12%', '10%', '10%', '10%', '10%', '10%', '10%', '10%', '10%', '8%']" :key="w" style="padding:12px 8px">
                                <div class="skeleton-text" :style="`height:16px;width:${w}`" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="n in 8" :key="`sk-${n}`">
                            <td v-for="i in 10" :key="i">
                                <div class="skeleton-text" style="height:18px;width:75%;" />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- DATATABLE (Paginación Server-Side) -->
        <div v-else class="card-body p-0">
            <div class="table-responsive scrollbar">
                <DataTable :value="store.items" lazy :paginator="false" :rows="store.pagination.itemsPerPage"
                    :totalRecords="store.pagination.totalItems"
                    :first="(store.pagination.currentPage - 1) * store.pagination.itemsPerPage"
                    :loading="store.loading" responsiveLayout="scroll"
                    tableStyle="min-width: 90rem" class="table table-sm mb-0 professional-table"
                    emptyMessage="No se encontraron vehículos registrados" @page="onPageChange">

                    <!-- Placa -->
                    <Column field="vehicle_license_plate" header="Placa" sortable frozen style="min-width: 140px;">
                        <template #body="{ data }">
                            <router-link
                                :to="{ path: '/vehiculos-documentos', query: { vehicle_uuid: data.uuid } }"
                                class="noa-cell-strong font-monospace text-primary text-decoration-none"
                                :aria-label="`Ver documentos del vehículo ${data.vehicle_license_plate}`"
                                :title="`Actualizar documentos de ${data.vehicle_license_plate}`">
                                {{ data.vehicle_license_plate || '—' }}
                            </router-link>
                            <small v-if="data.affiliate_name" class="text-muted d-block" style="font-size: 0.72rem;">
                                {{ data.affiliate_name }}
                            </small>
                        </template>
                    </Column>

                    <!-- Modelo -->
                    <Column field="model" header="Modelo" sortable style="min-width: 90px;">
                        <template #body="{ data }">
                            <span class="text-dark">{{ data.model || '—' }}</span>
                        </template>
                    </Column>

                    <!-- Clase -->
                    <Column field="vehicle_class" header="Clase" style="min-width: 110px;">
                        <template #body="{ data }">
                            <span class="text-dark">{{ data.vehicle_class || '—' }}</span>
                        </template>
                    </Column>

                    <!-- Carrocería -->
                    <Column field="body_type" header="Carrocería" style="min-width: 120px;">
                        <template #body="{ data }">
                            <span class="text-dark">{{ data.body_type || '—' }}</span>
                        </template>
                    </Column>

                    <!-- Modalidad -->
                    <Column field="type_of_service" header="Modalidad" style="min-width: 120px;">
                        <template #body="{ data }">
                            <span class="noa-status noa-status--muted">
                                {{ data.modality_label || '—' }}
                            </span>
                        </template>
                    </Column>

                    <!-- SOAT -->
                    <Column field="soat_expiry" header="SOAT" style="min-width: 120px;">
                        <template #body="{ data }">
                            <router-link v-if="docEditLink(data, 'SOAT')" :to="docEditLink(data, 'SOAT')"
                                :class="expiryClass(data.soat_expiry)"
                                :title="`Actualizar SOAT — placa ${data.vehicle_license_plate}`"
                                :aria-label="`Actualizar SOAT del vehículo ${data.vehicle_license_plate}, vence ${formatDate(data.soat_expiry)}`">
                                {{ formatDate(data.soat_expiry) }}
                            </router-link>
                            <span v-else :class="expiryClass(data.soat_expiry)">{{ formatDate(data.soat_expiry) }}</span>
                        </template>
                    </Column>

                    <!-- RCC -->
                    <Column field="rcc_expiry" header="RCC" style="min-width: 120px;">
                        <template #body="{ data }">
                            <span v-if="data.es_particular" class="text-muted small">No aplica</span>
                            <router-link v-else-if="docEditLink(data, 'RCC')" :to="docEditLink(data, 'RCC')"
                                :class="expiryClass(data.rcc_expiry)"
                                :title="`Actualizar póliza RCC — placa ${data.vehicle_license_plate}`"
                                :aria-label="`Actualizar póliza RCC del vehículo ${data.vehicle_license_plate}, vence ${formatDate(data.rcc_expiry)}`">
                                {{ formatDate(data.rcc_expiry) }}
                            </router-link>
                            <span v-else :class="expiryClass(data.rcc_expiry)">{{ formatDate(data.rcc_expiry) }}</span>
                        </template>
                    </Column>

                    <!-- RCE -->
                    <Column field="rce_expiry" header="RCE" style="min-width: 120px;">
                        <template #body="{ data }">
                            <span v-if="data.es_particular" class="text-muted small">No aplica</span>
                            <router-link v-else-if="docEditLink(data, 'RCE')" :to="docEditLink(data, 'RCE')"
                                :class="expiryClass(data.rce_expiry)"
                                :title="`Actualizar póliza RCE — placa ${data.vehicle_license_plate}`"
                                :aria-label="`Actualizar póliza RCE del vehículo ${data.vehicle_license_plate}, vence ${formatDate(data.rce_expiry)}`">
                                {{ formatDate(data.rce_expiry) }}
                            </router-link>
                            <span v-else :class="expiryClass(data.rce_expiry)">{{ formatDate(data.rce_expiry) }}</span>
                        </template>
                    </Column>

                    <!-- RTM -->
                    <Column field="rtm_expiry" header="RTM" style="min-width: 120px;">
                        <template #body="{ data }">
                            <router-link v-if="docEditLink(data, 'RTM')" :to="docEditLink(data, 'RTM')"
                                :class="expiryClass(data.rtm_expiry)"
                                :title="`Actualizar RTM — placa ${data.vehicle_license_plate}`"
                                :aria-label="`Actualizar revisión RTM del vehículo ${data.vehicle_license_plate}, vence ${formatDate(data.rtm_expiry)}`">
                                {{ formatDate(data.rtm_expiry) }}
                            </router-link>
                            <span v-else :class="expiryClass(data.rtm_expiry)">{{ formatDate(data.rtm_expiry) }}</span>
                        </template>
                    </Column>

                    <!-- Tarj. Operación -->
                    <Column field="operation_card_expiry" header="Tarj. Operación" style="min-width: 130px;">
                        <template #body="{ data }">
                            <span v-if="data.es_particular" class="text-muted small">No aplica</span>
                            <router-link v-else-if="opCardEditLink(data)" :to="opCardEditLink(data)"
                                :class="expiryClass(data.operation_card_expiry)"
                                :title="`Actualizar tarjeta de operación — placa ${data.vehicle_license_plate}`"
                                :aria-label="`Actualizar tarjeta de operación del vehículo ${data.vehicle_license_plate}, vence ${formatDate(data.operation_card_expiry)}`">
                                {{ formatDate(data.operation_card_expiry) }}
                            </router-link>
                            <span v-else :class="expiryClass(data.operation_card_expiry)">{{ formatDate(data.operation_card_expiry) }}</span>
                            <small v-if="data.operation_card_number" class="text-muted d-block" style="font-size: 0.72rem;">
                                N.º {{ data.operation_card_number }}
                            </small>
                        </template>
                    </Column>

                    <!-- Convenio -->
                    <Column field="agreement_name" header="Convenio" style="min-width: 130px;">
                        <template #body="{ data }">
                            <span class="text-dark">{{ data.agreement_name || 'Sin convenio' }}</span>
                        </template>
                    </Column>

                    <template #empty>
                        <div class="text-center py-5">
                            <i class="fad fa-file-chart-column fs-1 text-muted opacity-50 mb-3 d-block" aria-hidden="true" />
                            <h6 class="text-muted mb-1 fw-medium">No se encontraron vehículos</h6>
                            <p class="text-muted small mb-0">
                                {{ store.filterType || searchQuery
                                    ? 'No hay registros que coincidan con los criterios seleccionados.'
                                    : 'No hay vehículos registrados en la flota.' }}
                            </p>
                        </div>
                    </template>

                    <!-- Loading state -->
                    <template #loading>
                        <NoaTableSpinner message="Cargando reporte de vehículos..." />
                    </template>
                </DataTable>
            </div>
            <ListPagination :page="store.pagination.currentPage" :per-page="store.pagination.itemsPerPage"
                :total="store.pagination.totalItems" @change="onPageChange" />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useVehicleReportsStore } from '../store/vehicleReports.store.js';
import { usePermissionsStore } from '@store';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import ListPagination from '@/components/ListPagination.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import PrimeSelect from '@/components/form/PrimeSelect.vue';

const route = useRoute();
const router = useRouter();
const store = useVehicleReportsStore();
const permissionsStore = usePermissionsStore();
const can = (action) => permissionsStore.can(action);

const isViewLoading = ref(true);
const searchQuery = ref('');
let searchTimer = null;

const filterOptions = [
    { label: 'Afiliado', value: 'affiliate' },
    { label: 'Tarjeta de operación', value: 'operation_card' },
    { label: 'Documentos', value: 'document' },
    { label: 'Proyectos', value: 'project' },
    { label: 'Mantenimiento', value: 'maintenance' },
    { label: 'Conductor', value: 'driver' },
    { label: 'Convenio', value: 'agreement' },
];

const documentOptions = [
    { label: 'SOAT', value: 'SOAT' },
    { label: 'RCC', value: 'RCC' },
    { label: 'RCE', value: 'RCE' },
    { label: 'RTM', value: 'RTM' },
];

const operationCardOptions = [
    { label: 'Vigente', value: 'vigente' },
    { label: 'Por vencer (30 días)', value: 'por_vencer' },
    { label: 'Vencida', value: 'vencida' },
];

const maintenanceOptions = [
    { label: 'Vencido', value: 'vencido' },
    { label: 'Próximo (30 días)', value: 'proximo_30d' },
    { label: 'Pendiente', value: 'pendiente' },
];



const syncQuery = () => {
    router.replace({
        query: {
            ...route.query,
            filter_type: store.filterType || undefined,
            page: store.pagination.currentPage > 1 ? store.pagination.currentPage : undefined,
            search: store.search || undefined,
        },
    });
};

const onFilterTypeChange = async () => {
    await store.setFilterType(store.filterType);
    await store.fetchItems();
    syncQuery();
};

const onFilterValueChange = async () => {
    if (store.filterType === 'document') store.filterValue = store.documentType;
    if (store.filterType === 'maintenance') store.filterValue = store.maintenanceStatus;
    store.pagination.currentPage = 1;
    await store.fetchItems();
    syncQuery();
};

const onSearchInput = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
        await store.setGlobalFilter(searchQuery.value);
        syncQuery();
    }, 400);
};

const clearSearch = async () => {
    searchQuery.value = '';
    await store.setGlobalFilter('');
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

const clearAll = async () => {
    searchQuery.value = '';
    await store.clearFilters();
    syncQuery();
};

/**
 * Enlace a editar/crear según la presencia del UUID del documento.
 */
const docEditLink = (row, tipo) => {
    const segmentos = { SOAT: 'soat', RCC: 'poliza', RCE: 'poliza', RTM: 'tecnomecanica' };
    const porTipo = { SOAT: row?.soat_uuid, RCC: row?.rcc_uuid, RCE: row?.rce_uuid, RTM: row?.rtm_uuid };
    const seg = segmentos[tipo];
    if (!seg || !row?.uuid) return null;
    const docUuid = porTipo[tipo];
    if (docUuid && can('vehicle_documents.update')) {
        return { path: `/vehiculos-documentos/${seg}/editar/${docUuid}`, query: { wizard: row.uuid } };
    }
    if (can('vehicle_documents.create')) {
        return { path: `/vehiculos-documentos/${seg}/crear`, query: { wizard: row.uuid } };
    }
    return null;
};

const opCardEditLink = (row) => {
    if (!row?.uuid) return null;
    if (row?.operation_card_uuid && can('operation_cards.update')) {
        return { path: `/tarjetas-de-operacion/editar/${row.operation_card_uuid}`, query: { wizard: row.uuid } };
    }
    if (can('operation_cards.create')) {
        return { path: '/tarjetas-de-operacion/crear', query: { wizard: row.uuid } };
    }
    return null;
};

const formatDate = (value) => {
    if (!value) return '—';
    const d = new Date(`${value}T00:00:00`);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const expiryClass = (value) => {
    if (!value) return 'text-muted text-decoration-none';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(`${value}T00:00:00`);
    if (Number.isNaN(target.getTime())) return 'text-dark text-decoration-none';
    const diffDays = Math.ceil((target - today) / 86400000);
    if (diffDays < 0) return 'text-danger fw-semibold text-decoration-none';
    if (diffDays <= 30) return 'text-warning fw-semibold text-decoration-none';
    return 'text-dark text-decoration-none';
};

onMounted(async () => {
    try {
        const ft = route.query.filter_type;
        if (ft && filterOptions.some((o) => o.value === ft)) {
            await store.setFilterType(ft);
        }
        if (route.query.search) {
            searchQuery.value = String(route.query.search);
            store.search = searchQuery.value;
        }
        // Carga inicial de datos (la tabla ya no aparece vacía al entrar)
        await store.fetchItems();
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

.font-monospace {
    font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style>
