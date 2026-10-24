<template>
    <BasePageHeader title="Radicación de tarjeta de operación"
        description="Gestione y consulte los trámites de vinculación vehicular con su línea de tiempo"
        icon="fad fa-id-card text-primary" :show-refresh="true" :show-create="puedeCrear" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true"
        :breadcrumbs="[{ label: 'Radicación de tarjeta de operación' }, { label: 'Listado' }]"
        @refresh="store.fetchItems()" @create="irANuevo" />

    <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar">
            <div class="noa-search">
                <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                <input id="f-radicacion-busqueda" v-model="busqueda" class="noa-search__input" type="search" placeholder="Buscar por código o asunto..."
                    aria-label="Buscar expediente de radicación" @input="debouncedSearch" />
                <button v-if="busqueda" class="noa-search__clear" type="button" title="Limpiar búsqueda"
                    aria-label="Limpiar búsqueda" @click="limpiarBusqueda">
                    <i class="fal fa-times" aria-hidden="true" />
                </button>
            </div>
            <span v-if="!isViewLoading && !store.loading" class="noa-results">
                <i class="fas fa-filter" aria-hidden="true" />
                {{ store.pagination.totalItems }} resultado{{ store.pagination.totalItems !== 1 ? 's' : '' }}
                <template v-if="store.search"> para "{{ store.search }}"</template>
            </span>
        </div>

        <div class="card-body p-0">
            <div class="table-responsive scrollbar">
                <DataTable :value="store.items" lazy :paginator="false" :rows="store.pagination.itemsPerPage"
                    :totalRecords="store.pagination.totalItems"
                    :first="(store.pagination.currentPage - 1) * store.pagination.itemsPerPage"
                    :loading="isViewLoading || store.loading"
                    responsiveLayout="scroll" tableStyle="min-width: 60rem"
                    class="table table-sm mb-0 professional-table noa-table-fixed"
                    emptyMessage="No se encontraron registros">
                    <Column field="procedure_code" header="Código" style="width: 14%;">
                        <template #body="{ data }">
                            <span class="noa-cell-strong">{{ data.procedure_code || '-' }}</span>
                        </template>
                    </Column>

                    <Column header="Placa" style="width: 12%;">
                        <template #body="{ data }">
                            <span class="text-dark">{{ data.vehicle?.vehicle_license_plate || '-' }}</span>
                        </template>
                    </Column>

                    <Column field="link_type" header="Tipo" style="width: 18%;">
                        <template #body="{ data }">
                            <span class="text-dark">{{ etiquetaTipo(data.link_type) }}</span>
                        </template>
                    </Column>

                    <Column field="avance" header="Avance" style="width: 16%;">
                        <template #body="{ data }">
                            <div class="avance" :aria-label="`Avance ${data.avance}`">
                                <div class="progress avance-barra" role="progressbar"
                                    :aria-valuenow="porcentajeAvance(data.avance)" aria-valuemin="0" aria-valuemax="100">
                                    <div class="progress-bar"
                                        :class="porcentajeAvance(data.avance) === 100 ? 'bg-success' : 'bg-primary'"
                                        :style="{ width: porcentajeAvance(data.avance) + '%' }" />
                                </div>
                                <span class="avance-texto">{{ data.avance }}</span>
                            </div>
                        </template>
                    </Column>

                    <Column header="Pasos" style="width: 28%;">
                        <template #body="{ data }">
                            <span v-if="expedienteCompletado(data)" class="noa-status noa-status--success">
                                Completado
                            </span>
                            <div v-else class="d-flex flex-wrap gap-1">
                                <span v-for="p in data.linea_tiempo" :key="p.paso"
                                    class="badge rounded-pill badge-subtle" :class="claseDePaso(p.estado)"
                                    :title="etiquetaPaso(p.paso)">{{ etiquetaPasoCorta(p.paso) }}</span>
                            </div>
                        </template>
                    </Column>

                    <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 12%;">
                        <template #body="{ data }">
                            <RowActions :actions="accionesDe(data)" :row-label="data.procedure_code || 'expediente'" />
                        </template>
                    </Column>

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
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import RowActions from '@/components/RowActions.vue';
import ListPagination from '@/components/ListPagination.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { useRadicacionStore } from '../store/radicacion.store.js';
import { usePermissionsStore } from '@store';
import { useTable } from '@/hooks/useTable.js';
import {
    etiquetaPaso,
    etiquetaPasoCorta,
    etiquetaTipo,
    expedienteCompletado,
    porcentajeAvance,
} from '../utils/pasosRadicacion.js';

const router = useRouter();
const store = useRadicacionStore();
const permissionsStore = usePermissionsStore();
const puedeCrear = computed(() => permissionsStore.can('radicacion_to.create'));

const isViewLoading = ref(true);
const busqueda = ref('');
const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(busqueda.value));
const limpiarBusqueda = async () => { busqueda.value = ''; await store.clearFilters(); };

const irANuevo = () => router.push('/radicacion/nuevo');
const verExpediente = (uuid) => router.push(`/radicacion/${uuid}`);
const accionesDe = (data) => [
    { key: 'ver', label: 'Ver expediente', icon: 'far fa-eye', tone: 'primary', inline: true, onClick: () => verExpediente(data.uuid) },
];

const onPageChange = async ({ first, rows }) => {
    if (rows !== store.pagination.itemsPerPage) {
        await store.setPerPage(rows);
        return;
    }
    await store.setPage(Math.floor(first / rows) + 1);
};

const claseDePaso = (estado) => ({
    COMPLETADO: 'badge-subtle-success',
    EN_PROCESO: 'badge-subtle-primary',
}[estado] ?? 'badge-subtle-secondary');

onMounted(async () => {
    try {
        busqueda.value = store.search;
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
        transform: translate3d(0, 15px, 0);
    }

    to {
        opacity: 1;
        transform: translate3d(0, 0, 0);
    }
}

.avance {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.avance-barra {
    flex: 1;
    height: 8px;
    min-width: 70px;
    background: #e9ecef;
    border-radius: 999px;
}

.avance-barra .progress-bar {
    border-radius: 999px;
    transition: width 300ms ease-in-out;
}

.avance-texto {
    font-size: 0.8rem;
    font-weight: 700;
    color: #212529;
    min-width: 2.2rem;
    text-align: right;
}
</style>