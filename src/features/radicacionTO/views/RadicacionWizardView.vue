<template>
  <div class="row gx-3">
    <div class="col-12 col-xxl-10 offset-xxl-1 col-xl-12">
      <BasePageHeader
        title="Expediente de radicación"
        :subtitle="subtitulo"
        icon="fad fa-id-card text-primary"
        :breadcrumbs="[{ label: 'Radicación de tarjeta de operación', to: '/radicacion' }, { label: codigo }]"
        :show-back="true"
        @back="volver"
      />

      <!-- Estado de carga -->
      <div v-if="cargandoDetalle" class="d-flex align-items-center gap-2 text-muted mt-4 p-3">
        <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
        <span role="status">Cargando expediente…</span>
      </div>

      <template v-else-if="detalle">
        <!-- ══════════════ Encabezado del expediente ══════════════ -->
        <div class="card border-0 shadow-sm mt-3 exp-card">
          <!-- Header info -->
          <div class="exp-header px-4 py-3 border-bottom">
            <div class="d-flex flex-wrap align-items-center gap-3">
              <div class="d-flex align-items-center gap-3">
                <span class="exp-icon-wrap" aria-hidden="true">
                  <svg width="22" height="22" fill="none" stroke="#2563eb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2.5"/>
                    <circle cx="9" cy="11" r="2"/>
                    <path d="M5.8 16c.5-1.4 1.7-2 3.2-2s2.7.6 3.2 2M14.5 10h3.5M14.5 13.5h3.5"/>
                  </svg>
                </span>
                <div>
                  <h2 class="exp-vehicle-title mb-1">
                    {{ lineaOculta ? 'Trámite completado' : etiquetaPaso(pasoActual?.paso) }}
                  </h2>
                  <div class="exp-meta d-flex align-items-center gap-3 flex-wrap">
                    <span class="exp-plate" :aria-label="`Placa ${placa}`">{{ placa || '—' }}</span>
                    <span><span class="exp-meta-label">Tipo </span><strong>{{ etiquetaTipo(detalle?.expediente?.link_type) }}</strong></span>
                    <span><span class="exp-meta-label">Código </span><strong>{{ codigo }}</strong></span>
                  </div>
                </div>
              </div>
              <div class="exp-progress ms-auto" v-if="!lineaOculta">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="exp-progress-label">Paso {{ indiceActual + 1 }} de {{ linea.length }}</span>
                  <span class="exp-status-badge" :class="pasoActual?.estado === 'EN_PROCESO' ? 'status-active' : 'status-done'">
                    {{ pasoActual?.estado === 'EN_PROCESO' ? 'En proceso' : pasoActual?.estado }}
                  </span>
                </div>
                <div class="exp-segments">
                  <span
                    v-for="(p, i) in linea"
                    :key="i"
                    class="exp-segment"
                    :class="{
                      'seg-done':    p.estado === 'COMPLETADO',
                      'seg-active':  p.estado === 'EN_PROCESO',
                      'seg-pending': !['COMPLETADO','EN_PROCESO'].includes(p.estado),
                    }"
                  ></span>
                </div>
              </div>
              <div v-else class="ms-auto">
                <span class="exp-status-badge status-done">
                  <i class="fas fa-check me-1" aria-hidden="true"></i>Completado
                </span>
              </div>
            </div>
          </div>

          <div class="card-body px-4 py-4 pb-2">
            <!-- Línea de tiempo -->
            <RadicacionTimeline
              ref="lineaTiempo"
              :linea="linea"
              :documentos="detalle?.documentos ?? {}"
              :expediente-uuid="detalle?.expediente?.uuid ?? ''"
              :estado-global="detalle?.expediente?.global_status ?? ''"
            />
          </div>

          <!-- ══════════════ Footer sticky: Cerrar paso ══════════════ -->
          <div v-if="puedeActualizar" class="exp-footer px-4 py-3 border-top">
            <div class="d-flex flex-wrap align-items-center gap-3">
              <div>
                <p class="exp-footer-title mb-1">Cerrar el paso actual</p>
                <p class="exp-footer-sub mb-0">Al cerrar, el trámite avanza al siguiente paso automáticamente.</p>
              </div>
              <button
                class="btn btn-success exp-btn-close ms-auto d-inline-flex align-items-center gap-2"
                :disabled="cargando || pasoActual?.estado === 'COMPLETADO'"
                @click="cerrarPaso"
              >
                <i class="fas" :class="cargando ? 'fa-spinner fa-spin' : 'fa-circle-check'" aria-hidden="true"></i>
                {{ lineaOculta ? 'Trámite finalizado' : `Cerrar paso ${indiceActual + 1}` }}
              </button>
            </div>
          </div>

          <div class="px-4 py-4 pt-3">

            <!-- ══════════════ Paso: Tarjeta de Operación ══════════════ -->
            <template v-if="esPasoTarjeta">
              <!-- Cabecera de sección -->
              <div class="d-flex align-items-center gap-2 mb-3">
                <span class="rounded-circle bg-warning bg-opacity-10 d-flex align-items-center justify-content-center" style="width:32px;height:32px;">
                  <i class="fad fa-file-contract text-warning" aria-hidden="true"></i>
                </span>
                <h2 class="h6 mb-0 fw-semibold">Contratos requeridos para tarjeta de operación</h2>
              </div>
              <p class="text-muted mb-4 noa-intro">
                Debe crear ambos contratos antes de poder firmar. Haga clic en cada botón para completar el formulario correspondiente.
              </p>

              <!-- Tarjetas resumen + botones de apertura de modales -->
              <div class="row g-3 mb-4">
                <!-- Card: Admin Flota -->
                <div class="col-md-6">
                  <div class="card h-100 border" :class="contratoAdmin ? 'border-success' : 'border-dashed'">
                    <div class="card-body d-flex flex-column gap-2 p-3">
                      <div class="d-flex align-items-center gap-2">
                        <span class="rounded-circle d-flex align-items-center justify-content-center"
                          style="width:36px;height:36px;"
                          :class="contratoAdmin ? 'bg-success bg-opacity-10' : 'bg-primary bg-opacity-10'">
                          <i class="fad fa-truck" aria-hidden="true"
                            :class="contratoAdmin ? 'text-success' : 'text-primary'"></i>
                        </span>
                        <div class="flex-grow-1">
                          <div class="noa-card-title">Administración de Flota</div>
                          <div v-if="contratoAdmin" class="text-success noa-meta">
                            <i class="fas fa-check me-1" aria-hidden="true"></i>Nº {{ contratoAdmin.numero }}
                          </div>
                          <div v-else class="text-muted noa-meta">Pendiente de creación</div>
                        </div>
                        <span class="badge rounded-pill" :class="estadoContrato(contratoAdmin).clase">
                          <i class="fas me-1" :class="estadoContrato(contratoAdmin).icono" aria-hidden="true"></i>
                          {{ estadoContrato(contratoAdmin).texto }}
                        </span>
                      </div>
                      <button
                        type="button"
                        class="btn btn-sm mt-auto d-inline-flex align-items-center gap-1 w-100 justify-content-center"
                        :class="contratoAdmin ? 'btn-outline-success' : 'btn-primary'"
                        data-bs-toggle="modal"
                        data-bs-target="#modal-admin"
                        :aria-label="contratoAdmin ? 'Ver o crear otro contrato de administración de flota' : 'Crear contrato de administración de flota'"
                      >
                        <i class="fas" :class="contratoAdmin ? 'fa-rotate-right' : 'fa-plus'" aria-hidden="true"></i>
                        {{ contratoAdmin ? 'Crear otro' : 'Crear contrato' }}
                      </button>
                      <button
                        v-if="puedeCrear && contratoAdmin && !contratoAdmin.firmado"
                        type="button"
                        class="btn btn-sm btn-outline-primary d-inline-flex align-items-center justify-content-center gap-1 w-100"
                        :disabled="generandoEnlace === contratoAdmin.uuid"
                        :aria-label="`Enviar enlace de firma del contrato de administración de flota a ${detalle?.propietario?.nombre ?? 'el afiliado'}`"
                        @click="generarEnlace(contratoAdmin)"
                      >
                        <i class="fas" :class="generandoEnlace === contratoAdmin.uuid ? 'fa-spinner fa-spin' : 'fa-paper-plane'" aria-hidden="true"></i>
                        {{ generadoPorContrato[contratoAdmin.uuid] ? 'Generar enlace nuevo' : 'Enviar enlace de firma' }}
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Card: Prestación Servicios -->
                <div class="col-md-6">
                  <div class="card h-100 border" :class="contratoPrest ? 'border-success' : 'border-dashed'">
                    <div class="card-body d-flex flex-column gap-2 p-3">
                      <div class="d-flex align-items-center gap-2">
                        <span class="rounded-circle d-flex align-items-center justify-content-center"
                          style="width:36px;height:36px;"
                          :class="contratoPrest ? 'bg-success bg-opacity-10' : 'bg-primary bg-opacity-10'">
                          <i class="fad fa-handshake" aria-hidden="true"
                            :class="contratoPrest ? 'text-success' : 'text-primary'"></i>
                        </span>
                        <div class="flex-grow-1">
                          <div class="noa-card-title">Prestación de Servicios</div>
                          <div v-if="contratoPrest" class="text-success noa-meta">
                            <i class="fas fa-check me-1" aria-hidden="true"></i>Nº {{ contratoPrest.numero }}
                          </div>
                          <div v-else class="text-muted noa-meta">Pendiente de creación</div>
                        </div>
                        <span class="badge rounded-pill" :class="estadoContrato(contratoPrest).clase">
                          <i class="fas me-1" :class="estadoContrato(contratoPrest).icono" aria-hidden="true"></i>
                          {{ estadoContrato(contratoPrest).texto }}
                        </span>
                      </div>
                      <button
                        type="button"
                        class="btn btn-sm mt-auto d-inline-flex align-items-center gap-1 w-100 justify-content-center"
                        :class="contratoPrest ? 'btn-outline-success' : 'btn-primary'"
                        data-bs-toggle="modal"
                        data-bs-target="#modal-prest"
                        :aria-label="contratoPrest ? 'Ver o crear otro contrato de prestación de servicios' : 'Crear contrato de prestación de servicios'"
                      >
                        <i class="fas" :class="contratoPrest ? 'fa-rotate-right' : 'fa-plus'" aria-hidden="true"></i>
                        {{ contratoPrest ? 'Crear otro' : 'Crear contrato' }}
                      </button>
                      <button
                        v-if="puedeCrear && contratoPrest && !contratoPrest.firmado"
                        type="button"
                        class="btn btn-sm btn-outline-primary d-inline-flex align-items-center justify-content-center gap-1 w-100"
                        :disabled="generandoEnlace === contratoPrest.uuid"
                        :aria-label="`Enviar enlace de firma del contrato de prestación de servicios a ${detalle?.propietario?.nombre ?? 'el afiliado'}`"
                        @click="generarEnlace(contratoPrest)"
                      >
                        <i class="fas" :class="generandoEnlace === contratoPrest.uuid ? 'fa-spinner fa-spin' : 'fa-paper-plane'" aria-hidden="true"></i>
                        {{ generadoPorContrato[contratoPrest.uuid] ? 'Generar enlace nuevo' : 'Enviar enlace de firma' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Aviso si no hay contratos aún -->
              <div v-if="contratos.length === 0" class="alert alert-warning d-flex align-items-center gap-2 mb-4" role="alert">
                <i class="fas fa-triangle-exclamation fa-lg flex-shrink-0" aria-hidden="true"></i>
                <span>Registre primero los dos contratos para habilitar las firmas.</span>
              </div>

              <!-- Aviso de contratos ya firmados -->
              <div
                v-if="todosFirmados"
                class="alert alert-success d-flex align-items-center gap-2 mb-4"
                role="status"
              >
                <i class="fas fa-circle-check fa-lg flex-shrink-0" aria-hidden="true"></i>
                <span>Los dos contratos ya están firmados. Ya puede finalizar el trámite.</span>
              </div>

              <!-- ─── Archivos TXT Portal TO RUNT ─── -->
              <div class="border-top pt-4 mt-2">
                <div class="d-flex align-items-center gap-2 mb-3">
                  <i class="fad fa-file-export text-secondary" aria-hidden="true"></i>
                  <h3 class="h6 mb-0 fw-semibold">Archivos TXT — Portal TO RUNT</h3>
                </div>
                <div v-if="puedeActualizar" class="d-flex flex-wrap gap-2">
                  <button
                    class="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
                    :disabled="cargando"
                    @click="txt('ADMIN_FLOTA')"
                  >
                    <i class="fas fa-file-lines" aria-hidden="true"></i>
                    TXT administración de flota
                  </button>
                  <button
                    class="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
                    :disabled="cargando"
                    @click="txt('PRESTACION')"
                  >
                    <i class="fas fa-file-lines" aria-hidden="true"></i>
                    TXT prestación de servicios
                  </button>
                </div>
                <div v-if="lote" class="mt-3">
                  <label class="form-label fw-medium mb-1">
                    <i class="fas fa-terminal me-1" aria-hidden="true"></i>Contenido generado
                  </label>
                  <pre class="bg-light border rounded-2 p-3 small" style="white-space: pre-wrap; word-break: break-all; max-height: 280px; overflow-y: auto;">{{ lote.content }}</pre>
                </div>
              </div>
            </template>
          </div>
        </div>
      </template>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════
       MODAL: Contrato de Administración de Flota
  ══════════════════════════════════════════════════════ -->
  <div
    id="modal-admin"
    class="modal fade"
    tabindex="-1"
    aria-labelledby="modal-admin-titulo"
    aria-modal="true"
    role="dialog"
  >
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header border-bottom">
          <div class="d-flex align-items-center gap-2">
            <span class="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center" style="width:34px;height:34px;" aria-hidden="true">
              <i class="fad fa-truck text-primary"></i>
            </span>
            <h2 id="modal-admin-titulo" class="modal-title fs-6 fw-semibold mb-0">Contrato de Administración de Flota</h2>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>

        <div class="modal-body px-4 py-4">
          <form id="form-admin" @submit.prevent="crearContratoAdmin" novalidate>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label required noa-label" for="admin-numero">Número de contrato</label>
                <input
                  id="admin-numero"
                  v-model="formAdmin.contract_number"
                  class="form-control"
                  type="text"
                  autocomplete="off"
                  placeholder="Ej. CA-2026-001"
                  :class="{ 'is-invalid': erroresAdmin.contract_number }"
                  :aria-invalid="!!erroresAdmin.contract_number"
                  :aria-describedby="erroresAdmin.contract_number ? 'admin-numero-error' : undefined"
                />
                <div v-if="erroresAdmin.contract_number" id="admin-numero-error" class="invalid-feedback d-block" role="alert">
                  {{ erroresAdmin.contract_number }}
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label required noa-label" for="admin-fecha-emision">Fecha de emisión</label>
                <DateInput
                  id="admin-fecha-emision"
                  v-model="formAdmin.issue_date"
                  class="form-control"
                  placeholder="dd/mm/aaaa"
                  :class="{ 'is-invalid': erroresAdmin.issue_date }"
                  :aria-invalid="!!erroresAdmin.issue_date"
                  :aria-describedby="erroresAdmin.issue_date ? 'admin-fecha-emision-error' : undefined"
                />
                <div v-if="erroresAdmin.issue_date" id="admin-fecha-emision-error" class="invalid-feedback d-block" role="alert">
                  {{ erroresAdmin.issue_date }}
                </div>
              </div>

              <div class="col-md-4">
                <label class="form-label required noa-label" for="admin-fecha-inicio">Fecha de inicio</label>
                <DateInput
                  id="admin-fecha-inicio"
                  v-model="formAdmin.start_date"
                  class="form-control"
                  placeholder="dd/mm/aaaa"
                  :class="{ 'is-invalid': erroresAdmin.start_date }"
                  :aria-invalid="!!erroresAdmin.start_date"
                  :aria-describedby="erroresAdmin.start_date ? 'admin-fecha-inicio-error' : undefined"
                />
                <div v-if="erroresAdmin.start_date" id="admin-fecha-inicio-error" class="invalid-feedback d-block" role="alert">
                  {{ erroresAdmin.start_date }}
                </div>
              </div>

              <div class="col-md-4">
                <label class="form-label required noa-label" for="admin-duracion">Duración (días)</label>
                <input
                  id="admin-duracion"
                  type="number"
                  v-model.number="formAdmin.duration"
                  class="form-control"
                  min="1"
                  :class="{ 'is-invalid': erroresAdmin.duration }"
                  :aria-invalid="!!erroresAdmin.duration"
                  :aria-describedby="erroresAdmin.duration ? 'admin-duracion-error' : undefined"
                />
                <div v-if="erroresAdmin.duration" id="admin-duracion-error" class="invalid-feedback d-block" role="alert">
                  {{ erroresAdmin.duration }}
                </div>
              </div>

              <div class="col-md-4">
                <label class="form-label noa-label" for="admin-fecha-fin">
                  Fecha de fin
                  <small class="text-muted fw-normal">(calculada)</small>
                </label>
                <DateInput
                  id="admin-fecha-fin"
                  v-model="formAdmin.end_date"
                  class="form-control bg-light"
                  readonly
                  aria-readonly="true"
                  :class="{ 'is-invalid': erroresAdmin.end_date }"
                />
                <div class="form-text">
                  <i class="fas fa-circle-info me-1" aria-hidden="true"></i>Se calcula: inicio + duración
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label noa-label" for="admin-valor">Valor de tasación</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input
                    id="admin-valor"
                    type="number"
                    step="0.01"
                    min="0"
                    v-model.number="formAdmin.valuation_amount"
                    class="form-control"
                    :class="{ 'is-invalid': erroresAdmin.valuation_amount }"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        <div class="modal-footer border-top d-flex gap-2">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
            <i class="fas fa-xmark me-1" aria-hidden="true"></i>Cancelar
          </button>
          <button
            type="submit"
            form="form-admin"
            class="btn btn-primary d-inline-flex align-items-center gap-2"
            :disabled="cargandoContratoAdmin"
          >
            <i class="fas" :class="cargandoContratoAdmin ? 'fa-spinner fa-spin' : 'fa-plus-circle'" aria-hidden="true"></i>
            {{ cargandoContratoAdmin ? 'Guardando…' : 'Crear contrato' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════
       MODAL: Contrato de Prestación de Servicios
  ══════════════════════════════════════════════════════ -->
  <div
    id="modal-prest"
    class="modal fade"
    tabindex="-1"
    aria-labelledby="modal-prest-titulo"
    aria-modal="true"
    role="dialog"
  >
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header border-bottom">
          <div class="d-flex align-items-center gap-2">
            <span class="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center" style="width:34px;height:34px;" aria-hidden="true">
              <i class="fad fa-handshake text-primary"></i>
            </span>
            <h2 id="modal-prest-titulo" class="modal-title fs-6 fw-semibold mb-0">Contrato de Prestación de Servicios</h2>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>

        <div class="modal-body px-4 py-4">
          <form id="form-prest" @submit.prevent="crearContratoPrestacion" novalidate>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label required noa-label" for="prest-numero">Número de contrato</label>
                <input
                  id="prest-numero"
                  v-model="formPrest.contract_number"
                  class="form-control"
                  type="text"
                  autocomplete="off"
                  placeholder="Ej. CP-2026-001"
                  :class="{ 'is-invalid': erroresPrest.contract_number }"
                  :aria-invalid="!!erroresPrest.contract_number"
                  :aria-describedby="erroresPrest.contract_number ? 'prest-numero-error' : undefined"
                />
                <div v-if="erroresPrest.contract_number" id="prest-numero-error" class="invalid-feedback d-block" role="alert">
                  {{ erroresPrest.contract_number }}
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label required noa-label" for="prest-fecha-emision">Fecha de emisión</label>
                <DateInput
                  id="prest-fecha-emision"
                  v-model="formPrest.issue_date"
                  class="form-control"
                  placeholder="dd/mm/aaaa"
                  :class="{ 'is-invalid': erroresPrest.issue_date }"
                  :aria-invalid="!!erroresPrest.issue_date"
                  :aria-describedby="erroresPrest.issue_date ? 'prest-fecha-emision-error' : undefined"
                />
                <div v-if="erroresPrest.issue_date" id="prest-fecha-emision-error" class="invalid-feedback d-block" role="alert">
                  {{ erroresPrest.issue_date }}
                </div>
              </div>

              <div class="col-md-4">
                <label class="form-label required noa-label" for="prest-fecha-inicio">Fecha de inicio</label>
                <DateInput
                  id="prest-fecha-inicio"
                  v-model="formPrest.start_date"
                  class="form-control"
                  placeholder="dd/mm/aaaa"
                  :class="{ 'is-invalid': erroresPrest.start_date }"
                  :aria-invalid="!!erroresPrest.start_date"
                  :aria-describedby="erroresPrest.start_date ? 'prest-fecha-inicio-error' : undefined"
                />
                <div v-if="erroresPrest.start_date" id="prest-fecha-inicio-error" class="invalid-feedback d-block" role="alert">
                  {{ erroresPrest.start_date }}
                </div>
              </div>

              <div class="col-md-4">
                <label class="form-label required noa-label" for="prest-duracion">Duración (días)</label>
                <input
                  id="prest-duracion"
                  type="number"
                  v-model.number="formPrest.duration"
                  class="form-control"
                  min="1"
                  :class="{ 'is-invalid': erroresPrest.duration }"
                  :aria-invalid="!!erroresPrest.duration"
                  :aria-describedby="erroresPrest.duration ? 'prest-duracion-error' : undefined"
                />
                <div v-if="erroresPrest.duration" id="prest-duracion-error" class="invalid-feedback d-block" role="alert">
                  {{ erroresPrest.duration }}
                </div>
              </div>

              <div class="col-md-4">
                <label class="form-label noa-label" for="prest-fecha-fin">
                  Fecha de fin
                  <small class="text-muted fw-normal">(calculada)</small>
                </label>
                <DateInput
                  id="prest-fecha-fin"
                  v-model="formPrest.end_date"
                  class="form-control bg-light"
                  readonly
                  aria-readonly="true"
                  :class="{ 'is-invalid': erroresPrest.end_date }"
                />
                <div class="form-text">
                  <i class="fas fa-circle-info me-1" aria-hidden="true"></i>Se calcula: inicio + duración
                </div>
              </div>

              <div class="col-md-4">
                <label class="form-label noa-label" for="prest-valor">Valor de tasación</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input
                    id="prest-valor"
                    type="number"
                    step="0.01"
                    min="0"
                    v-model.number="formPrest.valuation_amount"
                    class="form-control"
                  />
                </div>
              </div>

              <div class="col-md-4">
                <label class="form-label noa-label" for="prest-cobertura">Cobertura</label>
                <input
                  id="prest-cobertura"
                  v-model="formPrest.coverage"
                  class="form-control"
                  type="text"
                  autocomplete="off"
                  placeholder="NACIONAL"
                />
              </div>

              <div class="col-12">
                <label class="form-label noa-label" for="prest-objeto">Objeto del contrato</label>
                <textarea
                  id="prest-objeto"
                  v-model="formPrest.object_description"
                  class="form-control"
                  rows="3"
                  placeholder="Describa el objeto del contrato…"
                ></textarea>
              </div>
            </div>
          </form>
        </div>

        <div class="modal-footer border-top d-flex gap-2">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
            <i class="fas fa-xmark me-1" aria-hidden="true"></i>Cancelar
          </button>
          <button
            type="submit"
            form="form-prest"
            class="btn btn-primary d-inline-flex align-items-center gap-2"
            :disabled="cargandoContratoPrest"
          >
            <i class="fas" :class="cargandoContratoPrest ? 'fa-spinner fa-spin' : 'fa-plus-circle'" aria-hidden="true"></i>
            {{ cargandoContratoPrest ? 'Guardando…' : 'Crear contrato' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════
       MODAL: Enlace de firma para el afiliado
  ══════════════════════════════════════════════════════ -->
  <div
    id="modal-enlace"
    class="modal fade"
    tabindex="-1"
    aria-labelledby="modal-enlace-titulo"
    aria-modal="true"
    role="dialog"
  >
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header border-bottom">
          <div class="d-flex align-items-center gap-2">
            <span class="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center" style="width:34px;height:34px;" aria-hidden="true">
              <i class="fad fa-paper-plane text-primary"></i>
            </span>
            <h2 id="modal-enlace-titulo" class="modal-title fs-6 fw-semibold mb-0">Enlace de firma para el afiliado</h2>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>

        <div class="modal-body px-4 py-4">
          <div v-if="enlaceFirma">
            <dl class="row small mb-3">
              <dt class="col-4 text-muted fw-normal">Contrato</dt>
              <dd class="col-8 mb-1">{{ etiquetaContrato(enlaceFirma.contrato) }} N.° {{ enlaceFirma.contrato.numero }}</dd>
              <dt class="col-4 text-muted fw-normal">Firmante</dt>
              <dd class="col-8 mb-1">{{ enlaceFirma.contrato.firmante }}</dd>
              <dt class="col-4 text-muted fw-normal">Vence</dt>
              <dd class="col-8 mb-0">{{ enlaceFirma.vigencia }}</dd>
            </dl>

            <label class="form-label noa-label" for="enlace-url">Enlace de un solo uso</label>
            <div class="input-group mb-2">
              <input
                id="enlace-url"
                class="form-control font-monospace small"
                type="text"
                readonly
                :value="enlaceFirma.url"
              />
              <button
                class="btn btn-outline-secondary"
                type="button"
                @click="copiarEnlace"
              >
                <i class="fas fa-copy me-1" aria-hidden="true"></i>Copiar
              </button>
            </div>
            <p class="form-text mb-3">
              Envíeselo al afiliado por el canal que prefiera. El enlace solo funciona una vez y expira en {{ enlaceFirma.vigencia_horas }} horas.
            </p>

            <div class="d-flex flex-wrap gap-2">
              <a
                v-if="enlaceFirma.telefono"
                class="btn btn-success d-inline-flex align-items-center gap-2"
                :href="enlaceWhatsapp"
                target="_blank"
                rel="noopener"
              >
                <i class="fab fa-whatsapp fa-lg" aria-hidden="true"></i>
                Enviar por WhatsApp
              </a>
              <button
                v-if="enlaceFirma.correo"
                type="button"
                class="btn btn-outline-primary d-inline-flex align-items-center gap-2"
                :disabled="enviandoCorreo"
                @click="enviarPorCorreo"
              >
                <i class="fas" :class="enviandoCorreo ? 'fa-spinner fa-spin' : 'fa-envelope'" aria-hidden="true"></i>
                {{ enviandoCorreo ? 'Enviando…' : 'Enviar por correo' }}
              </button>
            </div>
            <p v-if="!enlaceFirma.telefono && !enlaceFirma.correo" class="text-muted small mb-0 mt-2" role="note">
              <i class="fas fa-circle-info me-1" aria-hidden="true"></i>
              El afiliado no tiene teléfono ni correo registrados. Copie el enlace y envíelo por el medio que tenga a la mano.
            </p>
          </div>

          <div v-else class="text-center py-4" role="status">
            <i class="fas fa-spinner fa-spin fa-2x text-primary mb-3 d-block" aria-hidden="true"></i>
            <p class="text-muted mb-0">Generando enlace…</p>
          </div>
        </div>

        <div class="modal-footer border-top">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BasePageHeader from '@/components/BasePageHeader.vue';
import DateInput from '@/components/form/DateInput.vue';
import RadicacionTimeline from '../components/RadicacionTimeline.vue';
import service, { mensajeDeError } from '../services/radicacion.service.js';
import { fechasAutomaticas, validarFechasContrato } from '../utils/fechasContrato.js';
import { etiquetaPaso, etiquetaTipo, normalizarLinea } from '../utils/pasosRadicacion.js';
import { usePermissionsStore } from '@store';
import fleetService from '../services/fleetServiceContract.service.js';
import prestationService from '../services/serviceProvisionContract.service.js';
import { toast } from '@/utils/toast.js';

const route = useRoute();
const router = useRouter();
const cargando = ref(false);
const cargandoDetalle = ref(true);
const detalle = ref(null);
const lote = ref(null);

const esPasoTarjeta = computed(() => pasoActual.value?.paso === 'TARJETA_DE_OPERACION');
const contratos = computed(() => detalle.value?.contratos ?? []);
const contratoAdmin = computed(() => contratos.value.find((c) => c.origen === 'ADMIN_FLOTA') ?? null);
const contratoPrest = computed(() => contratos.value.find((c) => c.origen === 'PRESTACION') ?? null);
/** Ambos contratos existen y están firmados: ya se puede cerrar el trámite. */
const todosFirmados = computed(() =>
  contratoAdmin.value?.firmado === true && contratoPrest.value?.firmado === true);
/** Estado de una tarjeta de contrato: no creado, pendiente de firma o firmado. */
const estadoContrato = (contrato) => {
  if (!contrato) {
    return { texto: 'Pendiente', icono: 'fa-clock', clase: 'bg-secondary bg-opacity-50 text-secondary-emphasis' };
  }
  return contrato.firmado
    ? { texto: 'Firmado', icono: 'fa-circle-check', clase: 'bg-success' }
    : { texto: 'Sin firmar', icono: 'fa-pen', clase: 'bg-warning text-dark' };
};

const etiquetaContrato = (c) => c.origen === 'ADMIN_FLOTA' ? 'Contrato de administración de flota' : 'Contrato de prestación de servicios';
const permissionsStore = usePermissionsStore();
const puedeCrear = computed(() => permissionsStore.can('radicacion_to.create'));
const puedeActualizar = computed(() => permissionsStore.can('radicacion_to.update'));
const linea = computed(() => normalizarLinea(detalle.value?.linea_tiempo ?? []));
const indiceActual = computed(() => {
  const i = linea.value.findIndex((p) => p.estado === 'EN_PROCESO');
  return i === -1 ? linea.value.length - 1 : i;
});
const pasoActual = computed(() => linea.value[indiceActual.value] ?? null);
const codigo = computed(() => detalle.value?.expediente?.procedure_code ?? '');
const placa = computed(() => detalle.value?.expediente?.vehicle?.vehicle_license_plate ?? detalle.value?.expediente?.vehicle_uuid ?? '');
const lineaOculta = computed(() => detalle.value?.expediente?.global_status === 'COMPLETADO');
const subtitulo = computed(() => lineaOculta.value
  ? `Trámite completado — expediente ${codigo.value}`
  : (pasoActual.value ? `Documento actual: ${etiquetaPaso(pasoActual.value.paso)}` : 'Detalle del expediente'));

// ── Utilidad: cerrar un modal Bootstrap por id ──
function cerrarModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  // bootstrap.Modal puede no estar en window en todos los entornos; usar el API del elemento
  const modal = window.bootstrap?.Modal?.getInstance(el);
  if (modal) modal.hide();
}

// ── Formularios de contratos ──
const hoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formAdmin = reactive({
  company_uuid: '', procedure_uuid: '', vehicle_uuid: '', third_party_uuid: '',
  contract_number: '', issue_date: '', start_date: '', end_date: '',
  duration: 365, valuation_amount: 0,
});
const formPrest = reactive({
  company_uuid: '', procedure_uuid: '', vehicle_uuid: '', third_party_uuid: '',
  contract_number: '', issue_date: '', start_date: '', end_date: '',
  duration: 365, valuation_amount: 0, coverage: 'NACIONAL', object_description: '',
});
const erroresAdmin = reactive({});
const erroresPrest = reactive({});
const cargandoContratoAdmin = ref(false);
const cargandoContratoPrest = ref(false);

watch(() => [formAdmin.start_date, formAdmin.duration], () => fechasAutomaticas(formAdmin));
watch(() => [formPrest.start_date, formPrest.duration], () => fechasAutomaticas(formPrest));

const vaciarAdmin = () => {
  Object.assign(formAdmin, {
    contract_number: '', issue_date: '', start_date: '', end_date: '',
    duration: 365, valuation_amount: 0,
  });
  formAdmin.start_date = hoy();
  fechasAutomaticas(formAdmin);
};

const vaciarPrest = () => {
  Object.assign(formPrest, {
    contract_number: '', issue_date: '', start_date: '', end_date: '',
    duration: 365, valuation_amount: 0, object_description: '',
  });
  formPrest.start_date = hoy();
  fechasAutomaticas(formPrest);
};

function volver() { router.push('/radicacion'); }

async function cargar() {
  cargandoDetalle.value = true;
  try {
    const r = await service.detalle(route.params.uuid);
    detalle.value = r.data?.data ?? r.data;
    if (esPasoTarjeta.value) {
      for (const form of [formAdmin, formPrest]) {
        if (!form.start_date) form.start_date = hoy();
        fechasAutomaticas(form);
      }
    }
  } catch { toast('No se cargó el expediente', '', 'error'); }
  finally { cargandoDetalle.value = false; }
}

async function cerrarPaso() {
  if (!pasoActual.value?.uuid) return;
  cargando.value = true;
  try {
    const r = await service.avanzar(pasoActual.value.uuid);
    detalle.value = r.data?.data ?? r.data;
    toast('Paso cerrado', '', 'success');
  } catch (e) { toast('No se pudo cerrar el paso', mensajeDeError(e, 'Revise los requisitos del paso.'), 'error'); }
  finally { cargando.value = false; }
}

async function txt(origin) {
  if (!pasoActual.value?.uuid) return;
  cargando.value = true;
  try {
    const r = await service.generarTxt(pasoActual.value.uuid, origin);
    lote.value = r.data?.data ?? r.data;
  } catch { toast('Revise requisitos antes del TXT', '', 'error'); }
  finally { cargando.value = false; }
}

async function crearContratoAdmin() {
  Object.keys(erroresAdmin).forEach((k) => delete erroresAdmin[k]);
  fechasAutomaticas(formAdmin);
  const falla = validarFechasContrato(formAdmin);
  if (Object.keys(falla).length) { Object.assign(erroresAdmin, falla); return; }
  cargandoContratoAdmin.value = true;
  try {
    const payload = {
      procedure_uuid: pasoActual.value.uuid,
      company_uuid: detalle.value.expediente.company_uuid,
      vehicle_uuid: detalle.value.expediente.vehicle_uuid,
      third_party_uuid: detalle.value.expediente.third_party_uuid,
      contract_number: formAdmin.contract_number.trim(),
      issue_date: formAdmin.issue_date,
      start_date: formAdmin.start_date,
      end_date: formAdmin.end_date,
      duration: Number(formAdmin.duration),
      valuation_amount: Number(formAdmin.valuation_amount) || 0,
    };
    await fleetService.create(payload);
    toast('Contrato de administración creado', '', 'success');
    cerrarModal('modal-admin');
    vaciarAdmin();
    await cargar();
  } catch (e) { toast('No se pudo crear el contrato', mensajeDeError(e), 'error'); }
  finally { cargandoContratoAdmin.value = false; }
}

async function crearContratoPrestacion() {
  Object.keys(erroresPrest).forEach((k) => delete erroresPrest[k]);
  fechasAutomaticas(formPrest);
  const falla = validarFechasContrato(formPrest);
  if (Object.keys(falla).length) { Object.assign(erroresPrest, falla); return; }
  cargandoContratoPrest.value = true;
  try {
    const payload = {
      procedure_uuid: pasoActual.value.uuid,
      company_uuid: detalle.value.expediente.company_uuid,
      vehicle_uuid: detalle.value.expediente.vehicle_uuid,
      third_party_uuid: detalle.value.expediente.third_party_uuid,
      contract_number: formPrest.contract_number.trim(),
      issue_date: formPrest.issue_date,
      start_date: formPrest.start_date,
      end_date: formPrest.end_date,
      duration: Number(formPrest.duration),
      valuation_amount: Number(formPrest.valuation_amount) || 0,
      coverage: formPrest.coverage.trim() || 'NACIONAL',
      object_description: formPrest.object_description.trim() || null,
    };
    await prestationService.create(payload);
    toast('Contrato de prestación creado', '', 'success');
    cerrarModal('modal-prest');
    vaciarPrest();
    await cargar();
  } catch (e) { toast('No se pudo crear el contrato', mensajeDeError(e), 'error'); }
  finally { cargandoContratoPrest.value = false; }
}

// ── Enlace de firma para el afiliado ──
const generandoEnlace = ref('');
const enviandoCorreo = ref(false);
const enlaceFirma = ref(null);
/** Marca qué contratos ya tienen un enlace generado, para cambiar la etiqueta del botón. */
const generadoPorContrato = reactive({});

/** Teléfono en formato internacional para el enlace de WhatsApp. */
function numeroWhatsApp(telefono) {
  const digitos = String(telefono ?? '').replace(/\D/g, '');
  if (!digitos) return '';
  // Si ya viene con código de país (57...), se usa tal cual.
  return digitos.startsWith('57') ? digitos : `57${digitos}`;
}

const enlaceWhatsapp = computed(() => {
  const url = enlaceFirma.value?.url ?? '';
  const numero = numeroWhatsApp(enlaceFirma.value?.telefono);
  const firmante = enlaceFirma.value?.contrato?.firmante ?? '';
  const texto = encodeURIComponent(
    `Hola ${firmante}, le enviamos el enlace para revisar y firmar el contrato ${enlaceFirma.value?.contrato?.numero ?? ''}: ${url}`
  );
  return `https://wa.me/${numero}?text=${texto}`;
});

/**
 * Crea el enlace de firma del contrato indicado.
 * El token solo se guarda cifrado, así que cada envío genera un enlace nuevo y el
 * anterior queda inutilizable: por eso "enviar por correo" vuelve a crear uno.
 */
async function crearEnlaceFirma(contrato, { enviarCorreo = false } = {}) {
  const firmante = detalle.value?.propietario;
  const r = await service.enlaceFirma({
    company_uuid: detalle.value.expediente.company_uuid,
    contract_origin: contrato.origen,
    contract_uuid: contrato.uuid,
    signer_role: 'PROPIETARIO',
    signer_name: firmante.nombre,
    signer_document: firmante.documento ?? '',
    signer_email: firmante.correo ?? null,
    signer_phone: firmante.telefono ?? null,
    enviar_correo: enviarCorreo,
  });
  const datos = r.data?.data ?? r.data;

  return {
    url: datos.url,
    vigencia_horas: datos.vigencia_horas,
    vigencia: new Date(datos.expira_en).toLocaleString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }),
    telefono: firmante.telefono ?? null,
    correo: firmante.correo ?? null,
    correoResultado: datos.correo ?? null,
    // Se conserva el contrato para poder generar un enlace nuevo al reenviar.
    contratoRef: contrato,
    contrato: { numero: contrato.numero, firmante: firmante.nombre },
  };
}

/** Abre el modal con el enlace ya generado. */
async function generarEnlace(contrato) {
  const firmante = detalle.value?.propietario;
  if (!firmante?.nombre) {
    toast('Falta el propietario o afiliado', 'El vehículo no tiene un propietario o afiliado registrado.', 'error');
    return;
  }

  generandoEnlace.value = contrato.uuid;
  enlaceFirma.value = null;
  try {
    enlaceFirma.value = await crearEnlaceFirma(contrato);
    generadoPorContrato[contrato.uuid] = true;
    abrirModal('modal-enlace');
  } catch (e) {
    toast('No se pudo generar el enlace', mensajeDeError(e, 'Intente nuevamente.'), 'error');
  } finally {
    generandoEnlace.value = '';
  }
}

/** Genera un enlace nuevo y lo manda al correo del afiliado. */
async function enviarPorCorreo() {
  if (!enlaceFirma.value) return;
  enviandoCorreo.value = true;
  try {
    const actualizado = await crearEnlaceFirma(enlaceFirma.value.contratoRef, { enviarCorreo: true });
    if (actualizado.correoResultado?.enviado) {
      toast('Enlace enviado por correo', actualizado.correoResultado.mensaje, 'success');
    } else {
      toast('No se pudo enviar el correo', actualizado.correoResultado?.mensaje ?? 'Intente nuevamente.', 'error');
    }
  } catch (e) {
    toast('No se pudo enviar el correo', mensajeDeError(e), 'error');
  } finally {
    enviandoCorreo.value = false;
  }
}

/** Abre un modal de Bootstrap por id. */
function abrirModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  // bootstrap.Modal puede no estar expuesto en window en todos los entornos.
  window.bootstrap?.Modal?.getOrCreateInstance(el)?.show();
}

async function copiarEnlace() {
  const url = enlaceFirma.value?.url;
  if (!url) return;
  try {
    await navigator.clipboard.writeText(url);
    toast('Enlace copiado', 'Ya puede pegarlo donde lo necesite.', 'success');
  } catch {
    toast('No se pudo copiar', 'Seleccione el enlace y cópielo manualmente.', 'warning');
  }
}

onMounted(cargar);
</script>

<style scoped>
.required::after { content: " *"; color: #dc3545; }
.border-dashed { border-style: dashed !important; }

/* ── Encabezado expediente ── */
.exp-header { background: #fff; }

.exp-icon-wrap {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #eaf1ff;
  flex-shrink: 0;
}

.exp-vehicle-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2a37;
  margin: 0 0 4px;
}

.exp-meta { font-size: 13px; }
.exp-meta-label { color: #6b7686; }

/* Placa: chip gris, igual que en el listado */
.exp-plate {
  display: inline-block;
  padding: 2px 9px;
  border: 1px solid #dee2e6;
  border-radius: 5px;
  background: #f8f9fa;
  color: #212529;
  font-weight: 600;
  font-size: 13px;
  letter-spacing: .04em;
}

/* Barra de progreso segmentada */
.exp-progress { min-width: 220px; }

.exp-progress-label {
  font-size: 13px;
  font-weight: 600;
  color: #1f2a37;
}

.exp-segments {
  display: grid;
  grid-template-columns: repeat(var(--seg-count, 4), 1fr);
  gap: 4px;
}

.exp-segment {
  height: 6px;
  border-radius: 999px;
  background: #e3e8ef;
}
.exp-segment.seg-done    { background: #0fa968; }
.exp-segment.seg-active  { background: #2563eb; }
.exp-segment.seg-pending { background: #e3e8ef; }

/* Badge estado header */
.exp-status-badge {
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}
.exp-status-badge.status-active { background: #e8f0fe; color: #1d4ed8; }
.exp-status-badge.status-done   { background: #e4f7ee; color: #0b7a4b; }

/* Footer cerrar paso */
.exp-footer {
  background: #f6f8fb;
  border-bottom-left-radius: calc(0.375rem - 1px);
  border-bottom-right-radius: calc(0.375rem - 1px);
}

.exp-footer-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2a37;
}

.exp-footer-sub {
  font-size: 13px;
  color: #6b7686;
}

.exp-btn-close {
  padding: 11px 22px;
  border: 0;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
}
.exp-btn-close:disabled { opacity: .55; }

/* ── Tipografía unificada ── */
.noa-label      { font-size: 0.85rem; font-weight: 600; }
.noa-helper     { font-size: 0.8rem; }
.noa-card-title { font-size: 0.85rem; font-weight: 600; }
.noa-meta       { font-size: 0.78rem; }
.noa-intro      { font-size: 0.85rem; }
</style>