<template>
    <Dialog
        :visible="visible"
        @update:visible="emit('update:visible', $event)"
        :modal="true"
        :closable="true"
        :draggable="false"
        :style="{ width: '720px', maxWidth: '95vw' }"
        class="p-fluid"
        header="Gestionar Asignaciones"
    >
        <template #header>
            <div class="d-flex align-items-center gap-2 w-100">
                <i class="fad fa-users-cog text-primary fs-4" aria-hidden="true"></i>
                <h5 class="mb-0 fw-bold flex-grow-1">Gestionar Asignaciones - {{ projectName }}</h5>
            </div>
        </template>

        <div class="p-1">
            <!-- Loading state -->
            <div v-if="loading" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando asignaciones...</span>
                </div>
                <p class="text-muted small mt-2">Cargando vehículos pendientes...</p>
            </div>

            <!-- Error state -->
            <div v-else-if="error" class="alert alert-danger py-2 px-3 small" role="alert">
                <i class="fad fa-triangle-exclamation me-1" aria-hidden="true"></i>{{ error }}
            </div>

            <!-- Content -->
            <template v-else>
                <!-- Vehículos asignados SIN hojas de control (alta pendiente) -->
                <div v-if="assignedWithoutSheets.length > 0">
                    <div class="mb-2">
                        <h6 class="fw-semibold text-warning mb-2 d-flex align-items-center gap-2">
                            <i class="fad fa-triangle-exclamation" aria-hidden="true"></i>
                            Vehículos asignados SIN hojas de control ({{ assignedWithoutSheets.length }})
                        </h6>
                        <p class="text-muted small mb-2">
                            Estos vehículos están en el proyecto pero aún no tienen sus Hojas de Control de Servicio.
                        </p>
                    </div>

                    <div class="table-responsive" style="max-height: 400px;">
                        <table class="table table-sm table-hover mb-0">
                            <thead class="table-light sticky-top">
                                <tr>
                                    <th scope="col">Placa</th>
                                    <th scope="col">N° Interno</th>
                                    <th scope="col">Conductor asignado</th>
                                    <th scope="col">Documento</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="vehicle in assignedWithoutSheets" :key="vehicle.vehicle_uuid">
                                    <td>
                                        <span class="fw-medium font-monospace">{{ vehicle.vehicle?.vehicle_license_plate || '—' }}</span>
                                    </td>
                                    <td>
                                        <small class="text-muted">{{ vehicle.vehicle?.internal_number || '—' }}</small>
                                    </td>
                                    <td>
                                        <span class="fw-medium">{{ driverName(vehicle.thirdParty) }}</span>
                                    </td>
                                    <td>
                                        <small class="text-muted">{{ vehicle.thirdParty?.document_number || '—' }}</small>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Empty state -->
                <div v-else class="text-center py-4">
                    <i class="fad fa-circle-check text-success fs-2 mb-2" aria-hidden="true"></i>
                    <p class="text-muted mb-0">Todos los vehículos del proyecto ya tienen sus Hojas de Control de Servicio.</p>
                </div>

                <!-- Action buttons -->
                <div class="d-flex justify-content-end gap-2 mt-3 pt-2 border-top">
                    <button type="button" class="btn btn-falcon-default btn-sm" @click="closeModal">Cerrar</button>
                    <button
                        v-if="assignedWithoutSheets.length > 0 && canCreate"
                        type="button"
                        class="btn btn-primary btn-sm"
                        :disabled="saving"
                        @click="crearHojas"
                    >
                        <span v-if="saving" class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                        <i v-else class="fad fa-file-circle-plus me-1" aria-hidden="true"></i>
                        Crear hojas para estos vehículos
                    </button>
                </div>
            </template>
        </div>
    </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import { useServiceDeliveryControlSheetStore } from '../store/serviceDeliveryControlSheet.store.js';
import { toast } from '@/utils/toast.js';
import { logger } from '@/utils/logger.js';

const props = defineProps({
    visible: { type: Boolean, default: false },
    projectUuid: { type: String, default: '' },
    projectName: { type: String, default: '' },
    canCreate: { type: Boolean, default: true },
});

const emit = defineEmits(['update:visible', 'saved']);

const store = useServiceDeliveryControlSheetStore();

const loading = ref(false);
const error = ref('');
const saving = ref(false);

const assignedWithoutSheets = ref([]);
const projectDetail = ref(null);

const closeModal = () => {
    emit('update:visible', false);
};

const loadData = async () => {
    if (!props.projectUuid) return;

    loading.value = true;
    error.value = '';

    try {
        const [detail, sinHoja] = await Promise.all([
            store.loadProjectDetail(props.projectUuid),
            store.loadAssignedWithoutSheets(props.projectUuid),
        ]);
        projectDetail.value = detail;
        assignedWithoutSheets.value = Array.isArray(sinHoja) ? sinHoja : [];
    } catch (err) {
        logger.error('Error loading pending sheets:', { err });
        error.value = err?.response?.data?.message || err?.message || 'Error al cargar los vehículos pendientes';
    } finally {
        loading.value = false;
    }
};

const driverName = (thirdParty) => {
    if (!thirdParty) return '—';
    const full = `${thirdParty.first_name || ''} ${thirdParty.last_name || ''}`.trim();
    return full || thirdParty.company_name || thirdParty.document_number || 'Conductor';
};

/**
 * Crea las hojas de control pendientes para los vehículos que ya están en el
 * proyecto pero aún no tienen ninguna hoja (alta pendiente SPEC-009).
 * Usa el rango de vigencia del proyecto como fechas por defecto.
 */
const crearHojas = async () => {
    if (assignedWithoutSheets.value.length === 0) return;

    const detail = projectDetail.value;
    const startDate = detail?.start_date ? String(detail.start_date).slice(0, 10) : null;
    const endDate = detail?.completion_date ? String(detail.completion_date).slice(0, 10) : (startDate || null);

    if (!startDate) {
        await toast('Advertencia', 'El proyecto no tiene fecha de inicio para generar las hojas.', 'warning');
        return;
    }

    saving.value = true;
    try {
        const vehicleUuids = assignedWithoutSheets.value.map(v => v.vehicle_uuid);
        await store.createBulk({
            project_uuid: props.projectUuid,
            vehicle_uuids: vehicleUuids,
            service_date: startDate,
            start_date: startDate,
            end_date: endDate,
        });
        emit('saved');
        await loadData();
    } catch (err) {
        logger.error('Error creando hojas pendientes:', { err });
        const details = err?.response?.data?.error?.details;
        if (Array.isArray(details) && details[0]?.messages?.[0]) {
            await toast('Error', details[0].messages[0], 'error');
        } else {
            await toast('Error', 'No se pudieron crear las hojas de control', 'error');
        }
    } finally {
        saving.value = false;
    }
};

watch(() => props.visible, async (isVisible) => {
    if (isVisible) {
        assignedWithoutSheets.value = [];
        await loadData();
    }
});

// Load when projectUuid changes
watch(() => props.projectUuid, async (newUuid) => {
    if (props.visible && newUuid) {
        await loadData();
    }
});
</script>

<style scoped>
/* Ensure dialog content fits well */
:deep(.p-dialog-content) {
    padding: 0.5rem;
    max-height: 70vh;
    overflow-y: auto;
}

:deep(.p-dialog-header) {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--surface-border);
}

:deep(.p-dialog-footer) {
    padding: 0.5rem 1rem;
    border-top: 1px solid var(--surface-border);
}

/* Table improvements */
.table-sm th {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: #64748b;
    border-bottom: 2px solid #e2e8f0;
}

.table-sm td {
    font-size: 0.8rem;
    vertical-align: middle;
    padding: 0.5rem;
}

.table-hover tbody tr:hover {
    background-color: #f8fafc;
}

/* Scrollbar for table */
.table-responsive::-webkit-scrollbar {
    height: 6px;
}

.table-responsive::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
}

.table-responsive::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

.table-responsive::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}
</style>
