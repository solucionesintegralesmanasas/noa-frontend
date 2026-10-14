<template>
    <div class="row g-2 g-md-3">
        <div class="col-12 col-xxl-10 offset-xxl-1 col-xl-12">
            <BasePageHeader
                :title="pageTitle"
                :subtitle="pageSubtitle"
                icon="fad fa-file-invoice-dollar text-primary"
                :breadcrumbs="breadcrumbs"
                :show-back="true"
                @back="goBack"
            />

            <div class="card border-0 shadow-sm fade-in-up" style="animation-delay: 0.1s;">
                <div class="card-header bg-light py-2 px-3 border-bottom">
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                        <i class="fad fa-file-invoice text-primary" aria-hidden="true"></i>
                        <h5 class="mb-0 fw-medium">{{ esCotizacion ? 'Datos de la cotización' : 'Datos de la factura interna' }}</h5>
                        <span class="badge bg-primary bg-opacity-10 text-primary ms-2">
                            <i class="fad fa-asterisk me-1" style="font-size: 8px;" aria-hidden="true"></i>Campos obligatorios
                        </span>
                    </div>
                </div>

                <div class="card-body p-2 p-md-3 p-lg-4">
                    <div v-if="resumenErrores.length" class="alert alert-danger" :id="errorSummaryId" role="alert" tabindex="-1">
                        <ul class="mb-0">
                            <li v-for="(msg, i) in resumenErrores" :key="i">{{ msg }}</li>
                        </ul>
                    </div>

                    <form @submit.prevent="handleSubmit" class="row g-3" novalidate>
                        <!-- SECCIÓN 1: Documento -->
                        <div class="col-12">
                            <div class="section-title">
                                <span class="section-step">1</span>
                                <span class="fw-medium">Documento</span>
                                <small class="text-muted ms-2 d-none d-md-inline">Cliente y fechas</small>
                            </div>
                        </div>

                        <div v-if="isSuperAdmin" class="col-12 col-md-6">
                            <label class="form-label required" for="f-company_uuid">Empresa</label>
                            <PrimeSelect v-model="formData.company_uuid" :options="empresaOptions"
                                input-id="f-company_uuid" optionLabel="label" optionValue="uuid"
                                filter showClear placeholder="Seleccione empresa..."
                                :invalid="!!errors.company_uuid" v-bind="fieldAria('company_uuid')"
                                class="w-100" style="width:100%;" />
                            <div v-if="errors.company_uuid" class="invalid-feedback d-block" id="f-company_uuid-error" role="alert">
                                {{ errors.company_uuid }}
                            </div>
                        </div>

                        <div class="col-12 col-md-6">
                            <label class="form-label required" for="f-third_party_uuid">Cliente</label>
                            <PrimeSelect v-model="formData.third_party_uuid" :options="clienteOptions"
                                input-id="f-third_party_uuid" optionLabel="label" optionValue="uuid"
                                filter showClear placeholder="Seleccione cliente..."
                                :invalid="!!errors.third_party_uuid" v-bind="fieldAria('third_party_uuid')"
                                class="w-100" style="width:100%;" />
                            <div v-if="errors.third_party_uuid" class="invalid-feedback d-block" id="f-third_party_uuid-error" role="alert">
                                {{ errors.third_party_uuid }}
                            </div>
                            <div v-else-if="!clienteOptions.length" class="form-text text-warning">
                                <i class="fad fa-exclamation-triangle me-1" aria-hidden="true"></i>No hay terceros marcados como cliente. Edita un tercero y activa «Cliente».
                            </div>
                        </div>

                        <div class="col-12 col-sm-6 col-md-3">
                            <label class="form-label required" for="f-issue_date">Fecha de emisión</label>
                            <DateInput id="f-issue_date" v-model="formData.issue_date" class="form-control"
                                :class="{ 'is-invalid': errors.issue_date }" :invalid="!!errors.issue_date" v-bind="fieldAria('issue_date')" />
                            <div v-if="errors.issue_date" class="invalid-feedback d-block" id="f-issue_date-error" role="alert">
                                {{ errors.issue_date }}
                            </div>
                        </div>

                        <div v-if="esCotizacion" class="col-12 col-sm-6 col-md-3">
                            <label class="form-label" for="f-valid_until">Vigente hasta</label>
                            <DateInput id="f-valid_until" v-model="formData.valid_until" class="form-control"
                                :class="{ 'is-invalid': errors.valid_until }" :invalid="!!errors.valid_until" v-bind="fieldAria('valid_until')" />
                            <div v-if="errors.valid_until" class="invalid-feedback d-block" id="f-valid_until-error" role="alert">
                                {{ errors.valid_until }}
                            </div>
                        </div>

                        <div v-else class="col-12 col-sm-6 col-md-3">
                            <label class="form-label" for="f-due_date">Vencimiento</label>
                            <DateInput id="f-due_date" v-model="formData.due_date" class="form-control"
                                :class="{ 'is-invalid': errors.due_date }" :invalid="!!errors.due_date" v-bind="fieldAria('due_date')" />
                            <div v-if="errors.due_date" class="invalid-feedback d-block" id="f-due_date-error" role="alert">
                                {{ errors.due_date }}
                            </div>
                        </div>

                        <div v-if="!esCotizacion" class="col-12 col-md-6">
                            <label class="form-label required" for="f-billing_resolution_uuid">Resolución</label>
                            <PrimeSelect v-model="formData.billing_resolution_uuid" :options="resolucionOptions"
                                input-id="f-billing_resolution_uuid" optionLabel="label" optionValue="uuid"
                                filter showClear placeholder="Seleccione resolución..."
                                :invalid="!!errors.billing_resolution_uuid" v-bind="fieldAria('billing_resolution_uuid')"
                                class="w-100" style="width:100%;" />
                            <div v-if="errors.billing_resolution_uuid" class="invalid-feedback d-block" id="f-billing_resolution_uuid-error" role="alert">
                                {{ errors.billing_resolution_uuid }}
                            </div>
                        </div>

                        <div class="col-12 col-md-6">
                            <label class="form-label" for="f-payment_method_uuid">Forma de pago</label>
                            <PrimeSelect v-model="formData.payment_method_uuid" :options="metodoPagoOptions"
                                input-id="f-payment_method_uuid" optionLabel="label" optionValue="uuid"
                                filter showClear placeholder="Seleccione forma de pago..."
                                class="w-100" style="width:100%;" />
                        </div>

                        <!-- SECCIÓN 2: Ítems -->
                        <div class="col-12 mt-4">
                            <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                                <div class="section-title mb-0 flex-grow-1">
                                    <span class="section-step">2</span>
                                    <span class="fw-medium">Ítems del servicio</span>
                                    <span class="badge bg-secondary bg-opacity-10 text-secondary ms-2">
                                        {{ formData.items.length }} ítem{{ formData.items.length !== 1 ? 's' : '' }}
                                    </span>
                                </div>
                                <button type="button" class="btn btn-sm btn-soft-primary" @click="agregarItem">
                                    <i class="fad fa-plus me-1" aria-hidden="true" />Agregar ítem
                                </button>
                            </div>
                        </div>

                        <div class="col-12">
                            <div v-if="!formData.items.length" class="alert alert-light border small py-2 mb-2">
                                <i class="fad fa-info-circle me-1" aria-hidden="true" />Agrega al menos un ítem. El transporte especial es excluido de IVA (tarifa 0).
                            </div>

                            <div v-for="(row, index) in formData.items" :key="row.key" class="item-card rounded-3 p-3 mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="item-number">
                                        <i class="fad fa-box me-1" aria-hidden="true"></i>Ítem {{ index + 1 }}
                                    </span>
                                    <div class="d-flex align-items-center gap-2">
                                        <span class="item-subtotal">Subtotal: <strong>${{ formatMoney(subtotalItem(row)) }}</strong></span>
                                        <button type="button" class="btn btn-sm btn-falcon-danger"
                                            :disabled="formData.items.length === 1" :aria-label="`Quitar ítem ${index + 1}`" @click="quitarItem(index)">
                                            <i class="fal fa-trash" aria-hidden="true" />
                                            <span class="d-none d-sm-inline ms-1">Quitar</span>
                                        </button>
                                    </div>
                                </div>
                                <div class="row gx-2 gy-2 align-items-end">
                                    <div class="col-12">
                                        <label class="form-label small text-muted mb-1 d-block" :for="`f-item-${row.key}-descripcion`">Descripción</label>
                                        <input :id="`f-item-${row.key}-descripcion`" v-model="row.description" class="form-control"
                                            type="text" placeholder="Ej: Servicio de transporte especial mensual" maxlength="500" />
                                    </div>
                                    <div class="col-6 col-md-3">
                                        <label class="form-label small text-muted mb-1 d-block" :for="`f-item-${row.key}-cantidad`">Cantidad</label>
                                        <input :id="`f-item-${row.key}-cantidad`" v-model.number="row.quantity" class="form-control" type="number" min="0" step="0.01" />
                                    </div>
                                    <div class="col-6 col-md-3">
                                        <label class="form-label small text-muted mb-1 d-block" :for="`f-item-${row.key}-precio`">Precio unitario</label>
                                        <div class="input-group">
                                            <span class="input-group-text">$</span>
                                            <input :id="`f-item-${row.key}-precio`" v-model.number="row.unit_price" class="form-control" type="number" min="0" step="0.01" />
                                        </div>
                                    </div>
                                    <div class="col-6 col-md-3">
                                        <label class="form-label small text-muted mb-1 d-block" :for="`f-item-${row.key}-descuento`">Descuento</label>
                                        <div class="input-group">
                                            <span class="input-group-text">$</span>
                                            <input :id="`f-item-${row.key}-descuento`" v-model.number="row.discount_amount" class="form-control" type="number" min="0" step="0.01" />
                                        </div>
                                    </div>
                                    <div class="col-6 col-md-3">
                                        <label class="form-label small text-muted mb-1 d-block" :for="`f-item-${row.key}-iva`">IVA</label>
                                        <div class="input-group">
                                            <input :id="`f-item-${row.key}-iva`" v-model.number="row.tax_rate" class="form-control" type="number" min="0" max="100" step="0.01" />
                                            <span class="input-group-text">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div v-if="errors.items" class="invalid-feedback d-block mt-0" id="f-items-error" role="alert">
                                {{ errors.items }}
                            </div>

                            <!-- Resumen de totales -->
                            <div class="totals-card rounded-3 p-3 ms-md-auto mt-2" aria-live="polite">
                                <div class="d-flex justify-content-between small text-muted mb-1">
                                    <span>Subtotal</span><span>${{ formatMoney(totales.subtotal) }}</span>
                                </div>
                                <div class="d-flex justify-content-between small text-muted mb-1">
                                    <span>Descuentos</span><span>- ${{ formatMoney(totales.descuento) }}</span>
                                </div>
                                <div class="d-flex justify-content-between small text-muted mb-2">
                                    <span>IVA</span><span>${{ formatMoney(totales.iva) }}</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                                    <span class="fw-medium">Total</span>
                                    <span class="totals-total">${{ totalCalculado }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- SECCIÓN 3: Observaciones -->
                        <div class="col-12 mt-4">
                            <div class="section-title">
                                <span class="section-step">3</span>
                                <span class="fw-medium">Observaciones</span>
                                <small class="text-muted ms-2 d-none d-md-inline">Opcional</small>
                            </div>
                        </div>

                        <div class="col-12 col-md-6">
                            <label class="form-label" for="f-notes">Notas</label>
                            <textarea id="f-notes" v-model="formData.notes" class="form-control" rows="3" maxlength="2000" />
                        </div>

                        <div class="col-12 col-md-6">
                            <label class="form-label" for="f-terms">Condiciones comerciales</label>
                            <textarea id="f-terms" v-model="formData.terms" class="form-control" rows="3" maxlength="2000"
                                placeholder="Ej: Pago a 30 días mes vencido. Oferta válida por 30 días." />
                        </div>

                        <div class="col-12">
                            <BaseFormActions :submitting="isSubmitting" :is-edit-mode="isEditMode" @cancel="goBack" />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBillingStore } from '../store/billing.store.js';
import { billingService } from '../services/billing.service.js';
import { usePermissionsStore, useUserStore } from '@store';
import { toast } from '@/utils/toast.js';
import { useAccessibleForm } from '@/hooks/useAccessibleForm.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import PrimeSelect from '@/components/form/PrimeSelect.vue';
import DateInput from '@/components/form/DateInput.vue';
import BaseFormActions from '@/components/BaseFormActions.vue';

const route = useRoute();
const router = useRouter();
const store = useBillingStore();
const userStore = useUserStore();
const permissionsStore = usePermissionsStore();

const esCotizacion = computed(() => route.path.includes('/cotizaciones/') || (route.params.id && store.selectedItem?.invoice_type === 'COTIZACION'));
const isEditMode = computed(() => Boolean(route.params.id));

const pageTitle = computed(() => {
    if (isEditMode.value) return 'Editar Documento';
    return esCotizacion.value ? 'Nueva Cotización' : 'Nueva Factura Interna';
});
const pageSubtitle = computed(() => esCotizacion.value
    ? 'Completa los datos para cotizar el servicio de transporte'
    : 'Genera la factura interna (sin facturación electrónica)');
const breadcrumbs = computed(() => [
    { label: 'Comercial' },
    { label: 'Facturación', to: '/facturacion' },
    { label: isEditMode.value ? 'Editar' : 'Nuevo' },
]);

const { formData, errors, isSubmitting, errorSummaryId, fieldAria, validateAndFocus, focusFirstError, submit } = useAccessibleForm(
    {
        company_uuid: '',
        third_party_uuid: '',
        issue_date: '',
        valid_until: '',
        due_date: '',
        billing_resolution_uuid: '',
        payment_method_uuid: '',
        notes: '',
        terms: '',
        items: [],
    },
    {
        third_party_uuid: { required: true, label: 'Cliente' },
        issue_date: { required: true, label: 'Fecha de emisión' },
    }
);

const resumenErrores = computed(() => Object.values(errors));

let contador = 0;
const siguienteClave = () => ++contador;

const isSuperAdmin = computed(() => Boolean(permissionsStore.roles?.includes('SUPERADMIN')));
const empresaOptions = computed(() =>
    (store?.catalogs?.companies || []).map((c) => ({ uuid: c.uuid, label: c.business_name || c.name || 'Empresa' }))
);

const clienteOptions = computed(() =>
    (store?.catalogs?.clientes || []).map((c) => ({
        uuid: c.uuid,
        label: c.company_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.document_number || 'Cliente',
    }))
);
const resolucionOptions = computed(() =>
    (store?.catalogs?.resoluciones || []).map((r) => ({ uuid: r.uuid, label: `${r.invoice_prefix} (${r.invoice_start_number}-${r.invoice_end_number})` }))
);
const metodoPagoOptions = computed(() =>
    (store?.catalogs?.metodosPago || []).map((m) => ({ uuid: m.uuid, label: m.name || m.dian_code || 'Pago' }))
);

const subtotalItem = (row) => Number(row.quantity || 0) * Number(row.unit_price || 0);
const baseItem = (row) => subtotalItem(row) - Number(row.discount_amount || 0);
const formatMoney = (value) => Number(value || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const totales = computed(() => {
    let subtotal = 0;
    let descuento = 0;
    let iva = 0;
    for (const row of formData.items) {
        subtotal += subtotalItem(row);
        descuento += Number(row.discount_amount || 0);
        iva += (baseItem(row) * Number(row.tax_rate || 0)) / 100;
    }
    return { subtotal, descuento, iva, total: subtotal - descuento + iva };
});

const totalCalculado = computed(() => totales.value.total.toLocaleString('es-CO', { minimumFractionDigits: 2 }));


const goBack = () => router.push('/facturacion');

const agregarItem = () => {
    formData.items.push({
        key: siguienteClave(),
        description: '',
        quantity: 1,
        unit_price: 0,
        discount_amount: 0,
        tax_rate: 0,
    });
};

const quitarItem = (index) => {
    if (formData.items.length === 1) return;
    formData.items.splice(index, 1);
};

const validarItems = () => {
    if (!formData.items.length) {
        errors.items = 'El documento debe tener al menos un ítem';
        return false;
    }
    for (let i = 0; i < formData.items.length; i++) {
        const row = formData.items[i];
        if (!row.description || !row.description.trim()) {
            errors.items = `Ítem ${i + 1}: la descripción es obligatoria`;
            return false;
        }
        if (Number(row.quantity) < 0 || Number(row.unit_price) < 0) {
            errors.items = `Ítem ${i + 1}: cantidad y precio no pueden ser negativos`;
            return false;
        }
    }
    delete errors.items;
    return true;
};

const armarPayload = () => ({
    company_uuid: formData.company_uuid,
    third_party_uuid: formData.third_party_uuid,
    issue_date: formData.issue_date,
    valid_until: formData.valid_until || undefined,
    due_date: formData.due_date || undefined,
    billing_resolution_uuid: formData.billing_resolution_uuid || undefined,
    payment_method_uuid: formData.payment_method_uuid || undefined,
    notes: formData.notes?.trim() || undefined,
    terms: formData.terms?.trim() || undefined,
    items: formData.items.map(({ description, quantity, unit_price, discount_amount, tax_rate }) => ({
        description: description.trim(),
        quantity: Number(quantity) || 0,
        unit_price: Number(unit_price) || 0,
        discount_amount: Number(discount_amount) || 0,
        tax_rate: Number(tax_rate) || 0,
    })),
});

const aplicarErroresBackend = (error) => {
    const data = error?.response?.data;
    const detalles = data?.error?.details;
    if (error?.response?.status === 422 && Array.isArray(detalles)) {
        for (const { field, messages } of detalles) {
            const mensaje = (messages || []).join(' ');
            // items.0.description -> errors.items (el resumen muestra el detalle completo)
            const clave = field.startsWith('items') ? 'items' : field;
            errors[clave] = errors[clave] ? `${errors[clave]} ${mensaje}` : mensaje;
        }
        return true;
    }
    // Regla de negocio rechazada por el servicio (p. ej. cliente inválido).
    if (data?.error?.code === 'RUNTIME_ERROR' && data?.message) {
        const clave = /cliente/i.test(data.message) ? 'third_party_uuid' : 'general';
        errors[clave] = data.message;
        return true;
    }
    return false;
};

const handleSubmit = () => submit(async () => {
    const valido = await validateAndFocus();
    if (!formData.company_uuid && isSuperAdmin.value) {
        errors.company_uuid = 'Debe seleccionar una empresa';
        await focusFirstError();
        return;
    }
    if (!valido || !validarItems()) {
        if (!valido) return;
        await toast('Atención', errors.items, 'warning');
        return;
    }
    if (!esCotizacion.value && !isEditMode.value && !formData.billing_resolution_uuid) {
        errors.billing_resolution_uuid = 'La resolución es obligatoria';
        return;
    }

    const payload = armarPayload();
    try {
        if (isEditMode.value) {
            await store.actualizar(route.params.id, payload);
            router.push(`/facturacion/${route.params.id}`);
        } else if (esCotizacion.value) {
            const cotizacion = await store.crearCotizacion(payload);
            router.push(`/facturacion/${cotizacion.uuid}`);
        } else {
            const factura = await store.crearFactura(payload);
            router.push(`/facturacion/${factura.uuid}`);
        }
    } catch (error) {
        if (!aplicarErroresBackend(error)) throw error;
        await focusFirstError();
    }
});


watch(() => formData.company_uuid, async (nueva, anterior) => {
    if (!nueva || nueva === anterior || !isSuperAdmin.value) return;
    store.catalogs.clientes = await billingService.listarClientes(nueva);
    if (!clienteOptions.value.some((c) => c.uuid === formData.third_party_uuid)) {
        formData.third_party_uuid = '';
    }
});

onMounted(async () => {
    try {
        await store.loadCatalogs();
        formData.company_uuid = userStore.company_uuid || userStore.companies?.[0]?.uuid || '';
        if (!formData.company_uuid && store.catalogs.companies?.length === 1) {
            formData.company_uuid = store.catalogs.companies[0].uuid;
        }
        if (isEditMode.value) {
            const record = await store.fetchProfileById(route.params.id);
            if (!record) return;
            formData.third_party_uuid = record.third_party_uuid || '';
            formData.issue_date = record.issue_date || '';
            formData.valid_until = record.valid_until || '';
            formData.due_date = record.due_date || '';
            formData.payment_method_uuid = record.payment_method_uuid || '';
            formData.notes = record.notes || '';
            formData.terms = record.terms || '';
            for (const item of record.items || []) {
                formData.items.push({
                    key: siguienteClave(),
                    description: item.description || '',
                    quantity: item.quantity ?? 1,
                    unit_price: item.unit_price ?? 0,
                    discount_amount: item.discount_amount ?? 0,
                    tax_rate: item.tax_rate ?? 0,
                });
            }
        }
        if (!formData.items.length) agregarItem();
    } catch (_e) { /* el store ya notificó */ }
});
</script>

<style scoped>
.card { border-radius: 0.625rem !important; }
.required::after { content: " *"; color: #dc3545; font-weight: 600; }
.bg-opacity-10 { --bs-bg-opacity: 0.1; }
.btn-soft-primary { background: rgba(13, 110, 253, 0.1); color: #0d6efd; border: 1px solid rgba(13, 110, 253, 0.2); }
.btn-falcon-danger { background: #f8f9fa; border-color: #e9ecef; color: #dc3545; }
:focus-visible { outline: 2px solid #0d6efd !important; outline-offset: 2px !important; }

.section-title { display: flex; align-items: center; gap: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e9ecef; color: #495057; }
.section-step { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: rgba(13, 110, 253, 0.1); color: #0d6efd; font-size: 0.75rem; font-weight: 600; flex-shrink: 0; }

.item-card { background: #f8f9fa; border: 1px solid #e9ecef; border-left: 3px solid #0d6efd; transition: box-shadow 0.15s ease; }
.item-card:hover, .item-card:focus-within { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06); }
.item-number { font-size: 0.8rem; font-weight: 600; color: #0d6efd; text-transform: uppercase; letter-spacing: 0.03em; }
.item-subtotal { font-size: 0.85rem; color: #6c757d; }
.item-subtotal strong { color: #212529; }

.totals-card { max-width: 340px; background: rgba(13, 110, 253, 0.04); border: 1px solid rgba(13, 110, 253, 0.15); }
.totals-total { font-size: 1.25rem; font-weight: 700; color: #0d6efd; }

</style>
