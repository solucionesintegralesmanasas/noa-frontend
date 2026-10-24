<template>
    <BasePageHeader :title="'Listado de Datos Bancarios'"
        description="Gestión de información bancaria corporativa." icon="fad fa-university text-primary"
        :show-refresh="true" :show-create="true" :show-bg="true" :loading="isViewLoading || store.loading"
        :compact="true" :breadcrumbs="[{ label: 'Datos Bancarios' }, { label: 'Listado' }]" @refresh="refreshTable"
        @create="goToCreate" />

    <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar">
            <div class="noa-search">
                <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                <input id="f-bank-details-busqueda" v-model="searchQuery" class="noa-search__input" type="search"
                    placeholder="Buscar por banco, cuenta o titular..."
                    aria-label="Buscar cuenta bancaria" @input="debouncedSearch" />
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
                            <th v-for="w in ['22%', '20%', '16%', '20%', '10%', '12%']" :key="w" style="padding:12px 8px">
                                <div class="skeleton-text" :style="`height:16px;width:${w}`" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="n in store.pagination.itemsPerPage" :key="`sk-${n}`">
                            <td v-for="i in 5" :key="i">
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

                    <!-- Banco -->
                    <Column field="bank_name" header="Banco" sortable style="width: 22%;">
                        <template #body="{ data }">
                            <span class="noa-cell-strong">
                                {{ data.bank_name || '—' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Número de Cuenta -->
                    <Column field="account_number" header="Número de Cuenta" sortable style="width: 20%;">
                        <template #body="{ data }">
                            <span class="font-monospace text-primary fw-medium">{{ data.account_number || '—' }}</span>
                        </template>
                    </Column>

                    <!-- Tipo -->
                    <Column field="account_type" header="Tipo" sortable style="width: 16%;">
                        <template #body="{ data }">
                            <span class="text-dark">
                                {{ data.account_type ? capitalize(data.account_type) : '—' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Titular -->
                    <Column field="account_holder" header="Titular" sortable style="width: 20%;">
                        <template #body="{ data }">
                            <span class="text-muted small">
                                {{ data.account_holder || '—' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Estado -->
                    <Column field="is_active" header="Estado" sortable class="text-center" header-class="text-center" style="width: 10%;">
                        <template #body="{ data }">
                            <span class="noa-status" :class="data.is_active ? 'noa-status--success' : 'noa-status--muted'">
                                {{ data.is_active ? 'Activo' : 'Inactivo' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Acciones -->
                    <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 12%;"
                        v-if="can('bank_details.profile') || can('bank_details.update') || can('bank_details.delete')">
                        <template #body="{ data }">
                            <RowActions :actions="accionesDe(data)" :row-label="data.bank_name || 'cuenta bancaria'" />
                        </template>
                    </Column>

                    <template #empty>
                        <div class="text-center py-5">
                            <i class="fad fa-university fs-1 text-muted opacity-50 mb-3 d-block" aria-hidden="true" />
                            <h6 class="text-muted mb-1 fw-medium">No hay datos bancarios registrados</h6>
                            <p class="text-muted small mb-3">Comienza creando tu primera cuenta bancaria corporativa.</p>
                            <button v-if="can('bank_details.create')" class="btn btn-primary btn-sm" type="button" @click="goToCreate">
                                <i class="fad fa-plus me-1" aria-hidden="true" />Nueva cuenta bancaria
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
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBankDetailsStore } from '../store/bankDetails.store.js';
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
const store = useBankDetailsStore();
const permissionsStore = usePermissionsStore();
const { sortField, sortOrdenPrimeVue, onSort, restore } = useServerSort({
    onChange: ({ field, order }) => store.setSort(field, order),
});

const isViewLoading = ref(true);
const searchQuery = ref('');

const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(searchQuery.value));
const { confirmDelete, initTooltips, destroyTooltips } = useTableActions(store, router);

const can = (action) => permissionsStore.can(action);

const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

const clearSearch = async () => { searchQuery.value = ''; await store.clearFilters(); };
const refreshTable = () => store.fetchItems();

const onPageChange = async ({ page, first, rows }) => {
    store.pagination.itemsPerPage = rows;
    const targetPage = page !== undefined ? page : Math.floor(first / rows) + 1;
    await store.setPage(targetPage);
};

const goToCreate = () => router.push('/empresas/datos-bancarios/crear');
const goToEdit = (uuid) => router.push(`/empresas/datos-bancarios/editar/${uuid}`);
const goToDetail = (uuid) => router.push(`/empresas/datos-bancarios/perfil/${uuid}`);

const handleDelete = (item) => confirmDelete(item, {
    title: '¿Eliminar cuenta bancaria?',
    nameField: 'account_number',
});

const accionesDe = (data) => [
    {
        key: 'ver',
        label: 'Ver detalle',
        icon: 'far fa-eye',
        tone: 'primary',
        inline: true,
        visible: can('bank_details.profile'),
        onClick: () => goToDetail(data.uuid),
    },
    {
        key: 'editar',
        label: 'Editar',
        icon: 'far fa-pen',
        tone: 'warning',
        inline: true,
        visible: can('bank_details.update'),
        onClick: () => goToEdit(data.uuid),
    },
    {
        key: 'eliminar',
        label: 'Eliminar',
        icon: 'far fa-trash-alt',
        tone: 'danger',
        visible: can('bank_details.delete'),
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