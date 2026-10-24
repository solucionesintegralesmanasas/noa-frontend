<template>
    <BasePageHeader :title="'Listado de Declaraciones de renta'"
        description="Gestión de declaraciones de renta y complementarios anuales."
        icon="fad fa-clipboard-list text-primary" :show-refresh="true" :show-create="true" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true"
        :breadcrumbs="[{ label: 'Declaraciones de renta' }, { label: 'Listado' }]" @refresh="refreshTable"
        @create="goToCreate" />

    <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar">
            <div class="noa-search">
                <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                <input id="f-tax-declarations-busqueda" v-model="searchQuery" class="noa-search__input" type="search" placeholder="Buscar declaración..."
                    aria-label="Buscar declaración tributaria" @input="debouncedSearch" />
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
                            <th v-for="w in ['14%', '26%', '18%', '18%', '12%', '12%']" :key="w" style="padding:12px 8px">
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

                    <Column field="fiscal_year" header="Año Gravable" sortable style="width: 14%;">
                        <template #body="{ data }">
                            <span class="noa-cell-strong">{{ data.fiscal_year || '—' }}</span>
                        </template>
                    </Column>

                    <Column field="company_uuid" header="Empresa" sortable style="width: 26%;">
                        <template #body="{ data }">
                            <span class="text-dark">{{ data.company?.business_name || '—' }}</span>
                        </template>
                    </Column>

                    <Column field="gross_assets" header="Patrimonio Bruto" sortable style="width: 18%;">
                        <template #body="{ data }">
                            <span class="text-dark">
                                {{ data.gross_assets?.amount ? new Intl.NumberFormat('es-CO', {
                                    style: 'currency',
                                    currency: data.gross_assets.currency || 'COP',
                                    minimumFractionDigits: 0
                                }).format(data.gross_assets.amount) : '—' }}
                            </span>
                        </template>
                    </Column>

                    <Column field="net_assets" header="Patrimonio Líquido" sortable style="width: 18%;">
                        <template #body="{ data }">
                            <span class="text-dark">
                                {{ data.net_assets?.amount ? new Intl.NumberFormat('es-CO', {
                                    style: 'currency',
                                    currency: data.net_assets.currency || 'COP',
                                    minimumFractionDigits: 0
                                }).format(data.net_assets.amount) : '—' }}
                            </span>
                        </template>
                    </Column>

                    <Column field="status" header="Estado" sortable class="text-center" header-class="text-center" style="width: 12%;">
                        <template #body="{ data }">
                            <span class="noa-status" :class="statusModifier(data.status)">
                                {{ data.status || '—' }}
                            </span>
                        </template>
                    </Column>

                    <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 12%;"
                        v-if="can('tax_declarations.profile') || can('tax_declarations.update') || can('tax_declarations.delete')">
                        <template #body="{ data }">
                            <RowActions :actions="accionesDe(data)" :row-label="`declaración ${data.fiscal_year || ''}`" />
                        </template>
                    </Column>

                    <template #empty>
                        <div class="text-center py-5">
                            <i class="fad fa-clipboard-list fs-1 text-muted opacity-50 mb-3 d-block" aria-hidden="true" />
                            <h6 class="text-muted mb-1 fw-medium">No hay declaraciones registradas</h6>
                            <p class="text-muted small mb-3">Comienza creando tu primera declaración de renta anual.</p>
                            <button v-if="can('tax_declarations.create')" class="btn btn-primary btn-sm" type="button" @click="goToCreate">
                                <i class="fad fa-plus me-1" aria-hidden="true" />Nueva declaración
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
import { useTaxDeclarationsStore } from '../store/taxDeclarations.store.js';
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
const store = useTaxDeclarationsStore();
const permissionsStore = usePermissionsStore();
const { sortField, sortOrdenPrimeVue, onSort, restore } = useServerSort({
    onChange: ({ field, order }) => store.setSort(field, order),
});

const isViewLoading = ref(true);
const searchQuery = ref('');

const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(searchQuery.value));
const { confirmDelete, initTooltips, destroyTooltips } = useTableActions(store, router);

const can = (action) => permissionsStore.can(action);

const statusModifier = (status) => {
    const s = String(status || '').toUpperCase();
    if (['PRESENTADA', 'PRESENTADO'].includes(s)) return 'noa-status--success';
    if (s === 'BORRADOR') return 'noa-status--muted';
    return 'noa-status--warning';
};

const clearSearch = async () => { searchQuery.value = ''; await store.clearFilters(); };
const refreshTable = () => store.fetchItems();

const onPageChange = async ({ page, first, rows }) => {
    store.pagination.itemsPerPage = rows;
    const targetPage = page !== undefined ? page : Math.floor(first / rows) + 1;
    await store.setPage(targetPage);
};

const goToCreate = () => router.push('/empresas/declaraciones-de-renta/crear');
const goToEdit = (uuid) => router.push(`/empresas/declaraciones-de-renta/editar/${uuid}`);
const goToDetail = (uuid) => router.push(`/empresas/declaraciones-de-renta/perfil/${uuid}`);

const handleDelete = (item) => confirmDelete(item, {
    title: '¿Eliminar declaración de renta?',
    nameField: 'fiscal_year',
});

const accionesDe = (data) => [
    {
        key: 'ver',
        label: 'Ver detalle',
        icon: 'far fa-eye',
        tone: 'primary',
        inline: true,
        visible: can('tax_declarations.profile'),
        onClick: () => goToDetail(data.uuid),
    },
    {
        key: 'editar',
        label: 'Editar',
        icon: 'far fa-pen',
        tone: 'warning',
        inline: true,
        visible: can('tax_declarations.update'),
        onClick: () => goToEdit(data.uuid),
    },
    {
        key: 'eliminar',
        label: 'Eliminar',
        icon: 'far fa-trash-alt',
        tone: 'danger',
        visible: can('tax_declarations.delete'),
        onClick: () => handleDelete(data),
    },
];

onMounted(async () => {
    const sortParam = route.query.sort;
    const orderParam = route.query.order;
    if (typeof sortParam === 'string' && sortParam) {
        restore(sortParam, orderParam);
        store.sortField = sortParam;
        store.sortOrder = orderParam === 'desc' ? 'desc' : 'asc';
    }
    try {
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
</style>