<template>
    <div class="signature-wrapper">
        <SignatureCanvas
            ref="canvas"
            :label="roleLabel"
            placeholder="Firme aquí"
            :loading="loading"
            :error="error"
            input-id="sig-canvas-internal"
            @change="onCambio"
        />

        <div class="sig-actions">
            <button
                type="button"
                class="btn-save"
                :disabled="isEmpty || loading"
                @click="save"
            >
                {{ loading ? 'Guardando...' : 'Guardar firma' }}
            </button>
        </div>

        <p v-if="success" class="sig-success">Firma guardada correctamente</p>
    </div>
</template>

<script setup>
/**
 * Firma en pantalla para los flujos autenticados: dibuja el trazo y lo guarda con
 * el servicio de firmas. El dibujo vive en `SignatureCanvas`, que también usan las
 * páginas públicas de firma por enlace.
 */
import { computed, ref } from 'vue'
import SignatureCanvas from '@/components/SignatureCanvas.vue'
import { useSignatureService } from '@/services/api/signature.service'

// --- props
const props = defineProps({
    entityType: { type: String, required: true },   // 'vehicle', 'driver', 'contract', 'vehicle_inspection'
    entityId: { type: [String, Number], required: true },
    role: { type: String, default: null },           // 'inspector' | 'coordinator' | null
})

const emit = defineEmits(['saved'])

// --- refs
const canvas = ref(null)
const isEmpty = ref(true)
const loading = ref(false)
const error = ref(null)
const success = ref(false)

const signatureService = useSignatureService()

const roleLabel = computed(() => {
    if (!props.role) return 'Firma del responsable'
    if (props.role === 'inspector') return 'Firma Inspector / Conductor'
    if (props.role === 'coordinator') return 'Firma Coordinador HSEQ / Operaciones'
    return 'Firma del responsable'
})

function onCambio({ vacio }) {
    isEmpty.value = vacio
    if (!vacio) {
        error.value = null
        success.value = false
    }
}

// --- guardar
async function save() {
    const base64 = canvas.value?.toPng?.()
    if (!base64) return

    error.value = null
    success.value = false
    loading.value = true
    try {
        const payload = {
            entity_type: props.entityType,
            entity_id: props.entityId,
            signature: base64,            // data:image/png;base64,...
        }
        if (props.role) payload.role = props.role
        const result = await signatureService.store(payload)
        success.value = true
        emit('saved', result.data)
    } catch (err) {
        error.value = err.response?.data?.message ?? 'Error al guardar la firma'
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.signature-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
    font-family: inherit;
}

.sig-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
}

button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 6px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: var(--p-primary-color, #3b82f6);
    color: var(--p-primary-contrast-color, #ffffff);
}

button:hover:not(:disabled) {
    opacity: 0.9;
}

button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.sig-success {
    font-size: 0.75rem;
    color: #10b981;
    margin: 0;
}
</style>