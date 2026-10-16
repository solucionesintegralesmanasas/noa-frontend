<template>
    <div class="row g-2 g-md-3">
        <div class="col-12 col-xxl-10 offset-xxl-1 col-xl-12">
            <BasePageHeader
                :title="pageTitle"
                :subtitle="pageSubtitle"
                icon="fad fa-clipboard-check text-primary"
                :breadcrumbs="breadcrumbs"
                :show-back="true"
                @back="goBack"
            />

            <div class="card border-0 shadow-sm fade-in-up" style="animation-delay: 0.1s;">
                <div class="card-header bg-light py-2 px-3 border-bottom">
                    <div class="d-flex align-items-center gap-2">
                        <i class="fad fa-clipboard-check text-primary" aria-hidden="true" />
                        <h5 class="mb-0 fw-medium">Información del ítem</h5>
                        <span class="badge bg-primary bg-opacity-10 text-primary ms-2">
                            <i class="fad fa-asterisk me-1" style="font-size: 8px;" aria-hidden="true" />Campos obligatorios
                        </span>
                    </div>
                </div>

                <div class="card-body p-2 p-md-3 p-lg-4 p-md-4">
                    <form @submit.prevent="handleSubmit" class="row g-2 g-md-3" novalidate>
                        <div class="col-12 col-sm-6 col-md-4 col-lg-4">
                            <label class="form-label required" for="f-category">Categoría</label>
                            <PrimeSelect :input-id="'f-category'" v-model="formData.category"
                                :options="categoryOptions" option-label="label" option-value="value"
                                placeholder="Seleccionar categoría..." showClear filter class="w-100"
                                :invalid="!!errors.category"
                                :aria-invalid="fieldAria('category')['aria-invalid']"
                                :aria-describedby="fieldAria('category')['aria-describedby']" />
                            <div v-if="errors.category" class="invalid-feedback d-block" id="f-category-error" role="alert">
                                {{ errors.category }}
                            </div>
                        </div>

                        <div class="col-12 col-sm-6 col-md-8 col-lg-8">
                            <label class="form-label required" for="f-item_name">Nombre del ítem</label>
                            <input id="f-item_name" v-model="formData.item_name" class="form-control"
                                :class="{ 'is-invalid': errors.item_name }" type="text" autocomplete="off"
                                maxlength="150" placeholder="Ej: Licencia de conducción vigente..."
                                :aria-invalid="fieldAria('item_name')['aria-invalid']"
                                :aria-describedby="fieldAria('item_name')['aria-describedby']" />
                            <div v-if="errors.item_name" class="invalid-feedback d-block" id="f-item_name-error" role="alert">
                                {{ errors.item_name }}
                            </div>
                        </div>

                        <div class="col-12">
                            <label class="form-label" for="f-description">Descripción</label>
                            <textarea id="f-description" v-model="formData.description" class="form-control"
                                :class="{ 'is-invalid': errors.description }" rows="3"
                                placeholder="Detalle opcional del ítem a inspeccionar..."
                                :aria-invalid="fieldAria('description')['aria-invalid']"
                                :aria-describedby="fieldAria('description')['aria-describedby']" />
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
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAccessibleForm } from '@/hooks/useAccessibleForm.js';
import { useInspectionItemsStore } from '../store/inspectionItems.store.js';
import { toast } from '@/utils/toast.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import PrimeSelect from '@/components/form/PrimeSelect.vue';
import BaseFormActions from '@/components/BaseFormActions.vue';

const route = useRoute();
const router = useRouter();
const store = useInspectionItemsStore();

const isEditMode = computed(() => route.params.id !== undefined);
const pageTitle = computed(() => isEditMode.value ? 'Actualizar Ítem' : 'Nuevo Ítem de Inspección');
const pageSubtitle = computed(() => isEditMode.value ? 'Modifica los datos del ítem de inspección' : 'Completa los datos para crear un nuevo ítem');
const breadcrumbs = computed(() => [{ label: 'Ítems de Inspección', to: '/configuracion/items-inspeccion' }, { label: isEditMode.value ? 'Editar' : 'Nuevo' }]);

const categoryOptions = [
    { label: 'Documentos', value: 'DOCUMENTOS' },
    { label: 'Dotación', value: 'DOTACION' },
    { label: 'Vidrios y Espejos', value: 'VIDRIOS_ESPEJOS' },
    { label: 'Otros', value: 'OTROS' },
    { label: 'Emergencias', value: 'EMERGENCIAS' },
    { label: 'Extintor', value: 'EXTINTOR' },
    { label: 'Herramientas', value: 'HERRAMIENTAS' },
    { label: 'Luces', value: 'LUCES' },
    { label: 'Fluidos', value: 'FLUIDOS' },
    { label: 'Neumáticos', value: 'NEUMATICOS' },
    { label: 'Presión', value: 'PRESION' },
];

const { formData, errors, isSubmitting, validateAndFocus, fieldAria, submit } = useAccessibleForm(
    { category: '', item_name: '', description: '' },
    {
        category: { required: true, label: 'Categoría' },
        item_name: { required: true, label: 'Nombre del ítem', maxLength: 150 },
        description: { required: false, label: 'Descripción' },
    }
);

const isViewLoading = ref(true);

const goBack = () => router.push('/configuracion/items-inspeccion');

const handleSubmit = async () => {
    const valid = await validateAndFocus();
    if (!valid) {
        return toast('Atención', 'Revisa los campos obligatorios', 'warning');
    }
    await submit(async () => {
        try {
            if (isEditMode.value) {
                await store.updateItem(route.params.id, { ...formData });
            } else {
                await store.createItem({ ...formData });
            }
            goBack();
        } catch (error) {
            toast('Error', 'No se pudo procesar la solicitud', 'error');
        }
    });
};

onMounted(async () => {
    try {
        if (isEditMode.value) {
            const item = await store.fetchById(route.params.id);
            if (item) Object.assign(formData, { category: item.category ?? '', item_name: item.item_name ?? '', description: item.description ?? '' });
        }
    } finally {
        isViewLoading.value = false;
    }
});
</script>

<style scoped>
.card {
    border-radius: 0.625rem !important;
}
.required::after {
    content: " *";
    color: #dc3545;
    font-weight: 600;
}
.invalid-feedback {
    display: block;
    width: 100%;
    margin-top: 0.25rem;
    font-size: 0.875em;
    color: #dc3545;
}
.fade-in-up {
    animation: fadeInUp 0.4s ease-out forwards;
}
@keyframes fadeInUp {
    from { opacity: 0; transform: translate3d(0, 15px, 0); }
    to { opacity: 1; transform: translate3d(0, 0, 0); }
}
</style>
