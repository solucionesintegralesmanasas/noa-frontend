<script setup>
import { computed, ref } from 'vue';
import { textoUltimoReporte } from '../utils/conductoresVigentes';

const props = defineProps({
    /** Conductores activos (los que están reportando ubicación). */
    drivers: { type: Array, default: () => [] },
    /** Conductor bajo seguimiento, o null si aún no se elige. */
    selected: { type: Object, default: null },
    loading: { type: Boolean, default: false },
    follow: { type: Boolean, default: false },
    /** El historial del día se está cargando para sembrar la estela. */
    trailLoading: { type: Boolean, default: false },
});

const emit = defineEmits(['select', 'toggle-follow', 'open-history']);

const busqueda = ref('');

function uuidDe(driver) {
    return driver?.third_party_uuid || driver?.driver?.uuid || null;
}

function nombreDe(driver) {
    const nombre = driver?.driver?.first_name || driver?.first_name || 'Conductor';
    const apellido = driver?.driver?.last_name || driver?.last_name || '';
    return `${nombre} ${apellido}`.trim();
}

function inicialesDe(driver) {
    const partes = nombreDe(driver).split(/\s+/).filter(Boolean);
    if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
    return (partes[0]?.[0] || '?').toUpperCase();
}

const filtrados = computed(() => {
    const termino = busqueda.value.trim().toLowerCase();
    if (!termino) return props.drivers;
    return props.drivers.filter((driver) => {
        const texto = [
            nombreDe(driver),
            driver?.vehicle?.vehicle_license_plate || driver?.vehicle_license_plate || '',
            driver?.driver?.document_number || driver?.document_number || '',
        ].join(' ').toLowerCase();
        return texto.includes(termino);
    });
});

const velocidad = computed(() =>
    Math.round(props.selected?.speed ?? props.selected?.last_location?.speed ?? 0)
);

const enMovimiento = computed(() =>
    props.selected?.is_moving ?? props.selected?.last_location?.is_moving ?? false
);

const bateria = computed(() => {
    const nivel = props.selected?.battery_level ?? props.selected?.last_location?.battery_level;
    return Number.isFinite(Number(nivel)) ? Number(nivel) : null;
});

const placa = computed(() =>
    props.selected?.vehicle?.vehicle_license_plate || props.selected?.vehicle_license_plate || 'Sin vehículo'
);

const documento = computed(() =>
    props.selected?.driver?.document_number || props.selected?.document_number || ''
);

const proyecto = computed(() =>
    props.selected?.project?.project_name || props.selected?.planilla_dia?.project_name || null
);

const funcionario = computed(() => {
    const rutas = props.selected?.planilla_dia?.routes || [];
    const primera = rutas.find((r) => r.funcionario_nombre || r.funcionario_cc);
    if (!primera) return null;
    const extra = rutas.length > 1 ? ` +${rutas.length - 1}` : '';
    return `${primera.funcionario_nombre || 'Funcionario'}${primera.funcionario_cc ? ` · CC ${primera.funcionario_cc}` : ''}${extra}`;
});

const ruta = computed(() => {
    const rutas = props.selected?.planilla_dia?.routes || [];
    if (!rutas.length) return null;
    const base = `${rutas[0].origin || '?'} → ${rutas[0].destination || '?'}`;
    return rutas.length > 1 ? `${base} · +${rutas.length - 1}` : base;
});
</script>

<template>
    <div class="d-flex flex-column h-100">
        <!-- Buscador -->
        <div class="noa-follow-search">
            <label for="f-seguimiento-busqueda" class="visually-hidden">Buscar conductor por nombre, placa o documento</label>
            <i class="fal fa-search noa-follow-search__icon" aria-hidden="true"></i>
            <input
                id="f-seguimiento-busqueda"
                v-model="busqueda"
                class="noa-follow-search__input"
                type="search"
                placeholder="Buscar conductor, placa o documento..."
            >
        </div>

        <!-- Ficha del conductor elegido -->
        <div v-if="selected" class="noa-follow-sheet">
            <div class="d-flex align-items-start gap-2">
                <div class="noa-follow-avatar" :class="enMovimiento ? 'noa-follow-avatar--moving' : 'noa-follow-avatar--stopped'">
                    {{ inicialesDe(selected) }}
                </div>
                <div class="flex-grow-1 min-width-0">
                    <div class="noa-follow-name">{{ nombreDe(selected) }}</div>
                    <div class="noa-follow-sub">
                        <i class="fas fa-car me-1" aria-hidden="true"></i>{{ placa }}
                        <span v-if="documento"> · CC {{ documento }}</span>
                    </div>
                </div>
                <div class="noa-follow-speed" :class="enMovimiento ? 'noa-follow-speed--moving' : 'noa-follow-speed--stopped'">
                    {{ velocidad }} <span class="noa-follow-speed__unit">km/h</span>
                </div>
            </div>

            <div class="d-flex flex-wrap align-items-center gap-2 mt-3">
                <span class="noa-follow-status" :class="enMovimiento ? 'noa-follow-status--moving' : 'noa-follow-status--stopped'">
                    <span class="noa-follow-status__dot" aria-hidden="true"></span>
                    {{ enMovimiento ? 'En movimiento' : 'Detenido' }}
                </span>
                <span v-if="bateria !== null" class="noa-follow-chip">
                    <i class="fas fa-battery-half me-1" aria-hidden="true"></i>{{ bateria }}%
                </span>
                <span class="noa-follow-chip">
                    <i class="far fa-clock me-1" aria-hidden="true"></i>{{ textoUltimoReporte(selected) }}
                </span>
            </div>

            <div v-if="proyecto || funcionario || ruta" class="noa-follow-details">
                <div v-if="proyecto" class="noa-follow-detail">
                    <span class="noa-follow-detail__label">Proyecto</span>
                    <span class="noa-follow-detail__value">{{ proyecto }}</span>
                </div>
                <div v-if="funcionario" class="noa-follow-detail">
                    <span class="noa-follow-detail__label">Funcionario</span>
                    <span class="noa-follow-detail__value">{{ funcionario }}</span>
                </div>
                <div v-if="ruta" class="noa-follow-detail">
                    <span class="noa-follow-detail__label">Ruta</span>
                    <span class="noa-follow-detail__value">{{ ruta }}</span>
                </div>
            </div>

            <div class="d-flex gap-2 mt-3">
                <button
                    type="button"
                    class="btn btn-falcon-primary btn-sm flex-grow-1"
                    :aria-pressed="follow ? 'true' : 'false'"
                    @click="emit('toggle-follow')"
                >
                    <i class="fad" :class="follow ? 'fa-pause' : 'fa-location-arrow'" aria-hidden="true"></i>
                    <span class="ms-1">{{ follow ? 'Dejar de seguir' : 'Seguir conductor' }}</span>
                </button>
                <button
                    type="button"
                    class="btn btn-falcon-default btn-sm"
                    title="Ver historial de ruta"
                    aria-label="Ver historial de ruta"
                    @click="emit('open-history', selected)"
                >
                    <i class="fad fa-route" aria-hidden="true"></i>
                    <span class="ms-1 d-none d-xl-inline">Historial</span>
                </button>
            </div>

            <div v-if="trailLoading" class="noa-follow-note mt-2">
                <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                Cargando el recorrido de hoy...
            </div>
        </div>

        <div v-else class="noa-follow-empty">
            <i class="fad fa-location-arrow" aria-hidden="true"></i>
            <p class="mb-0">Elige un conductor de la lista para seguirlo en el mapa.</p>
        </div>

        <!-- Lista de conductores -->
        <div class="noa-follow-list scrollbar">
            <button
                v-for="driver in filtrados"
                :key="uuidDe(driver)"
                type="button"
                class="noa-follow-item"
                :class="{ 'noa-follow-item--active': uuidDe(driver) === uuidDe(selected) }"
                :aria-pressed="uuidDe(driver) === uuidDe(selected) ? 'true' : 'false'"
                @click="emit('select', driver)"
            >
                <div class="noa-follow-avatar noa-follow-avatar--sm"
                    :class="(driver.is_moving ?? driver.last_location?.is_moving) ? 'noa-follow-avatar--moving' : 'noa-follow-avatar--stopped'">
                    {{ inicialesDe(driver) }}
                </div>
                <div class="flex-grow-1 min-width-0">
                    <div class="noa-follow-item__name">{{ nombreDe(driver) }}</div>
                    <div class="noa-follow-item__sub">
                        {{ driver.vehicle?.vehicle_license_plate || driver.vehicle_license_plate || 'Sin vehículo' }}
                        · {{ textoUltimoReporte(driver) }}
                    </div>
                </div>
                <div class="noa-follow-item__speed">
                    {{ Math.round(driver.speed ?? driver.last_location?.speed ?? 0) }} km/h
                </div>
            </button>

            <div v-if="!filtrados.length" class="noa-follow-empty noa-follow-empty--list">
                <template v-if="loading">
                    <span class="spinner-border spinner-border-sm mb-2" aria-hidden="true"></span>
                    <p class="mb-0">Buscando conductores en línea...</p>
                </template>
                <template v-else>
                    <i class="fad fa-satellite-dish" aria-hidden="true"></i>
                    <p class="mb-0">
                        {{ busqueda ? 'Ningún conductor coincide con la búsqueda.' : 'No hay conductores reportando ubicación.' }}
                    </p>
                </template>
            </div>
        </div>
    </div>
</template>

<style scoped>
.min-width-0 {
    min-width: 0;
}

.noa-follow-search {
    position: relative;
    margin-bottom: 0.75rem;
}

.noa-follow-search__icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #64748b;
    font-size: 0.8rem;
}

.noa-follow-search__input {
    width: 100%;
    height: 36px;
    padding: 0 10px 0 32px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.82rem;
    color: #1e293b;
    background: #ffffff;
}

.noa-follow-search__input:focus {
    outline: 2px solid #2c7be5;
    outline-offset: 1px;
    border-color: #2c7be5;
}

.noa-follow-sheet {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 0.85rem;
    margin-bottom: 0.75rem;
    background: #ffffff;
}

.noa-follow-avatar {
    width: 42px;
    height: 42px;
    min-width: 42px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.82rem;
    color: #ffffff;
}

.noa-follow-avatar--sm {
    width: 34px;
    height: 34px;
    min-width: 34px;
    font-size: 0.72rem;
}

.noa-follow-avatar--moving {
    background: #16a34a;
    border: 2px solid #ffffff;
    box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.3);
}

.noa-follow-avatar--stopped {
    background: #b45309;
    border: 2px solid #ffffff;
    box-shadow: 0 0 0 2px rgba(180, 83, 9, 0.25);
}

.noa-follow-name {
    font-size: 0.92rem;
    font-weight: 600;
    color: #1e293b;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.noa-follow-sub {
    font-size: 0.75rem;
    color: #64748b;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.noa-follow-speed {
    font-size: 1.05rem;
    font-weight: 700;
    line-height: 1;
    border-radius: 20px;
    padding: 5px 10px;
    white-space: nowrap;
}

.noa-follow-speed__unit {
    font-size: 0.65rem;
    font-weight: 500;
}

.noa-follow-speed--moving {
    background: rgba(22, 163, 74, 0.12);
    color: #15803d;
    border: 1px solid rgba(22, 163, 74, 0.25);
}

.noa-follow-speed--stopped {
    background: rgba(180, 83, 9, 0.1);
    color: #92400e;
    border: 1px solid rgba(180, 83, 9, 0.25);
}

.noa-follow-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 20px;
    padding: 3px 10px;
}

.noa-follow-status__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
}

.noa-follow-status--moving {
    background: rgba(22, 163, 74, 0.12);
    color: #15803d;
}

.noa-follow-status--moving .noa-follow-status__dot {
    background: #16a34a;
}

.noa-follow-status--stopped {
    background: rgba(180, 83, 9, 0.1);
    color: #92400e;
}

.noa-follow-status--stopped .noa-follow-status__dot {
    background: #b45309;
}

.noa-follow-chip {
    display: inline-flex;
    align-items: center;
    font-size: 0.72rem;
    color: #475569;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 3px 9px;
}

.noa-follow-details {
    margin-top: 0.75rem;
    padding-top: 0.6rem;
    border-top: 1px dashed #e2e8f0;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.noa-follow-detail {
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-size: 0.76rem;
}

.noa-follow-detail__label {
    color: #64748b;
    font-size: 0.68rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    min-width: 72px;
}

.noa-follow-detail__value {
    color: #1e293b;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.noa-follow-note {
    font-size: 0.74rem;
    color: #64748b;
}

.noa-follow-empty {
    border: 1px dashed #e2e8f0;
    border-radius: 12px;
    padding: 1.25rem 1rem;
    text-align: center;
    color: #64748b;
    font-size: 0.82rem;
    margin-bottom: 0.75rem;
}

.noa-follow-empty i {
    font-size: 1.4rem;
    display: block;
    margin-bottom: 0.5rem;
    opacity: 0.6;
}

.noa-follow-empty--list {
    margin-bottom: 0;
}

.noa-follow-list {
    flex-grow: 1;
    overflow-y: auto;
    min-height: 120px;
    border-top: 1px solid #e2e8f0;
}

.noa-follow-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 9px 8px;
    background: transparent;
    border: none;
    border-bottom: 1px solid #f1f3f5;
    border-left: 3px solid transparent;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.15s ease-in-out;
}

.noa-follow-item:hover {
    background: #f8fafc;
}

.noa-follow-item:focus-visible {
    outline: 2px solid #2c7be5;
    outline-offset: -2px;
}

.noa-follow-item--active {
    background: #eff6ff;
    border-left-color: #2c7be5;
}

.noa-follow-item__name {
    font-size: 0.82rem;
    font-weight: 600;
    color: #1e293b;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.noa-follow-item__sub {
    font-size: 0.7rem;
    color: #64748b;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.noa-follow-item__speed {
    font-size: 0.72rem;
    font-weight: 600;
    color: #475569;
    white-space: nowrap;
}
</style>
