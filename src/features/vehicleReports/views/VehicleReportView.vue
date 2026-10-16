<template>
    <BasePageHeader title="Reporte de vehículos" description="Consulta por un filtro a la vez con bajo consumo."
        icon="fad fa-file-chart-column text-primary" :show-refresh="true" :show-create="false" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true"
        :breadcrumbs="[{ label: 'Reportes' }, { label: 'Vehículos' }]" @refresh="refreshTable" />

    <!-- BARRA DE HERRAMIENTAS Y FILTROS -->
    <div class="card border-0 shadow-sm mb-3 fade-in-up" style="animation-delay: 0.1s;">
        <div class="card-body py-2 px-3">
            <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
                
                <!-- Sección izquierda: Selector principal y valor -->
                <div class="d-flex flex-column flex-md-row align-items-md-center gap-2 flex-grow-1">
                    <div class="d-flex align-items-center gap-2">
                        <i class="fad fa-filter text-muted d-none d-md-inline-block"></i>
                        <h6 class="mb-0 fw-medium text-nowrap d-none d-md-block" style="font-size: 0.85rem;">Filtro activo:</h6>
                        <div style="width: 200px;">
                            <PrimeSelect input-id="f-filter-type" v-model="store.filterType" :options="filterOptions"
                                option-label="label" option-value="value" placeholder="Seleccione un filtro..." showClear
                                class="w-100" @change="onFilterTypeChange" />
                        </div>
                    </div>

                    <!-- Selector de valor dependiente -->
                    <div class="flex-grow-1" style="max-width: 400px;" v-if="store.filterType">
                        <div v-if="store.filterType === 'affiliate' || store.filterType === 'driver'">
                            <PrimeSelect :input-id="store.filterType === 'affiliate' ? 'f-affiliate' : 'f-driver'"
                                v-model="store.filterValue" :options="store.catalogs.terceros" option-value="uuid"
                                option-label="company_name" :placeholder="store.filterType === 'affiliate' ? 'Buscar afiliado...' : 'Buscar conductor...'" 
                                showClear filter class="w-100" @change="onFilterValueChange" />
                        </div>

                        <div v-else-if="store.filterType === 'project'">
                            <PrimeSelect input-id="f-project" v-model="store.filterValue" :options="store.catalogs.proyectos"
                                option-value="uuid" option-label="project_name" placeholder="Buscar proyecto..." showClear
                                filter class="w-100" @change="onFilterValueChange" />
                        </div>

                        <div v-else-if="store.filterType === 'document'">
                            <PrimeSelect input-id="f-document" v-model="store.documentType"
                                :options="documentOptions" option-label="label" option-value="value"
                                placeholder="Tipo de documento (SOAT, RCC...)" showClear class="w-100" @change="onFilterValueChange" />
                        </div>

                        <div v-else-if="store.filterType === 'operation_card'" class="d-flex gap-2">
                            <PrimeSelect input-id="f-opcard-company" v-model="store.filterValue"
                                :options="store.catalogs.affiliatedCompanies" option-label="label" option-value="value"
                                placeholder="Empresa..." showClear filter class="w-100" @change="onFilterValueChange" />
                            <PrimeSelect input-id="f-opcard" v-model="store.operationCardStatus"
                                :options="operationCardOptions" option-label="label" option-value="value"
                                placeholder="Estado" showClear class="w-100" @change="onFilterValueChange" />
                        </div>

                        <div v-else-if="store.filterType === 'agreement'">
                            <PrimeSelect input-id="f-agreement" v-model="store.filterValue" :options="store.catalogs.agreements"
                                option-label="label" option-value="value" placeholder="Buscar convenio..." showClear
                                filter class="w-100" @change="onFilterValueChange" />
                        </div>

                        <div v-else-if="store.filterType === 'maintenance'">
                            <PrimeSelect input-id="f-maintenance" v-model="store.maintenanceStatus"
                                :options="maintenanceOptions" option-label="label" option-value="value"
                                placeholder="Estado mantenimiento..." showClear class="w-100" @change="onFilterValueChange" />
                        </div>
                    </div>
                </div>

                <!-- Sección derecha: Búsqueda y acciones -->
                <div class="d-flex flex-column flex-sm-row align-items-sm-center gap-2">
                    <div class="input-group input-group-sm" style="width: 220px;">
                        <span class="input-group-text bg-light border-end-0"><i class="fad fa-search text-muted"></i></span>
                        <input id="f-search" v-model="searchQuery" class="form-control border-start-0" type="search"
                            placeholder="Placa o modelo..." aria-label="Buscar" @input="onSearchInput" :disabled="!store.filterType || !hasValue" />
                    </div>
                    
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-falcon-default" type="button" title="Limpiar todo" @click="clearAll">
                            <i class="fad fa-eraser text-secondary" aria-hidden="true" />
                        </button>
                        <button v-if="can('reports.vehicles.export-excel')" class="btn btn-falcon-default text-success" type="button" title="Exportar a Excel"
                            :disabled="!store.filterType || store.exporting" @click="store.exportReport('excel')">
                            <i class="fad fa-file-excel" aria-hidden="true" />
                        </button>
                        <button v-if="can('reports.vehicles.export-pdf')" class="btn btn-falcon-default text-danger" type="button" title="Exportar a PDF"
                            :disabled="!store.filterType || store.exporting" @click="store.exportReport('pdf')">
                            <i class="fad fa-file-pdf" aria-hidden="true" />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </div>

    <!-- TABLA -->
    <div class="row gx-3 fade-in-up" style="animation-delay: 0.2s;">
        <div class="col-12">
            <div class="card border-0 shadow-sm">
                <div v-if="isViewLoading" class="card-body p-0">
                    <div class="table-responsive scrollbar">
                        <table class="table table-sm mb-0">
                            <thead>
                                <tr>
                                    <th v-for="w in ['15%', '10%', '15%', '15%', '15%']" :key="w" style="padding:12px 8px">
                                        <div class="skeleton-text" :style="`height:16px;width:${w}`" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="n in 10" :key="`sk-${n}`">
                                    <td v-for="i in 5" :key="i">
                                        <div class="skeleton-text" style="height:18px;width:75%;" />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div v-else class="card-body p-0">
                    <div class="table-responsive scrollbar">
                        <DataTable :value="store.items" lazy :paginator="true" :rows="store.pagination.itemsPerPage"
                            :totalRecords="store.pagination.totalItems" :first="(store.pagination.currentPage - 1) *
                                store.pagination.itemsPerPage
                                " :loading="store.loading" :rowsPerPageOptions="[10, 15, 25, 50]"
                            responsiveLayout="scroll" tableStyle="min-width: 90rem"
                            class="table table-sm mb-0 professional-table"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
                            emptyMessage="Seleccione un filtro para ver resultados" @page="onPageChange">
                            <Column field="vehicle_license_plate" header="Placa" sortable frozen>
                                <template #body="{ data }">
                                    <router-link
                                        :to="{ path: '/vehiculos-documentos', query: { vehicle_uuid: data.uuid } }"
                                        class="fw-semibold font-monospace"
                                        :aria-label="`Ver documentos del vehículo ${data.vehicle_license_plate}`"
                                        :title="`Actualizar documentos de ${data.vehicle_license_plate}`">
                                        {{ data.vehicle_license_plate || '-' }}
                                    </router-link>
                                    <small v-if="data.affiliate_name" class="text-muted d-block" style="font-size: 0.72rem;">
                                        {{ data.affiliate_name }}
                                    </small>
                                </template>
                            </Column>

                            <Column field="model" header="Modelo" sortable>
                                <template #body="{ data }">
                                    <span class="text-dark">{{ data.model || '-' }}</span>
                                </template>
                            </Column>

                            <Column field="vehicle_class" header="Clase">
                                <template #body="{ data }">
                                    <span class="text-dark">{{ data.vehicle_class || '-' }}</span>
                                </template>
                            </Column>

                            <Column field="body_type" header="Carrocería">
                                <template #body="{ data }">
                                    <span class="text-dark">{{ data.body_type || '-' }}</span>
                                </template>
                            </Column>

                            <Column field="type_of_service" header="Modalidad">
                                <template #body="{ data }">
                                    <span class="badge rounded-pill badge-subtle badge-subtle-info">
                                        {{ data.modality_label || '-' }}
                                    </span>
                                </template>
                            </Column>

                            <Column field="soat_expiry" header="SOAT">
                                <template #body="{ data }">
                                    <router-link v-if="docEditLink(data, 'SOAT')" :to="docEditLink(data, 'SOAT')"
                                        :class="expiryClass(data.soat_expiry)"
                                        :title="`Actualizar SOAT — placa ${data.vehicle_license_plate}`"
                                        :aria-label="`Actualizar SOAT del vehículo ${data.vehicle_license_plate}, vence ${formatDate(data.soat_expiry)}`">{{
                                        formatDate(data.soat_expiry) }}</router-link>
                                    <span v-else :class="expiryClass(data.soat_expiry)">{{ formatDate(data.soat_expiry) }}</span>
                                </template>
                            </Column>

                            <Column field="rcc_expiry" header="RCC">
                                <template #body="{ data }">
                                    <span v-if="data.es_particular" class="text-muted small">No aplica</span>
                                    <router-link v-else-if="docEditLink(data, 'RCC')" :to="docEditLink(data, 'RCC')"
                                        :class="expiryClass(data.rcc_expiry)"
                                        :title="`Actualizar póliza RCC — placa ${data.vehicle_license_plate}`"
                                        :aria-label="`Actualizar póliza RCC del vehículo ${data.vehicle_license_plate}, vence ${formatDate(data.rcc_expiry)}`">{{
                                        formatDate(data.rcc_expiry) }}</router-link>
                                    <span v-else :class="expiryClass(data.rcc_expiry)">{{ formatDate(data.rcc_expiry) }}</span>
                                </template>
                            </Column>

                            <Column field="rce_expiry" header="RCE">
                                <template #body="{ data }">
                                    <span v-if="data.es_particular" class="text-muted small">No aplica</span>
                                    <router-link v-else-if="docEditLink(data, 'RCE')" :to="docEditLink(data, 'RCE')"
                                        :class="expiryClass(data.rce_expiry)"
                                        :title="`Actualizar póliza RCE — placa ${data.vehicle_license_plate}`"
                                        :aria-label="`Actualizar póliza RCE del vehículo ${data.vehicle_license_plate}, vence ${formatDate(data.rce_expiry)}`">{{
                                        formatDate(data.rce_expiry) }}</router-link>
                                    <span v-else :class="expiryClass(data.rce_expiry)">{{ formatDate(data.rce_expiry) }}</span>
                                </template>
                            </Column>

                            <Column field="rtm_expiry" header="RTM">
                                <template #body="{ data }">
                                    <router-link v-if="docEditLink(data, 'RTM')" :to="docEditLink(data, 'RTM')"
                                        :class="expiryClass(data.rtm_expiry)"
                                        :title="`Actualizar RTM — placa ${data.vehicle_license_plate}`"
                                        :aria-label="`Actualizar revisión RTM del vehículo ${data.vehicle_license_plate}, vence ${formatDate(data.rtm_expiry)}`">{{
                                        formatDate(data.rtm_expiry) }}</router-link>
                                    <span v-else :class="expiryClass(data.rtm_expiry)">{{ formatDate(data.rtm_expiry) }}</span>
                                </template>
                            </Column>

                            <Column field="operation_card_expiry" header="Tarj. operación">
                                <template #body="{ data }">
                                    <span v-if="data.es_particular" class="text-muted small">No aplica</span>
                                    <router-link v-else-if="opCardEditLink(data)" :to="opCardEditLink(data)"
                                        :class="expiryClass(data.operation_card_expiry)"
                                        :title="`Actualizar tarjeta de operación — placa ${data.vehicle_license_plate}`"
                                        :aria-label="`Actualizar tarjeta de operación del vehículo ${data.vehicle_license_plate}, vence ${formatDate(data.operation_card_expiry)}`">{{
                                        formatDate(data.operation_card_expiry) }}</router-link>
                                    <span v-else :class="expiryClass(data.operation_card_expiry)">{{ formatDate(data.operation_card_expiry) }}</span>
                                    <small v-if="data.operation_card_number" class="text-muted d-block" style="font-size: 0.72rem;">
                                        N.º {{ data.operation_card_number }}
                                    </small>
                                </template>
                            </Column>

                            <Column field="agreement_name" header="Convenio">
                                <template #body="{ data }">
                                    <span class="text-dark">{{ data.agreement_name || 'Sin convenio' }}</span>
                                </template>
                            </Column>

                            <template #loading>
                                <NoaTableSpinner message="Cargando reporte..." />
                            </template>
                        </DataTable>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useVehicleReportsStore } from '../store/vehicleReports.store.js';
import { usePermissionsStore } from '@store';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
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

const hasValue = computed(() => {
    if (store.filterType === 'affiliate' || store.filterType === 'driver') return !!store.filterValue;
    if (store.filterType === 'project') return !!store.filterValue;
    if (store.filterType === 'document') return !!store.documentType;
    if (store.filterType === 'operation_card') return !!store.filterValue;
    if (store.filterType === 'agreement') return !!store.filterValue;
    if (store.filterType === 'maintenance') return !!store.maintenanceStatus;
    return false;
});

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
    searchQuery.value = '';
    store.search = '';
    await store.setFilterType(store.filterType);
    syncQuery();
};

const onFilterValueChange = async () => {
    // Para document el valor vive en su campo específico
    if (store.filterType === 'document') store.filterValue = store.documentType;
    if (store.filterType === 'maintenance') store.filterValue = store.maintenanceStatus;
    store.pagination.currentPage = 1;
    if (hasValue.value) await store.fetchItems();
    syncQuery();
};

const onSearchInput = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
        if (!store.filterType || !hasValue.value) return;
        await store.setGlobalFilter(searchQuery.value);
        syncQuery();
    }, 400);
};

const onPageChange = async ({ first, rows }) => {
    store.pagination.itemsPerPage = rows;
    await store.setPage(Math.floor(first / rows) + 1);
    syncQuery();
};

const refreshTable = () => {
    if (store.filterType && hasValue.value) store.fetchItems();
};

const clearAll = async () => {
    searchQuery.value = '';
    await store.clearFilters();
    syncQuery();
};

/**
 * Enlace siempre a editar, sin importar si está vencido o vigente.
 * Usa el uuid del documento que envía el reporte; si no hay documento
 * cae a crear con el vehículo prefijado (?wizard=).
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

const formatDate = (value) => {    if (!value) return '-';
    const d = new Date(`${value}T00:00:00`);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const expiryClass = (value) => {
    if (!value) return 'text-muted';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(`${value}T00:00:00`);
    if (Number.isNaN(target.getTime())) return 'text-dark';
    const diffDays = Math.ceil((target - today) / 86400000);
    if (diffDays < 0) return 'text-danger fw-semibold';
    if (diffDays <= 30) return 'text-warning fw-semibold';
    return 'text-dark';
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

:deep(.professional-table .p-datatable-thead > tr > th) {
    padding: 0.625rem 0.75rem !important;
    font-size: 0.72rem !important;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #495057;
    border-bottom: 2px solid #e9ecef !important;
    background: #f8f9fa;
    white-space: nowrap;
}

:deep(.professional-table .p-datatable-tbody > tr > td) {
    padding: 0.625rem 0.75rem !important;
    vertical-align: middle;
    border-bottom: 1px solid #e9ecef;
    font-size: 0.8rem !important;
    color: #212529;
}

:deep(.professional-table .p-datatable-tbody > tr:hover) {
    background: #f8f9fa !important;
}

:deep(.p-paginator) {
    padding: 0.5rem 1rem !important;
    background: #f8f9fa !important;
    border-top: 1px solid #e9ecef !important;
}

.badge-subtle {
    font-weight: 500;
    font-size: 0.72rem;
    padding: 0.35em 0.6em;
    white-space: nowrap;
}

.badge-subtle-info {
    background: rgba(13, 202, 240, 0.1);
    color: #0dcaf0;
    border: 1px solid rgba(13, 202, 240, 0.2);
}
</style>
