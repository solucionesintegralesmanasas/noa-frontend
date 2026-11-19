<script setup>
import { computed, nextTick, onMounted, ref, shallowRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAccessibleForm } from '@/hooks/useAccessibleForm.js';
import { useInspectionItemsStore } from '../store/inspectionItems.store.js';
import { toast } from '@/utils/toast.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import PrimeSelect from '@/components/form/PrimeSelect.vue';
import BaseFormActions from '@/components/BaseFormActions.vue';
import InspectionCategoriesModal from '../components/InspectionCategoriesModal.vue';
import InspectionItemsBulkImportModal from '../components/InspectionItemsBulkImportModal.vue';

const route = useRoute();
const router = useRouter();
const store = useInspectionItemsStore();

const isEditMode = computed(() => route.params.id !== undefined);
const pageTitle = computed(() => isEditMode.value ? 'Actualizar Ítem' : 'Nuevos Ítems de Inspección');
const pageSubtitle = computed(() => isEditMode.value
    ? 'Modifica los datos del ítem de inspección'
    : 'Selecciona una categoría y agrega uno o varios ítems dinámicamente, o utiliza carga masiva por Excel');
const breadcrumbs = computed(() => [
    { label: 'Ítems de Inspección', to: '/configuracion/items-inspeccion' },
    { label: isEditMode.value ? 'Editar' : 'Nuevo' },
]);

const isViewLoading = shallowRef(true);
const categoriesModalVisible = shallowRef(false);
const bulkImportModalVisible = shallowRef(false);
const bulkSubmitting = shallowRef(false);
const categoryError = shallowRef('');

// Estado para modo edición (un solo ítem)
const { formData, errors, isSubmitting, validateAndFocus, fieldAria, submit } = useAccessibleForm(
    { category: '', item_name: '', description: '' },
    {
        category: { required: true, label: 'Categoría' },
        item_name: { required: true, label: 'Nombre del ítem', maxLength: 150 },
        description: { required: false, label: 'Descripción' },
    }
);

// Estado dinámico para modo creación (múltiples ítems en una categoría)
let nextRowId = 1;
const createEmptyRow = () => ({
    uid: nextRowId++,
    item_name: '',
    description: '',
    error: '',
});

const dynamicItems = ref([createEmptyRow()]);

const addItemRow = async (focusLast = true) => {
    const newRow = createEmptyRow();
    dynamicItems.value.push(newRow);
    if (focusLast) {
        await nextTick();
        const input = document.getElementById(`f-dyn-name-${newRow.uid}`);
        input?.focus();
    }
};

const removeItemRow = (index) => {
    if (dynamicItems.value.length <= 1) return;
    dynamicItems.value.splice(index, 1);
};

const onCategorySaved = (category) => {
    if (category?.code) {
        formData.category = category.code;
        categoryError.value = '';
    }
};

const onBulkImported = (summary) => {
    if ((summary?.created_count ?? 0) > 0) {
        bulkImportModalVisible.value = false;
        goBack();
    }
};

const goBack = () => router.push('/configuracion/items-inspeccion');

const validateBulkForm = () => {
    categoryError.value = formData.category ? '' : 'Debes seleccionar una categoría.';
    let valid = Boolean(formData.category);

    for (const row of dynamicItems.value) {
        const name = (row.item_name || '').trim();
        if (!name) {
            row.error = 'El nombre del ítem es obligatorio.';
            valid = false;
        } else if (name.length > 150) {
            row.error = 'El nombre no debe superar los 150 caracteres.';
            valid = false;
        } else {
            row.error = '';
        }
    }

    return valid;
};

const handleSubmit = async () => {
    if (isEditMode.value) {
        const valid = await validateAndFocus();
        if (!valid) {
            return toast('Atención', 'Revisa los campos obligatorios', 'warning');
        }
        await submit(async () => {
            try {
                await store.updateItem(route.params.id, { ...formData });
                goBack();
            } catch {
                // El store ya muestra el toast del error
            }
        });
        return;
    }

    if (!validateBulkForm()) {
        return toast('Atención', 'Selecciona una categoría y completa los nombres de los ítems', 'warning');
    }

    bulkSubmitting.value = true;
    try {
        await store.bulkCreateItems({
            category: formData.category,
            items: dynamicItems.value.map((row) => ({
                item_name: row.item_name.trim(),
                description: row.description?.trim() || null,
            })),
        });
        goBack();
    } catch {
        // El store ya muestra el toast del error
    } finally {
        bulkSubmitting.value = false;
    }
};

onMounted(async () => {
    try {
        await store.fetchCategories();
        if (isEditMode.value) {
            const item = await store.fetchById(route.params.id);
            if (item) {
                Object.assign(formData, {
                    category: item.category ?? '',
                    item_name: item.item_name ?? '',
                    description: item.description ?? '',
                });
            }
        }
    } finally {
        isViewLoading.value = false;
    }
});
</script>

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
                    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div class="d-flex align-items-center gap-2">
                            <i class="fad fa-clipboard-check text-primary" aria-hidden="true" />
                            <h5 class="mb-0 fw-medium">
                                {{ isEditMode ? 'Información del ítem' : 'Registro dinámico de ítems por categoría' }}
                            </h5>
                            <span class="badge bg-primary bg-opacity-10 text-primary ms-1">
                                <i class="fad fa-asterisk me-1" style="font-size: 8px;" aria-hidden="true" />Campos obligatorios
                            </span>
                        </div>

                        <button
                            v-if="!isEditMode"
                            type="button"
                            class="btn btn-outline-success btn-sm"
                            @click="bulkImportModalVisible = true"
                        >
                            <i class="fad fa-file-excel me-1" aria-hidden="true" />
                            Carga Masiva Excel
                        </button>
                    </div>
                </div>

                <div class="card-body p-2 p-md-3 p-lg-4">
                    <form @submit.prevent="handleSubmit" class="row g-3" novalidate>
                        <!-- Selección de categoría + acceso directo a formulario de categorías -->
                        <div class="col-12" :class="{ 'col-md-5': isEditMode }">
                            <label class="form-label required" for="f-category">Categoría</label>
                            <div class="d-flex gap-2 align-items-start">
                                <div class="flex-grow-1">
                                    <PrimeSelect
                                        :input-id="'f-category'"
                                        v-model="formData.category"
                                        :options="store.categoryOptions"
                                        option-label="label"
                                        option-value="value"
                                        placeholder="Seleccionar categoría..."
                                        showClear
                                        filter
                                        class="w-100"
                                        :invalid="Boolean(errors.category || categoryError)"
                                        :aria-invalid="fieldAria('category')['aria-invalid']"
                                        :aria-describedby="fieldAria('category')['aria-describedby']"
                                        @update:model-value="categoryError = ''"
                                    />
                                    <div v-if="errors.category || categoryError" class="invalid-feedback d-block" id="f-category-error" role="alert">
                                        {{ errors.category || categoryError }}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    class="btn btn-outline-primary flex-shrink-0"
                                    title="Agregar o gestionar categorías"
                                    @click="categoriesModalVisible = true"
                                >
                                    <i class="fad fa-folder-plus me-1" aria-hidden="true" />
                                    <span class="d-none d-sm-inline">Nueva Categoría</span>
                                </button>
                            </div>
                        </div>

                        <!-- MODO EDICIÓN: Un único ítem -->
                        <template v-if="isEditMode">
                            <div class="col-12 col-md-7">
                                <label class="form-label required" for="f-item_name">Nombre del ítem</label>
                                <input
                                    id="f-item_name"
                                    v-model="formData.item_name"
                                    class="form-control"
                                    :class="{ 'is-invalid': errors.item_name }"
                                    type="text"
                                    autocomplete="off"
                                    maxlength="150"
                                    placeholder="Ej: Licencia de conducción vigente..."
                                    :aria-invalid="fieldAria('item_name')['aria-invalid']"
                                    :aria-describedby="fieldAria('item_name')['aria-describedby']"
                                />
                                <div v-if="errors.item_name" class="invalid-feedback d-block" id="f-item_name-error" role="alert">
                                    {{ errors.item_name }}
                                </div>
                            </div>

                            <div class="col-12">
                                <label class="form-label" for="f-description">Descripción</label>
                                <textarea
                                    id="f-description"
                                    v-model="formData.description"
                                    class="form-control"
                                    :class="{ 'is-invalid': errors.description }"
                                    rows="3"
                                    placeholder="Detalle opcional del ítem a inspeccionar..."
                                    :aria-invalid="fieldAria('description')['aria-invalid']"
                                    :aria-describedby="fieldAria('description')['aria-describedby']"
                                />
                                <div v-if="errors.description" class="invalid-feedback d-block" id="f-description-error" role="alert">
                                    {{ errors.description }}
                                </div>
                            </div>
                        </template>

                        <!-- MODO CREACIÓN: Lista dinámica de múltiples ítems para la categoría seleccionada -->
                        <div v-else class="col-12">
                            <div class="d-flex align-items-center justify-content-between mb-2">
                                <span class="fw-semibold small text-secondary">
                                    Ítems a registrar ({{ dynamicItems.length }})
                                </span>
                                <button type="button" class="btn btn-sm btn-outline-primary" @click="addItemRow(true)">
                                    <i class="fad fa-plus-circle me-1" aria-hidden="true" />
                                    Agregar otro ítem
                                </button>
                            </div>

                            <div class="d-flex flex-column gap-2">
                                <div
                                    v-for="(row, index) in dynamicItems"
                                    :key="row.uid"
                                    class="border rounded-3 p-2 p-md-3 bg-light"
                                >
                                    <div class="row g-2 align-items-start">
                                        <div class="col-auto d-flex align-items-center pt-md-4">
                                            <span class="badge bg-primary bg-opacity-10 text-primary row-index-badge">
                                                #{{ index + 1 }}
                                            </span>
                                        </div>

                                        <div class="col-12 col-md-5">
                                            <label class="form-label small fw-medium mb-1 required" :for="`f-dyn-name-${row.uid}`">
                                                Nombre del ítem
                                            </label>
                                            <input
                                                :id="`f-dyn-name-${row.uid}`"
                                                v-model="row.item_name"
                                                type="text"
                                                class="form-control form-control-sm"
                                                :class="{ 'is-invalid': Boolean(row.error) }"
                                                maxlength="150"
                                                autocomplete="off"
                                                placeholder="Ej: Licencia de tránsito vigente"
                                                @input="row.error = ''"
                                                @keydown.enter.prevent="addItemRow(true)"
                                            />
                                            <div v-if="row.error" class="invalid-feedback d-block">{{ row.error }}</div>
                                        </div>

                                        <div class="col-12 col-md">
                                            <label class="form-label small fw-medium mb-1" :for="`f-dyn-desc-${row.uid}`">
                                                Descripción (opcional)
                                            </label>
                                            <input
                                                :id="`f-dyn-desc-${row.uid}`"
                                                v-model="row.description"
                                                type="text"
                                                class="form-control form-control-sm"
                                                autocomplete="off"
                                                placeholder="Detalle del punto a inspeccionar..."
                                                @keydown.enter.prevent="addItemRow(true)"
                                            />
                                        </div>

                                        <div class="col-auto pt-md-4">
                                            <button
                                                type="button"
                                                class="btn btn-sm btn-outline-danger"
                                                :disabled="dynamicItems.length === 1"
                                                title="Quitar fila"
                                                @click="removeItemRow(index)"
                                            >
                                                <i class="far fa-trash-alt" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="mt-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <small class="text-muted">
                                    Tip: puedes presionar <kbd>Enter</kbd> dentro de un campo para añadir rápidamente otro ítem.
                                </small>
                                <button type="button" class="btn btn-sm btn-link text-decoration-none p-0" @click="addItemRow(true)">
                                    <i class="fad fa-plus me-1" aria-hidden="true" />Añadir otra fila
                                </button>
                            </div>
                        </div>

                        <div class="col-12">
                            <BaseFormActions
                                :submitting="isEditMode ? isSubmitting : bulkSubmitting"
                                :is-edit-mode="isEditMode"
                                @cancel="goBack"
                            />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <InspectionCategoriesModal v-model:visible="categoriesModalVisible" @saved="onCategorySaved" />
    <InspectionItemsBulkImportModal v-model:visible="bulkImportModalVisible" @imported="onBulkImported" />
</template>

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
.row-index-badge {
    min-width: 2rem;
    text-align: center;
}
.fade-in-up {
    animation: fadeInUp 0.4s ease-out forwards;
}
@keyframes fadeInUp {
    from { opacity: 0; transform: translate3d(0, 15px, 0); }
    to { opacity: 1; transform: translate3d(0, 0, 0); }
}
</style>
