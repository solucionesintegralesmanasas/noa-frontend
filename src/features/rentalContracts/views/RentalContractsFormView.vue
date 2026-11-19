<template>
    <div class="row gx-3">
        <div class="col-12 col-xxl-10 offset-xxl-1 col-xl-12">
            <BasePageHeader
                :title="pageTitle"
                subtitle="Crear nuevo contrato de alquiler de vehículo"
                icon="fad fa-car text-primary"
                :breadcrumbs="breadcrumbs"
                :show-back="true"
                @back="goBack"
            />

            <div class="card border-0 shadow-sm fade-in-up" style="animation-delay: 0.1s;">
                <div class="card-header bg-light py-2 px-3 border-bottom">
                    <div class="d-flex align-items-center gap-2">
                        <i class="fad fa-edit text-primary" aria-hidden="true"></i>
                        <h6 class="mb-0 fw-medium">Información del Contrato</h6>
                        <span class="badge bg-primary bg-opacity-10 text-primary ms-2">
                            <i class="fad fa-asterisk me-1" style="font-size: 0.5rem;" aria-hidden="true"></i>Campos obligatorios
                        </span>
                    </div>
                </div>

                <div class="card-body">
                    <form @submit.prevent="handleSubmit" class="row g-3" novalidate>

                        <!-- Vehículo -->
                        <div class="col-12 col-sm-6 col-md-4 col-lg-3">
                            <label class="form-label required" for="vehicle_uuid">Vehículo</label>
                            <PrimeSelect :input-id="'vehicle_uuid'" v-model="formData.vehicle_uuid"
                                :options="store.catalogs.vehicles" option-value="uuid" option-label="vehicle_license_plate"
                                placeholder="Seleccione vehículo..." showClear filter
                                class="w-100" :invalid="!!validationErrors['vehicle_uuid']"
                                :aria-invalid="!!validationErrors['vehicle_uuid']"
                                :aria-describedby="validationErrors['vehicle_uuid'] ? 'f-vehicle_uuid-error' : undefined" />
                            <div v-if="validationErrors.vehicle_uuid" class="invalid-feedback d-block" id="f-vehicle_uuid-error" role="alert">
                                {{ validationErrors.vehicle_uuid }}
                            </div>
                        </div>

                        <!-- Fecha de inicio -->
                        <div class="col-12 col-sm-6 col-md-4 col-lg-3">
                            <label class="form-label required" for="start_date">Fecha de Inicio</label>
                            <DateInput id="start_date" v-model="formData.start_date"
                                class="form-control" :class="{ 'is-invalid': validationErrors.start_date }"
                                :aria-invalid="!!validationErrors.start_date"
                                :aria-describedby="validationErrors.start_date ? 'f-start_date-error' : undefined"
                                placeholder="YYYY-MM-DD" />
                            <div v-if="validationErrors.start_date" class="invalid-feedback d-block" id="f-start_date-error" role="alert">
                                {{ validationErrors.start_date }}
                            </div>
                        </div>

                        <!-- Plazo en meses -->
                        <div class="col-12 col-sm-6 col-md-4 col-lg-3">
                            <label class="form-label" for="monthly_term">Plazo (meses)</label>
                            <input id="monthly_term" v-model.number="formData.monthly_term"
                                class="form-control" :class="{ 'is-invalid': validationErrors.monthly_term }"
                                type="number" min="1" max="60" step="1"
                                :aria-invalid="!!validationErrors.monthly_term"
                                :aria-describedby="validationErrors.monthly_term ? 'f-monthly_term-error' : undefined"
                                autocomplete="off" placeholder="Ej: 12" />
                            <small class="form-text text-muted d-block mt-1">Máximo 60 meses</small>
                            <div v-if="validationErrors.monthly_term" class="invalid-feedback d-block" id="f-monthly_term-error" role="alert">
                                {{ validationErrors.monthly_term }}
                            </div>
                        </div>

                        <!-- Canon mensual -->
                        <div class="col-12 col-sm-6 col-md-4 col-lg-3">
                            <label class="form-label required" for="monthly_fee">Canon Mensual ($)</label>
                            <input id="monthly_fee" v-model.number="formData.monthly_fee"
                                class="form-control" :class="{ 'is-invalid': validationErrors.monthly_fee }"
                                type="number" min="0.01" step="0.01"
                                :aria-invalid="!!validationErrors.monthly_fee"
                                :aria-describedby="validationErrors.monthly_fee ? 'f-monthly_fee-error' : undefined"
                                autocomplete="off" placeholder="Ej: 5000.00" />
                            <div v-if="validationErrors.monthly_fee" class="invalid-feedback d-block" id="f-monthly_fee-error" role="alert">
                                {{ validationErrors.monthly_fee }}
                            </div>
                        </div>

                        <!-- Observaciones -->
                        <div class="col-12">
                            <label class="form-label" for="observations">Observaciones</label>
                            <textarea id="observations" v-model="formData.observations"
                                class="form-control" rows="3" maxlength="1000"
                                placeholder="Notas adicionales sobre el contrato..."></textarea>
                        </div>

                        <!-- Resumen informativo -->
                        <div class="col-12">
                            <div class="alert alert-info d-flex gap-2 align-items-start" role="alert">
                                <i class="fad fa-info-circle mt-1" aria-hidden="true"></i>
                                <div>
                                    <span class="fw-medium d-block">Resumen del contrato</span>
                                    <small class="d-block" v-if="formData.start_date && formData.monthly_term && formData.monthly_fee">
                                        Contrato desde el {{ formatDate(formData.start_date) }} por {{ formData.monthly_term }} meses.<br>
                                        Valor total: ${{ formatCurrency(formData.monthly_fee * formData.monthly_term) }}<br>
                                        Se generarán automáticamente las cuotas mensuales al crear el contrato.
                                    </small>
                                    <small class="d-block text-muted" v-else>
                                        Complete los campos requeridos para ver el resumen.
                                    </small>
                                </div>
                            </div>
                        </div>

                        <!-- Botones de acción -->
                        <div class="col-12 d-flex justify-content-end gap-2 mt-3">
                            <button type="button" class="btn btn-secondary" @click="goBack">
                                <i class="fad fa-times me-1" aria-hidden="true"></i>Cancelar
                            </button>
                            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                                <i class="fad fa-check me-1" aria-hidden="true"></i>
                                {{ isSubmitting ? 'Creando...' : 'Crear Contrato' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { toast } from '@/utils/toast.js';
import { logger } from '@/utils/logger.js';
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useRentalContractsStore } from '../store/rentalContracts.store.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import PrimeSelect from '@/components/form/PrimeSelect.vue';
import DateInput from '@/components/form/DateInput.vue';

const router = useRouter();
const store = useRentalContractsStore();

const pageTitle = 'Crear Contrato de Alquiler';
const breadcrumbs = [{ label: 'Vehículos' }, { label: 'Alquiler' }, { label: 'Crear' }];
const isSubmitting = ref(false);

// Formulario
const formData = reactive({
    vehicle_uuid: null,
    start_date: '',
    monthly_term: 12,
    monthly_fee: null,
    observations: ''
});

const validationErrors = reactive({});

// Validación
const validateForm = () => {
    Object.keys(validationErrors).forEach((k) => delete validationErrors[k]);
    const errors = {};

    if (!formData.vehicle_uuid) {
        errors.vehicle_uuid = 'Debe seleccionar un vehículo';
    }

    if (!formData.start_date) {
        errors.start_date = 'Debe ingresar la fecha de inicio';
    }

    if (!formData.monthly_fee || formData.monthly_fee <= 0) {
        errors.monthly_fee = 'El canon mensual debe ser mayor a cero';
    }

    if (!formData.monthly_term || formData.monthly_term < 1 || formData.monthly_term > 60) {
        errors.monthly_term = 'El plazo debe estar entre 1 y 60 meses';
    }

    Object.assign(validationErrors, errors);
    return Object.keys(errors).length === 0;
};

// Métodos auxiliares
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
};

const focusFirstError = () => {
    const el = document.querySelector('[aria-invalid="true"], .is-invalid');
    if (el) el.focus();
};

const handleSubmit = async () => {
    if (!validateForm()) {
        focusFirstError();
        await toast('Error', 'Por favor corrija los errores en el formulario', 'error');
        return;
    }

    isSubmitting.value = true;

    try {
        await store.createItem({ ...formData });
        router.push({ name: 'rentalContracts.list' });
    } catch (error) {
        const list = error?.response?.data?.error?.details?.validation_errors;
        if (Array.isArray(list)) {
            list.forEach(({ field, messages }) => {
                if (field && Array.isArray(messages) && messages[0]) {
                    validationErrors[field] = messages[0];
                }
            });
            focusFirstError();
        }
    } finally {
        isSubmitting.value = false;
    }
};

const goBack = () => {
    router.back();
};

onMounted(async () => {
    try {
        await store.loadCatalogs();
    } catch (error) {
        logger.error('Error cargando catálogos:', error);
    }
});
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
