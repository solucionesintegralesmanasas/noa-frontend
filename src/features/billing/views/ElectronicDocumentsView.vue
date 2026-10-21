<template>
    <BasePageHeader title="Documentos electrónicos" subtitle="Soporte, equivalentes POS, nómina 102 y eventos RADIAN vía ApiDian"
        icon="fad fa-paper-plane text-primary" :show-back="true" :show-refresh="true"
        :breadcrumbs="[{ label: 'Comercial' }, { label: 'Facturación', to: '/facturacion' }, { label: 'Documentos electrónicos' }]"
        @back="goBack" @refresh="recargar" />

    <div class="row g-2 g-md-3">
        <div class="col-12 col-lg-5" ref="tarjetaFormulario">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center justify-content-between gap-2">
                    <div class="d-flex align-items-center gap-2">
                        <i class="fas fa-file-lines text-primary" aria-hidden="true"></i>
                        <h6 class="mb-0 fw-medium">{{ editando ? 'Editar documento' : 'Registrar documento electrónico' }}</h6>
                    </div>
                    <span v-if="editando" class="badge rounded-pill bg-warning text-dark">
                        <i class="fas fa-pen me-1" aria-hidden="true"></i>Editando
                    </span>
                    <span v-else-if="!proveedoresActivos.length" class="badge rounded-pill bg-light text-body border">
                        Sin proveedor activo
                    </span>
                </div>
                <div class="card-body">
                    <form @submit.prevent="handleSubmit" class="row g-3" novalidate>
                        <!-- Clasificación del documento -->
                        <fieldset>
                            <legend class="leyenda">Tipo de documento</legend>
                            <div class="row g-3">
                                <div class="col-12">
                                    <label class="form-label required" for="f-api_document_type">Tipo documental</label>
                                    <PrimeSelect input-id="f-api_document_type" v-model="formData.api_document_type"
                                        :options="TIPOS_DOCUMENTO_API" option-label="etiqueta" option-value="valor"
                                        placeholder="Seleccione el tipo documental"
                                        :invalid="!!errors.api_document_type" v-bind="fieldAria('api_document_type')" />
                                    <div v-if="errors.api_document_type" class="invalid-feedback d-block" id="f-api_document_type-error" role="alert">
                                        {{ errors.api_document_type }}
                                    </div>
                                </div>

                                <div class="col-6" v-if="esEvento">
                                    <label class="form-label required" for="f-event_code">Código RADIAN</label>
                                    <input id="f-event_code" v-model="formData.event_code" class="form-control"
                                        :class="{ 'is-invalid': errors.event_code }" type="text" inputmode="numeric"
                                        placeholder="030…" maxlength="3"
                                        :aria-invalid="!!errors.event_code"
                                        :aria-describedby="errors.event_code ? 'f-event_code-error' : undefined" />
                                    <div v-if="errors.event_code" class="invalid-feedback d-block" id="f-event_code-error" role="alert">
                                        {{ errors.event_code }}
                                    </div>
                                </div>

                                <div class="col-6">
                                    <label class="form-label" for="f-document_number">Número propio</label>
                                    <input id="f-document_number" v-model="formData.document_number" class="form-control"
                                        type="text" placeholder="Ej: DS1001, POS9901" maxlength="50" />
                                </div>

                                <div class="col-6" :class="{ 'offset-6': esEvento }">
                                    <label class="form-label" for="f-billing_provider_uuid">Proveedor</label>
                                    <PrimeSelect input-id="f-billing_provider_uuid" v-model="formData.billing_provider_uuid"
                                        :options="proveedoresActivos" option-label="name" option-value="uuid"
                                        :placeholder="proveedoresActivos.length ? '(Se usa el activo de la empresa)' : 'Registre un proveedor ApiDian'"
                                        show-clear :disabled="!proveedoresActivos.length" />
                                </div>
                            </div>
                        </fieldset>

                        <!-- Payload -->
                        <fieldset>
                            <legend class="leyenda">Contenido del documento (payload ApiDian)</legend>
                            <div class="row g-3">
                                <div class="col-12">
                                    <label class="form-label required" for="f-payload">Payload JSON</label>
                                    <textarea id="f-payload" v-model="payloadTexto" class="form-control font-monospace" rows="10"
                                        :class="{ 'is-invalid': !!errorJson }" spellcheck="false"
                                        :aria-invalid="!!errorJson"
                                        :aria-describedby="errorJson ? 'f-payload-error' : undefined"
                                        placeholder='{"number": "DS1001", "seller": {"identification_number": "12345678"}}'></textarea>
                                    <div v-if="errorJson" class="invalid-feedback d-block" id="f-payload-error" role="alert">
                                        {{ errorJson }}
                                    </div>
                                    <div class="alert alert-light border small py-2 px-3 mt-2 mb-0 d-flex align-items-start gap-2" role="note">
                                        <i class="fas fa-shield-alt text-primary mt-1" aria-hidden="true"></i>
                                        <span>
                                            Viene armado con el esquema de ApiDian.
                                            <strong>No incluya <code>send</code></strong>: la transmisión a la DIAN la decide
                                            el proveedor de la empresa.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </fieldset>

                        <div class="col-12">
                            <BaseFormActions :submitting="isSubmitting" :is-edit-mode="editando"
                                :submit-label="editando ? 'Guardar cambios' : 'Registrar documento'"
                                @cancel="cancelarEdicion" />
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <div class="col-12 col-lg-7">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center justify-content-between gap-2">
                    <div class="d-flex align-items-center gap-2">
                        <i class="fas fa-inbox text-primary" aria-hidden="true"></i>
                        <h6 class="mb-0 fw-medium">Documentos registrados</h6>
                    </div>
                    <span class="badge rounded-pill bg-light text-body border">{{ store.electronicDocs.length }}</span>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <DataTable :value="store.electronicDocs" :loading="store.loading" responsiveLayout="scroll"
                            tableStyle="min-width: 40rem" class="table table-sm mb-0">
                            <template #empty>
                                <div class="text-center py-5 px-3">
                                    <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-light mb-3"
                                        style="width: 56px; height: 56px;">
                                        <i class="fad fa-paper-plane fs-5 text-secondary" aria-hidden="true"></i>
                                    </div>
                                    <p class="fw-medium mb-1">Aún no hay documentos electrónicos</p>
                                    <p v-if="!proveedoresActivos.length" class="text-muted small mb-2 mx-auto" style="max-width: 30rem;">
                                        Para emitir necesitas primero un proveedor tecnológico ApiDian activo con sus credenciales.
                                    </p>
                                    <p v-else class="text-muted small mb-0 mx-auto" style="max-width: 30rem;">
                                        Registra el primero con el formulario: elige el tipo documental y
                                        arma el payload con el esquema de ApiDian.
                                    </p>
                                    <router-link v-if="!proveedoresActivos.length" to="/facturacion/proveedores"
                                        class="btn btn-sm btn-primary mt-2">
                                        <i class="fas fa-server me-1" aria-hidden="true"></i>Ir a proveedores
                                    </router-link>
                                </div>
                            </template>
                            <Column header="Documento">
                                <template #body="{ data }">
                                    <strong>{{ data.document_number || 'Sin número' }}</strong>
                                    <div class="text-muted small">
                                        {{ etiquetaTipo(data.api_document_type) }}<template v-if="data.api_document_type === 'event'"> / código {{ data.event_code }}</template>
                                    </div>
                                </template>
                            </Column>
                            <Column header="Estado" style="width: 10rem;" class="text-center">
                                <template #body="{ data }">
                                    <span class="badge rounded-pill" :class="estiloEstado(data.electronic_status)">
                                        {{ textoEstado(data.electronic_status) }}
                                    </span>
                                </template>
                            </Column>
                            <Column header="Clave DIAN" style="width: 12rem;">
                                <template #body="{ data }">
                                    <span v-if="data.document_key" class="font-monospace small truncar" :title="data.document_key">
                                        {{ data.document_key }}
                                    </span>
                                    <span v-else class="text-muted small">Pendiente de firmar</span>
                                </template>
                            </Column>
                            <Column header="Acciones" style="width: 10rem;" class="text-center">
                                <template #body="{ data }">
                                    <button v-if="puedeEditar && esEditable(data)" class="btn btn-sm btn-outline-warning me-1"
                                        type="button" aria-label="Editar documento" @click="goToEdit(data)">
                                        <i class="fas fa-pen" aria-hidden="true"></i>
                                    </button>
                                    <button v-if="puedeCrear && esEditable(data)" class="btn btn-sm btn-outline-primary me-1"
                                        type="button" aria-label="Emitir documento" @click="emitir(data)">
                                        <i class="fas fa-paper-plane" aria-hidden="true"></i>
                                    </button>
                                    <button v-if="puedeVer && data.document_key" class="btn btn-sm btn-outline-secondary me-1"
                                        type="button" aria-label="Consultar estado DIAN" @click="consultarEstado(data)">
                                        <i class="fas fa-magnifying-glass" aria-hidden="true"></i>
                                    </button>
                                    <button v-if="puedeEliminar && esEditable(data)" class="btn btn-sm btn-outline-danger"
                                        type="button" aria-label="Eliminar documento" @click="confirmarEliminar(data)">
                                        <i class="fas fa-trash" aria-hidden="true"></i>
                                    </button>
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </div>
                <div class="card-footer bg-light px-3 py-2">
                    <div class="d-flex flex-wrap gap-3 small text-muted">
                        <span class="d-inline-flex align-items-center gap-1">
                            <span class="punto bg-success" aria-hidden="true"></span>Aceptada DIAN
                        </span>
                        <span class="d-inline-flex align-items-center gap-1">
                            <span class="punto bg-primary" aria-hidden="true"></span>Validada sin envío
                        </span>
                        <span class="d-inline-flex align-items-center gap-1">
                            <span class="punto bg-secondary" aria-hidden="true"></span>Pendiente
                        </span>
                        <span class="d-inline-flex align-items-center gap-1">
                            <span class="punto bg-danger" aria-hidden="true"></span>Rechazada DIAN
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useBillingStore, TIPOS_DOCUMENTO_API, ESTILOS_ESTADO_DOC } from '../store/billing.store.js';
import { usePermissionsStore, useUserStore } from '@store';
import { useAccessibleForm } from '@/hooks/useAccessibleForm.js';
import { useTableActions } from '@/hooks/useTableActions.js';
import { toast } from '@/utils/toast.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import BaseFormActions from '@/components/BaseFormActions.vue';
import PrimeSelect from '@/components/form/PrimeSelect.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const ETIQUETAS_ESTADO = {
    ACEPTADA_DIAN: 'Aceptada DIAN',
    VALIDADA_SIN_ENVIO: 'Validada sin envío',
    PENDIENTE_DIAN: 'Pendiente',
    RECHAZADA_DIAN: 'Rechazada DIAN',
};

const router = useRouter();
const store = useBillingStore();
const userStore = useUserStore();
const permissionsStore = usePermissionsStore();
const can = (action) => permissionsStore.can(action);
const puedeCrear = can('electronic_documents.create');
const puedeEditar = can('electronic_documents.update');
const puedeEliminar = can('electronic_documents.delete');
const puedeVer = can('electronic_documents.index') || can('electronic_documents.profile');

const goBack = () => router.push('/facturacion');
const recargar = () => Promise.all([store.fetchElectronicDocs(), store.fetchProviders()]);

const { formData, errors, isSubmitting, fieldAria, validateAndFocus, submit, reset } = useAccessibleForm(
    {
        company_uuid: '',
        api_document_type: 'support-document',
        event_code: '',
        document_number: '',
        billing_provider_uuid: '',
    },
    {
        api_document_type: { required: true, label: 'Tipo documental' },
    }
);

const editando = computed(() => !!docEnEdicion.value);
const docEnEdicion = ref(null);
const payloadTexto = ref('');
const errorJson = ref('');
const esEvento = computed(() => formData.api_document_type === 'event');
const proveedoresActivos = computed(() => store.providers.filter((p) => p.is_active));
const tarjetaFormulario = ref(null);

const textoEstado = (estado) => ETIQUETAS_ESTADO[estado] ?? estado;
const estiloEstado = (estado) => ESTILOS_ESTADO_DOC[estado] ?? 'bg-secondary';
const etiquetaTipo = (valor) => TIPOS_DOCUMENTO_API.find((t) => t.valor === valor)?.etiqueta ?? valor;
const esEditable = (doc) => doc.electronic_status === 'PENDIENTE_DIAN' && !doc.document_key;

const enfocarFormulario = () => {
    nextTick(() => {
        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        tarjetaFormulario.value?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
};

const cancelarEdicion = () => {
    docEnEdicion.value = null;
    reset();
    formData.api_document_type = 'support-document';
    payloadTexto.value = '';
    errorJson.value = '';
};

const goToEdit = (data) => {
    docEnEdicion.value = data;
    formData.api_document_type = data.api_document_type;
    formData.event_code = data.event_code ?? '';
    formData.document_number = data.document_number ?? '';
    formData.billing_provider_uuid = data.billing_provider_uuid ?? '';
    payloadTexto.value = JSON.stringify(data.payload ?? {}, null, 2);
    errorJson.value = '';
    enfocarFormulario();
};

const emitir = async (data) => {
    await store.emitirDocumentoElectronico(data.uuid);
};

const consultarEstado = async (data) => {
    const estado = await store.estadoDocumentoElectronico(data.uuid);
    if (estado) {
        await toast(`Estado DIAN: ${estado.estado ?? 'consultado'}`, estado.detalle ?? 'Ver el detalle en el registro', 'info');
    }
};

const confirmarEliminar = async (data) => {
    const acciones = useTableActions({
        deleteItem: (uuid) => store.eliminarDocumentoElectronico(uuid),
    });
    await acciones.confirmDelete(data, {
        title: '¿Eliminar documento?',
        html: `<p class="mb-2">Se eliminará <strong>${data.document_number || data.uuid}</strong> mientras no esté firmado.</p>
               <div class="alert alert-warning small mb-0 mt-2">Si ya tiene respuesta del proveedor el backend lo rechazará.</div>`,
        nameField: 'document_number',
    });
};

const handleSubmit = () => submit(async () => {
    if (!(await validateAndFocus())) return;

    if (esEvento.value && !/^(0[345]\d)$/.test(formData.event_code.trim())) {
        errors.event_code = 'El código RADIAN debe ser un número entre 030 y 051';
        document.getElementById('f-event_code')?.focus();
        return;
    }

    errorJson.value = '';
    let payload;
    try {
        payload = JSON.parse(payloadTexto.value || '{}');
    } catch (_e) {
        errorJson.value = 'El payload no es JSON válido; corrige la sintaxis e intenta de nuevo';
        return;
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        errorJson.value = 'El payload debe ser un objeto JSON (comienza en { y termina en })';
        return;
    }
    if ('send' in payload) delete payload.send; // la bandera la pone el backend

    const datos = {
        company_uuid: formData.company_uuid || userStore.company_uuid || userStore.companies?.[0]?.uuid,
        api_document_type: formData.api_document_type,
        event_code: esEvento.value ? formData.event_code.trim() : null,
        document_number: formData.document_number?.trim() || null,
        billing_provider_uuid: formData.billing_provider_uuid || null,
        payload,
    };

    if (editando.value) {
        await store.actualizarDocumentoElectronico(docEnEdicion.value.uuid, datos);
        docEnEdicion.value = null;
    } else {
        await store.inscribirDocumentoElectronico(datos);
    }
});

// Plantilla de arranque según el tipo elegido (solo si el usuario no escribió nada).
watch(() => formData.api_document_type, (tipo) => {
    if (payloadTexto.value.trim()) return;
    payloadTexto.value = JSON.stringify(plantillaPorTipo(tipo), null, 2);
});

const plantillaPorTipo = (tipo) => {
    if (tipo === 'event') return { invoice_uuid: 'CUFE/CUDE del documento afectado', notes: 'Observación del evento' };
    if (tipo === 'payroll') return { consecutive: 'NIE-0001', employee: { identification_number: '12345678' }, notes: 'Payload completo 102 del proveedor' };
    if (tipo?.startsWith('equivalent')) return { number: 'POS0001', items: [{ description: 'Servicio', price_amount: 0 }] };
    return { number: 'DS1001', date: 'AAAA-MM-DD', seller: { identification_number: '12345678', name: 'NOMBRE' }, invoice_lines: [{ description: 'Concepto', line_extension_amount: 0 }] };
};

onMounted(async () => {
    formData.company_uuid = userStore.company_uuid || userStore.companies?.[0]?.uuid || '';
    try {
        await store.fetchElectronicDocs();
        await store.fetchProviders();
    } catch (_e) { /* el store ya notificó */ }
});
</script>

<style scoped>
.card { border-radius: 0.75rem !important; }
.required::after { content: " *"; color: #dc3545; font-weight: 600; }
.leyenda {
    float: none;
    width: auto;
    padding: 0;
    margin: 0 0 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #5e6e82;
    border-bottom: 1px solid #e3ebf6;
}
.truncar {
    display: inline-block;
    vertical-align: bottom;
    max-width: 11rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.punto {
    display: inline-block;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
}
:focus-visible { outline: 2px solid #0d6efd !important; outline-offset: 2px !important; }
</style>
