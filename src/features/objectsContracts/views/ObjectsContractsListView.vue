<template>
    <BasePageHeader title="Objetos de Contrato" subtitle="Gestiona los objetos de contrato registrados en el sistema"
        icon="fad fa-file-contract text-primary" :show-refresh="true" :show-create="true" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true" :canCreate="can('objects_contracts.create')"
        :breadcrumbs="[{ label: 'Configuración' }, { label: 'Objetos de Contrato' }]" @refresh="refreshTable" @create="goToCreate" />

    <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar">
            <div class="noa-search">
                <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                <input id="f-objects-contracts-busqueda" v-model="searchQuery" class="noa-search__input"
                    type="search" placeholder="Buscar por nombre o descripción..."
                    aria-label="Buscar objeto de contrato" @input="debouncedSearch" />
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
                            <th v-for="w in ['38%', '50%', '12%']" :key="w" style="padding:12px 8px">
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

                    <!-- Nombre -->
                    <Column field="name" header="Nombre" sortable style="width: 38%;">
                        <template #body="{ data }">
                            <div class="d-flex align-items-center gap-2">
                                <div class="avatar-placeholder bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 28px; height: 28px; font-size: 0.75rem; font-weight: 600;">
                                    {{ getInitials(data.name) }}
                                </div>
                                <span class="noa-cell-strong">
                                    {{ data.name || '—' }}
                                </span>
                            </div>
                        </template>
                    </Column>

                    <!-- Descripción -->
                    <Column field="description" header="Descripción" style="width: 50%;">
                        <template #body="{ data }">
                            <span class="text-muted small">
                                {{ data.description || '—' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Acciones -->
                    <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 12%;"
                        v-if="can('objects_contracts.index') || can('objects_contracts.update') || can('objects_contracts.delete')">
                        <template #body="{ data }">
                            <RowActions :actions="accionesDe(data)" :row-label="data.name || 'objeto de contrato'" />
                        </template>
                    </Column>

                    <template #empty>
                        <div class="text-center py-5">
                            <i class="fad fa-file-contract fs-1 text-muted opacity-50 mb-3 d-block" aria-hidden="true" />
                            <h6 class="text-muted mb-1 fw-medium">No hay objetos de contrato registrados</h6>
                            <p class="text-muted small mb-3">Comienza agregando tu primer objeto de contrato.</p>
                            <button v-if="can('objects_contracts.create')" class="btn btn-primary btn-sm" type="button" @click="goToCreate">
                                <i class="fad fa-plus me-1" aria-hidden="true" />Agregar primer objeto
                            </button>
                        </div>
                    </template>

                    <!-- Loading state -->
                    <template #loading>
                        <NoaTableSpinner message="Cargando objetos de contrato..." />
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
import { useRoute, useRouter } from 'vue-router';
import { useObjectsContractsStore } from '../store/objectsContracts.store.js';
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
const store = useObjectsContractsStore();
const permissionsStore = usePermissionsStore();

const { sortField, sortOrdenPrimeVue, onSort, restore } = useServerSort({
    onChange: ({ field, order }) => store.setSort(field, order),
});

const isViewLoading = ref(true);
const searchQuery = ref('');

const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(searchQuery.value));
const { confirmDelete, initTooltips, destroyTooltips } = useTableActions(store, router);

const can = (action, subject) => permissionsStore.can(action, subject);

const getInitials = (text) => {
    if (!text) return '?';
    const words = String(text).trim().split(/\s+/);
    return words.length === 1
        ? words[0][0].toUpperCase()
        : (words[0][0] + words[1][0]).toUpperCase();
};

const clearSearch = async () => {
    searchQuery.value = '';
    await store.clearFilters();
};

const refreshTable = () => store.fetchItems();

const onPageChange = async ({ page, first, rows }) => {
    store.pagination.itemsPerPage = rows;
    const targetPage = page !== undefined ? page : Math.floor(first / rows) + 1;
    await store.setPage(targetPage);
};

const goToCreate = () => router.push('/configuracion/objetos-contrato/crear');
const goToEdit = (id) => id && router.push(`/configuracion/objetos-contrato/editar/${id}`);

const handleDelete = (item) => confirmDelete(item, {
    title: '¿Eliminar objeto de contrato?',
    nameField: 'name',
    html: `
        <p class="mb-2">¿Estás seguro de eliminar el objeto de contrato <strong>"${item.name}"</strong>?</p>
        <div class="alert alert-warning small mb-0 mt-2">
            <i class="fad fa-exclamation-triangle me-1"></i>
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
        visible: can('objects_contracts.update'),
        onClick: () => goToEdit(data.uuid ?? data.id),
    },
    {
        key: 'eliminar',
        label: 'Eliminar',
        icon: 'far fa-trash-alt',
        tone: 'danger',
        visible: can('objects_contracts.delete'),
        onClick: () => handleDelete(data),
    },
];

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
        transform: translateY(16px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
