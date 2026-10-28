<template>
    <BasePageHeader title="Control de Combustible y Kilometraje"
        description="Registro de surtimientos, rendimiento (km/gal), costo por km y saldos de tanque."
        icon="fad fa-gas-pump text-primary" :show-refresh="true" :show-create="true" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true"
        :breadcrumbs="[{ label: 'Flota' }, { label: 'Combustible' }]" @refresh="refreshTable" @create="goToCreate" />

    <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar">
            <div class="noa-search">
                <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                <input id="f-fuel-log-busqueda" v-model="searchQuery" class="noa-search__input" type="search" placeholder="Buscar por placa o conductor..."
                    aria-label="Buscar registros de combustible" @input="debouncedSearch" />
                <button v-if="searchQuery" class="noa-search__clear" type="button" title="Limpiar búsqueda"
                    aria-label="Limpiar búsqueda" @click="clearSearch">
                    <i class="fal fa-times" aria-hidden="true" />
                </button>
            </div>

            <div class="d-flex align-items-center gap-2">
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
            </div>

            <span v-if="!isViewLoading && !store.loading" class="noa-results">
                <i class="fas fa-filter" aria-hidden="true" />
                {{ store.pagination.totalItems }} resultado{{ store.pagination.totalItems !== 1 ? 's' : '' }}
                <template v-if="store.search"> para "{{ store.search }}"</template>
            </span>
        </div>

        <!-- SKELETON -->
        <div v-if="isViewLoading" class="card-body p-0">
            <div class="table-responsive scrollbar">
                <table class="table table-sm mb-0">
                    <thead>
                        <tr>
                            <th v-for="w in ['13%', '10%', '10%', '11%', '9%', '10%', '11%', '11%', '12%', '11%']" :key="w"
                                style="padding:12px 8px">
                                <div class="skeleton-text" :style="`height:16px;width:${w}`" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="n in store.pagination.itemsPerPage" :key="`sk-${n}`">
                            <td v-for="i in 9" :key="i">
                                <div class="skeleton-text" style="height:18px;width:75%;" />
                            </td>
                            <td>
                                <div class="d-flex justify-content-end gap-1">
                                    <div v-for="j in 2" :key="j" class="skeleton-icon"
                                        style="height:28px;width:28px;" />
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
                <DataTable :value="store.items" lazy :paginator="false" :rows="store.pagination.itemsPerPage"
                    :totalRecords="store.pagination.totalItems"
                    :first="(store.pagination.currentPage - 1) * store.pagination.itemsPerPage"
                    :loading="store.loading"
                    :sortField="store.sortField" :sortOrder="store.sortOrder" @sort="handleSort"
                    responsiveLayout="scroll"
                    tableStyle="min-width: 65rem" class="table table-sm mb-0 professional-table noa-table-fixed"
                    emptyMessage="No se encontraron registros de combustible">
                    <Column header="Vehículo" style="width: 13%;">
                        <template #body="{ data }">
                            <span class="noa-cell-strong">{{ data.vehicle?.vehicle_license_plate || '-' }}</span>
                            <span v-if="data.vehicle?.internal_number" class="noa-cell-sub">
                                ({{ data.vehicle.internal_number }})
                            </span>
                        </template>
                    </Column>
                    <Column header="Cilindraje" style="width: 10%;">
                        <template #body="{ data }">
                            <span>{{ data.engine_displacement || '—' }}</span>
                        </template>
                    </Column>
                    <Column field="date" header="Fecha" sortable style="width: 10%;">
                        <template #body="{ data }">{{ dateUtils.format(data.date) }}</template>
                    </Column>
                    <Column field="total_spent" header="Tanqueo" sortable style="width: 11%;">
                        <template #body="{ data }">
                            <span :class="{ 'text-muted': !data.total_spent }">
                                $ {{ money(data.total_spent) }}
                            </span>
                        </template>
                    </Column>
                    <Column field="gallons_pumped" header="Galones" sortable style="width: 9%;">
                        <template #body="{ data }">{{ data.gallons_pumped }}</template>
                    </Column>
                    <Column header="Km/gal" style="width: 10%;">
                        <template #body="{ data }">
                            <span v-if="data.average_performance != null">{{ data.average_performance }} km/gal</span>
                            <span v-else-if="data.km_per_gallon">{{ data.km_per_gallon }} km/gal</span>
                            <span v-else class="text-muted">—</span>
                        </template>
                    </Column>
                    <Column header="Rendimiento" style="width: 11%;">
                        <template #body="{ data }">
                            <span v-if="data.rendimiento != null">{{ data.rendimiento }}</span>
                            <span v-else class="text-muted">—</span>
                        </template>
                    </Column>
                    <Column header="Alcance est." style="width: 11%;">
                        <template #body="{ data }">
                            <span v-if="data.estimated_range_km != null">{{ data.estimated_range_km }} km</span>
                            <span v-else class="text-muted">—</span>
                        </template>
                    </Column>
                    <Column header="Costo km" style="width: 12%;">
                        <template #body="{ data }">
                            <span v-if="data.cost_per_km != null && Number(data.cost_per_km) > 0">$ {{ money(data.cost_per_km) }}</span>
                            <span v-else class="text-muted">—</span>
                        </template>
                    </Column>
                    <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 11%;">
                        <template #body="{ data }">
                            <RowActions :actions="accionesDe(data)" :row-label="data.vehicle?.vehicle_license_plate || data.date || 'combustible'" />
                        </template>
                    </Column>
                    <template #loading>
                        <NoaTableSpinner message="Cargando registros..." />
                    </template>
                </DataTable>
            </div>
            <ListPagination :page="store.pagination.currentPage" :per-page="store.pagination.itemsPerPage"
                :total="store.pagination.totalItems" @change="onPageChange" />
        </div>
    </div>

    <FuelStatusDialog v-model:visible="showStatusModal" @create="goToCreate" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useFuelManagementStore } from '../store/fuelManagement.store.js';
import { usePermissionsStore } from '@store';
import { useTable } from '@/hooks/useTable.js';
import { useTableActions } from '@/hooks/useTableActions.js';
import { useServerSort } from '@/hooks/useServerSort.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import RowActions from '@/components/RowActions.vue';
import ListPagination from '@/components/ListPagination.vue';
import FuelStatusDialog from '../components/FuelStatusDialog.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import dateUtils from '@/utils/date.js';

const router = useRouter();
const route = useRoute();
const store = useFuelManagementStore();
const permissionsStore = usePermissionsStore();

const { handleSort } = useServerSort((field, order) => store.setSort(field, order), { route, router });

const isViewLoading = ref(true);
const searchQuery = ref('');

const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(searchQuery.value));
const { confirmDelete } = useTableActions(store, router);

const can = (action) => permissionsStore.can(action);
const money = (v) => Number(v || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

const clearSearch = async () => {
    searchQuery.value = '';
    await store.clearFilters();
};

const refreshTable = () => store.fetchItems();
const goToCreate = () => router.push('/flota/combustible/crear');
const goToEdit = (uuid) => router.push(`/flota/combustible/editar/${uuid}`);

const onPageChange = async ({ page, first, rows }) => {
    store.pagination.itemsPerPage = rows;
    const targetPage = page !== undefined ? page : Math.floor(first / rows) + 1;
    await store.setPage(targetPage);
};

const handleDelete = (item) => confirmDelete(item, {
    title: '¿Eliminar registro de combustible?',
    nameField: 'date',
});

const accionesDe = (data) => [
    { key: 'editar', label: 'Editar', icon: 'far fa-pen', tone: 'warning', inline: true, visible: can('fuel_logs.update'), onClick: () => goToEdit(data.uuid) },
    { key: 'eliminar', label: 'Eliminar', icon: 'far fa-trash-alt', tone: 'danger', visible: can('fuel_logs.delete'), onClick: () => handleDelete(data) },
];

onMounted(async () => {
    try {
        if (route.query.sort) {
            store.sortField = String(route.query.sort);
            store.sortOrder = route.query.order === 'desc' ? -1 : 1;
        }
        searchQuery.value = store.search;
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
        transform: translateY(16px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
