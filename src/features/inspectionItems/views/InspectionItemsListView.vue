<script setup>
import { ref, shallowRef, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useInspectionItemsStore } from '../store/inspectionItems.store.js';
import { usePermissionsStore } from '@store';
import { useTable } from '@/hooks/useTable.js';
import { useTableActions } from '@/hooks/useTableActions.js';
import { useServerSort } from '@/hooks/useServerSort.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import RowActions from '@/components/RowActions.vue';
import ListPagination from '@/components/ListPagination.vue';
import PrimeSelect from '@/components/form/PrimeSelect.vue';
import InspectionCategoriesModal from '../components/InspectionCategoriesModal.vue';
import InspectionItemsBulkImportModal from '../components/InspectionItemsBulkImportModal.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const route = useRoute();
const router = useRouter();
const store = useInspectionItemsStore();
const permissionsStore = usePermissionsStore();

const { sortField, sortOrdenPrimeVue, onSort, restore } = useServerSort({
    onChange: ({ field, order }) => store.setSort(field, order),
});

const isViewLoading = shallowRef(true);
const searchQuery = shallowRef('');
const selectedCategory = ref('');
const categoriesModalVisible = shallowRef(false);
const bulkImportModalVisible = shallowRef(false);

const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(searchQuery.value));
const { confirmDelete, initTooltips, destroyTooltips } = useTableActions(store, router);

const can = (action, subject) => permissionsStore.can(action, subject);

const formatCategory = (value) => {
    if (!value) return '—';
    const label = store.categoryLabelsMap[value];
    if (label) return label;
    return String(value).replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
};

const onCategoryChange = async (value) => {
    selectedCategory.value = value || '';
    await store.setCategoryFilter(selectedCategory.value);
};

const clearSearch = async () => {
    searchQuery.value = '';
    selectedCategory.value = '';
    await store.clearFilters();
};

const refreshTable = () => Promise.all([store.fetchItems(), store.fetchCategories()]);

const onPageChange = async ({ page, first, rows }) => {
    store.pagination.itemsPerPage = rows;
    const targetPage = page !== undefined ? page : Math.floor(first / rows) + 1;
    await store.setPage(targetPage);
};

const goToCreate = () => router.push('/configuracion/items-inspeccion/crear');
const goToEdit = (uuid) => uuid && router.push(`/configuracion/items-inspeccion/editar/${uuid}`);

const handleDelete = (item) => confirmDelete(item, {
    title: '¿Eliminar ítem de inspección?',
    nameField: 'item_name',
    html: `
        <p class="mb-2">¿Estás seguro de eliminar el ítem <strong>"${item.item_name}"</strong>?</p>
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
        visible: can('inspection_items.update'),
        onClick: () => goToEdit(data.uuid ?? data.id),
    },
    {
        key: 'eliminar',
        label: 'Eliminar',
        icon: 'far fa-trash-alt',
        tone: 'danger',
        visible: can('inspection_items.delete'),
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
        selectedCategory.value = store.categoryFilter;
        await Promise.all([store.fetchCategories(), store.fetchItems()]);
    } finally {
        isViewLoading.value = false;
        initTooltips();
    }
});

onUnmounted(() => destroyTooltips());
</script>

<template>
    <BasePageHeader title="Ítems de Inspección" subtitle="Gestiona categorías e ítems del checklist de inspección preoperacional"
        icon="fad fa-clipboard-check text-primary" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true"
        :breadcrumbs="[{ label: 'Configuración' }, { label: 'Ítems de Inspección' }]">
        <template #actions>
            <button class="btn btn-falcon-default btn-sm px-2 px-sm-3" type="button" title="Actualizar" @click="refreshTable">
                <i class="fad fa-sync" aria-hidden="true" />
                <span class="d-none d-sm-inline ms-1">Actualizar</span>
            </button>

            <button
                v-if="can('inspection_items.create') || can('inspection_items.update')"
                class="btn btn-outline-primary btn-sm px-2 px-sm-3"
                type="button"
                title="Gestionar categorías de inspección"
                @click="categoriesModalVisible = true"
            >
                <i class="fad fa-layer-group" aria-hidden="true" />
                <span class="d-none d-md-inline ms-1">Categorías</span>
            </button>

            <button
                v-if="can('inspection_items.create')"
                class="btn btn-outline-success btn-sm px-2 px-sm-3"
                type="button"
                title="Carga masiva mediante archivo Excel"
                @click="bulkImportModalVisible = true"
            >
                <i class="fad fa-file-excel" aria-hidden="true" />
                <span class="d-none d-md-inline ms-1">Carga Masiva Excel</span>
            </button>

            <button
                v-if="can('inspection_items.create')"
                class="btn btn-primary btn-sm px-2 px-sm-3"
                type="button"
                title="Agregar ítems de inspección"
                @click="goToCreate"
            >
                <i class="fad fa-plus" aria-hidden="true" />
                <span class="d-none d-sm-inline ms-1">Nuevo</span>
            </button>
        </template>
    </BasePageHeader>

    <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar flex-wrap gap-2">
            <div class="noa-search">
                <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                <input id="f-inspection-items-busqueda" v-model="searchQuery" class="noa-search__input"
                    type="search" placeholder="Buscar por categoría, nombre o descripción..."
                    aria-label="Buscar ítem de inspección" @input="debouncedSearch" />
                <button v-if="searchQuery" class="noa-search__clear" type="button"
                    title="Limpiar búsqueda" aria-label="Limpiar búsqueda" @click="clearSearch">
                    <i class="fal fa-times" aria-hidden="true" />
                </button>
            </div>

            <div class="category-filter-box">
                <PrimeSelect
                    input-id="f-inspection-category-filter"
                    :model-value="selectedCategory"
                    :options="store.categoryOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="Todas las categorías"
                    showClear
                    filter
                    class="w-100"
                    @update:model-value="onCategoryChange"
                />
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
                            <th v-for="w in ['22%', '34%', '32%', '12%']" :key="w" style="padding:12px 8px">
                                <div class="skeleton-text" :style="`height:16px;width:${w}`" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="n in store.pagination.itemsPerPage" :key="`sk-${n}`">
                            <td v-for="i in 3" :key="i">
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

                    <!-- Categoría -->
                    <Column field="category" header="Categoría" sortable style="width: 22%;">
                        <template #body="{ data }">
                            <span class="noa-cell-strong text-primary">
                                {{ formatCategory(data.category) }}
                            </span>
                        </template>
                    </Column>

                    <!-- Nombre del ítem -->
                    <Column field="item_name" header="Nombre del ítem" sortable style="width: 34%;">
                        <template #body="{ data }">
                            <span class="text-dark fw-medium">
                                {{ data.item_name || '—' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Descripción -->
                    <Column field="description" header="Descripción" style="width: 32%;">
                        <template #body="{ data }">
                            <span class="text-muted text-break small">
                                {{ data.description || '—' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Acciones -->
                    <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 12%;"
                        v-if="can('inspection_items.update') || can('inspection_items.delete')">
                        <template #body="{ data }">
                            <RowActions :actions="accionesDe(data)" :row-label="data.item_name || 'ítem de inspección'" />
                        </template>
                    </Column>

                    <template #empty>
                        <div class="text-center py-5">
                            <i class="fad fa-clipboard-check fs-1 text-muted opacity-50 mb-3 d-block" aria-hidden="true" />
                            <h6 class="text-muted mb-1 fw-medium">No hay ítems registrados</h6>
                            <p class="text-muted small mb-3">Comienza agregando ítems manualmente o mediante plantilla Excel.</p>
                            <div class="d-flex justify-content-center gap-2 flex-wrap">
                                <button v-if="can('inspection_items.create')" class="btn btn-outline-success btn-sm" type="button" @click="bulkImportModalVisible = true">
                                    <i class="fad fa-file-excel me-1" aria-hidden="true" />Carga Masiva Excel
                                </button>
                                <button v-if="can('inspection_items.create')" class="btn btn-primary btn-sm" type="button" @click="goToCreate">
                                    <i class="fad fa-plus me-1" aria-hidden="true" />Agregar ítems
                                </button>
                            </div>
                        </div>
                    </template>

                    <!-- Loading state -->
                    <template #loading>
                        <NoaTableSpinner message="Cargando ítems de inspección..." />
                    </template>
                </DataTable>
            </div>
            <ListPagination :page="store.pagination.currentPage" :per-page="store.pagination.itemsPerPage"
                :total="store.pagination.totalItems" @change="onPageChange" />
        </div>
    </div>

    <InspectionCategoriesModal v-model:visible="categoriesModalVisible" />
    <InspectionItemsBulkImportModal v-model:visible="bulkImportModalVisible" />
</template>

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

.category-filter-box {
    min-width: 220px;
}

.text-break {
    word-break: break-word;
    overflow-wrap: break-word;
    white-space: normal;
    display: inline-block;
    max-width: 100%;
}
</style>
