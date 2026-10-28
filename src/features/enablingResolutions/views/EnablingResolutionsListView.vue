<template>
    <BasePageHeader :title="'Listado de Resoluciones de Habilitación'"
        description="Gestión de las resoluciones de habilitación para la emisión de FUECs en el sistema."
        icon="fad fa-file-certificate text-primary" :show-refresh="true" :show-create="true" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true"
        :breadcrumbs="[{ label: 'Resoluciones de Habilitación' }, { label: 'Listado' }]" @refresh="refreshTable"
        @create="goToCreate" />

    <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar">
            <div class="noa-search">
                <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                <input id="f-enabling-resolutions-busqueda" v-model="searchQuery" class="noa-search__input"
                    type="search" placeholder="Buscar por número de resolución, FUEC o código territorial..."
                    aria-label="Buscar resolución habilitante" @input="debouncedSearch" />
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
                            <th v-for="w in ['22%', '16%', '16%', '14%', '12%', '10%', '10%']" :key="w" style="padding:12px 8px">
                                <div class="skeleton-text" :style="`height:16px;width:${w}`" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="n in store.pagination.itemsPerPage" :key="`sk-${n}`">
                            <td v-for="i in 6" :key="i">
                                <div class="skeleton-text" style="height:18px;width:75%;" />
                            </td>
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
                    tableStyle="min-width: 55rem" class="table table-sm mb-0 professional-table noa-table-fixed"
                    emptyMessage="No se encontraron resoluciones de habilitación"
                    :sortField="sortField" :sortOrder="sortOrdenPrimeVue" removableSort @sort="onSort">

                    <!-- Empresa -->
                    <Column field="company.business_name" header="Empresa" sortable style="width: 22%;">
                        <template #body="{ data }">
                            <span class="noa-cell-strong">
                                {{ data.company?.business_name || '—' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Número de Resolución -->
                    <Column field="resolution_number" header="N° Resolución" sortable style="width: 16%;">
                        <template #body="{ data }">
                            <span class="font-monospace text-primary fw-medium">
                                {{ data.resolution_number || '—' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Número FUEC -->
                    <Column field="number_fuec" header="N° FUEC" sortable style="width: 16%;">
                        <template #body="{ data }">
                            <span class="text-dark">
                                {{ data.number_fuec || '—' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Código Territorial -->
                    <Column field="territorial_code" header="Cód. Territorial" sortable style="width: 14%;">
                        <template #body="{ data }">
                            <span class="badge bg-light text-dark border">
                                {{ data.territorial_code || '—' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Fecha de Resolución -->
                    <Column field="resolution_date" header="Fecha Resolución" sortable style="width: 12%;">
                        <template #body="{ data }">
                            <span class="text-muted">
                                {{ formatDate(data.resolution_date) }}
                            </span>
                        </template>
                    </Column>

                    <!-- Estado -->
                    <Column field="status" header="Estado" sortable class="text-center" header-class="text-center" style="width: 10%;">
                        <template #body="{ data }">
                            <span class="noa-status" :class="data.status ? 'noa-status--success' : 'noa-status--warning'">
                                {{ data.status ? "Vigente" : "No Vigente" }}
                            </span>
                        </template>
                    </Column>

                    <!-- Acciones -->
                    <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 10%;"
                        v-if="can('enabling_resolutions.update') || can('enabling_resolutions.delete')">
                        <template #body="{ data }">
                            <RowActions :actions="accionesDe(data)" :row-label="data.resolution_number || 'resolución de habilitación'" />
                        </template>
                    </Column>

                    <template #empty>
                        <div class="text-center py-5">
                            <i class="fad fa-file-certificate fs-1 text-muted opacity-50 mb-3 d-block" aria-hidden="true" />
                            <h6 class="text-muted mb-1 fw-medium">No se encontraron resoluciones de habilitación</h6>
                            <p class="text-muted small mb-3">Comienza creando tu primera resolución de habilitación.</p>
                            <button v-if="can('enabling_resolutions.create')" class="btn btn-primary btn-sm" type="button" @click="goToCreate">
                                <i class="fad fa-plus me-1" aria-hidden="true" />Nueva resolución
                            </button>
                        </div>
                    </template>

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
/**
 * @file EnablingResolutionsListView.vue
 * @description Vista de listado del módulo de Resoluciones de Habilitación.
 * Implementa DataTable con paginación server-side, búsqueda global y acciones CRUD bajo el estándar Stitch.
 * @module enablingResolutions/ListView
 */

import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEnablingResolutionsStore } from '../store/enablingResolutions.store.js';
import { usePermissionsStore } from '@store';
import { useTable } from '@/hooks/useTable.js';
import { useTableActions } from '@/hooks/useTableActions.js';
import { useServerSort } from '@/hooks/useServerSort.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import RowActions from '@/components/RowActions.vue';
import ListPagination from '@/components/ListPagination.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const route = useRoute();
const router = useRouter();
const store = useEnablingResolutionsStore();
const permissionsStore = usePermissionsStore();

const { sortField, sortOrdenPrimeVue, onSort, restore } = useServerSort({
    onChange: ({ field, order }) => store.setSort(field, order),
});

const isViewLoading = ref(true);
const searchQuery = ref('');

const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(searchQuery.value));
const { confirmDelete, initTooltips, destroyTooltips } = useTableActions(store, router);

const can = (action) => permissionsStore.can(action);

const clearSearch = async () => { searchQuery.value = ''; await store.clearFilters(); };
const refreshTable = () => store.fetchItems();

const onPageChange = async ({ page, first, rows }) => {
    store.pagination.itemsPerPage = rows;
    const targetPage = page !== undefined ? page : Math.floor(first / rows) + 1;
    await store.setPage(targetPage);
};

const goToCreate = () => router.push('/empresas/resoluciones-habilitacion/crear');
const goToEdit = (uuid) => router.push(`/empresas/resoluciones-habilitacion/editar/${uuid}`);

const handleDelete = (item) => confirmDelete(item, {
    title: '¿Eliminar resolución de habilitación?',
    nameField: 'resolution_number',
});

const accionesDe = (data) => [
    {
        key: 'editar',
        label: 'Editar',
        icon: 'far fa-pen',
        tone: 'warning',
        inline: true,
        visible: can('enabling_resolutions.update'),
        onClick: () => goToEdit(data.uuid),
    },
    {
        key: 'eliminar',
        label: 'Eliminar',
        icon: 'far fa-trash-alt',
        tone: 'danger',
        visible: can('enabling_resolutions.delete'),
        onClick: () => handleDelete(data),
    },
];

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    } catch {
        return dateStr;
    }
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

.font-monospace {
    font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style>
