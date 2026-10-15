<template>
    <BasePageHeader
        :title="titulo"
        subtitle="Detalle, estados, pagos y conversión del documento"
        icon="fad fa-file-invoice-dollar text-primary"
        :breadcrumbs="breadcrumbs"
        :show-back="true"
        @back="goBack"
    />

    <div v-if="cargando" class="card border-0 shadow-sm">
        <div class="card-body"><NoaTableSpinner message="Cargando documento..." /></div>
    </div>

    <div v-else-if="doc" class="row g-2 g-md-3">
        <div class="col-12 col-lg-8">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-light py-2 px-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <strong class="font-monospace">{{ doc.invoice_number }}</strong>
                        <span class="badge rounded-pill ms-2" :class="claseEstado(doc.status)">{{ doc.status }}</span>
                        <span v-if="doc.esFactura" class="badge bg-warning text-dark ms-1">Pendiente DIAN</span>
                    </div>
                    <div class="btn-group btn-group-sm" role="group">
                        <button v-if="can('commercial_invoices.update')" class="btn btn-falcon-default" type="button" title="Descargar PDF" aria-label="Descargar PDF" @click="descargar">
                            <i class="fad fa-file-pdf text-danger" aria-hidden="true" />
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <dl class="row mb-0 small">
                        <dt class="col-sm-4">Cliente</dt>
                        <dd class="col-sm-8">{{ nombreCliente }}</dd>
                        <dt class="col-sm-4">Emisión</dt>
                        <dd class="col-sm-8">{{ doc.issue_date }}</dd>
                        <dt v-if="doc.valid_until" class="col-sm-4">Vigencia</dt>
                        <dd v-if="doc.valid_until" class="col-sm-8">{{ doc.valid_until }}</dd>
                        <dt v-if="doc.due_date" class="col-sm-4">Vencimiento</dt>
                        <dd v-if="doc.due_date" class="col-sm-8">{{ doc.due_date }}</dd>
                    </dl>

                    <h6 class="text-muted fw-medium mt-3">Ítems</h6>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Descripción</th>
                                    <th class="text-end">Cant.</th>
                                    <th class="text-end">Precio</th>
                                    <th class="text-end">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in doc.items || []" :key="item.uuid">
                                    <td>{{ item.description }}</td>
                                    <td class="text-end">{{ item.quantity }}</td>
                                    <td class="text-end">${{ formatear(item.unit_price) }}</td>
                                    <td class="text-end">${{ formatear(item.line_total) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <dl class="row mb-0 small">
                        <dt class="col-6 text-end">Subtotal</dt><dd class="col-6 text-end">${{ formatear(doc.subtotal) }}</dd>
                        <dt class="col-6 text-end">Impuestos</dt><dd class="col-6 text-end">${{ formatear(doc.total_tax) }}</dd>
                        <dt class="col-6 text-end">Retenciones</dt><dd class="col-6 text-end">${{ formatear(doc.total_withholding) }}</dd>
                        <dt class="col-6 text-end"><strong>Total</strong></dt><dd class="col-6 text-end"><strong>${{ formatear(doc.invoice_total) }}</strong></dd>
                        <template v-if="doc.esFactura">
                            <dt class="col-6 text-end">Abonado</dt><dd class="col-6 text-end">${{ formatear(doc.amount_paid) }}</dd>
                            <dt class="col-6 text-end">Saldo</dt><dd class="col-6 text-end">${{ formatear(saldo) }}</dd>
                        </template>
                    </dl>

                    <div class="alert alert-warning small mt-3 mb-0">
                        <i class="fad fa-info-circle me-1" aria-hidden="true" />Documento interno — pendiente de validación DIAN. Sin CUFE.
                    </div>
                </div>
            </div>
        </div>

        <div class="col-12 col-lg-4">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-light py-2 px-3 border-bottom"><h6 class="mb-0 fw-medium">Acciones</h6></div>
                <div class="card-body d-grid gap-2">
                    <template v-if="doc.esCotizacion">
                        <button v-if="doc.status === 'BORRADOR' && can('commercial_invoices.update')" class="btn btn-sm btn-outline-primary" type="button" @click="cambiar('ENVIADA')">
                            <i class="fad fa-paper-plane me-1" aria-hidden="true" />Marcar enviada
                        </button>
                        <button v-if="doc.status === 'ENVIADA' && can('commercial_invoices.update')" class="btn btn-sm btn-outline-success" type="button" @click="cambiar('APROBADA')">
                            <i class="fad fa-check me-1" aria-hidden="true" />Aprobar
                        </button>
                        <button v-if="doc.status === 'APROBADA' && can('commercial_invoices.create')" class="btn btn-sm btn-primary" type="button" @click="mostrarConvertir = true">
                            <i class="fad fa-exchange me-1" aria-hidden="true" />Convertir en factura
                        </button>
                    </template>
                    <template v-else>
                        <button v-if="puedePagar && can('commercial_invoices.create')" class="btn btn-sm btn-outline-success" type="button" @click="mostrarPago = true">
                            <i class="fad fa-coins me-1" aria-hidden="true" />Registrar pago
                        </button>
                    </template>
                    <button v-if="puedeAnular && can('commercial_invoices.update')" class="btn btn-sm btn-outline-danger" type="button" @click="anular">
                        <i class="fad fa-ban me-1" aria-hidden="true" />Anular
                    </button>

                    <div v-if="mostrarConvertir" class="border rounded-3 p-2 bg-light">
                        <label class="form-label small" for="f-conv-resolucion">Resolución</label>
                        <PrimeSelect v-model="conversion.billing_resolution_uuid" :options="resolucionOptions"
                            input-id="f-conv-resolucion" optionLabel="label" optionValue="uuid" filter
                            placeholder="Seleccione resolución..." class="w-100 mb-2" style="width:100%;" />
                        <label class="form-label small" for="f-conv-emision">Emisión</label>
                        <DateInput id="f-conv-emision" v-model="conversion.issue_date" class="mb-2" />
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-primary flex-grow-1" type="button" :disabled="!conversion.billing_resolution_uuid || !conversion.issue_date" @click="convertir">
                                Confirmar
                            </button>
                            <button class="btn btn-sm btn-falcon-default" type="button" @click="mostrarConvertir = false">Cancelar</button>
                        </div>
                    </div>

                    <div v-if="mostrarPago" class="border rounded-3 p-2 bg-light">
                        <label class="form-label small" for="f-pago-monto">Monto (saldo ${{ formatear(saldo) }})</label>
                        <input id="f-pago-monto" v-model.number="pago.amount" class="form-control form-control-sm mb-2" type="number" min="0.01" :max="saldo" step="0.01" />
                        <label class="form-label small" for="f-pago-fecha">Fecha</label>
                        <DateInput id="f-pago-fecha" v-model="pago.payment_date" class="mb-2" />
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-success flex-grow-1" type="button" :disabled="!pago.amount || !pago.payment_date" @click="registrarPago">
                                Guardar pago
                            </button>
                            <button class="btn btn-sm btn-falcon-default" type="button" @click="mostrarPago = false">Cancelar</button>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="doc.esFactura && (doc.payments || []).length" class="card border-0 shadow-sm mt-3">
                <div class="card-header bg-light py-2 px-3 border-bottom"><h6 class="mb-0 fw-medium">Pagos</h6></div>
                <div class="card-body p-2">
                    <div v-for="p in doc.payments" :key="p.uuid" class="d-flex justify-content-between small border-bottom py-1">
                        <span>{{ p.payment_date }}</span>
                        <strong>${{ formatear(p.amount) }}</strong>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div v-else class="alert alert-warning">El documento solicitado no existe.</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBillingStore } from '../store/billing.store.js';
import { usePermissionsStore } from '@store';
import { toast } from '@/utils/toast.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import PrimeSelect from '@/components/form/PrimeSelect.vue';
import DateInput from '@/components/form/DateInput.vue';

const route = useRoute();
const router = useRouter();
const store = useBillingStore();
const permissionsStore = usePermissionsStore();

const cargando = ref(true);
const doc = ref(null);
const mostrarConvertir = ref(false);
const mostrarPago = ref(false);
const conversion = ref({ billing_resolution_uuid: '', issue_date: '' });
const pago = ref({ amount: null, payment_date: '' });

const can = (action) => permissionsStore.can(action);
const goBack = () => router.push('/facturacion');

const titulo = computed(() => doc.value ? `${doc.value.invoice_type === 'COTIZACION' ? 'Cotización' : 'Factura'} ${doc.value.invoice_number}` : 'Documento');
const breadcrumbs = computed(() => [{ label: 'Comercial' }, { label: 'Facturación', to: '/facturacion' }, { label: 'Detalle' }]);
const saldo = computed(() => Math.max(0, Number(doc.value?.invoice_total || 0) - Number(doc.value?.amount_paid || 0)));
const puedePagar = computed(() => ['EMITIDA_INTERNA', 'PAGADA_PARCIAL'].includes(doc.value?.status));
const puedeAnular = computed(() => ['BORRADOR', 'EMITIDA_INTERNA', 'PAGADA_PARCIAL'].includes(doc.value?.status));

const ESTADOS = {
    BORRADOR: 'bg-secondary', ENVIADA: 'bg-info', APROBADA: 'bg-success', RECHAZADA: 'bg-danger',
    VENCIDA: 'bg-danger', CONVERTIDA: 'bg-success', EMITIDA_INTERNA: 'bg-info',
    PAGADA_PARCIAL: 'bg-info', PAGADA: 'bg-success', ANULADA: 'bg-danger',
};
const claseEstado = (status) => ESTADOS[status] ?? 'bg-secondary';
const formatear = (valor) => Number(valor || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 });

const nombreCliente = computed(() => {
    const c = doc.value?.customer || {};
    return c.company_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.document_number || '—';
});

const resolucionOptions = computed(() =>
    (store?.catalogs?.resoluciones || []).map((r) => ({ uuid: r.uuid, label: `${r.invoice_prefix} (${r.invoice_start_number}-${r.invoice_end_number})` }))
);

const recargar = async () => {
    doc.value = await store.fetchProfileById(route.params.id);
    if (doc.value) {
        doc.value.esFactura = doc.value.invoice_type === 'FACTURA_VENTA';
        doc.value.esCotizacion = doc.value.invoice_type === 'COTIZACION';
    }
};

const cambiar = async (status) => {
    await store.cambiarEstado(route.params.id, status);
    await recargar();
};

const convertir = async () => {
    const factura = await store.convertir(route.params.id, { ...conversion.value });
    router.push(`/facturacion/${factura.uuid}`);
};

const registrarPago = async () => {
    if (Number(pago.value.amount) > saldo.value) {
        await toast('Atención', 'El monto supera el saldo de la factura', 'warning');
        return;
    }
    await store.registrarPago(route.params.id, { ...pago.value });
    mostrarPago.value = false;
    pago.value = { amount: null, payment_date: '' };
    await recargar();
};

const anular = async () => {
    await store.anular(route.params.id);
    await recargar();
};

const descargar = async () => {
    await store.descargarPdf(doc.value.uuid, doc.value.invoice_number);
};

onMounted(async () => {
    try {
        await store.loadCatalogs();
        await recargar();
    } finally {
        cargando.value = false;
    }
});
</script>

<style scoped>
.card { border-radius: 0.75rem !important; }
.font-monospace { font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
:focus-visible { outline: 2px solid #0d6efd !important; outline-offset: 2px !important; }
</style>
