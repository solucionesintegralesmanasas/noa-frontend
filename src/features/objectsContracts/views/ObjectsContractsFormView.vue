<template>
    <div class="row g-2 g-md-3">
        <div class="col-12 col-xxl-10 offset-xxl-1 col-xl-12">
            <BasePageHeader
                :title="pageTitle"
                :subtitle="pageSubtitle"
                icon="fad fa-file-contract text-primary"
                :breadcrumbs="breadcrumbs"
                :show-back="true"
                @back="goBack"
            />
            <div class="card border-0 shadow-sm fade-in-up" style="animation-delay: 0.1s;">
                <div class="card-header bg-light py-2 px-3 border-bottom">
                    <div class="d-flex align-items-center gap-2">
                        <i class="fad fa-file-contract text-primary" aria-hidden="true" />
                        <h5 class="mb-0 fw-medium">Información del objeto de contrato</h5>
                        <span class="badge bg-primary bg-opacity-10 text-primary ms-2">
                            <i class="fad fa-asterisk me-1" style="font-size: 8px;" aria-hidden="true" />Campos obligatorios
                        </span>
                    </div>
                </div>
                <div class="card-body p-2 p-md-3 p-lg-4 p-md-4">
                    <form @submit.prevent="handleSubmit" class="row g-2 g-md-3" novalidate>
                        <div class="col-12">
                            <label class="form-label required" for="f-name">Nombre</label>
                            <input
                                id="f-name"
                                v-model="formData.name"
                                class="form-control"
                                :class="{ 'is-invalid': errors.name }"
                                :aria-invalid="errors.name ? 'true' : 'false'"
                                :aria-describedby="errors.name ? 'f-name-error' : undefined"
                                type="text"
                                autocomplete="off"
                                maxlength="255"
                                placeholder="Ej: Transporte de carga"
                            />
                            <div v-if="errors.name" id="f-name-error" class="invalid-feedback d-block" role="alert">
                                {{ errors.name }}
                            </div>
                        </div>
                        <div class="col-12">
                            <label class="form-label required" for="f-description">Descripción</label>
                            <textarea
                                id="f-description"
                                v-model="formData.description"
                                class="form-control"
                                :class="{ 'is-invalid': errors.description }"
                                :aria-invalid="errors.description ? 'true' : 'false'"
                                :aria-describedby="errors.description ? 'f-description-error' : undefined"
                                rows="4"
                                placeholder="Describe el objeto del contrato..."
                            />
                            <div v-if="errors.description" id="f-description-error" class="invalid-feedback d-block" role="alert">
                                {{ errors.description }}
                            </div>
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
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toast } from '@/utils/toast.js';
import { useAccessibleForm } from '@/hooks/useAccessibleForm.js';
import { useObjectsContractsStore } from '../store/objectsContracts.store.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import BaseFormActions from '@/components/BaseFormActions.vue';

const route = useRoute();
const router = useRouter();
const store = useObjectsContractsStore();

const isEditMode = computed(() => route.params.id !== undefined);
const pageTitle = computed(() => isEditMode.value ? 'Actualizar Objeto de Contrato' : 'Nuevo Objeto de Contrato');
const pageSubtitle = computed(() => isEditMode.value ? 'Modifica la información del objeto de contrato' : 'Completa los datos para dar de alta un nuevo objeto de contrato');
const breadcrumbs = computed(() => [{ label: 'Objetos de Contrato', to: '/configuracion/objetos-contrato' }, { label: isEditMode.value ? 'Editar' : 'Nuevo' }]);

const { formData, errors, isSubmitting, validateAndFocus, submit } = useAccessibleForm(
    { name: '', description: '' },
    {
        name: { required: true, label: 'Nombre', maxLength: 255 },
        description: { required: true, label: 'Descripción' },
    }
);

const goBack = () => router.push('/configuracion/objetos-contrato');

const handleSubmit = async () => {
    const valid = await validateAndFocus();
    if (!valid) return toast('Atención', 'Revisa los campos obligatorios', 'warning');
    await submit(async () => {
        try {
            if (isEditMode.value) {
                await store.updateItem(route.params.id, { ...formData });
            } else {
                await store.createItem({ ...formData });
            }
            goBack();
        } catch {
            toast('Error', 'No se pudo procesar la solicitud', 'error');
        }
    });
};

onMounted(async () => {
    if (isEditMode.value) {
        const item = await store.fetchProfileById(route.params.id);
        if (item) {
            formData.name = item.name ?? '';
            formData.description = item.description ?? '';
        }
    }
});
</script>
