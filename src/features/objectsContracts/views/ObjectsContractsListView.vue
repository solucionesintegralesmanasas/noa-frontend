<template>
    <BasePageHeader title="Objetos de Contrato" subtitle="Gestiona los objetos de contrato registrados en el sistema"
        icon="fad fa-file-contract text-primary" :show-refresh="true" :show-create="true" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true" :canCreate="can('objects_contracts.create')"
        :breadcrumbs="[{ label: 'Configuración' }, { label: 'Objetos de Contrato' }]" @refresh="refreshTable" @create="goToCreate" />

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
                            type="search" placeholder="Buscar por nombre o descripción..."
                            aria-label="Buscar objeto de contrato" @input="debouncedSearch" />
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
                            emptyMessage="No se encontraron registros" @page="onPageChange"
                            :sortField="store.sortField" :sortOrder="store.sortOrder" @sort="handleSort">
                            <Column field="name" header="Nombre" sortable>
                                <template #body="{ data }">
                                    <div class="d-flex align-items-center gap-2">
                                        <div
                                            class="avatar-placeholder bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                                            {{ getInitials(data.name) }}
                                        </div>
                                        <span class="text-dark d-block fw-medium" style="font-size:0.875rem;">
                                            {{ data.name || '—' }}
                                        </span>
                                    </div>
                                </template>
                            </Column>
                            <Column field="description" header="Descripción">
                                <template #body="{ data }">
                                    <span class="text-dark" style="font-size:0.85rem;">
                                        {{ data.description || '—' }}
                                    </span>
                                </template>
                            </Column>
                            <Column v-if="can('objects_contracts.index') || can('objects_contracts.update') || can('objects_contracts.delete')" header="Acciones" class="text-center" style="min-width:140px; width: 140px;">
                                <template #body="{ data }">
                                    <div class="btn-group btn-group-sm" role="group">
                                        <button class="btn btn-falcon-default" type="button"
                                            title="Editar" :aria-label="`Editar ${data.name}`" @click="goToEdit(data.uuid ?? data.id)">
                                            <i class="fad fa-edit text-warning" style="font-size:14px;" aria-hidden="true" />
                                        </button>
                                        <button class="btn btn-falcon-default"
                                            type="button" title="Eliminar" :aria-label="`Eliminar ${data.name}`" @click="handleDelete(data)">
                                            <i class="fad fa-trash text-danger" style="font-size:14px;" aria-hidden="true" />
                                        </button>
                                    </div>
                                </template>
                            </Column>
                            <template #empty>
                                <div class="text-center py-5">
                                    <i class="fad fa-file-contract fs-1 text-muted opacity-50 mb-3 d-block" aria-hidden="true" />
                                    <h6 class="text-muted mb-1 fw-medium">No hay objetos de contrato registrados</h6>
                                    <p class="text-muted small mb-3">Comienza agregando tu primer objeto de contrato</p>
                                    <button v-if="can('objects_contracts.create')" class="btn btn-primary btn-sm"
                                        @click="goToCreate">
                                        <i class="fad fa-plus me-1" aria-hidden="true" />Agregar primer objeto
                                    </button>
                                </div>
                            </template>
                            <template #loading>
                                <NoaTableSpinner message="Cargando objetos de contrato..." />
                            </template>
                            <template #footer>
                                <div
                                    class="d-flex flex-wrap justify-content-between align-items-center gap-2 py-2 px-3 bg-light rounded-bottom">
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
import { useRoute, useRouter } from 'vue-router';
import { useObjectsContractsStore } from '../store/objectsContracts.store.js';
import { usePermissionsStore } from '@store';
import { useTable } from '@/hooks/useTable.js';
import { useTableActions } from '@/hooks/useTableActions.js';
import { useServerSort } from '@/hooks/useServerSort.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const route = useRoute();
const router = useRouter();
const store = useObjectsContractsStore();
const permissionsStore = usePermissionsStore();

const isViewLoading = ref(true);
const searchQuery = ref('');

const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(searchQuery.value));
const { confirmDelete, initTooltips, destroyTooltips } = useTableActions(store, router);
const { onSort: handleSort } = useServerSort((field, order) => store.setSort(field, order), { route, router });

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

const onPageChange = async ({ first, rows }) => {
    await store.setPage(Math.floor(first / rows) + 1);
};

const goToCreate = () => router.push('/configuracion/objetos-contrato/crear');
const goToEdit = (id) => id && router.push(`/configuracion/objetos-contrato/editar/${id}`);
const refreshTable = () => store.fetchItems();

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

onMounted(async () => {
    try {
        const sortParam = route.query.sort;
        const orderParam = route.query.order;
        if (typeof sortParam === 'string' && sortParam) {
            store.sortField = sortParam;
            store.sortOrder = orderParam === 'desc' ? -1 : 1;
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
