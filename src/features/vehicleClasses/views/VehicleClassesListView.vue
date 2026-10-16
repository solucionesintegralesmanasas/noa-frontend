<template>
    <BasePageHeader title="Clases de Vehículos" subtitle="Gestiona las clases de vehículos registradas en el sistema"
        icon="fad fa-truck text-primary" :show-refresh="true" :show-create="true" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true" :canCreate="can('vehicle_classes.create')"
        :breadcrumbs="[{ label: 'Configuración' }, { label: 'Clases de Vehículos' }]" @refresh="refreshTable" @create="goToCreate" />

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
                            type="search" placeholder="Buscar por código o descripción..."
                            aria-label="Buscar clase de vehículo" @input="debouncedSearch" />
                        <button v-if="searchQuery" class="btn btn-outline-secondary border-start-0" type="button"
                            title="Limpiar búsqueda" @click="clearSearch">
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
                <div v-if="isViewLoading" class="card-body p-0">
                    <div class="table-responsive scrollbar">
                        <table class="table table-sm mb-0">
                            <thead>
                                <tr>
                                    <th v-for="w in ['30%', '50%', '20%']" :key="w" style="padding:12px 8px">
                                        <div class="skeleton-text" :style="`height:16px;width:${w}`" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="n in store.pagination.itemsPerPage" :key="`sk-${n}`">
                                    <td><div class="skeleton-text" style="height:18px;width:40%;" /></td>
                                    <td><div class="skeleton-text" style="height:18px;width:80%;" /></td>
                                    <td>
                                        <div class="d-flex justify-content-center gap-1">
                                            <div v-for="j in 2" :key="j" class="skeleton-icon" style="height:28px;width:28px;" />
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div v-else class="card-body p-0">
                    <div class="table-responsive scrollbar">
                        <DataTable :value="store.items" lazy :paginator="true" :rows="store.pagination.itemsPerPage"
                            :totalRecords="store.pagination.totalItems"
                            :first="(store.pagination.currentPage - 1) * store.pagination.itemsPerPage"
                            :loading="store.loading" :rowsPerPageOptions="[10, 25, 50, 100]" responsiveLayout="scroll"
                            tableStyle="min-width: 50rem" class="table table-sm mb-0 professional-table"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
                            emptyMessage="No se encontraron registros" @page="onPageChange">
                            <Column field="class_code_class" header="Código" sortable style="width: 160px;">
                                <template #body="{ data }">
                                    <span class="badge bg-primary bg-opacity-10 text-primary font-monospace" style="font-size:0.85rem;">
                                        {{ data.class_code_class || '—' }}
                                    </span>
                                </template>
                            </Column>
                            <Column field="description" header="Descripción" sortable>
                                <template #body="{ data }">
                                    <span class="text-dark" style="font-size:0.85rem;">
                                        {{ data.description || '—' }}
                                    </span>
                                </template>
                            </Column>
                            <Column header="Acciones" class="text-center" style="min-width:140px; width: 140px;" v-if="can('vehicle_classes.update') || can('vehicle_classes.delete')">
                                <template #body="{ data }">
                                    <div class="btn-group btn-group-sm" role="group">
                                        <button v-if="can('vehicle_classes.update')" class="btn btn-falcon-default" type="button"
                                            title="Editar" :aria-label="`Editar ${data.description}`" @click="goToEdit(data.uuid ?? data.id)">
                                            <i class="fad fa-edit text-warning" style="font-size:14px;" aria-hidden="true" />
                                        </button>
                                        <button v-if="can('vehicle_classes.delete')" class="btn btn-falcon-default"
                                            type="button" title="Eliminar" :aria-label="`Eliminar ${data.description}`" @click="handleDelete(data)">
                                            <i class="fad fa-trash text-danger" style="font-size:14px;" aria-hidden="true" />
                                        </button>
                                    </div>
                                </template>
                            </Column>
                            <template #empty>
                                <div class="text-center py-5">
                                    <i class="fad fa-truck fs-1 text-muted opacity-50 mb-3 d-block" aria-hidden="true" />
                                    <h6 class="text-muted mb-1 fw-medium">No hay clases de vehículos registradas</h6>
                                    <p class="text-muted small mb-3">Comienza agregando tu primera clase de vehículo</p>
                                    <button v-if="can('vehicle_classes.create')" class="btn btn-primary btn-sm" @click="goToCreate">
                                        <i class="fad fa-plus me-1" aria-hidden="true" />Agregar primera clase
                                    </button>
                                </div>
                            </template>
                            <template #loading>
                                <NoaTableSpinner message="Cargando clases de vehículos..." />
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
import { useVehicleClassesStore } from '../store/vehicleClasses.store.js';
import { usePermissionsStore } from '@store';
import { useTable } from '@/hooks/useTable.js';
import { useTableActions } from '@/hooks/useTableActions.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const router = useRouter();
const store = useVehicleClassesStore();
const permissionsStore = usePermissionsStore();

const isViewLoading = ref(true);
const searchQuery = ref('');

const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(searchQuery.value));
const { confirmDelete, initTooltips, destroyTooltips } = useTableActions(store, router);

const can = (action, subject) => permissionsStore.can(action, subject);

const clearSearch = async () => {
    searchQuery.value = '';
    await store.clearFilters();
};

const onPageChange = async ({ first, rows }) => {
    await store.setPage(Math.floor(first / rows) + 1);
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
:root {
    --table-header-bg: #f8f9fa;
    --table-hover-bg: #f8f9fa;
    --table-border: #e9ecef;
    --transition-fast: 150ms ease-in-out;
}

@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
}

.fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }

.card { border-radius: 0.75rem !important; transition: box-shadow var(--transition-fast); }
.card:hover { box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, .15) !important; }

:deep(.professional-table .p-datatable-thead > tr > th) {
    padding: 0.625rem 0.75rem !important;
    font-size: 0.75rem !important;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #495057;
    border-bottom: 2px solid var(--table-border) !important;
    background: var(--table-header-bg);
}

:deep(.professional-table .p-datatable-tbody > tr > td) {
    padding: 0.625rem 0.75rem !important;
    vertical-align: middle;
    border-bottom: 1px solid var(--table-border);
    font-size: 0.825rem !important;
    color: #212529;
    transition: background-color var(--transition-fast);
}

:deep(.professional-table .p-datatable-tbody > tr:hover) { background: var(--table-hover-bg) !important; }
:deep(.professional-table .p-datatable-tbody > tr:last-child > td) { border-bottom: none; }

:deep(.btn-group .btn) { padding: 0.3rem 0.5rem; transition: all var(--transition-fast); }
:deep(.btn-group .btn:hover) { transform: translateY(-1px); box-shadow: 0 2px 6px rgba(0, 0, 0, .12); z-index: 1; }
:deep(.btn-group .btn + .btn) { margin-left: -1px; }

:deep(.p-paginator) {
    padding: 0.5rem 1rem !important;
    background: var(--table-header-bg) !important;
    border-top: 1px solid var(--table-border) !important;
    border-radius: 0 0 0.75rem 0.75rem !important;
}

.input-group:focus-within { box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, .15); border-radius: 0.25rem; }
.input-group .form-control:focus { box-shadow: none; }
.font-monospace { font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
.bg-opacity-10 { --bs-bg-opacity: 0.1; }

.scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.scrollbar::-webkit-scrollbar-track { background: #f1f3f5; border-radius: 3px; }
.scrollbar::-webkit-scrollbar-thumb { background: #adb5bd; border-radius: 3px; }
.scrollbar::-webkit-scrollbar-thumb:hover { background: #6c757d; }

:focus-visible { outline: 2px solid #0d6efd !important; outline-offset: 2px !important; }

@media (max-width: 992px) {
    :deep(.professional-table .p-datatable-thead > tr > th),
    :deep(.professional-table .p-datatable-tbody > tr > td) {
        padding: 0.75rem 0.5rem !important;
        font-size: 0.85rem !important;
    }
}
</style>
