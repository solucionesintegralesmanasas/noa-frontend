<template>
    <BasePageHeader title="Listado de Contratos Laborales" description="Gestión de los contratos laborales del personal."
        icon="fad fa-file-contract text-primary" :show-refresh="true" :show-create="true" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true" :canCreate="can('employmentContracts.create')"
        :breadcrumbs="[{ label: 'Recursos Humanos' }, { label: 'Contratos Laborales' }]" @refresh="refreshTable"
        @create="goToCreate" />

    <!-- BARRA DE BÚSQUEDA -->
    <div class="card border-0 shadow-sm mb-3 fade-in-up" style="animation-delay: 0.1s;">
        <div class="bg-holder d-none d-lg-block bg-card"
            style="background-image:url(/assets/img/icons/spot-illustrations/corner-4.png);" />
        <div class="card-body position-relative py-2">
            <div class="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3 g-2 g-md-3">

                <!-- Izquierda: título + input -->
                <div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2 flex-grow-1 g-2 g-md-3">
                    <h6 class="mb-0 fw-medium text-nowrap">Búsqueda</h6>
                    <div class="input-group input-group-sm w-100" style="max-width: 420px;">
                        <span class="input-group-text bg-light border-end-0">
                            <i class="fad fa-search text-muted" />
                        </span>
                        <input v-model="searchQuery" class="form-control form-control-sm border-start-0 shadow-none"
                            type="search" placeholder="Buscar por nombre, documento, tipo o estado..."
                            aria-label="Buscar contrato" @input="debouncedSearch" />
                        <button v-if="searchQuery" class="btn btn-outline-secondary border-start-0" type="button"
                            title="Limpiar búsqueda" @click="clearSearch">
                            <i class="fad fa-times" />
                        </button>
                    </div>
                </div>

                <!-- Derecha: contador -->
                <div v-if="!isViewLoading && !store.loading" class="text-muted text-lg-end text-nowrap">
                    <small>
                        <i class="fad fa-filter me-1" />
                        {{ store.pagination.totalItems || 0 }} resultado{{ store.pagination.totalItems !== 1 ? 's' : '' }}
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

                <!-- SKELETON -->
                <div v-if="isViewLoading" class="card-body p-0">
                    <div class="table-responsive scrollbar">
                        <table class="table table-sm mb-0">
                            <thead>
                                <tr>
                                    <th v-for="w in ['25%', '15%', '20%', '15%', '15%', '10%']" :key="w"
                                        style="padding:12px 8px">
                                        <div class="skeleton-text" :style="`height:16px;width:${w}`" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="n in store.pagination.itemsPerPage" :key="`sk-${n}`">
                                    <td v-for="i in 5" :key="i">
                                        <div class="skeleton-text" style="height:18px;width:75%;" />
                                    </td>
                                    <td>
                                        <div class="d-flex justify-content-center gap-1">
                                            <div v-for="j in 3" :key="j" class="skeleton-icon"
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
                        <DataTable :value="store.items" lazy :paginator="true" :rows="store.pagination.itemsPerPage"
                            :totalRecords="store.pagination.totalItems" :first="(store.pagination.currentPage - 1) *
                                store.pagination.itemsPerPage
                                " :loading="store.loading" :rowsPerPageOptions="[10, 25, 50, 100]"
                            responsiveLayout="scroll" dataKey="uuid" tableStyle="min-width: 50rem"
                            class="table table-sm mb-0 professional-table unifont-table" :rowHover="true" stripedRows
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
                            emptyMessage="No se encontraron registros" @page="onPageChange">

                            <!-- Empleado -->
                            <Column header="Empleado" style="min-width:250px;">
                                <template #body="{ data }">
                                    <div class="d-flex align-items-center">
                                        <div class="avatar avatar-l me-2">
                                            <div class="avatar-name rounded-circle">
                                                <span>{{ getInitials(getEmployeeName(data)) }}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <h6 class="mb-0 fw-medium text-dark">{{ getEmployeeName(data) || '—' }}</h6>
                                            <small class="text-muted">Doc: <code class="text-primary small">{{
                                                getThirdParty(data)?.document_number || '—' }}</code></small>
                                        </div>
                                    </div>
                                </template>
                            </Column>

                            <!-- Tipo -->
                            <Column field="contract_type" header="Tipo Contrato" style="min-width:150px;">
                                <template #body="{ data }">
                                    <span class="badge bg-info bg-opacity-10 text-info fw-semibold">
                                        {{ data.contract_type ? data.contract_type.replace(/_/g, ' ') : '—' }}
                                    </span>
                                </template>
                            </Column>

                            <!-- Fechas -->
                            <Column header="Fechas" style="min-width:150px;">
                                <template #body="{ data }">
                                    <div class="small">
                                        <div class="text-nowrap">
                                            <i class="fad fa-play text-success me-1" style="font-size:10px;" />{{
                                                formatDate(data.start_date) || '—' }}
                                        </div>
                                        <div v-if="data.end_date" class="text-nowrap text-muted mt-1">
                                            <i class="fad fa-stop text-danger me-1" style="font-size:10px;" />{{
                                                formatDate(data.end_date) }}
                                        </div>
                                    </div>
                                </template>
                            </Column>

                            <!-- Salario -->
                            <Column field="base_salary" header="Salario Base" style="min-width:140px;">
                                <template #body="{ data }">
                                    <span class="fw-medium text-dark">{{ formatCurrency(data.base_salary) }}</span>
                                </template>
                            </Column>

                            <!-- Estado -->
                            <Column field="status" header="Estado" class="text-center" style="width: 130px;">
                                <template #body="{ data }">
                                    <span class="badge rounded-pill badge-subtle" :class="statusClass(data.status)">
                                        <i :class="statusIcon(data.status)" class="me-1" style="font-size:10px;" />
                                        {{ data.status || '—' }}
                                    </span>
                                </template>
                            </Column>

                            <!-- Acciones -->
                            <Column header="Acciones" class="text-center" style="min-width:140px; width: 140px;">
                                <template #body="{ data }">
                                    <div class="btn-group btn-group-sm" role="group">
                                        <button v-if="can('employmentContracts.show')" class="btn btn-falcon-default"
                                            type="button" title="Descargar PDF"
                                            :aria-label="`Descargar PDF de ${getEmployeeName(data)}`"
                                            @click="store.downloadPdf(data.uuid)">
                                            <i class="fad fa-file-pdf text-danger" style="font-size:14px;" />
                                        </button>
                                        <button v-if="can('employmentContracts.show')" class="btn btn-falcon-default"
                                            type="button" title="Ver detalle"
                                            :aria-label="`Ver detalle de ${getEmployeeName(data)}`"
                                            @click="goToDetail(data.uuid)">
                                            <i class="fad fa-eye text-primary" style="font-size:14px;" />
                                        </button>
                                        <button v-if="can('employmentContracts.update')" class="btn btn-falcon-default"
                                            type="button" title="Editar" :aria-label="`Editar ${getEmployeeName(data)}`"
                                            @click="goToEdit(data.uuid)">
                                            <i class="fad fa-edit text-warning" style="font-size:14px;" />
                                        </button>
                                        <button v-if="can('employmentContracts.delete')" class="btn btn-falcon-default"
                                            type="button" title="Eliminar"
                                            :aria-label="`Eliminar ${getEmployeeName(data)}`"
                                            @click="handleDelete(data)">
                                            <i class="fad fa-trash text-danger" style="font-size:14px;" />
                                        </button>
                                    </div>
                                </template>
                            </Column>

                            <!-- Loading state -->
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useEmploymentContractsStore } from '../store/employmentContracts.store.js';
import { usePermissionsStore } from '@store';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';

const router = useRouter();
const store = useEmploymentContractsStore();
const permissionsStore = usePermissionsStore();

const isViewLoading = ref(true);
const searchQuery = ref('');
let searchTimeout = null;

const can = (action) => permissionsStore.can(action);

const getThirdParty = (contract) => contract?.third_party ?? contract?.thirdParty ?? null;

const getEmployeeName = (contract) => {
    const tp = getThirdParty(contract);
    if (!tp) return '';
    const person = [tp.first_name, tp.last_name].filter(Boolean).join(' ');
    return person || tp.trade_name || tp.company_name || '';
};

const getInitials = (text) => {
    if (!text) return '?';
    const words = String(text).trim().split(/\s+/);
    return words.length === 1
        ? words[0][0].toUpperCase()
        : (words[0][0] + words[1][0]).toUpperCase();
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    return dayjs(dateString).format('DD/MM/YYYY');
};

const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '—';
    return new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(Number(value));
};

const statusClass = (status) => ({
    ACTIVO: 'badge-subtle-success',
    SUSPENDIDO: 'badge-subtle-warning',
    TERMINADO: 'badge-subtle-danger',
}[status] || 'badge-subtle-warning');

const statusIcon = (status) => ({
    ACTIVO: 'fad fa-check-circle',
    SUSPENDIDO: 'fad fa-pause-circle',
    TERMINADO: 'fad fa-times-circle',
}[status] || 'fad fa-circle');

const fetchContracts = async (page = 1) => {
    store.pagination.currentPage = page;
    store.search = searchQuery.value;
    await store.fetchItems();
};

const onPageChange = async ({ first, rows }) => {
    store.pagination.itemsPerPage = rows;
    await fetchContracts(Math.floor(first / rows) + 1);
};

const debouncedSearch = () => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        fetchContracts(1);
    }, 500);
};

const clearSearch = () => {
    searchQuery.value = '';
    fetchContracts(1);
};

const refreshTable = () => fetchContracts(1);

const goToCreate = () => router.push({ name: 'employmentContracts.create' });
const goToEdit = (uuid) => router.push({ name: 'employmentContracts.edit', params: { id: uuid } });
const goToDetail = (uuid) => router.push({ name: 'employmentContracts.show', params: { id: uuid } });

const handleDelete = async (contract) => {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: `Se eliminará el contrato permanentemente.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            await store.deleteItem(contract.uuid);
            fetchContracts(store.pagination.currentPage || 1);
        } catch (error) {
            // Error managed by global handler
        }
    }
};

onMounted(async () => {
    try {
        searchQuery.value = store.search || '';
        await fetchContracts(1);
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

.badge-subtle-warning {
    background: rgba(255, 193, 7, 0.1);
    color: #856404;
    border: 1px solid rgba(255, 193, 7, 0.2);
}

.badge-subtle-danger {
    background: rgba(220, 53, 69, 0.1);
    color: #dc3545;
    border: 1px solid rgba(220, 53, 69, 0.2);
}

.badge-subtle:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.btn-group .btn) {
    padding: 0.25rem 0.45rem;
    transition: all 150ms ease-in-out;
}

:deep(.btn-group .btn:hover) {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
    z-index: 1;
}
</style>
