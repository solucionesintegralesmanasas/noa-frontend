<template>
    <div class="project-switcher-section mb-3">
        <!-- Cabecera de control del switcher -->
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2 px-1">
            <div class="d-flex align-items-center gap-2">
                <span class="fw-bold text-dark text-uppercase fs-11 tracking-wider">Proyectos Activos de la Flota</span>
                <span class="text-muted fs-11">
                    • {{ projects.length }} proyecto{{ projects.length !== 1 ? 's' : '' }} ({{ totalVehiculos }} vehículo{{ totalVehiculos !== 1 ? 's' : '' }} en total)
                </span>
            </div>

            <div class="d-flex align-items-center gap-2">
                <!-- Filtros rápidos de tarjetas -->
                <div class="btn-group btn-group-sm" role="group" aria-label="Filtrar tarjetas de proyecto">
                    <button
                        type="button"
                        class="btn btn-xs"
                        :class="filtroTarjetas === 'todos' ? 'btn-primary' : 'btn-outline-secondary'"
                        @click="filtroTarjetas = 'todos'"
                    >
                        Todos ({{ projects.length }})
                    </button>
                    <button
                        type="button"
                        class="btn btn-xs"
                        :class="filtroTarjetas === 'pendientes' ? 'btn-warning text-dark' : 'btn-outline-secondary'"
                        @click="filtroTarjetas = 'pendientes'"
                    >
                        Con Pendientes ({{ conteoConPendientes }})
                    </button>
                    <button
                        type="button"
                        class="btn btn-xs"
                        :class="filtroTarjetas === 'al_dia' ? 'btn-success' : 'btn-outline-secondary'"
                        @click="filtroTarjetas = 'al_dia'"
                    >
                        Al Día ({{ conteoAlDia }})
                    </button>
                </div>

                <!-- Paginación de tarjetas si hay más de 4 -->
                <div v-if="totalPaginasTarjetas > 1" class="btn-group btn-group-sm" role="group" aria-label="Navegar proyectos">
                    <button
                        type="button"
                        class="btn btn-falcon-default btn-xs px-2"
                        :disabled="paginaActual <= 1"
                        aria-label="Proyectos anteriores"
                        @click="paginaActual--"
                    >
                        <i class="fas fa-chevron-left fs-10" aria-hidden="true"></i>
                    </button>
                    <span class="btn btn-falcon-default btn-xs px-2 disabled text-muted fw-normal fs-10">
                        {{ paginaActual }} / {{ totalPaginasTarjetas }}
                    </span>
                    <button
                        type="button"
                        class="btn btn-falcon-default btn-xs px-2"
                        :disabled="paginaActual >= totalPaginasTarjetas"
                        aria-label="Proyectos siguientes"
                        @click="paginaActual++"
                    >
                        <i class="fas fa-chevron-right fs-10" aria-hidden="true"></i>
                    </button>
                </div>

                <!-- Botón Agregar Proyecto (Activo Verde con Hover) -->
                <button
                    v-if="canCreateProject"
                    type="button"
                    class="btn btn-success btn-xs px-2.5 py-1 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-xs btn-add-project"
                    title="Crear un nuevo proyecto"
                    @click="$emit('create-project')"
                >
                    <i class="fas fa-plus fs-10" aria-hidden="true"></i>
                    <span>Agregar Proyecto</span>
                </button>
            </div>
        </div>

        <!-- Grid de tarjetas de proyecto -->
        <div v-if="proyectosPaginados.length > 0" class="row g-2">
            <div
                v-for="proj in proyectosPaginados"
                :key="proj.uuid"
                class="col-12 col-sm-6 col-lg-3"
            >
                <div
                    class="project-card h-100 p-3 rounded-3 transition-all position-relative"
                    :class="[
                        selectedProjectUuid === proj.uuid ? 'selected border-primary shadow-sm' : 'border-200 hover-shadow bg-white',
                        'border'
                    ]"
                    tabindex="0"
                    role="button"
                    :aria-label="`Seleccionar proyecto ${proj.project_name}`"
                    :aria-pressed="selectedProjectUuid === proj.uuid"
                    @click="$emit('select', proj.uuid)"
                    @keydown.enter.space.prevent="$emit('select', proj.uuid)"
                >
                    <div class="d-flex align-items-start justify-content-between gap-1 mb-1">
                        <div class="pe-3 text-truncate">
                            <h6 class="mb-0 fw-bold fs-12 text-dark text-truncate d-flex align-items-center gap-1" :title="proj.project_name">
                                <span
                                    class="project-status-dot rounded-circle flex-shrink-0"
                                    :class="selectedProjectUuid === proj.uuid ? 'bg-primary' : 'bg-secondary'"
                                ></span>
                                <span class="text-truncate">{{ proj.project_name }}</span>
                            </h6>
                            <span class="text-muted fs-10 d-block text-truncate">
                                {{ formatVigencia(proj) }}
                            </span>
                        </div>
                        <span class="badge badge-subtle-primary rounded-pill fs-11 flex-shrink-0">
                            {{ proj.assignments_count || 0 }} veh.
                        </span>
                    </div>

                    <!-- Métricas -->
                    <div class="d-flex align-items-center justify-content-between text-muted fs-11 mt-2 mb-1">
                        <span>{{ proj.summary?.total_planillas || 0 }} planilla{{ (proj.summary?.total_planillas || 0) !== 1 ? 's' : '' }}</span>
                        <span class="fw-bold" :class="porcentajeColor(proj.summary?.porcentaje_al_dia)">
                            {{ proj.summary?.porcentaje_al_dia ?? 100 }}% al día
                        </span>
                    </div>

                    <!-- Minibarra de progreso -->
                    <div
                        class="progress my-2"
                        style="height: 6px;"
                        role="progressbar"
                        :aria-valuenow="proj.summary?.porcentaje_al_dia ?? 100"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        :aria-label="`Progreso de cumplimiento del proyecto: ${proj.summary?.porcentaje_al_dia ?? 100}%`"
                    >
                        <div
                            class="progress-bar bg-success"
                            :style="{ width: `${porcentajeCertificados(proj)}%` }"
                            :title="`${proj.summary?.certificados || 0} certificados`"
                        ></div>
                        <div
                            class="progress-bar bg-info"
                            :style="{ width: `${porcentajeEnCurso(proj)}%` }"
                            :title="`${proj.summary?.en_curso || 0} en curso`"
                        ></div>
                        <div
                            class="progress-bar bg-warning"
                            :style="{ width: `${porcentajeIncompletos(proj)}%` }"
                            :title="`${proj.summary?.evidencia_incompleta || 0} incompletos`"
                        ></div>
                        <div
                            class="progress-bar bg-danger"
                            :style="{ width: `${porcentajeExcepciones(proj)}%` }"
                            :title="`${proj.summary?.excepciones || 0} excepciones`"
                        ></div>
                    </div>

                    <!-- Desglose textual -->
                    <div class="d-flex align-items-center gap-2 fs-10 text-muted mt-2 pt-1 border-top flex-wrap">
                        <span class="text-success fw-semibold d-inline-flex align-items-center gap-1">
                            <span class="dot-xs bg-success rounded-circle"></span>
                            {{ proj.summary?.certificados || 0 }} OK
                        </span>
                        <span>·</span>
                        <span class="text-info d-inline-flex align-items-center gap-1">
                            <span class="dot-xs bg-info rounded-circle"></span>
                            {{ proj.summary?.en_curso || 0 }} En ruta
                        </span>
                        <span>·</span>
                        <span class="text-warning d-inline-flex align-items-center gap-1">
                            <span class="dot-xs bg-warning rounded-circle"></span>
                            {{ proj.summary?.evidencia_incompleta || 0 }} Incompletos
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Estado vacío de proyectos -->
        <div v-else class="text-center py-4 bg-white rounded-3 border border-dashed border-200">
            <i class="fad fa-folder-open text-muted fs-3 mb-2" aria-hidden="true"></i>
            <p class="text-muted fs-12 mb-0">No hay proyectos activos que coincidan con el filtro.</p>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
    projects: {
        type: Array,
        default: () => []
    },
    selectedProjectUuid: {
        type: String,
        default: ''
    },
    loading: {
        type: Boolean,
        default: false
    },
    canCreateProject: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['select', 'create-project']);

const filtroTarjetas = ref('todos'); // 'todos' | 'pendientes' | 'al_dia'
const paginaActual = ref(1);
const tarjetasPorPagina = 4;

const esProyectoConPendientes = (p) =>
    (p.summary?.evidencia_incompleta || 0) > 0 || (p.summary?.porcentaje_al_dia ?? 100) < 100;

const totalVehiculos = computed(() => {
    return props.projects.reduce((acc, p) => acc + (Number(p.assignments_count) || 0), 0);
});

const conteoConPendientes = computed(() => {
    return props.projects.filter(esProyectoConPendientes).length;
});

const conteoAlDia = computed(() => {
    return props.projects.filter(p => !esProyectoConPendientes(p)).length;
});

const proyectosFiltrados = computed(() => {
    if (filtroTarjetas.value === 'pendientes') {
        return props.projects.filter(esProyectoConPendientes);
    }
    if (filtroTarjetas.value === 'al_dia') {
        return props.projects.filter(p => !esProyectoConPendientes(p));
    }
    return props.projects;
});

const totalPaginasTarjetas = computed(() => {
    return Math.max(1, Math.ceil(proyectosFiltrados.value.length / tarjetasPorPagina));
});

const proyectosPaginados = computed(() => {
    const inicio = (paginaActual.value - 1) * tarjetasPorPagina;
    return proyectosFiltrados.value.slice(inicio, inicio + tarjetasPorPagina);
});

watch(filtroTarjetas, () => {
    paginaActual.value = 1;
    if (
        proyectosFiltrados.value.length > 0 &&
        !proyectosFiltrados.value.some(p => p.uuid === props.selectedProjectUuid)
    ) {
        emit('select', proyectosFiltrados.value[0].uuid);
    }
});

const formatVigencia = (proj) => {
    if (!proj.start_date && !proj.completion_date) return 'Vigencia activa';
    const f1 = proj.start_date ? proj.start_date.split('-').reverse().slice(0, 2).join('/') : '';
    const f2 = proj.completion_date ? proj.completion_date.split('-').reverse().slice(0, 2).join('/') : '';
    return f1 && f2 ? `${f1} — ${f2}` : 'Vigencia activa';
};

const porcentajeColor = (val) => {
    const num = Number(val);
    const n = Number.isFinite(num) ? num : 100;
    if (n >= 90) return 'text-success';
    if (n >= 70) return 'text-info';
    if (n >= 50) return 'text-warning';
    return 'text-danger';
};

const porcentajeCertificados = (proj) => {
    const total = proj.summary?.total_dias || 0;
    if (!total) return 0;
    return Math.round(((proj.summary?.certificados || 0) / total) * 100);
};

const porcentajeEnCurso = (proj) => {
    const total = proj.summary?.total_dias || 0;
    if (!total) return 0;
    return Math.round(((proj.summary?.en_curso || 0) / total) * 100);
};

const porcentajeIncompletos = (proj) => {
    const total = proj.summary?.total_dias || 0;
    if (!total) return 0;
    const incompletosCerrados = Math.max(0, (proj.summary?.evidencia_incompleta || 0) - (proj.summary?.en_curso || 0));
    return Math.round((incompletosCerrados / total) * 100);
};

const porcentajeExcepciones = (proj) => {
    const total = proj.summary?.total_dias || 0;
    if (!total) return 0;
    return Math.round(((proj.summary?.excepciones || 0) / total) * 100);
};
</script>

<style scoped>
.fs-10 {
    font-size: 0.65rem !important;
}

.fs-11 {
    font-size: 0.72rem !important;
}

.fs-12 {
    font-size: 0.8rem !important;
}

.btn-xs {
    padding: 0.2rem 0.5rem;
    font-size: 0.68rem;
    border-radius: 0.35rem;
}

.project-card {
    background-color: #ffffff;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
}

.project-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.project-card.selected {
    background-color: rgba(13, 110, 253, 0.03);
    border-color: #2c7be5 !important;
    border-width: 2px !important;
}

.project-status-dot {
    width: 8px;
    height: 8px;
    display: inline-block;
}

.dot-xs {
    width: 6px;
    height: 6px;
    display: inline-block;
}

.shadow-xs {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-add-project {
    background-color: #00d27a !important;
    border-color: #00d27a !important;
    color: #ffffff !important;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
}

.btn-add-project:hover {
    background-color: #00b86b !important;
    border-color: #00b86b !important;
    color: #ffffff !important;
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0, 210, 122, 0.35) !important;
}

.btn-add-project:active {
    transform: translateY(0);
}
</style>
