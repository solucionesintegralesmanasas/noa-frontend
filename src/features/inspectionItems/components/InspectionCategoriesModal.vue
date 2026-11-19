<script setup>
import { computed, reactive, shallowRef, watch } from 'vue';
import Dialog from 'primevue/dialog';
import { useInspectionItemsStore } from '../store/inspectionItems.store.js';
import { toast } from '@/utils/toast.js';
import { confirmAction } from '@/utils/confirm.js';

const props = defineProps({
    visible: { type: Boolean, default: false },
});

const emit = defineEmits(['update:visible', 'saved']);

const store = useInspectionItemsStore();
const saving = shallowRef(false);
const editingUuid = shallowRef(null);
const validationError = shallowRef('');

const form = reactive({
    name: '',
    description: '',
});

const isEditing = computed(() => Boolean(editingUuid.value));

const generatedCodePreview = computed(() => {
    const raw = (form.name || '').trim();
    if (!raw) return '';
    return raw
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 100);
});

const resetForm = () => {
    editingUuid.value = null;
    form.name = '';
    form.description = '';
    validationError.value = '';
};

watch(() => props.visible, async (open) => {
    if (open) {
        resetForm();
        await store.fetchCategories();
    }
});

const startEdit = (cat) => {
    editingUuid.value = cat.uuid;
    form.name = cat.name || '';
    form.description = cat.description || '';
    validationError.value = '';
};

const handleSubmit = async () => {
    const name = (form.name || '').trim();
    if (!name) {
        validationError.value = 'El nombre de la categoría es obligatorio.';
        return;
    }
    validationError.value = '';
    saving.value = true;
    try {
        let saved;
        if (isEditing.value) {
            saved = await store.updateCategory(editingUuid.value, {
                name,
                description: form.description?.trim() || null,
            });
        } else {
            saved = await store.createCategory({
                name,
                description: form.description?.trim() || null,
            });
        }
        resetForm();
        emit('saved', saved);
    } catch {
        // El store ya muestra el toast con el detalle del error
    } finally {
        saving.value = false;
    }
};

const handleDelete = async (cat) => {
    if ((cat.items_count ?? 0) > 0) {
        return toast('Acción no permitida', 'No puedes eliminar una categoría con ítems asociados.', 'warning');
    }
    const ok = await confirmAction({
        title: '¿Eliminar categoría?',
        text: `Se eliminará la categoría "${cat.name}". Esta acción no se puede deshacer.`,
        confirmText: 'Sí, eliminar',
        icon: 'warning',
    });
    if (!ok) return;

    try {
        await store.deleteCategory(cat.uuid);
        if (editingUuid.value === cat.uuid) {
            resetForm();
        }
    } catch {
        // El store ya muestra el toast
    }
};

const close = () => emit('update:visible', false);
</script>

<template>
    <Dialog
        :visible="visible"
        @update:visible="emit('update:visible', $event)"
        :modal="true"
        :closable="true"
        :draggable="false"
        :style="{ width: '760px', maxWidth: '95vw' }"
    >
        <template #header>
            <div class="d-flex align-items-center gap-2">
                <i class="fad fa-layer-group text-primary fs-5" aria-hidden="true" />
                <h5 class="mb-0 fw-semibold">Categorías de Inspección</h5>
            </div>
        </template>

        <form class="border rounded-3 bg-light p-3 mb-3" @submit.prevent="handleSubmit" novalidate>
            <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="fw-semibold small text-dark">
                    <i class="fad fa-folder-plus me-1 text-primary" aria-hidden="true" />
                    {{ isEditing ? 'Editar categoría seleccionada' : 'Agregar nueva categoría' }}
                </span>
                <span v-if="generatedCodePreview" class="badge bg-secondary bg-opacity-10 text-secondary font-monospace">
                    Código: {{ generatedCodePreview }}
                </span>
            </div>

            <div class="row g-2 align-items-start">
                <div class="col-12 col-md-5">
                    <label class="form-label small fw-medium mb-1 required" for="f-cat-name">Nombre de la categoría</label>
                    <input
                        id="f-cat-name"
                        v-model="form.name"
                        type="text"
                        class="form-control form-control-sm"
                        :class="{ 'is-invalid': Boolean(validationError) }"
                        maxlength="100"
                        placeholder="Ej: Sistema Eléctrico"
                        autocomplete="off"
                    />
                    <div v-if="validationError" class="invalid-feedback d-block">{{ validationError }}</div>
                </div>

                <div class="col-12 col-md-4">
                    <label class="form-label small fw-medium mb-1" for="f-cat-desc">Descripción</label>
                    <input
                        id="f-cat-desc"
                        v-model="form.description"
                        type="text"
                        class="form-control form-control-sm"
                        maxlength="255"
                        placeholder="Descripción opcional..."
                        autocomplete="off"
                    />
                </div>

                <div class="col-12 col-md-3 d-flex gap-1 pt-md-4">
                    <button type="submit" class="btn btn-primary btn-sm flex-grow-1" :disabled="saving">
                        <span v-if="saving" class="spinner-border spinner-border-sm me-1" aria-hidden="true" />
                        <i v-else class="fad" :class="isEditing ? 'fa-save' : 'fa-plus'" aria-hidden="true" />
                        {{ isEditing ? 'Guardar' : 'Agregar' }}
                    </button>
                    <button v-if="isEditing" type="button" class="btn btn-outline-secondary btn-sm" title="Cancelar edición" @click="resetForm">
                        <i class="fas fa-times" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </form>

        <div class="table-responsive category-table-wrap border rounded-3">
            <table class="table table-sm table-hover align-middle mb-0">
                <thead class="table-light sticky-top">
                    <tr>
                        <th scope="col">Nombre</th>
                        <th scope="col">Código</th>
                        <th scope="col" class="text-center">Ítems</th>
                        <th scope="col" class="text-end">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="store.categoriesLoading">
                        <td colspan="4" class="text-center py-4 text-muted small">
                            <span class="spinner-border spinner-border-sm me-2" aria-hidden="true" />Cargando categorías...
                        </td>
                    </tr>
                    <tr v-else-if="store.categories.length === 0">
                        <td colspan="4" class="text-center py-4 text-muted small">
                            No hay categorías registradas todavía.
                        </td>
                    </tr>
                    <tr v-for="cat in store.categories" :key="cat.uuid">
                        <td>
                            <div class="fw-medium text-dark">{{ cat.name }}</div>
                            <small v-if="cat.description" class="text-muted d-block">{{ cat.description }}</small>
                        </td>
                        <td>
                            <span class="badge bg-light text-secondary border font-monospace">{{ cat.code }}</span>
                        </td>
                        <td class="text-center">
                            <span class="badge rounded-pill bg-primary bg-opacity-10 text-primary">
                                {{ cat.items_count ?? 0 }}
                            </span>
                        </td>
                        <td class="text-end">
                            <div class="d-inline-flex gap-1">
                                <button
                                    type="button"
                                    class="btn btn-sm btn-outline-warning px-2 py-1"
                                    title="Editar categoría"
                                    @click="startEdit(cat)"
                                >
                                    <i class="far fa-pen" aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    class="btn btn-sm btn-outline-danger px-2 py-1"
                                    :disabled="(cat.items_count ?? 0) > 0"
                                    :title="(cat.items_count ?? 0) > 0 ? 'Tiene ítems asociados' : 'Eliminar categoría'"
                                    @click="handleDelete(cat)"
                                >
                                    <i class="far fa-trash-alt" aria-hidden="true" />
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <template #footer>
            <div class="d-flex justify-content-end w-100">
                <button type="button" class="btn btn-falcon-default btn-sm" @click="close">Cerrar</button>
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
.required::after {
    content: " *";
    color: #dc3545;
    font-weight: 600;
}

.category-table-wrap {
    max-height: 320px;
}
</style>
