<template>
    <BasePageHeader :title="'Listado de Información Tributaria'"
        description="Gestión de información tributaria y fiscal de las empresas."
        icon="fad fa-file-invoice-dollar text-primary" :show-refresh="true" :show-create="true" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true"
        :breadcrumbs="[{ label: 'Información Tributaria' }, { label: 'Listado' }]" @refresh="refreshTable"
        @create="goToCreate" />

    <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar">
            <div class="noa-search">
                <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                <input id="f-tax-info-busqueda" v-model="searchQuery" class="noa-search__input" type="search"
                    placeholder="Buscar por empresa, régimen, tamaño..."
                    aria-label="Buscar información tributaria" @input="debouncedSearch" />
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
                            <th v-for="w in ['28%', '18%', '22%', '12%', '10%', '10%']" :key="w" style="padding:12px 8px">
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
                                    <div class="skeleton-icon" style="height:28px;width:28px;" />
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

                    <!-- Empresa -->
                    <Column field="company_uuid" header="Empresa" sortable style="width: 28%;">
                        <template #body="{ data }">
                            <span class="noa-cell-strong">
                                {{ data.company?.business_name || data.company?.name || '—' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Agente Retención -->
                    <Column field="is_withholding_agent_exempt" header="Agente Retención" sortable
                        class="text-center" header-class="text-center" style="width: 18%;">
                        <template #body="{ data }">
                            <span class="noa-status" :class="data.is_withholding_agent_exempt ? 'noa-status--success' : 'noa-status--warning'">
                                {{ data.is_withholding_agent_exempt ? "Exento" : "Agente" }}
                            </span>
                        </template>
                    </Column>

                    <!-- Régimen Especial -->
                    <Column field="tax_special_regime" header="Régimen Especial" sortable style="width: 22%;">
                        <template #body="{ data }">
                            <span class="text-muted small">
                                {{ data.tax_special_regime || '—' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Tamaño -->
                    <Column field="company_size" header="Tamaño" sortable class="text-center" header-class="text-center" style="width: 12%;">
                        <template #body="{ data }">
                            <span v-if="data.company_size" class="badge bg-info bg-opacity-10 text-info fw-semibold">
                                {{ capitalizeSize(data.company_size) }}
                            </span>
                            <span v-else class="text-muted">—</span>
                        </template>
                    </Column>

                    <!-- Estados Financieros -->
                    <Column field="financial_statements_path" header="Estados Fin." class="text-center" header-class="text-center" style="width: 10%;">
                        <template #body="{ data }">
                            <a v-if="data.financial_statements_path" :href="data.financial_statements_path"
                                target="_blank" rel="noopener noreferrer" class="btn btn-falcon-default btn-sm" title="Ver archivo"
                                aria-label="Ver archivo de estados financieros">
                                <i class="fad fa-file-pdf text-danger" style="font-size:14px;" aria-hidden="true" />
                            </a>
                            <span v-else class="text-muted small">—</span>
                        </template>
                    </Column>

                    <!-- Acciones -->
                    <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 10%;"
                        v-if="can('tax_information.update') || can('tax_information.delete')">
                        <template #body="{ data }">
                            <RowActions :actions="accionesDe(data)" :row-label="data.company?.business_name || 'información tributaria'" />
                        </template>
                    </Column>

                    <template #empty>
                        <div class="text-center py-5">
                            <i class="fad fa-file-invoice-dollar fs-1 text-muted opacity-50 mb-3 d-block" aria-hidden="true" />
                            <h6 class="text-muted mb-1 fw-medium">No hay información tributaria registrada</h6>
                            <p class="text-muted small mb-3">Comienza agregando la información tributaria de una empresa.</p>
                            <button v-if="can('tax_information.create')" class="btn btn-primary btn-sm" type="button" @click="goToCreate">
                                <i class="fad fa-plus me-1" aria-hidden="true" />Nueva información tributaria
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
import { useTaxInformationStore } from '../store/taxInformation.store.js';
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
const store = useTaxInformationStore();
const permissionsStore = usePermissionsStore();
const { sortField, sortOrdenPrimeVue, onSort, restore } = useServerSort({
    onChange: ({ field, order }) => store.setSort(field, order),
});

const isViewLoading = ref(true);
const searchQuery = ref('');

const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(searchQuery.value));
const { confirmDelete, initTooltips, destroyTooltips } = useTableActions(store, router);

const can = (action) => permissionsStore.can(action);

const capitalizeSize = (size) => {
    const map = {
        micro: 'Microempresa',
        pequena: 'Pequeña',
        mediana: 'Mediana',
        grande: 'Grande',
    };
    return map[size] || size.charAt(0).toUpperCase() + size.slice(1);
};

const clearSearch = async () => { searchQuery.value = ''; await store.clearFilters(); };
const refreshTable = () => store.fetchItems();

const onPageChange = async ({ page, first, rows }) => {
    store.pagination.itemsPerPage = rows;
    const targetPage = page !== undefined ? page : Math.floor(first / rows) + 1;
    await store.setPage(targetPage);
};

const goToCreate = () => router.push('/empresas/informacion-tributaria/crear');
const goToEdit = (uuid) => router.push(`/empresas/informacion-tributaria/editar/${uuid}`);

const handleDelete = (item) => confirmDelete(item, {
    title: '¿Eliminar información tributaria?',
    nameField: 'company.business_name',
});

const accionesDe = (data) => [
    {
        key: 'editar',
        label: 'Editar',
        icon: 'far fa-pen',
        tone: 'warning',
        inline: true,
        visible: can('tax_information.update'),
        onClick: () => goToEdit(data.uuid),
    },
    {
        key: 'eliminar',
        label: 'Eliminar',
        icon: 'far fa-trash-alt',
        tone: 'danger',
        visible: can('tax_information.delete'),
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