<template>
    <BasePageHeader title="Facturación" subtitle="Cotizaciones y facturas internas de servicios de transporte"
        icon="fad fa-file-invoice-dollar text-primary" :show-refresh="true" :show-create="true" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true" :canCreate="can('commercial_invoices.create')"
        :breadcrumbs="[{ label: 'Comercial' }, { label: 'Facturación' }]" @refresh="refreshTable" @create="goToCreate" />

    <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar">
            <div class="d-flex flex-wrap align-items-center gap-2 flex-grow-1" style="max-width: 42rem;">
                <div class="btn-group btn-group-sm" role="group" aria-label="Tipo de documento">
                    <button type="button" class="btn" :class="store.tipoFiltro === 'COTIZACION' ? 'btn-primary' : 'btn-outline-primary'"
                        @click="cambiarTipo('COTIZACION')">
                        <i class="fad fa-file-signature me-1" aria-hidden="true" />Cotizaciones
                    </button>
                    <button type="button" class="btn" :class="store.tipoFiltro === 'FACTURA_VENTA' ? 'btn-primary' : 'btn-outline-primary'"
                        @click="cambiarTipo('FACTURA_VENTA')">
                        <i class="fad fa-file-invoice me-1" aria-hidden="true" />Facturas
                    </button>
                </div>
                <div class="noa-search flex-grow-1">
                    <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                    <input id="f-billing-busqueda" v-model="searchQuery" class="noa-search__input"
                        type="search" placeholder="Buscar por número, ruta o nota..."
                        aria-label="Buscar documento" @input="debouncedSearch" />
                    <button v-if="searchQuery" class="noa-search__clear" type="button"
                        title="Limpiar búsqueda" aria-label="Limpiar búsqueda" @click="clearSearch">
                        <i class="fal fa-times" aria-hidden="true" />
                    </button>
                </div>
            </div>
            <div class="d-flex align-items-center gap-2">
                <button v-if="can('billing_resolutions.index')" class="btn btn-sm btn-outline-secondary" type="button" @click="goToResolutions">
                    <i class="fad fa-stamp me-1" aria-hidden="true" />Resoluciones
                </button>
                <span v-if="!isViewLoading && !store.loading" class="noa-results">
                    <i class="fas fa-filter" aria-hidden="true" />
                    {{ store.pagination.totalItems }} resultado{{ store.pagination.totalItems !== 1 ? 's' : '' }}
                    <template v-if="store.search"> para "{{ store.search }}"</template>
                </span>
            </div>
        </div>

        <!-- SKELETON -->
        <div v-if="isViewLoading" class="card-body p-0">
            <div class="table-responsive scrollbar">
                <table class="table table-sm mb-0">
                    <thead>
                        <tr>
                            <th v-for="w in ['18%', '36%', '16%', '15%', '15%']" :key="w" style="padding:12px 8px">
                                <div class="skeleton-text" :style="`height:16px;width:${w}`" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="n in store.pagination.itemsPerPage" :key="`sk-${n}`">
                            <td v-for="j in 4" :key="j"><div class="skeleton-text" style="height:16px;width:70%;" /></td>
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
                    tableStyle="min-width: 52rem" class="table table-sm mb-0 professional-table noa-table-fixed"
                    emptyMessage="No se encontraron registros"
                    :sortField="sortField" :sortOrder="sortOrdenPrimeVue" removableSort @sort="onSort">

                    <Column field="invoice_number" header="Número" sortable style="width: 18%;">
                        <template #body="{ data }">
                            <span class="noa-cell-strong font-monospace">{{ data.invoice_number || '—' }}</span>
                        </template>
                    </Column>

                    <Column header="Cliente" style="width: 36%;">
                        <template #body="{ data }">
                            <div class="d-flex align-items-center gap-2">
                                <div class="avatar-placeholder bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                                    <i class="fad fa-building" style="font-size: 15px;" aria-hidden="true" />
                                </div>
                                <div class="min-w-0">
                                    <span class="noa-cell-strong d-block text-truncate">
                                        {{ nombreCliente(data) }}
                                    </span>
                                </div>
                            </div>
                        </template>
                    </Column>

                    <Column header="Total" class="text-end" header-class="text-end" style="width: 16%;">
                        <template #body="{ data }">
                            <span class="fw-medium">${{ formatear(data.invoice_total) }}</span>
                        </template>
                    </Column>

                    <Column field="status" header="Estado" style="width: 15%;" class="text-center" header-class="text-center">
                        <template #body="{ data }">
                            <span class="noa-status" :class="statusModifier(data.status)">
                                {{ data.status || '—' }}
                            </span>
                        </template>
                    </Column>

                    <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 15%;"
                        v-if="can('commercial_invoices.profile') || can('commercial_invoices.update') || can('commercial_invoices.delete')">
                        <template #body="{ data }">
                            <RowActions :actions="accionesDe(data)" :row-label="data.invoice_number || 'documento'" />
                        </template>
                    </Column>

                    <template #empty>
                        <div class="text-center py-5">
                            <i class="fad fa-file-invoice fs-1 text-muted opacity-50 mb-3 d-block" aria-hidden="true" />
                            <h6 class="text-muted mb-1 fw-medium">No hay documentos registrados</h6>
                            <p class="text-muted small mb-3">Comienza creando tu primera {{ store.esCotizacion ? 'cotización' : 'factura' }}.</p>
                            <button v-if="can('commercial_invoices.create')" class="btn btn-primary btn-sm" @click="goToCreate">
                                <i class="fad fa-plus me-1" aria-hidden="true" />Nuevo documento
                            </button>
                        </div>
                    </template>

                    <template #loading>
                        <NoaTableSpinner :message="`Cargando ${store.esCotizacion ? 'cotizaciones' : 'facturas'}...`" />
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
import { useBillingStore } from '../store/billing.store.js';
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
const store = useBillingStore();
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
    switch (status) {
        case 'APROBADA':
        case 'CONVERTIDA':
        case 'PAGADA':
            return 'noa-status--success';
        case 'BORRADOR':
            return 'noa-status--muted';
        case 'ENVIADA':
        case 'EMITIDA_INTERNA':
        case 'PAGADA_PARCIAL':
            return 'noa-status--warning';
        case 'RECHAZADA':
        case 'VENCIDA':
        case 'ANULADA':
            return 'noa-status--danger';
        default:
            return 'noa-status--muted';
    }
};

const nombreCliente = (data) => {
    const c = data.customer || {};
    return c.company_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.document_number || '—';
};

const formatear = (valor) => Number(valor || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 });

const clearSearch = async () => {
    searchQuery.value = '';
    await store.clearFilters();
};

const cambiarTipo = async (tipo) => {
    if (store.tipoFiltro === tipo) return;
    await store.setTipo(tipo);
};

const onPageChange = async ({ page, first, rows }) => {
    store.pagination.itemsPerPage = rows;
    const targetPage = page !== undefined ? page : Math.floor(first / rows) + 1;
    await store.setPage(targetPage);
};

const goToCreate = () => router.push(store.esCotizacion ? '/facturacion/cotizaciones/nueva' : '/facturacion/facturas/nueva');
const goToResolutions = () => router.push('/facturacion/resoluciones');
const goToEdit = (uuid) => uuid && router.push(`/facturacion/editar/${uuid}`);
const goToDetail = (uuid) => uuid && router.push(`/facturacion/${uuid}`);
const refreshTable = () => store.fetchItems();

const handleDelete = (doc) => confirmDelete(doc, {
    nameField: 'invoice_number',
    title: '¿Eliminar documento?',
    html: `<p class="mb-2">¿Estás seguro de eliminar el documento <strong>"${doc.invoice_number}"</strong> en BORRADOR?</p>`,
});

const accionesDe = (data) => [
    {
        key: 'ver',
        label: 'Ver detalle',
        icon: 'far fa-eye',
        tone: 'primary',
        inline: true,
        visible: can('commercial_invoices.profile'),
        onClick: () => goToDetail(data.uuid),
    },
    {
        key: 'editar',
        label: 'Editar',
        icon: 'far fa-pen',
        tone: 'warning',
        inline: true,
        visible: can('commercial_invoices.update') && data.status === 'BORRADOR',
        onClick: () => goToEdit(data.uuid),
    },
    {
        key: 'eliminar',
        label: 'Eliminar',
        icon: 'far fa-trash-alt',
        tone: 'danger',
        visible: can('commercial_invoices.delete') && data.status === 'BORRADOR',
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

.font-monospace {
    font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.bg-opacity-10 {
    --bs-bg-opacity: 0.1;
}
</style>
