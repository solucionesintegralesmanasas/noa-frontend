<template>
    <BasePageHeader :title="'Cobros - Cuota de Administración'" description="Gestión y control de pagos de vehículos"
        icon="fad fa-file-invoice-dollar text-primary" :show-refresh="true" :show-create="true" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true"
        :breadcrumbs="[{ label: 'Financiero' }, { label: 'Cobros' }]" @refresh="refreshTable" @create="goToCreate" />

    <!-- RESUMEN / MÉTRICAS -->
    <div class="row g-3 mb-3 fade-in-up" style="animation-delay: 0.05s;">
        <div class="col-12 col-sm-6 col-md-3">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <div class="bg-primary bg-opacity-10 rounded-circle p-2">
                            <i class="fad fa-file-invoice-dollar text-primary" aria-hidden="true"></i>
                        </div>
                        <span class="badge badge-subtle-primary">Total</span>
                    </div>
                    <h4 class="mb-1 fw-bold">{{ formatCurrency(summary.totals.general) }}</h4>
                    <p class="text-muted small mb-0">Cobros registrados (Página actual)</p>
                </div>
            </div>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
            <div class="card border-0 shadow-sm h-100 border-start border-warning border-4">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <div class="bg-warning bg-opacity-10 rounded-circle p-2">
                            <i class="fad fa-hourglass-half text-warning" aria-hidden="true"></i>
                        </div>
                        <span class="badge badge-subtle-warning">Pendiente</span>
                    </div>
                    <h4 class="mb-1 fw-bold text-warning">{{ formatCurrency(summary.totals.pending) }}</h4>
                    <p class="text-muted small mb-0">Por recaudar</p>
                </div>
            </div>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
            <div class="card border-0 shadow-sm h-100 border-start border-success border-4">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <div class="bg-success bg-opacity-10 rounded-circle p-2">
                            <i class="fad fa-check-circle text-success" aria-hidden="true"></i>
                        </div>
                        <span class="badge badge-subtle-success">Pagado</span>
                    </div>
                    <h4 class="mb-1 fw-bold text-success">{{ formatCurrency(summary.totals.paid) }}</h4>
                    <p class="text-muted small mb-0">Total recaudado</p>
                </div>
            </div>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
            <div class="card border-0 shadow-sm h-100 border-start border-danger border-4">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <div class="bg-danger bg-opacity-10 rounded-circle p-2">
                            <i class="fad fa-exclamation-triangle text-danger" aria-hidden="true"></i>
                        </div>
                        <span class="badge badge-subtle-danger">Mora / Vencido</span>
                    </div>
                    <h4 class="mb-1 fw-bold text-danger">{{ formatCurrency(summary.totals.overdue) }}</h4>
                    <p class="text-muted small mb-0">Vencido y en mora</p>
                </div>
            </div>
        </div>
    </div>

    <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar">
            <div class="noa-search">
                <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                <input id="f-charges-busqueda" v-model="searchQuery" class="noa-search__input" type="search"
                    placeholder="Buscar por concepto, vehículo o referencia..."
                    aria-label="Buscar cobro" @input="debouncedSearch" />
                <button v-if="searchQuery" class="noa-search__clear" type="button"
                    title="Limpiar búsqueda" aria-label="Limpiar búsqueda" @click="clearSearch">
                    <i class="fal fa-times" aria-hidden="true" />
                </button>
            </div>

            <span v-if="!isViewLoading && !store.loading" class="noa-results">
                <i class="fas fa-filter" aria-hidden="true" />
                {{ store.pagination.totalItems }} resultado{{ store.pagination.totalItems !== 1 ? 's' : '' }}
                <template v-if="store.search"> para "{{ store.search }}"</template>
            </span>
        </div>

        <!-- SKELETON -->
        <div v-if="isViewLoading" class="card-body p-0">
            <div class="table-responsive scrollbar">
                <table class="table table-sm mb-0">
                    <thead>
                        <tr>
                            <th v-for="w in ['18%', '16%', '14%', '13%', '13%', '12%', '14%']" :key="w" style="padding:12px 8px">
                                <div class="skeleton-text" :style="`height:16px;width:${w}`" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="n in store.pagination.itemsPerPage" :key="`sk-${n}`">
                            <td v-for="j in 6" :key="j">
                                <div class="skeleton-text" style="height:18px;width:75%;" />
                            </td>
                            <td>
                                <div class="d-flex justify-content-end gap-1">
                                    <div v-for="k in 2" :key="k" class="skeleton-icon" style="height:28px;width:28px;" />
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
                    :loading="store.loading" responsiveLayout="scroll"
                    tableStyle="min-width: 60rem" class="table table-sm mb-0 professional-table noa-table-fixed"
                    emptyMessage="No se encontraron registros"
                    :sortField="sortField" :sortOrder="sortOrdenPrimeVue" removableSort @sort="onSort">

                    <!-- Vehículo -->
                    <Column field="vehicle.vehicle_license_plate" header="Vehículo" sortable style="width: 18%;">
                        <template #body="{ data }">
                            <div class="d-flex align-items-center">
                                <div class="bg-primary bg-opacity-10 rounded p-1 me-2 flex-shrink-0">
                                    <i class="fad fa-steering-wheel text-primary" style="font-size: 12px;" aria-hidden="true"></i>
                                </div>
                                <div class="min-w-0">
                                    <span class="noa-cell-strong d-block text-truncate">
                                        {{ data.vehicle?.vehicle_license_plate || getVehiclePlate(data.vehicle_uuid) || '—' }}
                                    </span>
                                    <span class="noa-cell-sub">
                                        Ref: {{ data.payment_reference || '—' }}
                                        <template v-if="data.bank_reference"> | {{ data.bank_reference }}</template>
                                    </span>
                                </div>
                            </div>
                        </template>
                    </Column>

                    <!-- Tipo de Cobro -->
                    <Column field="charge_type" header="Tipo de Cobro" sortable style="width: 16%;">
                        <template #body="{ data }">
                            <span class="noa-cell-strong">{{ formatChargeType(data.charge_type) }}</span>
                            <span class="noa-cell-sub text-truncate">{{ data.concept || '—' }}</span>
                        </template>
                    </Column>

                    <!-- Monto -->
                    <Column field="amount" header="Monto" sortable style="width: 14%;">
                        <template #body="{ data }">
                            <span class="fw-bold text-success">{{ formatCurrency(data.amount) }}</span>
                        </template>
                    </Column>

                    <!-- Período -->
                    <Column field="period_date" header="Período" sortable style="width: 13%;">
                        <template #body="{ data }">
                            <span class="text-muted">
                                <i class="fad fa-calendar-alt me-1 opacity-50" aria-hidden="true"></i>
                                {{ formatDate(data.period_date) }}
                            </span>
                        </template>
                    </Column>

                    <!-- Vencimiento -->
                    <Column field="due_date" header="Vencimiento" sortable style="width: 13%;">
                        <template #body="{ data }">
                            <span :class="isPastDue(data.due_date, data.status) ? 'text-danger fw-semibold' : 'text-muted'">
                                <i class="fad fa-calendar-times me-1 opacity-50" aria-hidden="true"></i>
                                {{ formatDate(data.due_date) }}
                            </span>
                        </template>
                    </Column>

                    <!-- Estado -->
                    <Column field="status" header="Estado" sortable style="width: 12%;" class="text-center" header-class="text-center">
                        <template #body="{ data }">
                            <span class="noa-status" :class="statusModifier(data.status)">
                                {{ formatStatus(data.status) }}
                            </span>
                        </template>
                    </Column>

                    <!-- Acciones -->
                    <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 14%;">
                        <template #body="{ data }">
                            <RowActions :actions="accionesDe(data)" :row-label="data.payment_reference || 'cobro'" />
                        </template>
                    </Column>

                    <template #empty>
                        <div class="text-center py-5">
                            <i class="fad fa-file-invoice-dollar fs-1 text-muted opacity-50 mb-3 d-block" aria-hidden="true"></i>
                            <h6 class="text-muted mb-1 fw-medium">No hay cobros registrados</h6>
                            <p class="text-muted small mb-3">
                                {{ searchQuery ? 'Sin coincidencias para "' + searchQuery + '"' : 'Comienza agregando el primer cobro al sistema' }}
                            </p>
                            <button v-if="!searchQuery && can('affiliate_admin_charges.create')" class="btn btn-primary btn-sm" @click="goToCreate">
                                <i class="fad fa-plus me-1" aria-hidden="true"></i>Registrar Cobro
                            </button>
                            <button v-else-if="searchQuery" class="btn btn-outline-secondary btn-sm" @click="clearSearch">
                                <i class="fad fa-eraser me-1" aria-hidden="true"></i>Limpiar búsqueda
                            </button>
                        </div>
                    </template>

                    <template #loading>
                        <NoaTableSpinner message="Cargando cobros..." />
                    </template>
                </DataTable>
            </div>
            <ListPagination :page="store.pagination.currentPage" :per-page="store.pagination.itemsPerPage"
                :total="store.pagination.totalItems" @change="onPageChange" />
        </div>
    </div>

    <!-- MODAL DE HISTORIAL -->
    <div class="modal fade" id="historyModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down">
            <div class="modal-content border-0 shadow-lg">
                <div class="modal-header bg-light py-2">
                    <h5 class="modal-title fw-bold fs-9 text-dark">
                        <i class="fad fa-history text-info me-2" aria-hidden="true"></i>Historial de Pagos: {{ historyVehicle }}
                    </h5>
                    <button type="button" class="btn-close shadow-none" data-bs-dismiss="modal"
                        aria-label="Cerrar"></button>
                </div>
                <div class="modal-body p-0">
                    <div class="table-responsive scrollbar">
                        <table class="table table-sm mb-0 fs-10 professional-table">
                            <thead class="bg-light">
                                <tr>
                                    <th class="py-2 ps-3">Periodo</th>
                                    <th class="py-2">Concepto</th>
                                    <th class="py-2">Monto</th>
                                    <th class="py-2 text-center">Estado</th>
                                    <th class="py-2">Fecha Pago</th>
                                    <th class="py-2 pe-3 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in historyItems" :key="item.uuid" class="align-middle">
                                    <td class="ps-3 fw-medium">{{ formatDate(item.period_date) }}</td>
                                    <td>
                                        <span class="text-muted d-block small">{{ formatChargeType(item.charge_type) }}</span>
                                        {{ item.concept }}
                                    </td>
                                    <td class="fw-bold text-success">{{ formatCurrency(item.amount) }}</td>
                                    <td class="text-center">
                                        <span class="noa-status" :class="statusModifier(item.status)">
                                            {{ formatStatus(item.status) }}
                                        </span>
                                    </td>
                                    <td class="text-muted">{{ item.payment_date ? formatDate(item.payment_date) : '-' }}</td>
                                    <td class="pe-3 text-center">
                                        <button v-if="can('affiliate_admin_charges.update') && !['PAGADO', 'ANULADO'].includes(item.status)"
                                            class="btn btn-falcon-success btn-sm py-0 px-2 rounded me-1"
                                            @click="handlePayFromHistory(item)"
                                            title="Pagar Mensualidad">
                                            <i class="fad fa-hand-holding-usd text-success me-1" aria-hidden="true"></i> Pagar
                                        </button>

                                        <button v-if="['PAGADO', 'PENDIENTE'].includes(item.status)" class="btn btn-falcon-default btn-sm py-0 px-2 rounded" @click="handleDownloadReceipt(item.uuid)" title="Descargar Recibo">
                                            <i class="fad fa-file-pdf text-danger me-1" aria-hidden="true"></i>Recibo
                                        </button>

                                        <span v-if="item.status === 'PAGADO'" class="badge bg-light text-success border shadow-none ms-1" style="font-weight: 500;">
                                            <i class="fad fa-check-double me-1" aria-hidden="true"></i>Ref: {{ item.bank_reference || 'N/A' }}
                                        </span>
                                        <span v-if="!['PAGADO', 'PENDIENTE'].includes(item.status) && !can('affiliate_admin_charges.update')" class="text-muted small">-</span>
                                    </td>
                                </tr>
                                <tr v-if="historyItems.length === 0">
                                    <td colspan="6" class="text-center py-4 text-muted fst-italic">
                                        No hay cobros registrados para este vehículo.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer bg-light py-2">
                    <button type="button" class="btn btn-falcon-default btn-sm px-4"
                        data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useServerSort } from '@/hooks/useServerSort.js';
import { useAffiliateAdminChargesStore } from '../store/affiliateCharges.store.js';
import { usePermissionsStore } from '@store';
import { useTable } from '@/hooks/useTable.js';
import { useTableActions } from '@/hooks/useTableActions.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import RowActions from '@/components/RowActions.vue';
import ListPagination from '@/components/ListPagination.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';

const router = useRouter();
const route = useRoute();
const store = useAffiliateAdminChargesStore();
const permissionsStore = usePermissionsStore();

const isViewLoading = ref(true);
const searchQuery = ref('');

const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(searchQuery.value));
const { confirmDelete } = useTableActions(store, router);
const { sortField, sortOrdenPrimeVue, onSort, restore } = useServerSort({
    onChange: ({ field, order }) => store.setSort(field, order),
});

const can = (action) => permissionsStore.can(action);

const clearSearch = async () => {
    searchQuery.value = '';
    await store.setGlobalFilter('');
};

const refreshTable = async () => {
    await store.fetchItems();
};

const onPageChange = async ({ page, first, rows }) => {
    store.pagination.itemsPerPage = rows;
    const targetPage = page !== undefined ? page : Math.floor(first / rows) + 1;
    await store.setPage(targetPage);
};

// Navegación
const goToCreate = () => router.push('/pagos-de-administracion/crear');
const goToEdit = (uuid) => router.push(`/pagos-de-administracion/editar/${uuid}`);
const goToDetail = (uuid) => router.push(`/pagos-de-administracion/perfil/${uuid}`);

const handleDelete = (item) => confirmDelete(item, {
    title: '¿Eliminar cargo?',
    nameField: 'payment_reference',
});

const handleDownloadReceipt = async (uuid) => {
    await store.downloadReceipt(uuid);
};

const historyItems = ref([]);
const historyVehicle = ref('');
let activeHistoryRef = null;

const viewVehicleHistory = async (item) => {
    const reference = item.payment_reference;
    if (!reference) return;

    activeHistoryRef = reference;
    historyVehicle.value = item.vehicle?.vehicle_license_plate || getVehiclePlate(item.vehicle_uuid) || '-';
    const data = await store.fetchPaymentHistory(reference);
    historyItems.value = data;

    const modalEl = document.getElementById('historyModal');
    if (modalEl) {
        const modal = new window.bootstrap.Modal(modalEl);
        modal.show();
    }
};

const handlePayFromHistory = async (item) => {
    const modalEl = document.getElementById('historyModal');
    if (modalEl) {
        const modalInstance = window.bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) {
            modalInstance.hide();
        }
    }
    await handlePay(item, true);
};

const handlePay = async (item, fromHistory = false) => {
    const { value: formValues } = await Swal.fire({
        title: 'Registrar Pago',
        html: `
            <div class="alert alert-success bg-success-subtle text-success py-2 fs-9 mb-3 text-start border-0">
                <i class="fad fa-info-circle me-1"></i> <strong>Ref. Pago (Cuenta):</strong> ${item.payment_reference || 'N/A'}<br>
                <i class="fad fa-file-invoice me-1"></i> <strong>Concepto:</strong> ${item.concept || 'N/A'}
            </div>
            <div class="text-start mb-3">
                <label class="form-label fw-medium" style="font-size: 0.85rem;">Fecha de Pago</label>
                <input id="swal-payment-date" class="form-control" type="date" placeholder="YYYY-MM-DD" value="${dayjs().format('YYYY-MM-DD')}">
            </div>
            <div class="text-start mb-3">
                <label class="form-label fw-medium" style="font-size: 0.85rem;">Método de Pago</label>
                <select id="swal-payment-method" class="form-select form-select-sm w-100">
                    <option value="EFECTIVO" selected>Efectivo</option>
                    <option value="TRANSFERENCIA">Transferencia / Consignación</option>
                    <option value="TARJETA">Tarjeta</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CORTESIA">Cortesía</option>
                    <option value="OTRO">Otro</option>
                </select>
            </div>
            <div class="text-start mb-3">
                <label class="form-label fw-medium" style="font-size: 0.85rem;">Referencia Bancaria <span class="text-muted">(Opcional)</span></label>
                <input id="swal-bank-ref" class="form-control form-control-sm" type="text" autocomplete="off" placeholder="Ej. Transacción #12345">
            </div>
            <div class="text-start">
                <label class="form-label fw-medium" style="font-size: 0.85rem;">Notas <span class="text-muted">(Opcional)</span></label>
                <textarea id="swal-notes" class="form-control form-control-sm" rows="2" placeholder="Comentarios adicionales..."></textarea>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: '<i class="fad fa-check-circle me-1"></i> Procesar Pago',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#00d27a',
        cancelButtonColor: '#6c757d',
        preConfirm: () => {
            const payment_date = document.getElementById('swal-payment-date').value;
            if (!payment_date) {
                Swal.showValidationMessage('La fecha de pago es obligatoria');
                return false;
            }
            return {
                payment_date,
                payment_method: document.getElementById('swal-payment-method').value,
                bank_reference: document.getElementById('swal-bank-ref').value,
                notes: document.getElementById('swal-notes').value
            };
        }
    });

    if (formValues) {
        await store.applyMonthlyPayment(item.uuid, formValues);
        
        if (item.payment_reference) {
            searchQuery.value = item.payment_reference;
            await store.setGlobalFilter(item.payment_reference);
        }

        await handleDownloadReceipt(item.uuid);

        if (fromHistory && activeHistoryRef) {
            const data = await store.fetchPaymentHistory(activeHistoryRef);
            historyItems.value = data;
            setTimeout(() => {
                const modalEl = document.getElementById('historyModal');
                if (modalEl) {
                    const modal = new window.bootstrap.Modal(modalEl);
                    modal.show();
                }
            }, 600);
        }
    } else {
        if (fromHistory && activeHistoryRef) {
            const modalEl = document.getElementById('historyModal');
            if (modalEl) {
                const modal = new window.bootstrap.Modal(modalEl);
                modal.show();
            }
        }
    }
};

const getVehiclePlate = (uuid) => {
    if (!uuid || !store.catalogs?.vehicles) return '';
    const vehicle = store.catalogs.vehicles.find(v => v.uuid === uuid);
    return vehicle ? vehicle.vehicle_license_plate : '';
};

const summary = computed(() => {
    const items = store.items || [];
    let general = 0, pending = 0, paid = 0, overdue = 0;
    
    items.forEach(item => {
        const amount = parseFloat(item.amount || 0);
        general += amount;
        if (item.status === 'PAGADO') paid += amount;
        else if (item.status === 'PENDIENTE') pending += amount;
        else if (item.status === 'VENCIDO' || item.status === 'EN_MORA') overdue += amount;
    });

    return {
        totals: { general, pending, paid, overdue }
    };
});

const formatChargeType = (value) => {
    const map = {
        'CUOTA_ADMINISTRACION': 'Administración',
        'PAGO_MENSUALIDAD': 'Pago Mensualidad',
        'PAGO_CUPO': 'Pago de Cupo',
        'SEGURO_VEHICULO': 'Seguro Vehículo',
        'GPS': 'GPS',
        'MANTENIMIENTO': 'Mantenimiento',
        'MULTA': 'Multa',
        'OTRO': 'Otro'
    };
    return map[value] || value;
};

const formatStatus = (value) => {
    const map = {
        'PENDIENTE': 'Pendiente',
        'PAGADO': 'Pagado',
        'VENCIDO': 'Vencido',
        'EN_MORA': 'En Mora',
        'ANULADO': 'Anulado'
    };
    return map[value] || value;
};

const statusModifier = (status) => {
    switch (status) {
        case 'PAGADO':
            return 'noa-status--success';
        case 'PENDIENTE':
            return 'noa-status--warning';
        case 'VENCIDO':
        case 'EN_MORA':
        case 'ANULADO':
            return 'noa-status--danger';
        default:
            return 'noa-status--muted';
    }
};

const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(value);
};

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return dayjs(dateStr).format('DD/MM/YYYY');
};

const isPastDue = (dueDate, status) => {
    if (!dueDate || status === 'PAGADO') return false;
    const today = dayjs().startOf('day');
    const dateToCompare = dayjs(dueDate).startOf('day');
    return dateToCompare.isBefore(today);
};

const accionesDe = (data) => [
    {
        key: 'pagar',
        label: 'Pagar mensualidad',
        icon: 'far fa-hand-holding-usd',
        tone: 'success',
        inline: true,
        visible: can('affiliate_admin_charges.update') && !['PAGADO', 'ANULADO'].includes(data.status),
        onClick: () => handlePay(data),
    },
    {
        key: 'recibo',
        label: 'Descargar recibo',
        icon: 'far fa-file-pdf',
        tone: 'danger',
        inline: true,
        visible: ['PAGADO', 'PENDIENTE'].includes(data.status),
        onClick: () => handleDownloadReceipt(data.uuid),
    },
    {
        key: 'historial',
        label: 'Historial de vehículo',
        icon: 'far fa-history',
        tone: 'info',
        visible: can('affiliate_admin_charges.profile'),
        onClick: () => viewVehicleHistory(data),
    },
    {
        key: 'ver',
        label: 'Ver detalle',
        icon: 'far fa-eye',
        tone: 'primary',
        visible: can('affiliate_admin_charges.profile'),
        onClick: () => goToDetail(data.uuid),
    },
    {
        key: 'editar',
        label: 'Editar',
        icon: 'far fa-pen',
        tone: 'warning',
        visible: can('affiliate_admin_charges.update'),
        onClick: () => goToEdit(data.uuid),
    },
    {
        key: 'eliminar',
        label: 'Eliminar',
        icon: 'far fa-trash-alt',
        tone: 'danger',
        visible: can('affiliate_admin_charges.delete'),
        onClick: () => handleDelete(data),
    },
];

watch(
    () => [store.search, store.pagination.currentPage, store.pagination.itemsPerPage, store.sortField, store.sortOrder],
    ([newSearch, newPage, newPerPage, newSort, newOrder]) => {
        router.replace({
            query: {
                ...route.query,
                search: newSearch || undefined,
                page: newPage > 1 ? newPage : undefined,
                per_page: newPerPage !== 10 ? newPerPage : undefined,
                sort: newSort || undefined,
                order: newSort ? (newOrder || 'asc') : undefined,
            },
        });
    }
);

onMounted(async () => {
    isViewLoading.value = true;
    try {
        const queryPage = route.query.page ? parseInt(route.query.page, 10) : 1;
        const queryPerPage = route.query.per_page ? parseInt(route.query.per_page, 10) : 10;
        const querySearch = route.query.search || '';
        const querySort = typeof route.query.sort === 'string' && route.query.sort ? route.query.sort : null;
        const queryOrder = route.query.order === 'desc' ? 'desc' : 'asc';

        store.search = querySearch;
        store.pagination.currentPage = queryPage;
        store.pagination.itemsPerPage = queryPerPage;
        store.sortField = querySort;
        store.sortOrder = querySort ? queryOrder : null;
        restore(querySort, querySort ? queryOrder : null);

        searchQuery.value = querySearch;
        await Promise.all([store.loadCatalogs(), store.fetchItems()]);
    } catch (error) {
        console.error("Error al cargar cobros:", error);
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
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.min-w-0 {
    min-width: 0;
}
</style>