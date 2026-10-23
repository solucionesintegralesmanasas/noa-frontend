<template>
    <BasePageHeader :title="getDocumentTypeTitle(route.params.documentType)"
        description="Gestión del módulo en el sistema." icon="fad fa-clipboard-list text-primary" :show-refresh="true"
        :show-create="can('vehicle_documents.create')" :show-bg="true" :loading="isViewLoading || store.loading"
        :compact="true"
        :breadcrumbs="[{ label: 'Documentos' }, { label: getDocumentTypeTitle(route.params.documentType) }]"
        @refresh="refreshTable" @create="goToCreate" />

    <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar">
            <div class="noa-search">
                <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                <input v-model="searchQuery" class="noa-search__input" type="search" placeholder="Buscar..."
                    aria-label="Buscar documento de vehículo" @input="debouncedSearch" />
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
                            <th v-for="w in ['30%', '20%', '20%', '15%', '15%']" :key="w"
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
                <DataTable :value="displayRows" lazy :paginator="false" :rows="store.pagination.itemsPerPage"
                    :totalRecords="store.pagination.totalItems" :first="(store.pagination.currentPage - 1) *
                        store.pagination.itemsPerPage
                        " :loading="store.loading"
                    responsiveLayout="scroll" tableStyle="min-width: 60rem"
                    class="table table-sm mb-0 professional-table noa-table-fixed"
                    :sortField="sortField" :sortOrder="sortOrdenPrimeVue" removableSort
                    emptyMessage="No se encontraron registros" @sort="onSort">
                    <template v-if="isPolizaView">
                        <!-- Vista consolidada de Pólizas (RCC y RCE) -->
                        <Column field="vehicle.vehicle_license_plate" header="Placa" sortable style="width: 16%;">
                            <template #body="{ data }">
                                <span class="badge bg-200 text-dark font-monospace">{{
                                    data.vehicle?.vehicle_license_plate || '-' }}</span>
                            </template>
                        </Column>

                        <Column field="issuing_entity" header="Entidad Prestadora" sortable style="width: 38%;">
                            <template #body="{ data }">
                                <span class="text-dark">{{ data.issuing_entity || '-' }}</span>
                            </template>
                        </Column>

                        <Column field="expiry_date" header="Vencimiento" sortable style="width: 18%;">
                            <template #body="{ data }">
                                <span class="text-dark text-nowrap">{{ data.expiry_date ? String(data.expiry_date).split(' ')[0] : '-' }}</span>
                            </template>
                        </Column>

                        <Column field="status" header="Estado" sortable style="width: 14%;">
                            <template #body="{ data }">
                                <span class="noa-status" :class="normalizarEstadoDocumento(data.status) === 'VIGENTE' ? 'noa-status--success' : 'noa-status--warning'">
                                    {{ normalizarEstadoDocumento(data.status) }}
                                </span>
                            </template>
                        </Column>

                        <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 14%;">
                            <template #body="{ data }">
                                <RowActions :actions="accionesPolizaDe(data)" :row-label="data.vehicle?.vehicle_license_plate || 'póliza'" />
                            </template>
                        </Column>
                    </template>

                    <template v-else>
                        <!-- Vista individual (SOAT / RTM) -->
                        <Column field="policy_number" :header="getDocumentNumberHeader(route.params.documentType)"
                            sortable class="font-monospace" style="width: 18%;">
                            <template #body="{ data }">
                                <span class="noa-cell-strong">{{ data.policy_number || '-' }}</span>
                            </template>
                        </Column>

                        <Column field="document_type" header="Tipo" sortable style="width: 10%;">
                            <template #body="{ data }">
                                <span class="badge rounded-pill badge-subtle badge-subtle-info">
                                    {{ data.document_type }}
                                </span>
                            </template>
                        </Column>

                        <Column field="vehicle.vehicle_license_plate" header="Vehículo" sortable style="width: 12%;">
                            <template #body="{ data }">
                                <span class="badge bg-200 text-dark font-monospace">{{
                                    data.vehicle?.vehicle_license_plate || '-' }}</span>
                            </template>
                        </Column>

                        <Column field="issuing_entity" header="Entidad" sortable style="width: 24%;">
                            <template #body="{ data }">
                                <span class="text-dark">{{ data.issuing_entity || '-' }}</span>
                            </template>
                        </Column>

                        <Column field="expiry_date" header="Vencimiento" sortable style="width: 12%;">
                            <template #body="{ data }">
                                <span class="text-dark">{{ data.expiry_date ? String(data.expiry_date).split(' ')[0]
                                    : '-' }}</span>
                            </template>
                        </Column>

                        <Column field="status" header="Estado" sortable style="width: 12%;">
                            <template #body="{ data }">
                                <span class="noa-status" :class="normalizarEstadoDocumento(data.status) === 'VIGENTE' ? 'noa-status--success' : 'noa-status--warning'">
                                    {{ normalizarEstadoDocumento(data.status) }}
                                </span>
                            </template>
                        </Column>

                        <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 12%;"
                            v-if="can('vehicle_documents.update') || can('vehicle_documents.delete')">
                            <template #body="{ data }">
                                <RowActions :actions="accionesDocDe(data)" :row-label="data.policy_number || 'documento'" />
                            </template>
                        </Column>
                    </template>
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

    <!-- MODAL: Detalle de pólizas RCC y RCE -->
    <Dialog v-model:visible="showPoliciesModal" :modal="true" :closable="true" :draggable="false"
        :style="{ width: '680px' }" class="p-fluid policies-dialog" header="Detalle de Pólizas">
        <template v-if="selectedPolicies && selectedPolicies.vehicle">
            <div class="text-center mb-3">
                <span class="badge bg-200 text-dark font-monospace px-3 py-2" style="font-size: 1rem;">
                    <i class="fad fa-car me-2 text-primary"></i>
                    {{ selectedPolicies.vehicle.vehicle_license_plate || '-' }}
                </span>
            </div>
            <div class="row g-3">
                <div class="col-md-6" v-for="doc in selectedPolicies.policies" :key="doc.uuid">
                    <div class="border rounded-3 p-3 h-100"
                        :class="doc.document_type === 'RCC' ? 'border-primary' : 'border-success'">
                        <h6 class="fw-bold text-uppercase mb-3"
                            :class="doc.document_type === 'RCC' ? 'text-primary' : 'text-success'">
                            {{ doc.document_type }} - Póliza
                        </h6>
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted small">Número de Póliza</span>
                            <span class="fw-medium font-monospace">{{ doc.policy_number || '-' }}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted small">Entidad Prestadora</span>
                            <span class="fw-medium text-end">{{ doc.issuing_entity || '-' }}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted small">Vencimiento</span>
                            <span class="fw-medium">{{ doc.expiry_date ? String(doc.expiry_date).split(' ')[0] : '-' }}</span>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span class="text-muted small">Estado</span>
                            <span class="badge rounded-pill" :class="claseEstadoDocumento(doc.status)">
                                {{ normalizarEstadoDocumento(doc.status) }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </template>
        <template v-else>
            <p class="text-muted mb-0">No hay información disponible.</p>
        </template>
        <template #footer>
            <button type="button" class="btn btn-secondary rounded-pill" @click="showPoliciesModal = false">Cerrar</button>
        </template>
    </Dialog>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useVehicleDocumentsStore } from '../store/vehicleDocuments.store.js';
import { usePermissionsStore } from '@store';
import { useTable } from '@/hooks/useTable.js';
import { normalizarEstadoDocumento, claseEstadoDocumento } from '@/utils/documentStatus.js';
import { elegirPolizaViva } from '@/hooks/useDocumentWizard.js';
import { useTableActions } from '@/hooks/useTableActions.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import RowActions from '@/components/RowActions.vue';
import ListPagination from '@/components/ListPagination.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import Swal from 'sweetalert2';
import vehicleDocumentsService from '../services/vehicleDocuments.service.js';

const route = useRoute();
const router = useRouter();
const store = useVehicleDocumentsStore();
const permissionsStore = usePermissionsStore();

const isViewLoading = ref(true);
const searchQuery = ref('');
const showPoliciesModal = ref(false);
const selectedPolicies = ref(null);

const isPolizaView = computed(() => route.params.documentType === 'poliza');

/**
 * Filas a mostrar en la tabla.
 * En la vista de pólizas el backend ya devuelve un registro por vehículo
 * con sus pólizas anidadas en la propiedad "policies".
 */
const displayRows = computed(() => store.items);

const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(searchQuery.value));
const { confirmDelete, initTooltips, destroyTooltips } = useTableActions(store, router);

const can = (action) => permissionsStore.can(action);

const clearSearch = async () => { searchQuery.value = ''; await store.clearFilters(); };
const refreshTable = () => store.fetchItems();
const onPageChange = async ({ first, rows }) => {
    await store.setPage(Math.floor(first / rows) + 1);
};

const getDocumentTypeTitle = (documentType) => {
    switch (documentType) {
        case 'soat': return 'Póliza SOAT';
        case 'tecnomecanica': return 'Revisión Técnico Mecánica (RTM)';
        case 'poliza': return 'Pólizas de Responsabilidad Civil (RCC y RCE)';
        default: return 'Documentos';
    }
};

const getDocumentNumberHeader = (documentType) => {
    switch (documentType) {
        case 'soat': return 'Número de SOAT';
        case 'tecnomecanica': return 'Número de Tecnomecánica';
        case 'poliza': return 'Número de Póliza';
        default: return 'Número de Documento';
    }
};

const openPoliciesModal = (row) => {
    selectedPolicies.value = row;
    showPoliciesModal.value = true;
};

/**
 * Elimina todas las pólizas (RCC y RCE) de un vehículo, previa confirmación.
 */
const handleDeletePolicies = async (row) => {
    const plate = row.vehicle?.vehicle_license_plate || '';
    const { isConfirmed } = await Swal.fire({
        title: '¿Eliminar pólizas?',
        text: `Se eliminarán las pólizas RCC y RCE del vehículo ${plate || 'seleccionado'}.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc3545',
    });
    if (!isConfirmed) return;

    const uuids = (row.policies || []).map(p => p.uuid);
    try {
        if (uuids.length > 0) {
            await Promise.all(uuids.map(uuid => vehicleDocumentsService.delete(uuid)));
        }
        await Swal.fire({ icon: 'success', title: '¡Eliminado!', text: 'Las pólizas del vehículo fueron eliminadas.', timer: 1500, showConfirmButton: false });
        await store.fetchItems();
    } catch (error) {
        await Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron eliminar las pólizas.' });
    }
};

const goToCreate = () => {
    const type = route.params.documentType;
    if (type) return router.push(`/vehiculos-documentos/${type}/crear`);
    return router.push('/vehiculos-documentos/crear');
};

const goToEdit = (uuid) => {
    const type = route.params.documentType;
    if (type) return router.push(`/vehiculos-documentos/${type}/editar/${uuid}`);
    return router.push(`/vehiculos-documentos/editar/${uuid}`);
};

/**
 * UUID para editar las pólizas de la fila: la viva más reciente (RCC o RCE).
 * `policies[0]` no tiene orden, así que podía abrir el registro reemplazado.
 */
const uuidEdicionPoliza = (row) => {
    const policies = row.policies || [];
    return elegirPolizaViva(policies, 'RCC')?.uuid
        ?? elegirPolizaViva(policies, 'RCE')?.uuid
        ?? policies[0]?.uuid
        ?? row.uuid;
};

const handleDelete = (item) => confirmDelete(item, {
    title: '¿Eliminar documento?',
    nameField: 'policy_number',
});

const accionesPolizaDe = (data) => [
    { key: 'ver', label: 'Ver pólizas', icon: 'far fa-eye', tone: 'primary', inline: true, onClick: () => openPoliciesModal(data) },
    { key: 'editar', label: 'Editar', icon: 'far fa-pen', tone: 'warning', inline: true, visible: can('vehicle_documents.update'), onClick: () => goToEdit(uuidEdicionPoliza(data)) },
    { key: 'eliminar', label: 'Eliminar', icon: 'far fa-trash-alt', tone: 'danger', visible: can('vehicle_documents.delete'), onClick: () => handleDeletePolicies(data) },
];

const accionesDocDe = (data) => [
    { key: 'editar', label: 'Editar', icon: 'far fa-pen', tone: 'warning', inline: true, visible: can('vehicle_documents.update'), onClick: () => goToEdit(data.uuid) },
    { key: 'eliminar', label: 'Eliminar', icon: 'far fa-trash-alt', tone: 'danger', visible: can('vehicle_documents.delete'), onClick: () => handleDelete(data) },
];

onMounted(async () => {
    try {
        searchQuery.value = store.search;
        store.vehicleUuidFilter = route.query.vehicle_uuid || null;
        const type = route.params.documentType;
        if (type === 'soat') store.documentTypeFilter = 'SOAT';
        else if (type === 'tecnomecanica') store.documentTypeFilter = 'RTM';
        else if (type === 'poliza') store.documentTypeFilter = 'RCE,RCC';
        else store.documentTypeFilter = null;
        await store.fetchItems();
    } finally {
        isViewLoading.value = false;
        initTooltips();
    }
});

watch(() => route.path, async () => {
    isViewLoading.value = true;
    store.vehicleUuidFilter = route.query.vehicle_uuid || null;
    const type = route.params.documentType;
    if (type === 'soat') store.documentTypeFilter = 'SOAT';
    else if (type === 'tecnomecanica') store.documentTypeFilter = 'RTM';
    else if (type === 'poliza') store.documentTypeFilter = 'RCE,RCC';
    else store.documentTypeFilter = null;

    await store.setPage(1);
    isViewLoading.value = false;
    initTooltips();
});

watch(() => route.query.vehicle_uuid, async (next, prev) => {
    if (next === prev) return;
    store.vehicleUuidFilter = next || null;
    await store.setPage(1);
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