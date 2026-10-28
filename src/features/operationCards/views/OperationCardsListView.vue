<template>
    <BasePageHeader :title="'Listado de Tarjetas de Operación'" description="Gestión de tarjetas de operación."
        icon="fad fa-clipboard-list text-primary" :show-refresh="true" :show-create="can('operation_cards.create')"
        :show-bg="true" :loading="isViewLoading || store.loading" :compact="true"
        :breadcrumbs="[{ label: 'Tarjetas de Operación' }, { label: 'Listado' }]" @refresh="refreshTable"
        @create="goToCreate" />

    <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar">
            <div class="noa-search">
                <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                <input id="f-operation-cards-busqueda" v-model="searchQuery" class="noa-search__input" type="search" placeholder="Buscar por placa, número de tarjeta..."
                    aria-label="Buscar tarjeta de operación" @input="debouncedSearch" />
                <button v-if="searchQuery" class="noa-search__clear" type="button" title="Limpiar búsqueda"
                    aria-label="Limpiar búsqueda" @click="clearSearch">
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
                            <th v-for="w in ['16%', '18%', '18%', '16%', '12%', '10%', '10%']" :key="w"
                                style="padding:12px 8px">
                                <div class="skeleton-text" :style="`height:16px;width:${w}`" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="n in store.pagination.itemsPerPage" :key="`sk-${n}`">
                            <td v-for="i in 6" :key="i">
                                <div class="skeleton-text" style="height:18px;width:75%;" />
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
                    :totalRecords="store.pagination.totalItems" :first="(store.pagination.currentPage - 1) *
                        store.pagination.itemsPerPage
                        " :loading="store.loading" responsiveLayout="scroll"
                    tableStyle="min-width: 60rem" class="table table-sm mb-0 professional-table noa-table-fixed"
                    :sortField="sortField" :sortOrder="sortOrdenPrimeVue" removableSort
                    emptyMessage="No se encontraron registros" @sort="onSort">
                    <Column field="vehicle.vehicle_license_plate" header="Placa" sortable style="width: 13%;">
                        <template #body="{ data }">
                            <span class="noa-cell-strong">{{ data.vehicle?.vehicle_license_plate || '-' }}</span>
                        </template>
                    </Column>

                    <Column field="operating_card_number" header="Nº Tarjeta" sortable style="width: 17%;">
                        <template #body="{ data }">
                            <span class="text-dark">{{ data.operating_card_number || '-' }}</span>
                        </template>
                    </Column>

                    <Column field="service_type" header="Tipo Servicio" sortable style="width: 18%;">
                        <template #body="{ data }">
                            <span class="text-dark">{{ data.service_type || '-' }}</span>
                        </template>
                    </Column>

                    <Column field="transport_mode" header="Modo" sortable style="width: 16%;">
                        <template #body="{ data }">
                            <span class="text-dark">{{ data.transport_mode || '-' }}</span>
                        </template>
                    </Column>

                    <Column field="expiration_date" header="Expiración" sortable style="width: 13%;">
                        <template #body="{ data }">
                            <span class="text-dark">{{ data.expiration_date ? String(data.expiration_date).split(' ')[0] : '-' }}</span>
                        </template>
                    </Column>

                    <Column field="status" header="Estado" sortable style="width: 11%;">
                        <template #body="{ data }">
                            <span class="noa-status" :class="data.status ? 'noa-status--success' : 'noa-status--muted'">
                                {{ data.status ? "Activo" : "Inactivo" }}
                            </span>
                        </template>
                    </Column>

                    <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 12%;">
                        <template #body="{ data }">
                            <RowActions :actions="accionesDe(data)" :row-label="data.vehicle?.vehicle_license_plate || data.operating_card_number || 'tarjeta'" />
                        </template>
                    </Column>
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
import { useRouter, useRoute } from 'vue-router';
import { useOperationCardsStore } from '../store/operationCards.store.js';
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

const router = useRouter();
const route = useRoute();
const store = useOperationCardsStore();
const permissionsStore = usePermissionsStore();

const { sortField, sortOrdenPrimeVue, onSort, restore } = useServerSort({
    onChange: ({ field, order }) => store.setSort(field, order),
    route,
    router,
});

const isViewLoading = ref(true);
const searchQuery = ref('');

const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(searchQuery.value));
const { confirmDelete, initTooltips, destroyTooltips } = useTableActions(store, router);

const can = (action) => permissionsStore.can(action);

const clearSearch = async () => { searchQuery.value = ''; await store.clearFilters(); };
const refreshTable = () => store.fetchItems();
const onPageChange = async ({ first, rows }) => {
    await store.setPage(Math.floor(first / rows) + 1);
};

const goToCreate = () => router.push('/tarjetas-de-operacion/crear');
const goToEdit = (uuid) => router.push(`/tarjetas-de-operacion/editar/${uuid}`);

const handleDelete = (item) => confirmDelete(item, {
    title: '¿Eliminar tarjeta?',
    nameField: 'operating_card_number',
});

const accionesDe = (data) => [
    { key: 'editar', label: 'Editar', icon: 'far fa-pen', tone: 'warning', inline: true, visible: can('operation_cards.update'), onClick: () => goToEdit(data.uuid) },
    { key: 'eliminar', label: 'Eliminar', icon: 'far fa-trash-alt', tone: 'danger', visible: can('operation_cards.delete'), onClick: () => handleDelete(data) },
];

onMounted(async () => {
    try {
        const querySort = typeof route.query.sort === 'string' && route.query.sort ? route.query.sort : null;
        const queryOrder = route.query.order === 'desc' ? 'desc' : 'asc';
        if (querySort) {
            store.sortField = querySort;
            store.sortOrder = queryOrder;
            restore(querySort, queryOrder);
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

</style>