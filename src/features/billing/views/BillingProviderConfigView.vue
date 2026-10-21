<template>
    <BasePageHeader title="Configuración básica ApiDian"
        :subtitle="proveedor ? `Cuenta de ${proveedor.name}` : 'Cuenta del proveedor tecnológico'"
        icon="fad fa-sliders-h text-primary" :show-back="true" :show-refresh="true"
        :breadcrumbs="[{ label: 'Comercial' }, { label: 'Facturación', to: '/facturacion' }, { label: 'Proveedores', to: '/facturacion/proveedores' }, { label: 'Configuración' }]"
        @back="goBack" @refresh="cargarConfiguracion" />

    <div class="alert alert-light border small py-2 px-3 d-flex align-items-start gap-2" role="note">
        <i class="fas fa-circle-info text-primary mt-1" aria-hidden="true"></i>
        <span>
            Estos datos viven en <strong>ApiDian</strong> (sección 01 de la configuración) y se envían con el token
            del proveedor. NOA no los almacena: aquí solo los consultas y actualizas.
        </span>
    </div>

    <div v-if="!uuidFijo && proveedoresApidian.length > 1" class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <label class="small text-muted mb-0" for="f-provider_config">Proveedor:</label>
        <select id="f-provider_config" v-model="uuidSeleccionado" class="form-select form-select-sm w-auto"
            @change="cargarConfiguracion">
            <option v-for="p in proveedoresApidian" :key="p.uuid" :value="p.uuid">{{ p.name }}</option>
        </select>
    </div>

    <div v-if="!uuid" class="card border-0 shadow-sm">
        <div class="card-body text-center py-5 px-3">
            <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-light mb-3"
                style="width: 56px; height: 56px;">
                <i class="fad fa-server fs-5 text-secondary" aria-hidden="true"></i>
            </div>
            <p class="fw-medium mb-1">No hay un proveedor ApiDian registrado</p>
            <p class="text-muted small mb-3 mx-auto" style="max-width: 30rem;">
                Registra el proveedor con su correo y contraseña para poder configurar la cuenta
                (empresa, software, certificado, resoluciones y ambiente).
            </p>
            <router-link to="/facturacion/proveedores" class="btn btn-sm btn-primary">
                <i class="fas fa-server me-1" aria-hidden="true"></i>Ir a proveedores
            </router-link>
        </div>
    </div>

    <div v-if="uuid">
        <ul class="nav nav-pills flex-wrap gap-1 mb-3" role="tablist">
        <li v-for="pestana in pestanas" :key="pestana.valor" class="nav-item" role="presentation">
            <button class="nav-link" :class="{ active: pasoActivo === pestana.valor }" type="button" role="tab"
                :id="`tab-${pestana.valor}`" :aria-selected="pasoActivo === pestana.valor"
                :aria-controls="`panel-${pestana.valor}`" @click="pasoActivo = pestana.valor">
                <i :class="`${pestana.icono} me-1`" aria-hidden="true"></i>{{ pestana.etiqueta }}
            </button>
        </li>
    </ul>

    <!-- 1. EMPRESA -->
    <section v-show="pasoActivo === 'empresa'" id="panel-empresa" role="tabpanel" aria-labelledby="tab-empresa">
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center gap-2">
                <i class="fas fa-building text-primary" aria-hidden="true"></i>
                <h6 class="mb-0 fw-medium">Paso 1 · Empresa</h6>
                <span v-if="store.configLoading" class="spinner-border spinner-border-sm text-primary" role="status"
                    aria-label="Consultando configuración"></span>
            </div>
            <div class="card-body">
                <form @submit.prevent="handleEmpresa" class="row g-3" novalidate>
                    <fieldset>
                        <legend class="leyenda">Identificación</legend>
                        <div class="row g-3">
                            <div class="col-12 col-md-4">
                                <label class="form-label required" for="f-identification_number">NIT</label>
                                <input id="f-identification_number" v-model.number="empresa.identification_number" class="form-control"
                                    type="number" min="1" :aria-invalid="!!erroresEmpresa.identification_number"
                                    :aria-describedby="erroresEmpresa.identification_number ? 'f-identification_number-error' : undefined" />
                                <div v-if="erroresEmpresa.identification_number" class="invalid-feedback d-block"
                                    id="f-identification_number-error" role="alert">
                                    {{ erroresEmpresa.identification_number }}
                                </div>
                            </div>
                            <div class="col-6 col-md-2">
                                <label class="form-label" for="f-dv">DV</label>
                                <input id="f-dv" v-model="empresa.dv" class="form-control" type="text" maxlength="1"
                                    placeholder="7" />
                            </div>
                            <div class="col-12 col-md-6">
                                <label class="form-label required" for="f-name">Razón social</label>
                                <input id="f-name" v-model="empresa.name" class="form-control" type="text" maxlength="200"
                                    :aria-invalid="!!erroresEmpresa.name"
                                    :aria-describedby="erroresEmpresa.name ? 'f-name-error' : undefined" />
                                <div v-if="erroresEmpresa.name" class="invalid-feedback d-block" id="f-name-error" role="alert">
                                    {{ erroresEmpresa.name }}
                                </div>
                            </div>
                            <div class="col-12 col-md-6">
                                <label class="form-label" for="f-graphic_representation_name">Nombre representación gráfica</label>
                                <input id="f-graphic_representation_name" v-model="empresa.graphic_representation_name"
                                    class="form-control" type="text" maxlength="200" />
                            </div>
                            <div class="col-6 col-md-3">
                                <label class="form-label" for="f-registration_code">Código de registro</label>
                                <input id="f-registration_code" v-model="empresa.registration_code" class="form-control"
                                    type="text" maxlength="50" />
                            </div>
                            <div class="col-6 col-md-3">
                                <label class="form-label" for="f-economic_activity">Actividad económica</label>
                                <input id="f-economic_activity" v-model="empresa.economic_activity" class="form-control"
                                    type="text" maxlength="10" placeholder="6201" />
                            </div>
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend class="leyenda">Contacto</legend>
                        <div class="row g-3">
                            <div class="col-12 col-md-6">
                                <label class="form-label" for="f-address">Dirección</label>
                                <input id="f-address" v-model="empresa.address" class="form-control" type="text" maxlength="200" />
                            </div>
                            <div class="col-6 col-md-3">
                                <label class="form-label" for="f-phone">Teléfono</label>
                                <input id="f-phone" v-model="empresa.phone" class="form-control" type="text" maxlength="20" />
                            </div>
                            <div class="col-6 col-md-3">
                                <label class="form-label" for="f-postal_zone_code">Código postal</label>
                                <input id="f-postal_zone_code" v-model="empresa.postal_zone_code" class="form-control"
                                    type="text" maxlength="10" />
                            </div>
                            <div class="col-12 col-md-6">
                                <label class="form-label" for="f-email">Correo</label>
                                <input id="f-email" v-model="empresa.email" class="form-control" type="email" maxlength="100" />
                            </div>
                            <div class="col-12 col-md-6">
                                <label class="form-label" for="f-merchant_registration">Matrícula mercantil</label>
                                <input id="f-merchant_registration" v-model="empresa.merchant_registration" class="form-control"
                                    type="text" maxlength="50" />
                            </div>
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend class="leyenda">Clasificación DIAN</legend>
                        <div class="row g-3">
                            <div class="col-6 col-md-3">
                                <label class="form-label" for="f-type_document_identification_id">Tipo de documento</label>
                                <select id="f-type_document_identification_id" v-model.number="empresa.type_document_identification_id"
                                    class="form-select">
                                    <option :value="6">NIT</option>
                                    <option :value="3">Cédula de ciudadanía</option>
                                    <option :value="4">Cédula de extranjería</option>
                                    <option :value="7">Pasaporte</option>
                                </select>
                            </div>
                            <div class="col-6 col-md-3">
                                <label class="form-label" for="f-type_organization_id">Organización</label>
                                <select id="f-type_organization_id" v-model.number="empresa.type_organization_id" class="form-select">
                                    <option :value="1">Jurídica</option>
                                    <option :value="2">Natural</option>
                                </select>
                            </div>
                            <div class="col-6 col-md-2">
                                <label class="form-label" for="f-type_liability_id">Responsabilidad</label>
                                <input id="f-type_liability_id" v-model.number="empresa.type_liability_id" class="form-control"
                                    type="number" min="1" />
                            </div>
                            <div class="col-6 col-md-2">
                                <label class="form-label" for="f-type_regime_id">Régimen</label>
                                <input id="f-type_regime_id" v-model.number="empresa.type_regime_id" class="form-control"
                                    type="number" min="1" />
                            </div>
                            <div class="col-6 col-md-2">
                                <label class="form-label" for="f-municipality_id">Municipio (ID)</label>
                                <input id="f-municipality_id" v-model.number="empresa.municipality_id" class="form-control"
                                    type="number" min="1" />
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label" for="f-municipality_name_facturation">Municipio de facturación</label>
                                <input id="f-municipality_name_facturation" v-model="empresa.municipality_name_facturation"
                                    class="form-control" type="text" maxlength="100" />
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label" for="f-municipality_name_eventos">Municipio de eventos</label>
                                <input id="f-municipality_name_eventos" v-model="empresa.municipality_name_eventos"
                                    class="form-control" type="text" maxlength="100" />
                            </div>
                            <div class="col-6 col-md-2">
                                <label class="form-label" for="f-type_environment_id">Ambiente</label>
                                <select id="f-type_environment_id" v-model.number="empresa.type_environment_id" class="form-select">
                                    <option :value="1">Producción</option>
                                    <option :value="2">Habilitación</option>
                                </select>
                            </div>
                            <div class="col-6 col-md-2">
                                <label class="form-label" for="f-payroll_type_environment_id">Ambiente nómina</label>
                                <select id="f-payroll_type_environment_id" v-model.number="empresa.payroll_type_environment_id"
                                    class="form-select">
                                    <option :value="1">Producción</option>
                                    <option :value="2">Habilitación</option>
                                </select>
                            </div>
                        </div>
                    </fieldset>

                    <div class="col-12">
                        <BaseFormActions :submitting="enviando === 'empresa'" :is-edit-mode="true"
                            submit-label="Guardar empresa" cancel-label="Volver" @cancel="goBack" />
                    </div>
                </form>
            </div>
        </div>
    </section>

    <!-- 2. SOFTWARE -->
    <section v-show="pasoActivo === 'software'" id="panel-software" role="tabpanel" aria-labelledby="tab-software">
        <div class="row g-3">
            <div class="col-12 col-lg-6">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center gap-2">
                        <i class="fas fa-laptop-code text-primary" aria-hidden="true"></i>
                        <h6 class="mb-0 fw-medium">Paso 2 · Software</h6>
                    </div>
                    <div class="card-body">
                        <form @submit.prevent="handleSoftware" class="row g-3" novalidate>
                            <div class="col-12">
                                <label class="form-label required" for="f-software_id">ID del software (DIAN)</label>
                                <input id="f-software_id" v-model="software.id" class="form-control" type="text" maxlength="100" />
                            </div>
                            <div class="col-6">
                                <label class="form-label required" for="f-software_pin">PIN</label>
                                <input id="f-software_pin" v-model="software.pin" class="form-control" type="text" maxlength="50" />
                            </div>
                            <div class="col-6">
                                <label class="form-label" for="f-software_url">URL</label>
                                <input id="f-software_url" v-model="software.url" class="form-control" type="text" maxlength="200" />
                            </div>
                            <div class="col-12">
                                <button class="btn btn-success rounded-pill px-4" type="submit" :disabled="enviando === 'software'">
                                    <span v-if="enviando === 'software'" class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                                    <i v-else class="fas fa-check me-1" aria-hidden="true"></i>Guardar software
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <div class="col-12 col-lg-6">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center gap-2">
                        <i class="fas fa-users text-primary" aria-hidden="true"></i>
                        <h6 class="mb-0 fw-medium">Paso 2b · Software de nómina</h6>
                    </div>
                    <div class="card-body">
                        <form @submit.prevent="handleSoftwareNomina" class="row g-3" novalidate>
                            <div class="col-12">
                                <label class="form-label required" for="f-idpayroll">ID del software de nómina</label>
                                <input id="f-idpayroll" v-model="nomina.idpayroll" class="form-control" type="text" maxlength="100" />
                            </div>
                            <div class="col-6">
                                <label class="form-label required" for="f-pinpayroll">PIN</label>
                                <input id="f-pinpayroll" v-model="nomina.pinpayroll" class="form-control" type="text" maxlength="50" />
                            </div>
                            <div class="col-6 d-flex align-items-end">
                                <div class="form-check rounded bg-light p-2 px-3 w-100">
                                    <input class="form-check-input" type="checkbox" id="f-send_nomina" v-model="nomina.send">
                                    <label class="form-check-label" for="f-send_nomina">Enviar a la DIAN</label>
                                </div>
                            </div>
                            <div class="col-12">
                                <button class="btn btn-success rounded-pill px-4" type="submit" :disabled="enviando === 'software-nomina'">
                                    <span v-if="enviando === 'software-nomina'" class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                                    <i v-else class="fas fa-check me-1" aria-hidden="true"></i>Guardar nómina
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- 3. CERTIFICADO -->
    <section v-show="pasoActivo === 'certificado'" id="panel-certificado" role="tabpanel" aria-labelledby="tab-certificado">
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center gap-2">
                <i class="fas fa-file-shield text-primary" aria-hidden="true"></i>
                <h6 class="mb-0 fw-medium">Paso 3 · Certificado digital</h6>
            </div>
            <div class="card-body">
                <form @submit.prevent="handleCertificado" class="row g-3" novalidate>
                    <div class="col-12 col-md-6">
                        <label class="form-label required" for="f-certificado">Archivo del certificado (.p12 / .pfx)</label>
                        <input id="f-certificado" class="form-control" type="file" accept=".p12,.pfx"
                            :aria-describedby="errorCertificado ? 'f-certificado-error' : 'f-certificado-help'"
                            @change="leerCertificado" />
                        <small id="f-certificado-help" class="text-muted d-block mt-1">
                            Se envía a ApiDian en base64; NOA no guarda el archivo.
                        </small>
                        <div v-if="errorCertificado" class="invalid-feedback d-block" id="f-certificado-error" role="alert">
                            {{ errorCertificado }}
                        </div>
                        <div v-if="nombreCertificado" class="small text-muted mt-1">
                            <i class="fas fa-paperclip me-1" aria-hidden="true"></i>{{ nombreCertificado }}
                        </div>
                    </div>
                    <div class="col-12 col-md-6">
                        <label class="form-label required" for="f-certificado_password">Clave del certificado</label>
                        <input id="f-certificado_password" v-model="certificado.password" class="form-control"
                            type="password" autocomplete="new-password" maxlength="255"
                            :aria-describedby="errorCertificadoPassword ? 'f-certificado_password-error' : undefined" />
                        <div v-if="errorCertificadoPassword" class="invalid-feedback d-block"
                            id="f-certificado_password-error" role="alert">
                            {{ errorCertificadoPassword }}
                        </div>
                    </div>
                    <div class="col-12">
                        <button class="btn btn-success rounded-pill px-4" type="submit" :disabled="enviando === 'certificado'">
                            <span v-if="enviando === 'certificado'" class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                            <i v-else class="fas fa-upload me-1" aria-hidden="true"></i>Subir certificado
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </section>

    <!-- 4. RESOLUCIONES -->
    <section v-show="pasoActivo === 'resoluciones'" id="panel-resoluciones" role="tabpanel" aria-labelledby="tab-resoluciones">
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center gap-2">
                <i class="fas fa-stamp text-primary" aria-hidden="true"></i>
                <h6 class="mb-0 fw-medium">Pasos 4 y 5 · Resoluciones</h6>
            </div>
            <div class="card-body">
                <form @submit.prevent="handleResolucion" class="row g-3" novalidate>
                    <div class="col-12 col-md-4">
                        <label class="form-label required" for="f-resolution_type">Tipo de documento</label>
                        <select id="f-resolution_type" v-model.number="resolucion.type_document_id" class="form-select">
                            <option :value="1">Factura electrónica</option>
                            <option :value="4">Nota crédito</option>
                            <option :value="5">Nota débito</option>
                        </select>
                    </div>
                    <div class="col-6 col-md-2">
                        <label class="form-label required" for="f-resolution_prefix">Prefijo</label>
                        <input id="f-resolution_prefix" v-model="resolucion.prefix" class="form-control" type="text" maxlength="10" />
                    </div>
                    <div class="col-6 col-md-3">
                        <label class="form-label" for="f-resolution_number">No. resolución DIAN</label>
                        <input id="f-resolution_number" v-model="resolucion.resolution" class="form-control" type="text" maxlength="50" />
                    </div>
                    <div class="col-12 col-md-3">
                        <label class="form-label" for="f-resolution_date">Fecha resolución</label>
                        <input id="f-resolution_date" v-model="resolucion.resolution_date" class="form-control" type="date" />
                    </div>
                    <div class="col-12 col-md-6">
                        <label class="form-label" for="f-technical_key">Clave técnica</label>
                        <input id="f-technical_key" v-model="resolucion.technical_key" class="form-control" type="text" maxlength="100" />
                    </div>
                    <div class="col-6 col-md-3">
                        <label class="form-label required" for="f-from_number">Desde</label>
                        <input id="f-from_number" v-model.number="resolucion.from_number" class="form-control" type="number" min="1" />
                    </div>
                    <div class="col-6 col-md-3">
                        <label class="form-label required" for="f-to_number">Hasta</label>
                        <input id="f-to_number" v-model.number="resolucion.to_number" class="form-control" type="number" min="1" />
                    </div>
                    <div class="col-6 col-md-3">
                        <label class="form-label required" for="f-date_from">Vigencia desde</label>
                        <input id="f-date_from" v-model="resolucion.date_from" class="form-control" type="date" />
                    </div>
                    <div class="col-6 col-md-3">
                        <label class="form-label required" for="f-date_to">Vigencia hasta</label>
                        <input id="f-date_to" v-model="resolucion.date_to" class="form-control" type="date" />
                    </div>
                    <div class="col-12">
                        <div class="alert alert-light border small py-2 px-3 mb-0 d-flex align-items-start gap-2" role="note">
                            <i class="fas fa-circle-info text-primary mt-1" aria-hidden="true"></i>
                            <span>Repite el envío por cada tipo documental (factura, nota crédito y nota débito).</span>
                        </div>
                    </div>
                    <div class="col-12">
                        <button class="btn btn-success rounded-pill px-4" type="submit" :disabled="enviando === 'resolucion'">
                            <span v-if="enviando === 'resolucion'" class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                            <i v-else class="fas fa-check me-1" aria-hidden="true"></i>Guardar resolución
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </section>

    <!-- 5. AMBIENTE -->
    <section v-show="pasoActivo === 'ambiente'" id="panel-ambiente" role="tabpanel" aria-labelledby="tab-ambiente">
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center gap-2">
                <i class="fas fa-toggle-on text-primary" aria-hidden="true"></i>
                <h6 class="mb-0 fw-medium">Paso 6 · Ambiente y set de pruebas</h6>
            </div>
            <div class="card-body">
                <form @submit.prevent="handleAmbiente" class="row g-3" novalidate>
                    <div class="col-12 col-md-3">
                        <label class="form-label required" for="f-env_documentos">Documentos electrónicos</label>
                        <select id="f-env_documentos" v-model.number="ambiente.type_environment_id" class="form-select">
                            <option :value="1">Producción</option>
                            <option :value="2">Habilitación</option>
                        </select>
                    </div>
                    <div class="col-12 col-md-3">
                        <label class="form-label" for="f-env_nomina">Nómina</label>
                        <select id="f-env_nomina" v-model.number="ambiente.payroll_type_environment_id" class="form-select">
                            <option :value="1">Producción</option>
                            <option :value="2">Habilitación</option>
                        </select>
                    </div>
                    <div class="col-12 col-md-3">
                        <label class="form-label" for="f-env_eqdocs">Equivalente POS</label>
                        <select id="f-env_eqdocs" v-model.number="ambiente.eqdocs_type_environment_id" class="form-select">
                            <option :value="1">Producción</option>
                            <option :value="2">Habilitación</option>
                        </select>
                    </div>
                    <div class="col-12 col-md-3">
                        <label class="form-label" for="f-env_test_set">Set de pruebas (testSetId)</label>
                        <input id="f-env_test_set" v-model="ambiente.test_set_id" class="form-control" type="text"
                            maxlength="100" placeholder="GUID de la DIAN" />
                    </div>
                    <div class="col-12">
                        <div class="alert alert-warning small py-2 px-3 mb-0 d-flex align-items-start gap-2" role="alert">
                            <i class="fas fa-exclamation-triangle mt-1" aria-hidden="true"></i>
                            <span>
                                El ambiente y el set de pruebas también definen a dónde emite NOA.
                                Usa <strong>Habilitación</strong> hasta que la DIAN autorice producción.
                            </span>
                        </div>
                    </div>
                    <div class="col-12">
                        <button class="btn btn-success rounded-pill px-4" type="submit" :disabled="enviando === 'ambiente'">
                            <span v-if="enviando === 'ambiente'" class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                            <i v-else class="fas fa-check me-1" aria-hidden="true"></i>Guardar ambiente
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </section>

    <!-- 6. WEBHOOK -->
    <section v-show="pasoActivo === 'webhook'" id="panel-webhook" role="tabpanel" aria-labelledby="tab-webhook">
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center gap-2">
                <i class="fas fa-satellite-dish text-primary" aria-hidden="true"></i>
                <h6 class="mb-0 fw-medium">Webhook de estados</h6>
            </div>
            <div class="card-body">
                <form @submit.prevent="handleWebhook" class="row g-3" novalidate>
                    <div class="col-12 col-md-7">
                        <label class="form-label" for="f-webhook_url">URL del webhook</label>
                        <input id="f-webhook_url" v-model="webhook.webhook_url" class="form-control" type="url"
                            maxlength="200" placeholder="https://tu-servidor.com/webhook/apidian" />
                    </div>
                    <div class="col-12 col-md-5">
                        <label class="form-label" for="f-webhook_secret">Secreto para firmar</label>
                        <input id="f-webhook_secret" v-model="webhook.webhook_secret" class="form-control"
                            type="password" maxlength="255" autocomplete="new-password" />
                    </div>
                    <div class="col-12">
                        <button class="btn btn-success rounded-pill px-4" type="submit" :disabled="enviando === 'webhook'">
                            <span v-if="enviando === 'webhook'" class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                            <i v-else class="fas fa-check me-1" aria-hidden="true"></i>Guardar webhook
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <div class="card border-0 shadow-sm mt-3">
            <div class="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center gap-2">
                <i class="fas fa-triangle-exclamation text-danger" aria-hidden="true"></i>
                <h6 class="mb-0 fw-medium">Zona de riesgo</h6>
            </div>
            <div class="card-body d-flex flex-wrap align-items-center justify-content-between gap-2">
                <p class="small text-muted mb-0">
                    Eliminar la empresa configuración de ApiDian borra sus datos de la cuenta del proveedor.
                    No se puede deshacer.
                </p>
                <button class="btn btn-outline-danger btn-sm rounded-pill px-3" type="button"
                    :disabled="enviando === 'eliminar'" @click="confirmarEliminarEmpresa">
                    <i class="fas fa-trash me-1" aria-hidden="true"></i>Eliminar empresa en ApiDian
                </button>
            </div>
        </div>
    </section>
    </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBillingStore } from '../store/billing.store.js';
import { usePermissionsStore } from '@store';
import { useAccessibleForm } from '@/hooks/useAccessibleForm.js';
import { useTableActions } from '@/hooks/useTableActions.js';
import { toast } from '@/utils/toast.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import BaseFormActions from '@/components/BaseFormActions.vue';

const route = useRoute();
const router = useRouter();
const store = useBillingStore();
const permissionsStore = usePermissionsStore();
const can = (accion) => permissionsStore.can(accion);

const uuidFijo = computed(() => (route.params.uuid ? String(route.params.uuid) : ''));
const proveedoresApidian = computed(() => store.providers.filter((p) => p.driver === 'apidian'));
const uuidSeleccionado = ref('');
const uuid = computed(() => uuidFijo.value || uuidSeleccionado.value);
const proveedor = computed(() => store.providers.find((p) => p.uuid === uuid.value) ?? null);

const pestanas = [
    { valor: 'empresa', etiqueta: 'Empresa', icono: 'fas fa-building' },
    { valor: 'software', etiqueta: 'Software', icono: 'fas fa-laptop-code' },
    { valor: 'certificado', etiqueta: 'Certificado', icono: 'fas fa-file-shield' },
    { valor: 'resoluciones', etiqueta: 'Resoluciones', icono: 'fas fa-stamp' },
    { valor: 'ambiente', etiqueta: 'Ambiente', icono: 'fas fa-toggle-on' },
    { valor: 'webhook', etiqueta: 'Webhook', icono: 'fas fa-satellite-dish' },
];
const pasoActivo = ref('empresa');
const enviando = ref('');

const goBack = () => router.push('/facturacion/proveedores');

// ── Paso 1: empresa ───────────────────────────────────────────────────────
const { formData: empresa, errors: erroresEmpresa, validateAndFocus, submit } = useAccessibleForm(
    {
        identification_number: '',
        dv: '',
        name: '',
        graphic_representation_name: '',
        registration_code: '',
        economic_activity: '',
        phone: '',
        address: '',
        email: '',
        merchant_registration: '',
        type_document_identification_id: 6,
        type_organization_id: 1,
        type_liability_id: 7,
        type_regime_id: 2,
        type_environment_id: 2,
        payroll_type_environment_id: 2,
        eqdocs_type_environment_id: 2,
        municipality_id: 149,
        municipality_name_facturation: '',
        municipality_name_eventos: '',
        postal_zone_code: '',
    },
    {
        identification_number: { required: true, label: 'NIT' },
        name: { required: true, label: 'Razón social' },
    }
);

const handleEmpresa = () => submit(async () => {
    if (!(await validateAndFocus())) return;
    enviando.value = 'empresa';
    try {
        await store.guardarConfiguracion(uuid.value, 'empresa', { ...empresa });
        await cargarConfiguracion();
    } finally {
        enviando.value = '';
    }
});

// ── Paso 2: software ──────────────────────────────────────────────────────
const software = reactive({ id: '', pin: '', url: '' });
const nomina = reactive({ idpayroll: '', pinpayroll: '', send: false });

const handleSoftware = async () => {
    enviando.value = 'software';
    try {
        await store.guardarConfiguracion(uuid.value, 'software', { ...software });
    } finally {
        enviando.value = '';
    }
};

const handleSoftwareNomina = async () => {
    enviando.value = 'software-nomina';
    try {
        await store.guardarConfiguracion(uuid.value, 'software-nomina', { ...nomina });
    } finally {
        enviando.value = '';
    }
};

// ── Paso 3: certificado ───────────────────────────────────────────────────
const certificado = reactive({ password: '' });
const certificadoBase64 = ref('');
const nombreCertificado = ref('');
const errorCertificado = ref('');
const errorCertificadoPassword = ref('');

const leerCertificado = (evento) => {
    const archivo = evento.target.files?.[0];
    errorCertificado.value = '';
    certificadoBase64.value = '';
    nombreCertificado.value = '';

    if (!archivo) return;
    if (archivo.size > 5 * 1024 * 1024) {
        errorCertificado.value = 'El certificado supera los 5 MB permitidos';
        return;
    }

    nombreCertificado.value = archivo.name;
    const lector = new FileReader();
    lector.onload = () => {
        const resultado = String(lector.result ?? '');
        certificadoBase64.value = resultado.includes(',') ? resultado.split(',').slice(1).join(',') : resultado;
    };
    lector.onerror = () => {
        errorCertificado.value = 'No se pudo leer el archivo del certificado';
    };
    lector.readAsDataURL(archivo);
};

const handleCertificado = async () => {
    errorCertificado.value = certificadoBase64.value ? '' : 'Selecciona el archivo del certificado (.p12 / .pfx)';
    errorCertificadoPassword.value = certificado.password.trim() ? '' : 'La clave del certificado es obligatoria';
    if (errorCertificado.value || errorCertificadoPassword.value) return;

    enviando.value = 'certificado';
    try {
        await store.guardarConfiguracion(uuid.value, 'certificado', {
            certificate: certificadoBase64.value,
            password: certificado.password,
        });
    } finally {
        enviando.value = '';
    }
};

// ── Pasos 4 y 5: resoluciones ─────────────────────────────────────────────
const resolucion = reactive({
    type_document_id: 1,
    prefix: '',
    resolution: '',
    resolution_date: '',
    technical_key: '',
    from_number: null,
    to_number: null,
    date_from: '',
    date_to: '',
});

const handleResolucion = async () => {
    if (!resolucion.prefix.trim() || !resolucion.from_number || !resolucion.to_number
        || !resolucion.date_from || !resolucion.date_to) {
        await toast('Falta información', 'Completa prefijo, rango y vigencias de la resolución', 'warning');
        return;
    }

    enviando.value = 'resolucion';
    try {
        await store.guardarConfiguracion(uuid.value, 'resolucion', { ...resolucion });
    } finally {
        enviando.value = '';
    }
};

// ── Paso 6: ambiente ──────────────────────────────────────────────────────
const ambiente = reactive({
    type_environment_id: 2,
    payroll_type_environment_id: 2,
    eqdocs_type_environment_id: 2,
    test_set_id: '',
});

const handleAmbiente = async () => {
    enviando.value = 'ambiente';
    try {
        await store.guardarConfiguracion(uuid.value, 'ambiente', { ...ambiente });
    } finally {
        enviando.value = '';
    }
};

// ── Webhook ───────────────────────────────────────────────────────────────
const webhook = reactive({ webhook_url: '', webhook_secret: '' });

const handleWebhook = async () => {
    enviando.value = 'webhook';
    try {
        await store.guardarConfiguracion(uuid.value, 'webhook', { ...webhook });
    } finally {
        enviando.value = '';
    }
};

const confirmarEliminarEmpresa = async () => {
    const acciones = useTableActions({
        deleteItem: () => store.eliminarConfigEmpresa(uuid.value),
    });
    await acciones.confirmDelete(
        { name: proveedor.value?.name ?? 'la empresa' },
        {
            title: '¿Eliminar la empresa en ApiDian?',
            html: `<p class="mb-2">Se eliminará la configuración de la cuenta en ApiDian.</p>
                   <div class="alert alert-danger small mb-0 mt-2">Esta acción no se puede deshacer.</div>`,
            nameField: 'name',
        }
    );
};

// ── Carga ─────────────────────────────────────────────────────────────────
const cargarConfiguracion = async () => {
    try {
        const config = await store.fetchProviderConfig(uuid.value);
        if (!config) return;

        Object.keys(empresa).forEach((clave) => {
            if (config[clave] !== undefined && config[clave] !== null) empresa[clave] = config[clave];
        });
        if (config.software) Object.assign(software, config.software);
        if (config.software_payroll) Object.assign(nomina, config.software_payroll);
        if (config.environment) Object.assign(ambiente, config.environment);
        if (config.webhook) Object.assign(webhook, config.webhook);
    } catch (_e) {
        /* el store ya notificó; puede no estar configurada aún */
    }
};

onMounted(async () => {
    if (!can('billing_providers.update')) {
        router.replace('/facturacion/proveedores');
        return;
    }
    try { await store.fetchProviders(); } catch (_e) { /* notificado */ }

    uuidSeleccionado.value = uuidFijo.value
        || (proveedoresApidian.value.find((p) => p.is_active) ?? proveedoresApidian.value[0])?.uuid
        || '';

    await cargarConfiguracion();
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
.nav-pills .nav-link { border-radius: 999px; font-size: 0.875rem; }
.nav-pills .nav-link.active { background-color: #2c7be5; }
:focus-visible { outline: 2px solid #0d6efd !important; outline-offset: 2px; }
</style>
