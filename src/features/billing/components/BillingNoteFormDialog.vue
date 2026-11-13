<template>
    <Dialog
        v-model:visible="visibleModel"
        :header="esCredito ? 'Nueva nota crédito' : 'Nueva nota débito'"
        modal
        :style="{ width: '52rem', maxWidth: '96vw' }"
        :closable="!guardando"
        @show="alAbrir"
    >
        <form class="row g-3" @submit.prevent="guardar" novalidate>
            <div class="col-12 col-md-7">
                <label class="form-label required" for="f-nota-factura">Factura afectada</label>
                <PrimeSelect
                    v-model="form.invoice_uuid"
                    :options="facturasOptions"
                    input-id="f-nota-factura"
                    optionLabel="label"
                    optionValue="uuid"
                    filter
                    :loading="cargandoFacturas"
                    placeholder="Seleccione una factura emitida..."
                    class="w-100"
                    :class="{ 'is-invalid': errores.invoice_uuid }"
                />
                <div v-if="errores.invoice_uuid" class="invalid-feedback d-block">{{ errores.invoice_uuid }}</div>
            </div>

            <div class="col-12 col-md-5">
                <label class="form-label required" for="f-nota-fecha">Fecha de emisión</label>
                <DateInput id="f-nota-fecha" v-model="form.issue_date" class="form-control" :class="{ 'is-invalid': errores.issue_date }" />
                <div v-if="errores.issue_date" class="invalid-feedback d-block">{{ errores.issue_date }}</div>
            </div>

            <div class="col-12 col-md-7">
                <label class="form-label required" for="f-nota-concepto">Concepto DIAN</label>
                <PrimeSelect
                    v-model="form.correction_concept_code"
                    :options="conceptosOptions"
                    input-id="f-nota-concepto"
                    optionLabel="label"
                    optionValue="code"
                    placeholder="Seleccione el concepto..."
                    class="w-100"
                    :class="{ 'is-invalid': errores.correction_concept_code }"
                />
                <div v-if="errores.correction_concept_code" class="invalid-feedback d-block">{{ errores.correction_concept_code }}</div>
            </div>

            <div class="col-12 col-md-5">
                <label class="form-label" for="f-nota-pago">Método de pago</label>
                <PrimeSelect
                    v-model="form.payment_method_uuid"
                    :options="metodosPagoOptions"
                    input-id="f-nota-pago"
                    optionLabel="label"
                    optionValue="uuid"
                    showClear
                    placeholder="Opcional"
                    class="w-100"
                />
            </div>

            <div class="col-12">
                <label class="form-label" for="f-nota-obs">Observación / Motivo</label>
                <input
                    id="f-nota-obs"
                    v-model="form.observation"
                    class="form-control"
                    type="text"
                    maxlength="250"
                    placeholder="Ej: Ajuste por diferencia en valor o devolución parcial"
                />
            </div>

            <div class="col-12">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="fw-semibold small text-uppercase text-muted">Ítems de la nota</span>
                    <button class="btn btn-outline-primary btn-sm" type="button" @click="agregarItem">
                        <i class="fal fa-plus me-1" aria-hidden="true" />Agregar ítem
                    </button>
                </div>
                <div v-if="errores.items" class="text-danger small mb-2">{{ errores.items }}</div>

                <div class="table-responsive border rounded">
                    <table class="table table-sm align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th style="min-width: 14rem;">Descripción</th>
                                <th style="width: 5.5rem;">Cant.</th>
                                <th style="width: 8rem;">Valor unit.</th>
                                <th style="width: 6.5rem;">Desc.</th>
                                <th style="width: 5.5rem;">IVA %</th>
                                <th class="text-end" style="width: 7.5rem;">Total</th>
                                <th style="width: 2.5rem;" aria-label="Quitar" />
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(item, idx) in form.items" :key="idx">
                                <td>
                                    <input
                                        v-model="item.description"
                                        class="form-control form-control-sm"
                                        type="text"
                                        maxlength="500"
                                        placeholder="Descripción del ajuste"
                                    />
                                </td>
                                <td>
                                    <input v-model.number="item.quantity" class="form-control form-control-sm text-end" type="number" min="0.01" step="0.01" />
                                </td>
                                <td>
                                    <input v-model.number="item.unit_price" class="form-control form-control-sm text-end" type="number" min="0" step="0.01" />
                                </td>
                                <td>
                                    <input v-model.number="item.discount_amount" class="form-control form-control-sm text-end" type="number" min="0" step="0.01" />
                                </td>
                                <td>
                                    <input v-model.number="item.tax_rate" class="form-control form-control-sm text-end" type="number" min="0" max="100" step="0.01" />
                                </td>
                                <td class="text-end font-monospace small">${{ formatear(totalLinea(item)) }}</td>
                                <td class="text-center">
                                    <button
                                        v-if="form.items.length > 1"
                                        class="btn btn-link btn-sm text-danger p-0"
                                        type="button"
                                        title="Quitar ítem"
                                        aria-label="Quitar ítem"
                                        @click="quitarItem(idx)"
                                    >
                                        <i class="fal fa-trash-alt" aria-hidden="true" />
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="d-flex justify-content-end gap-4 mt-2 small">
                    <span>Subtotal: <strong>${{ formatear(totales.subtotal) }}</strong></span>
                    <span>IVA: <strong>${{ formatear(totales.iva) }}</strong></span>
                    <span>Total nota: <strong class="text-primary">${{ formatear(totales.total) }}</strong></span>
                </div>
            </div>

            <div class="col-12 d-flex justify-content-end gap-2 pt-2 border-top">
                <button class="btn btn-falcon-default btn-sm" type="button" :disabled="guardando" @click="visibleModel = false">
                    Cancelar
                </button>
                <button class="btn btn-primary btn-sm" type="submit" :disabled="guardando">
                    <i class="fad fa-save me-1" aria-hidden="true" />
                    {{ guardando ? 'Guardando...' : `Guardar nota ${esCredito ? 'crédito' : 'débito'}` }}
                </button>
            </div>
        </form>
    </Dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import Dialog from 'primevue/dialog';
import PrimeSelect from '@/components/form/PrimeSelect.vue';
import DateInput from '@/components/form/DateInput.vue';
import { toast } from '@/utils/toast.js';
import billingService, { creditNotesService, debitNotesService } from '../services/billing.service.js';
import { useBillingStore } from '../store/billing.store.js';

const props = defineProps({
    visible: { type: Boolean, default: false },
    tipo: { type: String, default: 'credito' }, // 'credito' | 'debito'
    initialInvoiceUuid: { type: String, default: '' },
});

const emit = defineEmits(['update:visible', 'created']);

const store = useBillingStore();

const visibleModel = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val),
});

const esCredito = computed(() => props.tipo === 'credito');

const CONCEPTOS_CREDITO = [
    { code: '1', label: '1 — Devolución parcial de bienes y/o no aceptación parcial del servicio' },
    { code: '2', label: '2 — Anulación de factura electrónica' },
    { code: '3', label: '3 — Rebaja o descuento parcial o total' },
    { code: '4', label: '4 — Ajuste de precio' },
    { code: '5', label: '5 — Otros' },
];

const CONCEPTOS_DEBITO = [
    { code: '1', label: '1 — Intereses' },
    { code: '2', label: '2 — Gastos por cobrar' },
    { code: '3', label: '3 — Cambio del valor' },
    { code: '4', label: '4 — Otros' },
];

const conceptosOptions = computed(() => (esCredito.value ? CONCEPTOS_CREDITO : CONCEPTOS_DEBITO));

const nuevoItem = () => ({ description: '', quantity: 1, unit_price: 0, discount_amount: 0, tax_rate: 0 });
const hoy = () => new Date().toISOString().slice(0, 10);

const form = ref({
    invoice_uuid: '',
    correction_concept_code: '1',
    observation: '',
    issue_date: hoy(),
    payment_method_uuid: null,
    items: [nuevoItem()],
});

const errores = ref({});
const guardando = ref(false);
const cargandoFacturas = ref(false);
const facturas = ref([]);

const facturasOptions = computed(() => {
    const permitidos = esCredito.value
        ? ['EMITIDA_INTERNA', 'PAGADA_PARCIAL', 'VENCIDA']
        : ['EMITIDA_INTERNA', 'PAGADA_PARCIAL', 'VENCIDA', 'PAGADA'];
    return facturas.value
        .filter((f) => permitidos.includes(f.status))
        .map((f) => {
            const cliente = f.customer?.company_name || f.customer?.trade_name
                || [f.customer?.first_name, f.customer?.last_name].filter(Boolean).join(' ')
                || 'Sin cliente';
            return {
                uuid: f.uuid,
                label: `${f.invoice_number} — ${cliente} ($${formatear(f.invoice_total)})`,
            };
        });
});

const metodosPagoOptions = computed(() =>
    (store.catalogs.metodosPago || []).map((m) => ({ uuid: m.uuid, label: m.name || m.description || m.code })),
);

const totalLinea = (item) => {
    const base = Math.max(0, (Number(item.quantity) || 0) * (Number(item.unit_price) || 0) - (Number(item.discount_amount) || 0));
    const iva = base * ((Number(item.tax_rate) || 0) / 100);
    return base + iva;
};

const totales = computed(() => {
    let subtotal = 0;
    let iva = 0;
    for (const item of form.value.items) {
        const base = Math.max(0, (Number(item.quantity) || 0) * (Number(item.unit_price) || 0) - (Number(item.discount_amount) || 0));
        subtotal += base;
        iva += base * ((Number(item.tax_rate) || 0) / 100);
    }
    return { subtotal, iva, total: subtotal + iva };
});

const formatear = (valor) => Number(valor || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const agregarItem = () => form.value.items.push(nuevoItem());
const quitarItem = (idx) => form.value.items.splice(idx, 1);

const alAbrir = async () => {
    errores.value = {};
    form.value = {
        invoice_uuid: props.initialInvoiceUuid || '',
        correction_concept_code: esCredito.value ? '2' : '1',
        observation: '',
        issue_date: hoy(),
        payment_method_uuid: null,
        items: [nuevoItem()],
    };

    cargandoFacturas.value = true;
    try {
        const [resFacturas] = await Promise.all([
            billingService.list({ invoice_type: 'FACTURA_VENTA', per_page: 100 }),
            store.catalogs.metodosPago?.length ? Promise.resolve() : store.loadCatalogs().catch(() => null),
        ]);
        const body = resFacturas?.data ?? resFacturas;
        facturas.value = body?.data ?? [];
    } finally {
        cargandoFacturas.value = false;
    }
};

const validar = () => {
    const e = {};
    if (!form.value.invoice_uuid) e.invoice_uuid = 'Selecciona la factura afectada.';
    if (!form.value.issue_date) e.issue_date = 'La fecha de emisión es obligatoria.';
    if (!form.value.correction_concept_code) e.correction_concept_code = 'Selecciona el concepto DIAN.';
    if (!form.value.items.length || form.value.items.some((i) => !String(i.description || '').trim())) {
        e.items = 'Todos los ítems deben tener descripción.';
    }
    errores.value = e;
    return Object.keys(e).length === 0;
};

const guardar = async () => {
    if (!validar()) return;
    guardando.value = true;
    try {
        const servicio = esCredito.value ? creditNotesService : debitNotesService;
        const payload = {
            invoice_uuid: form.value.invoice_uuid,
            correction_concept_code: form.value.correction_concept_code,
            observation: form.value.observation?.trim() || null,
            issue_date: form.value.issue_date,
            payment_method_uuid: form.value.payment_method_uuid || null,
            items: form.value.items.map((i) => ({
                description: i.description.trim(),
                quantity: Number(i.quantity) || 1,
                unit_price: Number(i.unit_price) || 0,
                discount_amount: Number(i.discount_amount) || 0,
                tax_rate: Number(i.tax_rate) || 0,
            })),
        };
        const res = await servicio.create(payload);
        await toast('¡Éxito!', `Nota ${esCredito.value ? 'crédito' : 'débito'} creada en borrador.`, 'success');
        visibleModel.value = false;
        emit('created', res?.data ?? res);
    } catch (error) {
        const msg = error?.response?.data?.message || error?.message || 'No se pudo guardar la nota.';
        await toast('Error', msg, 'error');
    } finally {
        guardando.value = false;
    }
};
</script>
