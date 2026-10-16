<template>
    <div class="row g-2 g-md-3">
        <div class="col-12 col-xxl-10 offset-xxl-1 col-xl-12">
            <BasePageHeader
                :title="pageTitle"
                :subtitle="pageSubtitle"
                icon="fad fa-truck text-primary"
                :breadcrumbs="breadcrumbs"
                :show-back="true"
                @back="goBack"
            />

            <div class="card border-0 shadow-sm fade-in-up" style="animation-delay: 0.1s;">
                <div class="card-header bg-light py-2 px-3 border-bottom">
                    <div class="d-flex align-items-center gap-2">
                        <i class="fad fa-truck text-primary" aria-hidden="true" />
                        <h5 class="mb-0 fw-medium">Información de la clase de vehículo</h5>
                        <span class="badge bg-primary bg-opacity-10 text-primary ms-2">
                            <i class="fad fa-asterisk me-1" style="font-size: 8px;" aria-hidden="true" />Campos obligatorios
                        </span>
                    </div>
                </div>

                <div class="card-body p-2 p-md-3 p-lg-4 p-md-4">
                    <form ref="formRef" @submit.prevent="handleSubmit" class="row g-2 g-md-3" novalidate>
                        <div class="col-12 col-sm-6 col-md-4 col-lg-4">
                            <label class="form-label required" for="f-class_code_class">Código</label>
                            <input
                                id="f-class_code_class"
                                v-model="formData.class_code_class"
                                class="form-control"
                                :class="{ 'is-invalid': errors.class_code_class }"
                                :aria-invalid="fieldAria('class_code_class')['aria-invalid']"
                                :aria-describedby="errorId('class_code_class')"
                                type="text"
                                maxlength="5"
                                autocomplete="off"
                                placeholder="Ej: M1, N2..."
                            />
                            <div v-if="errors.class_code_class" :id="fieldId('class_code_class') + '-error'" class="invalid-feedback d-block" role="alert">
                                {{ errors.class_code_class }}
                            </div>
                        </div>

                        <div class="col-12 col-sm-6 col-md-8 col-lg-8">
                            <label class="form-label required" for="f-description">Descripción</label>
                            <input
                                id="f-description"
                                v-model="formData.description"
                                class="form-control"
                                :class="{ 'is-invalid': errors.description }"
                                :aria-invalid="fieldAria('description')['aria-invalid']"
                                :aria-describedby="errorId('description')"
                                type="text"
                                maxlength="200"
                                autocomplete="off"
                                placeholder="Ej: Vehículos de pasajeros..."
                            />
                            <div v-if="errors.description" :id="fieldId('description') + '-error'" class="invalid-feedback d-block" role="alert">
                                {{ errors.description }}
                            </div>
                        </div>

                        <div class="col-12">
                            <BaseFormActions :submitting="isSubmitting" :is-edit-mode="isEditMode" @cancel="goBack" />
                        </div>
                    </form>
                </div>
            </div>

            <div class="card border-0 shadow-sm mt-3 fade-in-up" style="animation-delay: 0.2s;">
                <div class="card-body p-2 p-md-3 p-lg-4 p-md-4">
                    <div class="d-flex align-items-start gap-3">
                        <div class="bg-primary bg-opacity-10 rounded-circle p-2 flex-shrink-0">
                            <i class="fad fa-lightbulb text-primary fs-5" aria-hidden="true" />
                        </div>
                        <div>
                            <h6 class="fw-medium mb-1">¿Sabías qué?</h6>
                            <p class="text-muted small mb-0">
                                Las clases de vehículos permiten clasificar el parque automotor
                                según su tipo y uso operativo.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toast } from '@/utils/toast.js';
import { useAccessibleForm } from '@/hooks/useAccessibleForm.js';
import { useVehicleClassesStore } from '../store/vehicleClasses.store.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import BaseFormActions from '@/components/BaseFormActions.vue';

const route = useRoute();
const router = useRouter();
const store = useVehicleClassesStore();
const formRef = ref(null);

const isEditMode = computed(() => route.params.id !== undefined);
const pageTitle = computed(() => isEditMode.value ? 'Actualizar Clase de Vehículo' : 'Nueva Clase de Vehículo');
const pageSubtitle = computed(() => isEditMode.value ? 'Modifica la información de la clase de vehículo' : 'Completa los datos para registrar una nueva clase de vehículo');
const breadcrumbs = computed(() => [{ label: 'Clases de Vehículos', to: '/configuracion/clases-vehiculos' }, { label: isEditMode.value ? 'Editar' : 'Nueva' }]);

const {
    formData,
    errors,
    isSubmitting,
    validateAndFocus,
    fieldAria,
    fieldId,
    errorId,
    submit,
} = useAccessibleForm(
    { class_code_class: '', description: '' },
    {
        class_code_class: { required: true, label: 'Código', maxLength: 5 },
        description: { required: true, label: 'Descripción', maxLength: 200 },
    }
);

const goBack = () => router.push('/configuracion/clases-vehiculos');

const handleSubmit = async () => {
    const valid = await validateAndFocus(formRef.value ?? undefined);
    if (!valid) {
        return toast('Atención', 'Revisa los campos obligatorios', 'warning');
    }
    try {
        await submit(async () => {
            const editUuid = isEditMode.value ? route.params.id : null;
            const payload = {
                class_code_class: String(formData.class_code_class ?? '').trim(),
                description: String(formData.description ?? '').trim(),
            };
            if (isEditMode.value) {
                await store.updateItem(editUuid, payload);
            } else {
                await store.createItem(payload);
            }
            goBack();
        });
    } catch (error) {
        await toast('Error', 'No se pudo procesar la solicitud', 'error');
    }
};

onMounted(async () => {
    if (isEditMode.value) {
        const item = await store.fetchProfileById(route.params.id);
        if (item) {
            formData.class_code_class = item.class_code_class ?? '';
            formData.description = item.description ?? '';
        }
    }
});
</script>

<style scoped>
.card { border-radius: 0.625rem !important; transition: box-shadow 150ms ease-in-out; }
.card:hover { box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important; }
.card-header { border-radius: 0.625rem 0.625rem 0 0 !important; background: linear-gradient(135deg, #f8f9fa, #fff); }

.required::after { content: " *"; color: #dc3545; font-weight: 600; }

.form-control.is-invalid {
    border-color: #dc3545 !important;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right calc(0.375em + 0.1875rem) center;
    background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}

.invalid-feedback { display: block; width: 100%; margin-top: 0.25rem; font-size: 0.875em; color: #dc3545; }
.bg-opacity-10 { --bs-bg-opacity: 0.1; }
.fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }

@keyframes fadeInUp {
    from { opacity: 0; transform: translate3d(0, 15px, 0); }
    to { opacity: 1; transform: translate3d(0, 0, 0); }
}
</style>
