<template>
    <div v-if="!project && !isViewLoading" class="text-center py-5">
        <i class="fad fa-briefcase fs-1 text-muted opacity-50 mb-3 d-block" />
        <p class="text-muted mb-0">El proyecto no fue encontrado.</p>
        <button v-if="can('projects.index')" class="btn btn-primary btn-sm mt-3" type="button" @click="goToBack">
            <i class="fal fa-arrow-left me-1" />Volver a proyectos
        </button>
    </div>

    <template v-else>
        <BasePageHeader :title="pageTitle" :subtitle="pageSubtitle" icon="fad fa-briefcase text-primary"
            :breadcrumbs="breadcrumbs" :loading="isViewLoading" :show-back="true" :show-edit="can('projects.update')"
            @back="goToBack" @edit="goToEdit" />

        <!-- SKELETON LOADING -->
        <div v-if="isViewLoading" class="row g-3 mb-3 fade-in-up" style="animation-delay: 0.1s;">
            <div class="col-12 col-lg-8">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-body p-4">
                        <div class="d-flex gap-3 align-items-start">
                            <div class="skeleton-icon rounded-3 flex-shrink-0" style="width: 64px; height: 64px;" />
                            <div class="w-100">
                                <div class="row g-2">
                                    <div class="col-12 col-sm-6" v-for="i in 5" :key="i">
                                        <div class="skeleton-text" style="height: 14px; width: 90%;" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-12 col-lg-4">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-body p-4 text-center">
                        <div class="skeleton-text mx-auto mb-3" style="height: 50px; width: 50px; border-radius: 12px;" />
                        <div class="skeleton-text mx-auto mb-2" style="height: 14px; width: 70%;" />
                        <div class="skeleton-text mx-auto" style="height: 14px; width: 90%;" />
                    </div>
                </div>
            </div>
        </div>

        <!-- CONTENIDO PRINCIPAL -->
        <div v-else class="row g-3 mb-3 fade-in-up" style="animation-delay: 0.1s;">

            <!-- Información del proyecto -->
            <div class="col-12 col-sm-12 col-md-12 col-lg-8">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center gap-2">
                        <i class="fad fa-circle-info text-primary" style="font-size: 14px;"></i>
                        <h6 class="mb-0 fw-medium" style="font-size: 0.9rem;">Información del proyecto</h6>
                    </div>
                    <div class="card-body py-3">
                        <div class="d-flex gap-3 align-items-start">
                            <div
                                class="avatar-placeholder bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center flex-shrink-0">
                                <i class="fad fa-briefcase" style="font-size: 26px;" />
                            </div>
                            <dl class="row mb-0 small g-2 g-md-3 w-100" style="font-size: 0.85rem;">
                                <dt class="col-12 col-sm-4 text-muted fw-medium">Nombre del proyecto:</dt>
                                <dd class="col-12 col-sm-8 text-dark fw-semibold">{{ project?.project_name || '—' }}</dd>

                                <dt class="col-12 col-sm-4 text-muted fw-medium mt-1">Fecha de inicio:</dt>
                                <dd class="col-12 col-sm-8 text-dark mt-1">
                                    <i class="fad fa-calendar-alt me-1 text-muted"></i>{{ formatDateShort(project?.start_date) }}
                                </dd>

                                <dt class="col-12 col-sm-4 text-muted fw-medium mt-1">Fecha de finalización:</dt>
                                <dd class="col-12 col-sm-8 text-dark mt-1">
                                    <i class="fad fa-calendar-check me-1 text-muted"></i>{{ formatDateShort(project?.completion_date) }}
                                </dd>

                                <dt class="col-12 col-sm-4 text-muted fw-medium mt-1">Valor del proyecto:</dt>
                                <dd class="col-12 col-sm-8 text-dark mt-1 fw-medium">{{ formatMoney(project?.project_value) }}</dd>

                                <dt class="col-12 col-sm-4 text-muted fw-medium mt-1">Orden de compra:</dt>
                                <dd class="col-12 col-sm-8 text-dark mt-1">
                                    <div class="d-flex flex-wrap align-items-center gap-2">
                                        <span v-if="project?.purchase_order" class="font-monospace fw-medium">
                                            {{ project.purchase_order }}
                                        </span>
                                        <span v-else>—</span>
                                        <a v-if="project?.purchase_order_url" :href="getMediaUrl(project.purchase_order_url)"
                                            target="_blank" class="btn btn-falcon-default btn-sm py-0 px-2">
                                            <i class="fad fa-file-pdf text-danger me-1" style="font-size: 13px;" />
                                            {{ project.purchase_order_name || 'Ver PDF' }}
                                        </a>
                                    </div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Resumen -->
            <div class="col-12 col-sm-12 col-md-12 col-lg-4">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center gap-2">
                        <i class="fad fa-chart-simple text-primary" style="font-size: 14px;"></i>
                        <h6 class="mb-0 fw-medium" style="font-size: 0.9rem;">Resumen</h6>
                    </div>
                    <div class="card-body py-3 d-flex flex-column gap-3">
                        <div class="d-flex align-items-center gap-3 p-3 rounded-3" style="background:#f8f9fa;">
                            <div
                                class="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center"
                                style="width:40px;height:40px;">
                                <i class="fad fa-user" />
                            </div>
                            <div>
                                <div class="h5 mb-0 fw-bold text-dark">{{ activeAssignments.length }}</div>
                                <small class="text-muted">Conductores con vehículo asignado</small>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-3 p-3 rounded-3" style="background:#f8f9fa;">
                            <div
                                class="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center"
                                style="width:40px;height:40px;">
                                <i class="fad fa-truck" />
                            </div>
                            <div>
                                <div class="h5 mb-0 fw-bold text-dark">{{ activeAssignments.length }}</div>
                                <small class="text-muted">Vehículos asignados</small>
                            </div>
                        </div>
                        <p class="small text-muted mb-0">
                            <i class="fad fa-exchange-alt me-1" />
                            Cada conductor tiene su vehículo asignado dentro del proyecto.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Asignaciones conductor → vehículo -->
            <div class="col-12 col-sm-12 col-md-12 col-lg-12">
                <div class="card assignments-card">
                    <div class="card-header assignments-header">
                        <div class="d-flex flex-wrap align-items-center gap-2">
                            <i class="fad fa-users assignments-header-icon" aria-hidden="true"></i>
                            <h6 class="assignments-title mb-0">
                                Conductores y sus vehículos
                                <span class="assignments-count">({{ activeAssignments.length }})</span>
                            </h6>
                            <span v-if="inactiveAssignments.length" class="badge assignment-badge-inactive ms-1">
                                {{ inactiveAssignments.length }} retirado{{ inactiveAssignments.length !== 1 ? 's' : '' }}
                            </span>
                            <div class="assignment-search ms-auto">
                                <i class="fal fa-search" aria-hidden="true"></i>
                                <input id="f-asignaciones-busqueda" v-model="filtroAsignaciones"
                                    type="search" placeholder="Buscar conductor o vehículo..."
                                    class="assignment-search__input"
                                    aria-label="Buscar conductor o vehículo" />
                                <button v-if="filtroAsignaciones" class="assignment-search__clear" type="button"
                                    title="Limpiar búsqueda" aria-label="Limpiar búsqueda"
                                    @click="filtroAsignaciones = ''">
                                    <i class="fal fa-times" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="card-body p-0">
                        <div v-if="gruposAsignacionesFiltrados.length" class="assignments-list">
                            <div v-for="grupo in gruposAsignacionesFiltrados" :key="grupo.key"
                                class="assignment-row"
                                :class="{
                                    'assignment-row--has-relays': grupo.tieneRelevos,
                                    'assignment-row--expanded': grupo.tieneRelevos && estaExpandido(grupo),
                                }">
                                <div class="d-flex align-items-center gap-2 w-100">
                                    <!-- Pequeña viñeta lateral solo cuando el vehículo tiene relevo(s) -->
                                    <button
                                        v-if="grupo.tieneRelevos"
                                        type="button"
                                        class="assignment-relay-bullet"
                                        :class="{ 'is-open': estaExpandido(grupo) }"
                                        :aria-expanded="estaExpandido(grupo)"
                                        :aria-controls="`relevos-${grupo.key}`"
                                        :title="estaExpandido(grupo)
                                            ? 'Ocultar relevos de este vehículo'
                                            : `Haz clic para ver ${grupo.relevos.length} relevo${grupo.relevos.length !== 1 ? 's' : ''}`"
                                        :aria-label="estaExpandido(grupo)
                                            ? `Ocultar relevos de ${grupo.principal.vehicle?.vehicle_license_plate || 'vehículo'}`
                                            : `Ver ${grupo.relevos.length} relevo${grupo.relevos.length !== 1 ? 's' : ''} de ${grupo.principal.vehicle?.vehicle_license_plate || 'vehículo'}`"
                                        @click="toggleExpandGrupo(grupo.key)">
                                        <i class="fal fa-chevron-right assignment-relay-bullet__icon" aria-hidden="true" />
                                        <span class="assignment-relay-bullet__count">{{ grupo.relevos.length }}</span>
                                    </button>

                                    <div class="row flex-grow-1 g-2 g-md-3 align-items-center m-0">
                                        <!-- Conductor principal -->
                                        <div class="col-12 col-md-5 d-flex align-items-center gap-2">
                                            <div class="assignment-avatar assignment-avatar-driver">
                                                <i class="fad fa-user" style="font-size: 14px;" aria-hidden="true" />
                                            </div>
                                            <div class="min-w-0 flex-grow-1">
                                                <div class="fw-semibold text-dark d-flex align-items-center gap-1 flex-wrap">
                                                    <span>{{ driverName(grupo.principal.conductor) }}</span>
                                                    <span v-if="grupo.tieneRelevos"
                                                        class="badge assignment-badge-relay-hint"
                                                        title="Tiene relevo asignado. Haz clic en la viñeta lateral para desplegar">
                                                        Principal · +{{ grupo.relevos.length }} relevo{{ grupo.relevos.length !== 1 ? 's' : '' }}
                                                    </span>
                                                </div>
                                                <small class="text-muted d-flex align-items-center gap-1">
                                                    <i class="fad fa-id-card" style="font-size:11px;" aria-hidden="true" />
                                                    {{ grupo.principal.conductor?.document_number || 'Sin documento' }}
                                                </small>
                                            </div>
                                            <span v-if="grupo.principal.is_active"
                                                class="badge assignment-badge-active flex-shrink-0">
                                                Activo
                                            </span>
                                            <span v-else class="badge assignment-badge-inactive flex-shrink-0">
                                                Retirado
                                            </span>
                                        </div>

                                        <!-- Conexión -->
                                        <div class="col-auto d-none d-lg-flex align-items-center justify-content-center text-muted">
                                            <i class="fad fa-arrow-right" style="font-size: 16px;" aria-hidden="true" />
                                        </div>

                                        <!-- Vehículo del conductor -->
                                        <div class="col-12 col-md d-flex align-items-center gap-2">
                                            <div class="assignment-avatar assignment-avatar-vehicle">
                                                <i class="fad fa-truck" style="font-size: 14px;" aria-hidden="true" />
                                            </div>
                                            <div class="min-w-0">
                                                <div class="fw-semibold font-monospace text-dark">
                                                    {{ grupo.principal.vehicle?.vehicle_license_plate || '—' }}
                                                </div>
                                                <small v-if="grupo.principal.vehicle?.internal_number" class="text-muted d-block">
                                                    No. interno: {{ grupo.principal.vehicle.internal_number }}
                                                </small>
                                                <small v-else-if="grupo.principal.vehicle?.model" class="text-muted d-block">
                                                    {{ grupo.principal.vehicle.model }}
                                                </small>
                                            </div>
                                        </div>

                                        <!-- Acciones -->
                                        <div v-if="can('projects.update')" class="col-auto ms-auto flex-shrink-0 d-flex gap-2">
                                            <button v-if="grupo.principal.is_active && grupo.principal.relevo && can('service_delivery_control_sheets.update')"
                                                type="button" class="btn btn-sm assignment-action"
                                                aria-haspopup="dialog"
                                                title="Aplicar relevo de turno"
                                                @click="toggleRelevo(grupo.principal)">
                                                <i class="fad fa-right-left text-primary" aria-hidden="true" />
                                                Relevo
                                            </button>
                                            <button type="button"
                                                class="btn btn-sm assignment-action"
                                                :class="grupo.principal.is_active ? 'assignment-action-retirar' : 'assignment-action-reactivar'"
                                                :disabled="togglingUuid === grupo.principal.uuid"
                                                :title="grupo.principal.is_active ? 'Retirar asignación' : 'Reactivar asignación'"
                                                @click="toggleAssignment(grupo.principal)">
                                                <i v-if="togglingUuid === grupo.principal.uuid" class="fad fa-spinner fa-spin" aria-hidden="true" />
                                                <template v-else>
                                                    <i :class="grupo.principal.is_active ? 'fad fa-user-slash text-danger' : 'fad fa-user-check text-success'" aria-hidden="true" />
                                                </template>
                                                {{ grupo.principal.is_active ? 'Retirar' : 'Reactivar' }}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Expandible interno: conductores de relevo del vehículo -->
                                <div v-if="grupo.tieneRelevos && estaExpandido(grupo)"
                                    :id="`relevos-${grupo.key}`"
                                    class="assignment-relays-drawer">
                                    <div v-for="relevoItem in grupo.relevos" :key="relevoItem.uuid"
                                        class="assignment-relay-item d-flex flex-wrap align-items-center gap-2">
                                        <span class="assignment-relay-branch" aria-hidden="true"></span>
                                        <div class="assignment-avatar assignment-avatar-relay">
                                            <i class="fad fa-user-clock" style="font-size: 13px;" aria-hidden="true" />
                                        </div>
                                        <div class="min-w-0 flex-grow-1">
                                            <div class="fw-semibold text-dark d-flex align-items-center gap-1 flex-wrap">
                                                <span>{{ driverName(relevoItem.conductor) }}</span>
                                                <span class="badge assignment-badge-relay">Relevo</span>
                                            </div>
                                            <small class="text-muted d-flex align-items-center gap-1">
                                                <i class="fad fa-id-card" style="font-size:11px;" aria-hidden="true" />
                                                {{ relevoItem.conductor?.document_number || 'Sin documento' }}
                                            </small>
                                        </div>
                                        <span v-if="relevoItem.is_active"
                                            class="badge assignment-badge-active flex-shrink-0">
                                            Activo
                                        </span>
                                        <span v-else class="badge assignment-badge-inactive flex-shrink-0">
                                            Retirado
                                        </span>
                                        <div v-if="can('projects.update')" class="ms-auto flex-shrink-0">
                                            <button type="button"
                                                class="btn btn-sm assignment-action"
                                                :class="relevoItem.is_active ? 'assignment-action-retirar' : 'assignment-action-reactivar'"
                                                :disabled="togglingUuid === relevoItem.uuid"
                                                :title="relevoItem.is_active ? 'Retirar relevo' : 'Reactivar relevo'"
                                                @click="toggleAssignment(relevoItem)">
                                                <i v-if="togglingUuid === relevoItem.uuid" class="fad fa-spinner fa-spin" aria-hidden="true" />
                                                <template v-else>
                                                    <i :class="relevoItem.is_active ? 'fad fa-user-slash text-danger' : 'fad fa-user-check text-success'" aria-hidden="true" />
                                                </template>
                                                {{ relevoItem.is_active ? 'Retirar' : 'Reactivar' }}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Relevo de turno: modal con el conductor entrante -->
                                <RelevoForm :visible="relevoAbiertoUuid === grupo.principal.uuid"
                                    :relevo="grupo.principal.relevo" :project-uuid="project.uuid"
                                    :vehicle-uuid="grupo.principal.vehicle_uuid"
                                    :vehicle-label="grupo.principal.vehicle?.vehicle_license_plate || ''"
                                    :candidatos="candidatosDeRelevo(grupo.principal)"
                                    :saving="savingRelevo" :server-error="relevoError"
                                    @submit="submitRelevo" @update:visible="cerrarRelevo" />
                            </div>
                        </div>
                        <p v-else-if="project.assignments?.length" class="assignment-empty">
                            <i class="fad fa-search me-1" aria-hidden="true" />Sin resultados para
                            «{{ filtroAsignaciones }}».
                        </p>
                        <p v-else class="assignment-empty">
                            <i class="fad fa-info-circle me-1" aria-hidden="true" />Este proyecto aún no tiene conductores con vehículos asignados.
                        </p>

                        <!-- Alta al final: lo último asignado queda al final del historial -->
                        <div v-if="can('projects.update')" class="assignment-add">
                            <div class="assignment-add-row">
                                <span class="assignment-add-line" aria-hidden="true"></span>
                                <button ref="addAssignmentButton" type="button" class="assignment-add-button"
                                    :aria-expanded="showAddAssignment" aria-controls="f-nueva-asignacion"
                                    :aria-label="showAddAssignment ? 'Cerrar el formulario de asignación' : 'Agregar conductor y vehículo'"
                                    :title="showAddAssignment ? 'Cerrar' : 'Agregar conductor + vehículo'"
                                    @click="toggleAddAssignment">
                                    <i :class="showAddAssignment ? 'fad fa-times' : 'fad fa-plus'"
                                        aria-hidden="true" />
                                </button>
                                <span class="assignment-add-line" aria-hidden="true"></span>
                            </div>

                            <div v-if="showAddAssignment" id="f-nueva-asignacion" class="assignment-form">
                                <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                                    <span class="assignment-form-title d-inline-flex align-items-center gap-2">
                                        <span class="assignment-form-dot" aria-hidden="true"></span>
                                        Nueva asignación de conductor a vehículo
                                    </span>
                                    <span class="text-muted" style="font-size: 0.72rem;">Completa ambos campos
                                        para vincular</span>
                                </div>

                                <div class="row g-2 align-items-end">
                                    <div class="col-12 col-md-5">
                                        <label class="form-label small mb-1" for="f-nuevo-conductor">Conductor</label>
                                        <PrimeSelect v-model="newAssignment.third_party_uuid"
                                            :options="availableDrivers" optionLabel="label" optionValue="uuid"
                                            :filter="true" showClear placeholder="Seleccione conductor..."
                                            class="w-100" :inputId="'f-nuevo-conductor'"
                                            :invalid="!!addAssignmentError"
                                            :aria-describedby="addAssignmentError ? 'f-nueva-asignacion-error' : undefined" />
                                    </div>
                                    <div class="col-12 col-md-4">
                                        <label class="form-label small mb-1" for="f-nuevo-vehiculo">Vehículo</label>
                                        <PrimeSelect v-model="newAssignment.vehicle_uuid"
                                            :options="availableVehicles" optionLabel="label" optionValue="uuid"
                                            :filter="true" showClear placeholder="Seleccione vehículo..."
                                            class="w-100" :inputId="'f-nuevo-vehiculo'"
                                            :invalid="!!addAssignmentError"
                                            :aria-describedby="addAssignmentError ? 'f-nueva-asignacion-error' : undefined" />
                                    </div>
                                    <div class="col-12 col-md-3 d-flex gap-2">
                                        <button type="button" class="assignment-btn-primary flex-grow-1"
                                            :disabled="savingAssignment || !newAssignment.third_party_uuid || !newAssignment.vehicle_uuid"
                                            @click="submitNewAssignment">
                                            <span v-if="savingAssignment" class="spinner-border spinner-border-sm"
                                                aria-hidden="true"></span>
                                            <i v-else class="fad fa-plus" aria-hidden="true" />
                                            Asignar
                                        </button>
                                        <button type="button" class="assignment-btn-ghost"
                                            :disabled="savingAssignment" @click="closeAddAssignment">
                                            Cancelar
                                        </button>
                                    </div>
                                </div>

                                <div v-if="catalogsLoading" class="text-muted mt-2" style="font-size: 0.75rem;"
                                    role="status">
                                    <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                                    Cargando conductores y vehículos…
                                </div>
                                <div v-else-if="catalogError" class="assignment-form-alert" role="alert">
                                    <i class="fad fa-triangle-exclamation me-1" aria-hidden="true" />{{ catalogError }}
                                </div>
                                <p v-else-if="!availableDrivers.length || !availableVehicles.length"
                                    class="assignment-form-note">
                                    <i class="fad fa-info-circle me-1" aria-hidden="true" />
                                    <template v-if="!availableDrivers.length && !availableVehicles.length">
                                        No quedan conductores ni vehículos disponibles para asignar.
                                    </template>
                                    <template v-else-if="!availableDrivers.length">
                                        No quedan conductores disponibles: todos los conductores activos ya están asignados.
                                    </template>
                                    <template v-else>
                                        No quedan vehículos disponibles: todos los vehículos activos ya están asignados.
                                    </template>
                                </p>
                                <div v-if="addAssignmentError" id="f-nueva-asignacion-error"
                                    class="assignment-form-error" role="alert">
                                    {{ addAssignmentError }}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="assignment-footer">
                        <span>Mostrando <strong>{{ activeAssignments.length }}</strong> activos de
                            <strong>{{ (project.assignments || []).length }}</strong> registros</span>
                        <span class="d-inline-flex align-items-center gap-3">
                            <span class="assignment-footer-stat">
                                <span class="assignment-dot assignment-dot-active" aria-hidden="true"></span>
                                Activos: {{ activeAssignments.length }}
                            </span>
                            <span class="assignment-footer-stat">
                                <span class="assignment-dot assignment-dot-inactive" aria-hidden="true"></span>
                                Retirados: {{ inactiveAssignments.length }}
                            </span>
                        </span>
                    </div>
                </div>
            </div>

            <!-- Evidencia acumulada del proyecto -->
            <div v-if="can('service_delivery_control_sheets.index')" class="col-12 col-sm-12 col-md-12 col-lg-12">
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-light py-2 px-3 border-bottom d-flex flex-wrap align-items-center gap-2">
                        <i class="fad fa-folder-open text-primary" style="font-size: 14px;" aria-hidden="true"></i>
                        <h6 class="mb-0 fw-medium" style="font-size: 0.9rem;">
                            Evidencia acumulada
                            <span v-if="!evidenciaLoading" class="badge badge-subtle-success ms-1"
                                style="font-size:0.65rem;">
                                {{ evidenciaTotal }} días · {{ evidenciaCerradas }} cerrados
                            </span>
                        </h6>
                        <div class="d-flex flex-wrap align-items-center gap-2 ms-auto">
                            <div class="btn-group btn-group-sm" role="group" aria-label="Filtrar evidencia por estado">
                                <button type="button" class="btn btn-xs fw-semibold"
                                    :class="filtroEstadoEvidencia === 'cerrados' ? 'btn-success text-white' : 'btn-outline-secondary'"
                                    :aria-pressed="filtroEstadoEvidencia === 'cerrados'"
                                    @click="filtroEstadoEvidencia = 'cerrados'">
                                    Cerrados
                                </button>
                                <button type="button" class="btn btn-xs fw-semibold"
                                    :class="filtroEstadoEvidencia === 'en_curso' ? 'btn-info text-white' : 'btn-outline-secondary'"
                                    :aria-pressed="filtroEstadoEvidencia === 'en_curso'"
                                    @click="filtroEstadoEvidencia = 'en_curso'">
                                    En curso
                                </button>
                                <button type="button" class="btn btn-xs fw-semibold"
                                    :class="filtroEstadoEvidencia === 'por_certificar' ? 'btn-warning text-dark' : 'btn-outline-secondary'"
                                    :aria-pressed="filtroEstadoEvidencia === 'por_certificar'"
                                    @click="filtroEstadoEvidencia = 'por_certificar'">
                                    Por certificar
                                </button>
                                <button type="button" class="btn btn-xs fw-semibold"
                                    :class="filtroEstadoEvidencia === 'sin_llenar' ? 'btn-danger text-white' : 'btn-outline-secondary'"
                                    :aria-pressed="filtroEstadoEvidencia === 'sin_llenar'"
                                    @click="filtroEstadoEvidencia = 'sin_llenar'">
                                    Sin llenar
                                </button>
                            </div>
                            <button type="button" class="btn btn-sm btn-falcon-default py-0 px-2"
                                title="Abrir el listado de planillas filtrado por este proyecto"
                                @click="irAPlanillas">
                                <i class="fad fa-clipboard-list me-1" aria-hidden="true" />Ver en planillas
                            </button>
                        </div>
                    </div>
                    <div class="card-body py-2">
                        <div v-if="evidenciaLoading" class="text-center py-3">
                            <span class="spinner-border spinner-border-sm text-primary me-2" aria-hidden="true"></span>
                            <span class="small text-muted">Cargando evidencia…</span>
                        </div>
                        <div v-else-if="evidenciaError" id="f-evidencia-error" role="alert"
                            class="alert alert-warning py-2 px-3 my-2 small mb-0">
                            {{ evidenciaError }}
                        </div>
                        <p v-else-if="!evidenciaItems.length" class="text-muted small mb-0 mt-2">
                            <i class="fad fa-info-circle me-1" aria-hidden="true" />Este proyecto aún no tiene planillas registradas.
                        </p>
                        <div v-else>
                            <div class="table-responsive">
                                <table v-if="evidenciaFiltrada.length" class="table table-sm mb-0">
                                    <thead>
                                        <tr>
                                            <th scope="col">Fecha</th>
                                            <th scope="col">Estado</th>
                                            <th scope="col">Recorridos</th>
                                            <th scope="col" class="text-center">PDF del día</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <template v-for="grupo in evidenciaFiltrada" :key="grupo.padre.uuid">
                                            <tr class="evidencia-hoja-row">
                                                <td colspan="4" class="py-2">
                                                    <div class="d-flex flex-wrap align-items-center gap-2">
                                                        <i class="fad fa-truck text-muted" aria-hidden="true"></i>
                                                        <span class="fw-semibold font-monospace text-dark">
                                                            {{ grupo.padre.vehicle_license_plate || 'Sin placa' }}
                                                        </span>
                                                        <span v-if="nombreConductor(grupo.padre)" class="text-muted small">
                                                            <i class="fad fa-user ms-1 me-1" aria-hidden="true"></i>{{ nombreConductor(grupo.padre) }}
                                                        </span>
                                                        <span v-if="documentoConductor(grupo.padre)" class="text-muted small font-monospace">
                                                            {{ documentoConductor(grupo.padre) }}
                                                        </span>
                                                        <span v-if="grupo.padre.estado" class="badge rounded-pill ms-auto"
                                                            :class="claseEstadoServicio(grupo.padre.estado)" style="font-size:0.6rem;"
                                                            :title="tituloEstadoServicio(grupo.padre)">
                                                            {{ etiquetaEstadoServicio(grupo.padre.estado) }}
                                                        </span>
                                                        <button v-if="can('service_delivery_control_sheets.update')"
                                                            type="button" class="btn btn-falcon-default btn-sm py-0 px-2"
                                                            title="Abrir la hoja de control de este vehículo"
                                                            :aria-label="`Abrir hoja de control de ${grupo.padre.vehicle_license_plate || 'vehículo'}`"
                                                            @click="abrirHoja(grupo.padre.uuid)">
                                                            <i class="fad fa-folder-open text-primary me-1" aria-hidden="true"></i>Abrir Hoja
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr v-for="dia in grupo.dias" :key="dia.uuid || dia.service_date">
                                                <td class="ps-4">{{ formatRango(dia.service_date) || '—' }}</td>
                                                <td>
                                                    <!-- SPEC-002 §8: estado administrativo y evidencia del día -->
                                                    <span v-if="dia.estado" class="badge rounded-pill d-block mt-1"
                                                        :class="claseEstadoServicio(dia.estado)" style="font-size:0.6rem;"
                                                        :title="tituloEstadoServicio(dia)">
                                                        {{ etiquetaEstadoServicio(dia.estado) }}
                                                    </span>
                                                </td>
                                                <td>{{ recorridosDe(dia) }}</td>
                                                <td class="text-center">
                                                    <button v-if="esCerrado(dia) && can('service_delivery_control_sheets.history_pdf')"
                                                        type="button" class="btn btn-falcon-default btn-sm p-0 px-1"
                                                        title="Descargar PDF de este día"
                                                        :aria-label="`Descargar PDF del día ${formatRango(dia.service_date)}`"
                                                        :disabled="descargandoPdf === dia.uuid"
                                                        @click="descargarPdfDia(dia.uuid)">
                                                        <span v-if="descargandoPdf === dia.uuid"
                                                            class="spinner-border spinner-border-sm text-danger"
                                                            style="width: 14px; height: 14px;" aria-hidden="true"></span>
                                                        <i v-else class="fad fa-file-pdf text-danger"
                                                            style="font-size:14px;" aria-hidden="true" />
                                                    </button>
                                                    <span v-else class="text-muted small">—</span>
                                                </td>
                                            </tr>
                                        </template>
                                    </tbody>
                                </table>
                                <p v-else class="text-muted small my-2">
                                    <i class="fad fa-info-circle me-1" aria-hidden="true" />No hay días en este estado.
                                </p>
                            </div>
                            <div class="d-flex align-items-center justify-content-between mt-2">
                                <small class="text-muted">Página {{ evidenciaPage }} de {{ evidenciaLastPage }}</small>
                                <div class="d-flex gap-1">
                                    <button id="f-evidencia-prev" type="button"
                                        class="btn btn-sm btn-falcon-default py-0 px-2"
                                        :disabled="evidenciaPage <= 1 || evidenciaLoading"
                                        aria-label="Página anterior de evidencia"
                                        @click="cambiarPaginaEvidencia(-1)">
                                        Anterior
                                    </button>
                                    <button id="f-evidencia-next" type="button"
                                        class="btn btn-sm btn-falcon-default py-0 px-2"
                                        :disabled="evidenciaPage >= evidenciaLastPage || evidenciaLoading"
                                        aria-label="Página siguiente de evidencia"
                                        @click="cambiarPaginaEvidencia(1)">
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </template>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectsStore } from '../store/projects.store.js';
import { useServiceDeliveryControlSheetStore } from '../../serviceDeliveryControlSheet/store/serviceDeliveryControlSheet.store.js';
import serviceDeliveryControlSheetService from '../../serviceDeliveryControlSheet/services/serviceDeliveryControlSheet.service.js';
import { formatRango, diasHijos, recorridosCount, esCerrado } from '../../serviceDeliveryControlSheet/hooks/useServiceList.js';
import { candidatosDeRelevo as candidatosDeRelevoUtil } from '../../serviceDeliveryControlSheet/utils/relevo.js';
import RelevoForm from '../../serviceDeliveryControlSheet/components/RelevoForm.vue';
import { usePermissionsStore } from '@store';
import { toast } from '@/utils/toast.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import PrimeSelect from '@/components/form/PrimeSelect.vue';
import { getMediaUrl } from '@/utils/media.js';
import { claseEstadoServicio, etiquetaEstadoServicio, tituloEstadoServicio } from '@/utils/serviceDeliveryStatus.js';
import { agruparAsignacionesPorVehiculo, payloadConAlternancia, payloadConNuevaAsignacion } from '../utils/assignments.js';

const route = useRoute();
const router = useRouter();
const store = useProjectsStore();
const permissionsStore = usePermissionsStore();
const can = (action) => permissionsStore.can(action);

const project = ref(null);
const isViewLoading = ref(true);

/** Computed para BasePageHeader (evita expresiones complejas en el template) */
const pageTitle = computed(() => project.value?.project_name || 'Proyecto');
const pageSubtitle = computed(() => 'Detalle del proyecto');
const breadcrumbs = computed(() => [
    { label: 'Operación' },
    { label: 'Proyectos', to: '/proyectos' },
    { label: 'Detalle' },
]);

const driverName = (conductor) => {
    if (!conductor) return '—';
    const full = `${conductor.first_name || ''} ${conductor.last_name || ''}`.trim();
    return full || conductor.company_name || conductor.document_number || 'Conductor';
};

/** Asignaciones activas (cuentan para el resumen y el encabezado de la lista). */
const activeAssignments = computed(() =>
    (project.value?.assignments || []).filter((a) => a.is_active !== false)
);

/** Asignaciones retiradas (conservadas en historial con is_active=false). */
const inactiveAssignments = computed(() =>
    (project.value?.assignments || []).filter((a) => a.is_active === false)
);

/** Búsqueda local en la lista de asignaciones agrupadas por vehículo (conductor principal, relevos o vehículo). */
const filtroAsignaciones = ref('');
const gruposExpandidos = ref(new Set());

const coincideAsignacion = (a, q) => [
    driverName(a?.conductor),
    a?.conductor?.document_number,
    a?.vehicle?.vehicle_license_plate,
    a?.vehicle?.internal_number,
    a?.vehicle?.model,
].some((v) => String(v || '').toLowerCase().includes(q));

const gruposAsignaciones = computed(() =>
    agruparAsignacionesPorVehiculo(project.value?.assignments || [])
);

const gruposAsignacionesFiltrados = computed(() => {
    const q = filtroAsignaciones.value.trim().toLowerCase();
    if (!q) return gruposAsignaciones.value;
    return gruposAsignaciones.value.filter((g) => g.todas.some((a) => coincideAsignacion(a, q)));
});

const estaExpandido = (grupo) => {
    if (gruposExpandidos.value.has(grupo.key)) return true;
    const q = filtroAsignaciones.value.trim().toLowerCase();
    if (!q) return false;
    // Si la búsqueda coincide con un relevo y no con el principal/vehículo, se despliega para mostrarlo.
    return !coincideAsignacion(grupo.principal, q) && grupo.relevos.some((r) => coincideAsignacion(r, q));
};

const toggleExpandGrupo = (key) => {
    const next = new Set(gruposExpandidos.value);
    if (next.has(key)) {
        next.delete(key);
    } else {
        next.add(key);
    }
    gruposExpandidos.value = next;
};

const togglingUuid = ref(null);

/** Retira o reactiva una asignación conductor-vehículo sin borrarla. */
const toggleAssignment = async (assignment) => {
    if (togglingUuid.value) return;
    togglingUuid.value = assignment.uuid;
    try {
        await store.updateItem(route.params.id, {
            assignments: payloadConAlternancia(project.value.assignments, assignment),
        });
        project.value = await store.fetchProfileById(route.params.id);
        // La evidencia refleja la asignación vigente (las hojas del coche
        // retirado ya se crearon en el proyecto y dejan de contar).
        await cargarEvidencia();
    } catch {
        await toast('Error', 'No se pudo actualizar la asignación', 'error');
    } finally {
        togglingUuid.value = null;
    }
};

// --- Relevo de turno (modal con el conductor entrante) ---
const relevoAbiertoUuid = ref(null);
const savingRelevo = ref(false);
const relevoError = ref('');

/** Conductores de la empresa aptos para recibir el turno del vehículo. */
const candidatosDeRelevo = (assignment) => candidatosDeRelevoUtil(
    store.catalogs.drivers || [],
    assignment.third_party_uuid,
    (conductor) => driverOptionLabel(conductor),
);

const toggleRelevo = async (assignment) => {
    if (relevoAbiertoUuid.value === assignment.uuid) {
        cerrarRelevo();
        return;
    }
    relevoAbiertoUuid.value = assignment.uuid;
    relevoError.value = '';
    await loadAssignmentCatalogs();
};

const cerrarRelevo = () => {
    relevoAbiertoUuid.value = null;
    relevoError.value = '';
};

const submitRelevo = async (payload) => {
    if (savingRelevo.value) return;
    savingRelevo.value = true;
    relevoError.value = '';
    try {
        await serviceDeliveryControlSheetService.relay(payload);
        await toast('Relevo de conductor', 'El entrante tomó el turno y tiene su hoja de control del día; el anterior sigue vigente.', 'success');
        const vehiculoRelevado = (project.value?.assignments || []).find((a) => a.uuid === relevoAbiertoUuid.value)?.vehicle_uuid;
        project.value = await store.fetchProfileById(route.params.id);
        if (vehiculoRelevado) {
            const next = new Set(gruposExpandidos.value);
            next.add(vehiculoRelevado);
            gruposExpandidos.value = next;
        }
        cerrarRelevo();
    } catch (err) {
        const detalles = err?.response?.data?.error?.details;
        relevoError.value = Array.isArray(detalles) && detalles[0]?.messages?.[0]
            ? detalles[0].messages[0]
            : (err?.response?.data?.message || 'No se pudo aplicar el relevo de conductor.');
    } finally {
        savingRelevo.value = false;
    }
};

// --- Nueva asignación desde el detalle (panel inline del "+") ---
const showAddAssignment = ref(false);
const addAssignmentButton = ref(null);
const savingAssignment = ref(false);
const catalogsLoading = ref(false);
const catalogsLoaded = ref(false);
const catalogError = ref('');
const addAssignmentError = ref('');
const newAssignment = reactive({ third_party_uuid: '', vehicle_uuid: '' });

const assignedDriverUuids = computed(() => new Set(activeAssignments.value.map((a) => a.third_party_uuid)));
const assignedVehicleUuids = computed(() => new Set(activeAssignments.value.map((a) => a.vehicle_uuid)));

const driverOptionLabel = (conductor) => {
    const nombre = driverName(conductor);
    const documento = conductor.document_number && !nombre.includes(conductor.document_number)
        ? ` (CC: ${conductor.document_number})`
        : '';
    return `${nombre}${documento}`;
};

const vehicleOptionLabel = (vehiculo) => {
    const base = vehiculo.vehicle_license_plate || vehiculo.internal_number || 'Vehículo';
    return vehiculo.vehicle_license_plate && vehiculo.internal_number
        ? `${base} · No. interno: ${vehiculo.internal_number}`
        : base;
};

/** Conductores activos que aún no están asignados al proyecto. */
const availableDrivers = computed(() =>
    (store.catalogs.drivers || [])
        .filter((conductor) => conductor.is_active !== false && !assignedDriverUuids.value.has(conductor.uuid))
        .map((conductor) => ({ uuid: conductor.uuid, label: driverOptionLabel(conductor) }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es'))
);

/** Vehículos activos que aún no están asignados al proyecto. */
const availableVehicles = computed(() =>
    (store.catalogs.vehicles || [])
        .filter((vehiculo) => vehiculo.is_active !== false && !assignedVehicleUuids.value.has(vehiculo.uuid))
        .map((vehiculo) => ({ uuid: vehiculo.uuid, label: vehicleOptionLabel(vehiculo) }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es'))
);

const loadAssignmentCatalogs = async () => {
    if (catalogsLoaded.value || catalogsLoading.value) return;
    catalogsLoading.value = true;
    catalogError.value = '';
    try {
        await store.loadCatalogs();
        catalogsLoaded.value = true;
    } catch {
        catalogError.value = 'No se pudieron cargar los conductores y vehículos.';
    } finally {
        catalogsLoading.value = false;
    }
};

const toggleAddAssignment = async () => {
    if (showAddAssignment.value) {
        closeAddAssignment();
        return;
    }
    showAddAssignment.value = true;
    addAssignmentError.value = '';
    await loadAssignmentCatalogs();
    await nextTick();
    document.getElementById('f-nuevo-conductor')?.focus();
};

const closeAddAssignment = () => {
    showAddAssignment.value = false;
    addAssignmentError.value = '';
    newAssignment.third_party_uuid = '';
    newAssignment.vehicle_uuid = '';
    nextTick(() => addAssignmentButton.value?.focus());
};

const submitNewAssignment = async () => {
    addAssignmentError.value = '';
    if (!newAssignment.third_party_uuid || !newAssignment.vehicle_uuid) {
        addAssignmentError.value = 'Selecciona el conductor y el vehículo.';
        return;
    }
    if (savingAssignment.value) return;

    savingAssignment.value = true;
    try {
        await store.updateItem(route.params.id, {
            assignments: payloadConNuevaAsignacion(project.value?.assignments, {
                third_party_uuid: newAssignment.third_party_uuid,
                vehicle_uuid: newAssignment.vehicle_uuid,
            }),
        });
        project.value = await store.fetchProfileById(route.params.id);
        closeAddAssignment();
        // Reactivar un coche devuelve sus hojas al conteo de evidencia.
        await cargarEvidencia();
    } catch (err) {
        const detalles = err?.response?.data?.error?.details;
        addAssignmentError.value = Array.isArray(detalles) && detalles[0]?.messages?.[0]
            ? detalles[0].messages[0]
            : 'No se pudo agregar la asignación. Revisa los datos e inténtalo de nuevo.';
    } finally {
        savingAssignment.value = false;
    }
};

const formatDateShort = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatMoney = (value) =>
    (value === null || value === undefined)
        ? '-'
        : '$' + Number(value).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const goToBack = () => router.push(can('projects.index') ? '/proyectos' : '/');
const goToEdit = () => router.push(`/proyectos/editar/${route.params.id}`);

/** Evidencia acumulada: planillas del proyecto con sus días y PDF por día. */
const EVIDENCIA_POR_PAGINA = 10;
const evidenciaItems = ref([]);
const evidenciaTotal = ref(0);
const evidenciaCerradas = ref(0);
const evidenciaResumen = ref({
    total_dias: 0,
    cerrados: 0,
    en_curso: 0,
    evidencia_incompleta: 0,
    pendiente_certificacion: 0,
    excepciones: 0,
    certificados: 0,
});
const evidenciaPage = ref(1);
const evidenciaLastPage = ref(1);
const evidenciaLoading = ref(false);
const evidenciaError = ref('');
const descargandoPdf = ref(null);

const projectUuid = computed(() => project.value?.uuid || route.params.id);
const diasDe = (padre) => {
    const dias = diasHijos(padre, false);
    // Hoja de un solo día (sin hijos): la propia hoja es el día.
    return dias.length ? dias : (padre.uuid || padre.service_date ? [padre] : []);
};
const recorridosDe = (dia) => recorridosCount(dia);

/** Filtro de evidencia por estado (SPEC-002 §4). */
const filtroEstadoEvidencia = ref('cerrados');

/** Fecha de hoy en ISO (YYYY-MM-DD) para detectar días vencidos. */
const hoyIso = (() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
})();

/** ¿El día ya venció (fecha anterior a hoy)? */
const esAnteriorAHoy = (serviceDate) => {
    const fecha = String(serviceDate || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(fecha) && fecha < hoyIso;
};

/** Clasifica un día según su estado administrativo derivado. */
const clasificarDia = (dia) => {
    switch (dia.estado) {
        case 'CERTIFICADA':
        case 'CERRADA_CON_EXCEPCION':
            return 'cerrados';
        case 'EN_CURSO':
            return 'en_curso';
        case 'CERRADA_OPERATIVAMENTE':
            return 'por_certificar';
        default:
            // BORRADOR/PARCIAL: "sin llenar" solo si el día ya pasó (fecha < hoy).
            return esAnteriorAHoy(dia.service_date) ? 'sin_llenar' : null;
    }
};

/** Hojas con los días del estado elegido. */
const evidenciaFiltrada = computed(() => {
    const objetivo = filtroEstadoEvidencia.value;
    return evidenciaItems.value
        .map((padre) => ({
            padre,
            dias: diasDe(padre).filter((dia) => clasificarDia(dia) === objetivo),
        }))
        .filter((grupo) => grupo.dias.length > 0);
});

/** Datos del conductor de la hoja para la fila agrupada de evidencia. */
const nombreConductor = (padre) =>
    (padre.driver_name || padre.official_name_and_surname || '').trim();

const documentoConductor = (padre) => {
    const doc = padre.internalControl?.thirdParty?.document_number;
    return doc ? `CC ${doc}` : '';
};

/** Abre la hoja de control de servicio del vehículo en el proyecto. */
const abrirHoja = (uuid) => {
    router.push(`/planilla-de-control-de-prestacion-servicios/editar/${uuid}`);
};

const cargarEvidencia = async (page = 1) => {
    evidenciaLoading.value = true;
    evidenciaError.value = '';
    try {
        const [resp, respResumen] = await Promise.all([
            serviceDeliveryControlSheetService.list({
                project_uuid: projectUuid.value,
                per_page: EVIDENCIA_POR_PAGINA,
                page,
            }),
            serviceDeliveryControlSheetService.projectEvidenceSummary(projectUuid.value),
        ]);
        const p = resp?.data ?? resp;
        evidenciaItems.value = p.data ?? [];
        evidenciaLastPage.value = p.last_page ?? 1;
        evidenciaPage.value = p.current_page ?? page;
        evidenciaResumen.value = respResumen?.data ?? respResumen;
        evidenciaTotal.value = evidenciaResumen.value.total_dias ?? 0;
        evidenciaCerradas.value = evidenciaResumen.value.cerrados ?? 0;
    } catch (err) {
        evidenciaError.value = 'No se pudo cargar la evidencia del proyecto.';
    } finally {
        evidenciaLoading.value = false;
    }
};

const cambiarPaginaEvidencia = (delta) => {
    const next = evidenciaPage.value + delta;
    if (next < 1 || next > evidenciaLastPage.value || evidenciaLoading.value) return;
    cargarEvidencia(next);
};

const descargarPdfDia = async (uuid) => {
    if (descargandoPdf.value) return;
    descargandoPdf.value = uuid;
    try {
        await serviceDeliveryControlSheetService.downloadDailyPdf(uuid);
    } catch (err) {
        await toast('Error', 'No se pudo descargar el PDF del día', 'error');
    } finally {
        descargandoPdf.value = null;
    }
};

/** Abre el listado de planillas ya filtrado por este proyecto. */
const irAPlanillas = () => {
    try {
        useServiceDeliveryControlSheetStore().setProjectFilter(projectUuid.value);
    } catch (err) {
        // Si el filtro falla, igual se navega al listado sin filtrar.
    }
    router.push('/planilla-de-control-de-prestacion-servicios');
};

onMounted(async () => {
    try {
        project.value = await store.fetchProfileById(route.params.id);
        if (project.value && can('service_delivery_control_sheets.index')) {
            await cargarEvidencia();
        }
    } finally {
        isViewLoading.value = false;
    }
});
</script>

<style scoped>
/* ===== VARIABLES ===== */
:root {
    --shadow-sm: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    --shadow-md: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    --transition: 150ms ease-in-out;
}

/* ===== ANIMACIONES ===== */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(12px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.fade-in-up {
    animation: fadeInUp 0.35s ease-out forwards;
}

/* ===== CARDS ===== */
.card {
    border-radius: 0.625rem !important;
    transition: box-shadow var(--transition);
}

.card:hover {
    box-shadow: var(--shadow-md) !important;
}

.card-header {
    border-radius: 0.625rem 0.625rem 0 0 !important;
    background: linear-gradient(135deg, #f8f9fa, #fff);
}

/* ===== TIPOGRAFÍA COMPACTA ===== */
.small {
    font-size: 0.85rem !important;
    line-height: 1.4;
}

.fw-medium {
    font-weight: 500 !important;
}

.fw-semibold {
    font-weight: 600 !important;
}

.font-monospace {
    font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

/* ===== TABLA DE DATOS (DL) ===== */
dl.row {
    margin: 0;
}

dt {
    color: #6c757d !important;
}

dd {
    color: #212529 !important;
    margin-bottom: 0;
}

dt,
dd {
    padding: 0;
}

/* ===== BADGES FALCON ===== */
.badge-subtle-success {
    background: rgba(25, 135, 84, 0.1);
    color: #198754;
    border: 1px solid rgba(25, 135, 84, 0.2);
}

.badge-subtle-danger {
    background: rgba(220, 53, 69, 0.1);
    color: #dc3545;
    border: 1px solid rgba(220, 53, 69, 0.2);
}

/* ===== BOTONES ===== */
.btn {
    transition: all var(--transition);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
}

.btn-falcon-default {
    background: #f8f9fa;
    border-color: #e9ecef;
    color: #212529;
}

/* ===== ASIGNACIONES (estilo Stitch) ===== */
.assignments-card {
    border: 1px solid #e2e8f0 !important;
    border-radius: 12px !important;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04) !important;
    overflow: hidden;
}

.assignments-card:hover {
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.07) !important;
}

.assignments-header {
    background: #fff !important;
    border-bottom: 1px solid #e2e8f0 !important;
    border-radius: 12px 12px 0 0 !important;
    padding: 14px 18px;
}

.assignments-header-icon {
    color: #2563eb;
    font-size: 14px;
}

.assignments-title {
    color: #1e293b;
    font-size: 0.875rem;
    font-weight: 700;
    letter-spacing: -0.01em;
}

.assignments-count {
    color: #64748b;
    font-weight: 400;
}

.assignment-badge-inactive {
    background: #fff1f2;
    color: #be123c;
    border: 1px solid #fecdd3;
    border-radius: 999px !important;
    font-size: 0.65rem;
    font-weight: 600;
}

.assignments-list {
    display: flex;
    flex-direction: column;
}

.assignment-row {
    padding: 12px 18px;
    border-bottom: 1px solid #f1f5f9;
    transition: background 0.15s ease;
}

.assignments-list .assignment-row:last-child {
    border-bottom: none;
}

.assignment-row:hover {
    background: #f8fafc;
}

.assignment-row--expanded {
    background: #f8fafc;
}

.assignment-relay-bullet {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 4px 7px;
    border-radius: 999px;
    border: 1px solid #bfdbfe;
    background: #eff6ff;
    color: #1d4ed8;
    font-size: 0.7rem;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.15s ease;
}

.assignment-relay-bullet:hover,
.assignment-relay-bullet.is-open {
    background: #2563eb;
    border-color: #2563eb;
    color: #ffffff;
}

.assignment-relay-bullet__icon {
    font-size: 0.65rem;
    transition: transform 0.15s ease;
}

.assignment-relay-bullet.is-open .assignment-relay-bullet__icon {
    transform: rotate(90deg);
}

.assignment-badge-relay-hint {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
    border-radius: 999px !important;
    font-size: 0.63rem;
    font-weight: 600;
}

.assignment-relays-drawer {
    margin: 10px 0 2px 26px;
    padding: 8px 12px;
    border-left: 2px solid #93c5fd;
    background: #ffffff;
    border-radius: 0 8px 8px 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.assignment-relay-item {
    padding: 6px 4px;
    border-bottom: 1px dashed #e2e8f0;
}

.assignment-relay-item:last-child {
    border-bottom: none;
    padding-bottom: 2px;
}

.assignment-relay-branch {
    width: 10px;
    height: 1px;
    background: #93c5fd;
    flex-shrink: 0;
}

.assignment-avatar-relay {
    background: #fef3c7;
    color: #b45309;
    width: 30px;
    height: 30px;
}

.assignment-badge-relay {
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fde68a;
    border-radius: 999px !important;
    font-size: 0.63rem;
    font-weight: 600;
}

.assignment-avatar {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.assignment-avatar-driver {
    background: #eff6ff;
    color: #2563eb;
}

.assignment-avatar-vehicle {
    background: #ecfdf5;
    color: #059669;
}

.assignment-badge-active {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
    border-radius: 999px !important;
    font-size: 0.65rem;
    font-weight: 600;
}

.assignment-action {
    border-radius: 8px;
    background: #fff;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 2px 9px;
}

.assignment-action-retirar {
    border: 1px solid #fecdd3;
    color: #e11d48;
}

.assignment-action-retirar:hover:not(:disabled) {
    background: #fff1f2;
    border-color: #fda4af;
    color: #be123c;
}

.assignment-action-reactivar {
    border: 1px solid #a7f3d0;
    color: #047857;
}

.assignment-action-reactivar:hover:not(:disabled) {
    background: #ecfdf5;
    border-color: #6ee7b7;
    color: #065f46;
}

.assignment-empty {
    margin: 0;
    padding: 16px 18px;
    color: #64748b;
    font-size: 0.8rem;
}

.assignment-add {
    padding: 12px 18px 16px;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
}

.assignment-add-row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.assignment-add-line {
    flex: 1;
    height: 1px;
    background: #e2e8f0;
}

.assignment-add-button {
    width: 34px;
    height: 34px;
    padding: 0;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: #fff;
    border: 1px solid #bfdbfe;
    color: #2563eb;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
    transition: all 0.15s ease;
}

.assignment-add-button:hover:not(:disabled) {
    background: #2563eb;
    border-color: #2563eb;
    color: #fff;
}

.assignment-form {
    margin-top: 12px;
    padding: 14px;
    border: 1px solid #dbeafe;
    border-radius: 10px;
    background: #f8fbff;
}

.assignment-form-title {
    color: #1e3a8a;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.assignment-form-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #2563eb;
}

.assignment-form .form-label {
    color: #334155;
    font-weight: 600;
}

.assignment-form-alert {
    margin-top: 10px;
    padding: 8px 10px;
    border: 1px solid #fde68a;
    border-radius: 8px;
    background: #fffbeb;
    color: #92400e;
    font-size: 0.75rem;
}

.assignment-form-note {
    margin: 10px 0 0;
    padding: 8px 10px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #fff;
    color: #64748b;
    font-size: 0.75rem;
}

.assignment-form-error {
    margin-top: 10px;
    padding: 8px 10px;
    border: 1px solid #fecdd3;
    border-radius: 8px;
    background: #fff1f2;
    color: #be123c;
    font-size: 0.75rem;
}

.assignment-btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    padding: 6px 12px;
    border: 1px solid #2563eb;
    border-radius: 8px;
    background: #2563eb;
    color: #fff;
    font-size: 0.78rem;
    font-weight: 600;
    transition: all 0.15s ease;
}

.assignment-btn-primary:hover:not(:disabled) {
    background: #1d4ed8;
    border-color: #1d4ed8;
}

.assignment-btn-primary:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.assignment-btn-ghost {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #fff;
    color: #475569;
    font-size: 0.78rem;
    font-weight: 600;
    transition: all 0.15s ease;
}

.assignment-btn-ghost:hover:not(:disabled) {
    background: #f8fafc;
    border-color: #cbd5e1;
}

.assignment-btn-ghost:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.assignment-footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 18px;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
    color: #64748b;
    font-size: 0.72rem;
}

.assignment-footer-stat {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.assignment-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    display: inline-block;
}

.assignment-dot-active {
    background: #10b981;
}

.assignment-dot-inactive {
    background: #f43f5e;
}

.btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

.bg-opacity-10 {
    --bs-bg-opacity: 0.1;
}

/* ===== AVATAR ===== */
.avatar-placeholder {
    width: 34px;
    height: 34px;
    flex-shrink: 0;
    user-select: none;
}

.min-w-0 {
    min-width: 0;
}

/* ===== LISTA DE ASIGNACIONES ===== */
.list-group-item:last-child {
    border-bottom: none !important;
}

.list-group-item:hover {
    background: #f8f9fa;
}

/* Skeleton base */
.skeleton-text,
.skeleton-icon {
    background: linear-gradient(90deg, #e9ecef 25%, #f8f9fa 50%, #e9ecef 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 4px;
}

.skeleton-icon {
    border-radius: 6px;
    flex-shrink: 0;
}

@keyframes shimmer {
    0% {
        background-position: 200% 0;
    }

    100% {
        background-position: -200% 0;
    }
}

/* ===== BUSCADOR LOCAL (asignaciones y evidencia) ===== */
.assignment-search {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #fff;
    color: #94a3b8;
    min-width: 14rem;
}

.assignment-search:focus-within {
    border-color: #93c5fd;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.assignment-search__input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    font-size: 0.78rem;
    color: #1e293b;
}

.assignment-search__input::placeholder {
    color: #94a3b8;
}

.assignment-search__clear {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: #f1f5f9;
    color: #64748b;
    font-size: 0.6rem;
    flex-shrink: 0;
}

.assignment-search__clear:hover {
    background: #e2e8f0;
    color: #334155;
}

/* ===== FILA AGRUPADA DE HOJA EN EVIDENCIA ===== */
.evidencia-hoja-row {
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
}

.evidencia-hoja-row td {
    border-bottom: none;
}
</style>
