<template>
    <BasePageHeader
        :title="esCredito ? 'Notas crédito' : 'Notas débito'"
        :subtitle="esCredito ? 'Ajustes que disminuyen el valor de facturas emitidas' : 'Ajustes que aumentan el valor de facturas emitidas'"
        :icon="esCredito ? 'fad fa-file-minus text-primary' : 'fad fa-file-plus text-primary'"
        :show-bg="true"
        :loading="cargandoInicial"
        :compact="true"
        :breadcrumbs="[{ label: 'Finanzas' }, { label: 'Facturación', to: '/facturacion' }, { label: esCredito ? 'Notas crédito' : 'Notas débito' }]"
    >
        <template #actions>
            <button
                class="btn btn-falcon-default btn-sm px-2 px-sm-3"
                type="button"
                title="Actualizar"
                aria-label="Actualizar"
                @click="cargar"
            >
                <i class="fad fa-sync" aria-hidden="true" />
                <span class="d-none d-sm-inline ms-1">Actualizar</span>
            </button>

            <button
                v-if="puedeCrear"
                class="btn btn-primary btn-sm px-2 px-sm-3 text-nowrap"
                type="button"
                @click="abrirCrear()"
            >
                <i class="fad fa-plus me-1" aria-hidden="true" />
                <span>{{ esCredito ? 'Nueva nota crédito' : 'Nueva nota débito' }}</span>
            </button>
        </template>
    </BasePageHeader>

    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar">
            <div class="d-flex flex-wrap align-items-center gap-2 flex-grow-1" style="max-width: 42rem;">
                <div class="btn-group btn-group-sm" role="group" aria-label="Tipo de nota">
                    <button
                        v-if="can('credit_notes.index')"
                        type="button"
                        class="btn"
                        :class="esCredito ? 'btn-primary' : 'btn-outline-primary'"
                        @click="irATipo('credito')"
                    >
                        <i class="fad fa-file-minus me-1" aria-hidden="true" />Notas Crédito
                    </button>
                    <button
                        v-if="can('debit_notes.index')"
                        type="button"
                        class="btn"
                        :class="!esCredito ? 'btn-primary' : 'btn-outline-primary'"
                        @click="irATipo('debito')"
                    >
                        <i class="fad fa-file-plus me-1" aria-hidden="true" />Notas Débito
                    </button>
                </div>

                <div class="noa-search flex-grow-1">
                    <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                    <input
                        id="f-notas-busqueda"
                        v-model="busqueda"
                        class="noa-search__input"
                        type="search"
                        placeholder="Buscar por número, factura o motivo..."
                        aria-label="Buscar notas"
                        @keyup.enter="alBuscarInmediato"
                    />
                    <button
                        v-if="busqueda"
                        class="noa-search__clear"
                        type="button"
                        title="Limpiar búsqueda"
                        aria-label="Limpiar búsqueda"
                        @click="limpiarBusqueda"
                    >
                        <i class="fal fa-times" aria-hidden="true" />
                    </button>
                </div>
            </div>

            <span v-if="!cargandoInicial" class="noa-results">
                <i class="fas fa-filter" aria-hidden="true" />
                {{ paginacion.total }} nota{{ paginacion.total !== 1 ? 's' : '' }}
            </span>
        </div>

        <div class="card-body p-0">
            <div class="table-responsive scrollbar">
                <DataTable
                    :value="notas"
                    :loading="cargando"
                    :lazy="true"
                    :sort-field="sortField"
                    :sort-order="sortOrdenPrimeVue"
                    responsiveLayout="scroll"
                    tableStyle="min-width: 52rem"
                    class="table table-sm mb-0 professional-table noa-table-fixed"
                    emptyMessage="No hay notas registradas"
                    @sort="onSort"
                >
                    <Column header="Número / Fecha" field="issue_date" sortable style="width: 16%;">
                        <template #body="{ data }">
                            <span class="noa-cell-strong font-monospace">{{ data.note_number }}</span>
                            <div class="noa-cell-sub">{{ data.issue_date }}</div>
                        </template>
                    </Column>

                    <Column header="Factura afectada" style="width: 18%;">
                        <template #body="{ data }">
                            <router-link
                                v-if="data.invoice_uuid"
                                class="fw-medium text-decoration-none font-monospace"
                                :to="`/facturacion/${data.invoice_uuid}`"
                            >
                                {{ data.invoice?.invoice_number || data.invoice_uuid }}
                            </router-link>
                            <span v-else class="text-muted">—</span>
                        </template>
                    </Column>

                    <Column header="Concepto / Motivo" style="width: 24%;">
                        <template #body="{ data }">
                            <span class="noa-cell-strong">{{ etiquetaConcepto(data.correction_concept_code) }}</span>
                            <div v-if="data.observation" class="noa-cell-sub text-truncate" style="max-width: 16rem;">
                                {{ data.observation }}
                            </div>
                        </template>
                    </Column>

                    <Column header="Total" field="total" sortable class="text-end" header-class="text-end" style="width: 13%;">
                        <template #body="{ data }">
                            <span class="font-monospace fw-medium">${{ formatear(data.total) }}</span>
                        </template>
                    </Column>

                    <Column header="Estado" field="status" sortable class="text-center" header-class="text-center" style="width: 12%;">
                        <template #body="{ data }">
                            <span class="noa-status" :class="claseEstadoInterno(data.status)">
                                {{ data.status }}
                            </span>
                        </template>
                    </Column>

                    <Column header="Estado DIAN" field="electronic_status" sortable class="text-center" header-class="text-center" style="width: 17%;">
                        <template #body="{ data }">
                            <span class="noa-status" :class="estadoElectronico(data.electronic_status).clase">
                                {{ estadoElectronico(data.electronic_status).etiqueta }}
                            </span>
                            <div v-if="data.cude" class="noa-cell-sub font-monospace text-truncate" style="max-width: 10rem;">
                                {{ data.cude }}
                            </div>
                        </template>
                    </Column>

                    <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 12%;">
                        <template #body="{ data }">
                            <RowActions :actions="accionesDe(data)" :row-label="data.note_number" />
                        </template>
                    </Column>

                    <template #empty>
                        <div class="text-center py-5">
                            <i class="fad fa-file-invoice fs-1 text-muted opacity-50 mb-3 d-block" aria-hidden="true" />
                            <h6 class="text-muted mb-1 fw-medium">
                                No hay {{ esCredito ? 'notas crédito' : 'notas débito' }} registradas
                            </h6>
                            <button v-if="puedeCrear" class="btn btn-primary btn-sm mt-2" type="button" @click="abrirCrear()">
                                <i class="fad fa-plus me-1" aria-hidden="true" />Crear primera nota
                            </button>
                        </div>
                    </template>

                    <template #loading>
                        <NoaTableSpinner message="Cargando notas..." />
                    </template>
                </DataTable>
            </div>

            <ListPagination
                v-if="!cargandoInicial"
                :page="paginacion.currentPage"
                :per-page="paginacion.perPage"
                :total="paginacion.total"
                @change="alCambiarPagina"
            />
        </div>
    </div>

    <BillingNoteFormDialog
        v-model:visible="mostrarCrear"
        :tipo="tipoActual"
        :initial-invoice-uuid="facturaInicial"
        @created="cargar"
    />

    <Dialog
        v-model:visible="mostrarDetalle"
        :header="notaDetalle ? `${notaDetalle.note_number} — Detalle` : 'Detalle de nota'"
        modal
        :style="{ width: '44rem', maxWidth: '96vw' }"
    >
        <div v-if="cargandoDetalle" class="py-4 text-center">
            <NoaTableSpinner message="Cargando detalle..." />
        </div>
        <div v-else-if="notaDetalle" class="small">
            <dl class="row mb-3">
                <dt class="col-sm-4">Factura afectada</dt>
                <dd class="col-sm-8 font-monospace">{{ notaDetalle.invoice?.invoice_number || notaDetalle.invoice_uuid }}</dd>
                <dt class="col-sm-4">Fecha emisión</dt>
                <dd class="col-sm-8">{{ notaDetalle.issue_date }}</dd>
                <dt class="col-sm-4">Concepto DIAN</dt>
                <dd class="col-sm-8">{{ etiquetaConcepto(notaDetalle.correction_concept_code) }}</dd>
                <dt class="col-sm-4">Estado / DIAN</dt>
                <dd class="col-sm-8">{{ notaDetalle.status }} · {{ estadoElectronico(notaDetalle.electronic_status).etiqueta }}</dd>
                <template v-if="notaDetalle.cude">
                    <dt class="col-sm-4">CUDE</dt>
                    <dd class="col-sm-8 text-break font-monospace">{{ notaDetalle.cude }}</dd>
                </template>
                <template v-if="notaDetalle.observation">
                    <dt class="col-sm-4">Observación</dt>
                    <dd class="col-sm-8">{{ notaDetalle.observation }}</dd>
                </template>
            </dl>

            <div class="table-responsive border rounded mb-3">
                <table class="table table-sm mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Descripción</th>
                            <th class="text-end">Cant.</th>
                            <th class="text-end">Precio</th>
                            <th class="text-end">IVA</th>
                            <th class="text-end">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in notaDetalle.items || []" :key="item.uuid">
                            <td>{{ item.description }}</td>
                            <td class="text-end">{{ item.quantity }}</td>
                            <td class="text-end">${{ formatear(item.unit_price) }}</td>
                            <td class="text-end">${{ formatear(item.tax_amount) }}</td>
                            <td class="text-end font-monospace">${{ formatear(item.line_total) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <button
                    v-if="puedeVer"
                    type="button"
                    class="btn btn-outline-primary btn-sm"
                    @click="descargarPdf(notaDetalle)"
                >
                    <i class="fal fa-file-pdf me-1" aria-hidden="true" />Descargar PDF
                </button>
                <div class="d-flex justify-content-end gap-4 ms-auto">
                    <span>Subtotal: <strong>${{ formatear(notaDetalle.subtotal) }}</strong></span>
                    <span>Impuestos: <strong>${{ formatear(notaDetalle.total_tax) }}</strong></span>
                    <span>Total: <strong class="text-primary">${{ formatear(notaDetalle.total) }}</strong></span>
                </div>
            </div>
        </div>
    </Dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import BasePageHeader from '@/components/BasePageHeader.vue';
import RowActions from '@/components/RowActions.vue';
import ListPagination from '@/components/ListPagination.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import BillingNoteFormDialog from '../components/BillingNoteFormDialog.vue';
import { useServerSort } from '@/hooks/useServerSort.js';
import { usePermissionsStore } from '@store';
import { toast } from '@/utils/toast.js';
import { creditNotesService, debitNotesService } from '../services/billing.service.js';

const route = useRoute();
const router = useRouter();
const permissionsStore = usePermissionsStore();
const can = (permiso) => permissionsStore.can(permiso);

const tipoActual = computed(() => (route.meta?.tipoNota === 'debito' ? 'debito' : 'credito'));
const esCredito = computed(() => tipoActual.value === 'credito');
const servicioActual = computed(() => (esCredito.value ? creditNotesService : debitNotesService));

const puedeCrear = computed(() => can(esCredito.value ? 'credit_notes.create' : 'debit_notes.create'));
const puedeActualizar = computed(() => can(esCredito.value ? 'credit_notes.update' : 'debit_notes.update'));
const puedeVer = computed(() =>
    can(esCredito.value ? 'credit_notes.profile' : 'debit_notes.profile')
    || can(esCredito.value ? 'credit_notes.index' : 'debit_notes.index'),
);

const notas = ref([]);
const cargandoInicial = ref(true);
const cargando = ref(false);
const busqueda = ref('');
const paginacion = reactive({ currentPage: 1, perPage: 15, total: 0 });
let timerBusqueda = null;

const { sortField, sortOrder, sortOrdenPrimeVue, onSort, restore } = useServerSort({
    route,
    router,
    onChange: () => {
        paginacion.currentPage = 1;
        cargar();
    },
});

const mostrarCrear = ref(false);
const facturaInicial = ref('');

const mostrarDetalle = ref(false);
const cargandoDetalle = ref(false);
const notaDetalle = ref(null);

const CONCEPTOS = {
    credito: { 1: 'Devolución parcial', 2: 'Anulación de factura', 3: 'Rebaja o descuento', 4: 'Ajuste de precio', 5: 'Otros' },
    debito: { 1: 'Intereses', 2: 'Gastos por cobrar', 3: 'Cambio del valor', 4: 'Otros' },
};

const ESTADOS_DIAN = {
    ACEPTADA_DIAN: { etiqueta: 'Aceptada DIAN', clase: 'noa-status--success' },
    VALIDADA_SIN_ENVIO: { etiqueta: 'Validada (sin envío)', clase: 'noa-status--warning' },
    RECHAZADA_DIAN: { etiqueta: 'Rechazada DIAN', clase: 'noa-status--danger' },
    PENDIENTE_DIAN: { etiqueta: 'Pendiente DIAN', clase: 'noa-status--muted' },
};

const etiquetaConcepto = (codigo) => CONCEPTOS[tipoActual.value]?.[String(codigo)] || `Concepto ${codigo || '—'}`;
const estadoElectronico = (estado) => ESTADOS_DIAN[estado] || { etiqueta: estado || 'Pendiente', clase: 'noa-status--muted' };
const claseEstadoInterno = (estado) => ({
    EMITIDA_INTERNA: 'noa-status--success',
    ANULADA: 'noa-status--danger',
    BORRADOR: 'noa-status--muted',
}[estado] || 'noa-status--muted');

const formatear = (valor) => Number(valor || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const cargar = async () => {
    cargando.value = true;
    try {
        const res = await servicioActual.value.list({
            page: paginacion.currentPage,
            per_page: paginacion.perPage,
            search: busqueda.value.trim() || undefined,
            sort_by: sortField.value || undefined,
            sort_order: sortOrder.value || undefined,
        });
        const body = res?.data ?? res;
        const lista = body?.data ?? (Array.isArray(body) ? body : []);
        notas.value = Array.isArray(lista) ? lista : [];
        paginacion.currentPage = Number(body?.current_page ?? paginacion.currentPage) || 1;
        paginacion.perPage = Number(body?.per_page ?? paginacion.perPage) || 15;
        paginacion.total = Number(body?.total ?? notas.value.length) || 0;
    } catch (error) {
        await toast('Error', error?.response?.data?.message || 'No se pudieron cargar las notas.', 'error');
    } finally {
        cargando.value = false;
        cargandoInicial.value = false;
    }
};

const alCambiarPagina = ({ page, rows }) => {
    paginacion.currentPage = page;
    paginacion.perPage = rows;
    cargar();
};

const alBuscarInmediato = () => {
    if (timerBusqueda) {
        clearTimeout(timerBusqueda);
        timerBusqueda = null;
    }
    paginacion.currentPage = 1;
    cargar();
};

const limpiarBusqueda = () => {
    busqueda.value = '';
    alBuscarInmediato();
};

const irATipo = (tipo) => {
    if (tipo === tipoActual.value) return;
    router.push(tipo === 'debito' ? '/facturacion/notas-debito' : '/facturacion/notas-credito');
};

const abrirCrear = (invoiceUuid = '') => {
    facturaInicial.value = invoiceUuid;
    mostrarCrear.value = true;
};

const verDetalle = async (nota) => {
    mostrarDetalle.value = true;
    cargandoDetalle.value = true;
    notaDetalle.value = null;
    try {
        const res = await servicioActual.value.get(nota.uuid);
        notaDetalle.value = res?.data ?? res;
    } catch (error) {
        mostrarDetalle.value = false;
        await toast('Error', error?.response?.data?.message || 'No se pudo cargar el detalle.', 'error');
    } finally {
        cargandoDetalle.value = false;
    }
};

const descargarPdf = async (nota) => {
    try {
        await servicioActual.value.descargarPdf(nota.uuid, nota.note_number);
    } catch (error) {
        await toast('Error', error?.response?.data?.message || 'No se pudo descargar el PDF de la nota.', 'error');
    }
};

const emitir = async (nota) => {
    cargando.value = true;
    try {
        await servicioActual.value.emitir(nota.uuid);
        await toast('¡Éxito!', `Nota ${nota.note_number} emitida correctamente.`, 'success');
        await cargar();
    } catch (error) {
        await toast('Error', error?.response?.data?.message || 'No se pudo emitir la nota.', 'error');
    } finally {
        cargando.value = false;
    }
};

const anular = async (nota) => {
    cargando.value = true;
    try {
        await servicioActual.value.anular(nota.uuid);
        await toast('Anulada', `Nota ${nota.note_number} anulada.`, 'success');
        await cargar();
    } catch (error) {
        await toast('Error', error?.response?.data?.message || 'No se pudo anular la nota.', 'error');
    } finally {
        cargando.value = false;
    }
};

const accionesDe = (data) => [
    {
        key: 'ver',
        label: 'Ver detalle',
        icon: 'far fa-eye',
        tone: 'neutral',
        inline: true,
        visible: puedeVer.value,
        onClick: () => verDetalle(data),
    },
    {
        key: 'pdf',
        label: 'Descargar PDF',
        icon: 'far fa-file-pdf',
        tone: 'neutral',
        inline: true,
        visible: puedeVer.value,
        onClick: () => descargarPdf(data),
    },
    {
        key: 'emitir',
        label: 'Emitir y transmitir a DIAN',
        icon: 'far fa-paper-plane',
        tone: 'primary',
        visible: data.status === 'BORRADOR' && puedeActualizar.value,
        onClick: () => emitir(data),
    },
    {
        key: 'anular',
        label: 'Anular borrador',
        icon: 'far fa-ban',
        tone: 'danger',
        visible: data.status === 'BORRADOR' && puedeActualizar.value,
        onClick: () => anular(data),
    },
];

watch(busqueda, () => {
    if (timerBusqueda) clearTimeout(timerBusqueda);
    timerBusqueda = setTimeout(() => {
        paginacion.currentPage = 1;
        cargar();
    }, 300);
});

watch(tipoActual, () => {
    if (timerBusqueda) {
        clearTimeout(timerBusqueda);
        timerBusqueda = null;
    }
    busqueda.value = '';
    paginacion.currentPage = 1;
    cargar();
});

onMounted(async () => {
    const sortParam = route.query.sort;
    const orderParam = route.query.order;
    if (typeof sortParam === 'string' && sortParam) {
        restore(sortParam, orderParam);
    }
    await cargar();
    const inv = String(route.query?.invoice_uuid || '');
    if (inv && puedeCrear.value) {
        abrirCrear(inv);
    }
});

onBeforeUnmount(() => {
    if (timerBusqueda) {
        clearTimeout(timerBusqueda);
        timerBusqueda = null;
    }
});
</script>
