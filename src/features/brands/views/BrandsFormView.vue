<template>
    <div class="row g-2 g-md-3">
        <div class="col-12 col-xxl-10 offset-xxl-1 col-xl-12">

            <BasePageHeader
                :title="pageTitle"
                :subtitle="pageSubtitle"
                icon="fad fa-tags text-primary"
                :breadcrumbs="breadcrumbs"
                :show-back="true"
                @back="goBack"
            />

            <div class="card border-0 shadow-sm fade-in-up" style="animation-delay: 0.1s;">
                <div class="card-header bg-light py-2 px-3 border-bottom">
                    <div class="d-flex align-items-center gap-2">
                        <i class="fad fa-tags text-primary" aria-hidden="true"></i>
                        <h5 class="mb-0 fw-medium">Información de la marca</h5>
                        <span class="badge bg-primary bg-opacity-10 text-primary ms-2">
                            <i class="fad fa-asterisk me-1" style="font-size: 8px;" aria-hidden="true"></i>Campos obligatorios
                        </span>
                    </div>
                </div>

                <div class="card-body p-2 p-md-3 p-lg-4 p-md-4">
                    <form @submit.prevent="handleSubmit" class="row g-2 g-md-3" novalidate>

                        <div class="col-12">
                            <label class="form-label required" for="f-description">Descripción</label>
                            <input id="f-description" v-model="formData.description" class="form-control"
                                :class="{ 'is-invalid': errors.description }" type="text" autocomplete="off"
                                placeholder="Ej: Chevrolet, Kenworth, Hino..." maxlength="200"
                                :aria-invalid="errors.description ? 'true' : 'false'"
                                :aria-describedby="errors.description ? 'f-description-error' : undefined" />
                            <div v-if="errors.description" class="invalid-feedback d-block" id="f-description-error" role="alert">
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
                            <i class="fad fa-lightbulb text-primary fs-5" aria-hidden="true"></i>
                        </div>
                        <div>
                            <h6 class="fw-medium mb-1">¿Sabías qué?</h6>
                            <p class="text-muted small mb-0">
                                Las marcas permiten clasificar el parque automotor y facilitan
                                los reportes de flota por fabricante.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBrandsStore } from '../store/brands.store.js';
import { useAccessibleForm } from '@/hooks/useAccessibleForm.js';
import { toast } from '@/utils/toast.js';
import { logger } from '@/utils/logger.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import BaseFormActions from '@/components/BaseFormActions.vue';

// --- STORES Y ROUTER ---
const route = useRoute();
const router = useRouter();
const store = useBrandsStore();

// --- ESTADOS ---
const isEditMode = computed(() => route.params.id !== undefined);

/** Computed para BasePageHeader (evita expresiones complejas en el template) */
const pageTitle = computed(() => isEditMode.value ? 'Actualizar Marca' : 'Nueva Marca');
const pageSubtitle = computed(() => isEditMode.value ? 'Modifica la descripción de la marca' : 'Completa los datos para dar de alta una nueva marca');
const breadcrumbs = computed(() => [ { label: 'Marcas', to: '/configuracion/marcas' }, { label: isEditMode.value ? 'Editar' : 'Nueva' } ]);

// --- FORMULARIO ACCESIBLE ---
const { formData, errors, isSubmitting, validateAndFocus, submit } = useAccessibleForm(
    { description: '' },
    { description: { required: true, label: 'Descripción', maxLength: 200 } }
);

const goBack = () => router.push('/configuracion/marcas');

const handleSubmit = async () => {
    const valid = await validateAndFocus();
    if (!valid) {
        return toast('Atención', 'Revisa los campos obligatorios', 'warning');
    }

    await submit(async () => {
        try {
            let uuid = isEditMode.value ? route.params.id : null;

            if (isEditMode.value) {
                await store.updateItem(uuid, { ...formData });
            } else {
                const newItem = await store.createItem({ ...formData });
                uuid = newItem?.uuid || newItem?.id;
            }

            goBack();
        } catch (error) {
            logger.error('No se pudo guardar la marca', { message: error?.message });
        }
    });
};

// --- CICLO DE VIDA ---
onMounted(async () => {
    if (isEditMode.value) {
        const item = await store.fetchProfileById(route.params.id);
        if (item) {
            formData.description = item.description ?? '';
        }
    }
});
</script>

<style scoped>
/* ===== CARDS ===== */
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

/* ===== VALIDACIONES (Nativas) ===== */
.required::after {
    content: " *";
    color: #dc3545;
    font-weight: 600;
}

.form-control.is-invalid {
    border-color: #dc3545 !important;
}

.invalid-feedback {
    display: block;
    width: 100%;
    margin-top: 0.25rem;
    font-size: 0.875em;
    color: #dc3545;
}

/* ===== BOTONES ===== */
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
