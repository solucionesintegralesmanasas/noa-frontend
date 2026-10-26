<template>
    <BasePageHeader title="Solicitudes de tanqueo"
        description="Solicita, aprueba y controla el QR de tanqueo por vehículo."
        icon="fad fa-qrcode text-primary" :show-refresh="true" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true"
        :breadcrumbs="[{ label: 'Flota' }, { label: 'Solicitudes de tanqueo' }]" @refresh="refresh" />

    <!-- FILTROS -->
    <div class="card border-0 shadow-sm mb-3">
        <div class="card-body py-2">
            <div class="d-flex flex-column flex-lg-row align-items-lg-center gap-2">
                <div class="input-group input-group-sm" style="max-width: 380px;">
                    <span class="input-group-text bg-light border-end-0">
                        <i class="fad fa-search text-muted" aria-hidden="true" />
                    </span>
                    <input id="f-tanqueo-busqueda" v-model="search" type="search" class="form-control form-control-sm border-start-0 shadow-none"
                        placeholder="Código, placa o conductor" aria-label="Buscar solicitudes de tanqueo"
                        @input="debouncedSearch" />
                </div>
                <select id="f-tanqueo-estado" v-model="statusFilter" class="form-select form-select-sm" style="max-width: 200px;"
                    aria-label="Filtrar por estado" @change="refresh">
                    <option value="">Todos los estados</option>
                    <option value="PENDIENTE">Pendientes</option>
                    <option value="APROBADA">Aprobadas</option>
                    <option value="USADA">Usadas</option>
                    <option value="RECHAZADA">Rechazadas</option>
                    <option value="VENCIDA">Vencidas</option>
                    <option value="ANULADA">Anuladas</option>
                </select>
                <button v-if="can('fuel_requests.create')" type="button" class="btn btn-primary btn-sm ms-lg-auto"
                    @click="abrirCrear">
                    <i class="fad fa-plus me-1" aria-hidden="true" />Solicitar tanqueo
                </button>
            </div>
        </div>
    </div>

    <!-- LISTADO -->
    <div class="card border-0 shadow-sm">
        <div class="card-body p-0">
            <div class="table-responsive">
                <DataTable :value="store.items" lazy :paginator="true" :rows="store.pagination.itemsPerPage"
                    :totalRecords="store.pagination.totalItems"
                    :first="(store.pagination.currentPage - 1) * store.pagination.itemsPerPage"
                    :loading="store.loading" :rowsPerPageOptions="[15, 25, 50]"
                    tableStyle="min-width: 70rem" class="table table-sm mb-0 professional-table"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} solicitudes"
                    emptyMessage="No hay solicitudes de tanqueo" @page="onPageChange">
                    <Column header="Código" style="min-width: 160px;">
                        <template #body="{ data }">
                            <span class="fw-semibold text-dark">{{ data.code }}</span>
                        </template>
                    </Column>
                    <Column header="Vehículo" style="min-width: 130px;">
                        <template #body="{ data }">
                            <span class="fw-bold">{{ data.vehicle?.vehicle_license_plate || '—' }}</span>
                        </template>
                    </Column>
                    <Column header="Conductor" style="min-width: 160px;">
                        <template #body="{ data }">
                            {{ nombreConductor(data) }}
                        </template>
                    </Column>
                    <Column header="Solicitada" style="min-width: 120px;">
                        <template #body="{ data }">{{ fecha(data.requested_at) }}</template>
                    </Column>
                    <Column header="Estado" style="min-width: 130px;">
                        <template #body="{ data }">
                            <span class="badge badge-subtle" :class="`badge-subtle-${meta(data.status).color}`">
                                <i class="fad me-1" :class="meta(data.status).icon" aria-hidden="true" />
                                {{ meta(data.status).label }}
                            </span>
                        </template>
                    </Column>
                    <Column header="Aprobó" style="min-width: 150px;">
                        <template #body="{ data }">{{ data.approved_by_name || '—' }}</template>
                    </Column>
                    <Column header="Vigencia" style="min-width: 150px;">
                        <template #body="{ data }">{{ data.expires_at ? fechaHora(data.expires_at) : '—' }}</template>
                    </Column>
                    <Column header="Acciones" style="min-width: 240px;">
                        <template #body="{ data }">
                            <div class="d-flex flex-wrap gap-1">
                                <button v-if="data.status === 'PENDIENTE' && can('fuel_requests.approve')"
                                    type="button" class="btn btn-success btn-sm" @click="aprobar(data)">
                                    <i class="fad fa-check me-1" aria-hidden="true" />Aprobar
                                </button>
                                <button v-if="data.status === 'PENDIENTE' && can('fuel_requests.reject')"
                                    type="button" class="btn btn-outline-danger btn-sm" @click="rechazar(data)">
                                    <i class="fad fa-times me-1" aria-hidden="true" />Rechazar
                                </button>
                                <button v-if="['APROBADA', 'USADA', 'VENCIDA'].includes(data.status)"
                                    type="button" class="btn btn-falcon-default btn-sm" @click="verQr(data)">
                                    <i class="fad fa-qrcode me-1" aria-hidden="true" />Ver QR
                                </button>
                                <button v-if="['PENDIENTE', 'APROBADA'].includes(data.status) && can('fuel_requests.cancel')"
                                    type="button" class="btn btn-outline-secondary btn-sm" @click="anular(data)">
                                    Anular
                                </button>
                            </div>
                        </template>
                    </Column>
                    <template #loading><NoaTableSpinner message="Cargando solicitudes..." /></template>
                </DataTable>
            </div>
        </div>
    </div>

    <!-- CREAR SOLICITUD -->
    <Dialog v-model:visible="showCreate" header="Solicitar tanqueo" modal :draggable="false"
        :style="{ width: '520px' }" :breakpoints="{ '576px': '95vw' }">
        <div class="mb-3">
            <label class="form-label required" for="f-vehicle">Vehículo</label>
            <PrimeSelect input-id="f-vehicle" v-model="vehicleUuid" :options="vehicleOptions"
                option-label="label" option-value="value" placeholder="Selecciona el vehículo"
                filter class="w-100" />
            <div v-if="!vehicleOptions.length" class="form-text text-warning">
                No tienes vehículos asignados para solicitar tanqueo.
            </div>
        </div>
        <div class="mb-3">
            <label class="form-label" for="f-notes">Observaciones</label>
            <textarea id="f-notes" v-model="notes" class="form-control" rows="3" maxlength="500"
                placeholder="Opcional: estación, ruta o novedad" />
        </div>
        <div class="d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-falcon-default" @click="showCreate = false">Cancelar</button>
            <button type="button" class="btn btn-primary" :disabled="store.loading || !vehicleUuid" @click="crear">
                <i class="fad fa-paper-plane me-1" aria-hidden="true" />Enviar solicitud
            </button>
        </div>
    </Dialog>

    <!-- QR -->
    <Dialog v-model:visible="showQr" header="QR de tanqueo" modal :draggable="false"
        :style="{ width: '760px' }" :breakpoints="{ '768px': '96vw' }">
        <div v-if="store.selected" class="row g-3 align-items-start">
            <div v-if="qrLoading || qrError" class="col-12">
                <div v-if="qrLoading" class="d-flex align-items-center gap-2 text-muted small" role="status">
                    <span class="spinner-border spinner-border-sm" aria-hidden="true" />
                    Generando QR de tanqueo...
                </div>
                <div v-else class="alert alert-warning mb-0 py-2 small" role="alert">{{ qrError }}</div>
            </div>
            <div class="col-12 col-md-5">
                <div class="border rounded p-2 text-center">
                    <small class="text-muted d-block mb-1">Validación</small>
                    <img v-if="store.qr?.qr_url" :src="store.qr.qr_url" alt="QR de validación de la solicitud"
                        class="img-fluid" style="max-width: 240px;" />
                    <p v-else class="text-muted small mb-0 py-4">QR no disponible</p>
                </div>
            </div>
            <div class="col-12 col-md-7">
                <p class="mb-1"><strong>{{ store.selected.code }}</strong></p>
                <p class="text-muted small mb-3">{{ meta(store.selected.status).label }}</p>
                <dl class="row small mb-0">
                    <dt class="col-5 text-muted">Empresa</dt>
                    <dd class="col-7">{{ store.selected.snapshot?.empresa?.nombre || '—' }}</dd>
                    <dt class="col-5 text-muted">NIT</dt>
                    <dd class="col-7">{{ store.selected.snapshot?.empresa?.nit || '—' }}</dd>
                    <dt class="col-5 text-muted">Placa</dt>
                    <dd class="col-7">{{ store.selected.snapshot?.vehiculo?.placa || store.selected.vehicle?.vehicle_license_plate }}</dd>
                    <dt class="col-5 text-muted">Marca</dt>
                    <dd class="col-7">{{ store.selected.snapshot?.vehiculo?.marca || '—' }}</dd>
                    <dt class="col-5 text-muted">Modelo</dt>
                    <dd class="col-7">{{ store.selected.snapshot?.vehiculo?.modelo || '—' }}</dd>
                    <dt class="col-5 text-muted">Clase</dt>
                    <dd class="col-7">{{ store.selected.snapshot?.vehiculo?.clase || '—' }}</dd>
                    <dt class="col-5 text-muted">Solicita</dt>
                    <dd class="col-7">{{ store.selected.snapshot?.conductor || nombreConductor(store.selected) }}</dd>
                    <dt class="col-5 text-muted">Aprueba</dt>
                    <dd class="col-7">{{ store.selected.snapshot?.aprobador || store.selected.approved_by_name || '—' }}</dd>
                    <dt class="col-5 text-muted">Vigencia</dt>
                    <dd class="col-7">{{ store.selected.snapshot?.vigencia || (store.selected.expires_at ? fechaHora(store.selected.expires_at) : '—') }}</dd>
                </dl>
            </div>
            <div class="col-12">
                <div class="border rounded p-2 text-center">
                    <small class="text-muted d-block mb-1">QR con datos (sin internet)</small>
                    <img v-if="store.qr?.qr_data" :src="store.qr.qr_data" alt="QR con los datos de la solicitud"
                        class="img-fluid" style="max-width: 230px;" />
                    <p v-else class="text-muted small mb-0 py-4">QR no disponible</p>
                </div>
            </div>
        </div>
        <div class="d-flex justify-content-end mt-3">
            <button type="button" class="btn btn-falcon-default" @click="showQr = false">Cerrar</button>
        </div>
    </Dialog>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useFuelRequestsStore } from '../store/fuelRequests.store.js';
import { useFuelManagementStore } from '../../fuelManagement/store/fuelManagement.store.js';
import { usePermissionsStore } from '@store';
import { useTable } from '@/hooks/useTable.js';
import { confirmAction } from '@/utils/confirm.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import PrimeSelect from '@/components/form/PrimeSelect.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import dateUtils from '@/utils/date.js';

const store = useFuelRequestsStore();
const fuelStore = useFuelManagementStore();
const permissionsStore = usePermissionsStore();

const isViewLoading = ref(true);
const search = ref('');
const statusFilter = ref('');
const showCreate = ref(false);
const showQr = ref(false);
const qrLoading = ref(false);
const qrError = ref('');
const vehicleUuid = ref('');
const notes = ref('');

const { debouncedSearch } = useTable({}, () => {
    store.filters.search = search.value;
    store.pagination.currentPage = 1;
    store.fetchItems();
});

const can = (action) => permissionsStore.can(action);

const vehicleOptions = computed(() => (fuelStore.catalogs.vehicles || []).map((v) => ({
    label: `${v.vehicle_license_plate ?? 'Sin placa'}${v.internal_number ? ` (${v.internal_number})` : ''}`,
    value: v.uuid,
})));

const META = {
    PENDIENTE: { label: 'Pendiente', color: 'warning', icon: 'fa-clock' },
    APROBADA: { label: 'Aprobada', color: 'success', icon: 'fa-check-circle' },
    USADA: { label: 'Usada', color: 'info', icon: 'fa-gas-pump' },
    RECHAZADA: { label: 'Rechazada', color: 'danger', icon: 'fa-times-circle' },
    VENCIDA: { label: 'Vencida', color: 'danger', icon: 'fa-hourglass-end' },
    ANULADA: { label: 'Anulada', color: 'secondary', icon: 'fa-ban' },
};
const meta = (status) => META[status] ?? META.ANULADA;

const nombreConductor = (item) => {
    const d = item.driver;
    if (!d) return item.snapshot?.conductor || '—';
    return d.company_name || [d.first_name, d.last_name].filter(Boolean).join(' ') || '—';
};
const fecha = (v) => (v ? dateUtils.format(String(v).substring(0, 10)) : '—');
const fechaHora = (v) => {
    if (!v) return '—';
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString('es-CO');
};

const refresh = () => {
    store.filters.search = search.value;
    store.filters.status = statusFilter.value;
    store.pagination.currentPage = 1;
    store.fetchItems();
};

const onPageChange = ({ first, rows }) => store.setPage(Math.floor(first / rows) + 1);

const abrirCrear = async () => {
    vehicleUuid.value = '';
    notes.value = '';
    if (!fuelStore.catalogs.vehicles.length) {
        await fuelStore.loadCatalogs();
    }
    showCreate.value = true;
};

const crear = async () => {
    if (!vehicleUuid.value) return;
    await store.createItem({ vehicle_uuid: vehicleUuid.value, notes: notes.value || null });
    showCreate.value = false;
};

const aprobar = async (item) => {
    if (!await confirmAction({ title: '¿Aprobar solicitud?', text: `Se aprobará el tanqueo de ${item.vehicle?.vehicle_license_plate}.`, confirmText: 'Sí, aprobar', icon: 'question' })) return;
    await store.approveItem(item.uuid);
};

const rechazar = async (item) => {
    if (!await confirmAction({ title: '¿Rechazar solicitud?', text: 'El conductor verá la solicitud rechazada.', confirmText: 'Sí, rechazar', icon: 'warning' })) return;
    await store.rejectItem(item.uuid, '');
};

const anular = async (item) => {
    if (!await confirmAction({ title: '¿Anular solicitud?', text: 'El QR dejará de ser válido.', confirmText: 'Sí, anular', icon: 'warning' })) return;
    await store.cancelItem(item.uuid);
};

const verQr = async (item) => {
    store.selected = item;
    store.qr = null;
    qrError.value = '';
    showQr.value = true;
    qrLoading.value = true;
    try {
        await store.loadQr(item.uuid);
        if (!store.qr) {
            qrError.value = 'La respuesta del servidor no contiene las imágenes del QR.';
        }
    } catch (error) {
        qrError.value = error?.response?.data?.message
            || 'No se pudo generar el QR. La solicitud debe estar aprobada y vigente.';
    } finally {
        qrLoading.value = false;
    }
};

onMounted(async () => {
    try {
        await store.fetchItems();
    } finally {
        isViewLoading.value = false;
    }
});
</script>

<style scoped>
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
}
</style>
