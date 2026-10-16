<template>
    <BasePageHeader title="Radicación de tarjeta de operación"
        description="Gestione y consulte los trámites de vinculación vehicular con su línea de tiempo"
        icon="fad fa-id-card text-primary" :show-refresh="true" :show-create="puedeCrear" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true"
        :breadcrumbs="[{ label: 'Radicación de tarjeta de operación' }, { label: 'Listado' }]"
        @refresh="store.fetchItems()" @create="irANuevo" />

    <!-- BARRA DE BÚSQUEDA -->
    <div class="card border-0 shadow-sm mb-3 fade-in-up" style="animation-delay: 0.1s;">
        <div class="bg-holder d-none d-lg-block bg-card"
            style="background-image:url(/assets/img/icons/spot-illustrations/corner-4.png);" />
        <div class="card-body position-relative py-2">
            <div class="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3 g-2 g-md-3">
                <div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2 flex-grow-1 g-2 g-md-3">
                    <h6 class="mb-0 fw-medium text-nowrap">Búsqueda</h6>
                    <div class="input-group input-group-sm w-100" style="max-width: 420px;">
                        <span class="input-group-text bg-light border-end-0">
                            <i class="fad fa-search text-muted" />
                        </span>
                        <input v-model="busqueda" class="form-control form-control-sm border-start-0 shadow-none"
                            type="search" placeholder="Buscar por código o asunto..." aria-label="Buscar expediente de radicación"
                            @input="debouncedSearch" />
                        <button v-if="busqueda" class="btn btn-outline-secondary border-start-0" type="button"
                            title="Limpiar búsqueda" aria-label="Limpiar búsqueda" @click="limpiarBusqueda">
                            <i class="fad fa-times" />
                        </button>
                    </div>
                </div>

                <div v-if="!isViewLoading && !store.loading" class="text-muted text-lg-end text-nowrap">
                    <small>
                        <i class="fad fa-filter me-1" />
                        {{ store.pagination.totalItems }} resultado{{ store.pagination.totalItems !== 1 ? 's' : '' }}
                        <span v-if="store.search"> para "{{ store.search }}"</span>
                    </small>
                </div>
            </div>
        </div>
    </div>

    <!-- TABLA -->
    <div class="row gx-3 fade-in-up" style="animation-delay: 0.2s;">
        <div class="col-12 col-xxl-12">
            <div class="card border-0 shadow-sm">
                <div class="bg-holder d-none d-lg-block bg-card"
                    style="background-image:url(/assets/img/icons/spot-illustrations/corner-4.png);" />
                <div class="card-body p-0">
                    <div class="table-responsive scrollbar">
                        <DataTable :value="store.items" lazy :paginator="true" :rows="store.pagination.itemsPerPage"
                            :totalRecords="store.pagination.totalItems"
                            :first="(store.pagination.currentPage - 1) * store.pagination.itemsPerPage"
                            :loading="isViewLoading || store.loading" :rowsPerPageOptions="[10, 25, 50, 100]"
                            responsiveLayout="scroll" tableStyle="min-width: 50rem"
                            class="table table-sm mb-0 professional-table"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
                            emptyMessage="No se encontraron registros" @page="onPageChange">
                            <Column field="procedure_code" header="Código" style="min-width: 110px;">
                                <template #body="{ data }">
                                    <span class="text-dark fw-semibold">{{ data.procedure_code || '-' }}</span>
                                </template>
                            </Column>

                            <Column header="Placa" style="min-width: 110px;">
                                <template #body="{ data }">
                                    <span class="text-dark">{{ data.vehicle?.vehicle_license_plate || '-' }}</span>
                                </template>
                            </Column>

                            <Column field="link_type" header="Tipo">
                                <template #body="{ data }">
                                    <span class="text-dark">{{ etiquetaTipo(data.link_type) }}</span>
                                </template>
                            </Column>

                            <Column field="avance" header="Avance" style="min-width: 150px;">
                                <template #body="{ data }">
                                    <div class="avance" :aria-label="`Avance ${data.avance}`">
                                        <div class="progress avance-barra" role="progressbar"
                                            :aria-valuenow="porcentajeAvance(data.avance)" aria-valuemin="0" aria-valuemax="100">
                                            <div class="progress-bar"
                                                :class="porcentajeAvance(data.avance) === 100 ? 'bg-success' : 'bg-primary'"
                                                :style="{ width: porcentajeAvance(data.avance) + '%' }" />
                                        </div>
                                        <span class="avance-texto">{{ data.avance }}</span>
                                    </div>
                                </template>
                            </Column>

                            <Column header="Pasos" style="min-width: 260px;">
                                <template #body="{ data }">
                                    <span v-if="expedienteCompletado(data)" class="badge rounded-pill badge-subtle badge-subtle-success">
                                        <i class="fad fa-check-circle me-1" style="font-size:10px;" aria-hidden="true" />Completado
                                    </span>
                                    <div v-else class="d-flex flex-wrap gap-1">
                                        <span v-for="p in data.linea_tiempo" :key="p.paso"
                                            class="badge rounded-pill badge-subtle" :class="claseDePaso(p.estado)"
                                            :title="etiquetaPaso(p.paso)">{{ etiquetaPasoCorta(p.paso) }}</span>
                                    </div>
                                </template>
                            </Column>

                            <Column header="Acciones" class="text-center" style="min-width:100px; width: 100px;">
                                <template #body="{ data }">
                                    <div class="btn-group btn-group-sm" role="group">
                                        <button class="btn btn-falcon-default" type="button" title="Ver expediente"
                                            :aria-label="`Ver expediente ${data.procedure_code}`" @click="verExpediente(data.uuid)">
                                            <i class="fad fa-eye text-primary" style="font-size:14px;" />
                                        </button>
                                    </div>
                                </template>
                            </Column>

                            <template #loading>
                                <NoaTableSpinner message="Cargando datos..." />
                            </template>
                        </DataTable>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { useRadicacionStore } from '../store/radicacion.store.js';
import { usePermissionsStore } from '@store';
import { useTable } from '@/hooks/useTable.js';
import {
    etiquetaPaso,
    etiquetaPasoCorta,
    etiquetaTipo,
    expedienteCompletado,
    porcentajeAvance,
} from '../utils/pasosRadicacion.js';

const router = useRouter();
const store = useRadicacionStore();
const permissionsStore = usePermissionsStore();
const puedeCrear = computed(() => permissionsStore.can('radicacion_to.create'));

const isViewLoading = ref(true);
const busqueda = ref('');
const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(busqueda.value));
const limpiarBusqueda = async () => { busqueda.value = ''; await store.clearFilters(); };

const irANuevo = () => router.push('/radicacion/nuevo');
const verExpediente = (uuid) => router.push(`/radicacion/${uuid}`);

const onPageChange = async ({ first, rows }) => {
    if (rows !== store.pagination.itemsPerPage) {
        await store.setPerPage(rows);
        return;
    }
    await store.setPage(Math.floor(first / rows) + 1);
};

const claseDePaso = (estado) => ({
    COMPLETADO: 'badge-subtle-success',
    EN_PROCESO: 'badge-subtle-primary',
}[estado] ?? 'badge-subtle-secondary');

onMounted(async () => {
    try {
        busqueda.value = store.search;
        await store.fetchItems();
    } finally {
        isViewLoading.value = false;
    }
});
</script>

<style scoped>
.fade-in-up {
    animation: fadeInUp 0.4s ease-out forwards;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translate3d(0, 15px, 0);
    }

    to {
        opacity: 1;
        transform: translate3d(0, 0, 0);
    }
}

/* Tabla Estilo Profesional Falcon */
:deep(.professional-table .p-datatable-thead > tr > th) {
    padding: 0.625rem 0.75rem !important;
    font-size: 0.75rem !important;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #495057;
    border-bottom: 2px solid #e9ecef !important;
    background: #f8f9fa;
}

:deep(.professional-table .p-datatable-tbody > tr > td) {
    padding: 0.625rem 0.75rem !important;
    vertical-align: middle;
    border-bottom: 1px solid #e9ecef;
    font-size: 0.825rem !important;
    color: #212529;
    transition: background-color 150ms ease-in-out;
}

:deep(.professional-table .p-datatable-tbody > tr:hover) {
    background: #f8f9fa !important;
}

:deep(.professional-table .p-datatable-tbody > tr:last-child > td) {
    border-bottom: none;
}

/* Paginador */
:deep(.p-paginator) {
    padding: 0.5rem 1rem !important;
    background: #f8f9fa !important;
    border-top: 1px solid #e9ecef !important;
    border-radius: 0 0 0.75rem 0.75rem !important;
}

:deep(.p-paginator .p-paginator-page) {
    width: 1.8rem;
    height: 1.8rem;
    border-radius: 0.25rem !important;
    margin: 0 0.125rem;
    font-size: 0.75rem;
    transition: all 150ms ease-in-out;
}

:deep(.p-paginator .p-paginator-page.p-highlight) {
    background: #0d6efd !important;
    border-color: #0d6efd !important;
    color: #fff !important;
}

:deep(.p-paginator .p-paginator-page:not(.p-highlight):hover) {
    background: #e9ecef !important;
}

:deep(.p-paginator .p-paginator-current) {
    font-size: 0.75rem;
    color: #6c757d;
}

:deep(.p-paginator .p-dropdown) {
    min-height: auto !important;
    height: 26px !important;
    font-size: 0.75rem !important;
}

:deep(.p-paginator .p-dropdown .p-dropdown-label) {
    font-size: 0.725rem !important;
    padding: 0 0.25rem !important;
}

:deep(.p-paginator .p-dropdown .p-dropdown-trigger) {
    width: 18px !important;
}

/* Badges */
.badge-subtle {
    font-weight: 500;
    font-size: 0.75rem;
    padding: 0.35em 0.6em;
    transition: all 150ms ease-in-out;
    white-space: nowrap;
}

.badge-subtle-success {
    background: rgba(25, 135, 84, 0.1);
    color: #198754;
    border: 1px solid rgba(25, 135, 84, 0.2);
}

.badge-subtle-secondary {
    background: rgba(108, 117, 125, 0.1);
    color: #6c757d;
    border: 1px solid rgba(108, 117, 125, 0.2);
}

.badge-subtle-primary {
    background: rgba(37, 99, 235, 0.1);
    color: #1d4ed8;
    border: 1px solid rgba(37, 99, 235, 0.2);
}

.badge-subtle-info {
    background: rgba(13, 202, 240, 0.1);
    color: #0dcaf0;
    border: 1px solid rgba(13, 202, 240, 0.2);
}

.badge-subtle-warning {
    background: rgba(255, 193, 7, 0.1);
    color: #856404;
    border: 1px solid rgba(255, 193, 7, 0.2);
}

.badge-subtle:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Botones Acciones */
:deep(.btn-group .btn) {
    padding: 0.25rem 0.45rem;
    transition: all 150ms ease-in-out;
}

:deep(.btn-group .btn:hover) {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
    z-index: 1;
}
.avance {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.avance-barra {
    flex: 1;
    height: 8px;
    min-width: 70px;
    background: #e9ecef;
    border-radius: 999px;
}

.avance-barra .progress-bar {
    border-radius: 999px;
    transition: width 300ms ease-in-out;
}

.avance-texto {
    font-size: 0.8rem;
    font-weight: 700;
    color: #212529;
    min-width: 2.2rem;
    text-align: right;
}
</style>