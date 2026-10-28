<template>
    <BasePageHeader :title="'Listado de ' + 'Experiencias'"
        description="Gestión del historial de experiencias y contratos comerciales previos de las empresas."
        icon="fad fa-briefcase text-primary" :show-refresh="true" :show-create="true" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true"
        :breadcrumbs="[{ label: 'Experiencias' }, { label: 'Listado' }]" @refresh="refreshTable" @create="goToCreate" />

    <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar">
            <div class="noa-search">
                <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                <input id="f-experiences-busqueda" v-model="searchQuery" class="noa-search__input" type="search"
                    autocomplete="off" placeholder="Buscar por cliente o empresa..."
                    aria-label="Buscar experiencia" @input="debouncedSearch" />
                <button v-if="searchQuery" class="noa-search__clear" type="button"
                    title="Limpiar búsqueda" aria-label="Limpiar búsqueda" @click="clearSearch">
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
                            <th v-for="w in ['22%', '22%', '16%', '18%', '10%', '12%']" :key="w" style="padding:12px 8px">
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
                    :loading="store.loading" responsiveLayout="scroll"
                    tableStyle="min-width: 55rem" class="table table-sm mb-0 professional-table noa-table-fixed"
                    emptyMessage="No se encontraron experiencias registradas"
                    :sortField="sortField" :sortOrder="sortOrdenPrimeVue" removableSort @sort="onSort">

                    <!-- Columna: Empresa -->
                    <Column field="company.business_name" header="Empresa" sortable style="width: 22%;">
                        <template #body="{ data }">
                            <span class="noa-cell-strong">
                                {{ data.company?.business_name || '—' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Columna: Cliente -->
                    <Column field="customer_name" header="Cliente" sortable style="width: 22%;">
                        <template #body="{ data }">
                            <span class="text-dark fw-medium">
                                {{ data.customer_name || '—' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Columna: Valor -->
                    <Column field="value_before_tax.amount" header="Valor Contrato" sortable class="text-end" header-class="text-end" style="width: 16%;">
                        <template #body="{ data }">
                            <span class="font-monospace text-dark">
                                {{ formatCurrency(data.value_before_tax?.amount, data.value_before_tax?.currency || data.currency) }}
                            </span>
                        </template>
                    </Column>

                    <!-- Columna: Fechas -->
                    <Column field="start_date" header="Periodo" sortable style="width: 18%;">
                        <template #body="{ data }">
                            <div class="d-flex flex-column small">
                                <span class="text-muted">Inicio: {{ formatDate(data.start_date) }}</span>
                                <span class="text-muted">Fin: {{ formatDate(data.end_date) }}</span>
                            </div>
                        </template>
                    </Column>

                    <!-- Columna: Estado/Vigencia -->
                    <Column field="is_ongoing" header="Estado" sortable class="text-center" header-class="text-center" style="width: 10%;">
                        <template #body="{ data }">
                            <span class="noa-status" :class="data.is_ongoing ? 'noa-status--success' : 'noa-status--muted'">
                                {{ data.is_ongoing ? "En Curso" : "Finalizado" }}
                            </span>
                        </template>
                    </Column>

                    <!-- Columna: Acciones -->
                    <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 12%;"
                        v-if="can('experiences.update') || can('experiences.delete')">
                        <template #body="{ data }">
                            <RowActions :actions="accionesDe(data)" :row-label="data.customer_name || 'experiencia'" />
                        </template>
                    </Column>

                    <template #empty>
                        <div class="text-center py-5">
                            <i class="fad fa-briefcase fs-1 text-muted opacity-50 mb-3 d-block" aria-hidden="true" />
                            <h6 class="text-muted mb-1 fw-medium">No se encontraron experiencias registradas</h6>
                            <p class="text-muted small mb-3">Comienza creando el primer registro de experiencia o contrato.</p>
                            <button v-if="can('experiences.create')" class="btn btn-primary btn-sm" type="button" @click="goToCreate">
                                <i class="fad fa-plus me-1" aria-hidden="true" />Nueva experiencia
                            </button>
                        </div>
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
</template>

<script setup>
/**
 * @file ExperiencesListView.vue
 * @description Vista de listado del módulo de Experiencias.
 * Implementa DataTable con paginación server-side, búsqueda global y acciones CRUD bajo el estándar Stitch.
 * @module experiences/ListView
 */

import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useExperiencesStore } from '../store/experiences.store.js';
import { usePermissionsStore } from '@store';
import { useTable } from '@/hooks/useTable.js';
import { useTableActions } from '@/hooks/useTableActions.js';
import { useServerSort } from '@/hooks/useServerSort.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import RowActions from '@/components/RowActions.vue';
import ListPagination from '@/components/ListPagination.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

/** @type {import('vue-router').Router} Instancia del router de Vue */
const route = useRoute();
const router = useRouter();

/** @type {import('pinia').Store} Store del módulo de Experiencias */
const store = useExperiencesStore();
const permissionsStore = usePermissionsStore();

const { sortField, sortOrdenPrimeVue, onSort, restore } = useServerSort({
    onChange: ({ field, order }) => store.setSort(field, order),
});

/** @type {import('vue').Ref<boolean>} Indicador de carga inicial de la vista */
const isViewLoading = ref(true);

/** @type {import('vue').Ref<string>} Texto de búsqueda actual */
const searchQuery = ref('');

/**
 * Hook que provee búsqueda con debounce.
 */
const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(searchQuery.value));

/**
 * Hook que provee acciones de tabla (confirmación de eliminación, tooltips).
 */
const { confirmDelete, initTooltips, destroyTooltips } = useTableActions(store, router);

/**
 * Verifica si el usuario tiene permiso para una acción específica.
 * @param {string} action - Nombre de la acción/permiso.
 * @returns {boolean} True si el usuario tiene el permiso.
 */
const can = (action) => permissionsStore.can(action);

/**
 * Limpia el campo de búsqueda y recarga el listado sin filtros.
 */
const clearSearch = async () => { searchQuery.value = ''; await store.clearFilters(); };

/**
 * Recarga el listado de experiencias.
 */
const refreshTable = () => store.fetchItems();

/**
 * Maneja el cambio de página en el DataTable.
 */
const onPageChange = async ({ page, first, rows }) => {
    store.pagination.itemsPerPage = rows;
    const targetPage = page !== undefined ? page : Math.floor(first / rows) + 1;
    await store.setPage(targetPage);
};

/**
 * Navega a la vista de creación de experiencia.
 */
const goToCreate = () => router.push('/empresas/experiencias/crear');

/**
 * Navega a la vista de edición de una experiencia.
 * @param {string} uuid - UUID de la experiencia a editar.
 */
const goToEdit = (uuid) => router.push(`/empresas/experiencias/editar/${uuid}`);

/**
 * Inicia el proceso de eliminación de una experiencia con confirmación.
 * @param {Object} item - Registro de experiencia a eliminar.
 */
const handleDelete = (item) => confirmDelete(item, {
    title: '¿Eliminar experiencia?',
    nameField: 'customer_name',
});

/**
 * Genera la lista de acciones para cada fila.
 * @param {Object} data - Fila actual de experiencia.
 */
const accionesDe = (data) => [
    {
        key: 'editar',
        label: 'Editar',
        icon: 'far fa-pen',
        tone: 'warning',
        inline: true,
        visible: can('experiences.update'),
        onClick: () => goToEdit(data.uuid),
    },
    {
        key: 'eliminar',
        label: 'Eliminar',
        icon: 'far fa-trash-alt',
        tone: 'danger',
        visible: can('experiences.delete'),
        onClick: () => handleDelete(data),
    },
];

/**
 * Formatea una fecha ISO al formato legible dd/mm/yyyy.
 * @param {string} dateStr - Fecha en formato ISO o similar.
 * @returns {string} Fecha formateada o '—' si no es válida.
 */
const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    } catch {
        return dateStr;
    }
};

/**
 * Formatea un valor monetario con símbolo de moneda y separadores.
 * @param {number|string} value - Valor numérico.
 * @param {string} currencyCode - Código de moneda (ej: COP, USD).
 * @returns {string} Valor formateado.
 */
const formatCurrency = (value, currencyCode = 'COP') => {
    if (value === null || value === undefined || value === '') return '—';

    const formatter = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

    return formatter.format(value);
};

/**
 * Hook del ciclo de vida: carga el listado al montar el componente.
 */
onMounted(async () => {
    try {
        const sortParam = route.query.sort;
        const orderParam = route.query.order;
        if (typeof sortParam === 'string' && sortParam) {
            restore(sortParam, orderParam);
            store.sortField = sortParam;
            store.sortOrder = orderParam === 'desc' ? 'desc' : 'asc';
        }
        searchQuery.value = store.search;
        await store.fetchItems();
    } finally {
        isViewLoading.value = false;
        initTooltips();
    }
});

/**
 * Hook del ciclo de vida: limpia tooltips al desmontar.
 */
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

.font-monospace {
    font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style>
