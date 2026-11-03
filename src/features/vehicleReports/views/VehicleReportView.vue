<template>
    <BasePageHeader
        title="Reporte de vehículos"
        description="Consulta y auditoría de la flota vehicular."
        icon="fad fa-file-chart-column text-primary"
        :show-bg="true"
        :loading="isViewLoading"
        :compact="true"
        :breadcrumbs="[{ label: 'Reportes' }, { label: 'Vehículos' }]"
    >
        <template #actions>
            <button
                class="btn btn-falcon-default btn-sm px-2 px-sm-3"
                type="button"
                title="Actualizar reporte"
                aria-label="Actualizar reporte"
                @click="refreshTable"
            >
                <i class="fad fa-sync" aria-hidden="true" />
                <span class="d-none d-sm-inline ms-1">Actualizar</span>
            </button>

            <div class="btn-group btn-group-sm" role="group" aria-label="Exportar reporte">
                <button
                    v-if="can('reports.vehicles.export-excel')"
                    class="btn btn-falcon-default btn-sm text-success px-2 px-sm-3"
                    type="button"
                    title="Exportar a Excel" aria-label="Exportar a Excel"
                    :disabled="store.exporting || store.pagination.totalItems === 0"
                    @click="store.exportReport('excel')"
                >
                    <i class="fad fa-file-excel me-1" aria-hidden="true" />
                    <span class="d-none d-sm-inline">Excel</span>
                </button>
                <button
                    v-if="can('reports.vehicles.export-pdf')"
                    class="btn btn-falcon-default btn-sm text-danger px-2 px-sm-3"
                    type="button"
                    title="Exportar a PDF" aria-label="Exportar a PDF"
                    :disabled="store.exporting || store.pagination.totalItems === 0"
                    @click="store.exportReport('pdf')"
                >
                    <i class="fad fa-file-pdf me-1" aria-hidden="true" />
                    <span class="d-none d-sm-inline">PDF</span>
                </button>
            </div>
        </template>
    </BasePageHeader>

    <!-- BARRA SUPERIOR DE FILTROS DE CONSULTA -->
    <div class="card border-0 shadow-sm mb-3 fade-in-up" style="animation-delay: 0.05s;">
        <div class="card-body py-2 px-3">
            <div class="d-flex flex-wrap align-items-center gap-2">
                <!-- Criterio principal -->
                <div class="d-flex align-items-center gap-2 me-1 text-muted">
                    <i class="fad fa-filter text-primary" aria-hidden="true" />
                    <span class="fw-semibold text-dark small text-nowrap">Filtrar por:</span>
                </div>

                <div style="min-width: 175px;">
                    <label class="visually-hidden" for="f-filter-type">Criterio de filtro</label>
                    <PrimeSelect input-id="f-filter-type" v-model="store.filterType" :options="filterOptions"
                        option-label="label" option-value="value" placeholder="Criterio (Documentos, Sede...)" showClear
                        size="small" class="w-100" @change="onFilterTypeChange" />
                </div>

                <!-- Selectores dependientes según el criterio -->
                <div v-if="store.filterType" class="d-flex align-items-center gap-2 flex-wrap">
                    <!-- 1. Documentos: Tipo + Vencimiento (+15d, 5d, hoy, vencidas) -->
                    <template v-if="store.filterType === 'document'">
                        <div style="min-width: 180px;">
                            <label class="visually-hidden" for="f-document-type">Tipo de documento</label>
                            <PrimeSelect input-id="f-document-type" v-model="store.documentType"
                                :options="documentOptions" option-label="label" option-value="value"
                                placeholder="Todos los documentos" size="small" class="w-100" @change="onFilterValueChange" />
                        </div>
                        <div style="min-width: 180px;">
                            <label class="visually-hidden" for="f-doc-status">Vencimiento del documento</label>
                            <PrimeSelect input-id="f-doc-status" v-model="store.docStatus"
                                :options="expiryStatusOptions" option-label="label" option-value="value"
                                placeholder="Vencimiento..." showClear size="small" class="w-100" @change="onFilterValueChange" />
                        </div>
                    </template>

                    <!-- 2. Convenios: Entidad + Vencimiento (+15d, 5d, hoy, vencidas) -->
                    <template v-else-if="store.filterType === 'agreement'">
                        <div style="min-width: 180px;">
                            <label class="visually-hidden" for="f-agreement-name">Convenio</label>
                            <PrimeSelect input-id="f-agreement-name" v-model="store.filterValue" :options="store.catalogs.agreements"
                                option-label="label" option-value="value" placeholder="Todos los convenios" showClear
                                filter size="small" class="w-100" @change="onFilterValueChange" />
                        </div>
                        <div style="min-width: 180px;">
                            <label class="visually-hidden" for="f-agreement-status">Vencimiento del convenio</label>
                            <PrimeSelect input-id="f-agreement-status" v-model="store.agreementStatus"
                                :options="expiryStatusOptions" option-label="label" option-value="value"
                                placeholder="Vencimiento..." showClear size="small" class="w-100" @change="onFilterValueChange" />
                        </div>
                    </template>

                    <!-- 3. Sede operativa -->
                    <div v-else-if="store.filterType === 'branch'" style="min-width: 190px;">
                        <label class="visually-hidden" for="f-branch">Sede operativa</label>
                        <PrimeSelect input-id="f-branch" v-model="store.filterValue" :options="store.catalogs.branches"
                            option-label="label" option-value="value" placeholder="Seleccionar sede..." showClear
                            size="small" class="w-100" @change="onFilterValueChange" />
                    </div>

                    <!-- 4. Afiliado / Conductor -->
                    <div v-else-if="store.filterType === 'affiliate' || store.filterType === 'driver'" style="min-width: 220px;">
                        <label class="visually-hidden" :for="store.filterType === 'affiliate' ? 'f-affiliate' : 'f-driver'">
                            {{ store.filterType === 'affiliate' ? 'Afiliado' : 'Conductor' }}
                        </label>
                        <PrimeSelect :input-id="store.filterType === 'affiliate' ? 'f-affiliate' : 'f-driver'"
                            v-model="store.filterValue" :options="store.catalogs.terceros" option-value="uuid"
                            option-label="company_name" :placeholder="store.filterType === 'affiliate' ? 'Seleccionar afiliado...' : 'Seleccionar conductor...'" 
                            showClear filter size="small" class="w-100" @change="onFilterValueChange" />
                    </div>

                    <!-- 5. Proyecto -->
                    <div v-else-if="store.filterType === 'project'" style="min-width: 200px;">
                        <label class="visually-hidden" for="f-project">Proyecto</label>
                        <PrimeSelect input-id="f-project" v-model="store.filterValue" :options="store.catalogs.proyectos"
                            option-value="uuid" option-label="project_name" placeholder="Seleccionar proyecto..." showClear
                            filter size="small" class="w-100" @change="onFilterValueChange" />
                    </div>

                    <!-- 6. Tarjeta de Operación -->
                    <div v-else-if="store.filterType === 'operation_card'" class="d-flex gap-2">
                        <div style="min-width: 170px;">
                            <label class="visually-hidden" for="f-opcard-company">Empresa afiliada</label>
                            <PrimeSelect input-id="f-opcard-company" v-model="store.filterValue"
                                :options="store.catalogs.affiliatedCompanies" option-label="label" option-value="value"
                                placeholder="Empresa..." showClear filter size="small" class="w-100" @change="onFilterValueChange" />
                        </div>
                        <div style="min-width: 130px;">
                            <label class="visually-hidden" for="f-opcard">Estado de tarjeta</label>
                            <PrimeSelect input-id="f-opcard" v-model="store.operationCardStatus"
                                :options="operationCardOptions" option-label="label" option-value="value"
                                placeholder="Estado" showClear size="small" class="w-100" @change="onFilterValueChange" />
                        </div>
                    </div>

                    <!-- 7. Mantenimiento -->
                    <div v-else-if="store.filterType === 'maintenance'" style="min-width: 160px;">
                        <label class="visually-hidden" for="f-maintenance">Estado de mantenimiento</label>
                        <PrimeSelect input-id="f-maintenance" v-model="store.maintenanceStatus"
                            :options="maintenanceOptions" option-label="label" option-value="value"
                            placeholder="Estado mtto..." showClear size="small" class="w-100" @change="onFilterValueChange" />
                    </div>
                </div>

                <!-- Separación: Filtro transversal de Propiedad (Empresa vs Terceros) -->
                <div class="d-flex align-items-center gap-1 ms-sm-auto">
                    <label class="visually-hidden" for="f-ownership">Tipo de vinculación</label>
                    <PrimeSelect input-id="f-ownership" v-model="store.ownershipType" :options="ownershipOptions"
                        option-label="label" option-value="value" size="small" style="min-width: 185px;"
                        @change="onOwnershipChange" />
                </div>

                <!-- Botón Restablecer -->
                <button v-if="store.hasActiveFilter || searchQuery" class="btn btn-outline-secondary btn-sm" type="button"
                    title="Restablecer filtros" aria-label="Restablecer filtros" @click="clearAll">
                    <i class="fad fa-eraser me-1" aria-hidden="true" />
                    <span class="d-none d-sm-inline">Restablecer</span>
                </button>
            </div>
        </div>
    </div>

    <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta según el estándar Stitch -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <!-- TOOLBAR UNIFICADA STITCH -->
        <div class="noa-list-toolbar">
            <div class="noa-search">
                <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                <input id="f-vehicle-reports-busqueda" v-model="searchQuery" class="noa-search__input" type="search"
                    placeholder="Filtrar por placa o modelo..." aria-label="Buscar en reporte de vehículos"
                    @input="onSearchInput" />
                <button v-if="searchQuery" class="noa-search__clear" type="button"
                    title="Limpiar búsqueda" aria-label="Limpiar búsqueda" @click="clearSearch">
                    <i class="fal fa-times" aria-hidden="true" />
                </button>
            </div>

            <span v-if="!isViewLoading" class="noa-results">
                <i class="fas fa-filter" aria-hidden="true" />
                {{ store.pagination.totalItems }} vehículo{{ store.pagination.totalItems !== 1 ? 's' : '' }}
                <template v-if="store.search"> para "{{ store.search }}"</template>
            </span>
        </div>

        <!-- SKELETON -->
        <div v-if="isViewLoading" class="card-body p-0">
            <div class="table-responsive scrollbar">
                <table class="table table-sm mb-0">
                    <thead>
                        <tr>
                            <th v-for="w in ['12%', '10%', '10%', '10%', '10%', '10%', '10%', '10%', '10%', '8%']" :key="w" style="padding:12px 8px">
                                <div class="skeleton-text" :style="`height:16px;width:${w}`" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="n in 8" :key="`sk-${n}`">
                            <td v-for="i in 10" :key="i">
                                <div class="skeleton-text" style="height:18px;width:75%;" />
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
                    tableStyle="min-width: 90rem" class="table table-sm mb-0 professional-table"
                    emptyMessage="No se encontraron vehículos registrados" @page="onPageChange">

                    <!-- Placa y Vinculación -->
                    <Column field="vehicle_license_plate" header="Placa" sortable frozen style="min-width: 145px;">
                        <template #body="{ data }">
                            <div class="d-flex align-items-center gap-1">
                                <router-link
                                    :to="{ name: 'vehicles.profile', params: { id: data.uuid } }"
                                    class="noa-cell-strong font-monospace text-primary text-decoration-none"
                                    :aria-label="`Ver perfil del vehículo ${data.vehicle_license_plate}`"
                                    :title="`Ver perfil del vehículo ${data.vehicle_license_plate}`">
                                    {{ data.vehicle_license_plate || '—' }}
                                </router-link>
                                <span class="badge border py-0 px-1"
                                    :class="data.is_own ? 'bg-primary bg-opacity-10 text-primary border-primary border-opacity-25' : 'bg-light text-muted'"
                                    style="font-size: 0.68rem; font-weight: 500;"
                                    :title="data.is_own ? 'Vehículo propio de la empresa' : 'Vehículo de tercero / afiliado'">
                                    {{ data.ownership_label || (data.is_own ? 'Propio' : 'Tercero') }}
                                </span>
                            </div>
                            <small v-if="data.affiliate_name" class="text-muted d-block" style="font-size: 0.72rem;">
                                {{ data.affiliate_name }}
                            </small>
                            <small v-if="data.branch_name" class="text-secondary d-block" style="font-size: 0.70rem;">
                                <i class="fal fa-building me-1" aria-hidden="true" />{{ data.branch_name }}
                            </small>
                        </template>
                    </Column>

                    <!-- Modelo -->
                    <Column field="model" header="Modelo" sortable style="min-width: 90px;">
                        <template #body="{ data }">
                            <span class="text-dark">{{ data.model || '—' }}</span>
                        </template>
                    </Column>

                    <!-- Clase -->
                    <Column field="vehicle_class" header="Clase" style="min-width: 110px;">
                        <template #body="{ data }">
                            <span class="text-dark">{{ data.vehicle_class || '—' }}</span>
                        </template>
                    </Column>

                    <!-- Carrocería -->
                    <Column field="body_type" header="Carrocería" style="min-width: 120px;">
                        <template #body="{ data }">
                            <span class="text-dark">{{ data.body_type || '—' }}</span>
                        </template>
                    </Column>

                    <!-- Modalidad -->
                    <Column field="type_of_service" header="Modalidad" style="min-width: 120px;">
                        <template #body="{ data }">
                            <span class="noa-status noa-status--muted">
                                {{ data.modality_label || '—' }}
                            </span>
                        </template>
                    </Column>

                    <!-- SOAT -->
                    <Column field="soat_expiry" header="SOAT" style="min-width: 125px;">
                        <template #body="{ data }">
                            <template v-if="data.soat_expiry">
                                <router-link v-if="docEditLink(data, 'SOAT')" :to="docEditLink(data, 'SOAT')"
                                    :class="expiryClass(data.soat_expiry)"
                                    :title="`Actualizar SOAT — placa ${data.vehicle_license_plate}`"
                                    :aria-label="`Actualizar SOAT del vehículo ${data.vehicle_license_plate}, vence ${formatDate(data.soat_expiry)}`">
                                    {{ formatDate(data.soat_expiry) }}
                                </router-link>
                                <span v-else :class="expiryClass(data.soat_expiry)">{{ formatDate(data.soat_expiry) }}</span>
                            </template>
                            <template v-else>
                                <router-link v-if="docEditLink(data, 'SOAT')" :to="docEditLink(data, 'SOAT')"
                                    class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 text-decoration-none py-1 px-2 d-inline-flex align-items-center gap-1"
                                    style="font-size: 0.75rem; font-weight: 500;"
                                    :title="`Registrar SOAT para ${data.vehicle_license_plate}`">
                                    <i class="fad fa-plus-circle" aria-hidden="true" />
                                    <span>Sin registrar</span>
                                </router-link>
                                <span v-else class="badge bg-light text-muted border py-1 px-2" style="font-size: 0.75rem;">Sin registrar</span>
                            </template>
                        </template>
                    </Column>

                    <!-- RCC -->
                    <Column field="rcc_expiry" header="RCC" style="min-width: 135px;">
                        <template #body="{ data }">
                            <span v-if="data.es_particular" class="badge bg-light text-muted border py-1 px-2 d-inline-flex align-items-center gap-1"
                                style="font-size: 0.75rem; font-weight: 500;"
                                title="No aplica por normativa (Decreto 1079/2015): los vehículos particulares no requieren póliza RCC">
                                <i class="fal fa-shield-alt text-muted" aria-hidden="true" />
                                <span>Exento · Particular</span>
                            </span>
                            <template v-else-if="data.rcc_expiry">
                                <router-link v-if="docEditLink(data, 'RCC')" :to="docEditLink(data, 'RCC')"
                                    :class="expiryClass(data.rcc_expiry)"
                                    :title="`Actualizar póliza RCC — placa ${data.vehicle_license_plate}`"
                                    :aria-label="`Actualizar póliza RCC del vehículo ${data.vehicle_license_plate}, vence ${formatDate(data.rcc_expiry)}`">
                                    {{ formatDate(data.rcc_expiry) }}
                                </router-link>
                                <span v-else :class="expiryClass(data.rcc_expiry)">{{ formatDate(data.rcc_expiry) }}</span>
                            </template>
                            <template v-else>
                                <router-link v-if="docEditLink(data, 'RCC')" :to="docEditLink(data, 'RCC')"
                                    class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 text-decoration-none py-1 px-2 d-inline-flex align-items-center gap-1"
                                    style="font-size: 0.75rem; font-weight: 500;"
                                    :title="`Registrar póliza RCC para ${data.vehicle_license_plate}`">
                                    <i class="fad fa-plus-circle" aria-hidden="true" />
                                    <span>Sin registrar</span>
                                </router-link>
                                <span v-else class="badge bg-light text-muted border py-1 px-2" style="font-size: 0.75rem;">Sin registrar</span>
                            </template>
                        </template>
                    </Column>

                    <!-- RCE -->
                    <Column field="rce_expiry" header="RCE" style="min-width: 135px;">
                        <template #body="{ data }">
                            <span v-if="data.es_particular" class="badge bg-light text-muted border py-1 px-2 d-inline-flex align-items-center gap-1"
                                style="font-size: 0.75rem; font-weight: 500;"
                                title="No aplica por normativa (Decreto 1079/2015): los vehículos particulares no requieren póliza RCE">
                                <i class="fal fa-shield-alt text-muted" aria-hidden="true" />
                                <span>Exento · Particular</span>
                            </span>
                            <template v-else-if="data.rce_expiry">
                                <router-link v-if="docEditLink(data, 'RCE')" :to="docEditLink(data, 'RCE')"
                                    :class="expiryClass(data.rce_expiry)"
                                    :title="`Actualizar póliza RCE — placa ${data.vehicle_license_plate}`"
                                    :aria-label="`Actualizar póliza RCE del vehículo ${data.vehicle_license_plate}, vence ${formatDate(data.rce_expiry)}`">
                                    {{ formatDate(data.rce_expiry) }}
                                </router-link>
                                <span v-else :class="expiryClass(data.rce_expiry)">{{ formatDate(data.rce_expiry) }}</span>
                            </template>
                            <template v-else>
                                <router-link v-if="docEditLink(data, 'RCE')" :to="docEditLink(data, 'RCE')"
                                    class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 text-decoration-none py-1 px-2 d-inline-flex align-items-center gap-1"
                                    style="font-size: 0.75rem; font-weight: 500;"
                                    :title="`Registrar póliza RCE para ${data.vehicle_license_plate}`">
                                    <i class="fad fa-plus-circle" aria-hidden="true" />
                                    <span>Sin registrar</span>
                                </router-link>
                                <span v-else class="badge bg-light text-muted border py-1 px-2" style="font-size: 0.75rem;">Sin registrar</span>
                            </template>
                        </template>
                    </Column>

                    <!-- RTM -->
                    <Column field="rtm_expiry" header="RTM" style="min-width: 125px;">
                        <template #body="{ data }">
                            <template v-if="data.rtm_expiry">
                                <router-link v-if="docEditLink(data, 'RTM')" :to="docEditLink(data, 'RTM')"
                                    :class="expiryClass(data.rtm_expiry)"
                                    :title="`Actualizar RTM — placa ${data.vehicle_license_plate}`"
                                    :aria-label="`Actualizar revisión RTM del vehículo ${data.vehicle_license_plate}, vence ${formatDate(data.rtm_expiry)}`">
                                    {{ formatDate(data.rtm_expiry) }}
                                </router-link>
                                <span v-else :class="expiryClass(data.rtm_expiry)">{{ formatDate(data.rtm_expiry) }}</span>
                            </template>
                            <template v-else>
                                <router-link v-if="docEditLink(data, 'RTM')" :to="docEditLink(data, 'RTM')"
                                    class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 text-decoration-none py-1 px-2 d-inline-flex align-items-center gap-1"
                                    style="font-size: 0.75rem; font-weight: 500;"
                                    :title="`Registrar RTM para ${data.vehicle_license_plate}`">
                                    <i class="fad fa-plus-circle" aria-hidden="true" />
                                    <span>Sin registrar</span>
                                </router-link>
                                <span v-else class="badge bg-light text-muted border py-1 px-2" style="font-size: 0.75rem;">Sin registrar</span>
                            </template>
                        </template>
                    </Column>

                    <!-- Tarj. Operación -->
                    <Column field="operation_card_expiry" header="Tarj. Operación" style="min-width: 145px;">
                        <template #body="{ data }">
                            <span v-if="data.es_particular" class="badge bg-light text-muted border py-1 px-2 d-inline-flex align-items-center gap-1"
                                style="font-size: 0.75rem; font-weight: 500;"
                                title="No aplica por normativa (Decreto 1079/2015): los vehículos particulares no requieren Tarjeta de Operación">
                                <i class="fal fa-id-badge text-muted" aria-hidden="true" />
                                <span>Exento · Particular</span>
                            </span>
                            <template v-else-if="data.operation_card_expiry">
                                <router-link v-if="opCardEditLink(data)" :to="opCardEditLink(data)"
                                    :class="expiryClass(data.operation_card_expiry)"
                                    :title="`Actualizar tarjeta de operación — placa ${data.vehicle_license_plate}`"
                                    :aria-label="`Actualizar tarjeta de operación del vehículo ${data.vehicle_license_plate}, vence ${formatDate(data.operation_card_expiry)}`">
                                    {{ formatDate(data.operation_card_expiry) }}
                                </router-link>
                                <span v-else :class="expiryClass(data.operation_card_expiry)">{{ formatDate(data.operation_card_expiry) }}</span>
                                <small v-if="data.operation_card_number" class="text-muted d-block" style="font-size: 0.72rem;">
                                    N.º {{ data.operation_card_number }}
                                </small>
                            </template>
                            <template v-else>
                                <router-link v-if="opCardEditLink(data)" :to="opCardEditLink(data)"
                                    class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 text-decoration-none py-1 px-2 d-inline-flex align-items-center gap-1"
                                    style="font-size: 0.75rem; font-weight: 500;"
                                    :title="`Registrar tarjeta de operación para ${data.vehicle_license_plate}`">
                                    <i class="fad fa-plus-circle" aria-hidden="true" />
                                    <span>Sin registrar</span>
                                </router-link>
                                <span v-else class="badge bg-light text-muted border py-1 px-2" style="font-size: 0.75rem;">Sin registrar</span>
                            </template>
                        </template>
                    </Column>

                    <!-- Convenio -->
                    <Column field="agreement_name" header="Convenio" style="min-width: 130px;">
                        <template #body="{ data }">
                            <span class="text-dark">{{ data.agreement_name || 'Sin convenio' }}</span>
                        </template>
                    </Column>

                    <template #empty>
                        <div class="text-center py-5">
                            <i class="fad fa-file-chart-column fs-1 text-muted opacity-50 mb-3 d-block" aria-hidden="true" />
                            <h6 class="text-muted mb-1 fw-medium">No se encontraron vehículos</h6>
                            <p class="text-muted small mb-0">
                                {{ store.hasActiveFilter || searchQuery
                                    ? 'No hay registros que coincidan con los criterios seleccionados.'
                                    : 'No hay vehículos registrados en la flota.' }}
                            </p>
                        </div>
                    </template>

                    <!-- Loading state -->
                    <template #loading>
                        <NoaTableSpinner message="Cargando reporte de vehículos..." />
                    </template>
                </DataTable>
            </div>
            <ListPagination :page="store.pagination.currentPage" :per-page="store.pagination.itemsPerPage"
                :total="store.pagination.totalItems" @change="onPageChange" />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useVehicleReportsStore } from '../store/vehicleReports.store.js';
import { usePermissionsStore } from '@store';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import ListPagination from '@/components/ListPagination.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import PrimeSelect from '@/components/form/PrimeSelect.vue';

const route = useRoute();
const router = useRouter();
const store = useVehicleReportsStore();
const permissionsStore = usePermissionsStore();
const can = (action) => permissionsStore.can(action);

const isViewLoading = ref(true);
const searchQuery = ref('');
let searchTimer = null;

const filterOptions = [
    { label: 'Documentos', value: 'document' },
    { label: 'Convenio', value: 'agreement' },
    { label: 'Sede operativa', value: 'branch' },
    { label: 'Tarjeta de operación', value: 'operation_card' },
    { label: 'Afiliado', value: 'affiliate' },
    { label: 'Conductor', value: 'driver' },
    { label: 'Proyectos', value: 'project' },
    { label: 'Mantenimiento', value: 'maintenance' },
];

const documentOptions = [
    { label: 'Todos los documentos', value: 'TODOS' },
    { label: 'SOAT', value: 'SOAT' },
    { label: 'RCC', value: 'RCC' },
    { label: 'RCE', value: 'RCE' },
    { label: 'RTM', value: 'RTM' },
];

const expiryStatusOptions = [
    { label: 'Todos los vencimientos', value: '' },
    { label: 'Vencidas', value: 'vencido' },
    { label: 'Vence hoy', value: 'hoy' },
    { label: 'Por vencer (5 días)', value: 'por_vencer_5d' },
    { label: '+15 días (Vigentes)', value: 'mas_15d' },
];

const ownershipOptions = [
    { label: 'Empresa y Terceros', value: '' },
    { label: 'Empresa (Propios)', value: 'propios' },
    { label: 'Terceros (Afiliados)', value: 'terceros' },
];

const operationCardOptions = [
    { label: 'Vigente', value: 'vigente' },
    { label: 'Por vencer (5 días)', value: 'por_vencer_5d' },
    { label: 'Por vencer (30 días)', value: 'por_vencer' },
    { label: 'Vence hoy', value: 'hoy' },
    { label: 'Vencida', value: 'vencida' },
];

const maintenanceOptions = [
    { label: 'Vencido', value: 'vencido' },
    { label: 'Próximo (30 días)', value: 'proximo_30d' },
    { label: 'Pendiente', value: 'pendiente' },
];

const syncQuery = () => {
    router.replace({
        query: {
            ...route.query,
            filter_type: store.filterType || undefined,
            ownership_type: store.ownershipType || undefined,
            doc_type: store.documentType || undefined,
            doc_status: store.docStatus || undefined,
            agreement_status: store.agreementStatus || undefined,
            card_status: store.operationCardStatus || undefined,
            mtto_status: store.maintenanceStatus || undefined,
            filter_value: store.filterValue || undefined,
            page: store.pagination.currentPage > 1 ? store.pagination.currentPage : undefined,
            search: store.search || undefined,
        },
    });
};

const onFilterTypeChange = async () => {
    await store.setFilterType(store.filterType);
    await store.fetchItems();
    syncQuery();
};

const onFilterValueChange = async () => {
    store.pagination.currentPage = 1;
    await store.fetchItems();
    syncQuery();
};

const onOwnershipChange = async () => {
    store.pagination.currentPage = 1;
    await store.fetchItems();
    syncQuery();
};

const onSearchInput = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
        await store.setGlobalFilter(searchQuery.value);
        syncQuery();
    }, 400);
};

const clearSearch = async () => {
    searchQuery.value = '';
    await store.setGlobalFilter('');
    syncQuery();
};

const onPageChange = async ({ page, first, rows }) => {
    store.pagination.itemsPerPage = rows;
    const targetPage = page !== undefined ? page : Math.floor(first / rows) + 1;
    await store.setPage(targetPage);
    syncQuery();
};

const refreshTable = () => {
    store.fetchItems();
};

const clearAll = async () => {
    searchQuery.value = '';
    await store.clearFilters();
    syncQuery();
};

/**
 * Enlace a editar/crear según la presencia del UUID del documento.
 */
const docEditLink = (row, tipo) => {
    const segmentos = { SOAT: 'soat', RCC: 'poliza', RCE: 'poliza', RTM: 'tecnomecanica' };
    const porTipo = { SOAT: row?.soat_uuid, RCC: row?.rcc_uuid, RCE: row?.rce_uuid, RTM: row?.rtm_uuid };
    const seg = segmentos[tipo];
    if (!seg || !row?.uuid) return null;
    const docUuid = porTipo[tipo];
    if (docUuid && can('vehicle_documents.update')) {
        return { path: `/vehiculos-documentos/${seg}/editar/${docUuid}`, query: { wizard: row.uuid } };
    }
    if (can('vehicle_documents.create')) {
        return { path: `/vehiculos-documentos/${seg}/crear`, query: { wizard: row.uuid } };
    }
    return null;
};

const opCardEditLink = (row) => {
    if (!row?.uuid) return null;
    if (row?.operation_card_uuid && can('operation_cards.update')) {
        return { path: `/tarjetas-de-operacion/editar/${row.operation_card_uuid}`, query: { wizard: row.uuid } };
    }
    if (can('operation_cards.create')) {
        return { path: '/tarjetas-de-operacion/crear', query: { wizard: row.uuid } };
    }
    return null;
};

const formatDate = (value) => {
    if (!value) return '—';
    const d = new Date(`${value}T00:00:00`);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const expiryClass = (value) => {
    if (!value) return 'text-muted text-decoration-none';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(`${value}T00:00:00`);
    if (Number.isNaN(target.getTime())) return 'text-dark text-decoration-none';
    const diffDays = Math.ceil((target - today) / 86400000);
    if (diffDays < 0) return 'text-danger fw-semibold text-decoration-none';
    if (diffDays <= 30) return 'text-warning fw-semibold text-decoration-none';
    return 'text-dark text-decoration-none';
};

onMounted(async () => {
    try {
        const ft = route.query.filter_type;
        if (ft && filterOptions.some((o) => o.value === ft)) {
            await store.setFilterType(ft);
            const q = route.query;
            if (q.doc_type) store.documentType = String(q.doc_type);
            if (q.doc_status) store.docStatus = String(q.doc_status);
            if (q.agreement_status) store.agreementStatus = String(q.agreement_status);
            if (q.card_status) store.operationCardStatus = String(q.card_status);
            if (q.mtto_status) store.maintenanceStatus = String(q.mtto_status);
            if (q.filter_value) store.filterValue = String(q.filter_value);
        }
        if (route.query.ownership_type) {
            store.ownershipType = String(route.query.ownership_type);
        }
        if (route.query.search) {
            searchQuery.value = String(route.query.search);
            store.search = searchQuery.value;
        }
        await store.fetchItems();
    } finally {
        isViewLoading.value = false;
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
