<template>
    <BasePageHeader title="Listado de Convenios de Colaboración"
        description="Gestión de convenios de colaboración empresarial en el sistema."
        icon="fad fa-handshake text-primary" :show-refresh="true"
        :show-create="can('business_collaboration_agreements.create')" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true"
        :breadcrumbs="[{ label: 'Convenios' }, { label: 'Listado' }]" @refresh="refreshTable"
        @create="goToCreate" />

    <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar">
            <div class="noa-search">
                <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                <input id="f-convenios-busqueda" v-model="searchQuery" class="noa-search__input" type="search" placeholder="Buscar convenio..."
                    aria-label="Buscar convenio" @input="debouncedSearch" />
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
                            <th v-for="w in ['20%', '35%', '18%', '15%', '12%']" :key="w" style="padding:12px 8px">
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
                    :totalRecords="store.pagination.totalItems" :first="(store.pagination.currentPage - 1) *
                        store.pagination.itemsPerPage
                        " :loading="store.loading"
                    :sortField="store.sortField" :sortOrder="store.sortOrder" @sort="handleSort"
                    responsiveLayout="scroll" tableStyle="min-width: 55rem"
                    class="table table-sm mb-0 professional-table noa-table-fixed"
                    emptyMessage="No se encontraron registros">
                    <Column field="agreement_internal_id" header="ID Interno" sortable style="width: 20%;">
                        <template #body="{ data }">
                            <span class="noa-cell-strong">{{ data.agreement_internal_id || '-' }}</span>
                        </template>
                    </Column>

                    <Column field="contracting_entity_name" header="Entidad" sortable style="width: 35%;">
                        <template #body="{ data }">
                            <span class="noa-cell-strong">{{ data.contracting_entity_name || '-' }}</span>
                        </template>
                    </Column>

                    <Column field="expiry_date" header="Expiración" sortable style="width: 18%;">
                        <template #body="{ data }">
                            <span class="text-dark">{{ dateUtils.format(data.expiry_date) }}</span>
                        </template>
                    </Column>

                    <Column field="status" header="Estado" sortable style="width: 15%;">
                        <template #body="{ data }">
                            <span class="noa-status" :class="data.status ? 'noa-status--success' : 'noa-status--muted'">
                                {{ data.status ? "Activo" : "Inactivo" }}
                            </span>
                        </template>
                    </Column>

                    <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 12%;">
                        <template #body="{ data }">
                            <RowActions :actions="accionesDe(data)" :row-label="data.contracting_entity_name || data.agreement_internal_id || 'convenio'" />
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
import { toast } from '@/utils/toast.js';
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useBusinessCollaborationAgreementsStore } from '../store/businessCollaborationAgreements.store.js';
import { usePermissionsStore } from '@store';
import { useTable } from '@/hooks/useTable.js';
import { useTableActions } from '@/hooks/useTableActions.js';
import { useServerSort } from '@/hooks/useServerSort.js';
import BusinessCollaborationAgreementsService from '../services/businessCollaborationAgreements.service.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import RowActions from '@/components/RowActions.vue';
import ListPagination from '@/components/ListPagination.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { dateUtils } from '@/utils/date.js';

const router = useRouter();
const route = useRoute();
const store = useBusinessCollaborationAgreementsStore();
const permissionsStore = usePermissionsStore();

const { handleSort } = useServerSort((field, order) => store.setSort(field, order), { route, router });

const isViewLoading = ref(true);
const searchQuery = ref('');
const downloadingPdf = ref(null);

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

const goToCreate = () => router.push('/convenios-colaboracion/crear');
const goToEdit = (uuid) => router.push(`/convenios-colaboracion/editar/${uuid}`);

const handleDelete = (item) => confirmDelete(item, {
    title: '¿Eliminar convenio?',
    nameField: 'agreement_internal_id',
});

const downloadPdf = async (uuid) => {
    try {
        downloadingPdf.value = uuid;
        await BusinessCollaborationAgreementsService.downloadPdf(uuid);
    } catch {
        toast('Error', 'No se pudo generar o descargar el PDF', 'error');
    } finally {
        downloadingPdf.value = null;
    }
};

const accionesDe = (data) => [
    {
        key: 'pdf',
        label: 'Ver PDF',
        icon: 'far fa-file-pdf',
        tone: 'primary',
        inline: true,
        disabled: downloadingPdf.value === data.uuid,
        onClick: () => downloadPdf(data.uuid)
    },
    {
        key: 'editar',
        label: 'Editar',
        icon: 'far fa-pen',
        tone: 'warning',
        inline: true,
        visible: can('business_collaboration_agreements.update'),
        onClick: () => goToEdit(data.uuid)
    },
    {
        key: 'eliminar',
        label: 'Eliminar',
        icon: 'far fa-trash-alt',
        tone: 'danger',
        visible: can('business_collaboration_agreements.delete'),
        onClick: () => handleDelete(data)
    },
];

onMounted(async () => {
    try {
        if (route.query.sort) {
            store.sortField = String(route.query.sort);
            store.sortOrder = route.query.order === 'desc' ? -1 : 1;
        }
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