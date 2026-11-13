<template>
    <BasePageHeader
        title="Facturación"
        subtitle="Cotizaciones y facturas internas de servicios de transporte"
        icon="fad fa-file-invoice-dollar text-primary"
        :show-bg="true"
        :loading="isViewLoading"
        :compact="true"
        :breadcrumbs="[{ label: 'Comercial' }, { label: 'Facturación' }]"
    >
        <template #actions>
            <button
                class="btn btn-falcon-default btn-sm px-2 px-sm-3"
                type="button"
                title="Actualizar"
                aria-label="Actualizar"
                @click="refreshTable"
            >
                <i class="fad fa-sync" aria-hidden="true" />
                <span class="d-none d-sm-inline ms-1">Actualizar</span>
            </button>

            <button
                v-if="can('billing_resolutions.index')"
                class="btn btn-falcon-default btn-sm px-2 px-sm-3 text-nowrap"
                type="button"
                title="Resoluciones de facturación"
                aria-label="Resoluciones de facturación"
                @click="goToResolutions"
            >
                <i class="fad fa-stamp text-primary me-1" aria-hidden="true" />
                <span class="d-none d-sm-inline">Resoluciones</span>
            </button>

            <button
                v-if="can('commercial_invoices.create')"
                class="btn btn-primary btn-sm px-2 px-sm-3 text-nowrap"
                type="button"
                title="Nuevo documento"
                aria-label="Nuevo documento"
                @click="goToCreate"
            >
                <i class="fad fa-plus me-1" aria-hidden="true" />
                <span class="d-none d-sm-inline">Nuevo</span>
            </button>
        </template>
    </BasePageHeader>

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
            <span v-if="!isViewLoading" class="noa-results">
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
                            <span class="noa-status" :class="estadoModifier(data)">
                                {{ estadoVisible(data) }}
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

    <Dialog v-model:visible="mostrarModalDian" header="XML y respuesta de la DIAN" modal :style="{ width: '44rem', maxWidth: '96vw' }">
        <div v-if="cargandoDetalleDian" class="py-4 text-center">
            <NoaTableSpinner message="Cargando respuesta DIAN..." />
        </div>
        <div v-else-if="detalleDian" class="small">
            <dl class="row mb-3">
                <dt class="col-sm-4">Documento</dt>
                <dd class="col-sm-8 font-monospace">{{ detalleDian.invoice_number }}</dd>
                <dt class="col-sm-4">Estado DIAN</dt>
                <dd class="col-sm-8">{{ detalleDian.electronic_status || 'PENDIENTE_DIAN' }}</dd>
                <template v-if="detalleDian.cufe">
                    <dt class="col-sm-4">CUFE</dt>
                    <dd class="col-sm-8 text-break font-monospace">{{ detalleDian.cufe }}</dd>
                </template>
                <template v-if="mensajeRespuestaDian">
                    <dt class="col-sm-4">Mensaje DIAN</dt>
                    <dd class="col-sm-8">{{ mensajeRespuestaDian }}</dd>
                </template>
            </dl>

            <div v-if="tieneXmlDescargable" class="d-flex flex-wrap gap-2 mb-3">
                <button class="btn btn-sm btn-outline-primary" type="button" @click="descargarXmlDian">
                    <i class="fal fa-file-code me-1" aria-hidden="true" />Descargar XML DIAN
                </button>
            </div>

            <pre v-if="detalleDian.dian_response" class="bg-light border rounded p-2 mb-0 small" style="max-height: 16rem; overflow: auto;">{{ JSON.stringify(detalleDian.dian_response, null, 2) }}</pre>
            <div v-else class="alert alert-info mb-0">Este documento aún no tiene respuesta registrada de la DIAN.</div>
        </div>
    </Dialog>

    <Dialog v-model:visible="mostrarModalCorreo" header="Enviar factura por correo" modal :style="{ width: '28rem', maxWidth: '94vw' }">
        <form class="row g-3" novalidate @submit.prevent="confirmarEnvioCorreo">
            <div class="col-12">
                <label class="form-label required" for="f-envio-correo">Correo destino</label>
                <input
                    id="f-envio-correo"
                    v-model="correoDestino"
                    class="form-control"
                    :class="{ 'is-invalid': correoError }"
                    type="email"
                    placeholder="cliente@empresa.com"
                    :aria-invalid="Boolean(correoError)"
                    :aria-describedby="correoError ? 'f-envio-correo-error' : undefined"
                />
                <div v-if="correoError" id="f-envio-correo-error" class="invalid-feedback d-block" role="alert">{{ correoError }}</div>
            </div>
            <div class="col-12 d-flex justify-content-end gap-2">
                <button class="btn btn-falcon-default btn-sm" type="button" :disabled="enviandoCorreo" @click="mostrarModalCorreo = false">Cancelar</button>
                <button class="btn btn-primary btn-sm" type="submit" :disabled="enviandoCorreo">
                    <i class="fad fa-envelope me-1" aria-hidden="true" />{{ enviandoCorreo ? 'Enviando...' : 'Enviar correo' }}
                </button>
            </div>
        </form>
    </Dialog>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useServerSort } from '@/hooks/useServerSort.js';
import { useBillingStore } from '../store/billing.store.js';
import { usePermissionsStore } from '@store';
import { useTable } from '@/hooks/useTable.js';
import { useTableActions } from '@/hooks/useTableActions.js';
import { toast } from '@/utils/toast.js';
import billingService from '../services/billing.service.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import RowActions from '@/components/RowActions.vue';
import ListPagination from '@/components/ListPagination.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';

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

const ESTADOS_DIAN = {
    PENDIENTE_DIAN: { label: 'Pendiente DIAN', modifier: 'noa-status--warning' },
    ACEPTADA_DIAN: { label: 'Aceptada DIAN', modifier: 'noa-status--success' },
    VALIDADA_SIN_ENVIO: { label: 'Validada sin envío', modifier: 'noa-status--warning' },
    RECHAZADA_DIAN: { label: 'Rechazada DIAN', modifier: 'noa-status--danger' },
};

const estadoDian = (data) =>
    data.invoice_type === 'FACTURA_VENTA' ? ESTADOS_DIAN[data.electronic_status] : null;

const estadoVisible = (data) => estadoDian(data)?.label ?? (data.status || '-');

const estadoModifier = (data) => estadoDian(data)?.modifier ?? statusModifier(data.status);

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

const mostrarModalDian = ref(false);
const cargandoDetalleDian = ref(false);
const detalleDian = ref(null);

const mostrarModalCorreo = ref(false);
const enviandoCorreo = ref(false);
const correoDestino = ref('');
const correoError = ref('');
const facturaCorreoUuid = ref('');

const mensajeRespuestaDian = computed(() => {
    const r = detalleDian.value?.dian_response;
    if (!r) return '';
    return r.status_message || r.message || r.status_description || '';
});

const tieneXmlDescargable = computed(() => {
    const d = detalleDian.value;
    const r = d?.dian_response;
    return Boolean(
        r?.attached_document_base64_bytes
        || r?.xml_base64_bytes
        || d?.electronic_invoice?.xml_url,
    );
});

const descargarXmlDian = () => {
    const d = detalleDian.value;
    const r = d?.dian_response;
    const b64 = r?.attached_document_base64_bytes || r?.xml_base64_bytes;
    if (b64) {
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        const url = URL.createObjectURL(new Blob([bytes], { type: 'application/xml' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `${d.invoice_number || d.uuid}.xml`;
        a.click();
        URL.revokeObjectURL(url);
        return;
    }
    if (d?.electronic_invoice?.xml_url) {
        window.open(d.electronic_invoice.xml_url, '_blank', 'noopener');
    }
};

const emitirFactura = async (data) => {
    try {
        await store.emitir(data.uuid);
        await toast('¡Éxito!', `Factura ${data.invoice_number} enviada a la DIAN.`, 'success');
        await store.fetchItems();
    } catch (_e) { /* store._run ya muestra el error */ }
};

const consultarDian = async (data) => {
    try {
        const res = await billingService.consultarDian(data.uuid);
        const info = res?.data ?? res;
        await toast('Estado DIAN', `Documento ${data.invoice_number}: ${info.estado || data.electronic_status || 'Sin cambios'}`, 'info');
        await store.fetchItems();
    } catch (error) {
        await toast('Error', error?.response?.data?.message || 'No se pudo consultar el estado en la DIAN.', 'error');
    }
};

const verRespuestaDian = async (data) => {
    mostrarModalDian.value = true;
    cargandoDetalleDian.value = true;
    detalleDian.value = null;
    try {
        const res = await billingService.get(data.uuid);
        detalleDian.value = res?.data ?? res;
    } catch (error) {
        mostrarModalDian.value = false;
        await toast('Error', error?.response?.data?.message || 'No se pudo cargar la respuesta DIAN.', 'error');
    } finally {
        cargandoDetalleDian.value = false;
    }
};

const abrirEnvioCorreo = (data) => {
    facturaCorreoUuid.value = data.uuid;
    correoDestino.value = data.customer?.email || '';
    correoError.value = '';
    mostrarModalCorreo.value = true;
};

const confirmarEnvioCorreo = async () => {
    const destino = correoDestino.value.trim();
    if (!destino || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destino)) {
        correoError.value = 'Indica un correo electrónico válido.';
        document.getElementById('f-envio-correo')?.focus();
        return;
    }
    correoError.value = '';
    if (!facturaCorreoUuid.value) return;
    enviandoCorreo.value = true;
    try {
        await billingService.enviarCorreo(facturaCorreoUuid.value, destino);
        mostrarModalCorreo.value = false;
        await toast('¡Éxito!', `Documento enviado a ${destino}.`, 'success');
    } catch (error) {
        await toast('Error', error?.response?.data?.message || 'No se pudo enviar el correo.', 'error');
    } finally {
        enviandoCorreo.value = false;
    }
};

const esperarRespuestaCliente = async (data) => {
    await toast(
        'En espera del cliente',
        `La factura ${data.invoice_number} está pendiente de acuse/aceptación por parte del adquiriente.`,
        'info',
    );
};

const anularFactura = async (data) => {
    try {
        await store.anular(data.uuid);
        await toast('Anulado', `Documento ${data.invoice_number} anulado.`, 'success');
        await store.fetchItems();
    } catch (_e) { /* store._run ya muestra el error */ }
};

const accionesDe = (data) => {
    const esFactura = data.invoice_type === 'FACTURA_VENTA';
    const puedeEmitir = esFactura
        && data.status !== 'ANULADA'
        && (!data.electronic_status || ['PENDIENTE_DIAN', 'RECHAZADA_DIAN'].includes(data.electronic_status));
    const emitidaDian = esFactura && ['ACEPTADA_DIAN', 'VALIDADA_SIN_ENVIO', 'PENDIENTE_DIAN'].includes(data.electronic_status) && (data.cufe || data.provider_document_id);

    return [
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
            key: 'pdf',
            label: 'Descargar PDF',
            icon: 'far fa-file-pdf',
            tone: 'neutral',
            inline: data.status !== 'BORRADOR',
            visible: can('commercial_invoices.profile'),
            onClick: () => billingService.descargarPdf(data.uuid, data.invoice_number),
        },
        {
            key: 'emitir-dian',
            label: 'Enviar a DIAN',
            icon: 'far fa-paper-plane',
            tone: 'primary',
            visible: can('commercial_invoices.update') && puedeEmitir,
            onClick: () => emitirFactura(data),
        },
        {
            key: 'enviar-correo',
            label: 'Enviar a correo',
            icon: 'far fa-envelope',
            tone: 'neutral',
            visible: can('commercial_invoices.update') && emitidaDian,
            onClick: () => abrirEnvioCorreo(data),
        },
        {
            key: 'xml-respuesta',
            label: 'XML respuesta de la DIAN',
            icon: 'far fa-file-code',
            tone: 'neutral',
            visible: can('commercial_invoices.profile') && esFactura,
            onClick: () => verRespuestaDian(data),
        },
        {
            key: 'esperar-cliente',
            label: 'Esperar respuesta del cliente',
            icon: 'far fa-hourglass-half',
            tone: 'neutral',
            visible: can('commercial_invoices.profile') && emitidaDian,
            onClick: () => esperarRespuestaCliente(data),
        },
        {
            key: 'consultar-dian',
            label: 'Consultar DIAN',
            icon: 'far fa-sync-alt',
            tone: 'neutral',
            visible: can('commercial_invoices.profile') && emitidaDian,
            onClick: () => consultarDian(data),
        },
        {
            key: 'anular',
            label: 'Anular',
            icon: 'far fa-ban',
            tone: 'danger',
            visible: can('commercial_invoices.update') && data.status !== 'ANULADA' && Number(data.amount_paid || 0) === 0,
            onClick: () => anularFactura(data),
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
};

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
