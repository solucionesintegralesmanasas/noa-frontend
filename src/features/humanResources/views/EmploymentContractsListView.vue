<template>
    <BasePageHeader title="Listado de Contratos Laborales" description="Gestión de los contratos laborales del personal."
        icon="fad fa-file-contract text-primary" :show-refresh="true" :show-create="true" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true" :canCreate="can('employmentContracts.create')"
        :breadcrumbs="[{ label: 'Recursos Humanos' }, { label: 'Contratos Laborales' }]" @refresh="refreshTable"
        @create="goToCreate" />

    <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar">
            <div class="noa-search">
                <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                <input id="f-contracts-busqueda" v-model="searchQuery" class="noa-search__input" type="search"
                    placeholder="Buscar por nombre, documento, tipo o estado..."
                    aria-label="Buscar contrato" @input="debouncedSearch" />
                <button v-if="searchQuery" class="noa-search__clear" type="button"
                    title="Limpiar búsqueda" aria-label="Limpiar búsqueda" @click="clearSearch">
                    <i class="fal fa-times" aria-hidden="true" />
                </button>
            </div>

            <span v-if="!isViewLoading && !store.loading" class="noa-results">
                <i class="fas fa-filter" aria-hidden="true" />
                {{ store.pagination.totalItems || 0 }} resultado{{ store.pagination.totalItems !== 1 ? 's' : '' }}
                <template v-if="store.search"> para "{{ store.search }}"</template>
            </span>
        </div>

        <!-- SKELETON -->
        <div v-if="isViewLoading" class="card-body p-0">
            <div class="table-responsive scrollbar">
                <table class="table table-sm mb-0">
                    <thead>
                        <tr>
                            <th v-for="w in ['30%', '18%', '16%', '14%', '10%', '12%']" :key="w" style="padding:12px 8px">
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
                                <div class="d-flex justify-content-end gap-1">
                                    <div v-for="j in 2" :key="j" class="skeleton-icon" style="height:28px;width:28px;" />
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
                    :loading="store.loading" responsiveLayout="scroll" dataKey="uuid"
                    tableStyle="min-width: 50rem" class="table table-sm mb-0 professional-table noa-table-fixed"
                    emptyMessage="No se encontraron registros"
                    :sortField="sortField" :sortOrder="sortOrdenPrimeVue" removableSort @sort="onSort">

                    <!-- Empleado -->
                    <Column header="Empleado" style="width: 30%;">
                        <template #body="{ data }">
                            <div class="d-flex align-items-center">
                                <div class="avatar-placeholder bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-2 flex-shrink-0">
                                    <span>{{ getInitials(getEmployeeName(data)) }}</span>
                                </div>
                                <div class="min-w-0">
                                    <span class="noa-cell-strong d-block text-truncate">{{ getEmployeeName(data) || '—' }}</span>
                                    <span class="noa-cell-sub">
                                        Doc: {{ getThirdParty(data)?.document_number || '—' }}
                                    </span>
                                </div>
                            </div>
                        </template>
                    </Column>

                    <!-- Tipo -->
                    <Column field="contract_type" header="Tipo Contrato" sortable style="width: 18%;">
                        <template #body="{ data }">
                            <span class="text-dark">
                                {{ data.contract_type ? data.contract_type.replace(/_/g, ' ') : '—' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Fechas -->
                    <Column header="Fechas" style="width: 16%;">
                        <template #body="{ data }">
                            <div class="small">
                                <div class="text-nowrap text-dark">
                                    <i class="fad fa-play text-success me-1" style="font-size:10px;" aria-hidden="true" />
                                    {{ formatDate(data.start_date) || '—' }}
                                </div>
                                <div v-if="data.end_date" class="text-nowrap text-muted mt-1">
                                    <i class="fad fa-stop text-danger me-1" style="font-size:10px;" aria-hidden="true" />
                                    {{ formatDate(data.end_date) }}
                                </div>
                            </div>
                        </template>
                    </Column>

                    <!-- Salario -->
                    <Column field="base_salary" header="Salario Base" sortable style="width: 14%;">
                        <template #body="{ data }">
                            <span class="fw-medium text-dark">{{ formatCurrency(data.base_salary) }}</span>
                        </template>
                    </Column>

                    <!-- Estado -->
                    <Column field="status" header="Estado" sortable class="text-center" header-class="text-center" style="width: 10%;">
                        <template #body="{ data }">
                            <span class="noa-status" :class="statusModifier(data.status)">
                                {{ data.status || '—' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Acciones -->
                    <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 12%;"
                        v-if="can('employmentContracts.show') || can('employmentContracts.update') || can('employmentContracts.delete')">
                        <template #body="{ data }">
                            <RowActions :actions="accionesDe(data)" :row-label="getEmployeeName(data) || 'contrato'" />
                        </template>
                    </Column>

                    <template #empty>
                        <div class="text-center py-5">
                            <i class="fad fa-file-contract fs-1 text-muted opacity-50 mb-3 d-block" aria-hidden="true" />
                            <h6 class="text-muted mb-1 fw-medium">No hay contratos registrados</h6>
                            <p class="text-muted small mb-3">Comienza creando el primer contrato laboral.</p>
                            <button v-if="can('employmentContracts.create')" class="btn btn-primary btn-sm" type="button" @click="goToCreate">
                                <i class="fad fa-plus me-1" aria-hidden="true" />Nuevo contrato
                            </button>
                        </div>
                    </template>

                    <!-- Loading state -->
                    <template #loading>
                        <NoaTableSpinner message="Cargando contratos..." />
                    </template>
                </DataTable>
            </div>
            <ListPagination :page="store.pagination.currentPage" :per-page="store.pagination.itemsPerPage"
                :total="store.pagination.totalItems" @change="onPageChange" />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEmploymentContractsStore } from '../store/employmentContracts.store.js';
import { usePermissionsStore } from '@store';
import { useServerSort } from '@/hooks/useServerSort.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import RowActions from '@/components/RowActions.vue';
import ListPagination from '@/components/ListPagination.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';

const route = useRoute();
const router = useRouter();
const store = useEmploymentContractsStore();
const permissionsStore = usePermissionsStore();
const { sortField, sortOrdenPrimeVue, onSort, restore } = useServerSort({
    onChange: ({ field, order }) => store.setSort(field, order),
});

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

const statusModifier = (status) => {
    switch (status) {
        case 'ACTIVO':
            return 'noa-status--success';
        case 'SUSPENDIDO':
            return 'noa-status--warning';
        case 'TERMINADO':
            return 'noa-status--danger';
        default:
            return 'noa-status--muted';
    }
};

const fetchContracts = async (page = 1) => {
    store.pagination.currentPage = page;
    store.search = searchQuery.value;
    await store.fetchItems();
};

const onPageChange = async ({ page, first, rows }) => {
    store.pagination.itemsPerPage = rows;
    const targetPage = page !== undefined ? page : Math.floor(first / rows) + 1;
    await fetchContracts(targetPage);
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
        text: 'Se eliminará el contrato permanentemente.',
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
        } catch {
            // Error managed by global handler
        }
    }
};

const accionesDe = (data) => [
    {
        key: 'pdf',
        label: 'Descargar PDF',
        icon: 'far fa-file-pdf',
        tone: 'danger',
        inline: true,
        visible: can('employmentContracts.show'),
        onClick: () => store.downloadPdf(data.uuid),
    },
    {
        key: 'ver',
        label: 'Ver detalle',
        icon: 'far fa-eye',
        tone: 'primary',
        inline: true,
        visible: can('employmentContracts.show'),
        onClick: () => goToDetail(data.uuid),
    },
    {
        key: 'editar',
        label: 'Editar',
        icon: 'far fa-pen',
        tone: 'warning',
        visible: can('employmentContracts.update'),
        onClick: () => goToEdit(data.uuid),
    },
    {
        key: 'eliminar',
        label: 'Eliminar',
        icon: 'far fa-trash-alt',
        tone: 'danger',
        visible: can('employmentContracts.delete'),
        onClick: () => handleDelete(data),
    },
];

onMounted(async () => {
    const sortParam = route.query.sort;
    const orderParam = route.query.order;
    if (typeof sortParam === 'string' && sortParam) {
        restore(sortParam, orderParam);
        store.sortField = sortParam;
        store.sortOrder = orderParam === 'desc' ? 'desc' : 'asc';
    }
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

.avatar-placeholder {
    width: 32px;
    height: 32px;
    font-size: 13px;
    font-weight: 600;
}

.min-w-0 {
    min-width: 0;
}
</style>
