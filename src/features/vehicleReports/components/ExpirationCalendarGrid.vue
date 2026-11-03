<script setup>
import { computed } from 'vue';
import '@/assets/styles/components/_data-list.css';
import {
    DIAS_SEMANA_CORTOS,
    NOMBRES_MESES,
    construirCeldasMes,
    construirCeldasSemana,
    estiloEventoCalendario,
    formatearFechaCorta,
    formatearFechaLarga,
} from '../utils/expirationCalendarUtils.js';

const props = defineProps({
    month: {
        type: Number,
        required: true,
    },
    year: {
        type: Number,
        required: true,
    },
    today: {
        type: String,
        default: '',
    },
    selectedDate: {
        type: String,
        default: '',
    },
    viewMode: {
        type: String,
        default: 'month', // 'month' | 'week' | 'agenda'
    },
    events: {
        type: Array,
        default: () => [],
    },
    eventsByDate: {
        type: Object,
        default: () => ({}),
    },
    loading: {
        type: Boolean,
        default: false,
    },
    search: {
        type: String,
        default: '',
    },
});

const emit = defineEmits([
    'prevMonth',
    'nextMonth',
    'goToToday',
    'update:viewMode',
    'update:search',
    'selectDay',
    'openEvent',
]);

const tituloMesAnio = computed(() => {
    const nombre = NOMBRES_MESES[props.month - 1] || '';
    return `${nombre} ${props.year}`;
});

const celdasMes = computed(() =>
    construirCeldasMes(props.year, props.month, props.eventsByDate, props.today)
);

const celdasSemana = computed(() =>
    construirCeldasSemana(
        props.selectedDate || props.today,
        props.month,
        props.year,
        props.eventsByDate,
        props.today
    )
);

const celdasVisibles = computed(() =>
    props.viewMode === 'week' ? celdasSemana.value : celdasMes.value
);

const gruposAgenda = computed(() => {
    const prefix = `${String(props.year)}-${String(props.month).padStart(2, '0')}`;
    const delMes = props.events.filter((ev) => String(ev.date || '').startsWith(prefix));
    const fuente = delMes.length > 0 ? delMes : props.events;

    const map = new Map();
    for (const ev of fuente) {
        if (!map.has(ev.date)) {
            map.set(ev.date, []);
        }
        map.get(ev.date).push(ev);
    }

    return Array.from(map.entries()).map(([date, items]) => ({
        date,
        labelLarga: formatearFechaLarga(date),
        isToday: date === props.today,
        items,
    }));
});

const badgeCeldaClase = (cell) => {
    if (cell.hasCritical) return 'noa-cell-count--danger';
    if (cell.hasWarning) return 'noa-cell-count--warning';
    return 'noa-cell-count--primary';
};

const onCellClick = (cell) => {
    emit('selectDay', cell.date);
};
</script>

<template>
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.08s;">
        <!-- TOOLBAR UNIFICADA DE BÚSQUEDA Y RESULTADOS (Estándar NOA / Falcon) -->
        <div class="noa-list-toolbar">
            <div class="noa-search">
                <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                <input
                    id="f-calendario-busqueda"
                    :value="search"
                    class="noa-search__input"
                    type="search"
                    placeholder="Filtrar por placa o modelo..."
                    aria-label="Buscar en calendario de vencimientos"
                    @input="emit('update:search', $event.target.value)"
                />
                <button
                    v-if="search"
                    class="noa-search__clear"
                    type="button"
                    title="Limpiar búsqueda"
                    aria-label="Limpiar búsqueda"
                    @click="emit('update:search', '')"
                >
                    <i class="fal fa-times" aria-hidden="true" />
                </button>
            </div>

            <span class="noa-results">
                <i class="fas fa-filter" aria-hidden="true" />
                {{ events.length }} evento{{ events.length !== 1 ? 's' : '' }}
                <template v-if="search"> para "{{ search }}"</template>
            </span>
        </div>

        <!-- Cabecera de control del mes, leyenda y conmutador de vista -->
        <div class="noa-calendar-header">
            <!-- Navegador de mes -->
            <div class="d-flex align-items-center gap-2">
                <button
                    type="button"
                    class="btn btn-falcon-default btn-sm px-2.5"
                    title="Mes anterior"
                    aria-label="Mes anterior"
                    @click="emit('prevMonth')"
                >
                    <i class="fas fa-chevron-left" aria-hidden="true" />
                </button>

                <h2 class="noa-calendar-month-title mb-0 px-2">
                    {{ tituloMesAnio }}
                </h2>

                <button
                    type="button"
                    class="btn btn-falcon-default btn-sm px-2.5"
                    title="Mes siguiente"
                    aria-label="Mes siguiente"
                    @click="emit('nextMonth')"
                >
                    <i class="fas fa-chevron-right" aria-hidden="true" />
                </button>

                <button
                    type="button"
                    class="btn btn-outline-primary btn-sm px-3 fw-semibold ms-1"
                    title="Ir al día de hoy"
                    aria-label="Ir al día de hoy"
                    @click="emit('goToToday')"
                >
                    Hoy
                </button>
            </div>

            <!-- Leyenda visual de tipos de evento -->
            <div class="d-none d-lg-flex align-items-center gap-3 noa-calendar-legend" aria-label="Leyenda de estados del calendario">
                <div class="d-flex align-items-center gap-1.5">
                    <span class="noa-legend-dot noa-legend-dot--danger" aria-hidden="true" />
                    <span>Vencido / Hoy</span>
                </div>
                <div class="d-flex align-items-center gap-1.5">
                    <span class="noa-legend-dot noa-legend-dot--warning" aria-hidden="true" />
                    <span>Vence &le; 5 días</span>
                </div>
                <div class="d-flex align-items-center gap-1.5">
                    <span class="noa-legend-dot noa-legend-dot--primary" aria-hidden="true" />
                    <span>Convenio Colaboración</span>
                </div>
                <div class="d-flex align-items-center gap-1.5">
                    <span class="noa-legend-dot noa-legend-dot--success" aria-hidden="true" />
                    <span>Al día / Renovado</span>
                </div>
            </div>

            <!-- Conmutador de vista (Mes | Semana | Agenda) -->
            <div class="noa-view-switcher" role="group" aria-label="Modo de visualización del calendario">
                <button
                    type="button"
                    class="noa-view-btn"
                    :class="{ 'is-active': viewMode === 'month' }"
                    :aria-pressed="viewMode === 'month'"
                    @click="emit('update:viewMode', 'month')"
                >
                    Mes
                </button>
                <button
                    type="button"
                    class="noa-view-btn"
                    :class="{ 'is-active': viewMode === 'week' }"
                    :aria-pressed="viewMode === 'week'"
                    @click="emit('update:viewMode', 'week')"
                >
                    Semana
                </button>
                <button
                    type="button"
                    class="noa-view-btn"
                    :class="{ 'is-active': viewMode === 'agenda' }"
                    :aria-pressed="viewMode === 'agenda'"
                    @click="emit('update:viewMode', 'agenda')"
                >
                    Agenda
                </button>
            </div>
        </div>

        <!-- MODO MES / SEMANA (CUADRÍCULA DE 7 COLUMNAS) -->
        <template v-if="viewMode === 'month' || viewMode === 'week'">
            <div class="noa-calendar-scroll">
                <div class="noa-calendar-board">
                    <!-- Encabezados de días (LUN a DOM) -->
                    <div class="noa-calendar-weekdays" role="row">
                        <div
                            v-for="dia in DIAS_SEMANA_CORTOS"
                            :key="dia"
                            class="noa-calendar-weekday"
                            role="columnheader"
                        >
                            {{ dia }}
                        </div>
                    </div>

                    <!-- Cuadrícula de celdas -->
                    <div class="noa-calendar-cells" :class="{ 'is-loading': loading }">
                        <div
                            v-for="cell in celdasVisibles"
                            :key="cell.date"
                            class="noa-calendar-cell"
                            :class="{
                                'is-outside': !cell.isCurrentMonth && viewMode === 'month',
                                'is-today': cell.isToday,
                                'is-selected': cell.date === selectedDate,
                                'has-events': cell.totalCount > 0,
                            }"
                            role="button"
                            tabindex="0"
                            :aria-label="`${cell.dayLabel}, ${cell.totalCount} vencimientos`"
                            :aria-pressed="cell.date === selectedDate"
                            @click="onCellClick(cell)"
                            @keydown.enter.space.prevent="onCellClick(cell)"
                        >
                            <!-- Encabezado del día -->
                            <div class="d-flex align-items-center justify-content-between gap-1 mb-1">
                                <span class="noa-cell-day-label d-inline-flex align-items-center gap-1">
                                    <span>{{ cell.dayLabel }}</span>
                                    <span v-if="cell.isToday" class="noa-today-tag">
                                        Auditoría Hoy
                                    </span>
                                </span>

                                <span
                                    v-if="cell.totalCount > 0"
                                    class="noa-cell-count"
                                    :class="badgeCeldaClase(cell)"
                                    :title="`${cell.totalCount} registro${cell.totalCount === 1 ? '' : 's'} en esta fecha`"
                                >
                                    {{ cell.totalCount }}
                                </span>
                            </div>

                            <!-- Lista de eventos del día (máximo 3 visibles + indicador "+N más") -->
                            <div class="noa-cell-events">
                                <div
                                    v-for="ev in cell.events.slice(0, viewMode === 'week' ? 8 : 3)"
                                    :key="ev.id"
                                    class="noa-event-chip"
                                    :class="`noa-event-chip--${estiloEventoCalendario(ev).tone}`"
                                    :title="`${ev.vehicle_license_plate} · ${ev.category_label}: ${ev.subtitle} (${formatearFechaCorta(ev.date)})`"
                                    @click.stop="emit('openEvent', { date: cell.date, event: ev })"
                                >
                                    <i :class="estiloEventoCalendario(ev).icon" aria-hidden="true" />
                                    <span class="text-truncate">{{ estiloEventoCalendario(ev).chipText }}</span>
                                </div>

                                <div
                                    v-if="cell.events.length > (viewMode === 'week' ? 8 : 3)"
                                    class="noa-event-more"
                                >
                                    +{{ cell.events.length - (viewMode === 'week' ? 8 : 3) }} más en este día
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <!-- MODO AGENDA (LISTA CRONOLÓGICA DEL MES) -->
        <template v-else>
            <div class="p-3">
                <div v-if="gruposAgenda.length === 0" class="text-center py-5">
                    <i class="fad fa-calendar-check fs-1 text-muted opacity-50 mb-3 d-block" aria-hidden="true" />
                    <h6 class="text-muted mb-1 fw-semibold">No hay vencimientos programados en este periodo</h6>
                    <p class="text-muted small mb-0">
                        Prueba cambiando de mes o ajustando los filtros superiores de documento y modalidad.
                    </p>
                </div>

                <div v-else class="d-flex flex-column gap-3">
                    <div
                        v-for="grupo in gruposAgenda"
                        :key="grupo.date"
                        class="border rounded-3 overflow-hidden bg-white"
                    >
                        <div
                            class="px-3 py-2 border-bottom d-flex align-items-center justify-content-between"
                            :class="grupo.isToday ? 'bg-primary bg-opacity-10' : 'bg-light'"
                        >
                            <div class="d-flex align-items-center gap-2">
                                <i class="fad fa-calendar-day text-primary" aria-hidden="true" />
                                <span class="fw-bold text-dark small">{{ grupo.labelLarga }}</span>
                                <span v-if="grupo.isToday" class="badge bg-primary rounded-pill" style="font-size: 0.65rem;">
                                    Hoy
                                </span>
                            </div>
                            <button
                                type="button"
                                class="btn btn-link btn-sm p-0 text-decoration-none fw-semibold"
                                style="font-size: 0.75rem;"
                                @click="emit('selectDay', grupo.date)"
                            >
                                Ver resumen del día ({{ grupo.items.length }})
                            </button>
                        </div>

                        <div class="table-responsive">
                            <table class="table table-sm mb-0 align-middle">
                                <tbody>
                                    <tr
                                        v-for="ev in grupo.items"
                                        :key="ev.id"
                                        class="noa-agenda-row"
                                    >
                                        <td class="ps-3 py-2" style="width: 150px;">
                                            <span class="noa-plate-badge font-monospace">
                                                {{ ev.vehicle_license_plate }}
                                            </span>
                                            <small class="text-muted d-block" style="font-size: 0.7rem;">
                                                {{ ev.ownership_label }} · {{ ev.modality_label }}
                                            </small>
                                        </td>
                                        <td class="py-2">
                                            <span class="fw-semibold text-dark d-block" style="font-size: 0.82rem;">
                                                {{ ev.category_label }}
                                            </span>
                                            <small class="text-muted" style="font-size: 0.74rem;">
                                                {{ ev.subtitle }}
                                                <template v-if="ev.affiliate_name"> · {{ ev.affiliate_name }}</template>
                                            </small>
                                        </td>
                                        <td class="py-2" style="width: 190px;">
                                            <span
                                                class="noa-status"
                                                :class="`noa-status--${estiloEventoCalendario(ev).tone === 'primary' ? 'muted' : estiloEventoCalendario(ev).tone}`"
                                            >
                                                {{ estiloEventoCalendario(ev).statusText }}
                                            </span>
                                        </td>
                                        <td class="pe-3 py-2 text-end" style="width: 170px;">
                                            <router-link
                                                :to="{ name: 'vehicles.profile', params: { id: ev.vehicle_uuid } }"
                                                class="btn btn-outline-primary btn-sm py-1 px-2.5 d-inline-flex align-items-center gap-1"
                                                style="font-size: 0.75rem;"
                                            >
                                                <span>Ver perfil</span>
                                                <i class="fal fa-external-link-alt" aria-hidden="true" />
                                            </router-link>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<style scoped>
.noa-calendar-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    border-bottom: 1px solid var(--noa-list-border, #e5e9f0);
    background: #ffffff;
}

.noa-calendar-month-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.01em;
    min-width: 9.5rem;
    text-align: center;
}

.noa-calendar-legend {
    font-size: 0.74rem;
    color: #475569;
    font-weight: 500;
}

.noa-legend-dot {
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 50%;
    display: inline-block;
}

.noa-legend-dot--danger { background: #dc2626; }
.noa-legend-dot--warning { background: #b45309; }
.noa-legend-dot--primary { background: #2563eb; }
.noa-legend-dot--success { background: #059669; }

.noa-view-switcher {
    display: inline-flex;
    padding: 0.15rem;
    border-radius: 0.5rem;
    background: #eff4ff;
    border: 1px solid #cbd5e1;
}

.noa-view-btn {
    border: 0;
    background: transparent;
    color: #475569;
    font-size: 0.76rem;
    font-weight: 500;
    padding: 0.25rem 0.75rem;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease;
}

.noa-view-btn:hover:not(.is-active) {
    color: #0f172a;
}

.noa-view-btn.is-active {
    background: #ffffff;
    color: #1d4ed8;
    font-weight: 600;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
}

.noa-calendar-scroll {
    overflow-x: auto;
}

.noa-calendar-board {
    min-width: 760px;
}

.noa-calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    background: #f8fafc;
    border-bottom: 1px solid var(--noa-list-border, #e5e9f0);
}

.noa-calendar-weekday {
    padding: 0.55rem 0.5rem;
    text-align: center;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: #475569;
    text-transform: uppercase;
}

.noa-calendar-cells {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    background: #e2e8f0;
    gap: 1px;
    transition: opacity 0.15s ease;
}

.noa-calendar-cells.is-loading {
    opacity: 0.6;
}

.noa-calendar-cell {
    min-height: 112px;
    padding: 0.5rem;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    transition: background-color 0.12s ease, box-shadow 0.12s ease;
    position: relative;
}

.noa-calendar-cell:hover {
    background: #f8fafc;
}

.noa-calendar-cell:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: -2px;
    z-index: 2;
}

.noa-calendar-cell.is-outside {
    background: #f8fafc;
    color: #94a3b8;
}

.noa-calendar-cell.is-outside .noa-cell-day-label {
    color: #94a3b8;
}

.noa-calendar-cell.is-today {
    background: #f0f6ff;
    box-shadow: inset 0 0 0 2px #2563eb;
    z-index: 1;
}

.noa-calendar-cell.is-selected:not(.is-today) {
    background: #f8fafc;
    box-shadow: inset 0 0 0 2px #64748b;
}

.noa-cell-day-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #0f172a;
}

.noa-calendar-cell.is-today .noa-cell-day-label {
    color: #1d4ed8;
    font-weight: 700;
}

.noa-today-tag {
    font-size: 0.62rem;
    font-weight: 700;
    text-transform: uppercase;
    padding: 0.08rem 0.35rem;
    border-radius: 0.25rem;
    background: #1d4ed8;
    color: #ffffff;
}

.noa-cell-count {
    font-size: 0.65rem;
    font-weight: 700;
    padding: 0.05rem 0.38rem;
    border-radius: 0.25rem;
    line-height: 1.25;
}

.noa-cell-count--danger {
    background: #fee2e2;
    color: #b91c1c;
}

.noa-cell-count--warning {
    background: #fef3c7;
    color: #92400e;
}

.noa-cell-count--primary {
    background: #dbeafe;
    color: #1d4ed8;
}

.noa-cell-events {
    display: flex;
    flex-direction: column;
    gap: 0.28rem;
    margin-top: 0.15rem;
}

.noa-event-chip {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.24rem 0.42rem;
    border-radius: 0.3rem;
    border: 1px solid transparent;
    font-size: 0.71rem;
    font-weight: 600;
    line-height: 1.2;
    transition: filter 0.12s ease;
}

.noa-event-chip:hover {
    filter: brightness(0.96);
}

.noa-event-chip i {
    font-size: 0.72rem;
    flex-shrink: 0;
}

.noa-event-chip--danger {
    background: #fef2f2;
    border-color: #fecaca;
    color: #b91c1c;
}

.noa-event-chip--warning {
    background: #fffbeb;
    border-color: #fde68a;
    color: #92400e;
}

.noa-event-chip--primary {
    background: #eff6ff;
    border-color: #bfdbfe;
    color: #1d4ed8;
}

.noa-event-chip--success {
    background: #ecfdf5;
    border-color: #a7f3d0;
    color: #047857;
}

.noa-event-more {
    font-size: 0.68rem;
    font-weight: 600;
    color: #475569;
    padding-left: 0.25rem;
}

.noa-plate-badge {
    display: inline-block;
    padding: 0.12rem 0.45rem;
    border-radius: 0.3rem;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1d4ed8;
    font-weight: 700;
    font-size: 0.82rem;
}

.noa-agenda-row:hover {
    background: #f8fafc;
}

@media (prefers-reduced-motion: reduce) {
    .noa-calendar-cell,
    .noa-view-btn,
    .noa-event-chip {
        transition: none;
    }
}
</style>
