<template>
    <div class="row g-2 g-md-3">
        <div class="col-12 col-xxl-10 offset-xxl-1 col-xl-12">

            <BasePageHeader
                :title="pageTitle"
                :subtitle="pageSubtitle"
                icon="fad fa-percent text-primary"
                :breadcrumbs="breadcrumbs"
                :show-back="true"
                @back="goBack"
            />

            <div class="card border-0 shadow-sm fade-in-up" style="animation-delay: 0.1s;">
                <div class="card-header bg-light py-2 px-3 border-bottom">
                    <div class="d-flex align-items-center gap-2">
                        <i class="fad fa-percent text-primary" aria-hidden="true"></i>
                        <h5 class="mb-0 fw-medium">Información de la retención</h5>
                        <span class="badge bg-primary bg-opacity-10 text-primary ms-2">
                            <i class="fad fa-asterisk me-1" style="font-size: 8px;" aria-hidden="true"></i>Campos obligatorios
                        </span>
                    </div>
                </div>

                <div class="card-body p-2 p-md-3 p-lg-4 p-md-4">
                    <form ref="formRef" @submit.prevent="handleSubmit" class="row g-2 g-md-3" novalidate>

                        <div class="col-12 col-sm-6 col-md-4 col-lg-3">
                            <label class="form-label required" for="f-code">Código</label>
                            <input id="f-code" v-model="formData.code" class="form-control"
                                :class="{ 'is-invalid': validationErrors.code }" type="text" autocomplete="off"
                                maxlength="20" placeholder="Ej: RETE001"
                                :aria-invalid="!!validationErrors.code" :aria-describedby="validationErrors.code ? 'f-code-error' : undefined" />
                            <div v-if="validationErrors.code" class="invalid-feedback d-block" id="f-code-error" role="alert">
                                {{ validationErrors.code }}
                            </div>
                        </div>

                        <div class="col-12 col-sm-6 col-md-8 col-lg-5">
                            <label class="form-label required" for="f-name">Nombre</label>
                            <input id="f-name" v-model="formData.name" class="form-control"
                                :class="{ 'is-invalid': validationErrors.name }" type="text" autocomplete="off"
                                maxlength="150" placeholder="Ej: Retención en la fuente por compras"
                                :aria-invalid="!!validationErrors.name" :aria-describedby="validationErrors.name ? 'f-name-error' : undefined" />
                            <div v-if="validationErrors.name" class="invalid-feedback d-block" id="f-name-error" role="alert">
                                {{ validationErrors.name }}
                            </div>
                        </div>

                        <div class="col-12 col-sm-6 col-md-6 col-lg-4">
                            <label class="form-label required" for="f-type">Tipo</label>
                            <PrimeSelect input-id="f-type" v-model="formData.type"
                                :options="typeOptions"
                                option-label="label" option-value="value" placeholder="Seleccionar tipo..."
                                class="w-100" :invalid="!!validationErrors.type"
                                :aria-invalid="!!validationErrors.type" :aria-describedby="validationErrors.type ? 'f-type-error' : undefined" />
                            <div v-if="validationErrors.type" class="invalid-feedback d-block" id="f-type-error" role="alert">
                                {{ validationErrors.type }}
                            </div>
                        </div>

                        <div class="col-12 col-sm-6 col-md-6 col-lg-3">
                            <label class="form-label" for="f-dian_concept">Concepto DIAN</label>
                            <input id="f-dian_concept" v-model="formData.dian_concept" class="form-control"
                                :class="{ 'is-invalid': validationErrors.dian_concept }" type="text" autocomplete="off"
                                maxlength="10" placeholder="Ej: 01"
                                :aria-invalid="!!validationErrors.dian_concept" :aria-describedby="validationErrors.dian_concept ? 'f-dian_concept-error' : undefined" />
                            <div v-if="validationErrors.dian_concept" class="invalid-feedback d-block" id="f-dian_concept-error" role="alert">
                                {{ validationErrors.dian_concept }}
                            </div>
                        </div>

                        <div class="col-12 col-sm-6 col-md-6 col-lg-3">
                            <label class="form-label" for="f-base_minimum">Base mínima</label>
                            <input id="f-base_minimum" v-model.number="formData.base_minimum" class="form-control"
                                :class="{ 'is-invalid': validationErrors.base_minimum }" type="number" min="0" step="0.01"
                                placeholder="0"
                                :aria-invalid="!!validationErrors.base_minimum" :aria-describedby="validationErrors.base_minimum ? 'f-base_minimum-error' : undefined" />
                            <div v-if="validationErrors.base_minimum" class="invalid-feedback d-block" id="f-base_minimum-error" role="alert">
                                {{ validationErrors.base_minimum }}
                            </div>
                        </div>

                        <div class="col-12 col-sm-6 col-md-6 col-lg-3">
                            <label class="form-label required" for="f-rate">Tarifa (%)</label>
                            <input id="f-rate" v-model.number="formData.rate" class="form-control"
                                :class="{ 'is-invalid': validationErrors.rate }" type="number" min="0" max="100" step="0.01"
                                placeholder="Ej: 2.5"
                                :aria-invalid="!!validationErrors.rate" :aria-describedby="validationErrors.rate ? 'f-rate-error' : undefined" />
                            <div v-if="validationErrors.rate" class="invalid-feedback d-block" id="f-rate-error" role="alert">
                                {{ validationErrors.rate }}
                            </div>
                        </div>

                        <div class="col-12 col-sm-6 col-md-6 col-lg-3">
                            <label class="form-label" for="f-debit_account">Cuenta débito</label>
                            <input id="f-debit_account" v-model="formData.debit_account" class="form-control"
                                :class="{ 'is-invalid': validationErrors.debit_account }" type="text" autocomplete="off"
                                maxlength="20" placeholder="Ej: 236501"
                                :aria-invalid="!!validationErrors.debit_account" :aria-describedby="validationErrors.debit_account ? 'f-debit_account-error' : undefined" />
                            <div v-if="validationErrors.debit_account" class="invalid-feedback d-block" id="f-debit_account-error" role="alert">
                                {{ validationErrors.debit_account }}
                            </div>
                        </div>

                        <div class="col-12 col-sm-6 col-md-6 col-lg-3">
                            <label class="form-label" for="f-credit_account">Cuenta crédito</label>
                            <input id="f-credit_account" v-model="formData.credit_account" class="form-control"
                                :class="{ 'is-invalid': validationErrors.credit_account }" type="text" autocomplete="off"
                                maxlength="20" placeholder="Ej: 236502"
                                :aria-invalid="!!validationErrors.credit_account" :aria-describedby="validationErrors.credit_account ? 'f-credit_account-error' : undefined" />
                            <div v-if="validationErrors.credit_account" class="invalid-feedback d-block" id="f-credit_account-error" role="alert">
                                {{ validationErrors.credit_account }}
                            </div>
                        </div>

                        <div class="col-12 col-sm-6 col-md-4 col-lg-3">
                            <label class="form-label required" for="f-applies_purchases">¿Aplica a compras?</label>
                            <PrimeSelect input-id="f-applies_purchases" v-model="formData.applies_purchases"
                                :options="yesNoOptions"
                                option-label="label" option-value="value" class="w-100"
                                :invalid="!!validationErrors.applies_purchases"
                                :aria-invalid="!!validationErrors.applies_purchases" :aria-describedby="validationErrors.applies_purchases ? 'f-applies_purchases-error' : undefined" />
                            <div v-if="validationErrors.applies_purchases" class="invalid-feedback d-block" id="f-applies_purchases-error" role="alert">
                                {{ validationErrors.applies_purchases }}
                            </div>
                        </div>

                        <div class="col-12 col-sm-6 col-md-4 col-lg-3">
                            <label class="form-label required" for="f-applies_sales">¿Aplica a ventas?</label>
                            <PrimeSelect input-id="f-applies_sales" v-model="formData.applies_sales"
                                :options="yesNoOptions"
                                option-label="label" option-value="value" class="w-100"
                                :invalid="!!validationErrors.applies_sales"
                                :aria-invalid="!!validationErrors.applies_sales" :aria-describedby="validationErrors.applies_sales ? 'f-applies_sales-error' : undefined" />
                            <div v-if="validationErrors.applies_sales" class="invalid-feedback d-block" id="f-applies_sales-error" role="alert">
                                {{ validationErrors.applies_sales }}
                            </div>
                        </div>

                        <div class="col-12 col-sm-6 col-md-4 col-lg-3">
                            <label class="form-label required" for="f-is_active">Estado</label>
                            <PrimeSelect input-id="f-is_active" v-model="formData.is_active"
                                :options="statusOptions"
                                option-label="label" option-value="value" class="w-100"
                                :invalid="!!validationErrors.is_active"
                                :aria-invalid="!!validationErrors.is_active" :aria-describedby="validationErrors.is_active ? 'f-is_active-error' : undefined" />
                            <div v-if="validationErrors.is_active" class="invalid-feedback d-block" id="f-is_active-error" role="alert">
                                {{ validationErrors.is_active }}
                            </div>
                        </div>

                        <div class="col-12">
                            <BaseFormActions :submitting="submitting" :is-edit-mode="isEditMode" @cancel="goBack" />
                        </div>
                    </form>
                </div>
            </div>

            <div class="card border-0 shadow-sm mt-3 fade-in-up" style="animation-delay: 0.2s;">
                <div class="card-body p-2 p-md-3 p-lg-4 p-md-4">
                    <div class="d-flex align-items-start gap-3">
                        <div class="bg-primary bg-opacity-10 rounded-circle p-2 flex-shrink-0">
                            <i class="fad fa-lightbulb text-primary fs-5" aria-hidden="true"></i>
                        </div>
                        <div>
                            <h6 class="fw-medium mb-1">¿Sabías qué?</h6>
                            <p class="text-muted small mb-0">
                                Las retenciones se aplican automáticamente sobre la base mínima definida.
                                Verifica la tarifa y el concepto DIAN antes de guardar para evitar rechazos
                                en la facturación electrónica.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>

<script setup>
/**
 * @author Darwin Montes
 * @version 1.0.0
 * @created_at 2026-09-30
 * @module {Features.Catalogs}
 * @resource {Withholding}
 */

import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useWithholdingsStore } from '../store/withholdings.store.js';
import { useAccessibleForm } from '@/hooks/useAccessibleForm.js';
import { toast } from '@/utils/toast.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import PrimeSelect from '@/components/form/PrimeSelect.vue';
import BaseFormActions from '@/components/BaseFormActions.vue';

// --- STORES Y ROUTER ---
const route = useRoute();
const router = useRouter();
const store = useWithholdingsStore();

// --- ESTADO ---
const isEditMode = computed(() => route.params.id !== undefined);

/** Computed para BasePageHeader (evita expresiones complejas en el template) */
const pageTitle = computed(() => isEditMode.value ? 'Actualizar Retención' : 'Nueva Retención');
const pageSubtitle = computed(() => isEditMode.value ? 'Modifica la información de la retención' : 'Completa los datos para dar de alta una nueva retención');
const breadcrumbs = computed(() => [{ label: 'Retenciones', to: '/configuracion/retenciones' }, { label: isEditMode.value ? 'Editar' : 'Nueva' }]);
const formRef = ref(null);

const typeOptions = [
    { label: 'Retefuente', value: 'RETEFUENTE' },
    { label: 'Reteiva', value: 'RETEIVA' },
    { label: 'Reteica', value: 'RETEICA' },
    { label: 'ReteCREE', value: 'RETECREE' },
    { label: 'Autorretención', value: 'AUTORETENCIÓN' },
];
const yesNoOptions = [
    { label: 'No', value: '0' },
    { label: 'Sí', value: '1' },
];
const statusOptions = [
    { label: 'Activo', value: '1' },
    { label: 'Inactivo', value: '0' },
];

const {
    formData,
    errors: validationErrors,
    isSubmitting: submitting,
    validateAndFocus,
    submit,
} = useAccessibleForm({
    code: '',
    name: '',
    type: '',
    dian_concept: '',
    base_minimum: 0,
    rate: null,
    debit_account: '',
    credit_account: '',
    applies_purchases: '1',
    applies_sales: '0',
    is_active: '1',
}, {
    code: { required: true, label: 'Código', maxLength: 20 },
    name: { required: true, label: 'Nombre', maxLength: 150 },
    type: { required: true, label: 'Tipo' },
    dian_concept: { label: 'Concepto DIAN', maxLength: 10 },
    rate: { required: true, label: 'Tarifa' },
    debit_account: { label: 'Cuenta débito', maxLength: 20 },
    credit_account: { label: 'Cuenta crédito', maxLength: 20 },
    applies_purchases: { required: true, label: 'Aplica a compras' },
    applies_sales: { required: true, label: 'Aplica a ventas' },
    is_active: { required: true, label: 'Estado' },
});

const toBoolean = (v) => v === '1' || v === 1 || v === true;
const toSelect = (v, fallback = '') => {
    if (v === null || v === undefined || v === '') return fallback;
    return (v == 1 || v === true || v === '1') ? '1' : '0';
};

const validateNumbers = () => {
    let valid = true;
    if (formData.rate === null || formData.rate === undefined || formData.rate === '') {
        validationErrors.rate = 'Tarifa es obligatoria';
        valid = false;
    } else if (Number.isNaN(Number(formData.rate)) || Number(formData.rate) < 0 || Number(formData.rate) > 100) {
        validationErrors.rate = 'La tarifa debe estar entre 0 y 100';
        valid = false;
    }
    if (formData.base_minimum !== null && formData.base_minimum !== undefined && formData.base_minimum !== '') {
        if (Number.isNaN(Number(formData.base_minimum)) || Number(formData.base_minimum) < 0) {
            validationErrors.base_minimum = 'La base mínima debe ser un número mayor o igual a 0';
            valid = false;
        }
    }
    return valid;
};

const goBack = () => router.push('/configuracion/retenciones');

const handleSubmit = async () => {
    const valid = await submit(async () => validateAndFocus(formRef.value));
    if (!valid || !validateNumbers()) {
        if (!valid || Object.keys(validationErrors).length > 0) {
            await validateAndFocus(formRef.value);
        }
        return toast('Atención', 'Revisa los campos obligatorios', 'warning');
    }

    await submit(async () => {
        let uuid = isEditMode.value ? route.params.id : null;

        const payload = {
            code: formData.code?.trim(),
            name: formData.name?.trim(),
            type: formData.type,
            dian_concept: formData.dian_concept?.trim() || null,
            base_minimum: formData.base_minimum === '' || formData.base_minimum === null ? 0 : Number(formData.base_minimum),
            rate: Number(formData.rate),
            debit_account: formData.debit_account?.trim() || null,
            credit_account: formData.credit_account?.trim() || null,
            applies_purchases: toBoolean(formData.applies_purchases),
            applies_sales: toBoolean(formData.applies_sales),
            is_active: toBoolean(formData.is_active),
        };

        if (isEditMode.value) {
            await store.updateItem(uuid, payload);
        } else {
            await store.createItem(payload);
        }

        goBack();
    });
};

// --- CICLO DE VIDA ---
onMounted(async () => {
    if (isEditMode.value) {
        const item = await store.fetchProfileById(route.params.id);
        if (item) {
            formData.code = item.code || '';
            formData.name = item.name || '';
            formData.type = item.type || '';
            formData.dian_concept = item.dian_concept || '';
            formData.base_minimum = item.base_minimum ?? 0;
            formData.rate = item.rate ?? null;
            formData.debit_account = item.debit_account || '';
            formData.credit_account = item.credit_account || '';
            formData.applies_purchases = toSelect(item.applies_purchases, '1');
            formData.applies_sales = toSelect(item.applies_sales, '0');
            formData.is_active = toSelect(item.is_active, '1');
        }
    }
});
</script>

<style scoped>
.card {
    border-radius: 0.625rem !important;
    transition: box-shadow 150ms ease-in-out;
}

.card:hover {
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
}

.card-header {
    border-radius: 0.625rem 0.625rem 0 0 !important;
    background: linear-gradient(135deg, #f8f9fa, #fff);
}

.required::after {
    content: " *";
    color: #dc3545;
    font-weight: 600;
}

.form-control.is-invalid,
.form-select.is-invalid {
    border-color: #dc3545 !important;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right calc(0.375em + 0.1875rem) center;
    background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}

.invalid-feedback {
    display: block;
    width: 100%;
    margin-top: 0.25rem;
    font-size: 0.875em;
    color: #dc3545;
}

.btn {
    transition: all 150ms ease-in-out;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
}

.btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

.btn-falcon-default {
    background: #f8f9fa;
    border-color: #e9ecef;
    color: #212529;
}

.bg-opacity-10 {
    --bs-bg-opacity: 0.1;
}

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
