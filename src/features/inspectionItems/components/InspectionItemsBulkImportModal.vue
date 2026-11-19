<script setup>
import { ref, shallowRef, useTemplateRef, watch } from 'vue';
import Dialog from 'primevue/dialog';
import { useInspectionItemsStore } from '../store/inspectionItems.store.js';
import { toast } from '@/utils/toast.js';

const props = defineProps({
    visible: { type: Boolean, default: false },
});

const emit = defineEmits(['update:visible', 'imported']);

const store = useInspectionItemsStore();
const fileInputRef = useTemplateRef('fileInput');
const selectedFile = shallowRef(null);
const downloading = shallowRef(false);
const uploading = shallowRef(false);
const importSummary = ref(null);

const exampleRows = [
    { category: 'DOCUMENTOS', item_name: 'Licencia de tránsito', description: 'Verificar vigencia y estado físico del documento' },
    { category: 'LUCES', item_name: 'Luces bajas y altas', description: 'Comprobar funcionamiento en ambos costados' },
    { category: 'SISTEMA ELECTRICO', item_name: 'Estado de la batería', description: 'Si la categoría no existe, se crea automáticamente' },
];

const resetState = () => {
    selectedFile.value = null;
    importSummary.value = null;
    if (fileInputRef.value) {
        fileInputRef.value.value = '';
    }
};

watch(() => props.visible, (open) => {
    if (open) {
        resetState();
    }
});

const onFileSelected = (event) => {
    const file = event.target?.files?.[0] || null;
    if (!file) {
        selectedFile.value = null;
        return;
    }

    const validExt = /\.(xlsx|xls|csv)$/i.test(file.name);
    if (!validExt) {
        toast('Formato inválido', 'Selecciona un archivo Excel (.xlsx, .xls) o CSV.', 'warning');
        event.target.value = '';
        selectedFile.value = null;
        return;
    }

    selectedFile.value = file;
    importSummary.value = null;
};

const handleDownloadTemplate = async () => {
    downloading.value = true;
    try {
        await store.downloadTemplate();
    } finally {
        downloading.value = false;
    }
};

const handleUpload = async () => {
    if (!selectedFile.value) {
        return toast('Atención', 'Selecciona primero el archivo Excel con los ítems a cargar.', 'warning');
    }

    uploading.value = true;
    try {
        const result = await store.importExcel(selectedFile.value);
        importSummary.value = result;

        const created = result?.created_count ?? 0;
        const cats = result?.categories_created ?? 0;
        await toast(
            'Carga masiva completada',
            `Ítems creados: ${created}. Categorías nuevas: ${cats}.`,
            created > 0 ? 'success' : 'info'
        );

        emit('imported', result);
    } catch {
        // El store ya muestra el toast del error
    } finally {
        uploading.value = false;
    }
};

const formatSize = (bytes) => {
    if (!bytes) return '0 KB';
    return bytes < 1024 * 1024
        ? `${Math.max(1, Math.round(bytes / 1024))} KB`
        : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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
        :style="{ width: '780px', maxWidth: '95vw' }"
    >
        <template #header>
            <div class="d-flex align-items-center gap-2">
                <i class="fad fa-file-excel text-success fs-5" aria-hidden="true" />
                <h5 class="mb-0 fw-semibold">Carga Masiva de Ítems por Excel</h5>
            </div>
        </template>

        <div class="alert alert-info border-0 bg-info bg-opacity-10 small mb-3">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                    <strong>Paso 1:</strong> Descarga la plantilla de ejemplo o estructura tu archivo Excel con las 3 columnas exactas:
                    <code>CATEGORIA</code>, <code>NOMBRE_ITEM</code> y <code>DESCRIPCION</code> (opcional).
                </div>
                <button
                    type="button"
                    class="btn btn-success btn-sm flex-shrink-0"
                    :disabled="downloading"
                    @click="handleDownloadTemplate"
                >
                    <span v-if="downloading" class="spinner-border spinner-border-sm me-1" aria-hidden="true" />
                    <i v-else class="fad fa-download me-1" aria-hidden="true" />
                    Descargar plantilla Excel
                </button>
            </div>
        </div>

        <!-- Tabla de ejemplo visual de cómo ubicar los datos en Excel -->
        <div class="mb-3">
            <div class="small fw-semibold text-secondary mb-1">
                Ejemplo de ubicación de datos en la hoja de Excel (Fila 1 = encabezados):
            </div>
            <div class="table-responsive border rounded-3">
                <table class="table table-sm table-bordered mb-0 small">
                    <thead class="table-primary">
                        <tr>
                            <th scope="col">Columna A: CATEGORIA *</th>
                            <th scope="col">Columna B: NOMBRE_ITEM *</th>
                            <th scope="col">Columna C: DESCRIPCION</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(row, idx) in exampleRows" :key="idx">
                            <td class="font-monospace fw-medium">{{ row.category }}</td>
                            <td>{{ row.item_name }}</td>
                            <td class="text-muted">{{ row.description }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="form-text small text-muted mt-1">
                Si escribes una categoría nueva, el sistema la creará automáticamente. Los ítems duplicados en la misma categoría se omiten sin generar errores.
            </div>
        </div>

        <!-- Selector de archivo -->
        <div class="border rounded-3 p-3 bg-light">
            <label class="form-label fw-semibold small mb-2" for="f-excel-bulk">
                Paso 2: Selecciona tu archivo Excel (.xlsx, .xls, .csv)
            </label>
            <input
                id="f-excel-bulk"
                ref="fileInput"
                type="file"
                class="form-control form-control-sm"
                accept=".xlsx,.xls,.csv"
                @change="onFileSelected"
            />
            <div v-if="selectedFile" class="d-flex align-items-center gap-2 mt-2 small text-success">
                <i class="fad fa-file-check" aria-hidden="true" />
                <span class="fw-medium">{{ selectedFile.name }}</span>
                <span class="text-muted">({{ formatSize(selectedFile.size) }})</span>
            </div>
        </div>

        <!-- Resumen de importación -->
        <div v-if="importSummary" class="mt-3 border rounded-3 p-3 bg-white">
            <div class="fw-semibold small mb-2 text-dark">Resultado de la importación:</div>
            <div class="d-flex flex-wrap gap-2">
                <span class="badge bg-success bg-opacity-10 text-success px-2 py-1">
                    Ítems creados: {{ importSummary.created_count ?? 0 }}
                </span>
                <span class="badge bg-secondary bg-opacity-10 text-secondary px-2 py-1">
                    Duplicados omitidos: {{ importSummary.skipped_count ?? 0 }}
                </span>
                <span class="badge bg-primary bg-opacity-10 text-primary px-2 py-1">
                    Categorías nuevas creadas: {{ importSummary.categories_created ?? 0 }}
                </span>
            </div>

            <div v-if="importSummary.errors?.length" class="mt-2">
                <div class="small fw-semibold text-warning mb-1">Filas con observaciones:</div>
                <ul class="small text-danger mb-0 ps-3 error-list">
                    <li v-for="(err, i) in importSummary.errors" :key="i">{{ err }}</li>
                </ul>
            </div>
        </div>

        <template #footer>
            <div class="d-flex justify-content-end gap-2 w-100">
                <button type="button" class="btn btn-falcon-default btn-sm" @click="close">Cerrar</button>
                <button
                    type="button"
                    class="btn btn-primary btn-sm"
                    :disabled="!selectedFile || uploading"
                    @click="handleUpload"
                >
                    <span v-if="uploading" class="spinner-border spinner-border-sm me-1" aria-hidden="true" />
                    <i v-else class="fad fa-upload me-1" aria-hidden="true" />
                    {{ uploading ? 'Importando...' : 'Procesar Carga Masiva' }}
                </button>
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
.error-list {
    max-height: 140px;
    overflow-y: auto;
}
</style>
