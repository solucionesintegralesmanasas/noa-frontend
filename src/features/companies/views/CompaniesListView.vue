<template>
    <BasePageHeader title="Empresas" subtitle="Gestiona las empresas registradas en el sistema"
        icon="fad fa-building text-primary" :show-refresh="true" :show-create="true" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true" :canCreate="can('companies.create')"
        :breadcrumbs="[{ label: 'Empresa' }, { label: 'Empresas' }]" @refresh="refreshTable" @create="goToCreate" />

    <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar">
            <div class="noa-search">
                <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                <input id="f-companies-busqueda" v-model="searchQuery" class="noa-search__input"
                    type="search" placeholder="Buscar por razón social, NIT o correo..."
                    aria-label="Buscar empresa" @input="debouncedSearch" />
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
                            <th v-for="w in ['26%', '16%', '16%', '18%', '11%', '13%']" :key="w"
                                style="padding:12px 8px">
                                <div class="skeleton-text" :style="`height:16px;width:${w}`" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="n in store.pagination.itemsPerPage" :key="`sk-${n}`">
                            <td>
                                <div class="d-flex align-items-center gap-2">
                                    <div class="skeleton-icon" style="height:32px;width:32px;" />
                                    <div class="skeleton-text" style="height:18px;width:80%;" />
                                </div>
                            </td>
                            <td v-for="i in 3" :key="i">
                                <div class="skeleton-text" style="height:18px;width:75%;" />
                            </td>
                            <td>
                                <div class="skeleton-badge mx-auto" style="height:20px;width:60px;" />
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
                    tableStyle="min-width: 50rem" class="table table-sm mb-0 professional-table noa-table-fixed"
                    emptyMessage="No hay empresas registradas"
                    :sortField="sortField" :sortOrder="sortOrdenPrimeVue" removableSort @sort="onSort">

                    <!-- Razón social -->
                    <Column field="business_name" header="Razón social" sortable style="width: 26%;">
                        <template #body="{ data }">
                            <div class="d-flex align-items-center gap-2">
                                <div
                                    class="avatar-placeholder bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                                    {{ getInitials(data.business_name) }}
                                </div>
                                <div class="text-truncate">
                                    <span class="noa-cell-strong d-block text-truncate">
                                        {{ data.business_name || '—' }}
                                    </span>
                                </div>
                            </div>
                        </template>
                    </Column>

                    <!-- NIT -->
                    <Column field="document_number" header="NIT" sortable style="width: 16%;">
                        <template #body="{ data }">
                            <span class="font-monospace text-dark" style="font-size:0.8rem;">
                                {{ data.document_number || '—' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Teléfono -->
                    <Column field="phone" header="Teléfono" style="width: 16%;">
                        <template #body="{ data }">
                            <div class="d-flex align-items-center gap-1">
                                <i class="fad fa-phone text-muted" style="font-size:13px;" aria-hidden="true" />
                                <span style="font-size:0.8rem;">{{ data.phone || '—' }}</span>
                            </div>
                        </template>
                    </Column>

                    <!-- Correo -->
                    <Column field="email" header="Correo electrónico" style="width: 18%;">
                        <template #body="{ data }">
                            <span :title="data.email" class="text-truncate d-block" style="font-size:0.8rem;">
                                {{ data.email || '—' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Estado -->
                    <Column field="is_active" header="Estado" sortable class="text-center" header-class="text-center" style="width: 11%;">
                        <template #body="{ data }">
                            <span class="noa-status" :class="data.is_active ? 'noa-status--success' : 'noa-status--muted'">
                                {{ data.is_active ? 'Activo' : 'Inactivo' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Acciones -->
                    <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 13%;"
                        v-if="can('companies.profile') || can('companies.update') || can('companies.delete')">
                        <template #body="{ data }">
                            <RowActions :actions="accionesDe(data)" :row-label="data.business_name || 'empresa'" />
                        </template>
                    </Column>

                    <!-- Empty state -->
                    <template #empty>
                        <div class="text-center py-5">
                            <i class="fad fa-building-user fs-1 text-muted opacity-50 mb-3 d-block" aria-hidden="true" />
                            <h6 class="text-muted mb-1 fw-medium">No hay empresas registradas</h6>
                            <p class="text-muted small mb-3">Comienza agregando tu primera empresa</p>
                            <button v-if="can('companies.create')" class="btn btn-primary btn-sm" type="button"
                                @click="goToCreate">
                                <i class="fad fa-plus me-1" aria-hidden="true" />Agregar primera empresa
                            </button>
                        </div>
                    </template>

                    <!-- Loading state -->
                    <template #loading>
                        <NoaTableSpinner message="Cargando empresas..." />
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
 * @author Darwin Montes
 * @version 1.0.0
 * @created_at 2026-06-14
 * @module {Features.Companies}
 * @resource {Company}
 */
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCompaniesStore } from '../store/companies.store.js';
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
const store = useCompaniesStore();
const permissionsStore = usePermissionsStore();

// ─── Estado local ────────────────────────────────────────────────────────────
const isViewLoading = ref(true);
const searchQuery = ref('');

// ─── Hooks ───────────────────────────────────────────────────────────────────
const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(searchQuery.value));
const { confirmDelete, initTooltips, destroyTooltips } = useTableActions(store, router);
const { sortField, sortOrdenPrimeVue, onSort, restore } = useServerSort({
    onChange: ({ field, order }) => store.setSort(field, order),
    route,
    router,
});

// ─── Utilidades ──────────────────────────────────────────────────────────────
const can = (action, subject) => permissionsStore.can(action, subject);
const getInitials = (text) => {
    if (!text) return '?';
    const words = String(text).trim().split(/\s+/);
    return words.length === 1
        ? words[0][0].toUpperCase()
        : (words[0][0] + words[1][0]).toUpperCase();
};

// ─── Búsqueda ─────────────────────────────────────────────────────────────────
const clearSearch = async () => {
    searchQuery.value = '';
    await store.clearFilters();
};

// ─── Paginación server-side ───────────────────────────────────────────────────
const onPageChange = async ({ page, first, rows }) => {
    store.pagination.itemsPerPage = rows;
    const targetPage = page !== undefined ? page : Math.floor(first / rows) + 1;
    await store.setPage(targetPage);
};

// ─── Navegación ──────────────────────────────────────────────────────────────
const goToCreate = () => router.push('/empresa/crear');
const goToEdit = (uuid) => uuid && router.push(`/empresa/editar/${uuid}`);
const goToDetail = (uuid) => uuid && router.push(`/empresa/perfil/${uuid}`);
const refreshTable = () => store.fetchItems();

// ─── Eliminar ─────────────────────────────────────────────────────────────────
const handleDelete = (company) => confirmDelete(company, {
    title: '¿Eliminar empresa?',
    nameField: 'business_name',
    html: `
        <p class="mb-2">¿Estás seguro de eliminar <strong>"${company.business_name}"</strong>?</p>
        <div class="alert alert-warning small mb-0 mt-2">
            <i class="fad fa-exclamation-triangle me-1" aria-hidden="true"></i>
            Esta acción no se puede deshacer y eliminará todas las sucursales asociadas.
        </div>`,
});

const accionesDe = (data) => [
    {
        key: 'ver',
        label: 'Visualizar',
        icon: 'far fa-eye',
        tone: 'primary',
        inline: true,
        visible: can('companies.profile'),
        onClick: () => goToDetail(data.uuid),
    },
    {
        key: 'editar',
        label: 'Editar',
        icon: 'far fa-pen',
        tone: 'warning',
        inline: true,
        visible: can('companies.update'),
        onClick: () => goToEdit(data.uuid),
    },
    {
        key: 'eliminar',
        label: 'Eliminar',
        icon: 'far fa-trash-alt',
        tone: 'danger',
        visible: can('companies.delete'),
        onClick: () => handleDelete(data),
    },
];

// ─── Ciclo de vida ────────────────────────────────────────────────────────────
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
.avatar-placeholder {
    width: 32px;
    height: 32px;
    font-size: 0.8rem;
    font-weight: 600;
}
.skeleton-text, .skeleton-badge, .skeleton-icon { background: #e9ecef; border-radius: 4px; animation: pulse 1.2s infinite; }
.skeleton-badge { border-radius: 999px; }
.skeleton-icon { border-radius: .25rem; }
.scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.scrollbar::-webkit-scrollbar-track { background: #f1f3f5; border-radius: 3px; }
.scrollbar::-webkit-scrollbar-thumb { background: #adb5bd; border-radius: 3px; }

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
</style>