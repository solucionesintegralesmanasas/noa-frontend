<template>
    <BasePageHeader title="Proveedores de facturación"
        description="Conexión con Factus para la emisión de facturas electrónicas ante la DIAN."
        icon="fad fa-server text-primary" :show-refresh="true" :show-create="true" :show-bg="true"
        :can-create="can('billing_providers.create')" :loading="isViewLoading || store.loading" :compact="true"
        :breadcrumbs="[{ label: 'Finanzas' }, { label: 'Facturación', to: '/facturacion' }, { label: 'Proveedores' }]"
        @refresh="refreshTable" @create="goToCreate" />

    <!-- LISTADO: toolbar + tabla en una sola tarjeta -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar">
            <div class="noa-search">
                <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                <input id="f-proveedores-busqueda" v-model="searchQuery" class="noa-search__input" type="search"
                    placeholder="Buscar por nombre, usuario o URL..."
                    aria-label="Buscar proveedor de facturación" @input="onSearch" />
                <button v-if="searchQuery" class="noa-search__clear" type="button"
                    title="Limpiar búsqueda" aria-label="Limpiar búsqueda" @click="clearSearch">
                    <i class="fal fa-times" aria-hidden="true" />
                </button>
            </div>

            <span v-if="!isViewLoading && !store.loading" class="noa-results">
                <i class="fas fa-filter" aria-hidden="true" />
                {{ proveedoresFiltrados.length }} proveedor{{ proveedoresFiltrados.length !== 1 ? 'es' : '' }}
                <template v-if="searchQuery"> para "{{ searchQuery }}"</template>
            </span>
        </div>

        <!-- SKELETON -->
        <div v-if="isViewLoading" class="card-body p-0">
            <div class="table-responsive scrollbar">
                <table class="table table-sm mb-0">
                    <thead>
                        <tr>
                            <th v-for="w in ['34%', '22%', '14%', '12%', '18%']" :key="w" style="padding:12px 8px">
                                <div class="skeleton-text" :style="`height:16px;width:${w}`" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="n in 3" :key="`sk-${n}`">
                            <td><div class="skeleton-text" style="height:18px;width:70%;" /></td>
                            <td><div class="skeleton-text" style="height:18px;width:55%;" /></td>
                            <td><div class="skeleton-text" style="height:18px;width:60%;" /></td>
                            <td><div class="skeleton-text" style="height:18px;width:60%;" /></td>
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

        <!-- DATATABLE -->
        <div v-else class="card-body p-0">
            <div class="table-responsive scrollbar">
                <DataTable :value="proveedoresFiltrados" :loading="store.loading" responsiveLayout="scroll"
                    tableStyle="min-width: 46rem" class="table table-sm mb-0 professional-table noa-table-fixed"
                    emptyMessage="No se encontraron proveedores">

                    <!-- Nombre -->
                    <Column header="Proveedor" style="width: 34%;">
                        <template #body="{ data }">
                            <span class="noa-cell-strong">{{ data.name || '—' }}</span>
                            <div class="noa-cell-sub">
                                <i class="fal fa-at me-1" aria-hidden="true"></i>{{ data.email || 'Sin usuario' }}
                            </div>
                        </template>
                    </Column>

                    <!-- Ambiente -->
                    <Column header="Ambiente" style="width: 22%;">
                        <template #body="{ data }">
                            <span class="noa-cell-sub">{{ ambienteDe(data) }}</span>
                        </template>
                    </Column>

                    <!-- Envío DIAN -->
                    <Column header="Envío DIAN" class="text-center" header-class="text-center" style="width: 14%;">
                        <template #body="{ data }">
                            <span class="noa-status" :class="data.send_to_dian ? 'noa-status--success' : 'noa-status--muted'">
                                {{ data.send_to_dian ? 'Transmite' : 'Sandbox' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Estado -->
                    <Column header="Estado" class="text-center" header-class="text-center" style="width: 12%;">
                        <template #body="{ data }">
                            <span class="noa-status" :class="data.is_active ? 'noa-status--success' : 'noa-status--muted'">
                                {{ data.is_active ? 'Activo' : 'Inactivo' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Acciones -->
                    <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 18%;"
                        v-if="can('billing_providers.update') || can('billing_providers.delete')">
                        <template #body="{ data }">
                            <RowActions :actions="accionesDe(data)" :row-label="data.name || 'proveedor'" />
                        </template>
                    </Column>

                    <template #empty>
                        <div class="text-center py-5">
                            <i class="fad fa-server fs-1 text-muted opacity-50 mb-3 d-block" aria-hidden="true" />
                            <h6 class="text-muted mb-1 fw-medium">No hay proveedores registrados</h6>
                            <p class="text-muted small mb-3">Conecta Factus para emitir facturas electrónicas de servicios.</p>
                            <button v-if="can('billing_providers.create')" class="btn btn-primary btn-sm" type="button" @click="goToCreate">
                                <i class="fad fa-plus me-1" aria-hidden="true" />Conectar Factus
                            </button>
                        </div>
                    </template>

                    <template #loading>
                        <NoaTableSpinner message="Cargando proveedores..." />
                    </template>
                </DataTable>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useBillingStore } from '../store/billing.store.js';
import { usePermissionsStore } from '@store';
import { useTableActions } from '@/hooks/useTableActions.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import RowActions from '@/components/RowActions.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const router = useRouter();
const store = useBillingStore();
const permissionsStore = usePermissionsStore();
const can = (action) => permissionsStore.can(action);

const isViewLoading = ref(true);
const searchQuery = ref('');

const { confirmDelete, initTooltips, destroyTooltips } = useTableActions({
    deleteItem: (uuid) => store.eliminarProveedor(uuid),
});

const proveedoresFiltrados = computed(() => {
    const query = searchQuery.value.trim().toLowerCase();
    if (!query) return store.providers;
    return store.providers.filter((p) =>
        [p.name, p.email, p.server_url].some((v) => String(v ?? '').toLowerCase().includes(query))
    );
});

const ambienteDe = (data) => {
    const url = String(data.server_url ?? '');
    if (!url) return '—';
    if (url.includes('sandbox')) return 'Sandbox';
    return 'Producción';
};

const onSearch = () => { /* el filtrado es en cliente (computed) */ };
const clearSearch = () => { searchQuery.value = ''; };
const refreshTable = () => store.fetchProviders();

const goToCreate = () => router.push('/facturacion/proveedores/nuevo');
const goToEdit = (uuid) => router.push(`/facturacion/proveedores/editar/${uuid}`);

const handleDelete = (item) => confirmDelete(item, {
    title: '¿Eliminar proveedor?',
    html: `<p class="mb-2">Se eliminará <strong>${item.name}</strong>.</p>
           <div class="alert alert-warning small mb-0 mt-2">
               La empresa dejará de emitir facturas electrónicas hasta conectar otro proveedor.
           </div>`,
    nameField: 'name',
});

const accionesDe = (data) => [
    {
        key: 'editar',
        label: 'Editar',
        icon: 'far fa-pen',
        tone: 'warning',
        inline: true,
        visible: can('billing_providers.update'),
        onClick: () => goToEdit(data.uuid),
    },
    {
        key: 'eliminar',
        label: 'Eliminar',
        icon: 'far fa-trash-alt',
        tone: 'danger',
        visible: can('billing_providers.delete'),
        onClick: () => handleDelete(data),
    },
];

onMounted(async () => {
    try {
        await store.fetchProviders();
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
    from { opacity: 0; transform: translate3d(0, 15px, 0); }
    to { opacity: 1; transform: translate3d(0, 0, 0); }
}
</style>
