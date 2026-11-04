<script setup>
import { computed } from 'vue';
import Dialog from 'primevue/dialog';
import {
    formatearFechaLarga,
    estiloEventoCalendario,
    enlaceEditarDocumento,
} from '../utils/expirationCalendarUtils.js';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false,
    },
    date: {
        type: String,
        default: null,
    },
    events: {
        type: Array,
        default: () => [],
    },
    can: {
        type: Function,
        default: () => false,
    },
});

const emit = defineEmits(['update:visible', 'close']);

const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => {
        emit('update:visible', val);
        if (!val) emit('close');
    },
});

const alertCount = computed(() => {
    const plates = new Set();
    for (const ev of props.events) {
        if (ev.days_remaining <= 15) {
            plates.add(ev.vehicle_license_plate);
        }
    }
    return plates.size;
});

const hasCriticalAlerts = computed(() =>
    props.events.some((ev) => ev.status === 'expired' || ev.status === 'today' || ev.days_remaining <= 0)
);

const hasWarningAlerts = computed(() =>
    props.events.some((ev) => (ev.days_remaining > 0 && ev.days_remaining <= 15) || ev.status === 'expiring_5d' || ev.status === 'expiring_15d')
);

function badgeEstadoClase(ev) {
    const tone = estiloEventoCalendario(ev).tone;
    if (tone === 'danger') return 'noa-status--danger';
    if (tone === 'warning') return 'noa-status--warning';
    if (tone === 'success') return 'noa-status--success';
    return 'noa-status--info';
}

function cerrarModal() {
    dialogVisible.value = false;
}
</script>

<template>
    <Dialog
        v-model:visible="dialogVisible"
        :modal="true"
        :draggable="false"
        :dismissable-mask="true"
        :style="{ width: '720px', maxWidth: '95vw' }"
        class="noa-calendar-day-dialog"
        aria-label="Detalle de vencimientos del día"
    >
        <template #header>
            <div class="d-flex align-items-center justify-content-between w-100 pe-2 flex-wrap gap-2">
                <div class="d-flex align-items-center gap-3">
                    <span class="noa-day-modal-icon" aria-hidden="true">
                        <i class="fad fa-calendar-day text-primary" aria-hidden="true"></i>
                    </span>
                    <div>
                        <h2 class="h6 fw-bold text-900 mb-0">
                            Vencimientos del {{ formatearFechaLarga(date) }}
                        </h2>
                        <p class="fs-11 text-600 mb-0">
                            Auditoría y control preventivo de vigencias vehiculares
                        </p>
                    </div>
                </div>

                <span
                    class="noa-status"
                    :class="hasCriticalAlerts ? 'noa-status--danger' : (hasWarningAlerts ? 'noa-status--warning' : 'noa-status--success')"
                >
                    <span class="noa-status-dot" aria-hidden="true"></span>
                    <template v-if="alertCount > 0">
                        {{ alertCount }} {{ alertCount === 1 ? 'vehículo en alerta' : 'vehículos en alerta' }}
                    </template>
                    <template v-else>
                        {{ events.length }} {{ events.length === 1 ? 'vencimiento al día' : 'vencimientos al día' }}
                    </template>
                </span>
            </div>
        </template>

        <div v-if="events.length === 0" class="text-center py-4">
            <i class="fad fa-calendar-check fa-2x text-400 mb-2" aria-hidden="true"></i>
            <p class="fw-semibold text-700 mb-1">Sin vencimientos registrados en esta fecha</p>
            <p class="fs-10 text-500 mb-0">
                No existen documentos ni convenios que venzan el {{ formatearFechaLarga(date) }} con los filtros actuales.
            </p>
        </div>

        <div v-else class="table-responsive noa-day-modal-table-wrap">
            <table class="table table-sm align-middle mb-0 noa-table">
                <thead class="bg-100">
                    <tr>
                        <th scope="col" class="ps-3 py-2">Vehículo / Documento</th>
                        <th scope="col" class="py-2">Fecha de Vencimiento</th>
                        <th scope="col" class="text-end pe-3 py-2">Acción</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="ev in events" :key="ev.id" class="noa-day-modal-row">
                        <td class="ps-3 py-3">
                            <div class="d-flex align-items-start gap-2">
                                <span class="noa-plate-badge">
                                    {{ ev.vehicle_license_plate }}
                                </span>
                                <div class="min-w-0">
                                    <div class="fw-bold text-900 fs-10 d-flex align-items-center gap-1 flex-wrap">
                                        <span>{{ ev.category_label }}</span>
                                        <span
                                            v-if="ev.is_own !== undefined"
                                            class="badge rounded-pill fs-11"
                                            :class="ev.is_own ? 'badge-subtle-primary' : 'badge-subtle-secondary'"
                                        >
                                            {{ ev.ownership_label || (ev.is_own ? 'Propio' : 'Tercero') }}
                                        </span>
                                    </div>
                                    <div class="fs-11 text-600 text-truncate" style="max-width: 310px">
                                        {{ ev.subtitle }}
                                    </div>
                                    <div
                                        v-if="ev.affiliate_name || ev.branch_name"
                                        class="fs-11 text-500 mt-1 d-flex align-items-center gap-2 flex-wrap"
                                    >
                                        <span v-if="ev.branch_name">
                                            <i class="fal fa-map-marker-alt me-1" aria-hidden="true"></i>{{ ev.branch_name }}
                                        </span>
                                        <span v-if="ev.affiliate_name" class="text-truncate" style="max-width: 220px">
                                            <i class="fal fa-building me-1" aria-hidden="true"></i>{{ ev.affiliate_name }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </td>

                        <td class="py-3">
                            <span
                                class="noa-status"
                                :class="badgeEstadoClase(ev)"
                            >
                                <i
                                    :class="estiloEventoCalendario(ev).icon"
                                    class="me-1"
                                    aria-hidden="true"
                                ></i>
                                <span>{{ estiloEventoCalendario(ev).statusText }}</span>
                            </span>
                        </td>

                        <td class="text-end pe-3 py-3">
                            <div class="d-inline-flex align-items-center gap-1">
                                <router-link
                                    v-if="ev.vehicle_uuid"
                                    :to="{ name: 'vehicles.profile', params: { id: ev.vehicle_uuid } }"
                                    class="btn btn-sm btn-falcon-default d-inline-flex align-items-center gap-1"
                                    :aria-label="`Ver perfil del vehículo ${ev.vehicle_license_plate}`"
                                    @click="cerrarModal"
                                >
                                    <span>Ver perfil del vehículo</span>
                                    <i class="fal fa-external-link-alt fs-11" aria-hidden="true"></i>
                                </router-link>

                                <router-link
                                    v-if="enlaceEditarDocumento(ev, can)"
                                    :to="enlaceEditarDocumento(ev, can)"
                                    class="btn btn-sm btn-falcon-default"
                                    :aria-label="`Editar ${ev.category_label} del vehículo ${ev.vehicle_license_plate}`"
                                    title="Editar documento"
                                    @click="cerrarModal"
                                >
                                    <i class="fal fa-pen" aria-hidden="true"></i>
                                </router-link>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <template #footer>
            <div class="d-flex align-items-center justify-content-between w-100">
                <span class="fs-11 text-500">
                    <i class="fal fa-shield-check me-1" aria-hidden="true"></i>
                    Sincronizado con documentos vehiculares y convenios activos
                </span>
                <button
                    type="button"
                    class="btn btn-sm btn-falcon-default"
                    @click="cerrarModal"
                >
                    Cerrar
                </button>
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
.noa-day-modal-icon {
    width: 2.35rem;
    height: 2.35rem;
    border-radius: 0.5rem;
    background: rgba(44, 123, 229, 0.1);
    border: 1px solid rgba(44, 123, 229, 0.2);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.05rem;
    flex-shrink: 0;
}

.noa-day-modal-table-wrap {
    max-height: 60vh;
    overflow-y: auto;
    border: 1px solid var(--bs-border-color, #e2e8f0);
    border-radius: 0.5rem;
}

.noa-plate-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.2rem 0.5rem;
    font-family: var(--bs-font-monospace, monospace);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: #1d4ed8;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 0.35rem;
    flex-shrink: 0;
}

.noa-day-modal-row:hover {
    background-color: rgba(44, 123, 229, 0.03);
}
</style>
