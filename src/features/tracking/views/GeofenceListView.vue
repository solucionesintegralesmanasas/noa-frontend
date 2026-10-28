<template>
    <BasePageHeader title="Geocercas" description="Zonas geográficas para alertas de conductores"
        icon="fad fa-draw-polygon text-primary" :show-refresh="true"
        :show-create="permissions.can('locations.geofences')" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true"
        :breadcrumbs="[{ label: 'Geolocalización' }, { label: 'Geocercas' }]"
        @refresh="refreshTable" @create="goToCreate" />

    <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar">
            <div class="noa-search">
                <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                <input id="f-geofences-busqueda" v-model="searchQuery" class="noa-search__input" type="search"
                    placeholder="Buscar geocerca por nombre..." aria-label="Buscar geocerca"
                    @input="onSearchInput" />
                <button v-if="searchQuery" class="noa-search__clear" type="button" title="Limpiar búsqueda"
                    aria-label="Limpiar búsqueda" @click="clearSearch">
                    <i class="fal fa-times" aria-hidden="true" />
                </button>
            </div>

            <span v-if="!isViewLoading && !store.loading" class="noa-results">
                <i class="fas fa-filter" aria-hidden="true" />
                {{ filteredGeofences.length }} geocerca{{ filteredGeofences.length !== 1 ? 's' : '' }}
                <template v-if="searchQuery"> para "{{ searchQuery }}"</template>
            </span>
        </div>

        <!-- SKELETON -->
        <div v-if="isViewLoading" class="card-body p-0">
            <div class="table-responsive scrollbar">
                <table class="table table-sm mb-0">
                    <thead>
                        <tr>
                            <th v-for="w in ['25%', '14%', '14%', '18%', '10%', '9%', '10%']" :key="w" style="padding:12px 8px">
                                <div class="skeleton-text" :style="`height:16px;width:${w}`" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="n in perPage" :key="`sk-${n}`">
                            <td v-for="i in 6" :key="i">
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

        <!-- DATATABLE -->
        <div v-else class="card-body p-0">
            <div class="table-responsive scrollbar">
                <DataTable :value="paginatedGeofences" :paginator="false" :loading="store.loading"
                    :sortField="store.sortField" :sortOrder="store.sortOrder" @sort="handleSort"
                    responsiveLayout="scroll" tableStyle="min-width: 55rem"
                    class="table table-sm mb-0 professional-table noa-table-fixed"
                    emptyMessage="No se encontraron geocercas">
                    <template #loading>
                        <NoaTableSpinner message="Cargando geocercas..." />
                    </template>

                    <Column field="name" header="Nombre" sortable style="width: 25%;">
                        <template #body="{ data }">
                            <span class="noa-cell-strong">{{ data.name }}</span>
                            <span v-if="data.description" class="noa-cell-sub">{{ data.description }}</span>
                        </template>
                    </Column>

                    <Column field="type" header="Tipo" sortable style="width: 14%;">
                        <template #body="{ data }">
                            <span class="badge rounded-pill badge-subtle"
                                :class="data.type === 'circle' ? 'badge-subtle-info' : 'badge-subtle-warning'">
                                <i :class="data.type === 'circle' ? 'fad fa-circle me-1' : 'fad fa-draw-polygon me-1'" style="font-size:10px;" aria-hidden="true" />
                                {{ data.type === 'circle' ? 'Círculo' : 'Polígono' }}
                            </span>
                        </template>
                    </Column>

                    <Column header="Radio / Puntos" style="width: 14%;">
                        <template #body="{ data }">
                            <template v-if="data.type === 'circle'">
                                <i class="fad fa-ruler-horizontal text-muted me-1" style="font-size:12px;" aria-hidden="true" />
                                {{ data.radius_meters }} m
                            </template>
                            <template v-else>
                                {{ (data.polygon_points || []).length }} puntos
                            </template>
                        </template>
                    </Column>

                    <Column header="Alertas" style="width: 18%;">
                        <template #body="{ data }">
                            <span class="badge rounded-pill badge-subtle badge-subtle-success me-1"
                                v-if="data.alert_on_enter">
                                <i class="fad fa-sign-in-alt me-1" style="font-size:10px;" aria-hidden="true" /> Entrada
                            </span>
                            <span class="badge rounded-pill badge-subtle badge-subtle-danger"
                                v-if="data.alert_on_exit">
                                <i class="fad fa-sign-out-alt me-1" style="font-size:10px;" aria-hidden="true" /> Salida
                            </span>
                            <span v-if="!data.alert_on_enter && !data.alert_on_exit" class="text-muted">—</span>
                        </template>
                    </Column>

                    <Column header="Vel. Máx." style="width: 10%;">
                        <template #body="{ data }">
                            <span v-if="data.max_speed_kmh">
                                <i class="fad fa-gauge-high text-muted me-1" style="font-size:12px;" aria-hidden="true" />
                                {{ data.max_speed_kmh }} km/h
                            </span>
                            <span v-else class="text-muted">—</span>
                        </template>
                    </Column>

                    <Column field="is_active" header="Estado" sortable style="width: 9%; text-align: center;">
                        <template #body="{ data }">
                            <span class="noa-status"
                                :class="data.is_active ? 'noa-status--success' : 'noa-status--warning'">
                                {{ data.is_active ? 'Activa' : 'Inactiva' }}
                            </span>
                        </template>
                    </Column>

                    <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 10%;">
                        <template #body="{ data }">
                            <RowActions :actions="accionesDe(data)" :row-label="data.name || 'geocerca'" />
                        </template>
                    </Column>

                    <template #empty>
                        <div class="text-center py-5">
                            <i class="fad fa-draw-polygon fs-1 text-muted opacity-50 mb-3 d-block" aria-hidden="true" />
                            <h6 class="text-muted mb-1 fw-medium">No hay geocercas registradas</h6>
                            <p class="text-muted small mb-3">Define zonas geográficas para monitorear a los conductores</p>
                            <button v-if="permissions.can('locations.geofences')" class="btn btn-primary btn-sm" type="button"
                                @click="goToCreate">
                                <i class="fad fa-plus me-1" aria-hidden="true" /> Crear primera geocerca
                            </button>
                        </div>
                    </template>
                </DataTable>
            </div>
            <ListPagination :page="currentPage" :per-page="perPage"
                :total="filteredGeofences.length" @change="onPageChange" />
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Swal from 'sweetalert2';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import RowActions from '@/components/RowActions.vue';
import ListPagination from '@/components/ListPagination.vue';
import { useServerSort } from '@/hooks/useServerSort.js';
import { useTrackingStore } from '../store/tracking.store';
import { usePermissionsStore } from '@/store/modules/permissions';
import { useToast } from 'vue-toastification';

const router = useRouter();
const route = useRoute();
const store = useTrackingStore();
const permissions = usePermissionsStore();
const toast = useToast();

const { handleSort } = useServerSort((field, order) => store.setSort(field, order), { route, router });

const isViewLoading = ref(true);
const searchQuery = ref('');
const currentPage = ref(1);
const perPage = ref(10);

const filteredGeofences = computed(() => {
    if (!searchQuery.value.trim()) return store.geofences || [];
    const term = searchQuery.value.toLowerCase();
    return (store.geofences || []).filter((g) =>
        g.name.toLowerCase().includes(term) || (g.description || '').toLowerCase().includes(term)
    );
});

const paginatedGeofences = computed(() => {
    const start = (currentPage.value - 1) * perPage.value;
    return filteredGeofences.value.slice(start, start + perPage.value);
});

function onSearchInput() {
    currentPage.value = 1;
}

function clearSearch() {
    searchQuery.value = '';
    currentPage.value = 1;
}

function onPageChange({ page, rows }) {
    perPage.value = rows;
    currentPage.value = page;
}

function goToCreate() {
    router.push({ name: 'tracking.geofences.create' });
}

function goToEdit(geofence) {
    router.push({ name: 'tracking.geofences.edit', params: { id: geofence.uuid } });
}

async function refreshTable() {
    isViewLoading.value = true;
    await store.fetchGeofences();
    isViewLoading.value = false;
}

async function confirmDelete(geofence) {
    const result = await Swal.fire({
        title: '¿Eliminar geocerca?',
        text: `La geocerca "${geofence.name}" será eliminada permanentemente.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
        try {
            await store.deleteGeofence(geofence.uuid);
            toast.success('Geocerca eliminada exitosamente');
        } catch {
            toast.error('Error al eliminar la geocerca');
        }
    }
}

const accionesDe = (data) => [
    { key: 'editar', label: 'Editar', icon: 'far fa-pen', tone: 'warning', inline: true, visible: permissions.can('locations.geofences'), onClick: () => goToEdit(data) },
    { key: 'eliminar', label: 'Eliminar', icon: 'far fa-trash-alt', tone: 'danger', visible: permissions.can('locations.geofences'), onClick: () => confirmDelete(data) },
];

onMounted(async () => {
    isViewLoading.value = true;
    try {
        if (route.query.sort) {
            store.sortField = String(route.query.sort);
            store.sortOrder = route.query.order === 'desc' ? -1 : 1;
        }
        await store.fetchGeofences();
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
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>