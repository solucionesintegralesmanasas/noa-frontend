<template>
    <!-- VISTA ESCRITORIO / TABLET -->
    <div class="d-none d-md-block">
        <BasePageHeader :title="'Listado de Fuec'" description="Gestión del módulo en el sistema."
            icon="fad fa-clipboard-list text-primary" :show-refresh="true" :show-create="can('fuec.create')" :show-bg="true"
            :loading="isViewLoading || store.loading" :compact="true"
            :breadcrumbs="[{ label: 'Fuec' }, { label: 'Listado' }]" @refresh="refreshTable" @create="goToCreate" />

        <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
        <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
            <div class="noa-list-toolbar">
                <div class="noa-search">
                    <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                    <input id="f-fuec-busqueda" v-model="searchQuery" class="noa-search__input" type="search" placeholder="Buscar por número de FUEC, placa, contratante..."
                        aria-label="Buscar FUEC" @input="debouncedSearch" />
                    <button v-if="searchQuery" class="noa-search__clear" type="button" title="Limpiar búsqueda"
                        aria-label="Limpiar búsqueda" @click="clearSearch">
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
                                <th v-for="w in ['14%', '12%', '20%', '13%', '14%', '14%', '11%', '12%']" :key="w"
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
                        :totalRecords="store.pagination.totalItems" :first="(store.pagination.currentPage - 1) *
                            store.pagination.itemsPerPage
                            " :loading="store.loading"
                        responsiveLayout="scroll" tableStyle="min-width: 60rem"
                        class="table table-sm mb-0 professional-table noa-table-fixed"
                        emptyMessage="No se encontraron registros"
                        :sortField="store.sortField" :sortOrder="store.sortOrder" @sort="handleSort">
                        <Column field="number_fuec" header="N° FUEC" sortable style="width: 14%;">
                            <template #body="{ data }">
                                <span class="noa-cell-strong">{{ data.number_fuec || '-' }}</span>
                            </template>
                        </Column>

                        <Column field="vehicle_plate" header="Placa" sortable style="width: 12%;">
                            <template #body="{ data }">
                                <span class="noa-cell-strong">{{ data.vehicle?.vehicle_license_plate || data.vehicle_license_plate || '-' }}</span>
                            </template>
                        </Column>

                        <Column field="contractor_display" header="Contratante" style="width: 20%;">
                            <template #body="{ data }">
                                <span class="noa-cell-strong d-block">{{ data.contractor?.company_name || '-' }}</span>
                                <span class="noa-cell-sub">Doc: {{ data.contractor?.document_number || '-' }}</span>
                            </template>
                        </Column>

                        <Column field="issue_date" header="Fecha Expedición" sortable style="width: 13%;">
                            <template #body="{ data }">
                                <span class="text-dark">{{ dateUtils.format(data.issue_date) }}</span>
                            </template>
                        </Column>

                        <Column field="origin_route" header="Origen" sortable style="width: 14%;">
                            <template #body="{ data }">
                                <span class="text-truncate d-block" :title="data.origin_route">{{ data.origin_route || '-' }}</span>
                            </template>
                        </Column>

                        <Column field="destination_route" header="Destino" sortable style="width: 14%;">
                            <template #body="{ data }">
                                <span class="text-truncate d-block" :title="data.destination_route">{{ data.destination_route || '-' }}</span>
                            </template>
                        </Column>

                        <Column field="status" header="Estado" sortable style="width: 11%;">
                            <template #body="{ data }">
                                <span class="noa-status" :class="{
                                    'noa-status--success': data.status === 'ACTIVO',
                                    'noa-status--warning': data.status === 'CERRADO',
                                    'noa-status--danger': data.status === 'ANULADO',
                                    'noa-status--muted': !['ACTIVO', 'CERRADO', 'ANULADO'].includes(data.status)
                                }">
                                    {{ data.status || 'N/A' }}
                                </span>
                            </template>
                        </Column>

                        <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 12%;">
                            <template #body="{ data }">
                                <RowActions :actions="accionesDe(data)" :row-label="data.number_fuec || data.vehicle?.vehicle_license_plate || 'FUEC'" />
                            </template>
                        </Column>
                        <!-- Loading state -->
                        <template #loading>
                            <NoaTableSpinner message="Cargando datos..." />
                        </template>
                    </DataTable>
                </div>
                <ListPagination :page="store.pagination.currentPage" :per-page="store.pagination.itemsPerPage"
                    :total="store.pagination.totalItems" @change="onPageChange" />
            </div>
        </div>
    </div>

    <!-- VISTA MÓVIL ANDROID CAPACITOR (Pantalla completa de borde a borde) -->
    <div class="d-md-none w-100 px-1 pt-1 pb-3 mobile-fuec-feed">
        <MobileSectionHeader
            title="Extractos de Contrato (FUEC)"
            icon-class="fas fa-file-contract"
            icon-bg="#22c55e"
            :badge="store.pagination.totalItems ? `${store.pagination.totalItems}` : '0'"
        >
            <template #action>
                <button v-if="can('fuec.create')" type="button" class="btn btn-primary btn-sm py-1 px-2 fs-11 rounded-3" @click="goToCreate">
                    <i class="fas fa-plus me-1" aria-hidden="true"></i> Nuevo
                </button>
            </template>
        </MobileSectionHeader>

        <div v-if="store.items && store.items.length > 0" class="d-flex flex-column w-100">
            <MobileCard
                v-for="item in store.items"
                :key="item.uuid"
                variant="green"
                :title="item.vehicle?.vehicle_license_plate ? `Placa: ${item.vehicle.vehicle_license_plate}` : 'FUEC PENDIENTE'"
                :subtitle="item.contractor ? `${item.contractor.company_name || ''} - Doc: ${item.contractor.document_number || '-'}` : 'Extracto Único de Contrato'"
                :badge="item.status"
                icon-class="fas fa-file-contract"
            >
                <div class="py-2 border-top border-bottom my-1">
                    <div class="d-flex align-items-center gap-2 text-dark fs-12 fw-semibold">
                        <i class="fad fa-map-marker-alt text-danger" aria-hidden="true"></i>
                        <span>{{ item.origin_route || 'Origen' }}</span>
                        <i class="fas fa-arrow-right text-muted fs-10" aria-hidden="true"></i>
                        <span>{{ item.destination_route || 'Destino' }}</span>
                    </div>
                    <div class="text-muted fs-11 mt-1">
                        <i class="far fa-calendar-alt me-1" aria-hidden="true"></i>Expedido: {{ dateUtils.format(item.issue_date) }}
                    </div>
                </div>

                <template #actions>
                    <button v-if="can('fuec.profile')" class="mc-btn-primary" type="button" @click="goToDetail(item.uuid)">
                        <i class="fad fa-file-check" aria-hidden="true"></i>
                        <span>Doc. en Ruta</span>
                    </button>
                    <button class="mc-btn-secondary" type="button" @click="downloadPdfServer(item)">
                        <i class="fad fa-file-pdf text-danger" aria-hidden="true"></i>
                        <span>PDF</span>
                    </button>
                    <button v-if="can('fuec.update')" class="mc-btn-secondary" type="button" @click="goToEdit(item.uuid)">
                        <i class="fad fa-edit text-warning" aria-hidden="true"></i>
                        <span>Editar</span>
                    </button>
                </template>
            </MobileCard>
        </div>

        <MobileEmptyState
            v-else
            emoji="📜"
            title="Sin FUECs asignados"
            description="No hay extractos únicos de contrato activos o asignados a tus vehículos."
            action-text="Crear FUEC"
            action-icon="fas fa-plus"
            @action="goToCreate"
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
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useServerSort } from '@/hooks/useServerSort.js';
import { useFuecStore } from '../store/fuec.store.js';
import { usePermissionsStore } from '@store';
import { useTable } from '@/hooks/useTable.js';
import { useTableActions } from '@/hooks/useTableActions.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import RowActions from '@/components/RowActions.vue';
import ListPagination from '@/components/ListPagination.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Swal from 'sweetalert2';
import dateUtils from '@/utils/date.js';
import MobileCard from '@/components/mobile/MobileCard.vue';
import MobileSectionHeader from '@/components/mobile/MobileSectionHeader.vue';
import MobileEmptyState from '@/components/mobile/MobileEmptyState.vue';

const route = useRoute();
const router = useRouter();
const store = useFuecStore();
const permissionsStore = usePermissionsStore();
const { onSort: handleSort } = useServerSort((field, order) => store.setSort(field, order), { route, router });

const isViewLoading = ref(true);
const searchQuery = ref('');

const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(searchQuery.value));
const { confirmDelete, initTooltips, destroyTooltips } = useTableActions(store, router);

const can = (action) => permissionsStore.can(action);

const clearSearch = async () => { searchQuery.value = ''; await store.clearFilters(); };
const refreshTable = () => store.fetchItems();
const onPageChange = async ({ page, first, rows }) => {
    store.pagination.itemsPerPage = rows;
    const targetPage = page !== undefined ? page : Math.floor(first / rows) + 1;
    await store.setPage(targetPage);
};

const goToCreate = () => router.push('/extracto-de-contrato/crear');
const goToEdit = (uuid) => router.push(`/extracto-de-contrato/editar/${uuid}`);
const goToDetail = (uuid) => router.push(`/extracto-de-contrato/perfil/${uuid}`);

const handleDelete = (item) => confirmDelete(item, {
    title: '¿Eliminar FUEC?',
    nameField: 'number_fuec',
});

const accionesDe = (data) => [
    { key: 'perfil', label: 'Ver detalle', icon: 'far fa-eye', tone: 'primary', inline: true, visible: can('fuec.profile'), onClick: () => goToDetail(data.uuid) },
    { key: 'pdf', label: 'Descargar PDF', icon: 'far fa-file-pdf', tone: 'neutral', inline: true, onClick: () => downloadPdfServer(data) },
    { key: 'editar', label: 'Editar', icon: 'far fa-pen', tone: 'warning', visible: can('fuec.update'), onClick: () => goToEdit(data.uuid) },
    { key: 'eliminar', label: 'Eliminar', icon: 'far fa-trash-alt', tone: 'danger', visible: can('fuec.delete'), onClick: () => handleDelete(data) },
];

const downloadPdfServer = async (item) => {
    Swal.fire({
        title: 'Generando PDF...',
        text: 'Por favor espere mientras el servidor prepara el documento.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        await store.downloadPdf(item.uuid);

        Swal.close();
        Swal.fire({
            icon: 'success',
            title: '¡Listo!',
            text: 'El PDF del FUEC se ha generado y abierto en el navegador.',
            timer: 2000,
            showConfirmButton: false
        });
    } catch (error) {
        console.error('Error al generar PDF del servidor:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error de Generación',
            text: error.response?.data?.message || 'No se pudo generar el documento PDF desde el servidor.',
            confirmButtonText: 'Aceptar'
        });
    }
};

onMounted(async () => {
    const sortParam = route.query.sort;
    const orderParam = route.query.order;
    if (typeof sortParam === 'string' && sortParam) {
        store.sortField = sortParam;
        store.sortOrder = orderParam === 'desc' ? -1 : 1;
    }
    try {
        searchQuery.value = store.search;
        await store.fetchItems();
    } finally {
        isViewLoading.value = false;
        initTooltips();
    }
});

onUnmounted(() => destroyTooltips());
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
</style>