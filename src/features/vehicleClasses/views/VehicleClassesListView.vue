<template>
    <BasePageHeader title="Clases de Vehículos" subtitle="Gestiona las clases de vehículos registradas en el sistema"
        icon="fad fa-truck text-primary" :show-refresh="true" :show-create="true" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true" :canCreate="can('vehicle_classes.create')"
        :breadcrumbs="[{ label: 'Configuración' }, { label: 'Clases de Vehículos' }]" @refresh="refreshTable" @create="goToCreate" />

    <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar">
            <div class="noa-search">
                <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                <input id="f-vehicle-classes-busqueda" v-model="searchQuery" class="noa-search__input"
                    type="search" placeholder="Buscar por código o descripción..."
                    aria-label="Buscar clase de vehículo" @input="debouncedSearch" />
                <button v-if="searchQuery" class="noa-search__clear" type="button"
                    title="Limpiar búsqueda" aria-label="Limpiar búsqueda" @click="clearSearch">
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
                            <th v-for="w in ['25%', '62%', '13%']" :key="w" style="padding:12px 8px">
                                <div class="skeleton-text" :style="`height:16px;width:${w}`" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="n in store.pagination.itemsPerPage" :key="`sk-${n}`">
                            <td><div class="skeleton-text" style="height:18px;width:50%;" /></td>
                            <td><div class="skeleton-text" style="height:18px;width:75%;" /></td>
                            <td>
                                <div class="d-flex justify-content-end gap-1">
                                    <div v-for="j in 2" :key="j" class="skeleton-icon" style="height:28px;width:28px;" />
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
                    :loading="store.loading" responsiveLayout="scroll"
                    tableStyle="min-width: 50rem" class="table table-sm mb-0 professional-table noa-table-fixed"
                    emptyMessage="No se encontraron registros"
                    :sortField="sortField" :sortOrder="sortOrdenPrimeVue" removableSort @sort="onSort">

                    <!-- Código -->
                    <Column field="class_code_class" header="Código" sortable style="width: 25%;">
                        <template #body="{ data }">
                            <span class="badge bg-primary bg-opacity-10 text-primary font-monospace" style="font-size:0.85rem;">
                                {{ data.class_code_class || '—' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Descripción -->
                    <Column field="description" header="Descripción" sortable style="width: 62%;">
                        <template #body="{ data }">
                            <span class="noa-cell-strong d-block" style="font-size:0.85rem;">
                                {{ data.description || '—' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Acciones -->
                    <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 13%;"
                        v-if="can('vehicle_classes.update') || can('vehicle_classes.delete')">
                        <template #body="{ data }">
                            <RowActions :actions="accionesDe(data)" :row-label="data.description || 'clase de vehículo'" />
                        </template>
                    </Column>

                    <!-- Empty state -->
                    <template #empty>
                        <div class="text-center py-5">
                            <i class="fad fa-truck fs-1 text-muted opacity-50 mb-3 d-block" aria-hidden="true" />
                            <h6 class="text-muted mb-1 fw-medium">No hay clases de vehículos registradas</h6>
                            <p class="text-muted small mb-3">Comienza agregando tu primera clase de vehículo</p>
                            <button v-if="can('vehicle_classes.create')" class="btn btn-primary btn-sm" type="button" @click="goToCreate">
                                <i class="fad fa-plus me-1" aria-hidden="true" />Agregar primera clase
                            </button>
                        </div>
                    </template>

                    <!-- Loading state -->
                    <template #loading>
                        <NoaTableSpinner message="Cargando clases de vehículos..." />
                    </template>
                </DataTable>
            </div>
            <ListPagination :page="store.pagination.currentPage" :per-page="store.pagination.itemsPerPage"
                :total="store.pagination.totalItems" @change="onPageChange" />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useServerSort } from '@/hooks/useServerSort.js';
import { useVehicleClassesStore } from '../store/vehicleClasses.store.js';
import { usePermissionsStore } from '@store';
import { useTable } from '@/hooks/useTable.js';
import { useTableActions } from '@/hooks/useTableActions.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import RowActions from '@/components/RowActions.vue';
import ListPagination from '@/components/ListPagination.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const router = useRouter();
const route = useRoute();
const store = useVehicleClassesStore();
const permissionsStore = usePermissionsStore();

const isViewLoading = ref(true);
const searchQuery = ref('');

const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(searchQuery.value));
const { confirmDelete, initTooltips, destroyTooltips } = useTableActions(store, router);
const { sortField, sortOrdenPrimeVue, onSort, restore } = useServerSort({
    onChange: ({ field, order }) => store.setSort(field, order),
    route,
    router,
});

const can = (action, subject) => permissionsStore.can(action, subject);

const clearSearch = async () => {
    searchQuery.value = '';
    await store.clearFilters();
};

const onPageChange = async ({ page, first, rows }) => {
    store.pagination.itemsPerPage = rows;
    const targetPage = page !== undefined ? page : Math.floor(first / rows) + 1;
    await store.setPage(targetPage);
};

const goToCreate = () => router.push('/configuracion/clases-vehiculos/crear');
const goToEdit = (uuid) => uuid && router.push(`/configuracion/clases-vehiculos/editar/${uuid}`);
const refreshTable = () => store.fetchItems();

const handleDelete = (item) => confirmDelete(item, {
    title: '¿Eliminar clase de vehículo?',
    nameField: 'description',
    html: `
        <p class="mb-2">¿Estás seguro de eliminar la clase <strong>"${item.description}"</strong>?</p>
        <div class="alert alert-warning small mb-0 mt-2">
            <i class="fad fa-exclamation-triangle me-1" aria-hidden="true"></i>
            Esta acción no se puede deshacer.
        </div>`,
});

const accionesDe = (data) => [
    {
        key: 'editar',
        label: 'Editar',
        icon: 'far fa-pen',
        tone: 'warning',
        inline: true,
        visible: can('vehicle_classes.update'),
        onClick: () => goToEdit(data.uuid ?? data.id),
    },
    {
        key: 'eliminar',
        label: 'Eliminar',
        icon: 'far fa-trash-alt',
        tone: 'danger',
        visible: can('vehicle_classes.delete'),
        onClick: () => handleDelete(data),
    },
];

onMounted(async () => {
    try {
        const sortParam = route.query.sort;
        const orderParam = route.query.order;
        if (typeof sortParam === 'string' && sortParam) {
            store.sortField = sortParam;
            store.sortOrder = orderParam === 'desc' ? -1 : 1;
            restore(sortParam, orderParam === 'desc' ? 'desc' : 'asc');
        }
        searchQuery.value = store.search;
        await store.fetchItems();
    } finally {
        setTimeout(() => {
            isViewLoading.value = false;
            initTooltips();
        }, 300);
    }
});

onUnmounted(() => destroyTooltips());
</script>

<style scoped>
.font-monospace { font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
.bg-opacity-10 { --bs-bg-opacity: 0.1; }
.skeleton-text, .skeleton-icon { background: #e9ecef; border-radius: 4px; animation: pulse 1.2s infinite; }
.skeleton-icon { border-radius: .25rem; }
.scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.scrollbar::-webkit-scrollbar-track { background: #f1f3f5; border-radius: 3px; }
.scrollbar::-webkit-scrollbar-thumb { background: #adb5bd; border-radius: 3px; }

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
</style>
