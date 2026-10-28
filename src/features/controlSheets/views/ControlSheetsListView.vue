<template>
    <!-- VISTA ESCRITORIO / TABLET -->
    <div class="d-none d-md-block">
        <BasePageHeader title="Listado de Planillas de Control" description="Gestión de planillas de control vehicular en el sistema."
            icon="fad fa-clipboard-list text-primary" :show-refresh="true" :show-create="true" :show-bg="true"
            :loading="isViewLoading || store.loading" :compact="true"
            :breadcrumbs="[{ label: 'Planillas de Control' }, { label: 'Listado' }]" @refresh="refreshTable" @create="goToCreate"
            :canCreate="can('control_sheets.create')" />

        <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
        <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
            <div class="noa-list-toolbar">
                <div class="noa-search">
                    <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                    <input id="f-control-sheets-busqueda" v-model="searchQuery" class="noa-search__input" type="search" placeholder="Buscar por empresa o placa..."
                        aria-label="Buscar hoja de control" @input="debouncedSearch" />
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
                                <th v-for="w in (isSuperAdmin ? ['28%', '30%', '16%', '14%', '12%'] : ['25%', '35%', '16%', '12%', '12%'])" :key="w"
                                    style="padding:12px 8px">
                                    <div class="skeleton-text" :style="`height:16px;width:${w}`" />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="n in store.pagination.itemsPerPage" :key="`sk-${n}`">
                                <td v-for="i in 4" :key="i">
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
                        :loading="store.loading" responsiveLayout="scroll"
                        tableStyle="min-width: 50rem" class="table table-sm mb-0 professional-table noa-table-fixed"
                        emptyMessage="No se encontraron registros"
                        :sortField="store.sortField" :sortOrder="store.sortOrder" @sort="handleSort">

                        <Column v-if="isSuperAdmin" header="Empresa / Vehículo" sortable style="width: 28%;">
                            <template #body="{ data }">
                                <div class="d-flex flex-column">
                                    <span class="noa-cell-strong text-truncate" :title="data.company?.business_name">
                                        <i class="fad fa-building text-muted me-1" aria-hidden="true" />{{ data.company?.business_name || '—' }}
                                    </span>
                                    <span class="noa-cell-sub mt-1">
                                        <i class="fad fa-car-side text-muted me-1" aria-hidden="true" />{{ data.vehicle?.vehicle_license_plate || '—' }}
                                    </span>
                                </div>
                            </template>
                        </Column>

                        <Column v-else header="Vehículo" sortable style="width: 25%;">
                            <template #body="{ data }">
                                <div class="d-flex align-items-center gap-2">
                                    <i class="fad fa-car-side text-muted" aria-hidden="true" />
                                    <span class="noa-cell-strong">{{ data.vehicle?.vehicle_license_plate || '—' }}</span>
                                </div>
                            </template>
                        </Column>

                        <Column field="observations" header="Observaciones" sortable :style="isSuperAdmin ? 'width: 30%;' : 'width: 35%;'">
                            <template #body="{ data }">
                                <span class="text-truncate d-inline-block" style="max-width: 280px;" :title="data.observations">
                                    {{ data.observations || '—' }}
                                </span>
                            </template>
                        </Column>

                        <Column header="Documentos" class="text-center" style="width: 16%;">
                            <template #body="{ data }">
                                <div v-if="data.media && data.media.length > 0"
                                    class="d-flex flex-wrap justify-content-center gap-1">
                                    <a v-for="file in data.media" :key="file.uuid"
                                        :href="file.original_url || file.url" target="_blank"
                                        class="btn btn-sm btn-falcon-default px-2 py-1"
                                        :title="file.file_name || file.name"
                                        :aria-label="`Abrir documento ${file.file_name || file.name}`">
                                        <i class="fad fa-file-pdf text-danger" style="font-size: 13px;" aria-hidden="true" />
                                    </a>
                                </div>
                                <span v-else class="text-muted small">—</span>
                            </template>
                        </Column>

                        <Column field="is_active" header="Estado" sortable class="text-center"
                            :style="isSuperAdmin ? 'width: 14%;' : 'width: 12%;'">
                            <template #body="{ data }">
                                <span class="noa-status"
                                    :class="data.is_active ? 'noa-status--success' : 'noa-status--warning'">
                                    {{ data.is_active ? "Activo" : "Inactivo" }}
                                </span>
                            </template>
                        </Column>

                        <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 12%;">
                            <template #body="{ data }">
                                <RowActions :actions="accionesDe(data)" :row-label="data.vehicle?.vehicle_license_plate || 'planilla'" />
                            </template>
                        </Column>

                        <!-- Empty state -->
                        <template #empty>
                            <div class="text-center py-5">
                                <i class="fad fa-clipboard-list fs-1 text-muted opacity-50 mb-3 d-block" aria-hidden="true" />
                                <h6 class="text-muted mb-1 fw-medium">No hay registros encontrados</h6>
                                <p class="text-muted small mb-3">Comienza creando tu primera planilla de control.</p>
                                <button v-if="can('control_sheets.create')" class="btn btn-primary btn-sm" type="button"
                                    @click="goToCreate">
                                    <i class="fad fa-plus me-1" aria-hidden="true" />Nuevo Registro
                                </button>
                            </div>
                        </template>

                        <!-- Loading state -->
                        <template #loading>
                            <NoaTableSpinner message="Cargando registros..." />
                        </template>
                    </DataTable>
                </div>
                <ListPagination :page="store.pagination.currentPage" :per-page="store.pagination.itemsPerPage"
                    :total="store.pagination.totalItems" @change="onPageChange" />
            </div>
        </div>
    </div>

    <!-- VISTA MÓVIL ANDROID CAPACITOR (Pantalla completa de borde a borde) -->
    <div class="d-md-none w-100 px-1 pt-1 pb-3 mobile-control-feed">
        <MobileSectionHeader
            title="Planillas de Control"
            icon-class="fas fa-clipboard-list"
            icon-bg="#f97316"
            :badge="store.pagination.totalItems ? `${store.pagination.totalItems}` : '0'"
        >
            <template #action>
                <button v-if="can('control_sheets.create')" type="button" class="btn btn-primary btn-sm py-1 px-2 fs-11 rounded-3" @click="goToCreate">
                    <i class="fas fa-plus me-1" aria-hidden="true"></i> Nueva
                </button>
            </template>
        </MobileSectionHeader>

        <div v-if="store.items && store.items.length > 0" class="d-flex flex-column w-100">
            <MobileCard
                v-for="item in store.items"
                :key="item.uuid"
                variant="orange"
                :title="item.vehicle?.vehicle_license_plate || 'SIN PLACA'"
                :subtitle="item.company?.business_name || 'Control de Servicio'"
                :badge="item.is_active ? 'Activo' : 'Inactivo'"
                icon-class="fas fa-clipboard-list"
            >
                <div v-if="item.observations" class="py-2 text-muted fs-11 border-top border-bottom my-1">
                    <i class="far fa-comment-alt me-1" aria-hidden="true"></i>{{ item.observations }}
                </div>

                <template #actions>
                    <template v-if="item.media && item.media.length > 0">
                        <a v-for="file in item.media" :key="file.uuid"
                            :href="file.original_url || file.url" target="_blank"
                            class="mc-btn-primary">
                            <i class="fad fa-file-pdf" aria-hidden="true"></i>
                            <span>PDF</span>
                        </a>
                    </template>
                    <button v-if="can('control_sheets.update')" class="mc-btn-secondary" type="button" @click="goToEdit(item.uuid)">
                        <i class="fad fa-edit text-warning" aria-hidden="true"></i>
                        <span>Editar</span>
                    </button>
                </template>
            </MobileCard>
        </div>

        <MobileEmptyState
            v-else
            emoji="📋"
            title="Sin planillas de control"
            description="No hay planillas de control registradas o asignadas para este filtro."
            action-text="Nueva Planilla"
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useServerSort } from '@/hooks/useServerSort.js';
import { useControlSheetsStore } from '../store/controlSheets.store.js';
import { usePermissionsStore } from '@store';
import { useTable } from '@/hooks/useTable.js';
import { useTableActions } from '@/hooks/useTableActions.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import RowActions from '@/components/RowActions.vue';
import ListPagination from '@/components/ListPagination.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import MobileCard from '@/components/mobile/MobileCard.vue';
import MobileSectionHeader from '@/components/mobile/MobileSectionHeader.vue';
import MobileEmptyState from '@/components/mobile/MobileEmptyState.vue';

const route = useRoute();
const router = useRouter();
const store = useControlSheetsStore();
const permissionsStore = usePermissionsStore();
const { onSort: handleSort } = useServerSort((field, order) => store.setSort(field, order), { route, router });

const isSuperAdmin = computed(() => permissionsStore.hasRole('superadmin'));

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

const goToCreate = () => router.push('/planillas-de-control-de-servicios/crear');
const goToEdit = (uuid) => router.push(`/planillas-de-control-de-servicios/editar/${uuid}`);

const handleDelete = (item) => confirmDelete(item, {
    title: '¿Eliminar registro?',
    html: `<p class="mb-2">¿Estás seguro de eliminar la planilla del vehículo <strong>"${item.vehicle?.vehicle_license_plate || 'este registro'}"</strong>?</p>
           <div class="alert alert-warning small mb-0 mt-2">
               <i class="fad fa-exclamation-triangle me-1"></i>
               Esta acción no se puede deshacer.
           </div>`
});

const accionesDe = (data) => [
    { key: 'editar', label: 'Editar', icon: 'far fa-pen', tone: 'warning', inline: true, visible: can('control_sheets.update'), onClick: () => goToEdit(data.uuid) },
    { key: 'eliminar', label: 'Eliminar', icon: 'far fa-trash-alt', tone: 'danger', visible: can('control_sheets.delete'), onClick: () => handleDelete(data) },
];

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
        transform: translateY(16px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
