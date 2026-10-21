<template>
    <BasePageHeader title="Proveedores de facturación" subtitle="Conexión con el proveedor tecnológico por empresa"
        icon="fad fa-server text-primary" :show-back="true" :show-refresh="true"
        :breadcrumbs="[{ label: 'Comercial' }, { label: 'Facturación', to: '/facturacion' }, { label: 'Proveedores' }]"
        @back="goBack" @refresh="recargar" />

    <div class="row g-2 g-md-3">
        <div class="col-12 col-lg-5" ref="tarjetaFormulario">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center justify-content-between gap-2">
                    <div class="d-flex align-items-center gap-2">
                        <i class="fas fa-id-card text-primary" aria-hidden="true"></i>
                        <h6 class="mb-0 fw-medium">{{ editando ? 'Editar proveedor' : 'Nuevo proveedor tecnológico' }}</h6>
                    </div>
                    <span v-if="editando" class="badge rounded-pill bg-warning text-dark">
                        <i class="fas fa-pen me-1" aria-hidden="true"></i>Editando
                    </span>
                </div>
                <div class="card-body">
                    <form @submit.prevent="handleSubmit" class="row g-3" novalidate>
                        <!-- Proveedor -->
                        <fieldset>
                            <legend class="leyenda">Proveedor</legend>
                            <div class="row g-3">
                                <div class="col-12">
                                    <label class="form-label required" for="f-name">Nombre</label>
                                    <input id="f-name" v-model="formData.name" class="form-control"
                                        :class="{ 'is-invalid': errors.name }" type="text" placeholder="Ej: ApiDian"
                                        maxlength="100"
                                        :aria-invalid="!!errors.name"
                                        :aria-describedby="errors.name ? 'f-name-error' : undefined" />
                                    <div v-if="errors.name" class="invalid-feedback d-block" id="f-name-error" role="alert">
                                        {{ errors.name }}
                                    </div>
                                </div>

                                <div class="col-12">
                                    <label class="form-label required" for="f-driver">Proveedor tecnológico</label>
                                    <PrimeSelect input-id="f-driver" v-model="formData.driver"
                                        :options="opcionesDriver" option-label="etiqueta" option-value="valor"
                                        placeholder="Seleccione el proveedor tecnológico"
                                        :invalid="!!errors.driver" v-bind="fieldAria('driver')" />
                                    <div v-if="errors.driver" class="invalid-feedback d-block" id="f-driver-error" role="alert">
                                        {{ errors.driver }}
                                    </div>
                                </div>

                                <div class="col-12" v-if="formData.driver === 'apidian'">
                                    <label class="form-label required" for="f-server_url">URL del API</label>
                                    <input id="f-server_url" v-model="formData.server_url" class="form-control"
                                        :class="{ 'is-invalid': errors.server_url }" type="url"
                                        placeholder="https://apidian.systemsfact.com.co" maxlength="200"
                                        :aria-invalid="!!errors.server_url"
                                        :aria-describedby="errors.server_url ? 'f-server_url-error' : undefined" />
                                    <div v-if="errors.server_url" class="invalid-feedback d-block" id="f-server_url-error" role="alert">
                                        {{ errors.server_url }}
                                    </div>
                                </div>
                            </div>
                        </fieldset>

                        <!-- Login -->
                        <fieldset v-if="formData.driver === 'apidian'">
                            <legend class="leyenda">Login ApiDian</legend>
                            <div class="row g-3">
                                <div class="col-12">
                                    <label class="form-label required" for="f-client_id">Correo de login</label>
                                    <input id="f-client_id" v-model="formData.client_id" class="form-control"
                                        :class="{ 'is-invalid': errors.client_id }" type="email"
                                        maxlength="200" autocomplete="off" placeholder="sandbox-…@pruebas.local"
                                        :aria-invalid="!!errors.client_id"
                                        :aria-describedby="errors.client_id ? 'f-client_id-error' : undefined" />
                                    <div v-if="errors.client_id" class="invalid-feedback d-block" id="f-client_id-error" role="alert">
                                        {{ errors.client_id }}
                                    </div>
                                </div>

                                <div class="col-12">
                                    <label class="form-label" :class="{ required: !editando }" for="f-client_password">Contraseña</label>
                                    <input id="f-client_password" v-model="formData.client_password" class="form-control"
                                        :class="{ 'is-invalid': errors.client_password }" type="password"
                                        :placeholder="editando ? 'Dejar vacío para conservar el token actual' : 'Contraseña del portal ApiDian'"
                                        maxlength="255" autocomplete="new-password"
                                        :aria-invalid="!!errors.client_password"
                                        :aria-describedby="errors.client_password ? 'f-client_password-error' : undefined" />
                                    <div v-if="errors.client_password" class="invalid-feedback d-block" id="f-client_password-error" role="alert">
                                        {{ errors.client_password }}
                                    </div>
                                </div>

                                <div class="col-12">
                                    <div class="alert alert-light border small py-2 px-3 mb-0 d-flex align-items-start gap-2" role="note">
                                        <i class="fas fa-key text-primary mt-1" aria-hidden="true"></i>
                                        <span>
                                            Al guardar, NOA <strong>inicia sesión</strong> con estos datos y guarda el token
                                            automáticamente; no hay que pegarlo. Si expira, se renueva solo.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </fieldset>

                        <!-- Habilitación -->
                        <fieldset v-if="formData.driver === 'apidian'">
                            <legend class="leyenda">Habilitación DIAN</legend>
                            <div class="row g-3">
                                <div class="col-12">
                                    <label class="form-label" for="f-test_set_id">Set de pruebas</label>
                                    <input id="f-test_set_id" v-model="formData.test_set_id" class="form-control" type="text"
                                        placeholder="Vacío = producción; en habilitación va el testSetId del portal" maxlength="100" />
                                    <small class="text-muted d-block mt-1">
                                        Si viene, la emisión va a la ruta de habilitación con test_set_id.
                                    </small>
                                </div>

                                <div class="col-12">
                                    <div class="form-check rounded bg-light p-2 px-3">
                                        <input class="form-check-input" type="checkbox" id="f-send_to_dian"
                                            v-model="formData.send_to_dian">
                                        <label class="form-check-label" for="f-send_to_dian">
                                            Transmitir a la DIAN
                                        </label>
                                        <small class="text-muted d-block">
                                            Sin marcar: ApiDian valida, firma y persiste <strong>sin</strong> contactar la DIAN.
                                            Márcalo solo con las habilitaciones oficiales o producción.
                                        </small>
                                    </div>
                                    <div v-if="formData.send_to_dian && !formData.test_set_id.trim()"
                                        class="alert alert-warning small py-2 px-3 mt-2 mb-0 d-flex align-items-center gap-2" role="alert">
                                        <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
                                        <span>Send en producción sin set de pruebas: revisa que tus habilitaciones estén listas.</span>
                                    </div>
                                </div>
                            </div>
                        </fieldset>

                        <div class="col-12">
                            <BaseFormActions :submitting="isSubmitting" :is-edit-mode="editando"
                                :submit-label="editando ? 'Guardar cambios' : 'Conectar proveedor'"
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
                        <i class="fas fa-list text-primary" aria-hidden="true"></i>
                        <h6 class="mb-0 fw-medium">Proveedores registrados</h6>
                    </div>
                    <span class="badge rounded-pill bg-light text-body border">{{ store.providers.length }}</span>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <DataTable :value="store.providers" :loading="store.loading" responsiveLayout="scroll"
                            tableStyle="min-width: 32rem" class="table table-sm mb-0">
                            <template #empty>
                                <div class="text-center py-5 px-3">
                                    <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-light mb-3"
                                        style="width: 56px; height: 56px;">
                                        <i class="fad fa-server fs-5 text-secondary" aria-hidden="true"></i>
                                    </div>
                                    <p class="fw-medium mb-1">Aún no hay proveedores registrados</p>
                                    <p class="text-muted small mb-0 mx-auto" style="max-width: 28rem;">
                                        Registra el primero con el correo y la contraseña de ApiDian:
                                        el token se obtiene solo.
                                    </p>
                                </div>
                            </template>
                            <Column field="name" header="Nombre">
                                <template #body="{ data }">
                                    <strong>{{ data.name }}</strong>
                                    <div v-if="data.description" class="text-muted small">{{ data.description }}</div>
                                </template>
                            </Column>
                            <Column header="Integración" style="width: 7rem;">
                                <template #body="{ data }">
                                    <span class="badge rounded-pill"
                                        :class="data.driver === 'apidian' ? 'bg-primary' : 'bg-secondary'">
                                        {{ data.driver === 'apidian' ? 'ApiDian' : 'Nula' }}
                                    </span>
                                </template>
                            </Column>
                            <Column header="Envío DIAN" style="width: 8rem;" class="text-center">
                                <template #body="{ data }">
                                    <span class="badge rounded-pill" :class="data.send_to_dian ? 'bg-success' : 'bg-secondary'">
                                        {{ data.send_to_dian ? 'Transmite' : 'Sin envío' }}
                                    </span>
                                </template>
                            </Column>
                            <Column header="Estado" style="width: 6rem;" class="text-center">
                                <template #body="{ data }">
                                    <span class="badge rounded-pill" :class="data.is_active ? 'bg-success' : 'bg-secondary'">
                                        {{ data.is_active ? 'Activo' : 'Inactivo' }}
                                    </span>
                                </template>
                            </Column>
                            <Column header="Acciones" style="width: 10rem;" class="text-center">
                                <template #body="{ data }">
                                    <button v-if="data.driver === 'apidian' && can('billing_providers.update')"
                                        class="btn btn-sm btn-outline-secondary me-1" type="button"
                                        aria-label="Configurar ApiDian" title="Configuración básica ApiDian"
                                        @click="goToConfig(data)">
                                        <i class="fas fa-sliders-h" aria-hidden="true"></i>
                                    </button>
                                    <button v-if="can('billing_providers.update')" class="btn btn-sm btn-outline-primary me-1"
                                        type="button" aria-label="Editar proveedor" @click="goToEdit(data)">
                                        <i class="fas fa-pen" aria-hidden="true"></i>
                                    </button>
                                    <button v-if="can('billing_providers.delete')" class="btn btn-sm btn-outline-danger"
                                        type="button" aria-label="Eliminar proveedor" @click="confirmarEliminar(data)">
                                        <i class="fas fa-trash" aria-hidden="true"></i>
                                    </button>
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useBillingStore } from '../store/billing.store.js';
import { usePermissionsStore, useUserStore } from '@store';
import { useAccessibleForm } from '@/hooks/useAccessibleForm.js';
import { useTableActions } from '@/hooks/useTableActions.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import BaseFormActions from '@/components/BaseFormActions.vue';
import PrimeSelect from '@/components/form/PrimeSelect.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const router = useRouter();
const store = useBillingStore();
const userStore = useUserStore();
const permissionsStore = usePermissionsStore();
const can = (action) => permissionsStore.can(action);

const opcionesDriver = [
    { valor: 'nulo', etiqueta: 'Nula (sin FE, facturación interna)' },
    { valor: 'apidian', etiqueta: 'ApiDian (emisión electrónica DIAN)' },
];

const goBack = () => router.push('/facturacion');
const recargar = () => store.fetchProviders();
const goToConfig = (data) => router.push(`/facturacion/proveedores/${data.uuid}/configuracion`);

const { formData, errors, isSubmitting, fieldAria, validateAndFocus, submit, reset } = useAccessibleForm(
    {
        company_uuid: '',
        name: '',
        driver: 'apidian',
        server_url: '',
        test_set_id: '',
        send_to_dian: false,
        client_id: '',
        client_password: '',
    },
    {
        name: { required: true, label: 'Nombre' },
        driver: { required: true, label: 'Proveedor tecnológico' },
    }
);

const editando = computed(() => !!store.providerEnEdicion);
const tarjetaFormulario = ref(null);

const enfocarFormulario = () => {
    nextTick(() => {
        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        tarjetaFormulario.value?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
};

const limpiarCampos = () => {
    reset();
    formData.driver = 'apidian';
};

const cancelarEdicion = () => {
    store.providerEnEdicion = null;
    limpiarCampos();
};

const goToEdit = (data) => {
    store.providerEnEdicion = data.uuid;
    formData.name = data.name ?? '';
    formData.driver = data.driver ?? 'nulo';
    formData.server_url = data.server_url ?? '';
    formData.test_set_id = data.test_set_id ?? '';
    formData.send_to_dian = !!data.send_to_dian;
    formData.client_id = data.client_id ?? '';
    formData.client_password = '';
    enfocarFormulario();
};

const confirmarEliminar = async (data) => {
    const acciones = useTableActions({
        deleteItem: (uuid) => store.eliminarProveedor(uuid),
    });
    await acciones.confirmDelete(data, {
        title: '¿Eliminar proveedor?',
        html: `<p class="mb-2">Se eliminará <strong>${data.name}</strong>.</p>
               <div class="alert alert-warning small mb-0 mt-2">
                   Las resoluciones que lo referencien quedarán sin proveedor.
               </div>`,
        nameField: 'name',
    });
};

const handleSubmit = () => submit(async () => {
    if (!(await validateAndFocus())) return;

    const esApiDian = formData.driver === 'apidian';

    if (esApiDian && !formData.client_id.trim()) {
        errors.client_id = 'El correo de login es obligatorio para iniciar sesión';
        document.getElementById('f-client_id')?.focus();
        return;
    }

    if (esApiDian && !formData.server_url.trim()) {
        errors.server_url = 'Sin la URL del API, ApiDian no puede recibir los documentos';
        document.getElementById('f-server_url')?.focus();
        return;
    }

    if (esApiDian && !editando.value && !formData.client_password.trim()) {
        errors.client_password = 'La contraseña es obligatoria para iniciar sesión';
        document.getElementById('f-client_password')?.focus();
        return;
    }

    const datos = {
        company_uuid: formData.company_uuid || userStore.company_uuid || userStore.companies?.[0]?.uuid,
        name: formData.name.trim(),
        driver: formData.driver,
        server_url: esApiDian ? formData.server_url.trim() : null,
        test_set_id: esApiDian ? (formData.test_set_id.trim() || null) : null,
        send_to_dian: esApiDian ? !!formData.send_to_dian : false,
        client_id: esApiDian ? formData.client_id.trim() : null,
        is_active: true,
    };

    // La contraseña solo viaja si se escribió; al editar sin escribirla se conserva el token.
    if (esApiDian && formData.client_password.trim()) {
        datos.client_password = formData.client_password.trim();
    }

    if (editando.value) {
        await store.actualizarProveedor(store.providerEnEdicion, datos);
        cancelarEdicion();
    } else {
        await store.crearProveedor(datos);
        limpiarCampos();
    }
});

onMounted(async () => {
    formData.company_uuid = userStore.company_uuid || userStore.companies?.[0]?.uuid || '';
    try { await store.fetchProviders(); } catch (_e) { /* el store ya notificó */ }
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
:focus-visible { outline: 2px solid #0d6efd !important; outline-offset: 2px !important; }
</style>
