<template>
    <BasePageHeader title="Solicitudes de tanqueo"
        description="Solicita, aprueba y controla el QR de tanqueo por vehículo."
        icon="fad fa-qrcode text-primary" :show-refresh="true" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true"
        :breadcrumbs="[{ label: 'Flota' }, { label: 'Solicitudes de tanqueo' }]" @refresh="refresh" />

    <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar">
            <div class="noa-search">
                <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                <input id="f-tanqueo-busqueda" v-model="search" type="search" class="noa-search__input"
                    placeholder="Código, placa o conductor..." aria-label="Buscar solicitudes de tanqueo"
                    @input="debouncedSearch" />
                <button v-if="search" class="noa-search__clear" type="button" title="Limpiar búsqueda"
                    aria-label="Limpiar búsqueda" @click="clearSearch">
                    <i class="fal fa-times" aria-hidden="true" />
                </button>
            </div>

            <div class="d-flex align-items-center gap-2">
                <select id="f-tanqueo-estado" v-model="statusFilter" class="form-select form-select-sm" style="max-width: 180px;"
                    aria-label="Filtrar por estado" @change="refresh">
                    <option value="">Todos los estados</option>
                    <option value="PENDIENTE">Pendientes</option>
                    <option value="APROBADA">Aprobadas</option>
                    <option value="USADA">Usadas</option>
                    <option value="RECHAZADA">Rechazadas</option>
                    <option value="VENCIDA">Vencidas</option>
                    <option value="ANULADA">Anuladas</option>
                </select>

                <button v-if="can('fuel_requests.create')" type="button" class="btn btn-primary btn-sm text-nowrap"
                    @click="abrirCrear">
                    <i class="fad fa-plus me-1" aria-hidden="true" />Solicitar tanqueo
                </button>
            </div>

            <span v-if="!isViewLoading && !store.loading" class="noa-results">
                <i class="fas fa-filter" aria-hidden="true" />
                {{ store.pagination.totalItems }} resultado{{ store.pagination.totalItems !== 1 ? 's' : '' }}
                <template v-if="store.filters?.search"> para "{{ store.filters.search }}"</template>
            </span>
        </div>

        <!-- SKELETON -->
        <div v-if="isViewLoading" class="card-body p-0">
            <div class="table-responsive scrollbar">
                <table class="table table-sm mb-0">
                    <thead>
                        <tr>
                            <th v-for="w in ['15%', '12%', '18%', '11%', '12%', '12%', '10%', '10%']" :key="w"
                                style="padding:12px 8px">
                                <div class="skeleton-text" :style="`height:16px;width:${w}`" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="n in store.pagination.itemsPerPage" :key="`sk-${n}`">
                            <td v-for="i in 7" :key="i">
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
                <DataTable :value="store.items" lazy :paginator="false" :rows="store.pagination.itemsPerPage"
                    :totalRecords="store.pagination.totalItems"
                    :first="(store.pagination.currentPage - 1) * store.pagination.itemsPerPage"
                    :loading="store.loading"
                    :sortField="store.sortField" :sortOrder="store.sortOrder" @sort="handleSort"
                    tableStyle="min-width: 65rem" class="table table-sm mb-0 professional-table noa-table-fixed"
                    emptyMessage="No hay solicitudes de tanqueo">
                    <Column field="code" header="Código" sortable style="width: 15%;">
                        <template #body="{ data }">
                            <span class="noa-cell-strong">{{ data.code }}</span>
                        </template>
                    </Column>
                    <Column header="Vehículo" style="width: 12%;">
                        <template #body="{ data }">
                            <span class="noa-cell-strong">{{ data.vehicle?.vehicle_license_plate || '—' }}</span>
                        </template>
                    </Column>
                    <Column header="Conductor" style="width: 18%;">
                        <template #body="{ data }">
                            <span class="text-truncate d-block" :title="nombreConductor(data)">{{ nombreConductor(data) }}</span>
                        </template>
                    </Column>
                    <Column field="requested_at" header="Solicitada" sortable style="width: 11%;">
                        <template #body="{ data }">{{ fecha(data.requested_at) }}</template>
                    </Column>
                    <Column field="status" header="Estado" sortable style="width: 12%;">
                        <template #body="{ data }">
                            <span class="noa-status" :class="statusClass(data.status)">
                                {{ meta(data.status).label }}
                            </span>
                        </template>
                    </Column>
                    <Column header="Aprobó" style="width: 12%;">
                        <template #body="{ data }">{{ data.approved_by_name || '—' }}</template>
                    </Column>
                    <Column field="expires_at" header="Vigencia" sortable style="width: 10%;">
                        <template #body="{ data }">{{ data.expires_at ? fechaHora(data.expires_at) : '—' }}</template>
                    </Column>
                    <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 10%;">
                        <template #body="{ data }">
                            <RowActions :actions="accionesDe(data)" :row-label="data.code || data.vehicle?.vehicle_license_plate || 'solicitud'" />
                        </template>
                    </Column>
                    <template #loading><NoaTableSpinner message="Cargando solicitudes..." /></template>
                </DataTable>
            </div>
            <ListPagination :page="store.pagination.currentPage" :per-page="store.pagination.itemsPerPage"
                :total="store.pagination.totalItems" @change="onPageChange" />
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
import { useRouter, useRoute } from 'vue-router';
import { useFuelRequestsStore } from '../store/fuelRequests.store.js';
import { useFuelManagementStore } from '../../fuelManagement/store/fuelManagement.store.js';
import { usePermissionsStore } from '@store';
import { useTable } from '@/hooks/useTable.js';
import { useServerSort } from '@/hooks/useServerSort.js';
import { confirmAction } from '@/utils/confirm.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import RowActions from '@/components/RowActions.vue';
import ListPagination from '@/components/ListPagination.vue';
import PrimeSelect from '@/components/form/PrimeSelect.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import dateUtils from '@/utils/date.js';

const router = useRouter();
const route = useRoute();
const store = useFuelRequestsStore();
const fuelStore = useFuelManagementStore();
const permissionsStore = usePermissionsStore();

const { handleSort } = useServerSort((field, order) => store.setSort(field, order), { route, router });

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

const statusClass = (status) => {
    if (status === 'APROBADA') return 'noa-status--success';
    if (status === 'PENDIENTE') return 'noa-status--warning';
    if (status === 'USADA') return 'noa-status--muted';
    return 'noa-status--danger';
};

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

const clearSearch = () => {
    search.value = '';
    store.filters.search = '';
    store.pagination.currentPage = 1;
    store.fetchItems();
};

const refresh = () => {
    store.filters.search = search.value;
    store.filters.status = statusFilter.value;
    store.pagination.currentPage = 1;
    store.fetchItems();
};

const onPageChange = async ({ page, first, rows }) => {
    store.pagination.itemsPerPage = rows;
    const targetPage = page !== undefined ? page : Math.floor(first / rows) + 1;
    await store.setPage(targetPage);
};

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

const accionesDe = (data) => [
    { key: 'aprobar', label: 'Aprobar', icon: 'far fa-check', tone: 'success', inline: true, visible: data.status === 'PENDIENTE' && can('fuel_requests.approve'), onClick: () => aprobar(data) },
    { key: 'rechazar', label: 'Rechazar', icon: 'far fa-times', tone: 'danger', inline: true, visible: data.status === 'PENDIENTE' && can('fuel_requests.reject'), onClick: () => rechazar(data) },
    { key: 'qr', label: 'Ver QR', icon: 'far fa-qrcode', tone: 'primary', inline: true, visible: ['APROBADA', 'USADA', 'VENCIDA'].includes(data.status), onClick: () => verQr(data) },
    { key: 'anular', label: 'Anular', icon: 'far fa-ban', tone: 'danger', visible: ['PENDIENTE', 'APROBADA'].includes(data.status) && can('fuel_requests.cancel'), onClick: () => anular(data) },
];

onMounted(async () => {
    try {
        if (route.query.sort) {
            store.sortField = String(route.query.sort);
            store.sortOrder = route.query.order === 'desc' ? -1 : 1;
        }
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
        transform: translateY(16px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
