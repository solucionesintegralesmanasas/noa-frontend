<template>
    <!-- VISTA ESCRITORIO / TABLET -->
    <div class="d-none d-md-block">
        <BasePageHeader
            title="Hojas de Control de Servicio"
            description="Gestión y control de planillas de prestación de servicios por proyecto y vehículo."
            icon="fad fa-clipboard-list text-primary"
            :show-bg="true"
            :loading="isViewLoading"
            :compact="true"
            :breadcrumbs="[{ label: 'Hojas de Control' }, { label: 'Listado' }]"
        >
            <template #actions>
                <!-- REFRESH -->
                <button
                    class="btn btn-falcon-default btn-sm px-3 me-2"
                    type="button"
                    title="Actualizar datos"
                    :aria-label="'Actualizar listado'"
                    @click="refreshTable"
                >
                    <i class="fad fa-sync" aria-hidden="true" />
                </button>

                <!-- CREATE -->
                <button
                    v-if="permissions.create && !permissionsStore.hasRole('CONDUCTOR')"
                    class="btn btn-primary btn-sm px-3 me-2"
                    type="button"
                    title="Nuevo registro de planilla"
                    @click="goToCreate"
                >
                    <i class="fas fa-plus me-1" aria-hidden="true" />
                    <span class="d-none d-sm-inline">Nueva Planilla</span>
                </button>

                <!-- CUSTOM: Control de Servicios (En Ruta) -->
                <button
                    class="btn btn-success btn-sm px-3 fw-medium shadow-sm"
                    type="button"
                    title="Control de Servicios (En Ruta)"
                    @click="goToInternalControl"
                >
                    <i class="fad fa-steering-wheel me-1" aria-hidden="true" />
                    <span class="d-none d-sm-inline">Control en Ruta</span>
                </button>
            </template>
        </BasePageHeader>

        <!-- BARRA GLOBAL SUPERIOR: Conmutador de vista + Búsqueda rápida de proyectos -->
        <div class="card border-0 shadow-sm mb-3 fade-in-up" style="animation-delay: 0.05s;">
            <div class="card-body p-2 d-flex flex-wrap align-items-center justify-content-between gap-2">
                <!-- Conmutador Segmentado de Modo de Vista -->
                <div class="btn-group btn-group-sm p-1 bg-light rounded-2 border" role="group" aria-label="Modo de visualización">
                    <button
                        type="button"
                        class="btn btn-xs fw-semibold d-inline-flex align-items-center gap-1.5"
                        :class="store.viewMode === 'projects' ? 'btn-white text-primary shadow-xs' : 'text-muted'"
                        @click="changeViewMode('projects')"
                    >
                        <i class="fad fa-layer-group" aria-hidden="true" />
                        <span>Vista Proyectos</span>
                    </button>
                    <button
                        type="button"
                        class="btn btn-xs fw-semibold d-inline-flex align-items-center gap-1.5"
                        :class="store.viewMode === 'flat' ? 'btn-white text-primary shadow-xs' : 'text-muted'"
                        @click="changeViewMode('flat')"
                    >
                        <i class="fad fa-list" aria-hidden="true" />
                        <span>Lista Plana Todos los Vehículos</span>
                    </button>
                </div>

                <!-- Selector auxiliar de proyecto en modo lista plana -->
                <div v-if="store.viewMode === 'flat'" class="d-flex align-items-center gap-2" style="max-width: 20rem; flex: 1 1 14rem;">
                    <label class="visually-hidden" for="filtro-proyecto-flat">Filtrar por proyecto</label>
                    <PrimeSelect
                        input-id="filtro-proyecto-flat"
                        v-model="projectFilter"
                        :options="opcionesProyecto"
                        option-label="label"
                        option-value="value"
                        size="small"
                        class="w-100"
                        @change="onProjectFilterChange"
                    />
                </div>

                <!-- Indicador de modo -->
                <div class="text-muted fs-11 ms-auto d-none d-lg-block">
                    <span v-if="store.viewMode === 'projects'">
                        <i class="fad fa-info-circle text-primary me-1" aria-hidden="true"></i>
                        Haz clic en una tarjeta para ver las planillas de ese proyecto
                    </span>
                    <span v-else>
                        <i class="fad fa-info-circle text-primary me-1" aria-hidden="true"></i>
                        Viendo todos los vehículos de la flota
                    </span>
                </div>
            </div>
        </div>

        <!-- SWITCHER DE TARJETAS DE PROYECTO (Solo en modo Vista Proyectos) -->
        <ProjectSwitcherCards
            v-if="store.viewMode === 'projects' && store.projectsOverview.length > 0"
            :projects="store.projectsOverview"
            :selected-project-uuid="store.projectFilter"
            :loading="store.loading"
            :can-create-project="permissionsStore.can('projects.create')"
            @select="onProjectCardSelect"
            @create-project="goToCreateProject"
        />

        <!-- LISTADO: cabecera contextual del proyecto + toolbar + tabla + paginador en una sola tarjeta -->
        <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
            <!-- Cabecera contextual del proyecto seleccionado (si aplica) -->
            <div v-if="store.viewMode === 'projects' && selectedProject" class="px-3 py-2 bg-light border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div class="d-flex align-items-center gap-2">
                    <div class="p-2 bg-primary-subtle text-primary rounded-2">
                        <i class="fad fa-briefcase fs-5" aria-hidden="true" />
                    </div>
                    <div>
                        <div class="d-flex align-items-center gap-2">
                            <h6 class="mb-0 fw-bold text-dark text-uppercase fs-12">{{ selectedProject.project_name }}</h6>
                            <span class="badge badge-subtle-primary rounded-pill fs-10">
                                Proyecto Activo — {{ selectedProject.assignments_count || 0 }} vehículos
                            </span>
                        </div>
                        <span class="text-muted fs-11 d-block">
                            Directo con la empresa • Vigencia: {{ formatVigenciaProyecto(selectedProject) }}
                        </span>
                    </div>
                </div>

                <!-- Acciones contextuales del proyecto -->
                <div class="d-flex align-items-center gap-2">
                    <button
                        v-if="permissions.pdf"
                        type="button"
                        class="btn btn-primary btn-project-action shadow-xs"
                        title="Abrir diálogo de reportes para este proyecto"
                        @click="openProjectReport"
                    >
                        <i class="fad fa-file-chart-line" aria-hidden="true" />
                        <span>Reporte Consolidado</span>
                    </button>
                    <button
                        v-if="permissions.projectProfile && selectedProject.uuid"
                        type="button"
                        class="btn btn-primary btn-project-action shadow-xs"
                        title="Ver ficha completa del proyecto"
                        @click="goToProject(selectedProject.uuid)"
                    >
                        <i class="fad fa-eye" aria-hidden="true" />
                        <span>Ver Proyecto</span>
                    </button>
                    <button
                        v-if="permissions.projectEdit && selectedProject.uuid"
                        type="button"
                        class="btn btn-primary btn-project-action shadow-xs"
                        title="Editar información de este proyecto"
                        @click="goToProjectEdit(selectedProject.uuid)"
                    >
                        <i class="fad fa-edit" aria-hidden="true" />
                        <span>Editar Proyecto</span>
                    </button>
                </div>
            </div>

            <!-- TOOLBAR DE FILTROS Y BÚSQUEDA -->
            <div class="noa-list-toolbar">
                <div class="noa-search">
                    <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                    <input
                        id="f-pcp-busqueda"
                        v-model="searchQuery"
                        class="noa-search__input"
                        type="search"
                        :placeholder="store.viewMode === 'projects' && selectedProject ? `Buscar en ${selectedProject.project_name}...` : 'Buscar por ruta, vehículo, conductor...'"
                        aria-label="Buscar hoja de control"
                        @input="debouncedSearch"
                    />
                    <button
                        v-if="searchQuery"
                        class="noa-search__clear"
                        type="button"
                        title="Limpiar búsqueda"
                        aria-label="Limpiar búsqueda"
                        @click="clearSearch"
                    >
                        <i class="fal fa-times" aria-hidden="true" />
                    </button>
                </div>

                <!-- Pestañas Rápidas por Estado de Planilla -->
                <div class="btn-group btn-group-sm ms-2" role="group" aria-label="Filtrar por estado de planilla">
                    <button
                        type="button"
                        class="btn btn-xs fw-semibold"
                        :class="store.statusFilter === 'todas' ? 'btn-primary' : 'btn-outline-secondary'"
                        @click="onStatusTabChange('todas')"
                    >
                        Todas
                    </button>
                    <button
                        type="button"
                        class="btn btn-xs fw-semibold"
                        :class="store.statusFilter === 'en_curso' ? 'btn-info text-white' : 'btn-outline-secondary'"
                        @click="onStatusTabChange('en_curso')"
                    >
                        En curso
                    </button>
                    <button
                        type="button"
                        class="btn btn-xs fw-semibold"
                        :class="store.statusFilter === 'con_pendientes' ? 'btn-warning text-dark' : 'btn-outline-secondary'"
                        @click="onStatusTabChange('con_pendientes')"
                    >
                        Con pendientes
                    </button>
                    <button
                        type="button"
                        class="btn btn-xs fw-semibold"
                        :class="store.statusFilter === 'cerradas' ? 'btn-success text-white' : 'btn-outline-secondary'"
                        @click="onStatusTabChange('cerradas')"
                    >
                        Cerradas
                    </button>
                </div>

                <!-- Contador de resultados y Reporte Consolidado en modo plano -->
                <div class="d-flex align-items-center gap-2 ms-auto">
                    <button
                        v-if="permissions.pdf && !(store.viewMode === 'projects' && selectedProject)"
                        type="button"
                        class="btn btn-primary btn-project-action shadow-xs"
                        title="Abrir diálogo de reportes consolidados"
                        @click="openProjectReport"
                    >
                        <i class="fad fa-file-chart-line" aria-hidden="true" />
                        <span>Reporte Consolidado</span>
                    </button>
                    <span v-if="!isViewLoading" class="noa-results">
                        <i v-if="!store.loading" class="fas fa-filter" aria-hidden="true" />
                        <span v-else class="spinner-border spinner-border-sm text-primary" style="width: 10px; height: 10px;" role="status" aria-hidden="true"></span>
                        {{ store.pagination.totalItems }} resultado{{ store.pagination.totalItems !== 1 ? 's' : '' }}
                        <template v-if="store.search"> para "{{ store.search }}"</template>
                    </span>
                </div>
            </div>

            <!-- SKELETON -->
            <div v-if="isViewLoading" class="card-body p-0">
                <div class="table-responsive scrollbar">
                    <table class="table table-sm mb-0">
                        <thead>
                            <tr>
                                <th v-for="w in ['4%', '20%', '22%', '16%', '13%', '11%', '14%']" :key="w" style="padding:12px 8px">
                                    <div class="skeleton-text" :style="`height:16px;width:${w}`" />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="n in store.pagination.itemsPerPage" :key="`sk-${n}`">
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

            <!-- DATATABLE (Paginación Server-Side) -->
            <div v-else class="card-body p-0">
                <div class="table-responsive scrollbar">
                    <DataTable
                        :value="store.items"
                        v-model:expandedRows="expandedRows"
                        dataKey="uuid"
                        lazy
                        :paginator="false"
                        :rows="store.pagination.itemsPerPage"
                        :totalRecords="store.pagination.totalItems"
                        :first="(store.pagination.currentPage - 1) * store.pagination.itemsPerPage"
                        :loading="store.loading"
                        :sortField="store.sortField"
                        :sortOrder="store.sortOrder"
                        @sort="handleSort"
                        responsiveLayout="scroll"
                        tableStyle="min-width: 60rem"
                        class="table table-sm mb-0 professional-table noa-table-fixed"
                        emptyMessage="No se encontraron hojas de control para los filtros seleccionados"
                    >
                        <Column expander style="width: 3.2rem" />

                        <!-- Proyecto / Tipo (Visible solo en modo Lista Plana) -->
                        <Column v-if="store.viewMode === 'flat'" header="Proyecto / Tipo" style="width: 18%;">
                            <template #body="{ data }">
                                <div class="d-flex flex-column">
                                    <span class="noa-cell-strong text-truncate" :title="data.project?.project_name">{{ data.project?.project_name || 'Sin Proyecto' }}</span>
                                    <span class="badge rounded-pill badge-subtle-secondary mt-1 align-self-start" style="font-size: 0.65rem;">
                                        {{ tipoLabel(data.type_of_control_sheet) }}
                                    </span>
                                </div>
                            </template>
                        </Column>

                        <!-- Vehículo / Placa -->
                        <Column field="vehicle_license_plate" header="Vehículo / Placa" sortable style="width: 20%;">
                            <template #body="{ data }">
                                <div class="d-flex flex-column">
                                    <span class="noa-cell-strong d-flex align-items-center gap-1">
                                        <i class="fad fa-car-side text-muted" aria-hidden="true" />
                                        <span>{{ data.vehicle_license_plate || 'Sin Placa' }}</span>
                                    </span>
                                    <small v-if="vehiculoSubtitulo(data)" class="noa-cell-sub text-truncate text-muted" :title="vehiculoSubtitulo(data)">
                                        {{ vehiculoSubtitulo(data) }}
                                    </small>
                                </div>
                            </template>
                        </Column>

                        <!-- Conductor Asignado -->
                        <Column header="Conductor Asignado" style="width: 22%;">
                            <template #body="{ data }">
                                <div class="d-flex flex-column">
                                    <span class="noa-cell-strong text-truncate" :title="data.driver_name || data.official_name_and_surname">
                                        <i class="fad fa-user-tie text-muted me-1" aria-hidden="true" />
                                        {{ data.driver_name || data.official_name_and_surname || 'Sin Conductor' }}
                                    </span>
                                    <small v-if="conductorDocumento(data)" class="noa-cell-sub text-muted font-monospace" style="font-size: 0.72rem;">
                                        {{ conductorDocumento(data) }}
                                    </small>
                                </div>
                            </template>
                        </Column>

                        <!-- Recorridos -->
                        <Column header="Recorridos" style="width: 15%;">
                            <template #body="{ data }">
                                <span class="badge rounded-pill badge-subtle-info">
                                    <i class="fad fa-route me-1" aria-hidden="true" /> {{ recorridosCount(data) }} recorrido{{ recorridosCount(data) !== 1 ? 's' : '' }}
                                </span>
                                <div v-if="recorridosTexto(data)" class="small text-muted mt-1 text-truncate" :title="recorridosTexto(data)">
                                    {{ recorridosTexto(data) }}
                                </div>
                            </template>
                        </Column>

                        <!-- Fechas -->
                        <Column field="start_date" header="Fechas" sortable style="width: 12%;">
                            <template #body="{ data }">
                                <div class="d-flex flex-column text-dark" style="font-size: 0.82rem;">
                                    <span class="fw-medium">
                                        <i class="fad fa-calendar-alt text-muted me-1" aria-hidden="true" />
                                        {{ formatRango(data.start_date || data.service_date) || '-' }}
                                    </span>
                                    <span v-if="(data.end_date || data.service_date) && (data.end_date || data.service_date) !== (data.start_date || data.service_date)" class="text-muted mt-0.5">
                                        <i class="fad fa-arrow-down text-muted mx-1" style="font-size: 0.65rem;" aria-hidden="true" />
                                        {{ formatRango(data.end_date || data.service_date) }}
                                    </span>
                                </div>
                            </template>
                        </Column>

                        <!-- Estado Planilla -->
                        <Column field="estado" header="Estado" class="text-center" style="width: 11%;">
                            <template #body="{ data }">
                                <span
                                    v-if="data.estado"
                                    class="badge rounded-pill px-2 py-1"
                                    :class="claseEstadoServicio(data.estado)"
                                    style="font-size: 0.72rem;"
                                    :title="tituloEstadoServicio(data)"
                                >
                                    {{ etiquetaEstadoServicio(data.estado) }}
                                </span>
                            </template>
                        </Column>

                        <!-- Resumen Días -->
                        <Column header="Resumen Días" class="text-center" style="width: 13%;">
                            <template #body="{ data }">
                                <span
                                    class="badge rounded-pill px-2 py-1 fs-11 fw-semibold d-inline-flex align-items-center gap-1"
                                    :class="resumenDias(data).clase"
                                    :title="resumenDias(data).tooltip"
                                >
                                    <i :class="resumenDias(data).icono" aria-hidden="true" />
                                    <span>{{ resumenDias(data).texto }}</span>
                                </span>
                            </template>
                        </Column>

                        <!-- Acciones -->
                        <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 10%;">
                            <template #body="{ data }">
                                <RowActions :actions="accionesDe(data)" :row-label="data.vehicle_license_plate || 'planilla'" />
                            </template>
                        </Column>

                        <!-- Loading state -->
                        <template #loading>
                            <NoaTableSpinner message="Cargando datos..." />
                        </template>

                        <!-- SUB-TABLA EXPANDIDA: Días del Servicio -->
                        <template #expansion="{ data }">
                            <div class="expanded-days-container border-start border-4 border-primary bg-white shadow-xs rounded-3 p-3 my-2 mx-1">
                                <!-- Cabecera de la sub-tabla -->
                                <div class="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom flex-wrap gap-2">
                                    <div class="d-flex align-items-center gap-2">
                                        <i class="fad fa-calendar-day text-primary" aria-hidden="true" />
                                        <span class="fs-12 fw-bold text-dark">
                                            Días del servicio ({{ diasHijos(data).length }})
                                        </span>
                                        <span class="text-muted fs-11">
                                            — Planilla {{ data.vehicle_license_plate || 'S/P' }} #{{ data.uuid ? data.uuid.slice(0, 8) : '' }}
                                        </span>
                                    </div>

                                    <div class="d-flex align-items-center gap-2">
                                        <button
                                            v-if="permissions.pdf"
                                            class="btn btn-falcon-default btn-xs px-2 fw-semibold d-inline-flex align-items-center gap-1 shadow-xs"
                                            type="button"
                                            title="Descargar PDF de la planilla completa"
                                            :disabled="downloadingDaily === data.uuid"
                                            @click="downloadParentPdf(data)"
                                        >
                                            <span v-if="downloadingDaily === data.uuid" class="spinner-border spinner-border-sm text-danger" style="width: 12px; height: 12px;"></span>
                                            <i v-else class="fad fa-file-pdf text-danger" aria-hidden="true" />
                                            <span>Descargar Hoja Completa (PDF)</span>
                                        </button>
                                    </div>
                                </div>

                                <!-- Tabla de días -->
                                <div v-if="diasHijos(data).length > 0" class="table-responsive">
                                    <table class="table table-sm table-hover mb-0 fs-11">
                                        <thead class="bg-light">
                                            <tr class="text-uppercase text-muted fs-10 fw-bold">
                                                <th class="py-1 px-2">Fecha</th>
                                                <th class="py-1 px-2 text-center">Estado</th>
                                                <th class="py-1 px-2 text-center">Recorridos</th>
                                                <th class="py-1 px-2">Km Inicial / Final</th>
                                                <th class="py-1 px-2 text-center">PDF del día</th>
                                                <th class="py-1 px-2 text-end">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="dia in diasHijos(data)" :key="dia.uuid" class="align-middle">
                                                <td class="py-2 px-2 fw-semibold text-dark">
                                                    {{ formatRango(dia.service_date) || '-' }}
                                                </td>
                                                <td class="py-2 px-2 text-center">
                                                    <span
                                                        v-if="dia.estado"
                                                        class="badge rounded-pill px-2 py-0.5"
                                                        :class="claseEstadoServicio(dia.estado)"
                                                        style="font-size: 0.65rem;"
                                                        :title="tituloEstadoServicio(dia)"
                                                    >
                                                        {{ etiquetaEstadoServicio(dia.estado) }}
                                                    </span>
                                                </td>
                                                <td class="py-2 px-2 text-center text-muted">
                                                    <span class="badge badge-subtle-secondary rounded-pill">
                                                        {{ Array.isArray(dia.routes) ? dia.routes.length : 0 }}
                                                    </span>
                                                </td>
                                                <td class="py-2 px-2 text-muted font-monospace" style="font-size: 0.72rem;">
                                                    <span>{{ formatKmValor(dia.starting_kilometer) }}</span>
                                                    <span class="mx-1">—</span>
                                                    <span v-if="tieneKm(dia.ending_kilometer)">{{ formatKmValor(dia.ending_kilometer) }}</span>
                                                    <span v-else class="text-danger fw-semibold">Pendiente</span>
                                                </td>
                                                <td class="py-2 px-2 text-center">
                                                    <button
                                                        v-if="permissions.pdf"
                                                        class="btn btn-falcon-default btn-xs p-1 px-2"
                                                        type="button"
                                                        title="Descargar PDF de este día"
                                                        :aria-label="`Descargar PDF del día ${formatRango(dia.service_date)}`"
                                                        :disabled="downloadingDaily === dia.uuid"
                                                        @click="downloadDaily(dia.uuid)"
                                                    >
                                                        <span
                                                            v-if="downloadingDaily === dia.uuid"
                                                            class="spinner-border spinner-border-sm text-danger"
                                                            style="width: 12px; height: 12px;"
                                                        ></span>
                                                        <i v-else class="fad fa-file-pdf text-danger" aria-hidden="true" />
                                                    </button>
                                                </td>
                                                <td class="py-2 px-2 text-end">
                                                    <button
                                                        v-if="!isServicioCerrado(dia)"
                                                        type="button"
                                                        class="btn btn-link btn-xs p-0 text-primary fw-semibold text-decoration-none"
                                                        title="Ir a Control en Ruta para este día"
                                                        @click="goToControl(dia.uuid)"
                                                    >
                                                        <span>Completar</span>
                                                        <i class="fas fa-arrow-right fs-10 ms-1" aria-hidden="true"></i>
                                                    </button>
                                                    <span v-else class="text-success fs-10 fw-medium">
                                                        <i class="fas fa-check-circle me-1" aria-hidden="true"></i>Cerrado
                                                    </span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div v-else class="text-muted fs-11 py-2">
                                    {{ store.statusFilter === 'cerradas' ? 'Sin fechas cerradas en este servicio.' : 'Servicio de un solo día: utiliza el botón PDF de la fila principal.' }}
                                </div>
                            </div>
                        </template>
                    </DataTable>
                </div>
                <ListPagination
                    :page="store.pagination.currentPage"
                    :per-page="store.pagination.itemsPerPage"
                    :total="store.pagination.totalItems"
                    @change="onPageChange"
                />
            </div>
        </div>
    </div>

    <!-- VISTA MÓVIL ANDROID CAPACITOR (Pantalla completa de borde a borde) -->
    <div class="d-md-none w-100 px-1 pt-1 pb-3 mobile-service-feed">
        <MobileSectionHeader
            title="Control de Servicio"
            icon-class="fas fa-route"
            icon-bg="#14b8a6"
            :badge="store.pagination.totalItems ? `${store.pagination.totalItems}` : '0'"
        >
            <template #action>
                <button v-if="permissions.create" type="button" class="btn btn-primary btn-sm py-1 px-2 fs-11 rounded-3" @click="goToCreate">
                    <i class="fas fa-plus me-1" aria-hidden="true"></i> Nuevo
                </button>
            </template>
        </MobileSectionHeader>

        <!-- Selector móvil de proyecto si hay múltiples -->
        <div v-if="store.projectsOverview.length > 1" class="mb-2 px-1">
            <label for="m-project-filter" class="visually-hidden">Filtrar por proyecto</label>
            <select
                id="m-project-filter"
                v-model="store.projectFilter"
                class="form-select form-select-sm fs-11"
                aria-label="Seleccionar proyecto móvil"
                @change="store.fetchItems()"
            >
                <option value="">Todos los proyectos ({{ store.projectsOverview.length }})</option>
                <option v-for="p in store.projectsOverview" :key="p.uuid" :value="p.uuid">
                    {{ p.project_name }} ({{ p.assignments_count || 0 }} veh)
                </option>
            </select>
        </div>

        <div v-if="store.items && store.items.length > 0" class="d-flex flex-column w-100">
            <MobileCard
                v-for="item in store.items"
                :key="item.uuid"
                variant="teal"
                :title="item.vehicle_license_plate || 'SIN PLACA'"
                :subtitle="item.project?.project_name || 'Servicio de Transporte'"
                :badge="tipoLabel(item.type_of_control_sheet)"
                icon-class="fas fa-route"
            >
                <div class="d-flex justify-content-between align-items-center py-2 border-top border-bottom my-1">
                    <div>
                        <small class="text-muted d-block fs-10">Conductor</small>
                        <span class="fw-semibold text-dark fs-12">
                            {{ item.driver_name || item.official_name_and_surname || 'Sin conductor' }}
                        </span>
                    </div>
                    <div class="text-end">
                        <small class="text-muted d-block fs-10">Recorridos</small>
                        <span class="badge bg-light text-primary border fw-bold fs-11">
                            <i class="fad fa-road me-1" aria-hidden="true"></i>{{ recorridosCount(item) }}
                        </span>
                    </div>
                </div>

                <template #actions>
                    <button class="mc-btn-primary" type="button" @click="goToInternalControl">
                        <i class="fad fa-steering-wheel" aria-hidden="true"></i>
                        <span>Control en Ruta</span>
                    </button>
                    <button class="mc-btn-secondary" type="button" @click="downloadParentPdf(item)">
                        <i class="fad fa-file-pdf text-danger" aria-hidden="true"></i>
                        <span>PDF</span>
                    </button>
                </template>
            </MobileCard>
        </div>

        <MobileEmptyState
            v-else
            emoji="🚌"
            title="Sin hojas de servicio"
            description="No hay registros de control de servicio para los filtros seleccionados."
            action-text="Control en Ruta"
            action-icon="fad fa-steering-wheel"
            @action="goToInternalControl"
        />

        <!-- Paginación Móvil Táctil -->
        <div v-if="store.pagination.totalPages > 1" class="d-flex justify-content-between align-items-center mt-2 pt-1 px-1">
            <button
                class="btn btn-light btn-sm border px-3 rounded-pill fs-11"
                :disabled="store.pagination.currentPage <= 1"
                @click="onPageChange({ page: store.pagination.currentPage - 1, rows: store.pagination.itemsPerPage, first: (store.pagination.currentPage - 2) * store.pagination.itemsPerPage })"
            >
                <i class="fas fa-chevron-left me-1" aria-hidden="true"></i> Anterior
            </button>
            <span class="fs-11 text-muted fw-semibold">
                {{ store.pagination.currentPage }} / {{ store.pagination.totalPages }}
            </span>
            <button
                class="btn btn-light btn-sm border px-3 rounded-pill fs-11"
                :disabled="store.pagination.currentPage >= store.pagination.totalPages"
                @click="onPageChange({ page: store.pagination.currentPage + 1, rows: store.pagination.itemsPerPage, first: store.pagination.currentPage * store.pagination.itemsPerPage })"
            >
                Siguiente <i class="fas fa-chevron-right ms-1" aria-hidden="true"></i>
            </button>
        </div>
    </div>

    <!-- DIÁLOGO ÚNICO DE REPORTES: rango, vehículo, conductor, día y mensual en PDF y Excel (solo cerradas) -->
    <ServiceReportsDialog
        v-model:visible="showReportsDialog"
        :vehicles="reportVehicles"
        :drivers="reportDrivers"
        :project="selectedProject"
    />
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useServiceDeliveryControlSheetStore } from '../store/serviceDeliveryControlSheet.store.js';
import { usePermissionsStore, useUserStore } from '@store';
import { toast } from '@/utils/toast.js';
import { showSwalModal, closeSwal, showLoadingModal } from '@/utils/confirm.js';
import { useTable } from '@/hooks/useTable.js';
import { useTableActions } from '@/hooks/useTableActions.js';
import { useServerSort } from '@/hooks/useServerSort.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import RowActions from '@/components/RowActions.vue';
import ListPagination from '@/components/ListPagination.vue';
import PrimeSelect from '@/components/form/PrimeSelect.vue';
import ServiceReportsDialog from '../components/ServiceReportsDialog.vue';
import ProjectSwitcherCards from '../components/ProjectSwitcherCards.vue';
import {
    formatRango as formatRangoHook,
    diasHijos as diasHijosHook,
    recorridosCount as recorridosCountHook,
    recorridosTexto as recorridosTextoHook,
    esCerrado,
    resumenDiasInfo
} from '../hooks/useServiceList.js';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import MobileCard from '@/components/mobile/MobileCard.vue';
import MobileSectionHeader from '@/components/mobile/MobileSectionHeader.vue';
import MobileEmptyState from '@/components/mobile/MobileEmptyState.vue';
import { claseEstadoServicio, etiquetaEstadoServicio, tituloEstadoServicio } from '@/utils/serviceDeliveryStatus.js';

const router = useRouter();
const route = useRoute();
const store = useServiceDeliveryControlSheetStore();
const permissionsStore = usePermissionsStore();
const userStore = useUserStore();

const { handleSort } = useServerSort((field, order) => store.setSort(field, order), { route, router });

const isViewLoading = ref(true);
const searchQuery = ref('');
const projectFilter = ref('');
const expandedRows = ref([]);

const opcionesProyecto = computed(() => [
    { label: 'Todos los proyectos', value: '' },
    ...(store.projects ?? []).map((p) => ({ label: p.project_name, value: p.uuid })),
]);

const selectedProject = computed(() => {
    if (!store.projectFilter) return null;
    return store.projectsOverview.find((p) => p.uuid === store.projectFilter) || null;
});

const showReportsDialog = ref(false);
const reportVehicles = computed(() => store.catalogs.vehicles ?? []);
const reportDrivers = computed(() => store.catalogs.drivers ?? []);
const downloadingDaily = ref(null);
const sharingLink = ref(null);

const canShareCoordinatorLink = computed(() =>
    permissionsStore.hasRole('superadmin') || permissionsStore.hasRole('administrador') || permissionsStore.hasRole('ADMIN_EMPRESA')
);

const permissions = reactive({ create: false, edit: false, delete: false, pdf: false, projectProfile: false, projectEdit: false });
const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(searchQuery.value));
const { initTooltips } = useTableActions(store, router);

const clearSearch = async () => {
    searchQuery.value = '';
    await store.clearFilters();
};

const refreshTable = async () => {
    await store.loadProjectsOverview(userStore.company_uuid);
    await store.fetchItems();
};

const changeViewMode = async (mode) => {
    await store.setViewMode(mode);
    projectFilter.value = store.projectFilter;
};

const onProjectCardSelect = async (uuid) => {
    projectFilter.value = uuid;
    await store.setProjectFilter(uuid);
};

const onProjectFilterChange = async () => {
    await store.setProjectFilter(projectFilter.value);
};

const onStatusTabChange = async (tab) => {
    await store.setStatusFilter(tab);
};

const goToCreateProject = () => router.push('/proyectos/crear');
const goToProject = (uuid) => router.push(`/proyectos/perfil/${uuid}`);
const goToProjectEdit = (uuid) => router.push(`/proyectos/editar/${uuid}`);

const openProjectReport = () => {
    showReportsDialog.value = true;
};

const onPageChange = async ({ page, first, rows }) => {
    store.pagination.itemsPerPage = rows;
    const targetPage = page !== undefined ? page : Math.floor(first / rows) + 1;
    await store.setPage(targetPage);
};

const recorridosCount = (data) => recorridosCountHook(data);
const diasHijos = (data) => diasHijosHook(data, store.statusFilter === 'cerradas');
const recorridosTexto = (data) => recorridosTextoHook(data);
const formatRango = (fecha) => formatRangoHook(fecha);
const isServicioCerrado = (data) => esCerrado(data) || data.control_status === 'CLOSED' || data.control_status === 'CERRADO';
const resumenDias = (data) => resumenDiasInfo(data);

const vehiculoSubtitulo = (data) => {
    const v = data.internalControl?.vehicle;
    if (v) {
        return [v.model, v.internal_number ? `Int. ${v.internal_number}` : null].filter(Boolean).join(' · ') || 'Vehículo asignado';
    }
    const sub = data.subcontractedControl;
    if (sub) {
        return sub.vehicleClass?.name || 'Vehículo subcontratado';
    }
    return '';
};

const conductorDocumento = (data) => {
    const cc = data.internalControl?.thirdParty?.document_number;
    return cc ? `CC ${cc}` : '';
};

const formatVigenciaProyecto = (proj) => {
    if (!proj.start_date && !proj.completion_date) return 'Vigencia activa';
    const f1 = proj.start_date ? formatRango(proj.start_date) : '';
    const f2 = proj.completion_date ? formatRango(proj.completion_date) : '';
    return f1 && f2 ? `${f1} al ${f2}` : 'Vigente';
};


const tipoLabel = (type) => {
    const tipos = {
        'DIRECTO_CON_LA_EMPRESA': 'Directo con la empresa',
        'SUBCONTRATADO': 'Subcontratado',
        'CON_VEHICULO_CONTRATADO': 'Vehículo contratado',
        'EXTERNO_PLATAFORMA': 'Externo de plataforma'
    };
    return tipos[type] || type || 'Desconocido';
};

const goToInternalControl = () => router.push('/planilla-de-control-de-prestacion-servicios/control-de-servicios');
const goToCreate = () => router.push('/planilla-de-control-de-prestacion-servicios/crear');
const goToEdit = (uuid) => router.push(`/planilla-de-control-de-prestacion-servicios/editar/${uuid}`);
const goToControl = (uuid) => router.push(`/planilla-de-control-de-prestacion-servicios/control-de-servicios?id=${uuid}`);

const downloadParentPdf = async (data) => {
    try {
        downloadingDaily.value = data.uuid;
        await store.downloadDailyPdf(data.uuid);
    } catch {
        toast('Error', 'No se pudo descargar el PDF.', 'error');
    } finally {
        downloadingDaily.value = null;
    }
};

const downloadDaily = async (uuid) => {
    try {
        downloadingDaily.value = uuid;
        await store.downloadDailyPdf(uuid);
    } catch {
        toast('Error', 'Error descargando PDF', 'error');
    } finally {
        downloadingDaily.value = null;
    }
};

const shareCoordinatorLink = async (uuid) => {
    try {
        sharingLink.value = uuid;
        await showLoadingModal({ title: 'Generando enlace...', text: 'Por favor espera...' });
        const result = await store.generateCoordinatorSignUrl(uuid);
        const url = result?.url;
        if (!url) throw new Error();
        await closeSwal();
        showSwalModal({
            title: '¡Enlace Generado!',
            html: `<p>Comparte este enlace con el coordinador:</p><div class="mt-2 p-2 bg-light border rounded text-break font-monospace" style="font-size: 12px;">${url}</div>`,
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: '<i class="fad fa-copy"></i> Copiar',
            cancelButtonText: 'Cerrar'
        }).then(r => {
            if (r.isConfirmed) navigator.clipboard.writeText(url).then(() => toast('Éxito', 'Enlace copiado', 'success'));
        });
    } catch {
        toast('Error', 'Error al generar enlace', 'error');
    } finally {
        sharingLink.value = null;
    }
};

const accionesDe = (data) => {
    const cerrado = isServicioCerrado(data);
    return [
        {
            key: 'control',
            label: 'Continuar servicio',
            icon: 'fad fa-steering-wheel',
            tone: 'success',
            inline: true,
            visible: !cerrado,
            onClick: () => goToControl(data.uuid)
        },
        {
            key: 'pdf',
            label: 'Descargar PDF',
            icon: 'far fa-file-pdf',
            tone: 'neutral',
            inline: true,
            visible: permissions.pdf,
            onClick: () => downloadParentPdf(data)
        },
        {
            key: 'firma',
            label: 'Firma Coordinador',
            icon: 'far fa-share-alt',
            tone: 'primary',
            inline: true,
            visible: canShareCoordinatorLink.value && !cerrado && !data.has_coordinator_signature,
            onClick: () => shareCoordinatorLink(data.uuid)
        },
        {
            key: 'editar',
            label: 'Editar',
            icon: 'far fa-pen',
            tone: 'warning',
            visible: permissions.edit && !cerrado,
            onClick: () => goToEdit(data.uuid)
        }
    ];
};

onMounted(async () => {
    isViewLoading.value = true;
    try {
        if (route.query.sort) {
            store.sortField = String(route.query.sort);
            store.sortOrder = route.query.order === 'desc' ? -1 : 1;
        }
        await store.loadFormOptions(userStore.company_uuid);
        if (store.catalogs.projects) store.projects = store.catalogs.projects;

        // Cargar proyectos con resúmenes para el switcher de tarjetas
        await store.loadProjectsOverview(userStore.company_uuid);
        if (store.viewMode === 'projects' && !store.projectFilter && store.projectsOverview.length > 0) {
            store.projectFilter = store.projectsOverview[0].uuid;
        }
        projectFilter.value = store.projectFilter;

        permissions.pdf = permissionsStore.can('service_delivery_control_sheets.history_pdf');
        permissions.create = permissionsStore.can('service_delivery_control_sheets.create');
        permissions.projectProfile = permissionsStore.can('projects.profile');
        permissions.projectEdit = permissionsStore.can('projects.update');
        permissions.view = permissionsStore.can('service_delivery_control_sheets.view');
        permissions.edit = permissionsStore.can('service_delivery_control_sheets.update');
        permissions.delete = permissionsStore.can('service_delivery_control_sheets.delete');

        await store.fetchItems();
    } finally {
        isViewLoading.value = false;
        setTimeout(() => initTooltips(), 200);
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
        transform: translateY(16px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

:deep(.p-menu-overlay) {
    z-index: 1100 !important;
}

.fs-10 {
    font-size: 0.65rem !important;
}

.fs-11 {
    font-size: 0.72rem !important;
}

.fs-12 {
    font-size: 0.8rem !important;
}

.btn-xs {
    padding: 0.2rem 0.5rem;
    font-size: 0.68rem;
    border-radius: 0.35rem;
}

.shadow-xs {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.expanded-days-container {
    background-color: #ffffff;
    transition: all 0.2s ease-in-out;
}

.btn-project-action {
    display: inline-flex;
    align-items: center;
    padding: 0.35rem 0.85rem;
    font-size: 0.74rem;
    font-weight: 600;
    border-radius: 0.4rem;
    letter-spacing: 0.01em;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 1px 3px rgba(44, 123, 229, 0.2);
}

.btn-project-action i {
    margin-right: 0.5rem;
    font-size: 0.85rem;
    opacity: 0.95;
    flex-shrink: 0;
}

.btn-project-action:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(44, 123, 229, 0.35) !important;
}

.btn-project-action:active {
    transform: translateY(0);
}
</style>
