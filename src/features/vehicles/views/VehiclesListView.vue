<template>
    <BasePageHeader :title="'Listado de ' + 'Vehicles'" description="Gestión del módulo en el sistema."
        icon="fad fa-clipboard-list text-primary" :show-refresh="true" :show-create="can('vehicles.create')" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true" 
        :breadcrumbs="[{ label: 'Vehicles' }, { label: 'Listado' }]" @refresh="refreshTable" @create="goToCreate"  />

    <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar">
            <div class="noa-search">
                <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                <input v-model="searchQuery" class="noa-search__input" type="search" placeholder="Buscar por placa, marca, afiliado..."
                    aria-label="Buscar vehículo" @input="debouncedSearch" />
                <button v-if="searchQuery" class="noa-search__clear" type="button" title="Limpiar"
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
                            <th v-for="w in ['25%', '15%', '15%', '12%', '10%', '13%', '10%']" :key="w"
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
                <DataTable :value="store.items" lazy :paginator="false" :rows="store.pagination.itemsPerPage"
                    :totalRecords="store.pagination.totalItems" :first="(store.pagination.currentPage - 1) *
                        store.pagination.itemsPerPage
                        " :loading="store.loading"
                    :sortField="sortField" :sortOrder="sortOrdenPrimeVue" removableSort
                    responsiveLayout="scroll" tableStyle="min-width: 68rem"
                    class="table table-sm mb-0 professional-table noa-table-fixed"
                    emptyMessage="No se encontraron registros" @sort="onSort">
                    <Column field="vehicle_license_plate" header="Placa / Afiliado" sortable style="width: 21%;">
                        <template #body="{ data }">
                            <div class="d-flex flex-column">
                                <span class="noa-cell-strong">{{ data.vehicle_license_plate || '-' }}</span>
                                <span class="noa-cell-sub" v-if="data.third_party">
                                    {{ data.third_party.company_name || `${data.third_party.first_name} ${data.third_party.last_name}` }}
                                </span>
                            </div>
                        </template>
                    </Column>

                    <Column field="vehicle_class.description" header="Clase" sortable style="width: 11%;">
                        <template #body="{ data }">
                            <span class="text-dark">{{ data.vehicle_class?.description || '-' }}</span>
                        </template>
                    </Column>

                    <Column field="brand.description" header="Marca" sortable style="width: 11%;">
                        <template #body="{ data }">
                            <span class="text-dark">{{ data.brand?.description || '-' }}</span>
                        </template>
                    </Column>

                    <Column field="line" header="Línea" sortable style="width: 11%;">
                        <template #body="{ data }">
                            <span class="text-dark">{{ data.line || '-' }}</span>
                        </template>
                    </Column>

                    <Column field="model" header="Modelo" sortable style="width: 7%;">
                        <template #body="{ data }">
                            <span class="text-dark">{{ data.model || '-' }}</span>
                        </template>
                    </Column>

                    <Column field="branch.name" header="Sucursal" sortable style="width: 11%;">
                        <template #body="{ data }">
                            <span class="text-dark">{{ data.branch?.name || '-' }}</span>
                        </template>
                    </Column>

                    <Column field="type_of_service" header="Servicio" sortable style="width: 8%;">
                        <template #body="{ data }">
                            <span class="badge rounded-pill badge-subtle badge-subtle-info">
                                {{ data.type_of_service === 'PUBLICO' ? 'Público' : 'Particular' }}
                            </span>
                        </template>
                    </Column>

                    <Column field="is_active" header="Estado" sortable style="width: 9%;">
                        <template #body="{ data }">
                            <span class="noa-status" :class="data.is_active ? 'noa-status--success' : 'noa-status--muted'">
                                {{ data.is_active ? "Activo" : "Inactivo" }}
                            </span>
                        </template>
                    </Column>

                    <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 11%;"
                        v-if="can('vehicles.profile') || can('vehicles.update') || can('vehicles.change_branch') || can('vehicles.delete')">
                        <template #body="{ data }">
                            <RowActions :actions="accionesDe(data)" :row-label="data.vehicle_license_plate || 'vehículo'" />
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
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useVehiclesStore } from '../store/vehicles.store.js';
import { usePermissionsStore } from '@store';
import { useTable } from '@/hooks/useTable.js';
import { useServerSort } from '@/hooks/useServerSort.js';
import { useTableActions } from '@/hooks/useTableActions.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import RowActions from '@/components/RowActions.vue';
import ListPagination from '@/components/ListPagination.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Swal from 'sweetalert2';

const router = useRouter();
const route = useRoute();
const store = useVehiclesStore();
const permissionsStore = usePermissionsStore();

const isViewLoading = ref(true);
const searchQuery = ref('');

const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(searchQuery.value));
const { confirmDelete, initTooltips, destroyTooltips } = useTableActions(store, router);
const { sortField, sortOrdenPrimeVue, onSort, restore } = useServerSort({
    onChange: ({ field, order }) => store.setSort(field, order),
});

const can = (action) => permissionsStore.can(action);

const clearSearch = async () => { searchQuery.value = ''; await store.clearFilters(); };
const refreshTable = () => store.fetchItems();
const onPageChange = async ({ first, rows }) => {
    store.pagination.itemsPerPage = rows;
    await store.setPage(Math.floor(first / rows) + 1);
};

const goToCreate = () => router.push('/vehiculos/crear');
const goToEdit = (uuid) => router.push(`/vehiculos/editar/${uuid}`);
const goToDetail = (uuid) => router.push(`/vehiculos/perfil/${uuid}`);
const goToForecast = (uuid) => router.push({ path: '/mantenimiento/proyeccion', query: { vehicle: uuid } });

const handleDelete = (item) => confirmDelete(item, {
    title: '¿Eliminar vehículo?',
    nameField: 'vehicle_license_plate',
});

const accionesDe = (data) => [
    { key: 'ver', label: 'Ver detalle', icon: 'far fa-eye', tone: 'primary', inline: true, visible: can('vehicles.profile'), onClick: () => goToDetail(data.uuid) },
    { key: 'editar', label: 'Editar', icon: 'far fa-pen', tone: 'warning', inline: true, visible: can('vehicles.update'), onClick: () => goToEdit(data.uuid) },
    { key: 'sede', label: 'Cambiar sede', icon: 'far fa-building', tone: 'primary', visible: can('vehicles.change_branch'), onClick: () => handleChangeBranch(data) },
    { key: 'proyeccion', label: 'Proyección de mantenimiento', icon: 'far fa-calendar-check', tone: 'success', visible: can('maintenance.forecast'), onClick: () => goToForecast(data.uuid) },
    { key: 'eliminar', label: 'Eliminar', icon: 'far fa-trash-alt', tone: 'danger', visible: can('vehicles.delete'), onClick: () => handleDelete(data) },
];

const handleChangeBranch = async (vehicle) => {
    try {
        if (!store.catalogs.branches || store.catalogs.branches.length === 0) {
            await store.loadCatalogs();
        }

        const branches = store.catalogs.branches || [];
        if (branches.length === 0) {
            await Swal.fire({
                title: 'Atención',
                text: 'No hay sedes configuradas en el sistema.',
                icon: 'warning',
                confirmButtonText: 'Aceptar'
            });
            return;
        }

        const currentBranchUuid = vehicle.branch?.uuid || '';
        const availableBranches = branches.filter(b => b.uuid !== currentBranchUuid);

        if (availableBranches.length === 0) {
            await Swal.fire({
                title: 'Información',
                text: 'No hay otras sedes configuradas en el sistema a las que se pueda trasladar este vehículo.',
                icon: 'info',
                confirmButtonText: 'Aceptar'
            });
            return;
        }

        let selectedBranchUuid = '';

        let branchesHtml = `
            <style>
                .branch-card-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 14px;
                    margin-bottom: 8px;
                    border: 2px solid #e9ecef;
                    border-radius: 8px;
                    background: #fff;
                    cursor: pointer;
                    transition: all 150ms ease-in-out;
                    text-align: left;
                }
                .branch-card-item:hover {
                    border-color: #0d6efd;
                    background-color: #f8f9fa;
                }
                .branch-card-item.selected {
                    border-color: #0d6efd !important;
                    background-color: #f0f5ff !important;
                }
                .branch-card-item.selected .branch-icon-box {
                    background: #0d6efd !important;
                    color: #fff !important;
                }
                .branch-card-item.selected .select-check-indicator {
                    border-color: #0d6efd !important;
                    background-color: #0d6efd !important;
                    color: #fff !important;
                }
                .branch-card-item .select-check-indicator i,
                .branch-card-item .select-check-indicator svg {
                    display: none !important;
                }
                .branch-card-item.selected .select-check-indicator i,
                .branch-card-item.selected .select-check-indicator svg {
                    display: block !important;
                }
            </style>
            <div class="branch-selector-container" style="max-height: 320px; overflow-y: auto; padding: 4px;">
        `;
        availableBranches.forEach(b => {
            branchesHtml += `
                <div class="branch-card-item" data-uuid="${b.uuid}">
                    <div class="branch-icon-box" style="
                        width: 36px;
                        height: 36px;
                        border-radius: 6px;
                        background: #f8f9fa;
                        color: #0d6efd;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 14px;
                        transition: all 150ms ease;
                    ">
                        <i class="fad fa-building"></i>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; color: #2d3748; font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${b.name}</div>
                        <div style="font-size: 0.725rem; color: #718096; margin-top: 1px;">
                            Trasladar vehículo a esta sede
                        </div>
                    </div>
                    <div class="select-check-indicator" style="
                        width: 18px;
                        height: 18px;
                        border-radius: 50%;
                        border: 2px solid #cbd5e0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: #fff;
                        color: #fff;
                        font-size: 9px;
                        transition: all 150ms ease;
                    ">
                        <i class="fas fa-check"></i>
                    </div>
                </div>
            `;
        });
        branchesHtml += `</div>`;

        const { isConfirmed } = await Swal.fire({
            title: '<span style="font-size: 1.15rem; font-weight: 700; color: #1a202c;">Cambiar Sede del Vehículo</span>',
            html: `
                <div style="text-align: left; margin-bottom: 12px; font-size: 0.8rem; color: #4a5568; line-height: 1.4;">
                    Seleccione la nueva sucursal para asociar al vehículo con placa <strong class="text-primary">${vehicle.vehicle_license_plate}</strong>:
                </div>
                ${branchesHtml}
            `,
            showCancelButton: true,
            confirmButtonText: 'Guardar Cambios',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#0d6efd',
            cancelButtonColor: '#6c757d',
            customClass: {
                popup: 'rounded-3 shadow-lg border-0',
                confirmButton: 'btn btn-primary px-3 py-2 fw-medium btn-sm',
                cancelButton: 'btn btn-secondary px-3 py-2 fw-medium btn-sm'
            },
            didOpen: (popup) => {
                const confirmButton = popup.querySelector('.swal2-confirm');
                if (confirmButton) {
                    confirmButton.disabled = true;
                }

                const cards = popup.querySelectorAll('.branch-card-item');
                cards.forEach(card => {
                    card.addEventListener('click', () => {
                        cards.forEach(c => {
                            c.classList.remove('selected');
                        });

                        card.classList.add('selected');
                        selectedBranchUuid = card.getAttribute('data-uuid');
                        if (confirmButton) {
                            confirmButton.disabled = false;
                        }
                    });
                });
            }
        });

        if (isConfirmed && selectedBranchUuid && selectedBranchUuid !== currentBranchUuid) {
            await store.updateItem(vehicle.uuid, { branch_uuid: selectedBranchUuid });
            await store.fetchItems();
        }
    } catch (error) {
        console.error('Error al cambiar la sede:', error);
    }
};

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