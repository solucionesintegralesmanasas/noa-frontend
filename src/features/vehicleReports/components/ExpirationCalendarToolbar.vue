<script setup>
import { computed } from 'vue';
import PrimeSelect from '@/components/form/PrimeSelect.vue';
import '@/assets/styles/components/_data-list.css';

const props = defineProps({
    category: {
        type: String,
        default: 'ALL',
    },
    categoryCounts: {
        type: Object,
        default: () => ({}),
    },
    entityFilter: {
        type: String,
        default: '',
    },
    serviceType: {
        type: String,
        default: '',
    },
    branchUuid: {
        type: String,
        default: '',
    },
    affiliates: {
        type: Array,
        default: () => [],
    },
    branches: {
        type: Array,
        default: () => [],
    },
    hasActiveFilter: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits([
    'update:category',
    'update:entityFilter',
    'update:serviceType',
    'update:branchUuid',
    'reset',
]);

const categoryTabs = computed(() => [
    {
        code: 'ALL',
        label: 'Todos los Documentos',
        shortLabel: 'Todos',
        icon: 'fal fa-layer-group',
        count: Number(props.categoryCounts?.ALL || 0),
        badgeClass: 'bg-secondary text-white',
    },
    {
        code: 'SOAT',
        label: 'SOAT',
        shortLabel: 'SOAT',
        icon: 'fal fa-file-medical',
        count: Number(props.categoryCounts?.SOAT || 0),
        badgeClass: 'bg-danger text-white',
    },
    {
        code: 'RTM',
        label: 'RTM',
        shortLabel: 'RTM',
        icon: 'fal fa-tools',
        count: Number(props.categoryCounts?.RTM || 0),
        badgeClass: 'noa-badge-amber',
    },
    {
        code: 'OPERATION_CARD',
        label: 'Tarjeta de Operación',
        shortLabel: 'Tarj. Operación',
        icon: 'fal fa-id-card',
        count: Number(props.categoryCounts?.OPERATION_CARD || 0),
        badgeClass: 'noa-badge-amber',
    },
    {
        code: 'POLIZAS',
        label: 'Pólizas RCC / RCE',
        shortLabel: 'Pólizas',
        icon: 'fal fa-shield-check',
        count: Number(props.categoryCounts?.POLIZAS || 0),
        badgeClass: 'bg-danger text-white',
    },
    {
        code: 'AGREEMENT',
        label: 'Convenios de Colaboración',
        shortLabel: 'Convenios',
        icon: 'fal fa-handshake',
        count: Number(props.categoryCounts?.AGREEMENT || 0),
        badgeClass: 'bg-primary text-white',
    },
]);

const entityOptions = computed(() => {
    const base = [
        { label: 'Todas las Empresas y Terceros Aliados', value: '' },
        { label: 'Flota Propia (Empresa)', value: 'propios' },
        { label: 'Todos los Terceros / Afiliados', value: 'terceros' },
    ];
    for (const aff of props.affiliates) {
        if (!aff?.uuid) continue;
        base.push({
            label: `${aff.company_name || 'Afiliado'} (Tercero)`,
            value: `aff:${aff.uuid}`,
        });
    }
    return base;
});

const serviceOptions = [
    { label: 'Modalidad: Público y Particular', value: '' },
    { label: 'Modalidad: Público / Especial', value: 'PUBLICO' },
    { label: 'Modalidad: Particular (Exento TO/Pólizas)', value: 'PARTICULAR' },
];

const branchOptions = computed(() => [
    { label: 'Todas las Sedes Operativas', value: '' },
    ...(Array.isArray(props.branches) ? props.branches : []),
]);

const selectCategory = (code) => {
    emit('update:category', code);
};
</script>

<template>
    <div class="card border-0 shadow-sm mb-3 fade-in-up" style="animation-delay: 0.05s;">
        <div class="card-body p-3">
            <!-- Encabezado y Cuadrícula Horizontal de Botones de Filtro por Categoría -->
            <div class="d-flex align-items-center justify-content-between mb-2">
                <div class="d-flex align-items-center gap-1.5 text-muted small">
                    <i class="fad fa-filter text-primary" aria-hidden="true" />
                    <span class="fw-bold text-uppercase text-800" style="font-size: 0.72rem; letter-spacing: 0.05em;">
                        Filtrar por Documento o Convenio
                    </span>
                </div>
                <span class="fs-11 text-500 d-none d-sm-inline">
                    Haz clic en una categoría para auditar sus vencimientos
                </span>
            </div>

            <!-- Fila 1: Botones aprovechando el 100% del ancho horizontal (Grid de 6 columnas) -->
            <div class="noa-category-grid mb-3" role="group" aria-label="Filtrar por tipo de documento o convenio">
                <button
                    v-for="tab in categoryTabs"
                    :key="tab.code"
                    type="button"
                    class="noa-cat-btn"
                    :class="{ 'is-active': category === tab.code }"
                    :aria-pressed="category === tab.code"
                    :aria-label="`Filtrar por ${tab.label}${tab.count > 0 ? ` (${tab.count} en seguimiento)` : ''}`"
                    @click="selectCategory(tab.code)"
                >
                    <div class="noa-cat-btn__content">
                        <i :class="tab.icon" class="noa-cat-btn__icon" aria-hidden="true" />
                        <span class="noa-cat-btn__label text-truncate" :title="tab.label">
                            <span class="d-none d-xl-inline">{{ tab.label }}</span>
                            <span class="d-inline d-xl-none">{{ tab.shortLabel }}</span>
                        </span>
                        <span
                            v-if="tab.count > 0"
                            class="noa-cat-btn__badge rounded-pill"
                            :class="tab.badgeClass"
                            :title="`${tab.count} vencimientos en seguimiento`"
                        >
                            {{ tab.count }}
                        </span>
                    </div>
                </button>
            </div>

            <!-- Fila 2: Selectores secundarios complementarios aprovechando todo el ancho -->
            <div class="d-flex flex-wrap align-items-center gap-2 pt-2 border-top">
                <div class="flex-grow-1" style="min-width: 240px;">
                    <label class="visually-hidden" for="f-calendar-entity">Empresa o tercero aliado</label>
                    <PrimeSelect
                        input-id="f-calendar-entity"
                        :model-value="entityFilter"
                        :options="entityOptions"
                        option-label="label"
                        option-value="value"
                        filter
                        size="small"
                        class="w-100"
                        @update:model-value="emit('update:entityFilter', $event)"
                    />
                </div>

                <div class="flex-grow-1" style="min-width: 210px;">
                    <label class="visually-hidden" for="f-calendar-service">Modalidad de servicio</label>
                    <PrimeSelect
                        input-id="f-calendar-service"
                        :model-value="serviceType"
                        :options="serviceOptions"
                        option-label="label"
                        option-value="value"
                        size="small"
                        class="w-100"
                        @update:model-value="emit('update:serviceType', $event)"
                    />
                </div>

                <div v-if="branches.length > 0" class="flex-grow-1" style="min-width: 200px;">
                    <label class="visually-hidden" for="f-calendar-branch">Sede operativa</label>
                    <PrimeSelect
                        input-id="f-calendar-branch"
                        :model-value="branchUuid"
                        :options="branchOptions"
                        option-label="label"
                        option-value="value"
                        size="small"
                        class="w-100"
                        @update:model-value="emit('update:branchUuid', $event)"
                    />
                </div>

                <button
                    v-if="hasActiveFilter"
                    type="button"
                    class="btn btn-outline-secondary btn-sm ms-sm-auto d-inline-flex align-items-center gap-1"
                    title="Restablecer todos los filtros"
                    aria-label="Restablecer filtros"
                    @click="emit('reset')"
                >
                    <i class="fad fa-eraser" aria-hidden="true" />
                    <span>Restablecer</span>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.noa-category-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
    width: 100%;
}

@media (min-width: 768px) {
    .noa-category-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (min-width: 1200px) {
    .noa-category-grid {
        grid-template-columns: repeat(6, minmax(0, 1fr));
    }
}

.noa-cat-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 2.65rem;
    padding: 0.45rem 0.65rem;
    border-radius: 0.5rem;
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #334155;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
}

.noa-cat-btn:hover:not(.is-active) {
    background: #f1f5f9;
    border-color: #94a3b8;
    color: #0f172a;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(15, 23, 42, 0.05);
}

.noa-cat-btn:focus-visible {
    outline: 2px solid #2c7be5;
    outline-offset: 1px;
}

.noa-cat-btn.is-active {
    background: #0f172a;
    border-color: #0f172a;
    color: #ffffff;
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.18);
}

.noa-cat-btn__content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    width: 100%;
    min-width: 0;
}

.noa-cat-btn__icon {
    font-size: 0.95rem;
    flex-shrink: 0;
    opacity: 0.85;
}

.noa-cat-btn.is-active .noa-cat-btn__icon {
    color: #60a5fa;
    opacity: 1;
}

.noa-cat-btn__label {
    font-size: 0.8125rem;
    font-weight: 600;
    line-height: 1.2;
}

.noa-cat-btn__badge {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.1rem 0.45rem;
    line-height: 1.2;
    flex-shrink: 0;
}

.noa-badge-amber {
    background: #b45309;
    color: #ffffff;
}
</style>
