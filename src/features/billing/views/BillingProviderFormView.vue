<template>
    <BasePageHeader :title="editando ? 'Editar proveedor de facturación' : 'Nuevo proveedor de facturación'"
        :description="descripcion"
        icon="fad fa-server text-primary" :show-back="true" :show-bg="true" :compact="true"
        :breadcrumbs="[{ label: 'Finanzas' }, { label: 'Facturación', to: '/facturacion' }, { label: 'Proveedores', to: '/facturacion/proveedores' }, { label: editando ? 'Editar' : 'Nuevo' }]"
        @back="goBack" />

    <div class="card border-0 shadow-sm fade-in-up" style="animation-delay: 0.1s;">
        <div class="card-body">
            <form @submit.prevent="handleSubmit" class="row g-3" novalidate>
                <!-- Proveedor -->
                <fieldset class="col-12">
                    <legend class="leyenda">Proveedor</legend>
                    <div class="row g-3">
                        <div class="col-12 col-md-6">
                            <label class="form-label required" for="f-driver">Tipo de Proveedor</label>
                            <PrimeSelect input-id="f-driver" v-model="formData.driver"
                                :options="opcionesDriver" option-label="etiqueta" option-value="valor"
                                placeholder="Seleccione el tipo de integración"
                                @change="onDriverChange" />
                            <small class="text-muted d-block mt-1">{{ descripcionDriver }}</small>
                        </div>
                        <div class="col-12 col-md-6">
                            <label class="form-label required" for="f-name">Nombre</label>
                            <input id="f-name" v-model="formData.name" class="form-control"
                                :class="{ 'is-invalid': errors.name }" type="text" maxlength="100"
                                :placeholder="placeholderNombre"
                                :aria-invalid="!!errors.name"
                                :aria-describedby="errors.name ? 'f-name-error' : undefined" />
                            <div v-if="errors.name" class="invalid-feedback d-block" id="f-name-error" role="alert">
                                {{ errors.name }}
                            </div>
                        </div>

                        <div class="col-12 col-md-6">
                            <label class="form-label required" for="f-ambiente">Ambiente</label>
                            <PrimeSelect input-id="f-ambiente" v-model="ambiente"
                                :options="opcionesAmbiente" option-label="etiqueta" option-value="valor"
                                placeholder="Seleccione el ambiente" @change="aplicarAmbiente" />
                            <small class="text-muted d-block mt-1">Define la URL del API automáticamente.</small>
                        </div>

                        <div class="col-12">
                            <label class="form-label required" for="f-server_url">URL del API</label>
                            <input id="f-server_url" v-model="formData.server_url" class="form-control"
                                :class="{ 'is-invalid': errors.server_url }" type="url" maxlength="200"
                                :placeholder="placeholderUrl"
                                :aria-invalid="!!errors.server_url"
                                :aria-describedby="errors.server_url ? 'f-server_url-error' : undefined" />
                            <div v-if="errors.server_url" class="invalid-feedback d-block" id="f-server_url-error" role="alert">
                                {{ errors.server_url }}
                            </div>
                        </div>
                    </div>
                </fieldset>

                <!-- Credenciales según driver -->
                <fieldset class="col-12">
                    <legend class="leyenda">{{ leyendaCredenciales }}</legend>
                    <div class="row g-3">
                        <!-- Campos solo para Factus (OAuth2) -->
                        <template v-if="formData.driver === 'factus'">
                            <div class="col-12 col-md-6">
                                <label class="form-label required" for="f-client_id">Client ID</label>
                                <input id="f-client_id" v-model="formData.client_id" class="form-control"
                                    :class="{ 'is-invalid': errors.client_id }" type="text" maxlength="200"
                                    autocomplete="off" placeholder="client id de Factus"
                                    :aria-invalid="!!errors.client_id"
                                    :aria-describedby="errors.client_id ? 'f-client_id-error' : undefined" />
                                <div v-if="errors.client_id" class="invalid-feedback d-block" id="f-client_id-error" role="alert">
                                    {{ errors.client_id }}
                                </div>
                            </div>

                            <div class="col-12 col-md-6">
                                <label class="form-label" :class="{ required: !editando }" for="f-client_secret">Client Secret</label>
                                <input id="f-client_secret" v-model="formData.client_secret" class="form-control"
                                    :class="{ 'is-invalid': errors.client_secret }" type="password"
                                    maxlength="255" autocomplete="new-password"
                                    :placeholder="editando ? 'Dejar vacío para conservar el guardado' : 'client secret de Factus'"
                                    :aria-invalid="!!errors.client_secret"
                                    :aria-describedby="errors.client_secret ? 'f-client_secret-error' : undefined" />
                                <div v-if="errors.client_secret" class="invalid-feedback d-block" id="f-client_secret-error" role="alert">
                                    {{ errors.client_secret }}
                                </div>
                            </div>
                        </template>

                        <!-- Campos para ambos drivers -->
                        <div class="col-12 col-md-6">
                            <label class="form-label required" for="f-email">Usuario (correo)</label>
                            <input id="f-email" v-model="formData.email" class="form-control"
                                :class="{ 'is-invalid': errors.email }" type="email" maxlength="100"
                                autocomplete="off" placeholder="correo@empresa.com"
                                :aria-invalid="!!errors.email"
                                :aria-describedby="errors.email ? 'f-email-error' : undefined" />
                            <div v-if="errors.email" class="invalid-feedback d-block" id="f-email-error" role="alert">
                                {{ errors.email }}
                            </div>
                        </div>

                        <div class="col-12 col-md-6">
                            <label class="form-label" :class="{ required: !editando }" for="f-client_password">Contraseña</label>
                            <input id="f-client_password" v-model="formData.client_password" class="form-control"
                                :class="{ 'is-invalid': errors.client_password }" type="password"
                                maxlength="255" autocomplete="new-password"
                                :placeholder="placeholderPassword"
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
                                    Al guardar, NOA
                                    <strong>{{ textoInicioSesion }}</strong>
                                    con estos datos y guarda el token automáticamente; no hay que pegarlo. Si expira, se renueva solo.
                                </span>
                            </div>
                        </div>
                    </div>
                </fieldset>

                <!-- Configuración específica por driver -->
                <template v-if="formData.driver === 'factus'">
                    <fieldset class="col-12">
                        <legend class="leyenda">Habilitación DIAN (Factus)</legend>
                        <div class="row g-3">
                            <div class="col-12 col-md-6">
                                <label class="form-label" for="f-numbering_range_id">ID del rango de numeración</label>
                                <input id="f-numbering_range_id" v-model="formData.numbering_range_id" class="form-control"
                                    type="text" inputmode="numeric" maxlength="20"
                                    placeholder="Opcional: si hay varios rangos activos"
                                    :aria-describedby="formData.numbering_range_id ? 'f-numbering_range_id-hint' : undefined" />
                                <small class="text-muted d-block mt-1" id="f-numbering_range_id-hint">
                                    Se obtiene en Factus (rangos de numeración). Si se omite, Factus usa el único rango activo.
                                </small>
                            </div>

                            <div class="col-12">
                                <div class="form-check form-switch rounded bg-light p-2 px-3">
                                    <input class="form-check-input" type="checkbox" role="switch" id="f-send_to_dian"
                                        v-model="formData.send_to_dian">
                                    <label class="form-check-label" for="f-send_to_dian">
                                        Transmitir a la DIAN
                                    </label>
                                    <small class="text-muted d-block">
                                        Sin activar: Factus valida en <strong>sandbox</strong> (sin validez fiscal).
                                        Actívalo solo con la habilitación oficial o producción.
                                    </small>
                                </div>
                            </div>
                        </div>
                    </fieldset>
                </template>

                <template v-if="formData.driver === 'apidian'">
                    <fieldset class="col-12">
                        <legend class="leyenda">Configuración ApiDian</legend>
                        <div class="row g-3">
                            <div class="col-12">
                                <div class="form-check form-switch rounded bg-light p-2 px-3">
                                    <input class="form-check-input" type="checkbox" role="switch" id="f-send_to_dian"
                                        v-model="formData.send_to_dian">
                                    <label class="form-check-label" for="f-send_to_dian">
                                        Transmitir a la DIAN
                                    </label>
                                    <small class="text-muted d-block">
                                        Sin activar: ApiDian valida y firma sin contactar la DIAN (modo pruebas).
                                        Para producción, habilita esta opción y configura los parámetros de test_set_id desde la API.
                                    </small>
                                </div>
                            </div>

                            <div class="col-12">
                                <div class="alert alert-info border small py-2 px-3 mb-0" role="note">
                                    <i class="fas fa-info-circle text-info mt-1 me-2" aria-hidden="true"></i>
                                    <span>
                                        La configuración completa de ApiDian (company config, software GUID, certificado, resoluciones)
                                        se realiza mediante las llamadas a la API directamente desde el dashboard de ApiDian.
                                        Aquí solo configuras las credenciales de acceso.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </fieldset>
                </template>

                <div class="col-12 d-flex justify-content-end">
                    <BaseFormActions :submitting="isSubmitting" :is-edit-mode="editando"
                        :submit-label="editando ? 'Guardar cambios' : 'Conectar proveedor'" @cancel="goBack" />
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBillingStore } from '../store/billing.store.js';
import { useUserStore } from '@store';
import { useAccessibleForm } from '@/hooks/useAccessibleForm.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import BaseFormActions from '@/components/BaseFormActions.vue';
import PrimeSelect from '@/components/form/PrimeSelect.vue';

const route = useRoute();
const router = useRouter();
const store = useBillingStore();
const userStore = useUserStore();

const editando = computed(() => !!route.params.id);

// URLs por defecto según driver
const URL_FACTUS_SANDBOX = 'https://api-sandbox.factus.com.co';
const URL_FACTUS_PRODUCCION = 'https://api.factus.com.co';
const URL_APIDIAN_SANDBOX = 'https://apidian.systemsfact.com.co';
const URL_APIDIAN_PRODUCCION = 'https://apidian.systemsfact.com.co';

const opcionesDriver = [
    { valor: 'factus', etiqueta: 'Factus — OAuth2' },
    { valor: 'apidian', etiqueta: 'ApiDian — JWT' },
];

const opcionesAmbiente = [
    { valor: 'sandbox', etiqueta: 'Sandbox (pruebas)' },
    { valor: 'produccion', etiqueta: 'Producción' },
];

const ambiente = ref('sandbox');

// URLs base según driver
const urlBase = computed(() => {
    if (ambiente.value === 'produccion') {
        return formData.driver === 'factus' ? URL_FACTUS_PRODUCCION : URL_APIDIAN_PRODUCCION;
    }
    return formData.driver === 'factus' ? URL_FACTUS_SANDBOX : URL_APIDIAN_SANDBOX;
});

// Descripciones dinámicas
const descripcion = computed(() => {
    const base = editando.value ? 'Actualiza la conexión con ' : 'Conecta ';
    return base + (formData.driver === 'factus' ? 'Factus' : 'ApiDian') + ' para emitir facturas electrónicas de servicios.';
});

const descripcionDriver = computed(() => {
    return formData.driver === 'factus'
        ? 'Integración OAuth2: requiere Client ID, Client Secret, correo y contraseña del portal Factus.'
        : 'Integración JWT: requiere correo y contraseña del usuario ApiDian. La configuración de company/config/servicios se hace desde el panel ApiDian.';
});

const leyendaCredenciales = computed(() => {
    return formData.driver === 'factus' ? 'Credenciales Factus (OAuth2)' : 'Credenciales ApiDian (JWT)';
});

const placeholderPassword = computed(() => {
    return formData.driver === 'factus'
        ? (editando.value ? 'Dejar vacío para conservar el token actual' : 'Contraseña del portal Factus')
        : (editando.value ? 'Dejar vacío para conservar el token actual' : 'Contraseña de ApiDian');
});

const textoInicioSesion = computed(() => {
    return formData.driver === 'factus' ? 'inicia sesión OAuth2' : 'autentica JWT';
});

const placeholderNombre = computed(() => {
    return formData.driver === 'factus'
        ? 'Ej: Factus — Transportes Sin Barreras'
        : 'Ej: ApiDian — Transportes Sin Barreras';
});

const placeholderUrl = computed(() => {
    return formData.driver === 'factus'
        ? 'https://api-sandbox.factus.com.co'
        : 'https://apidian.systemsfact.com.co';
});

const { formData, errors, isSubmitting, validateAndFocus, submit } = useAccessibleForm(
    {
        driver: 'factus',
        company_uuid: '',
        name: '',
        server_url: URL_FACTUS_SANDBOX,
        numbering_range_id: '',
        send_to_dian: false,
        client_id: '',
        client_secret: '',
        email: '',
        client_password: '',
    },
    {
        driver: { required: true, label: 'Proveedor' },
        name: { required: true, label: 'Nombre' },
        server_url: { required: true, label: 'URL del API' },
        email: { required: true, label: 'Usuario (correo)', email: true },
    }
);

const aplicarAmbiente = () => {
    formData.server_url = urlBase.value;
};

const onDriverChange = () => {
    // Actualizar URLs cuando cambie el driver
    aplicarAmbiente();
};

const goBack = () => router.push('/facturacion/proveedores');

const detectarAmbiente = (url) => (String(url ?? '').includes('sandbox') ? 'sandbox' : 'produccion');

const handleSubmit = () => submit(async () => {
    if (!(await validateAndFocus())) return;

    // Validaciones específicas por driver
    if (formData.driver === 'factus') {
        if (!formData.client_id.trim()) {
            errors.client_id = 'El Client ID es obligatorio para Factus';
            document.getElementById('f-client_id')?.focus();
            return;
        }
        if (!formData.client_secret.trim() && !editando.value) {
            errors.client_secret = 'El client secret es obligatorio para iniciar sesión';
            document.getElementById('f-client_secret')?.focus();
            return;
        }
    }

    if (!formData.client_password.trim() && !editando.value) {
        errors.client_password = 'La contraseña es obligatoria para iniciar sesión';
        document.getElementById('f-client_password')?.focus();
        return;
    }

    const datos = {
        driver: formData.driver,
        company_uuid: formData.company_uuid || userStore.company_uuid || userStore.companies?.[0]?.uuid,
        name: formData.name.trim(),
        server_url: formData.server_url.trim(),
        send_to_dian: !!formData.send_to_dian,
        email: formData.email.trim(),
        is_active: true,
    };

    // Campos específicos de Factus
    if (formData.driver === 'factus') {
        datos.client_id = formData.client_id.trim();
        if (formData.numbering_range_id.trim()) {
            datos.settings = { numbering_range_id: Number(formData.numbering_range_id.trim()) };
        }
    }

    // Secretos: solo viajan si se escribieron; al editar sin escribirlos se conservan.
    if (formData.client_secret.trim()) {
        datos.client_secret = formData.client_secret.trim();
    }
    if (formData.client_password.trim()) {
        datos.client_password = formData.client_password.trim();
    }

    if (editando.value) {
        await store.actualizarProveedor(route.params.id, datos);
        goBack();
    } else {
        await store.crearProveedor(datos);
        goBack();
    }
});

watch(ambiente, () => {
    formData.server_url = urlBase.value;
});

onMounted(async () => {
    formData.company_uuid = userStore.company_uuid || userStore.companies?.[0]?.uuid || '';

    if (editando.value) {
        try {
            const proveedor = await store.fetchProviderById(route.params.id);
            formData.company_uuid = proveedor.company_uuid ?? formData.company_uuid;
            formData.name = proveedor.name ?? '';
            formData.driver = proveedor.driver ?? 'factus';
            formData.server_url = proveedor.server_url ?? urlBase.value;
            formData.send_to_dian = !!proveedor.send_to_dian;
            formData.client_id = proveedor.client_id ?? '';
            formData.email = proveedor.email ?? '';
            formData.numbering_range_id = proveedor.settings?.numbering_range_id ?? '';
            ambiente.value = detectarAmbiente(proveedor.server_url);
        } catch (_e) {
            // El store ya notificó el error; volvemos al listado.
            goBack();
        }
    }
});
</script>

<style scoped>
.fade-in-up {
    animation: fadeInUp 0.4s ease-out forwards;
}

@keyframes fadeInUp {
    from { opacity: 0; transform: translate3d(0, 15px, 0); }
    to { opacity: 1; transform: translate3d(0, 0, 0); }
}

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
</style>
