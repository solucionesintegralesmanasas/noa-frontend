<template>
    <BasePageHeader title="Resoluciones de facturación" subtitle="Rangos internos para numerar las facturas"
        icon="fad fa-stamp text-primary" :show-back="true"
        :breadcrumbs="[{ label: 'Comercial' }, { label: 'Facturación', to: '/facturacion' }, { label: 'Resoluciones' }]"
        @back="goBack" />

    <div class="row g-2 g-md-3">
        <div class="col-12 col-lg-5">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-light py-2 px-3 border-bottom">
                    <h6 class="mb-0 fw-medium">Nueva resolución</h6>
                </div>
                <div class="card-body">
                    <form @submit.prevent="handleSubmit" class="row g-2" novalidate>
                        <div class="col-6">
                            <label class="form-label required" for="f-invoice_prefix">Prefijo</label>
                            <input id="f-invoice_prefix" v-model="formData.invoice_prefix" class="form-control"
                                :class="{ 'is-invalid': errors.invoice_prefix }" type="text" placeholder="Ej: TSB"
                                maxlength="10" :aria-invalid="!!errors.invoice_prefix" :aria-describedby="errors.invoice_prefix ? 'f-invoice_prefix-error' : undefined" />
                            <div v-if="errors.invoice_prefix" class="invalid-feedback d-block" id="f-invoice_prefix-error" role="alert">
                                {{ errors.invoice_prefix }}
                            </div>
                        </div>
                        <div class="col-6">
                            <label class="form-label" for="f-resolution_number">No. resolución DIAN</label>
                            <input id="f-resolution_number" v-model="formData.resolution_number" class="form-control"
                                type="text" placeholder="Vacío = rango interno" maxlength="50" />
                        </div>
                        <div class="col-6">
                            <label class="form-label required" for="f-invoice_start_number">Desde</label>
                            <input id="f-invoice_start_number" v-model.number="formData.invoice_start_number" class="form-control"
                                :class="{ 'is-invalid': errors.invoice_start_number }" type="number" min="1" step="1"
                                :aria-invalid="!!errors.invoice_start_number" :aria-describedby="errors.invoice_start_number ? 'f-invoice_start_number-error' : undefined" />
                            <div v-if="errors.invoice_start_number" class="invalid-feedback d-block" id="f-invoice_start_number-error" role="alert">
                                {{ errors.invoice_start_number }}
                            </div>
                        </div>
                        <div class="col-6">
                            <label class="form-label required" for="f-invoice_end_number">Hasta</label>
                            <input id="f-invoice_end_number" v-model.number="formData.invoice_end_number" class="form-control"
                                :class="{ 'is-invalid': errors.invoice_end_number }" type="number" min="1" step="1"
                                :aria-invalid="!!errors.invoice_end_number" :aria-describedby="errors.invoice_end_number ? 'f-invoice_end_number-error' : undefined" />
                            <div v-if="errors.invoice_end_number" class="invalid-feedback d-block" id="f-invoice_end_number-error" role="alert">
                                {{ errors.invoice_end_number }}
                            </div>
                        </div>
                        <div class="col-6">
                            <label class="form-label required" for="f-start_date">Vigencia desde</label>
                            <DateInput id="f-start_date" v-model="formData.start_date"
                                :invalid="!!errors.start_date" v-bind="fieldAria('start_date')" />
                            <div v-if="errors.start_date" class="invalid-feedback d-block" id="f-start_date-error" role="alert">
                                {{ errors.start_date }}
                            </div>
                        </div>
                        <div class="col-6">
                            <label class="form-label required" for="f-end_date">Vigencia hasta</label>
                            <DateInput id="f-end_date" v-model="formData.end_date"
                                :invalid="!!errors.end_date" v-bind="fieldAria('end_date')" />
                            <div v-if="errors.end_date" class="invalid-feedback d-block" id="f-end_date-error" role="alert">
                                {{ errors.end_date }}
                            </div>
                        </div>
                        <div class="col-12">
                            <label class="form-label" for="f-description">Descripción</label>
                            <input id="f-description" v-model="formData.description" class="form-control"
                                type="text" placeholder="Ej: Rango interno 2026" maxlength="255" />
                        </div>
                        <div class="col-12">
                            <BaseFormActions :submitting="isSubmitting" :is-edit-mode="false" submit-label="Registrar resolución" @cancel="goBack" />
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <div class="col-12 col-lg-7">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-light py-2 px-3 border-bottom">
                    <h6 class="mb-0 fw-medium">Resoluciones registradas</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <DataTable :value="store.resolutions" :loading="store.loading" responsiveLayout="scroll"
                            tableStyle="min-width: 30rem" class="table table-sm mb-0" emptyMessage="Sin resoluciones registradas">
                            <Column field="invoice_prefix" header="Prefijo" style="width: 90px;">
                                <template #body="{ data }"><strong>{{ data.invoice_prefix }}</strong></template>
                            </Column>
                            <Column header="Rango">
                                <template #body="{ data }">{{ data.invoice_start_number }} – {{ data.invoice_end_number }} (va en {{ data.last_consecutive }})</template>
                            </Column>
                            <Column header="Vigencia">
                                <template #body="{ data }">{{ data.start_date }} al {{ data.end_date }}</template>
                            </Column>
                            <Column field="is_active" header="Estado" style="width: 110px;" class="text-center">
                                <template #body="{ data }">
                                    <span class="badge rounded-pill" :class="data.is_active ? 'bg-success' : 'bg-secondary'">
                                        {{ data.is_active ? 'Vigente' : 'Inactiva' }}
                                    </span>
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useBillingStore } from '../store/billing.store.js';
import { useUserStore } from '@store';
import { useAccessibleForm } from '@/hooks/useAccessibleForm.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import BaseFormActions from '@/components/BaseFormActions.vue';
import DateInput from '@/components/form/DateInput.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const router = useRouter();
const store = useBillingStore();
const userStore = useUserStore();

const goBack = () => router.push('/facturacion');

const { formData, errors, isSubmitting, fieldAria, validateAndFocus, submit } = useAccessibleForm(
    {
        company_uuid: '',
        resolution_type_code: '01',
        invoice_prefix: '',
        resolution_number: '',
        invoice_start_number: 1,
        invoice_end_number: 1000,
        start_date: '',
        end_date: '',
        description: '',
        is_active: true,
    },
    {
        invoice_prefix: { required: true, label: 'Prefijo', maxLength: 10 },
        start_date: { required: true, label: 'Vigencia desde' },
        end_date: { required: true, label: 'Vigencia hasta' },
    }
);

const handleSubmit = () => submit(async () => {
    if (!(await validateAndFocus())) return;
    if (Number(formData.invoice_end_number) <= Number(formData.invoice_start_number)) {
        errors.invoice_end_number = 'El rango final debe ser mayor que el inicial';
        return;
    }
    await store.createResolution({
        company_uuid: formData.company_uuid,
        resolution_type_code: '01',
        invoice_prefix: formData.invoice_prefix.trim().toUpperCase(),
        resolution_number: formData.resolution_number?.trim() || undefined,
        invoice_start_number: Number(formData.invoice_start_number),
        invoice_end_number: Number(formData.invoice_end_number),
        start_date: formData.start_date,
        end_date: formData.end_date,
        description: formData.description?.trim() || undefined,
        is_active: true,
    });
    formData.invoice_prefix = '';
    formData.resolution_number = '';
    formData.description = '';
});

onMounted(async () => {
    formData.company_uuid = userStore.company_uuid || userStore.companies?.[0]?.uuid || '';
    try { await store.fetchResolutions(); } catch (_e) { /* el store ya notificó */ }
});
</script>

<style scoped>
.card { border-radius: 0.75rem !important; }
.required::after { content: " *"; color: #dc3545; font-weight: 600; }
:focus-visible { outline: 2px solid #0d6efd !important; outline-offset: 2px !important; }
</style>
