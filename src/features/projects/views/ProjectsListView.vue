<template>
    <BasePageHeader title="Proyectos" subtitle="Gestiona los proyectos y los conductores con sus vehículos asignados"
        icon="fad fa-briefcase text-primary" :show-refresh="true" :show-create="true" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true" :canCreate="can('projects.create')"
        :breadcrumbs="[{ label: 'Operación' }, { label: 'Proyectos' }]" @refresh="refreshTable" @create="goToCreate" />

    <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar">
            <div class="d-flex align-items-center gap-2 flex-grow-1" style="max-width: 32rem;">
                <div class="noa-search flex-grow-1">
                    <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                    <input id="f-projects-busqueda" v-model="searchQuery" class="noa-search__input" type="search" placeholder="Buscar por nombre del proyecto..."
                        aria-label="Buscar proyecto" @input="debouncedSearch" />
                    <button v-if="searchQuery" class="noa-search__clear" type="button" title="Limpiar búsqueda"
                        aria-label="Limpiar búsqueda" @click="clearSearch">
                        <i class="fal fa-times" aria-hidden="true" />
                    </button>
                </div>
                <span v-if="store.thirdPartyFilter" class="badge badge-subtle-info small d-inline-flex align-items-center gap-1">
                    <i class="fad fa-user" aria-hidden="true" /> Filtro por conductor
                </span>
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
                            <th v-for="w in ['55%', '25%', '20%']" :key="w" style="padding:12px 8px">
                                <div class="skeleton-text" :style="`height:16px;width:${w}`" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="n in store.pagination.itemsPerPage" :key="`sk-${n}`">
                            <td>
                                <div class="d-flex align-items-center gap-2">
                                    <div class="skeleton-icon" style="height:32px;width:32px;" />
                                    <div class="flex-grow-1">
                                        <div class="skeleton-text mb-1" style="height:18px;width:60%;" />
                                        <div class="skeleton-text" style="height:12px;width:80%;" />
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="skeleton-badge mx-auto" style="height:24px;width:60px;" />
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
                    :loading="store.loading" responsiveLayout="scroll"
                    tableStyle="min-width: 45rem" class="table table-sm mb-0 professional-table noa-table-fixed"
                    emptyMessage="No se encontraron registros"
                    :sortField="store.sortField" :sortOrder="store.sortOrder" @sort="handleSort">

                    <!-- Proyecto -->
                    <Column field="project_name" header="Proyecto" sortable style="width: 55%;">
                        <template #body="{ data }">
                            <div class="d-flex align-items-center gap-2">
                                <div class="avatar-placeholder bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                                    <i class="fad fa-briefcase" style="font-size: 15px;" aria-hidden="true" />
                                </div>
                                <div class="min-w-0">
                                    <span class="noa-cell-strong d-block text-truncate">
                                        {{ data.project_name || '—' }}
                                    </span>
                                    <span class="noa-cell-sub">
                                        <i v-if="data.has_purchase_order" class="fad fa-file-pdf me-1 text-danger" style="font-size: 10px;" aria-hidden="true" />
                                        <span v-if="data.purchase_order">{{ data.purchase_order }}</span>
                                        <span v-else-if="data.has_purchase_order">Orden de compra adjunta</span>
                                        <span v-else>Sin orden de compra</span>
                                    </span>
                                </div>
                            </div>
                        </template>
                    </Column>

                    <!-- Conductores con vehículo -->
                    <Column field="assignments_count" header="Conductores" sortable class="text-center" style="width: 25%;">
                        <template #body="{ data }">
                            <span class="badge rounded-pill badge-subtle-info">
                                <i class="fad fa-users me-1" style="font-size:10px;" aria-hidden="true" />
                                {{ data.assignments_count ?? 0 }} con vehículo
                            </span>
                        </template>
                    </Column>

                    <!-- Acciones -->
                    <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 20%;"
                        v-if="can('projects.index') || can('projects.update') || can('projects.delete')">
                        <template #body="{ data }">
                            <RowActions :actions="accionesDe(data)" :row-label="data.project_name || 'proyecto'" />
                        </template>
                    </Column>

                    <!-- Empty state -->
                    <template #empty>
                        <div class="text-center py-5">
                            <i class="fad fa-briefcase fs-1 text-muted opacity-50 mb-3 d-block" aria-hidden="true" />
                            <h6 class="text-muted mb-1 fw-medium">No hay proyectos registrados</h6>
                            <p class="text-muted small mb-3">
                                {{ store.thirdPartyFilter ? 'Este conductor no tiene proyectos asignados aún.' : 'Comienza creando tu primer proyecto.' }}
                            </p>
                            <button v-if="can('projects.create')" class="btn btn-primary btn-sm" type="button" @click="goToCreate">
                                <i class="fad fa-plus me-1" aria-hidden="true" />Nuevo proyecto
                            </button>
                        </div>
                    </template>

                    <!-- Loading state -->
                    <template #loading>
                        <NoaTableSpinner message="Cargando proyectos..." />
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
import { useServerSort } from '@/hooks/useServerSort.js';
import { useProjectsStore } from '../store/projects.store.js';
import { usePermissionsStore } from '@store';
import { useTable } from '@/hooks/useTable.js';
import { useTableActions } from '@/hooks/useTableActions.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import RowActions from '@/components/RowActions.vue';
import ListPagination from '@/components/ListPagination.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const route = useRoute();
const router = useRouter();
const store = useProjectsStore();
const permissionsStore = usePermissionsStore();
const { onSort: handleSort } = useServerSort((field, order) => store.setSort(field, order), { route, router });

// ─── Estado local ────────────────────────────────────────────────────────────
const isViewLoading = ref(true);
const searchQuery = ref('');

// ─── Hooks ───────────────────────────────────────────────────────────────────
const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(searchQuery.value));
const { confirmDelete, initTooltips, destroyTooltips } = useTableActions(store, router);

// ─── Utilidades ──────────────────────────────────────────────────────────────
const can = (action) => permissionsStore.can(action);

// ─── Búsqueda ─────────────────────────────────────────────────────────────────
const clearSearch = async () => {
    searchQuery.value = '';
    await store.clearFilters();
};

// ─── Paginación server-side ──────────────────────────────────────────────────
const onPageChange = async ({ page, first, rows }) => {
    store.pagination.itemsPerPage = rows;
    const targetPage = page !== undefined ? page : Math.floor(first / rows) + 1;
    await store.setPage(targetPage);
};

// ─── Navegación ──────────────────────────────────────────────────────────────
const goToCreate = () => router.push('/proyectos/crear');
const goToEdit = (uuid) => uuid && router.push(`/proyectos/editar/${uuid}`);
const goToDetail = (uuid) => uuid && router.push(`/proyectos/perfil/${uuid}`);
const refreshTable = () => store.fetchItems();

// ─── Eliminar ─────────────────────────────────────────────────────────────────
const handleDelete = (project) => confirmDelete(project, {
    nameField: 'project_name',
    title: '¿Eliminar proyecto?',
    html: `
        <p class="mb-2">¿Estás seguro de eliminar el proyecto <strong>"${project.project_name}"</strong>?</p>
        <div class="alert alert-warning small mb-0 mt-2">
            <i class="fad fa-exclamation-triangle me-1"></i>
            Esta acción eliminará también las asignaciones de conductores y vehículos.
        </div>`,
});

// ─── Acciones por fila ────────────────────────────────────────────────────────
const accionesDe = (data) => [
    { key: 'perfil', label: 'Ver detalle', icon: 'far fa-eye', tone: 'primary', inline: true, visible: can('projects.index'), onClick: () => goToDetail(data.uuid) },
    { key: 'editar', label: 'Editar', icon: 'far fa-pen', tone: 'warning', inline: true, visible: can('projects.update'), onClick: () => goToEdit(data.uuid) },
    { key: 'eliminar', label: 'Eliminar', icon: 'far fa-trash-alt', tone: 'danger', visible: can('projects.delete'), onClick: () => handleDelete(data) },
];

// ─── Ciclo de vida ────────────────────────────────────────────────────────────
onMounted(async () => {
    const sortParam = route.query.sort;
    const orderParam = route.query.order;
    if (typeof sortParam === 'string' && sortParam) {
        store.sortField = sortParam;
        store.sortOrder = orderParam === 'desc' ? -1 : 1;
    }
    try {
        searchQuery.value = store.search;
        store.thirdPartyFilter = route.query.third_party_uuid || '';
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

.avatar-placeholder {
    width: 36px;
    height: 36px;
    font-size: 14px;
    font-weight: 600;
    flex-shrink: 0;
    user-select: none;
}

.min-w-0 {
    min-width: 0;
}
</style>