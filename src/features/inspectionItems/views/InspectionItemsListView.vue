<template>
    <BasePageHeader title="Ítems de Inspección" subtitle="Gestiona los ítems del checklist de inspección preoperacional"
        icon="fad fa-clipboard-check text-primary" :show-refresh="true" :show-create="true" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true" :canCreate="can('inspection_items.create')"
        :breadcrumbs="[{ label: 'Configuración' }, { label: 'Ítems de Inspección' }]" @refresh="refreshTable" @create="goToCreate" />

    <div class="card border-0 shadow-sm mb-3 fade-in-up" style="animation-delay: 0.1s;">
        <div class="bg-holder d-none d-lg-block bg-card"
            style="background-image:url(/assets/img/icons/spot-illustrations/corner-4.png);" />
        <div class="card-body position-relative py-2">
            <div class="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3 g-2 g-md-3">
                <div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2 flex-grow-1 g-2 g-md-3">
                    <h6 class="mb-0 fw-medium text-nowrap">Búsqueda</h6>
                    <div class="input-group input-group-sm w-100" style="max-width: 420px;">
                        <span class="input-group-text bg-light border-end-0">
                            <i class="fad fa-search text-muted" aria-hidden="true" />
                        </span>
                        <input v-model="searchQuery" class="form-control form-control-sm border-start-0 shadow-none"
                            type="search" placeholder="Buscar por categoría o nombre del ítem..."
                            aria-label="Buscar ítem de inspección" @input="debouncedSearch" />
                        <button v-if="searchQuery" class="btn btn-outline-secondary border-start-0" type="button"
                            title="Limpiar búsqueda" aria-label="Limpiar búsqueda" @click="clearSearch">
                            <i class="fad fa-times" aria-hidden="true" />
                        </button>
                    </div>
                </div>
                <div v-if="!isViewLoading && !store.loading" class="text-muted text-lg-end text-nowrap">
                    <small>
                        <i class="fad fa-filter me-1" aria-hidden="true" />
                        {{ store.pagination.totalItems }} resultado{{ store.pagination.totalItems !== 1 ? 's' : '' }}
                        <span v-if="store.search"> para "{{ store.search }}"</span>
                    </small>
                </div>
            </div>
        </div>
    </div>

    <div class="row gx-3 fade-in-up" style="animation-delay: 0.2s;">
        <div class="col-12 col-xxl-12">
            <div class="card border-0 shadow-sm">
                <div class="bg-holder d-none d-lg-block bg-card"
                    style="background-image:url(/assets/img/icons/spot-illustrations/corner-4.png);" />
                <div class="card-body p-0">
                    <div class="table-responsive scrollbar">
                        <DataTable :value="store.items" lazy :paginator="true" :rows="store.pagination.itemsPerPage"
                            :totalRecords="store.pagination.totalItems"
                            :first="(store.pagination.currentPage - 1) * store.pagination.itemsPerPage"
                            :loading="store.loading" :rowsPerPageOptions="[10, 25, 50, 100]" responsiveLayout="scroll"
                            tableStyle="min-width: 50rem" class="table table-sm mb-0 professional-table"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
                            emptyMessage="No se encontraron registros" @page="onPageChange">

                            <Column field="category" header="Categoría" sortable style="width: 180px;">
                                <template #body="{ data }">
                                    <span class="badge rounded-pill badge-subtle badge-subtle-info"
                                        style="font-size:0.8rem;padding:0.4em 0.75em;">
                                        {{ formatCategory(data.category) }}
                                    </span>
                                </template>
                            </Column>

                            <Column field="item_name" header="Nombre del ítem" sortable>
                                <template #body="{ data }">
                                    <span class="text-dark fw-medium" style="font-size:0.85rem;">
                                        {{ data.item_name || '—' }}
                                    </span>
                                </template>
                            </Column>

                            <Column field="description" header="Descripción">
                                <template #body="{ data }">
                                    <span class="text-muted text-break" style="font-size:0.85rem;">
                                        {{ data.description || '—' }}
                                    </span>
                                </template>
                            </Column>

                            <Column header="Acciones" class="text-center" style="min-width:120px; width: 120px;" v-if="can('inspection_items.update') || can('inspection_items.delete')">
                                <template #body="{ data }">
                                    <div class="btn-group btn-group-sm" role="group" :aria-label="`Acciones para ${data.item_name}`">
                                        <button v-if="can('inspection_items.update')" class="btn btn-falcon-default" type="button"
                                            title="Editar" :aria-label="`Editar ${data.item_name}`" @click="goToEdit(data.uuid ?? data.id)">
                                            <i class="fad fa-edit text-warning" style="font-size:14px;" aria-hidden="true" />
                                        </button>
                                        <button v-if="can('inspection_items.delete')" class="btn btn-falcon-default"
                                            type="button" title="Eliminar" :aria-label="`Eliminar ${data.item_name}`" @click="handleDelete(data)">
                                            <i class="fad fa-trash text-danger" style="font-size:14px;" aria-hidden="true" />
                                        </button>
                                    </div>
                                </template>
                            </Column>

                            <template #empty>
                                <div class="text-center py-5">
                                    <i class="fad fa-clipboard-check fs-1 text-muted opacity-50 mb-3 d-block" aria-hidden="true" />
                                    <h6 class="text-muted mb-1 fw-medium">No hay ítems registrados</h6>
                                    <p class="text-muted small mb-3">Comienza agregando tu primer ítem de inspección</p>
                                    <button v-if="can('inspection_items.create')" class="btn btn-primary btn-sm" @click="goToCreate">
                                        <i class="fad fa-plus me-1" aria-hidden="true" />Agregar primer ítem
                                    </button>
                                </div>
                            </template>

                            <template #loading>
                                <NoaTableSpinner message="Cargando ítems de inspección..." />
                            </template>

                            <template #footer>
                                <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 py-2 px-3 bg-light rounded-bottom">
                                    <small class="text-muted" style="font-size:0.85rem;">
                                        <i class="fad fa-list me-1" aria-hidden="true" />
                                        Mostrando <strong>{{ store.items.length }}</strong> de
                                        <strong>{{ store.pagination.totalItems }}</strong> registros
                                    </small>
                                    <small class="text-muted" style="font-size:0.85rem;">
                                        <i class="fad fa-pages me-1" aria-hidden="true" />
                                        Página <strong>{{ store.pagination.currentPage }}</strong> de
                                        <strong>{{ store.pagination.totalPages }}</strong>
                                    </small>
                                </div>
                            </template>
                        </DataTable>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useInspectionItemsStore } from '../store/inspectionItems.store.js';
import { usePermissionsStore } from '@store';
import { useTable } from '@/hooks/useTable.js';
import { useTableActions } from '@/hooks/useTableActions.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const router = useRouter();
const store = useInspectionItemsStore();
const permissionsStore = usePermissionsStore();

const isViewLoading = ref(true);
const searchQuery = ref('');

const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(searchQuery.value));
const { confirmDelete, initTooltips, destroyTooltips } = useTableActions(store, router);

const can = (action, subject) => permissionsStore.can(action, subject);

const formatCategory = (value) => {
    if (!value) return '—';
    return String(value).replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
};

const clearSearch = async () => {
    searchQuery.value = '';
    await store.clearFilters();
};

const onPageChange = async ({ first, rows }) => {
    await store.setPage(Math.floor(first / rows) + 1);
};

const goToCreate = () => router.push('/configuracion/items-inspeccion/crear');
const goToEdit = (uuid) => uuid && router.push(`/configuracion/items-inspeccion/editar/${uuid}`);
const refreshTable = () => store.fetchItems();

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

onMounted(async () => {
    try {
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
.badge-subtle {
    font-weight: 500;
    white-space: nowrap;
}
.badge-subtle-info {
    background: rgba(13, 110, 253, .1);
    color: #0d6efd;
    border: 1px solid rgba(13, 110, 253, .2);
}
.text-break {
    word-break: break-word;
    overflow-wrap: break-word;
    white-space: normal;
    display: inline-block;
    max-width: 100%;
}
.fade-in-up {
    animation: fadeInUp 0.4s ease-out forwards;
}
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
}
:focus-visible {
    outline: 2px solid #0d6efd !important;
    outline-offset: 2px !important;
}
</style>
