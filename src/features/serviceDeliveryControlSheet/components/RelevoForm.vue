<script setup>
import { computed, reactive, ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import PrimeSelect from '@/components/form/PrimeSelect.vue';
import { armarPayloadRelevo, validarRelevo } from '../utils/relevo.js';

/**
 * Modal del relevo de conductor: elige quién toma el turno del vehículo. El
 * backend suma la asignación del entrante, conserva la del conductor anterior y
 * abre la hoja de control del día del entrante, sin cerrar la del saliente.
 */

const props = defineProps({
    /** Controla la apertura de la modal. */
    visible: { type: Boolean, default: false },
    /** Bloque `assignment.relevo` que entrega el detalle del proyecto. */
    relevo: { type: Object, required: true },
    /** UUID del proyecto del vehículo. */
    projectUuid: { type: String, required: true },
    /** UUID del vehículo sobre el que se releva. */
    vehicleUuid: { type: String, required: true },
    /** Placa o rótulo del vehículo para el encabezado. */
    vehicleLabel: { type: String, default: '' },
    /** Conductores de la empresa aptos para recibir el turno. */
    candidatos: { type: Array, default: () => [] },
    saving: { type: Boolean, default: false },
    serverError: { type: String, default: '' },
});

const emit = defineEmits(['submit', 'update:visible']);

const errores = ref({});
const form = reactive({ third_party_uuid: '' });

const conductorEntrante = computed(
    () => props.candidatos.find((c) => c.uuid === form.third_party_uuid)?.label || '',
);

watch(() => props.visible, (abierta) => {
    if (!abierta) return;
    form.third_party_uuid = '';
    errores.value = {};
});

const aplicar = () => {
    errores.value = validarRelevo(form);
    if (Object.keys(errores.value).length) return;

    emit('submit', armarPayloadRelevo({
        projectUuid: props.projectUuid,
        vehicleUuid: props.vehicleUuid,
        thirdPartyUuid: form.third_party_uuid,
    }));
};
</script>

<template>
    <Dialog :visible="visible" modal :draggable="false" :style="{ width: 'min(560px, 96vw)' }"
        class="p-fluid relevo-dialog" @update:visible="emit('update:visible', $event)">
        <template #header>
            <div class="d-flex align-items-center gap-2">
                <i class="fad fa-right-left text-primary fs-4" aria-hidden="true" />
                <div>
                    <h5 class="mb-0">Relevo de conductor</h5>
                    <small class="text-muted">
                        {{ vehicleLabel || 'Vehículo' }} · planilla abierta
                        {{ relevo?.start_time || '—' }} · km {{ relevo?.starting_kilometer || '—' }}
                    </small>
                </div>
            </div>
        </template>

        <div class="mb-2">
            <label class="form-label small text-muted mb-1" for="f-relevo-conductor">Conductor entrante</label>
            <PrimeSelect v-model="form.third_party_uuid" :options="candidatos"
                optionLabel="label" optionValue="uuid" :filter="true" showClear
                placeholder="Seleccione conductor..." class="w-100"
                :input-id="'f-relevo-conductor'" :invalid="!!errores.third_party_uuid"
                :aria-describedby="errores.third_party_uuid ? 'f-relevo-conductor-error' : undefined" />
            <div v-if="errores.third_party_uuid" id="f-relevo-conductor-error" class="text-danger small mt-1"
                role="alert">
                {{ errores.third_party_uuid }}
            </div>
        </div>

        <p class="mb-0 small text-dark">
            El vehículo suma el turno de
            <strong>{{ conductorEntrante || 'el conductor entrante' }}</strong> y se abre su hoja de control
            del día. <strong>{{ relevo?.driver_name || 'El conductor actual' }}</strong> sigue vigente en el
            proyecto: su planilla abierta no se cierra ni se modifica.
        </p>

        <p v-if="!candidatos.length" class="text-muted small mt-2 mb-0">
            <i class="fad fa-info-circle me-1" aria-hidden="true" />
            No hay conductores activos en la empresa para tomar el turno.
        </p>

        <div v-if="serverError" class="text-danger small mt-2" role="alert">
            {{ serverError }}
        </div>

        <template #footer>
            <button type="button" class="btn btn-primary btn-sm"
                :disabled="saving || !form.third_party_uuid" @click="aplicar">
                <span v-if="saving" class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                <i v-else class="fad fa-check me-1" aria-hidden="true"></i>
                Aplicar relevo
            </button>
        </template>
    </Dialog>
</template>
