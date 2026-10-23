<template>
    <BasePageHeader title="Listado de Mantenimiento Vehicular" description="Gestión y registro del mantenimiento preventivo y correctivo de la flota."
        icon="fad fa-tools text-primary" :show-refresh="true" :show-create="true" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true"
        :breadcrumbs="[{ label: 'Mantenimiento' }, { label: 'Listado' }]" @refresh="refreshTable" @create="goToCreate" />

    <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar">
            <div class="noa-search">
                <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                <input v-model="searchQuery" class="noa-search__input" type="search" placeholder="Buscar por placa, descripción, taller..."
                    aria-label="Buscar mantenimiento" @input="debouncedSearch" />
                <button v-if="searchQuery" class="noa-search__clear" type="button" title="Limpiar búsqueda"
                    aria-label="Limpiar búsqueda" @click="clearSearch">
                    <i class="fal fa-times" aria-hidden="true" />
                </button>
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
                            <th v-for="w in ['20%', '68%', '12%']" :key="w"
                                style="padding:12px 8px">
                                <div class="skeleton-text" :style="`height:16px;width:${w}`" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="n in store.pagination.itemsPerPage" :key="`sk-${n}`">
                            <td v-for="i in 2" :key="i">
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
                <DataTable :value="groupedItems" lazy :paginator="false" :rows="store.pagination.itemsPerPage"
                    :totalRecords="store.pagination.totalItems" :first="(store.pagination.currentPage - 1) *
                        store.pagination.itemsPerPage
                        " :loading="store.loading" responsiveLayout="scroll"
                    tableStyle="min-width: 55rem" class="table table-sm mb-0 professional-table noa-table-fixed"
                    emptyMessage="No se encontraron registros">
                    <Column field="vehicle.vehicle_license_plate" header="Vehículo" sortable style="width: 18%;">
                        <template #body="{ data }">
                            <span class="noa-cell-strong">{{ data.vehicle?.vehicle_license_plate || '-' }}</span>
                            <span v-if="data.vehicle?.internal_number" class="noa-cell-sub">
                                Interno: {{ data.vehicle.internal_number }}
                            </span>
                        </template>
                    </Column>

                    <Column header="Mantenimientos Registrados" style="width: 70%;">
                        <template #body="{ data }">
                            <div class="row g-2 py-1">
                                <div v-for="m in data.maintenances" :key="m.uuid" class="col-12 col-md-6">
                                    <div class="p-2 border rounded bg-light position-relative" style="border-color: #e9ecef !important;">
                                        <div class="d-flex justify-content-between align-items-center mb-1">
                                            <span class="badge rounded-pill badge-subtle badge-subtle-info">
                                                {{ m.maintenance_type }}
                                            </span>
                                            <span class="text-muted small fw-medium">
                                                <i class="fad fa-calendar-alt me-1" />{{ dateUtils.format(m.maintenance_date) }}
                                            </span>
                                        </div>
                                        <div class="text-dark small fw-semibold mb-1" style="font-size: 0.8rem;">{{ m.service_description }}</div>
                                        <div class="text-muted small d-flex flex-wrap gap-2 align-items-center mb-1" style="font-size: 0.725rem;">
                                            <span><strong>KM:</strong> {{ m.mileage }} km</span>
                                            <span>•</span>
                                            <span><strong>Taller:</strong> {{ m.workshop_name || '-' }}</span>
                                            <span>•</span>
                                            <span>
                                                <span class="badge rounded-pill py-0 px-1" :class="{
                                                    'bg-warning text-dark': m.status === 'Pendiente',
                                                    'bg-success': m.status === 'Finalizado',
                                                    'bg-danger': m.status === 'Anulado'
                                                }">{{ m.status }}</span>
                                            </span>
                                        </div>
                                        <div class="d-flex justify-content-end gap-1 mt-1">
                                            <button v-if="can('maintenance.update')" class="noa-row-action noa-row-action--warning"
                                                type="button" title="Editar" :aria-label="`Editar ${m.service_description}`" @click="goToEdit(m.uuid)">
                                                <i class="far fa-pen" />
                                            </button>
                                            <button v-if="can('maintenance.delete')" class="noa-row-action noa-row-action--danger"
                                                type="button" title="Eliminar" :aria-label="`Eliminar ${m.service_description}`" @click="handleDelete(m)">
                                                <i class="far fa-trash-alt" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Column>

                    <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 12%;">
                        <template #body="{ data }">
                            <RowActions :actions="accionesDe(data)" :row-label="data.vehicle?.vehicle_license_plate || 'vehículo'" />
                        </template>
                    </Column>
                    <!-- Loading state -->
                    <template #loading>
                        <NoaTableSpinner message="Cargando datos..." />
                    </template>
                </DataTable>
            </div>
            <ListPagination :page="store.pagination.currentPage" :per-page="store.pagination.itemsPerPage"
                :total="store.pagination.totalItems" @change="onPageChange" />
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useMaintenanceStore } from '../store/maintenance.store.js';
import { usePermissionsStore } from '@store';
import VehiclesService from '@/features/vehicles/services/vehicles.service.js';
import { useTable } from '@/hooks/useTable.js';
import { useTableActions } from '@/hooks/useTableActions.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import RowActions from '@/components/RowActions.vue';
import ListPagination from '@/components/ListPagination.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Swal from 'sweetalert2';
import dateUtils from '@/utils/date.js';

const router = useRouter();
const store = useMaintenanceStore();
const permissionsStore = usePermissionsStore();

const isViewLoading = ref(true);
const searchQuery = ref('');

const groupedItems = computed(() => {
    const groups = {};
    store.items.forEach(item => {
        const key = item.vehicle?.uuid || 'no-vehicle';
        if (!groups[key]) {
            groups[key] = {
                uuid: key,
                vehicle: item.vehicle,
                maintenances: [],
            };
        }
        groups[key].maintenances.push(item);
    });
    return Object.values(groups);
});

const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(searchQuery.value));
const { confirmDelete, initTooltips, destroyTooltips } = useTableActions(store, router);

const can = (action) => permissionsStore.can(action);

const clearSearch = async () => { searchQuery.value = ''; await store.clearFilters(); };
const refreshTable = () => store.fetchItems();
const onPageChange = async ({ first, rows }) => {
    store.pagination.itemsPerPage = rows;
    await store.setPage(Math.floor(first / rows) + 1);
};

const goToCreate = () => router.push('/mantenimiento/crear');
const goToEdit = (uuid) => router.push(`/mantenimiento/editar/${uuid}`);

const handleDelete = (item) => confirmDelete(item, {
    title: '¿Eliminar mantenimiento?',
    nameField: 'service_description',
});

const accionesDe = (data) => [
    {
        key: 'pdf',
        label: 'Descargar hoja de vida de mantenimiento (PDF)',
        icon: 'far fa-file-pdf',
        tone: 'neutral',
        inline: true,
        visible: !!(data.vehicle && can('vehicles.history_pdf')),
        onClick: () => downloadMaintenanceHistoryPdf(data.vehicle),
    },
];

const downloadMaintenanceHistoryPdf = async (vehicle) => {
    if (!vehicle?.uuid) {
        Swal.fire({
            icon: 'warning',
            title: 'Sin vehículo',
            text: 'Este registro no trae el identificador del vehículo. Recargue el listado e intente de nuevo.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 4000,
        });
        return;
    }
    try {
        await VehiclesService.downloadMaintenanceHistory(vehicle.uuid);
    } catch (error) {
        console.error('Error al descargar la hoja de vida de mantenimiento:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error?.message || error.response?.data?.message || 'No se pudo descargar la hoja de vida de mantenimiento.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 4000,
        });
    }
};

onMounted(async () => {
    try {
        searchQuery.value = store.search;
        await store.fetchItems();
    } finally {
        isViewLoading.value = false;
        initTooltips();
    }
});

onUnmounted(() => destroyTooltips());
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