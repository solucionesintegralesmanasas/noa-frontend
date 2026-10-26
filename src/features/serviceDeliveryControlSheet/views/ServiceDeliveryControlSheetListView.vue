<template>
    <!-- VISTA ESCRITORIO / TABLET -->
    <div class="d-none d-md-block">
        <BasePageHeader title="Hojas de Control de Servicio"
            description="Gestión de las planillas de control de prestación de servicios."
            icon="fad fa-clipboard-list text-primary" :show-bg="true" :loading="isViewLoading"
            :compact="true" :breadcrumbs="[{ label: 'Hojas de Control' }, { label: 'Listado' }]">
            <template #actions>
                <!-- REFRESH -->
                <button class="btn btn-falcon-default btn-sm px-3 me-2" type="button" title="Actualizar"
                    :aria-label="'Actualizar listado'" @click="refreshTable">
                    <i class="fad fa-sync" aria-hidden="true" />
                </button>

                <!-- REPORTES -->
                <button v-if="permissions.pdf" class="btn btn-info btn-sm px-3 fw-medium shadow-sm me-2" type="button" title="Reportes solo días cerrados"
                    @click="showReportsDialog = true">
                    <i class="fad fa-file-chart-column me-1" aria-hidden="true" /> <span class="d-none d-sm-inline">Reportes</span>
                </button>

                <!-- CREATE -->
                <button v-if="permissionsStore.can('service_delivery_control_sheets.create') && !permissionsStore.hasRole('CONDUCTOR')"
                    class="btn btn-primary btn-sm px-3 me-2" type="button" title="Nuevo registro" @click="goToCreate">
                    <i class="fad fa-plus me-1" aria-hidden="true" /> <span class="d-none d-sm-inline">Nuevo</span>
                </button>

                <!-- CUSTOM: Control de Servicios -->
                <button class="btn btn-success btn-sm px-3 fw-medium shadow-sm" type="button" title="Control de Servicios (En Ruta)"
                    @click="goToInternalControl">
                    <i class="fad fa-steering-wheel me-1" aria-hidden="true" /> <span class="d-none d-sm-inline">Control en Ruta</span>
                </button>
            </template>
        </BasePageHeader>

        <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
        <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
            <div class="noa-list-toolbar">
                <div class="noa-search">
                    <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                    <input id="f-pcp-busqueda" v-model="searchQuery" class="noa-search__input" type="search" placeholder="Buscar por ruta, vehículo, conductor..."
                        aria-label="Buscar hoja de control" @input="debouncedSearch" />
                    <button v-if="searchQuery" class="noa-search__clear" type="button" title="Limpiar búsqueda"
                        aria-label="Limpiar búsqueda" @click="clearSearch">
                        <i class="fal fa-times" aria-hidden="true" />
                    </button>
                </div>

                <!-- Centro: filtro proyecto -->
                <div class="d-flex align-items-center gap-2" style="max-width: 22rem; flex: 1 1 14rem;">
                    <label class="visually-hidden" for="filtro-proyecto">Filtrar por proyecto</label>
                    <PrimeSelect input-id="filtro-proyecto" v-model="projectFilter" :options="opcionesProyecto"
                        option-label="label" option-value="value" size="small" style="min-width: 200px;"
                        @change="onProjectFilterChange" />
                </div>

                <!-- Derecha: filtro cerradas + contador -->
                <div class="d-flex align-items-center gap-3 ms-auto">
                    <div class="form-check form-switch mb-0" title="Mostrar solo planillas cerradas">
                        <input id="filtroSoloCerradas" v-model="soloCerradas" class="form-check-input" type="checkbox" @change="onSoloCerradasChange" />
                        <label class="form-check-label small text-muted" for="filtroSoloCerradas">Solo cerradas</label>
                    </div>
                    <div class="form-check form-switch mb-0" title="Agrupar las planillas por proyecto">
                        <input id="filtroAgruparProyecto" v-model="agruparPorProyecto" class="form-check-input" type="checkbox" @change="onAgruparChange" />
                        <label class="form-check-label small text-muted" for="filtroAgruparProyecto">Agrupar por proyecto</label>
                    </div>
                    <span v-if="!isViewLoading" class="noa-results">
                        <i v-if="!store.loading" class="fas fa-filter" aria-hidden="true" />
                        <span v-else class="spinner-border spinner-border-sm text-primary" style="width: 10px; height: 10px;" role="status" aria-hidden="true"></span>
                        {{ store.pagination.totalItems }} resultado{{ store.pagination.totalItems !== 1 ? 's' : '' }}
                        <template v-if="store.search"> para "{{ store.search }}"</template>
                    </span>
                </div>
            </div>

            <!-- SKELETON -->
            <div v-if="isViewLoading" class="card-body p-0">
                <div class="table-responsive scrollbar">
                    <table class="table table-sm mb-0">
                        <thead>
                            <tr>
                                <th v-for="w in ['4%', '22%', '22%', '18%', '13%', '11%', '10%']" :key="w"
                                    style="padding:12px 8px">
                                    <div class="skeleton-text" :style="`height:16px;width:${w}`" />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="n in store.pagination.itemsPerPage" :key="`sk-${n}`">
                                <td v-for="i in 6" :key="i">
                                    <div class="skeleton-text" style="height:18px;width:75%;" />
                                </td>
                                <td>
                                    <div class="d-flex justify-content-end gap-1">
                                        <div v-for="j in 2" :key="j" class="skeleton-icon"
                                            style="height:28px;width:28px;" />
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- DATATABLE (Paginación Server-Side) -->
            <div v-else class="card-body p-0">
                <div class="table-responsive scrollbar">
                    <DataTable :value="store.items" v-model:expandedRows="expandedRows" dataKey="uuid" lazy
                        :rowGroupMode="agruparPorProyecto ? 'subheader' : null" groupRowsBy="project.project_name"
                        :expandableRowGroups="agruparPorProyecto" v-model:expandedRowGroups="gruposExpandidos"
                        :paginator="false" :rows="store.pagination.itemsPerPage"
                        :totalRecords="store.pagination.totalItems" :first="(store.pagination.currentPage - 1) *
                            store.pagination.itemsPerPage
                            " :loading="store.loading"
                        :sortField="store.sortField" :sortOrder="store.sortOrder" @sort="handleSort"
                        responsiveLayout="scroll" tableStyle="min-width: 60rem"
                        class="table table-sm mb-0 professional-table noa-table-fixed"
                        emptyMessage="No se encontraron registros">

                        <template #groupheader="{ data }">
                            <span class="fw-bold text-dark"><i class="fad fa-briefcase text-primary me-2" aria-hidden="true"></i>{{ data.project?.project_name || 'Sin Proyecto' }}</span>
                            <span class="badge rounded-pill badge-subtle-primary ms-2">{{ planillasDelProyecto(data.project?.project_name) }} planilla{{ planillasDelProyecto(data.project?.project_name) !== 1 ? 's' : '' }}</span>
                        </template>

                        <Column expander style="width: 3.5rem" />

                        <Column header="Proyecto / Tipo" style="width: 22%;">
                            <template #body="{ data }">
                                <div class="d-flex flex-column">
                                    <span class="noa-cell-strong text-truncate" :title="data.project?.project_name">{{ data.project?.project_name || 'Sin Proyecto' }}</span>
                                    <span class="badge rounded-pill badge-subtle-secondary mt-1 align-self-start" style="font-size: 0.65rem;">
                                        {{ tipoLabel(data.type_of_control_sheet) }}
                                    </span>
                                </div>
                            </template>
                        </Column>

                        <Column field="vehicle_license_plate" header="Vehículo / Conductor" sortable style="width: 22%;">
                            <template #body="{ data }">
                                <div class="d-flex flex-column">
                                    <span class="noa-cell-strong"><i class="fad fa-car-side text-muted me-1" aria-hidden="true" />{{ data.vehicle_license_plate || '-' }}</span>
                                    <small class="noa-cell-sub text-truncate" :title="data.driver_name || data.official_name_and_surname">
                                        <i class="fad fa-user-tie text-muted me-1" aria-hidden="true" />{{ data.driver_name || data.official_name_and_surname || 'Sin Conductor' }}
                                    </small>
                                </div>
                            </template>
                        </Column>

                        <Column header="Recorridos" style="width: 18%;">
                            <template #body="{ data }">
                                <span class="badge rounded-pill badge-subtle-info">
                                    <i class="fad fa-route me-1" aria-hidden="true" /> {{ recorridosCount(data) }} recorrido{{ recorridosCount(data) !== 1 ? 's' : '' }}
                                </span>
                                <div class="small text-muted mt-1 text-truncate" :title="recorridosTexto(data)">
                                    {{ recorridosTexto(data) }}
                                </div>
                            </template>
                        </Column>

                        <Column field="start_date" header="Fechas" sortable style="width: 13%;">
                            <template #body="{ data }">
                                <div class="d-flex flex-column text-dark" style="font-size: 0.85rem;">
                                    <span class="fw-medium"><i class="fad fa-calendar-alt text-muted me-1" aria-hidden="true" /> {{ formatRango(data.start_date || data.service_date) || '-' }}</span>
                                    <span v-if="(data.end_date || data.service_date) && (data.end_date || data.service_date) !== (data.start_date || data.service_date)" class="text-muted mt-1">
                                        <i class="fad fa-arrow-down text-muted mx-1" style="font-size: 0.7rem;" aria-hidden="true" />{{ formatRango(data.end_date || data.service_date) }}
                                    </span>
                                </div>
                            </template>
                        </Column>

                        <Column field="estado" header="Estado" class="text-center" style="width: 11%;">
                            <template #body="{ data }">
                                <span v-if="data.estado" class="badge rounded-pill d-block"
                                    :class="claseEstadoServicio(data.estado)" style="font-size: 0.62rem;"
                                    :title="tituloEstadoServicio(data)">
                                    {{ etiquetaEstadoServicio(data.estado) }}
                                </span>
                                <span v-if="data.dias_evidencia_incompleta > 0" class="badge rounded-pill badge-subtle-warning mt-1 d-block"
                                    style="font-size: 0.62rem;"
                                    :aria-label="`${data.dias_evidencia_incompleta} día(s) con evidencia operativa incompleta`"
                                    :title="`${data.dias_evidencia_incompleta} día(s) con firmas o datos operativos pendientes`">
                                    <i class="fad fa-triangle-exclamation me-1" aria-hidden="true" />{{ data.dias_evidencia_incompleta }} incompletos
                                </span>
                                <span v-if="data.dias_pendientes_certificacion > 0" class="badge rounded-pill badge-subtle-info mt-1 d-block"
                                    style="font-size: 0.62rem;"
                                    :title="`${data.dias_pendientes_certificacion} día(s) esperan firma del coordinador`">
                                    {{ data.dias_pendientes_certificacion }} por certificar
                                </span>
                                <span v-if="data.dias_excepcion > 0" class="badge rounded-pill badge-subtle-danger mt-1 d-block"
                                    style="font-size: 0.62rem;"
                                    :title="`${data.dias_excepcion} día(s) se cerraron con excepción aprobada`">
                                    {{ data.dias_excepcion }} excepción(es)
                                </span>
                            </template>
                        </Column>

                        <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 10.5%;">
                            <template #body="{ data }">
                                <RowActions :actions="accionesDe(data)" :row-label="data.vehicle_license_plate || 'planilla'" />
                            </template>
                        </Column>
                        <!-- Loading state -->
                        <template #loading>
                            <NoaTableSpinner message="Cargando datos..." />
                        </template>
                        <template #expansion="{ data }">
                            <div class="p-2">
                                <div class="fw-semibold mb-2" style="font-size: 0.85rem;">
                                    Días del servicio ({{ diasHijos(data).length }})
                                </div>
                                <div v-if="diasHijos(data).length" class="table-responsive">
                                    <table class="table table-sm mb-0">
                                        <thead>
                                            <tr>
                                                <th>Fecha</th>
                                                <th>Estado</th>
                                                <th>Recorridos</th>
                                                <th class="text-center">PDF del día</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="dia in diasHijos(data)" :key="dia.uuid">
                                                <td>{{ formatRango(dia.service_date) || '-' }}</td>
                                                <td>
                                                    <span v-if="dia.estado" class="badge rounded-pill d-block mt-1"
                                                        :class="claseEstadoServicio(dia.estado)" style="font-size:0.6rem;"
                                                        :title="tituloEstadoServicio(dia)">
                                                        {{ etiquetaEstadoServicio(dia.estado) }}
                                                    </span>
                                                </td>
                                                <td>{{ Array.isArray(dia.routes) ? dia.routes.length : 0 }}</td>
                                                <td class="text-center">
                                                    <button v-if="permissions.pdf" class="btn btn-falcon-default btn-sm p-0 px-1"
                                                        type="button" title="Descargar PDF de este día"
                                                        :aria-label="`Descargar PDF del día ${formatRango(dia.service_date)}`"
                                                        :disabled="downloadingDaily === dia.uuid"
                                                        @click="downloadDaily(dia.uuid)">
                                                        <span v-if="downloadingDaily === dia.uuid"
                                                            class="spinner-border spinner-border-sm text-danger"
                                                            style="width: 14px; height: 14px;"></span>
                                                        <i v-else class="fad fa-file-pdf text-danger"
                                                            style="font-size:14px;" aria-hidden="true" />
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <small v-else class="text-muted">{{ soloCerradas ? 'Sin fechas cerradas en este servicio.' : 'Servicio de un solo día: usa el botón PDF de la fila.' }}</small>
                            </div>
                        </template>
                    </DataTable>
                </div>
                <ListPagination :page="store.pagination.currentPage" :per-page="store.pagination.itemsPerPage"
                    :total="store.pagination.totalItems" @change="onPageChange" />
            </div>
        </div>
    </div>

    <!-- VISTA MÓVIL ANDROID CAPACITOR (Pantalla completa de borde a borde) -->
    <div class="d-md-none w-100 px-1 pt-1 pb-3 mobile-service-feed">
        <MobileSectionHeader
            title="Control de Servicio"
            icon-class="fas fa-route"
            icon-bg="#14b8a6"
            :badge="store.pagination.totalItems ? `${store.pagination.totalItems}` : '0'"
        >
            <template #action>
                <button v-if="permissions.create" type="button" class="btn btn-primary btn-sm py-1 px-2 fs-11 rounded-3" @click="goToCreate">
                    <i class="fas fa-plus me-1" aria-hidden="true"></i> Nuevo
                </button>
            </template>
        </MobileSectionHeader>

        <div v-if="store.items && store.items.length > 0" class="d-flex flex-column w-100">
            <MobileCard
                v-for="item in store.items"
                :key="item.uuid"
                variant="teal"
                :title="item.vehicle_license_plate || 'SIN PLACA'"
                :subtitle="item.project?.project_name || 'Servicio de Transporte'"
                :badge="tipoLabel(item.type_of_control_sheet)"
                icon-class="fas fa-route"
            >
                <div class="d-flex justify-content-between align-items-center py-2 border-top border-bottom my-1">
                    <div>
                        <small class="text-muted d-block fs-10">Conductor</small>
                        <span class="fw-semibold text-dark fs-12">
                            {{ item.driver_name || item.official_name_and_surname || 'Sin conductor' }}
                        </span>
                    </div>
                    <div class="text-end">
                        <small class="text-muted d-block fs-10">Recorridos</small>
                        <span class="badge bg-light text-primary border fw-bold fs-11">
                            <i class="fad fa-road me-1" aria-hidden="true"></i>{{ recorridosCount(item) }}
                        </span>
                    </div>
                </div>

                <template #actions>
                    <button class="mc-btn-primary" type="button" @click="goToInternalControl">
                        <i class="fad fa-steering-wheel" aria-hidden="true"></i>
                        <span>Control en Ruta</span>
                    </button>
                    <button class="mc-btn-secondary" type="button" @click="downloadParentPdf(item)">
                        <i class="fad fa-file-pdf text-danger" aria-hidden="true"></i>
                        <span>PDF</span>
                    </button>
                    <button v-if="permissions.edit && !isServicioCerrado(item)" class="mc-btn-secondary" type="button" @click="goToEdit(item.uuid)">
                        <i class="fad fa-edit text-warning" aria-hidden="true"></i>
                        <span>Editar</span>
                    </button>
                </template>
            </MobileCard>
        </div>

        <MobileEmptyState
            v-else
            emoji="🚌"
            title="Sin hojas de servicio"
            description="No hay registros de control de servicio para los filtros seleccionados."
            action-text="Control en Ruta"
            action-icon="fad fa-steering-wheel"
            @action="goToInternalControl"
        />

        <!-- Paginación Móvil Táctil -->
        <div v-if="store.pagination.totalPages > 1" class="d-flex justify-content-between align-items-center mt-2 pt-1 px-1">
            <button class="btn btn-light btn-sm border px-3 rounded-pill fs-11" :disabled="store.pagination.currentPage <= 1"
                @click="onPageChange({ page: store.pagination.currentPage - 1, rows: store.pagination.itemsPerPage, first: (store.pagination.currentPage - 2) * store.pagination.itemsPerPage })">
                <i class="fas fa-chevron-left me-1" aria-hidden="true"></i> Anterior
            </button>
            <span class="fs-11 text-muted fw-semibold">
                {{ store.pagination.currentPage }} / {{ store.pagination.totalPages }}
            </span>
            <button class="btn btn-light btn-sm border px-3 rounded-pill fs-11" :disabled="store.pagination.currentPage >= store.pagination.totalPages"
                @click="onPageChange({ page: store.pagination.currentPage + 1, rows: store.pagination.itemsPerPage, first: store.pagination.currentPage * store.pagination.itemsPerPage })">
                Siguiente <i class="fas fa-chevron-right ms-1" aria-hidden="true"></i>
            </button>
        </div>
    </div>

    <!-- DIÁLOGO ÚNICO DE REPORTES: rango, vehículo, conductor, día y mensual en PDF y Excel (solo cerradas) -->
    <ServiceReportsDialog v-model:visible="showReportsDialog" :vehicles="reportVehicles" :drivers="reportDrivers" />
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useServiceDeliveryControlSheetStore } from '../store/serviceDeliveryControlSheet.store.js';
import { usePermissionsStore, useUserStore } from '@store';
import { toast } from '@/utils/toast.js';
import Swal from 'sweetalert2';
import { useTable } from '@/hooks/useTable.js';
import { useTableActions } from '@/hooks/useTableActions.js';
import { useServerSort } from '@/hooks/useServerSort.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import RowActions from '@/components/RowActions.vue';
import ListPagination from '@/components/ListPagination.vue';
import PrimeSelect from '@/components/form/PrimeSelect.vue';
import ServiceReportsDialog from '../components/ServiceReportsDialog.vue';
import { formatRango as formatRangoHook, diasHijos as diasHijosHook, recorridosCount as recorridosCountHook, recorridosTexto as recorridosTextoHook, esCerrado } from '../hooks/useServiceList.js';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import MobileCard from '@/components/mobile/MobileCard.vue';
import MobileSectionHeader from '@/components/mobile/MobileSectionHeader.vue';
import MobileEmptyState from '@/components/mobile/MobileEmptyState.vue';
import { claseEstadoServicio, etiquetaEstadoServicio, tituloEstadoServicio } from '@/utils/serviceDeliveryStatus.js';

const router = useRouter();
const route = useRoute();
const store = useServiceDeliveryControlSheetStore();
const permissionsStore = usePermissionsStore();
const userStore = useUserStore();

const { handleSort } = useServerSort((field, order) => store.setSort(field, order), { route, router });

const isViewLoading = ref(true);
const searchQuery = ref('');
const projectFilter = ref('');
// Mismo contenido que el <select> nativo que reemplazó; el «Todos» de valor
// vacío lo renderiza el centinela del wrapper PrimeSelect.
const opcionesProyecto = computed(() => [
    { label: 'Todos los proyectos', value: '' },
    ...(store.projects ?? []).map((p) => ({ label: p.project_name, value: p.uuid })),
]);
const soloCerradas = ref(false);
const agruparPorProyecto = ref(store.agruparPorProyecto ?? true);
const gruposExpandidos = ref([]);
const planillasDelProyecto = (nombre) => store.items.filter((i) => (i.project?.project_name || undefined) === (nombre || undefined)).length;
const expandedRows = ref([]);

const showReportsDialog = ref(false);
const reportVehicles = computed(() => store.catalogs.vehicles ?? []);
const reportDrivers = computed(() => store.catalogs.drivers ?? []);
const downloadingDaily = ref(null);
const sharingLink = ref(null);

const canShareCoordinatorLink = computed(() => permissionsStore.hasRole('superadmin') || permissionsStore.hasRole('administrador') || permissionsStore.hasRole('ADMIN_EMPRESA'));

const permissions = reactive({ create: false, edit: false, delete: false, pdf: false });
const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(searchQuery.value));
const { confirmDelete, initTooltips } = useTableActions(store, router);

const clearSearch = async () => { searchQuery.value = ''; await store.clearFilters(); };
const refreshTable = () => store.fetchItems();
const onProjectFilterChange = async () => { await store.setProjectFilter(projectFilter.value); };
const onAgruparChange = async () => { gruposExpandidos.value = []; await store.setAgruparPorProyecto(agruparPorProyecto.value); };
const onSoloCerradasChange = async () => { await store.setSoloCerradas(soloCerradas.value); };
const goToProject = (uuid) => router.push(`/proyectos/perfil/${uuid}`);
const goToProjectEdit = (uuid) => router.push(`/proyectos/editar/${uuid}`);

const onPageChange = async ({ page, first, rows }) => {
    store.pagination.itemsPerPage = rows;
    const targetPage = page !== undefined ? page : Math.floor(first / rows) + 1;
    await store.setPage(targetPage);
};

const recorridosCount = (data) => recorridosCountHook(data);
const diasHijos = (data) => diasHijosHook(data, soloCerradas.value);
const recorridosTexto = (data) => recorridosTextoHook(data);
const formatRango = (fecha) => formatRangoHook(fecha);
const isServicioCerrado = (data) => esCerrado(data) || data.control_status === 'CLOSED' || data.control_status === 'CERRADO';

const tipoLabel = (type) => {
    const tipos = {
        'DIRECTO_CON_LA_EMPRESA': 'Directo con la empresa',
        'SUBCONTRATADO': 'Subcontratado',
        'CON_VEHICULO_CONTRATADO': 'Vehículo contratado',
        'EXTERNO_PLATAFORMA': 'Externo de plataforma'
    };
    return tipos[type] || type || 'Desconocido';
};

const goToInternalControl = () => router.push('/planilla-de-control-de-prestacion-servicios/control-de-servicios');
const goToCreate = () => router.push('/planilla-de-control-de-prestacion-servicios/crear');
const goToControl = (uuid) => router.push(`/planilla-de-control-de-prestacion-servicios/control-de-servicios?id=${uuid}`);
const goToEdit = (uuid) => router.push(`/planilla-de-control-de-prestacion-servicios/editar/${uuid}`);

const handleDelete = (item) => confirmDelete(item, {
    title: '¿Eliminar registro?',
    html: `<p class="mb-2">¿Estás seguro de eliminar el registro de <strong>"${item.vehicle_license_plate || item.vehicle?.vehicle_license_plate || 'este vehículo'}"</strong>?</p>
           <div class="alert alert-warning small mb-0 mt-2"><i class="fad fa-exclamation-triangle me-1"></i>Esta acción no se puede deshacer.</div>`
});

const downloadParentPdf = async (data) => {
    try {
        downloadingDaily.value = data.uuid;
        await store.downloadDailyPdf(data.uuid);
    } catch {
        toast('Error', 'No se pudo descargar el PDF.', 'error');
    } finally {
        downloadingDaily.value = null;
    }
};

const downloadDaily = async (uuid) => {
    try {
        downloadingDaily.value = uuid;
        await store.downloadDailyPdf(uuid);
    } catch {
        toast('Error', 'Error descargando PDF', 'error');
    } finally {
        downloadingDaily.value = null;
    }
};

const shareCoordinatorLink = async (uuid) => {
    try {
        sharingLink.value = uuid;
        Swal.fire({ title: 'Generando enlace...', text: 'Por favor espera...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const result = await store.generateCoordinatorSignUrl(uuid);
        const url = result?.url;
        if (!url) throw new Error();
        Swal.close();
        Swal.fire({
            title: '¡Enlace Generado!',
            html: `<p>Comparte este enlace con el coordinador:</p><div class="mt-2 p-2 bg-light border rounded text-break font-monospace" style="font-size: 12px;">${url}</div>`,
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: '<i class="fad fa-copy"></i> Copiar',
            cancelButtonText: 'Cerrar'
        }).then(r => {
            if (r.isConfirmed) navigator.clipboard.writeText(url).then(() => toast('Éxito', 'Enlace copiado', 'success'));
        });
    } catch {
        toast('Error', 'Error al generar enlace', 'error');
    } finally {
        sharingLink.value = null;
    }
};

const accionesDe = (data) => {
    const cerrado = isServicioCerrado(data);
    return [
        {
            key: 'control',
            label: 'Continuar servicio',
            icon: 'fad fa-steering-wheel',
            tone: 'success',
            inline: true,
            visible: !cerrado,
            onClick: () => goToControl(data.uuid)
        },
        {
            key: 'proyecto',
            label: 'Ver proyecto',
            icon: 'fad fa-eye',
            tone: 'info',
            inline: true,
            visible: !!permissions.projectProfile && !!data.project_uuid,
            onClick: () => goToProject(data.project_uuid)
        },
        {
            key: 'editarProyecto',
            label: 'Editar proyecto',
            icon: 'fad fa-briefcase',
            tone: 'primary',
            visible: !!permissions.projectEdit && !!data.project_uuid,
            onClick: () => goToProjectEdit(data.project_uuid)
        },
        {
            key: 'pdf',
            label: 'Descargar PDF',
            icon: 'far fa-file-pdf',
            tone: 'neutral',
            inline: true,
            visible: permissions.pdf,
            onClick: () => downloadParentPdf(data)
        },
        {
            key: 'firma',
            label: 'Firma Coordinador',
            icon: 'far fa-share-alt',
            tone: 'primary',
            visible: canShareCoordinatorLink.value && !cerrado && !data.has_coordinator_signature,
            onClick: () => shareCoordinatorLink(data.uuid)
        },
        {
            key: 'editar',
            label: 'Editar',
            icon: 'far fa-pen',
            tone: 'warning',
            visible: permissions.edit && !cerrado,
            onClick: () => goToEdit(data.uuid)
        },
        {
            key: 'eliminar',
            label: 'Eliminar',
            icon: 'far fa-trash-alt',
            tone: 'danger',
            visible: permissions.delete && !cerrado,
            onClick: () => handleDelete(data)
        },
    ];
};

onMounted(async () => {
    isViewLoading.value = true;
    try {
        if (route.query.sort) {
            store.sortField = String(route.query.sort);
            store.sortOrder = route.query.order === 'desc' ? -1 : 1;
        }
        await store.loadFormOptions(userStore.company_uuid);
        if (store.catalogs.projects) store.projects = store.catalogs.projects;
        permissions.pdf = permissionsStore.can('service_delivery_control_sheets.history_pdf');
        permissions.create = permissionsStore.can('service_delivery_control_sheets.create');
        permissions.projectProfile = permissionsStore.can('projects.profile');
        permissions.projectEdit = permissionsStore.can('projects.update');
        soloCerradas.value = store.soloCerradas;
        agruparPorProyecto.value = store.agruparPorProyecto;
        permissions.view = permissionsStore.can('service_delivery_control_sheets.view');
        permissions.edit = permissionsStore.can('service_delivery_control_sheets.update');
        permissions.delete = permissionsStore.can('service_delivery_control_sheets.delete');
        await store.fetchItems();
    } finally {
        isViewLoading.value = false;
        setTimeout(() => initTooltips(), 200);
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
        transform: translateY(16px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

:deep(.p-menu-overlay) {
    z-index: 1100 !important;
}
</style>
