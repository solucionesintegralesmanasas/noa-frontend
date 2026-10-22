<template>
    <BasePageHeader title="Control de Combustible y Kilometraje"
        description="Registro de surtimientos, rendimiento (km/gal), costo por km y saldos de tanque."
        icon="fad fa-gas-pump text-primary" :show-refresh="true" :show-create="true" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true"
        :breadcrumbs="[{ label: 'Flota' }, { label: 'Combustible' }]" @refresh="refreshTable" @create="goToCreate" />

    <!-- BARRA DE BÚSQUEDA -->
    <div class="card border-0 shadow-sm mb-3">
        <div class="card-body position-relative py-2">
            <div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2">
                <h6 class="mb-0 fw-medium text-nowrap">Búsqueda</h6>
                <div class="input-group input-group-sm w-100" style="max-width: 420px;">
                    <span class="input-group-text bg-light border-end-0">
                        <i class="fad fa-search text-muted" aria-hidden="true" />
                    </span>
                    <input v-model="searchQuery" class="form-control form-control-sm border-start-0 shadow-none"
                        type="search" placeholder="Buscar por placa o conductor..."
                        aria-label="Buscar registros de combustible" @input="debouncedSearch" />
                </div>
                <button v-if="can('fuel_logs.index')" type="button" class="btn btn-falcon-default btn-sm text-nowrap" @click="openStatus()">
                    <i class="fad fa-gauge-high text-primary me-1" aria-hidden="true" />
                    <span class="d-none d-sm-inline">Estado de combustible</span>
                    <span class="d-sm-none">Estado</span>
                </button>
                <router-link v-if="puedeSolicitarTanqueo" to="/flota/solicitudes-tanqueo"
                    class="btn btn-primary btn-sm text-nowrap">
                    <i class="fad fa-qrcode me-1" aria-hidden="true" />
                    <span class="d-none d-sm-inline">Solicitar tanqueo</span>
                    <span class="d-sm-none">Solicitar</span>
                </router-link>
                <div v-if="!isViewLoading && !store.loading" class="text-muted ms-sm-auto">
                    <small><i class="fad fa-filter me-1" aria-hidden="true" />{{ store.pagination.totalItems }}
                        resultado{{ store.pagination.totalItems !== 1 ? 's' : '' }}</small>
                </div>
            </div>
        </div>
    </div>

    <!-- TABLA -->
    <div class="card border-0 shadow-sm">
        <div class="card-body p-0">
            <div class="table-responsive">
                <DataTable :value="store.items" lazy :paginator="true" :rows="store.pagination.itemsPerPage"
                    :totalRecords="store.pagination.totalItems"
                    :first="(store.pagination.currentPage - 1) * store.pagination.itemsPerPage"
                    :loading="store.loading" :rowsPerPageOptions="[10, 25, 50, 100]" responsiveLayout="scroll"
                    tableStyle="min-width: 60rem" class="table table-sm mb-0 professional-table"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
                    emptyMessage="No se encontraron registros de combustible" @page="onPageChange">
                    <Column header="Vehículo" style="min-width: 130px;">
                        <template #body="{ data }">
                            <span class="text-dark fw-bold">{{ data.vehicle?.vehicle_license_plate || '-' }}</span>
                            <span v-if="data.vehicle?.internal_number" class="text-muted small ms-1">
                                ({{ data.vehicle.internal_number }})
                            </span>
                        </template>
                    </Column>
                    <Column header="Cilindraje" style="min-width: 100px;">
                        <template #body="{ data }">
                            <span>{{ data.engine_displacement || '—' }}</span>
                        </template>
                    </Column>
                    <Column field="date" header="Fecha" style="min-width: 110px;">
                        <template #body="{ data }">{{ dateUtils.format(data.date) }}</template>
                    </Column>
                    <Column header="Tanqueo" style="min-width: 120px;">
                        <template #body="{ data }">
                            <span :class="{ 'text-muted': !data.total_spent }">
                                $ {{ money(data.total_spent) }}
                            </span>
                        </template>
                    </Column>
                    <Column header="Galones" style="min-width: 100px;">
                        <template #body="{ data }">{{ data.gallons_pumped }}</template>
                    </Column>
                    <Column header="Km/gal" style="min-width: 110px;">
                        <template #body="{ data }">
                            <span v-if="data.average_performance != null">{{ data.average_performance }} km/gal</span>
                            <span v-else-if="data.km_per_gallon">{{ data.km_per_gallon }} km/gal</span>
                            <span v-else class="text-muted">—</span>
                        </template>
                    </Column>
                    <Column header="Rendimiento" style="min-width: 120px;">
                        <template #body="{ data }">
                            <span v-if="data.rendimiento != null">{{ data.rendimiento }}</span>
                            <span v-else class="text-muted">—</span>
                        </template>
                    </Column>
                    <Column header="Alcance est." style="min-width: 120px;">
                        <template #body="{ data }">
                            <span v-if="data.estimated_range_km != null">{{ data.estimated_range_km }} km</span>
                            <span v-else class="text-muted">—</span>
                        </template>
                    </Column>
                    <Column header="Costo kilometraje" style="min-width: 130px;">
                        <template #body="{ data }">
                            <span v-if="data.cost_per_km != null && Number(data.cost_per_km) > 0">$ {{ money(data.cost_per_km) }}</span>
                            <span v-else class="text-muted">—</span>
                        </template>
                    </Column>
                    <Column header="Acciones" class="text-center" style="min-width: 100px;">
                        <template #body="{ data }">
                            <div class="btn-group btn-group-sm" role="group">
                                <button v-if="can('fuel_logs.update')" class="btn btn-falcon-default" type="button"
                                    title="Editar" :aria-label="`Editar registro del ${data.date}`" @click="goToEdit(data.uuid)">
                                    <i class="fad fa-edit text-warning" aria-hidden="true" />
                                </button>
                                <button v-if="can('fuel_logs.delete')" class="btn btn-falcon-default" type="button"
                                    title="Eliminar" :aria-label="`Eliminar registro del ${data.date}`" @click="handleDelete(data)">
                                    <i class="fad fa-trash text-danger" aria-hidden="true" />
                                </button>
                            </div>
                        </template>
                    </Column>
                    <template #loading>
                        <NoaTableSpinner message="Cargando registros..." />
                    </template>
                </DataTable>
            </div>
        </div>
    </div>

    <FuelStatusDialog v-model:visible="showStatusModal" @create="goToCreate" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFuelManagementStore } from '../store/fuelManagement.store.js';
import { usePermissionsStore } from '@store';
import { useTable } from '@/hooks/useTable.js';
import { useTableActions } from '@/hooks/useTableActions.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import FuelStatusDialog from '../components/FuelStatusDialog.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import dateUtils from '@/utils/date.js';

const router = useRouter();
const store = useFuelManagementStore();
const permissionsStore = usePermissionsStore();

const isViewLoading = ref(true);
const searchQuery = ref('');

const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(searchQuery.value));
const { confirmDelete } = useTableActions(store, router);

const can = (action) => permissionsStore.can(action);
const money = (v) => Number(v || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Estado de combustible en modal (flota completa).
const showStatusModal = ref(false);

const puedeSolicitarTanqueo = computed(() => (
    can('fuel_requests.index')
    || permissionsStore.hasRole('administrador')
    || permissionsStore.hasRole('admin_empresa')
    || permissionsStore.hasRole('superadmin')
));

const openStatus = () => {
    showStatusModal.value = true;
};

const refreshTable = () => store.fetchItems();
const goToCreate = () => router.push('/flota/combustible/crear');
const goToEdit = (uuid) => router.push(`/flota/combustible/editar/${uuid}`);
const onPageChange = ({ first, rows }) => store.setPage(Math.floor(first / rows) + 1);

const handleDelete = (item) => confirmDelete(item, {
    title: '¿Eliminar registro de combustible?',
    nameField: 'date',
});

onMounted(async () => {
    try {
        searchQuery.value = store.search;
        await store.fetchItems();
    } finally {
        isViewLoading.value = false;
    }
});
</script>

<style scoped>
:deep(.professional-table .p-datatable-thead > tr > th) {
    padding: 0.625rem 0.75rem !important;
    font-size: 0.75rem !important;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #495057;
    border-bottom: 2px solid #e9ecef !important;
    background: #f8f9fa;
}
:deep(.professional-table .p-datatable-tbody > tr > td) {
    padding: 0.625rem 0.75rem !important;
    vertical-align: middle;
    border-bottom: 1px solid #e9ecef;
    font-size: 0.825rem !important;
    color: #212529;
}
</style>
