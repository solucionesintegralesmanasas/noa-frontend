<template>
    <BasePageHeader :title="'Listado de ' + (pageTitle === 'Listado' ? 'Terceros' : pageTitle)"
        description="Gestión del módulo en el sistema." icon="fad fa-clipboard-list text-primary" :show-refresh="true"
        :show-create="canCreate" :show-bg="true" :loading="isViewLoading || store.loading" :compact="true"
        :breadcrumbs="[{ label: 'Terceros' }, { label: pageTitle === 'Listado' ? 'Todos' : pageTitle }]"
        @refresh="refreshTable" @create="goToCreate" />

    <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar">
            <div class="noa-search">
                <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                <input v-model="searchQuery" class="noa-search__input" type="search" placeholder="Buscar..."
                    aria-label="Buscar tercero" @input="debouncedSearch" />
                <button v-if="searchQuery" class="noa-search__clear" type="button" title="Limpiar búsqueda"
                    aria-label="Limpiar búsqueda" @click="clearSearch">
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
                                    <th v-for="w in ['28%', '18%', '18%', '14%', '12%', '10%']" :key="w"
                                        style="padding:12px 8px">
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
                                        <div class="d-flex justify-content-center gap-1">
                                            <div v-for="j in 3" :key="j" class="skeleton-icon"
                                                style="height:28px;width:28px;" />
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
                            :totalRecords="store.pagination.totalItems" :first="(store.pagination.currentPage - 1) *
                                store.pagination.itemsPerPage
                                " :loading="store.loading"
                            responsiveLayout="scroll" tableStyle="min-width: 60rem"
                            class="table table-sm mb-0 professional-table noa-table-fixed"
                            :sortField="sortField" :sortOrder="sortOrdenPrimeVue" removableSort
                            emptyMessage="No se encontraron registros" @sort="onSort">
                            <Column field="document_number" header="Documento" sortable style="width: 11%;">
                                <template #body="{ data }">
                                    <span class="noa-cell-strong">{{ data.document_number || '-' }}</span>
                                </template>
                            </Column>

                            <Column field="trade_name" header="Nombre/Razón Social" sortable style="width: 27%;">
                                <template #body="{ data }">
                                    <span class="text-dark">
                                        {{ data.full_name || data.trade_name || data.company_name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || '-' }}
                                    </span>
                                </template>
                            </Column>

                            <Column field="email" header="Email" sortable style="width: 23%;">
                                <template #body="{ data }">
                                    <span class="text-dark">{{ data.email || '-' }}</span>
                                </template>
                            </Column>

                            <Column field="branch.name" header="Sucursal" sortable style="width: 13%;">
                                <template #body="{ data }">
                                    <span class="text-dark">{{ data.branch?.name || '—' }}</span>
                                </template>
                            </Column>

                            <Column field="is_active" header="Estado" sortable style="width: 12%;">
                                <template #body="{ data }">
                                    <span class="noa-status" :class="data.is_active ? 'noa-status--success' : 'noa-status--muted'">
                                        {{ data.is_active ? "Activo" : "Inactivo" }}
                                    </span>
                                </template>
                            </Column>

                            <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 14%;">
                                <template #body="{ data }">
                                    <RowActions :actions="accionesDe(data)" :row-label="nombreDe(data)" />
                                </template>
                            </Column>
                            <!-- Loading state -->
                            <template #loading>
                                <NoaTableSpinner message="Cargando terceros..." />
                            </template>
                        </DataTable>
                    </div>
                    <ListPagination :page="store.pagination.currentPage" :per-page="store.pagination.itemsPerPage"
                        :total="store.pagination.totalItems" @change="onPageChange" />
                </div>
            </div>


    <!-- Modal Historial de Licencias -->
    <div class="modal fade" id="driverLicensesListModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down">
            <div class="modal-content border-0 shadow-lg">
                <div class="modal-header border-bottom-0"
                    style="background: linear-gradient(135deg,#0dcaf0 0%,#0a8fa6 100%);">
                    <h5 class="modal-title fw-bold text-white">
                        <i class="fad fa-id-card me-2" />Historial de Licencias del Conductor
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"
                        aria-label="Cerrar" />
                </div>
                <div class="modal-body p-0">
                    <!-- Formulario nueva licencia / edición -->
                    <div v-if="showNewLicenseForm || editingLicense" class="p-4 border-bottom"
                        :class="editingLicense ? 'bg-warning bg-opacity-10' : 'bg-light'">
                        <div class="d-flex align-items-center mb-3">
                            <h6 class="mb-0" :class="editingLicense ? 'text-warning' : 'text-primary'">
                                <i class="fas me-1" :class="editingLicense ? 'fa-edit' : 'fa-plus-circle'" />
                                {{ editingLicense ? 'Editando Licencia' : 'Registrar Nueva Licencia' }}
                            </h6>
                            <button v-if="editingLicense" type="button" class="btn btn-sm btn-outline-secondary ms-3"
                                @click="cancelEditLicense">
                                <i class="fas fa-times me-1" />Cancelar edición
                            </button>
                        </div>
                        <form @submit.prevent="editingLicense ? submitEditLicense() : submitNewLicense()">
                            <div class="row gx-2 gy-2">
                                <div class="col-12 col-md-3">
                                    <label class="form-label mb-1 small text-muted">Número de Licencia *</label>
                                    <input v-model="newLicense.number" class="form-control form-control-sm" required
                                        placeholder="Ej: 123456789" />
                                </div>
                                <div class="col-12 col-md-2">
                                    <label class="form-label mb-1 small text-muted">Categoría *</label>
                                    <select v-model="newLicense.category" class="form-select form-select-sm w-100"
                                        required>
                                        <option value="" disabled>Selec...</option>
                                        <option value="A1">A1</option>
                                        <option value="A2">A2</option>
                                        <option value="B1">B1</option>
                                        <option value="B2">B2</option>
                                        <option value="B3">B3</option>
                                        <option value="C1">C1</option>
                                        <option value="C2">C2</option>
                                        <option value="C3">C3</option>
                                    </select>
                                </div>
                                <div class="col-12 col-md-2">
                                    <label class="form-label mb-1 small text-muted">Estado *</label>
                                    <select v-model="newLicense.status" class="form-select form-select-sm w-100"
                                        required>
                                        <option value="ACTIVA">ACTIVA</option>
                                        <option value="SUSPENDIDA">SUSPENDIDA</option>
                                        <option value="VENCIDA">VENCIDA</option>
                                        <option value="CANCELADA">CANCELADA</option>
                                    </select>
                                </div>
                                <div class="col-12 col-md-2">
                                    <label class="form-label mb-1 small text-muted" for="f-lic-issue">Fecha Expedición *</label>
                                    <DateInput :id="'f-lic-issue'" v-model="newLicense.issue_date"
                                        class="form-control form-control-sm" required placeholder="YYYY-MM-DD" />
                                </div>
                                <div class="col-12 col-md-2">
                                    <label class="form-label mb-1 small text-muted" for="f-lic-expiry">Fecha Vencimiento *</label>
                                    <DateInput :id="'f-lic-expiry'" v-model="newLicense.expiration_date"
                                        class="form-control form-control-sm" required placeholder="YYYY-MM-DD" />
                                </div>
                                <div class="col-12 col-md-1 d-flex align-items-end">
                                    <button type="submit" class="btn btn-sm w-100" :disabled="isSubmittingLicense"
                                        :class="editingLicense ? 'btn-warning' : 'btn-primary'" title="Guardar">
                                        <i class="fas"
                                            :class="isSubmittingLicense ? 'fa-spinner fa-spin' : 'fa-save'" />
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    <!-- Banner: licencia vigente (formulario oculto) -->
                    <div v-if="!showNewLicenseForm && !editingLicense && !isLoadingLicenses && driverLicenses.length > 0"
                        class="px-4 py-3 border-bottom d-flex align-items-center gap-2"
                        style="background: rgba(13,202,240,0.06);">
                        <i class="fas fa-check-circle text-info fa-lg" />
                        <div>
                            <span class="fw-semibold text-info">Licencia vigente</span>
                            <span class="text-muted small ms-2">La licencia más reciente está <strong>Activa</strong>.
                                No se
                                requiere registrar una nueva.</span>
                        </div>
                    </div>

                    <!-- Lista de licencias -->
                    <div v-if="isLoadingLicenses" class="p-5 text-center">
                        <div class="spinner-border text-info" role="status" />
                        <p class="mt-2 text-muted">Cargando licencias...</p>
                    </div>
                    <div v-else-if="driverLicenses.length === 0" class="p-5 text-center">
                        <i class="fad fa-id-card fa-3x text-muted mb-3" />
                        <h6 class="text-muted">No hay licencias registradas para este conductor.</h6>
                    </div>
                    <div v-else class="table-responsive">
                        <table class="table table-hover table-sm mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Número</th>
                                    <th>Categoría</th>
                                    <th>Expedición</th>
                                    <th>Vencimiento</th>
                                    <th>Estado</th>
                                    <th class="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="lic in driverLicenses" :key="lic.uuid"
                                    :class="{ 'table-warning': editingLicense && editingLicense.uuid === lic.uuid }">
                                    <td class="fw-medium">{{ lic.number }}</td>
                                    <td><span class="badge bg-secondary">{{ lic.category }}</span></td>
                                    <td>{{ lic.issue_date ? lic.issue_date.split(/[T ]/)[0] : '-' }}</td>
                                    <td>{{ lic.expiration_date ? lic.expiration_date.split(/[T ]/)[0] : '-' }}</td>
                                    <td>
                                        <span class="badge" :class="{
                                            'bg-success': lic.status === 'ACTIVA',
                                            'bg-warning text-dark': lic.status === 'SUSPENDIDA',
                                            'bg-danger': lic.status === 'VENCIDA',
                                            'bg-dark': lic.status === 'CANCELADA'
                                        }">{{ lic.status }}</span>
                                    </td>
                                    <td class="text-center">
                                        <!-- Botón editar SOLO para licencias ACTIVAS -->
                                        <button v-if="lic.status === 'ACTIVA'" class="btn btn-sm btn-falcon-default"
                                            title="Editar licencia" @click="startEditLicense(lic)">
                                            <i class="fad fa-edit text-warning" style="font-size:13px;" />
                                        </button>
                                        <span v-else class="text-muted small">—</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer bg-light border-top-0">
                    <button type="button" class="btn btn-secondary rounded-pill" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Seguridad Social -->
    <div class="modal fade" id="socialSecurityModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down">
            <div class="modal-content border-0 shadow-lg">
                <div class="modal-header border-bottom-0"
                    style="background: linear-gradient(135deg,#198754 0%,#0f5132 100%);">
                    <h5 class="modal-title fw-bold text-white">
                        <i class="fad fa-shield-alt me-2" />Seguridad Social (PILA)
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"
                        aria-label="Cerrar" />
                </div>
                <div class="modal-body p-0">
                    <!-- Botón para mostrar formulario -->
                    <div v-if="!showForm && !editingContribution" class="p-3 border-bottom text-center">
                        <button type="button" class="btn btn-success btn-sm rounded-pill px-4"
                            @click="showForm = true">
                            <i class="fas fa-plus-circle me-1" />Registrar nuevo aporte
                        </button>
                    </div>
                    <!-- Formulario nuevo aporte / edición -->
                    <div v-if="showForm || editingContribution" class="p-4 border-bottom"
                        :class="editingContribution ? 'bg-warning bg-opacity-10' : 'bg-light'">
                        <div class="d-flex align-items-center mb-3">
                            <h6 class="mb-0" :class="editingContribution ? 'text-warning' : 'text-success'">
                                <i class="fas me-1" :class="editingContribution ? 'fa-edit' : 'fa-plus-circle'" />
                                {{ editingContribution ? 'Editando Aporte' : 'Registrar Nuevo Aporte' }}
                            </h6>
                            <button v-if="editingContribution" type="button"
                                class="btn btn-sm btn-outline-secondary ms-3" @click="cancelEditContribution">
                                <i class="fas fa-times me-1" />Cancelar edición
                            </button>
                            <button v-else-if="showForm" type="button"
                                class="btn btn-sm btn-outline-secondary ms-3" @click="showForm = false">
                                <i class="fas fa-times me-1" />Cerrar
                            </button>
                        </div>
                        <form @submit.prevent="editingContribution ? submitEditContribution() : submitSocialSecurity()">
                            <div class="row gx-2 gy-2">
                                <div class="col-12 col-md-2">
                                    <label class="form-label mb-1 small text-muted" for="f-billing-period">Periodo Facturación *</label>
                                    <DateInput :id="'f-billing-period'" v-model="newContribution.billing_period"
                                        class="form-control form-control-sm" required placeholder="YYYY-MM" />
                                </div>
                                <div class="col-12 col-md-2">
                                    <label class="form-label mb-1 small text-muted">PIN PILA *</label>
                                    <input v-model="newContribution.pila_pin" class="form-control form-control-sm"
                                        required placeholder="Ej: 123456" maxlength="50" />
                                </div>
                                <div class="col-12 col-md-2">
                                    <label class="form-label mb-1 small text-muted">Tipo Aporte *</label>
                                    <select v-model="newContribution.contribution_type" class="form-select form-select-sm w-100"
                                        required>
                                        <option value="E">E – Empleado</option>
                                        <option value="Y">Y – Independiente</option>
                                        <option value="I">I – Integral</option>
                                        <option value="S">S – Sin Ingresos</option>
                                    </select>
                                </div>
                                <div class="col-12 col-md-2">
                                    <label class="form-label mb-1 small text-muted">IBC ($)</label>
                                    <input type="number" v-model="newContribution.ibc_amount"
                                        class="form-control form-control-sm" placeholder="0.00" min="0" step="0.01" />
                                </div>
                                <div class="col-12 col-md-2">
                                    <label class="form-label mb-1 small text-muted" for="f-pay-date">Fecha Pago</label>
                                    <DateInput :id="'f-pay-date'" v-model="newContribution.payment_date"
                                        class="form-control form-control-sm" placeholder="YYYY-MM-DD" />
                                </div>
                                <div class="col-12 col-md-2">
                                    <label class="form-label mb-1 small text-muted">Estado *</label>
                                    <select v-model="newContribution.status" class="form-select form-select-sm w-100"
                                        required>
                                        <option value="">Auto (según fecha)</option>
                                        <option value="PAGADO Y FINALIZADO">Pagado y Finalizado</option>
                                        <option value="PAGADO Y EN CURSO">Pagado y En Curso</option>
                                        <option value="EN MORA">En Mora</option>
                                    </select>
                                </div>
                                <!-- Entidades y Fechas de Afiliación -->
                                <div class="col-12 col-md-3 mt-2">
                                    <label class="form-label mb-1 small text-muted">EPS</label>
                                    <input type="text" autocomplete="off" v-model="newContribution.eps_name"
                                        class="form-control form-control-sm" placeholder="Nombre de la EPS"
                                        maxlength="100" />
                                </div>
                                <div class="col-12 col-md-3 mt-2">
                                    <label class="form-label mb-1 small text-muted" for="f-eps-date">Fecha Afiliación EPS</label>
                                    <DateInput :id="'f-eps-date'" v-model="newContribution.eps_affiliation_date"
                                        class="form-control form-control-sm" placeholder="YYYY-MM-DD" />
                                </div>
                                <div class="col-12 col-md-3 mt-2">
                                    <label class="form-label mb-1 small text-muted">Fondo de Pensión</label>
                                    <input type="text" autocomplete="off" v-model="newContribution.pension_name"
                                        class="form-control form-control-sm" placeholder="Fondo de Pensión"
                                        maxlength="100" />
                                </div>
                                <div class="col-12 col-md-3 mt-2">
                                    <label class="form-label mb-1 small text-muted" for="f-pension-date">Fecha Afiliación Pensión</label>
                                    <DateInput :id="'f-pension-date'" v-model="newContribution.pension_affiliation_date"
                                        class="form-control form-control-sm" placeholder="YYYY-MM-DD" />
                                </div>
                                <div class="col-12 col-md-3 mt-2">
                                    <label class="form-label mb-1 small text-muted">ARL (Riesgos Laborales)</label>
                                    <input type="text" autocomplete="off" v-model="newContribution.risk_labor_name"
                                        class="form-control form-control-sm" placeholder="ARL" maxlength="100" />
                                </div>
                                <div class="col-12 col-md-3 mt-2">
                                    <label class="form-label mb-1 small text-muted" for="f-arl-date">Fecha Afiliación ARL</label>
                                    <DateInput :id="'f-arl-date'" v-model="newContribution.risk_labor_affiliation_date"
                                        class="form-control form-control-sm" placeholder="YYYY-MM-DD" />
                                </div>
                                <div class="col-12 col-md-3 mt-2">
                                    <label class="form-label mb-1 small text-muted">Caja de Compensación</label>
                                    <input type="text" autocomplete="off" v-model="newContribution.compensation_fund_name"
                                        class="form-control form-control-sm" placeholder="Caja de compensación"
                                        maxlength="100" />
                                </div>
                                <div class="col-12 col-md-3 mt-2">
                                    <label class="form-label mb-1 small text-muted" for="f-caja-date">Fecha Afiliación Caja</label>
                                    <DateInput :id="'f-caja-date'" v-model="newContribution.compensation_fund_affiliation_date"
                                        class="form-control form-control-sm" placeholder="YYYY-MM-DD" />
                                </div>
                                <!-- Checkboxes coberturas -->
                                <div class="col-12">
                                    <div class="d-flex flex-wrap gap-3">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="ss_health"
                                                v-model="newContribution.health_paid" />
                                            <label class="form-check-label small" for="ss_health">Salud</label>
                                        </div>
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="ss_pension"
                                                v-model="newContribution.pension_paid" />
                                            <label class="form-check-label small" for="ss_pension">Pensión</label>
                                        </div>
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="ss_risk"
                                                v-model="newContribution.risk_labor_paid" />
                                            <label class="form-check-label small" for="ss_risk">Riesgos Lab.</label>
                                        </div>
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="ss_fund"
                                                v-model="newContribution.compensation_fund_paid" />
                                            <label class="form-check-label small" for="ss_fund">Fondo Comp.</label>
                                        </div>
                                        <div class="ms-auto">
                                            <button type="submit" class="btn btn-sm px-4"
                                                :disabled="isSubmittingContribution"
                                                :class="editingContribution ? 'btn-warning' : 'btn-success'">
                                                <i class="fas"
                                                    :class="isSubmittingContribution ? 'fa-spinner fa-spin' : (editingContribution ? 'fa-save' : 'fa-save')" />
                                                {{ isSubmittingContribution ? 'Guardando...' : (editingContribution ?
                                                    'Actualizar' : 'Guardar') }}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    <!-- Banner: aportes al día -->
                    <div v-if="socialSecurityContributions.some(c => c.status === 'PAGADO Y EN CURSO')"
                        class="px-4 py-3 border-bottom d-flex align-items-center gap-2"
                        style="background: rgba(25,135,84,0.06);">
                        <i class="fas fa-check-circle text-success fa-lg" />
                        <div>
                            <span class="fw-semibold text-success">Seguridad social al día</span>
                            <span class="text-muted small ms-2">El mes actual tiene un aporte <strong>Pagado</strong>.</span>
                        </div>
                    </div>

                    <!-- Lista de aportes -->
                    <div v-if="isLoadingContributions" class="p-5 text-center">
                        <div class="spinner-border text-success" role="status" />
                        <p class="mt-2 text-muted">Cargando aportes...</p>
                    </div>
                    <div v-else-if="socialSecurityContributions.length === 0" class="p-5 text-center">
                        <i class="fad fa-shield-alt fa-3x text-muted mb-3" />
                        <h6 class="text-muted">No hay aportes de seguridad social registrados.</h6>
                    </div>
                    <div v-else class="table-responsive">
                        <table class="table table-hover table-sm mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Periodo</th>
                                    <th>PIN PILA</th>
                                    <th>Tipo</th>
                                    <th>IBC</th>
                                    <th class="text-center">Salud</th>
                                    <th class="text-center">Pensión</th>
                                    <th class="text-center">Riesgos</th>
                                    <th class="text-center">F. Comp.</th>
                                    <th>F. Pago</th>
                                    <th>Estado</th>
                                    <th class="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="c in socialSecurityContributions" :key="c.uuid"
                                    :class="{ 'table-warning': editingContribution && editingContribution.uuid === c.uuid }">
                                    <td class="fw-medium">{{ c.billing_period ? c.billing_period.split(/[T ]/)[0] : '-'
                                    }}
                                    </td>
                                    <td>{{ c.pila_pin }}</td>
                                    <td><span class="badge bg-secondary">{{ c.contribution_type }}</span></td>
                                    <td>{{ c.ibc_amount ? '$' + Number(c.ibc_amount).toLocaleString('es-CO') : '-' }}
                                    </td>
                                    <td class="text-center"><i :title="`${c.eps_name || 'Sin especificar EPS'}${c.eps_affiliation_date ? ' (Afiliación: ' + c.eps_affiliation_date.split(/[T ]/)[0] + ')' : ''}`"
                                            :class="c.health_paid ? 'fas fa-check-circle text-success' : 'fas fa-times-circle text-danger'" />
                                    </td>
                                    <td class="text-center"><i :title="`${c.pension_name || 'Sin especificar Pensión'}${c.pension_affiliation_date ? ' (Afiliación: ' + c.pension_affiliation_date.split(/[T ]/)[0] + ')' : ''}`"
                                            :class="c.pension_paid ? 'fas fa-check-circle text-success' : 'fas fa-times-circle text-danger'" />
                                    </td>
                                    <td class="text-center"><i :title="`${c.risk_labor_name || 'Sin especificar ARL'}${c.risk_labor_affiliation_date ? ' (Afiliación: ' + c.risk_labor_affiliation_date.split(/[T ]/)[0] + ')' : ''}`"
                                            :class="c.risk_labor_paid ? 'fas fa-check-circle text-success' : 'fas fa-times-circle text-danger'" />
                                    </td>
                                    <td class="text-center"><i
                                            :title="`${c.compensation_fund_name || 'Sin especificar Caja'}${c.compensation_fund_affiliation_date ? ' (Afiliación: ' + c.compensation_fund_affiliation_date.split(/[T ]/)[0] + ')' : ''}`"
                                            :class="c.compensation_fund_paid ? 'fas fa-check-circle text-success' : 'fas fa-times-circle text-danger'" />
                                    </td>
                                    <td>{{ c.payment_date ? c.payment_date.split(/[T ]/)[0] : '-' }}</td>
                                    <td>
                                        <span class="badge" :class="{
                                            'bg-success': c.status === 'PAGADO Y FINALIZADO',
                                            'bg-info text-dark': c.status === 'PAGADO Y EN CURSO',
                                            'bg-danger': c.status === 'EN MORA'
                                        }">{{ c.status || 'Pendiente' }}</span>
                                    </td>
                                    <td class="text-center">
                                        <button class="btn btn-sm btn-falcon-default" title="Editar"
                                            @click="startEditContribution(c)">
                                            <i class="fad fa-edit text-warning" style="font-size:13px;" />
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer bg-light border-top-0">
                    <button type="button" class="btn btn-secondary rounded-pill" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useThirdPartiesStore, tieneFilaLicenciaVigente } from '../store/thirdParties.store.js';
import ThirdPartiesService from '../services/thirdParties.service.js';
import { usePermissionsStore, useUserStore } from '@store';
import { useTable } from '@/hooks/useTable.js';
import { useTableActions } from '@/hooks/useTableActions.js';
import { toast } from '@/utils/toast.js';
import { logger } from '@/utils/logger.js';
import { mensajeErrorValidacion } from '../utils/mensajeError.js';
import Swal from 'sweetalert2';
import BasePageHeader from '@/components/BasePageHeader.vue';
import DateInput from '@/components/form/DateInput.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import RowActions from '@/components/RowActions.vue';
import ListPagination from '@/components/ListPagination.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { useServerSort } from '@/hooks/useServerSort.js';

const route = useRoute();
const router = useRouter();
const store = useThirdPartiesStore();
const permissionsStore = usePermissionsStore();
const userStore = useUserStore();

const pageTitle = computed(() => {
    return route.meta.title || 'Terceros';
});

const isViewLoading = ref(true);
const searchQuery = ref('');

const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(searchQuery.value));
const { confirmDelete, initTooltips, destroyTooltips } = useTableActions(store, router);
const { sortField, sortOrdenPrimeVue, onSort, restore } = useServerSort({
    onChange: ({ field, order }) => store.setSort(field, order),
});

const can = (action) => permissionsStore.can(action);

const canCreate = computed(() => {
    const path = route.path;
    if (path.includes('/clientes')) return can('customer.create');
    if (path.includes('/proveedores')) return can('supplier.create');
    if (path.includes('/empleados')) return can('employee.create');
    if (path.includes('/afiliados')) return can('affiliate.create');
    if (path.includes('/conductores')) return can('driver.create');
    return can('third_parties.create');
});

const canView = computed(() => {
    const path = route.path;
    if (path.includes('/clientes')) return can('customer.profile');
    if (path.includes('/proveedores')) return can('supplier.profile');
    if (path.includes('/empleados')) return can('employee.profile');
    if (path.includes('/afiliados')) return can('affiliate.profile');
    if (path.includes('/conductores')) return can('driver.profile');
    return can('third_parties.profile');
});

const canUpdate = computed(() => {
    const path = route.path;
    if (path.includes('/clientes')) return can('customer.update');
    if (path.includes('/proveedores')) return can('supplier.update');
    if (path.includes('/empleados')) return can('employee.update');
    if (path.includes('/afiliados')) return can('affiliate.update');
    if (path.includes('/conductores')) return can('driver.update');
    return can('third_parties.update');
});

const canDelete = computed(() => {
    const path = route.path;
    if (path.includes('/clientes')) return can('customer.delete');
    if (path.includes('/proveedores')) return can('supplier.delete');
    if (path.includes('/empleados')) return can('employee.delete');
    if (path.includes('/afiliados')) return can('affiliate.delete');
    if (path.includes('/conductores')) return can('driver.delete');
    return can('third_parties.delete');
});

const clearSearch = async () => { searchQuery.value = ''; await store.clearFilters(); };
const refreshTable = () => store.fetchItems();
const onPageChange = async (event) => {
    const { first, rows } = event;
    if (rows !== store.pagination.itemsPerPage) {
        store.pagination.itemsPerPage = rows;
    }
    await store.setPage(Math.floor(first / rows) + 1);
};

const goToCreate = () => {
    const path = route.path;
    if (path.includes('/clientes')) return router.push('/terceros/cliente/crear');
    if (path.includes('/proveedores')) return router.push('/terceros/proveedor/crear');
    if (path.includes('/empleados')) return router.push('/terceros/empleado/crear');
    if (path.includes('/afiliados')) return router.push('/terceros/afiliado/crear');
    if (path.includes('/conductores')) return router.push('/terceros/conductor/crear');
    return router.push('/terceros/crear');
};
const goToEdit = (uuid) => {
    const path = route.path;
    if (path.includes('/clientes')) return router.push(`/terceros/cliente/editar/${uuid}`);
    if (path.includes('/proveedores')) return router.push(`/terceros/proveedor/editar/${uuid}`);
    if (path.includes('/empleados')) return router.push(`/terceros/empleado/editar/${uuid}`);
    if (path.includes('/afiliados')) return router.push(`/terceros/afiliado/editar/${uuid}`);
    if (path.includes('/conductores')) return router.push(`/terceros/conductor/editar/${uuid}`);
    return router.push(`/terceros/editar/${uuid}`);
};

const goToDetail = (uuid) => {
    const path = route.path;
    if (path.includes('/clientes')) return router.push(`/terceros/cliente/perfil/${uuid}`);
    if (path.includes('/proveedores')) return router.push(`/terceros/proveedor/perfil/${uuid}`);
    if (path.includes('/empleados')) return router.push(`/terceros/empleado/perfil/${uuid}`);
    if (path.includes('/afiliados')) return router.push(`/terceros/afiliado/perfil/${uuid}`);
    if (path.includes('/conductores')) return router.push(`/terceros/conductor/perfil/${uuid}`);
    return router.push(`/terceros/perfil/${uuid}`);
};

const goToTechnicalSheet = async (uuid, companyUuid) => {
    try {
        isViewLoading.value = true;
        const finalCompanyUuid = companyUuid || userStore?.company_uuid || store?.items?.[0]?.company_uuid;
        await ThirdPartiesService.downloadTechnicalSheet(uuid, finalCompanyUuid);
    } catch (error) {
        console.error('Error generando PDF', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo generar el PDF de la ficha técnica.'
        });
    } finally {
        isViewLoading.value = false;
    }
};

const handleDelete = (item) => confirmDelete(item, {
    title: '¿Eliminar registro?',
    nameField: 'trade_name',
});

const determineTypeFromRoute = () => {
    const path = route.path;
    if (path.includes('/clientes')) return 'is_customer';
    if (path.includes('/proveedores')) return 'is_supplier';
    if (path.includes('/empleados')) return 'is_employee';
    if (path.includes('/afiliados')) return 'is_affiliate';
    if (path.includes('/conductores')) return 'is_driver';
    if (path.includes('/otros')) return 'is_others';
    return null;
};

const driverLicenses = ref([]);
const isLoadingLicenses = ref(false);
const isSubmittingLicense = ref(false);
const currentDriverUuid = ref(null);
const editingLicense = ref(null); // licencia en modo edición
const newLicense = ref({
    company_uuid: null,
    third_party_uuid: null,
    number: '',
    category: '',
    issue_date: '',
    expiration_date: '',
    status: 'ACTIVA'
});

/**
 * Muestra el formulario SOLO cuando no hay licencias
 * o cuando NINGUNA licencia está ACTIVA (todas vencidas / suspendidas / canceladas).
 * Si existe al menos una ACTIVA el formulario permanece oculto.
 */
const showNewLicenseForm = computed(() => {
    if (driverLicenses.value.length === 0) return true;
    const hasActive = driverLicenses.value.some(l => l.status === 'ACTIVA');
    return !hasActive;
});

// ── Seguridad Social ──────────────────────────────────────────
const socialSecurityContributions = ref([]);
const isLoadingContributions = ref(false);
const isSubmittingContribution = ref(false);
const currentSocialSecurityUuid = ref(null);
const showForm = ref(false); // controla visibilidad del form de nuevo aporte
const editingContribution = ref(null); // registro en modo edición
const newContribution = ref({
    third_party_uuid: null,
    billing_period: '',
    pila_pin: '',
    contribution_type: 'E',
    ibc_amount: null,
    health_paid: true,
    pension_paid: true,
    risk_labor_paid: true,
    compensation_fund_paid: true,
    eps_name: '',
    eps_affiliation_date: '',
    pension_name: '',
    pension_affiliation_date: '',
    risk_labor_name: '',
    risk_labor_affiliation_date: '',
    compensation_fund_name: '',
    compensation_fund_affiliation_date: '',
    payment_date: '',
    status: '',
});

/**
 * Muestra el formulario de registro cuando no hay aportes
 * o cuando el último aporte no es del mes actual.
 */
const loadLicensesForModal = async (uuid) => {
    isLoadingLicenses.value = true;
    try {
        driverLicenses.value = await store.fetchDriverLicenses(uuid);
        store.syncDriverLicenses(uuid, driverLicenses.value);
    } catch (err) {
        console.error('Error cargando licencias', err);
    } finally {
        isLoadingLicenses.value = false;
    }
};

/**
 * Etiqueta accesible del botón de licencias, incluyendo el estado
 * para que el lector de pantalla anuncie si la licencia está vigente.
 * @param {Object} data - Fila del conductor.
 * @returns {string}
 */
/** Nombre visible del tercero para los aria-label de las acciones. */
const nombreDe = (data) => data.full_name || data.trade_name || data.company_name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'tercero';

const esConductor = (data) => store.typeFilter === 'is_driver' || data.is_driver || (data.roles && data.roles.includes('is_driver'));
const esConductorOEmpleado = (data) => store.typeFilter === 'is_driver' || store.typeFilter === 'is_employee' || data.is_driver || data.is_employee;

/**
 * Acciones de la fila. Ver y Editar quedan en línea; las específicas de conductor/empleado
 * pasan al menú "⋮" y Eliminar va al final, separado.
 */
const accionesDe = (data) => {
    const sinLicencias = !data.driver_licenses || data.driver_licenses.length === 0;
    const licenciaVigente = tieneFilaLicenciaVigente(data);
    return [
        { key: 'ver', label: 'Ver detalle', icon: 'far fa-eye', tone: 'primary', inline: true, visible: canView.value, onClick: () => goToDetail(data.uuid) },
        { key: 'editar', label: 'Editar', icon: 'far fa-pen', tone: 'warning', inline: true, visible: canUpdate.value, onClick: () => goToEdit(data.uuid) },
        {
            key: 'licencias',
            label: 'Gestión de licencias',
            ariaLabel: etiquetaBotonLicencias(data),
            icon: licenciaVigente || sinLicencias ? 'far fa-id-card' : 'far fa-exclamation-triangle',
            tone: licenciaVigente ? 'success' : sinLicencias ? 'neutral' : 'danger',
            description: licenciaVigente ? 'Licencia activa y vigente' : sinLicencias ? 'Sin licencias registradas' : 'Licencia vencida o inactiva',
            visible: !!esConductor(data),
            onClick: () => openLicensesModal(data.uuid, data.company_uuid),
        },
        { key: 'seguridad-social', label: 'Seguridad social', icon: 'far fa-shield-check', tone: 'success', visible: !!esConductorOEmpleado(data), onClick: () => openSocialSecurityModal(data.uuid, data.company_uuid) },
        { key: 'ficha', label: 'Ver ficha técnica', icon: 'far fa-file-pdf', tone: 'neutral', visible: !!esConductor(data), onClick: () => goToTechnicalSheet(data.uuid, data.company_uuid) },
        { key: 'proyectos', label: 'Proyectos', icon: 'far fa-briefcase', tone: 'primary', visible: !!esConductor(data), onClick: () => goToProjects(data) },
        { key: 'eliminar', label: 'Eliminar', icon: 'far fa-trash-alt', tone: 'danger', visible: canDelete.value, onClick: () => handleDelete(data) },
    ];
};

const etiquetaBotonLicencias = (data) => {
    const nombre = data.full_name || data.trade_name || 'conductor';
    if (tieneFilaLicenciaVigente(data)) return `Gestionar licencias de ${nombre}: licencia activa y vigente`;
    if (Array.isArray(data.driver_licenses) && data.driver_licenses.length > 0) {
        return `Gestionar licencias de ${nombre}: licencia vencida o inactiva`;
    }
    return `Gestionar licencias de ${nombre}: sin licencias registradas`;
};

const openLicensesModal = async (uuid, companyUuid) => {
    currentDriverUuid.value = uuid;
    const resolvedCompanyUuid = companyUuid 
        || store.items?.find(i => i.uuid === uuid)?.company_uuid 
        || userStore?.company_uuid 
        || store.items[0]?.company_uuid;

    newLicense.value = {
        company_uuid: resolvedCompanyUuid,
        third_party_uuid: uuid,
        number: '',
        category: '',
        issue_date: '',
        expiration_date: '',
        status: 'ACTIVA'
    };

    const modalEl = document.getElementById('driverLicensesListModal');
    if (window.bootstrap && window.bootstrap.Modal) {
        window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }

    await loadLicensesForModal(uuid);
};

const submitNewLicense = async () => {
    if (!newLicense.value.company_uuid) {
        newLicense.value.company_uuid = store.items?.find(i => i.uuid === currentDriverUuid.value)?.company_uuid 
            || userStore?.company_uuid 
            || store.items[0]?.company_uuid;
    }
    isSubmittingLicense.value = true;
    try {
        await store.createDriverLicense(newLicense.value);
        await loadLicensesForModal(currentDriverUuid.value);
    } catch (err) {
        logger.error('Error guardando licencia', err?.message);
        await toast('No se pudo guardar la licencia', mensajeErrorValidacion(err), 'error');
    } finally {
        isSubmittingLicense.value = false;
    }
};

/** Carga una licencia existente en el formulario para editarla */
const startEditLicense = (license) => {
    editingLicense.value = license;
    newLicense.value = {
        company_uuid: license.company_uuid,
        third_party_uuid: license.third_party_uuid,
        number: license.number,
        category: license.category,
        issue_date: license.issue_date ? license.issue_date.split(/[T ]/)[0] : '',
        expiration_date: license.expiration_date ? license.expiration_date.split(/[T ]/)[0] : '',
        status: license.status,
    };
};

/** Cancela el modo edición y resetea el formulario */
const cancelEditLicense = () => {
    editingLicense.value = null;
    newLicense.value = {
        company_uuid: null,
        third_party_uuid: currentDriverUuid.value,
        number: '',
        category: '',
        issue_date: '',
        expiration_date: '',
        status: 'ACTIVA',
    };
};

/** Guarda los cambios de la licencia en edición */
const submitEditLicense = async () => {
    isSubmittingLicense.value = true;
    try {
        await store.updateDriverLicense(editingLicense.value.uuid, { ...newLicense.value });
        await loadLicensesForModal(currentDriverUuid.value);
        cancelEditLicense();
    } catch (err) {
        logger.error('Error actualizando licencia', err?.message);
        await toast('No se pudo actualizar la licencia', mensajeErrorValidacion(err), 'error');
    } finally {
        isSubmittingLicense.value = false;
    }
};

const loadContributionsForModal = async (uuid) => {
    isLoadingContributions.value = true;
    try {
        socialSecurityContributions.value = await store.fetchSocialSecurityContributions(uuid);
    } catch (err) {
        console.error('Error cargando aportes de seguridad social', err);
    } finally {
        isLoadingContributions.value = false;
    }
};

const openSocialSecurityModal = async (uuid, companyUuid) => {
    currentSocialSecurityUuid.value = uuid;
    showForm.value = false;
    editingContribution.value = null;
    newContribution.value = {
        third_party_uuid: uuid,
        billing_period: '',
        pila_pin: '',
        contribution_type: 'E',
        ibc_amount: null,
        health_paid: true,
        pension_paid: true,
        risk_labor_paid: true,
        compensation_fund_paid: true,
        eps_name: '',
        eps_affiliation_date: '',
        pension_name: '',
        pension_affiliation_date: '',
        risk_labor_name: '',
        risk_labor_affiliation_date: '',
        compensation_fund_name: '',
        compensation_fund_affiliation_date: '',
        payment_date: '',
        status: '',
    };

    const modalEl = document.getElementById('socialSecurityModal');
    if (window.bootstrap && window.bootstrap.Modal) {
        window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }

    await loadContributionsForModal(uuid);
    if (socialSecurityContributions.value.length === 0) {
        showForm.value = true;
    }
};

const submitSocialSecurity = async () => {
    isSubmittingContribution.value = true;
    try {
        const payload = { ...newContribution.value };
        if (!payload.payment_date) payload.payment_date = null;
        if (!payload.ibc_amount) payload.ibc_amount = null;
        if (!payload.eps_affiliation_date) payload.eps_affiliation_date = null;
        if (!payload.pension_affiliation_date) payload.pension_affiliation_date = null;
        if (!payload.risk_labor_affiliation_date) payload.risk_labor_affiliation_date = null;
        if (!payload.compensation_fund_affiliation_date) payload.compensation_fund_affiliation_date = null;
        await store.createSocialSecurityContribution(payload);
        await loadContributionsForModal(currentSocialSecurityUuid.value);
        // Reset form fields (keep third_party_uuid)
        newContribution.value.billing_period = '';
        newContribution.value.pila_pin = '';
        newContribution.value.ibc_amount = null;
        newContribution.value.payment_date = '';
        newContribution.value.eps_name = '';
        newContribution.value.eps_affiliation_date = '';
        newContribution.value.pension_name = '';
        newContribution.value.pension_affiliation_date = '';
        newContribution.value.risk_labor_name = '';
        newContribution.value.risk_labor_affiliation_date = '';
        newContribution.value.compensation_fund_name = '';
        newContribution.value.compensation_fund_affiliation_date = '';
        newContribution.value.status = '';
    } catch (err) {
        console.error('Error guardando aporte de seguridad social', err);
    } finally {
        isSubmittingContribution.value = false;
    }
};

/** Carga un aporte existente en el formulario para editarlo */
const startEditContribution = (contribution) => {
    editingContribution.value = contribution;
    newContribution.value = {
        third_party_uuid: contribution.third_party_uuid,
        billing_period: contribution.billing_period ? contribution.billing_period.split(/[T ]/)[0] : '',
        pila_pin: contribution.pila_pin,
        contribution_type: contribution.contribution_type,
        ibc_amount: contribution.ibc_amount,
        health_paid: !!contribution.health_paid,
        pension_paid: !!contribution.pension_paid,
        risk_labor_paid: !!contribution.risk_labor_paid,
        compensation_fund_paid: !!contribution.compensation_fund_paid,
        eps_name: contribution.eps_name || '',
        eps_affiliation_date: contribution.eps_affiliation_date ? contribution.eps_affiliation_date.split(/[T ]/)[0] : '',
        pension_name: contribution.pension_name || '',
        pension_affiliation_date: contribution.pension_affiliation_date ? contribution.pension_affiliation_date.split(/[T ]/)[0] : '',
        risk_labor_name: contribution.risk_labor_name || '',
        risk_labor_affiliation_date: contribution.risk_labor_affiliation_date ? contribution.risk_labor_affiliation_date.split(/[T ]/)[0] : '',
        compensation_fund_name: contribution.compensation_fund_name || '',
        compensation_fund_affiliation_date: contribution.compensation_fund_affiliation_date ? contribution.compensation_fund_affiliation_date.split(/[T ]/)[0] : '',
        payment_date: contribution.payment_date ? contribution.payment_date.split(/[T ]/)[0] : '',
        status: contribution.status,
    };
};

/** Cancela el modo edición y resetea el formulario */
const cancelEditContribution = () => {
    editingContribution.value = null;
    newContribution.value = {
        third_party_uuid: currentSocialSecurityUuid.value,
        billing_period: '',
        pila_pin: '',
        contribution_type: 'E',
        ibc_amount: null,
        health_paid: true,
        pension_paid: true,
        risk_labor_paid: true,
        compensation_fund_paid: true,
        eps_name: '',
        eps_affiliation_date: '',
        pension_name: '',
        pension_affiliation_date: '',
        risk_labor_name: '',
        risk_labor_affiliation_date: '',
        compensation_fund_name: '',
        compensation_fund_affiliation_date: '',
        payment_date: '',
        status: '',
    };
};

/** Guarda los cambios del aporte en edición */
const submitEditContribution = async () => {
    isSubmittingContribution.value = true;
    try {
        const payload = { ...newContribution.value };
        if (!payload.payment_date) payload.payment_date = null;
        if (!payload.ibc_amount) payload.ibc_amount = null;
        if (!payload.eps_affiliation_date) payload.eps_affiliation_date = null;
        if (!payload.pension_affiliation_date) payload.pension_affiliation_date = null;
        if (!payload.risk_labor_affiliation_date) payload.risk_labor_affiliation_date = null;
        if (!payload.compensation_fund_affiliation_date) payload.compensation_fund_affiliation_date = null;
        await store.updateSocialSecurityContribution(editingContribution.value.uuid, payload);
        await loadContributionsForModal(currentSocialSecurityUuid.value);
        cancelEditContribution();
    } catch (err) {
        console.error('Error actualizando aporte', err);
    } finally {
        isSubmittingContribution.value = false;
    }
};

// ── Proyectos ──────────────────────────────────
/**
 * Navega al módulo independiente de proyectos filtrado por el conductor.
 * @param {Object} driver - Conductor seleccionado.
 */
const goToProjects = (driver) => {
    router.push({ path: '/proyectos', query: { third_party_uuid: driver.uuid } });
};

watch(
    () => [store.search, store.pagination.currentPage, store.pagination.itemsPerPage, store.sortField, store.sortOrder],
    ([newSearch, newPage, newPerPage, newSort, newOrder]) => {
        router.replace({
            query: {
                ...route.query,
                search: newSearch || undefined,
                page: newPage > 1 ? newPage : undefined,
                per_page: newPerPage !== 10 ? newPerPage : undefined,
                sort: newSort || undefined,
                order: newSort ? (newOrder || 'asc') : undefined,
            },
        });
    }
);

onMounted(async () => {
    try {
        const queryPage = route.query.page ? parseInt(route.query.page, 10) : 1;
        const queryPerPage = route.query.per_page ? parseInt(route.query.per_page, 10) : 10;
        const querySearch = route.query.search || '';
        const querySort = typeof route.query.sort === 'string' && route.query.sort ? route.query.sort : null;
        const queryOrder = route.query.order === 'desc' ? 'desc' : 'asc';

        store.search = querySearch;
        store.pagination.currentPage = queryPage;
        store.pagination.itemsPerPage = queryPerPage;
        store.sortField = querySort;
        store.sortOrder = querySort ? queryOrder : null;
        restore(querySort, querySort ? queryOrder : null);

        searchQuery.value = querySearch;
        store.typeFilter = determineTypeFromRoute();
        await store.fetchItems();
    } finally {
        isViewLoading.value = false;
        initTooltips();
    }
});

watch(() => route.path, async () => {
    isViewLoading.value = true;
    store.typeFilter = determineTypeFromRoute();
    await store.setPage(1);
    isViewLoading.value = false;
    initTooltips();
});

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
</style>