<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePermissionsStore } from '@store';
import BasePageHeader from '@/components/BasePageHeader.vue';
import ExpirationCalendarToolbar from '../components/ExpirationCalendarToolbar.vue';
import ExpirationCalendarGrid from '../components/ExpirationCalendarGrid.vue';
import ExpirationCalendarDayModal from '../components/ExpirationCalendarDayModal.vue';
import { useExpirationCalendarStore } from '../store/expirationCalendar.store.js';

const route = useRoute();
const router = useRouter();
const store = useExpirationCalendarStore();
const permissionsStore = usePermissionsStore();
const can = (action) => permissionsStore.can(action);

const isViewLoading = ref(true);
const isDayModalOpen = ref(false);
let searchTimer = null;

const selectedDayEvents = computed(() => {
    if (!store.selectedDate) return [];
    return store.eventsByDate[store.selectedDate] || [];
});

const syncQuery = () => {
    router.replace({
        query: {
            ...route.query,
            month: store.month || undefined,
            year: store.year || undefined,
            category: store.category !== 'ALL' ? store.category : undefined,
            entity: store.entityFilter || undefined,
            service_type: store.serviceType || undefined,
            branch_uuid: store.branchUuid || undefined,
            view: store.viewMode !== 'month' ? store.viewMode : undefined,
            search: store.search || undefined,
        },
    });
};

/** Desplaza la vista semanal ±7 días y recarga el mes si la semana cruza de mes. */
const desplazarSemana = async (dias) => {
    const base = store.selectedDate
        ? new Date(`${store.selectedDate}T00:00:00`)
        : new Date(store.year, store.month - 1, 1);
    base.setDate(base.getDate() + dias);
    const targetYear = base.getFullYear();
    const targetMonth = base.getMonth() + 1;
    store.selectedDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`;
    if (targetYear !== store.year || targetMonth !== store.month) {
        await store.setMonthYear(targetMonth, targetYear);
    }
    syncQuery();
};

const onPrevMonth = async () => {
    if (store.viewMode === 'week') return desplazarSemana(-7);
    await store.prevMonth();
    syncQuery();
};

const onNextMonth = async () => {
    if (store.viewMode === 'week') return desplazarSemana(7);
    await store.nextMonth();
    syncQuery();
};

const onGoToToday = async () => {
    await store.goToToday();
    syncQuery();
};

const onCategorySelect = async (cat) => {
    store.category = cat;
    await store.fetchCalendar();
    syncQuery();
};

const onEntityFilterChange = async (val) => {
    store.entityFilter = val || '';
    await store.fetchCalendar();
    syncQuery();
};

const onServiceTypeChange = async (val) => {
    store.serviceType = val || '';
    await store.fetchCalendar();
    syncQuery();
};

const onBranchChange = async (val) => {
    store.branchUuid = val || '';
    await store.fetchCalendar();
    syncQuery();
};

const onViewModeChange = (mode) => {
    if (mode === 'week') {
        // La semana debe pertenecer al mes mostrado: si la fecha elegida quedó en otro mes, se reubica.
        const prefijo = `${store.year}-${String(store.month).padStart(2, '0')}`;
        if (!store.selectedDate || !store.selectedDate.startsWith(prefijo)) {
            store.selectedDate = store.today && store.today.startsWith(prefijo) ? store.today : `${prefijo}-01`;
        }
    }
    store.viewMode = mode;
    syncQuery();
};

const onSearchChange = (val) => {
    store.search = val;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
        await store.fetchCalendar();
        syncQuery();
    }, 350);
};

const onResetFilters = async () => {
    await store.resetFilters();
    syncQuery();
};

const onSelectDay = (dateIso) => {
    store.selectedDate = dateIso;
    isDayModalOpen.value = true;
};

const onOpenEvent = ({ date }) => {
    if (date) {
        store.selectedDate = date;
        isDayModalOpen.value = true;
    }
};

const refreshCalendar = async () => {
    await store.fetchCalendar();
};

const onTriggerMassNotification = async () => {
    await store.triggerMassNotification();
    await store.fetchCalendar();
};

onMounted(async () => {
    try {
        const q = route.query;
        if (q.month) {
            const m = Number(q.month);
            if (m >= 1 && m <= 12) store.month = m;
        }
        if (q.year) {
            const y = Number(q.year);
            if (y >= 2020 && y <= 2100) store.year = y;
        }
        if (q.category) store.category = String(q.category);
        if (q.entity) store.entityFilter = String(q.entity);
        if (q.service_type) store.serviceType = String(q.service_type);
        if (q.branch_uuid) store.branchUuid = String(q.branch_uuid);
        if (q.view && ['month', 'week', 'agenda'].includes(String(q.view))) {
            store.viewMode = String(q.view);
        }
        if (q.search) store.search = String(q.search);

        await Promise.all([
            store.loadCatalogs(),
            store.fetchCalendar(),
        ]);
    } finally {
        isViewLoading.value = false;
    }
});
</script>

<template>
    <div>
        <BasePageHeader
            title="Calendario de Vencimientos y Convenios"
            description="Auditoría cronológica preventiva de documentos legales (SOAT, RTM, RCC/RCE, Tarjeta de Operación) y Convenios de Colaboración Empresarial."
            icon="fad fa-calendar-alt text-primary"
            :show-bg="true"
            :loading="isViewLoading"
            :compact="true"
            :breadcrumbs="[{ label: 'Reportes', to: '/reportes/vehiculos' }, { label: 'Calendario de Vencimientos' }]"
        >
            <template #title-after>
                <span class="badge badge-subtle-primary rounded-pill fs-11">
                    Auditoría Legal Activa
                </span>
            </template>

            <template #actions>
                <button
                    class="btn btn-falcon-default btn-sm px-2 px-sm-3"
                    type="button"
                    title="Actualizar calendario"
                    aria-label="Actualizar calendario"
                    :disabled="store.loading"
                    @click="refreshCalendar"
                >
                    <i class="fad fa-sync" :class="{ 'fa-spin': store.loading }" aria-hidden="true"></i>
                    <span class="d-none d-sm-inline ms-1">Actualizar</span>
                </button>

                <div class="btn-group btn-group-sm" role="group" aria-label="Exportar calendario de vencimientos">
                    <button
                        v-if="can('reports.vehicles.export-excel')"
                        class="btn btn-falcon-default btn-sm text-success px-2 px-sm-3"
                        type="button"
                        title="Exportar Calendario a Excel"
                        aria-label="Exportar Calendario a Excel"
                        :disabled="store.exporting || store.events.length === 0"
                        @click="store.exportCalendar('excel')"
                    >
                        <i class="fad fa-file-excel me-1" aria-hidden="true"></i>
                        <span class="d-none d-md-inline">Exportar Calendario</span>
                    </button>

                    <button
                        v-if="can('reports.vehicles.export-pdf')"
                        class="btn btn-falcon-default btn-sm text-danger px-2 px-sm-3"
                        type="button"
                        title="Generar Reporte PDF"
                        aria-label="Generar Reporte PDF"
                        :disabled="store.exporting || store.events.length === 0"
                        @click="store.exportCalendar('pdf')"
                    >
                        <i class="fad fa-file-pdf me-1" aria-hidden="true"></i>
                        <span class="d-none d-md-inline">Generar Reporte PDF</span>
                    </button>
                </div>

                <button
                    class="btn btn-primary btn-sm px-2 px-sm-3"
                    type="button"
                    title="Sincronizar alertas preventivas de vencimiento"
                    aria-label="Sincronizar alertas preventivas de vencimiento"
                    :disabled="store.notifying"
                    @click="onTriggerMassNotification"
                >
                    <i
                        class="fad fa-bell-on"
                        :class="{ 'fa-spin': store.notifying }"
                        aria-hidden="true"
                    ></i>
                    <span class="d-none d-sm-inline ms-1">Notificación Masiva</span>
                </button>
            </template>
        </BasePageHeader>

        <!-- Barra de herramientas y filtros del calendario -->
        <ExpirationCalendarToolbar
            :category="store.category"
            :category-counts="store.categoryCounts"
            :entity-filter="store.entityFilter"
            :service-type="store.serviceType"
            :branch-uuid="store.branchUuid"
            :affiliates="store.catalogs.affiliates"
            :branches="store.catalogs.branches"
            :has-active-filter="store.hasActiveFilter"
            @update:category="onCategorySelect"
            @update:entity-filter="onEntityFilterChange"
            @update:service-type="onServiceTypeChange"
            @update:branch-uuid="onBranchChange"
            @reset="onResetFilters"
        />

        <!-- Cuadrícula mensual, semanal o agenda cronológica -->
        <div v-if="!isViewLoading">
            <ExpirationCalendarGrid
                :month="store.month"
                :year="store.year"
                :today="store.today"
                :selected-date="store.selectedDate"
                :view-mode="store.viewMode"
                :events="store.events"
                :events-by-date="store.eventsByDate"
                :loading="store.loading"
                :search="store.search"
                @prev-month="onPrevMonth"
                @next-month="onNextMonth"
                @go-to-today="onGoToToday"
                @update:view-mode="onViewModeChange"
                @update:search="onSearchChange"
                @select-day="onSelectDay"
                @open-event="onOpenEvent"
            />
        </div>

        <!-- Modal emergente de vencimientos por día -->
        <ExpirationCalendarDayModal
            v-model:visible="isDayModalOpen"
            :date="store.selectedDate"
            :events="selectedDayEvents"
            :can="can"
        />
    </div>
</template>

<style scoped>
/* Estilos específicos de la vista principal */
</style>
