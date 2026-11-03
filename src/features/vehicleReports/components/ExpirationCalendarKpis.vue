<script setup>
defineProps({
    kpis: {
        type: Object,
        required: true,
    },
    activeCategory: {
        type: String,
        default: 'ALL',
    },
});

const emit = defineEmits(['selectCategory']);
</script>

<template>
    <div class="row g-2 mb-3 fade-in-up" style="animation-delay: 0.03s;" role="region" aria-label="Indicadores de auditoría de vencimientos">
        <!-- 1. SOAT por vencer -->
        <div class="col-12 col-sm-6 col-xl-3">
            <div
                class="noa-kpi-pill noa-kpi-pill--danger h-100"
                :class="{ 'is-active': activeCategory === 'SOAT' }"
                role="button"
                tabindex="0"
                :aria-pressed="activeCategory === 'SOAT'"
                aria-label="Filtrar por SOAT en alerta"
                @click="emit('selectCategory', activeCategory === 'SOAT' ? 'ALL' : 'SOAT')"
                @keydown.enter.space.prevent="emit('selectCategory', activeCategory === 'SOAT' ? 'ALL' : 'SOAT')"
            >
                <span class="noa-kpi-dot noa-kpi-dot--danger noa-kpi-dot--pulse" aria-hidden="true" />
                <div class="min-w-0">
                    <p class="noa-kpi-title text-danger mb-0 text-truncate">
                        {{ kpis.soat_alert || 0 }} SOAT por vencer
                    </p>
                    <p class="noa-kpi-sub mb-0 text-truncate">
                        &le; 15 días de vencimiento
                    </p>
                </div>
            </div>
        </div>

        <!-- 2. RTM en alerta -->
        <div class="col-12 col-sm-6 col-xl-3">
            <div
                class="noa-kpi-pill noa-kpi-pill--warning h-100"
                :class="{ 'is-active': activeCategory === 'RTM' }"
                role="button"
                tabindex="0"
                :aria-pressed="activeCategory === 'RTM'"
                aria-label="Filtrar por RTM en alerta"
                @click="emit('selectCategory', activeCategory === 'RTM' ? 'ALL' : 'RTM')"
                @keydown.enter.space.prevent="emit('selectCategory', activeCategory === 'RTM' ? 'ALL' : 'RTM')"
            >
                <span class="noa-kpi-dot noa-kpi-dot--warning" aria-hidden="true" />
                <div class="min-w-0">
                    <p class="noa-kpi-title noa-text-warning-strong mb-0 text-truncate">
                        {{ kpis.rtm_alert || 0 }} RTM en alerta
                    </p>
                    <p class="noa-kpi-sub mb-0 text-truncate">
                        Revisión Técnico Mecánica
                    </p>
                </div>
            </div>
        </div>

        <!-- 3. Convenios próximos -->
        <div class="col-12 col-sm-6 col-xl-3">
            <div
                class="noa-kpi-pill noa-kpi-pill--primary h-100"
                :class="{ 'is-active': activeCategory === 'AGREEMENT' }"
                role="button"
                tabindex="0"
                :aria-pressed="activeCategory === 'AGREEMENT'"
                aria-label="Filtrar por Convenios de Colaboración"
                @click="emit('selectCategory', activeCategory === 'AGREEMENT' ? 'ALL' : 'AGREEMENT')"
                @keydown.enter.space.prevent="emit('selectCategory', activeCategory === 'AGREEMENT' ? 'ALL' : 'AGREEMENT')"
            >
                <span class="noa-kpi-dot noa-kpi-dot--primary" aria-hidden="true" />
                <div class="min-w-0">
                    <p class="noa-kpi-title text-primary mb-0 text-truncate">
                        {{ kpis.agreement_upcoming || 0 }} Convenio{{ (kpis.agreement_upcoming || 0) === 1 ? '' : 's' }} próximo{{ (kpis.agreement_upcoming || 0) === 1 ? '' : 's' }}
                    </p>
                    <p class="noa-kpi-sub mb-0 text-truncate">
                        {{ kpis.agreement_nearest_name || 'Convenios de colaboración' }}
                    </p>
                </div>
            </div>
        </div>

        <!-- 4. Documentos al día -->
        <div class="col-12 col-sm-6 col-xl-3">
            <div
                class="noa-kpi-pill noa-kpi-pill--success h-100"
                role="status"
                aria-label="Documentos vigentes de la flota"
            >
                <span class="noa-kpi-dot noa-kpi-dot--success" aria-hidden="true" />
                <div class="min-w-0">
                    <p class="noa-kpi-title text-success mb-0 text-truncate">
                        {{ kpis.up_to_date_docs || 0 }} Documentos al día
                    </p>
                    <p class="noa-kpi-sub mb-0 text-truncate">
                        Flota legalmente habilitada
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.noa-kpi-pill {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 0.9rem;
    border-radius: 0.65rem;
    border: 1px solid transparent;
    background: #fff;
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.noa-kpi-pill[role='button'] {
    cursor: pointer;
}

.noa-kpi-pill[role='button']:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(15, 23, 42, 0.06);
}

.noa-kpi-pill[role='button']:focus-visible {
    outline: 2px solid #2c7be5;
    outline-offset: 2px;
}

.noa-kpi-pill.is-active {
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.25);
}

.noa-kpi-pill--danger {
    background: #fef2f2;
    border-color: #fecaca;
}

.noa-kpi-pill--warning {
    background: #fffbeb;
    border-color: #fde68a;
}

.noa-kpi-pill--primary {
    background: #eff6ff;
    border-color: #bfdbfe;
}

.noa-kpi-pill--success {
    background: #ecfdf5;
    border-color: #a7f3d0;
}

.noa-kpi-dot {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 50%;
    flex-shrink: 0;
}

.noa-kpi-dot--danger {
    background: #dc2626;
}

.noa-kpi-dot--warning {
    background: #b45309;
}

.noa-kpi-dot--primary {
    background: #2563eb;
}

.noa-kpi-dot--success {
    background: #059669;
}

.noa-kpi-dot--pulse {
    animation: kpiPulse 2s infinite;
}

@keyframes kpiPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.45; }
}

.noa-kpi-title {
    font-size: 0.84rem;
    font-weight: 600;
    line-height: 1.2;
}

.noa-text-warning-strong {
    color: #92400e;
}

.noa-kpi-sub {
    font-size: 0.72rem;
    color: #64748b;
    margin-top: 0.15rem;
    line-height: 1.2;
}

@media (prefers-reduced-motion: reduce) {
    .noa-kpi-pill,
    .noa-kpi-dot--pulse {
        transition: none;
        animation: none;
    }
}
</style>
