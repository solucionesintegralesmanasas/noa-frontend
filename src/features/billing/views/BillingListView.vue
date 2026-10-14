<template>
    <BasePageHeader title="Facturación" subtitle="Cotizaciones y facturas internas de servicios de transporte"
        icon="fad fa-file-invoice-dollar text-primary" :show-refresh="true" :show-create="true" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true" :canCreate="can('commercial_invoices.create')"
        :breadcrumbs="[{ label: 'Comercial' }, { label: 'Facturación' }]" @refresh="refreshTable" @create="goToCreate" />

    <div class="card border-0 shadow-sm mb-3">
        <div class="card-body position-relative py-2">
            <div class="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
                <div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2 flex-grow-1">
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
                    <div class="input-group input-group-sm w-100" style="max-width: 420px;">
                        <span class="input-group-text bg-light border-end-0">
                            <i class="fad fa-search text-muted" aria-hidden="true" />
                        </span>
                        <input id="f-billing-busqueda" v-model="searchQuery" class="form-control form-control-sm border-start-0 shadow-none"
                            type="search" placeholder="Buscar por número, ruta o nota..."
                            aria-label="Buscar documento" @input="debouncedSearch" />
                        <button v-if="searchQuery" class="btn btn-outline-secondary border-start-0" type="button"
                            title="Limpiar búsqueda" @click="clearSearch">
                            <i class="fad fa-times" aria-hidden="true" />
                        </button>
                    </div>
                </div>
                <div v-if="!isViewLoading && !store.loading" class="text-muted text-lg-end text-nowrap">
                    <button v-if="can('billing_resolutions.index')" class="btn btn-sm btn-outline-secondary me-2" type="button" @click="goToResolutions">
                        <i class="fad fa-stamp me-1" aria-hidden="true" />Resoluciones
                    </button>
                    <small>
                        <i class="fad fa-filter me-1" aria-hidden="true" />
                        {{ store.pagination.totalItems }} resultado{{ store.pagination.totalItems !== 1 ? 's' : '' }}
                    </small>
                </div>
            </div>
        </div>
    </div>

    <div class="row gx-3">
        <div class="col-12">
            <div class="card border-0 shadow-sm">
                <div v-if="isViewLoading" class="card-body p-0">
                    <div class="table-responsive scrollbar">
                        <table class="table table-sm mb-0">
                            <thead>
                                <tr>
                                    <th v-for="w in ['30%', '25%', '20%', '25%']" :key="w" style="padding:12px 8px">
                                        <div class="skeleton-text" :style="`height:16px;width:${w}`" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="n in store.pagination.itemsPerPage" :key="`sk-${n}`">
                                    <td v-for="j in 4" :key="j"><div class="skeleton-text" style="height:16px;width:70%;" /></td>
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
                            tableStyle="min-width: 52rem" class="table table-sm mb-0 professional-table"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
                            emptyMessage="No se encontraron registros" @page="onPageChange">

                            <Column field="invoice_number" header="Número" sortable style="width: 130px;">
                                <template #body="{ data }">
                                    <span class="fw-medium font-monospace">{{ data.invoice_number || '—' }}</span>
                                </template>
                            </Column>

                            <Column header="Cliente">
                                <template #body="{ data }">
                                    <div class="d-flex align-items-center gap-2">
                                        <div class="avatar-placeholder bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                                            <i class="fad fa-building" style="font-size: 15px;" aria-hidden="true" />
                                        </div>
                                        <div class="min-w-0">
                                            <span class="text-dark d-block fw-medium text-truncate" style="font-size:0.875rem; max-width: 300px;">
                                                {{ nombreCliente(data) }}
                                            </span>
                                        </div>
                                    </div>
                                </template>
                            </Column>

                            <Column header="Total" class="text-end" style="width: 150px;">
                                <template #body="{ data }">
                                    <span class="fw-medium">${{ formatear(data.invoice_total) }}</span>
                                </template>
                            </Column>

                            <Column field="status" header="Estado" style="width: 150px;" class="text-center">
                                <template #body="{ data }">
                                    <span class="badge rounded-pill" :class="claseEstado(data.status)" style="font-size:0.8rem;padding:0.4em 0.75em;">
                                        <i class="fad me-1" :class="iconoEstado(data.status)" style="font-size:10px;" aria-hidden="true" />
                                        {{ data.status }}
                                    </span>
                                </template>
                            </Column>

                            <Column header="Acciones" class="text-center" style="min-width:140px; width: 140px;"
                                v-if="can('commercial_invoices.profile') || can('commercial_invoices.update') || can('commercial_invoices.delete')">
                                <template #body="{ data }">
                                    <div class="btn-group btn-group-sm" role="group">
                                        <button v-if="can('commercial_invoices.profile')" class="btn btn-falcon-default" type="button"
                                            title="Ver detalle" :aria-label="`Ver ${data.invoice_number}`" @click="goToDetail(data.uuid)">
                                            <i class="fad fa-eye text-primary" style="font-size:14px;" aria-hidden="true" />
                                        </button>
                                        <button v-if="can('commercial_invoices.update') && data.status === 'BORRADOR'" class="btn btn-falcon-default" type="button"
                                            title="Editar" :aria-label="`Editar ${data.invoice_number}`" @click="goToEdit(data.uuid)">
                                            <i class="fad fa-edit text-warning" style="font-size:14px;" aria-hidden="true" />
                                        </button>
                                        <button v-if="can('commercial_invoices.delete') && data.status === 'BORRADOR'" class="btn btn-falcon-default" type="button"
                                            title="Eliminar" :aria-label="`Eliminar ${data.invoice_number}`" @click="handleDelete(data)">
                                            <i class="fad fa-trash text-danger" style="font-size:14px;" aria-hidden="true" />
                                        </button>
                                    </div>
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
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useBillingStore } from '../store/billing.store.js';
import { usePermissionsStore } from '@store';
import { useTable } from '@/hooks/useTable.js';
import { useTableActions } from '@/hooks/useTableActions.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const router = useRouter();
const store = useBillingStore();
const permissionsStore = usePermissionsStore();

const isViewLoading = ref(true);
const searchQuery = ref('');

const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(searchQuery.value));
const { confirmDelete, initTooltips, destroyTooltips } = useTableActions(store, router);

const can = (action) => permissionsStore.can(action);

const ESTADOS = {
    BORRADOR: { clase: 'bg-secondary', icono: 'fa-pencil' },
    ENVIADA: { clase: 'bg-info', icono: 'fa-paper-plane' },
    APROBADA: { clase: 'bg-success', icono: 'fa-check' },
    RECHAZADA: { clase: 'bg-danger', icono: 'fa-times' },
    VENCIDA: { clase: 'bg-danger', icono: 'fa-clock' },
    CONVERTIDA: { clase: 'bg-success', icono: 'fa-exchange' },
    EMITIDA_INTERNA: { clase: 'bg-info', icono: 'fa-file-invoice' },
    PAGADA_PARCIAL: { clase: 'bg-info', icono: 'fa-coins' },
    PAGADA: { clase: 'bg-success', icono: 'fa-check-double' },
    ANULADA: { clase: 'bg-danger', icono: 'fa-ban' },
};

const claseEstado = (status) => ESTADOS[status]?.clase ?? 'bg-secondary';
const iconoEstado = (status) => ESTADOS[status]?.icono ?? 'fa-file';

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

const onPageChange = async ({ first, rows }) => {
    await store.setPage(Math.floor(first / rows) + 1);
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
.card { border-radius: 0.75rem !important; }
.avatar-placeholder { width: 36px; height: 36px; font-size: 14px; font-weight: 600; flex-shrink: 0; user-select: none; }
.min-w-0 { min-width: 0; }
.font-monospace { font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
.bg-opacity-10 { --bs-bg-opacity: 0.1; }
:focus-visible { outline: 2px solid #0d6efd !important; outline-offset: 2px !important; }
</style>
