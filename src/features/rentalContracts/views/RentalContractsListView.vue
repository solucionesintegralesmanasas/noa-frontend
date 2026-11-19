<template>
    <BasePageHeader title="Control de Alquiler de Vehículos" description="Gestión de contratos de alquiler y control de cuotas mensuales."
        icon="fad fa-car text-primary" :show-refresh="true" :show-create="can('rental_contracts.create')" :show-bg="true"
        :loading="isViewLoading || store.loading" :compact="true"
        :breadcrumbs="[{ label: 'Vehículos' }, { label: 'Alquiler' }]" @refresh="refreshTable" @create="goToCreate" />

    <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar">
            <div class="noa-search">
                <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                <input id="f-rental-contracts-busqueda" v-model="searchQuery" class="noa-search__input" type="search" placeholder="Buscar por placa o propietario..."
                    aria-label="Buscar contrato de alquiler" @input="debouncedSearch" />
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
                            <th v-for="w in ['25%', '20%', '15%', '15%', '10%', '15%']" :key="w" style="padding:12px 8px">
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
                                <div class="d-flex justify-content-end gap-1">
                                    <div v-for="j in 2" :key="j" class="skeleton-icon"
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
                    :sortField="sortField" :sortOrder="sortOrdenPrimeVue" @sort="onSort"
                    responsiveLayout="scroll" tableStyle="min-width: 64rem"
                    class="table table-sm table-hover mb-0 professional-table rental-contracts-table"
                    emptyMessage="No se encontraron contratos de alquiler">

                    <Column field="vehicle.vehicle_license_plate" header="Placa" sortable style="min-width: 10.5rem;">
                        <template #body="{ data }">
                            <div class="d-flex align-items-center gap-2">
                                <span class="noa-cell-strong font-monospace">{{ data.vehicle?.vehicle_license_plate || '-' }}</span>
                                <span class="badge rounded-pill" style="font-size: 0.65rem;" :class="{
                                    'bg-success bg-opacity-10 text-success': data.status === 'active',
                                    'bg-secondary bg-opacity-10 text-secondary': data.status === 'finished',
                                    'bg-danger bg-opacity-10 text-danger': data.status === 'cancelled'
                                }">
                                    {{ formatStatus(data.status) }}
                                </span>
                            </div>
                            <span v-if="data.contract_number" class="noa-cell-sub font-monospace">
                                Contrato #{{ data.contract_number }}
                            </span>
                        </template>
                    </Column>

                    <Column field="start_date" header="Fecha Inicio" sortable style="min-width: 7.5rem; white-space: nowrap;">
                        <template #body="{ data }">
                            <span class="text-dark small text-nowrap">{{ formatDate(data.start_date) }}</span>
                        </template>
                    </Column>

                    <Column field="monthly_fee" header="Canon Mensual" sortable headerClass="text-end" bodyClass="text-end" style="min-width: 8.5rem; white-space: nowrap;">
                        <template #body="{ data }">
                            <span class="font-monospace text-dark fw-semibold text-nowrap">${{ formatCurrencyCompact(data.monthly_fee) }}</span>
                        </template>
                    </Column>

                    <Column field="total_billed" header="Total Facturado" headerClass="text-end" bodyClass="text-end" style="min-width: 9rem; white-space: nowrap;">
                        <template #body="{ data }">
                            <span class="font-monospace text-dark text-nowrap" title="Total Facturado (Cánones)">${{ formatCurrencyCompact(getTotalBilled(data)) }}</span>
                        </template>
                    </Column>

                    <Column field="total_discounts" header="Descuentos" headerClass="text-end" bodyClass="text-end" style="min-width: 7.5rem; white-space: nowrap;">
                        <template #body="{ data }">
                            <span class="font-monospace text-nowrap" :class="getTotalDiscounts(data) > 0 ? 'text-info fw-semibold' : 'text-muted'">
                                {{ getTotalDiscounts(data) > 0 ? '-' : '' }}${{ formatCurrencyCompact(getTotalDiscounts(data)) }}
                            </span>
                        </template>
                    </Column>

                    <Column field="total_paid" header="Total Pagado" headerClass="text-end" bodyClass="text-end" style="min-width: 9rem; white-space: nowrap;">
                        <template #body="{ data }">
                            <div class="font-monospace text-success fw-semibold text-nowrap">${{ formatCurrencyCompact(getTotalPaidWithDiscounts(data)) }}</div>
                            <small v-if="getTotalDiscounts(data) > 0" class="text-muted d-block text-nowrap" style="font-size: 0.7rem;">
                                Efectivo: ${{ formatCurrencyCompact(getTotalPaid(data)) }}
                            </small>
                        </template>
                    </Column>

                    <Column field="current_pending_balance" header="Saldo Pendiente" headerClass="text-end" bodyClass="text-end" style="min-width: 9rem; white-space: nowrap;">
                        <template #body="{ data }">
                            <span class="font-monospace fw-bold text-nowrap" :class="getPendingBalance(data) > 0 ? 'text-danger' : 'text-success'">
                                ${{ formatCurrencyCompact(getPendingBalance(data)) }}
                            </span>
                        </template>
                    </Column>

                    <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="min-width: 9.5rem;">
                        <template #body="{ data }">
                            <RowActions :actions="accionesDe(data)" :max-linea="3" :row-label="data.vehicle?.vehicle_license_plate || 'contrato'" />
                        </template>
                    </Column>
                    <!-- Loading state -->
                    <template #loading>
                        <NoaTableSpinner message="Cargando contratos..." />
                    </template>
                </DataTable>
            </div>
            <ListPagination :page="store.pagination.currentPage" :per-page="store.pagination.itemsPerPage"
                :total="store.pagination.totalItems" @change="onPageChange" />
        </div>
    </div>

    <!-- Modal rápido: Registrar Pago o Descuento -->
    <Dialog v-model:visible="quickActionVisible" modal :style="{ width: '560px' }" :breakpoints="{ '640px': '95vw' }">
        <template #header>
            <div class="d-flex align-items-center gap-2">
                <span class="rental-modal-icon" :class="quickTab === 'payment' ? 'bg-success bg-opacity-10 text-success' : 'bg-info bg-opacity-10 text-info'">
                    <i :class="quickTab === 'payment' ? 'fad fa-money-bill-wave' : 'fad fa-tags'" aria-hidden="true"></i>
                </span>
                <div>
                    <div class="fw-semibold lh-sm">Gestión de Cuota Vigente</div>
                    <small class="text-muted" v-if="quickContract">
                        Placa {{ quickContract.vehicle?.vehicle_license_plate || '-' }}
                        <span v-if="quickContract.contract_number"> · Contrato #{{ quickContract.contract_number }}</span>
                    </small>
                </div>
            </div>
        </template>

        <div v-if="isLoadingQuick" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-2 mb-0 text-muted small">Cargando cuota vigente...</p>
        </div>

        <div v-else-if="!quickCurrentInstallment" class="alert alert-success d-flex align-items-center gap-2 mb-0 small">
            <i class="fad fa-check-circle" aria-hidden="true"></i>
            <span>Este contrato no tiene cuotas pendientes por pagar.</span>
        </div>

        <template v-else>
            <!-- Selector de pestaña: Pago vs Descuento -->
            <ul class="nav nav-pills nav-fill bg-light rounded p-1 mb-3">
                <li class="nav-item">
                    <button type="button" class="nav-link py-1 small fw-medium"
                        :class="{ active: quickTab === 'payment' }"
                        @click="quickTab = 'payment'">
                        <i class="fad fa-money-bill-wave me-1" aria-hidden="true"></i>Registrar Abono
                    </button>
                </li>
                <li class="nav-item">
                    <button type="button" class="nav-link py-1 small fw-medium"
                        :class="{ active: quickTab === 'discount' }"
                        @click="quickTab = 'discount'">
                        <i class="fad fa-tags me-1" aria-hidden="true"></i>Agregar Descuento
                    </button>
                </li>
            </ul>

            <!-- Pestaña 1: Registrar Abono -->
            <form v-if="quickTab === 'payment'" id="quick-payment-form" @submit.prevent="submitQuickPayment" novalidate>
                <div class="rental-summary-box mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                        <span class="fw-semibold small">Cuota vigente #{{ quickCurrentInstallment.installment_number }}</span>
                        <span class="text-muted small">Vence: {{ formatDate(quickCurrentInstallment.due_date) }}</span>
                    </div>
                    <div class="d-flex justify-content-between small mb-1">
                        <span class="text-muted">
                            Valor cuota{{ Number(quickCurrentInstallment.previous_balance) > 0 ? ' (incluye saldo ant.)' : '' }}
                        </span>
                        <span class="font-monospace">${{ formatCurrency(quickPaymentBase) }}</span>
                    </div>
                    <div class="d-flex justify-content-between small mb-1" v-if="Number(quickCurrentInstallment.discount_amount) > 0">
                        <span class="text-muted">Descuentos aplicados</span>
                        <span class="font-monospace text-info">-${{ formatCurrency(quickCurrentInstallment.discount_amount) }}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
                        <span class="fw-semibold small">Saldo a pagar</span>
                        <span class="fs-6 fw-bold font-monospace text-dark">${{ formatCurrency(quickPaymentRemaining) }}</span>
                    </div>
                </div>

                <div class="row g-3">
                    <div class="col-12 col-sm-7">
                        <label class="form-label required" for="quick_payment_amount">Abono a Registrar</label>
                        <div class="input-group">
                            <span class="input-group-text">$</span>
                            <input id="quick_payment_amount" v-model.number="quickPaymentForm.payment_amount" type="number"
                                class="form-control font-monospace" :class="{ 'is-invalid': quickErrors.payment_amount }"
                                min="0" :max="quickPaymentMaxAllowed" step="0.01" placeholder="0.00" />
                            <button type="button" class="btn btn-outline-secondary"
                                @click="quickPaymentForm.payment_amount = quickPaymentRemaining">
                                Total
                            </button>
                        </div>
                        <div v-if="quickErrors.payment_amount" class="invalid-feedback d-block">{{ quickErrors.payment_amount }}</div>
                    </div>
                    <div class="col-12 col-sm-5">
                        <label class="form-label" for="quick_payment_date">Fecha de Pago</label>
                        <DateInput id="quick_payment_date" v-model="quickPaymentForm.payment_date" class="form-control" placeholder="YYYY-MM-DD" />
                    </div>
                    <div class="col-12">
                        <label class="form-label" for="quick_payment_notes">Notas / Referencia</label>
                        <textarea id="quick_payment_notes" v-model="quickPaymentForm.notes" class="form-control" rows="2" maxlength="500"
                            placeholder="Ej: Transferencia, recibo de caja..."></textarea>
                    </div>
                </div>

                <div v-if="quickPaymentExcess > 0" class="alert alert-info d-flex align-items-start gap-2 py-2 px-3 mt-3 mb-0 small">
                    <i class="fad fa-forward mt-1" aria-hidden="true"></i>
                    <span>Saldo a favor de <strong class="font-monospace">${{ formatCurrency(quickPaymentExcess) }}</strong>: liquidará esta cuota y se abonará automáticamente a la(s) cuota(s) siguiente(s).</span>
                </div>
                <div v-else-if="quickPaymentPreviewPending <= 0" class="alert alert-success d-flex align-items-start gap-2 py-2 px-3 mt-3 mb-0 small">
                    <i class="fad fa-check-circle mt-1" aria-hidden="true"></i>
                    <span>La cuota #{{ quickCurrentInstallment.installment_number }} quedará en estado <strong>Pagado</strong>.</span>
                </div>
                <div v-else class="alert alert-warning d-flex align-items-start gap-2 py-2 px-3 mt-3 mb-0 small">
                    <i class="fad fa-exclamation-triangle mt-1" aria-hidden="true"></i>
                    <span>Abono parcial: se cerrará como <strong>Parcial</strong> y <strong class="font-monospace">${{ formatCurrency(quickPaymentPreviewPending) }}</strong> pasarán al mes siguiente.</span>
                </div>
            </form>

            <!-- Pestaña 2: Agregar Descuento -->
            <form v-else id="quick-discount-form" @submit.prevent="submitQuickDiscount" novalidate>
                <div class="rental-summary-box mb-3">
                    <div class="d-flex justify-content-between small mb-1">
                        <span class="text-muted">Cuota vigente</span>
                        <span class="fw-semibold">#{{ quickCurrentInstallment.installment_number }} ({{ formatMonthYear(quickCurrentInstallment.due_date) }})</span>
                    </div>
                    <div class="d-flex justify-content-between small mb-1">
                        <span class="text-muted">Valor neto actual</span>
                        <span class="font-monospace">${{ formatCurrency(quickCurrentInstallment.net_amount) }}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
                        <span class="fw-semibold small">Nuevo valor neto tras descuento</span>
                        <span class="fs-6 fw-bold font-monospace text-primary">${{ formatCurrency(quickDiscountPreviewNet) }}</span>
                    </div>
                </div>

                <div class="row g-3">
                    <div class="col-12 col-sm-7">
                        <label class="form-label" for="quick_discount_month">Mes (Cuota vigente)</label>
                        <input id="quick_discount_month" type="text" class="form-control bg-light"
                            :value="`${formatMonthYear(quickCurrentInstallment.due_date)} — Cuota #${quickCurrentInstallment.installment_number}`"
                            readonly disabled />
                    </div>
                    <div class="col-12 col-sm-5">
                        <label class="form-label required" for="quick_discount_date">Fecha Descuento</label>
                        <DateInput id="quick_discount_date" v-model="quickDiscountForm.discount_date"
                            class="form-control" :class="{ 'is-invalid': quickErrors.discount_date }" placeholder="YYYY-MM-DD" />
                        <div v-if="quickErrors.discount_date" class="invalid-feedback d-block">{{ quickErrors.discount_date }}</div>
                    </div>
                    <div class="col-12">
                        <label class="form-label required" for="quick_discount_concept">Concepto / Detalle</label>
                        <input id="quick_discount_concept" v-model.trim="quickDiscountForm.concept" type="text"
                            class="form-control" :class="{ 'is-invalid': quickErrors.concept }" maxlength="255"
                            placeholder="Ej: Mantenimiento, reparación, repuestos..." />
                        <div v-if="quickErrors.concept" class="invalid-feedback d-block">{{ quickErrors.concept }}</div>
                    </div>
                    <div class="col-12">
                        <label class="form-label required" for="quick_discount_amount">Valor Descuento</label>
                        <div class="input-group">
                            <span class="input-group-text">$</span>
                            <input id="quick_discount_amount" v-model.number="quickDiscountForm.amount" type="number"
                                class="form-control font-monospace" :class="{ 'is-invalid': quickErrors.amount }"
                                min="0.01" :max="quickPaymentRemaining" step="0.01" placeholder="0.00" />
                        </div>
                        <small class="form-text text-muted d-block mt-1">
                            Máximo disponible: <span class="font-monospace">${{ formatCurrency(quickPaymentRemaining) }}</span>
                        </small>
                        <div v-if="quickErrors.amount" class="invalid-feedback d-block">{{ quickErrors.amount }}</div>
                    </div>
                    <div class="col-12">
                        <label class="form-label" for="quick_discount_obs">Observaciones</label>
                        <textarea id="quick_discount_obs" v-model="quickDiscountForm.observations" class="form-control"
                            rows="2" maxlength="1000" placeholder="Número de factura, taller o detalle adicional..."></textarea>
                    </div>
                </div>
            </form>
        </template>

        <template #footer>
            <button type="button" class="btn btn-light border" @click="quickActionVisible = false" :disabled="isSubmittingQuick">
                Cancelar
            </button>
            <button v-if="quickCurrentInstallment && quickTab === 'payment'" type="submit" form="quick-payment-form"
                class="btn btn-success" :disabled="isSubmittingQuick">
                <span v-if="isSubmittingQuick" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                <i v-else class="fad fa-check me-1" aria-hidden="true"></i>
                {{ isSubmittingQuick ? 'Procesando...' : 'Confirmar Abono' }}
            </button>
            <button v-else-if="quickCurrentInstallment && quickTab === 'discount'" type="submit" form="quick-discount-form"
                class="btn btn-primary" :disabled="isSubmittingQuick">
                <span v-if="isSubmittingQuick" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                <i v-else class="fad fa-check me-1" aria-hidden="true"></i>
                {{ isSubmittingQuick ? 'Guardando...' : 'Guardar Descuento' }}
            </button>
        </template>
    </Dialog>

    <!-- Modal: Movimientos del Contrato -->
    <Dialog v-model:visible="movementsDialogVisible" modal :style="{ width: '780px' }" :breakpoints="{ '768px': '95vw' }">
        <template #header>
            <div class="d-flex align-items-center gap-2">
                <span class="rental-modal-icon bg-primary bg-opacity-10 text-primary">
                    <i class="fad fa-exchange-alt" aria-hidden="true"></i>
                </span>
                <div>
                    <div class="fw-semibold lh-sm">Movimientos del Contrato</div>
                    <small class="text-muted" v-if="movementsContract">
                        Placa {{ movementsContract.vehicle?.vehicle_license_plate || '-' }}
                        <span v-if="movementsContract.contract_number"> · Contrato #{{ movementsContract.contract_number }}</span>
                        <span v-if="movementsContract.owner?.owner_name"> · {{ movementsContract.owner.owner_name }}</span>
                    </small>
                </div>
            </div>
        </template>

        <div v-if="isLoadingMovements" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando movimientos...</span>
            </div>
            <p class="mt-2 mb-0 text-muted small">Cargando movimientos del contrato...</p>
        </div>

        <template v-else-if="movementsContract">
            <!-- Resumen financiero compacto -->
            <div class="row g-2 mb-3">
                <div class="col-6 col-md-3">
                    <div class="bg-light rounded p-2 border text-center">
                        <div class="text-muted" style="font-size: 0.72rem;">Total Facturado</div>
                        <div class="fw-bold font-monospace small">${{ formatCurrency(movementsSummary.billed) }}</div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="bg-light rounded p-2 border text-center">
                        <div class="text-muted" style="font-size: 0.72rem;">Descuentos</div>
                        <div class="fw-bold font-monospace small text-info">-${{ formatCurrency(movementsSummary.discounts) }}</div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="bg-light rounded p-2 border text-center">
                        <div class="text-muted" style="font-size: 0.72rem;">Total Pagado</div>
                        <div class="fw-bold font-monospace small text-success">${{ formatCurrency(movementsSummary.paid) }}</div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="bg-light rounded p-2 border text-center">
                        <div class="text-muted" style="font-size: 0.72rem;">Saldo Pendiente</div>
                        <div class="fw-bold font-monospace small" :class="movementsSummary.pending > 0 ? 'text-danger' : 'text-success'">
                            ${{ formatCurrency(movementsSummary.pending) }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Filtro por tipo de movimiento -->
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div class="btn-group btn-group-sm" role="group" aria-label="Filtrar movimientos">
                    <button type="button" class="btn" :class="movementsFilter === 'all' ? 'btn-primary' : 'btn-outline-secondary'"
                        @click="movementsFilter = 'all'">
                        Todos ({{ allMovements.length }})
                    </button>
                    <button type="button" class="btn" :class="movementsFilter === 'payment' ? 'btn-success' : 'btn-outline-secondary'"
                        @click="movementsFilter = 'payment'">
                        Pagos ({{ allMovements.filter(m => m.type === 'payment').length }})
                    </button>
                    <button type="button" class="btn" :class="movementsFilter === 'discount' ? 'btn-info text-white' : 'btn-outline-secondary'"
                        @click="movementsFilter = 'discount'">
                        Descuentos ({{ allMovements.filter(m => m.type === 'discount').length }})
                    </button>
                </div>
            </div>

            <div class="table-responsive" style="max-height: 360px;">
                <table class="table table-sm table-hover mb-0 align-middle">
                    <thead class="table-light sticky-top">
                        <tr>
                            <th style="width: 15%;">Fecha</th>
                            <th style="width: 14%;">Tipo</th>
                            <th style="width: 18%;">Mes / Cuota</th>
                            <th style="width: 33%;">Concepto / Detalle</th>
                            <th class="text-end" style="width: 20%;">Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="mov in filteredMovements" :key="mov.id">
                            <td class="small">{{ formatDate(mov.date) }}</td>
                            <td>
                                <span class="badge rounded-pill" :class="mov.type === 'payment' ? 'bg-success' : 'bg-info'">
                                    {{ mov.type === 'payment' ? 'Pago' : 'Descuento' }}
                                </span>
                            </td>
                            <td class="small">
                                <div class="fw-medium">{{ formatMonthYear(mov.dueDate) }}</div>
                                <small class="text-muted">Cuota #{{ mov.installmentNumber }}</small>
                            </td>
                            <td class="small">
                                <div class="fw-medium">{{ mov.concept }}</div>
                                <small v-if="mov.notes" class="text-muted d-block">{{ mov.notes }}</small>
                            </td>
                            <td class="text-end font-monospace fw-semibold" :class="mov.type === 'payment' ? 'text-success' : 'text-info'">
                                {{ mov.type === 'payment' ? '+' : '-' }}${{ formatCurrency(mov.amount) }}
                            </td>
                        </tr>
                        <tr v-if="filteredMovements.length === 0">
                            <td colspan="5" class="text-center text-muted py-4">
                                No hay movimientos registrados para este contrato
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </template>

        <template #footer>
            <button type="button" class="btn btn-light border" @click="movementsDialogVisible = false">Cerrar</button>
            <button v-if="movementsContract" type="button" class="btn btn-primary"
                @click="movementsDialogVisible = false; goToDetail(movementsContract.uuid)">
                <i class="fad fa-eye me-1" aria-hidden="true"></i>Ver Contrato Completo
            </button>
        </template>
    </Dialog>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRentalContractsStore } from '../store/rentalContracts.store.js';
import rentalContractsService from '../services/rentalContracts.service.js';
import { usePermissionsStore } from '@store';
import { useTable } from '@/hooks/useTable.js';
import { useServerSort } from '@/hooks/useServerSort.js';
import { toast } from '@/utils/toast.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import RowActions from '@/components/RowActions.vue';
import ListPagination from '@/components/ListPagination.vue';
import DateInput from '@/components/form/DateInput.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';

const route = useRoute();
const router = useRouter();
const store = useRentalContractsStore();
const permissionsStore = usePermissionsStore();

const { sortField, sortOrdenPrimeVue, onSort, restore } = useServerSort({
    onChange: ({ field, order }) => store.setSort(field, order),
});

const isViewLoading = ref(true);
const searchQuery = ref('');
const movementsDialogVisible = ref(false);
const isLoadingMovements = ref(false);
const movementsContract = ref(null);
const movementsFilter = ref('all');

const quickActionVisible = ref(false);
const isLoadingQuick = ref(false);
const isSubmittingQuick = ref(false);
const quickContract = ref(null);
const quickTab = ref('payment');
const quickErrors = reactive({});
const quickPaymentForm = reactive({ payment_amount: 0, payment_date: '', notes: '' });
const quickDiscountForm = reactive({ discount_date: '', concept: '', amount: null, observations: '' });

const { debouncedSearch } = useTable({}, () => store.setGlobalFilter(searchQuery.value));

const can = (action) => permissionsStore.can(action);

// Funciones auxiliares
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(amount) || 0);
};

const formatCurrencyCompact = (amount) => {
    const val = Number(amount) || 0;
    const hasDecimals = Math.abs(val - Math.round(val)) > 0.001;
    return new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: 2,
    }).format(val);
};

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const iso = String(dateStr).slice(0, 10);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(dateStr);
    return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatMonthYear = (dateStr) => {
    if (!dateStr) return '-';
    const iso = String(dateStr).slice(0, 10);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(dateStr);
    const label = date.toLocaleDateString('es-MX', { year: 'numeric', month: 'short' });
    return label.charAt(0).toUpperCase() + label.slice(1);
};

const formatStatus = (status) => {
    const statuses = {
        'active': 'Activo',
        'finished': 'Finalizado',
        'cancelled': 'Cancelado'
    };
    return statuses[status] || status;
};

const getTotalBilled = (contract) => {
    if (contract.total_billed !== undefined && contract.total_billed !== null) {
        return Number(contract.total_billed);
    }
    return Number(contract.monthly_fee || 0) * Number(contract.monthly_term || 0);
};

const getTotalDiscounts = (contract) => Number(contract.total_discounts || 0);
const getTotalPaid = (contract) => Number(contract.total_paid || 0);
const getTotalPaidWithDiscounts = (contract) => getTotalPaid(contract) + getTotalDiscounts(contract);
const getPendingBalance = (contract) => Math.max(0, getTotalBilled(contract) - getTotalPaidWithDiscounts(contract));

const movementsSummary = computed(() => {
    const installments = movementsContract.value?.installments ?? [];
    const billed = installments.reduce((s, i) => s + Number(i.gross_amount || 0), 0);
    const discounts = installments.reduce((s, i) => s + Number(i.discount_amount || 0), 0);
    const paidCash = installments.reduce((s, i) => s + Number(i.paid_amount || 0), 0);
    const paid = paidCash + discounts;
    return { billed, discounts, paid, pending: Math.max(0, billed - paid) };
});

const allMovements = computed(() => {
    if (!movementsContract.value) return [];
    const list = [];

    for (const inst of (movementsContract.value.installments ?? [])) {
        if (Number(inst.paid_amount) > 0) {
            list.push({
                id: `pay-${inst.uuid}`,
                type: 'payment',
                date: inst.payment_date || inst.due_date,
                dueDate: inst.due_date,
                installmentNumber: inst.installment_number,
                concept: inst.status === 'partial' ? `Abono parcial cuota #${inst.installment_number}` : `Pago cuota #${inst.installment_number}`,
                notes: inst.notes || '',
                amount: Number(inst.paid_amount),
            });
        }
    }

    for (const disc of (movementsContract.value.discounts ?? [])) {
        list.push({
            id: `disc-${disc.uuid}`,
            type: 'discount',
            date: disc.discount_date,
            dueDate: disc.installment?.due_date || disc.discount_date,
            installmentNumber: disc.installment?.installment_number ?? '-',
            concept: disc.concept,
            notes: disc.observations || '',
            amount: Number(disc.amount),
        });
    }

    return list.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
});

const filteredMovements = computed(() => {
    if (movementsFilter.value === 'all') return allMovements.value;
    return allMovements.value.filter((m) => m.type === movementsFilter.value);
});

const openMovementsDialog = async (row) => {
    movementsContract.value = null;
    movementsFilter.value = 'all';
    movementsDialogVisible.value = true;
    isLoadingMovements.value = true;

    try {
        const response = await rentalContractsService.get(row.uuid);
        movementsContract.value = response?.data?.data ?? response?.data ?? response;
    } catch {
        movementsDialogVisible.value = false;
        await toast('Error', 'No se pudieron cargar los movimientos del contrato', 'error');
    } finally {
        isLoadingMovements.value = false;
    }
};

const clearSearch = async () => { searchQuery.value = ''; await store.clearFilters(); };
const refreshTable = () => store.fetchItems();

const onPageChange = async ({ page, first, rows }) => {
    store.pagination.itemsPerPage = rows;
    const targetPage = page !== undefined ? page : Math.floor(first / rows) + 1;
    await store.setPage(targetPage);
};

const goToDetail = (uuid) => router.push({ name: 'rentalContracts.detail', params: { id: uuid } });
const goToCreate = () => router.push({ name: 'rentalContracts.create' });

const downloadPdf = (uuid) => store.downloadPdf(uuid);

const quickCurrentInstallment = computed(() => {
    const list = [...(quickContract.value?.installments ?? [])].sort((a, b) => a.installment_number - b.installment_number);
    return list.find((inst, idx) => {
        if (inst.status === 'pending' || inst.status === 'overdue') return true;
        if (inst.status === 'partial') {
            const next = list[idx + 1];
            return !next || Number(next.previous_balance || 0) <= 0;
        }
        return false;
    }) || null;
});

const quickPaymentBase = computed(() => {
    if (!quickCurrentInstallment.value) return 0;
    return Number(quickCurrentInstallment.value.gross_amount || 0) + Number(quickCurrentInstallment.value.previous_balance || 0);
});

const quickPaymentRemaining = computed(() => {
    if (!quickCurrentInstallment.value) return 0;
    const net = Math.max(0, quickPaymentBase.value - Number(quickCurrentInstallment.value.discount_amount || 0));
    return Math.max(0, net - Number(quickCurrentInstallment.value.paid_amount || 0));
});

const quickPaymentPreviewPending = computed(() => {
    return Math.max(0, quickPaymentRemaining.value - (Number(quickPaymentForm.payment_amount) || 0));
});

const quickPaymentExcess = computed(() => {
    return Math.max(0, (Number(quickPaymentForm.payment_amount) || 0) - quickPaymentRemaining.value);
});

const quickPaymentMaxAllowed = computed(() => {
    if (!quickCurrentInstallment.value) return 0;
    const currentNum = quickCurrentInstallment.value.installment_number;
    const nextRemaining = (quickContract.value?.installments ?? [])
        .filter((i) => i.installment_number > currentNum)
        .reduce((sum, i) => sum + Math.max(0, (Number(i.gross_amount) - Number(i.discount_amount)) - Number(i.paid_amount)), 0);
    return quickPaymentRemaining.value + nextRemaining;
});

const quickDiscountPreviewNet = computed(() => {
    if (!quickCurrentInstallment.value) return 0;
    return Math.max(0, Number(quickCurrentInstallment.value.net_amount || 0) - (Number(quickDiscountForm.amount) || 0));
});

const clearQuickErrors = () => Object.keys(quickErrors).forEach((k) => delete quickErrors[k]);

const openQuickActionDialog = async (row, initialTab = 'payment') => {
    quickContract.value = null;
    quickTab.value = initialTab;
    clearQuickErrors();
    quickActionVisible.value = true;
    isLoadingQuick.value = true;

    try {
        const response = await rentalContractsService.get(row.uuid);
        quickContract.value = response?.data?.data ?? response?.data ?? response;
        const today = new Date().toISOString().split('T')[0];
        quickPaymentForm.payment_amount = quickPaymentRemaining.value;
        quickPaymentForm.payment_date = today;
        quickPaymentForm.notes = '';
        quickDiscountForm.discount_date = today;
        quickDiscountForm.concept = '';
        quickDiscountForm.amount = null;
        quickDiscountForm.observations = '';
    } catch {
        quickActionVisible.value = false;
        await toast('Error', 'No se pudo cargar la información del contrato', 'error');
    } finally {
        isLoadingQuick.value = false;
    }
};

const submitQuickPayment = async () => {
    if (!quickCurrentInstallment.value) return;
    clearQuickErrors();
    const abono = Number(quickPaymentForm.payment_amount);

    if (Number.isNaN(abono) || abono < 0) {
        quickErrors.payment_amount = 'Ingrese un monto válido.';
        return;
    }
    if (abono > quickPaymentMaxAllowed.value + 0.001) {
        quickErrors.payment_amount = 'El abono supera el saldo pendiente total del contrato.';
        return;
    }

    isSubmittingQuick.value = true;
    try {
        await store.updateInstallment(quickCurrentInstallment.value.uuid, {
            payment_amount: abono,
            payment_date: quickPaymentForm.payment_date || null,
            notes: quickPaymentForm.notes || null,
        });
        await store.fetchItems();
        quickActionVisible.value = false;
    } catch {
        // El store ya mostró el toast de error.
    } finally {
        isSubmittingQuick.value = false;
    }
};

const submitQuickDiscount = async () => {
    if (!quickContract.value || !quickCurrentInstallment.value) return;
    clearQuickErrors();
    const amount = Number(quickDiscountForm.amount) || 0;

    if (!quickDiscountForm.discount_date) quickErrors.discount_date = 'Seleccione la fecha.';
    if (!quickDiscountForm.concept) quickErrors.concept = 'Ingrese el concepto o detalle.';
    if (amount <= 0) {
        quickErrors.amount = 'El valor debe ser mayor a cero.';
    } else if (amount > quickPaymentRemaining.value + 0.001) {
        quickErrors.amount = 'El valor supera el saldo disponible de la cuota vigente.';
    }

    if (Object.keys(quickErrors).length > 0) return;

    isSubmittingQuick.value = true;
    try {
        await store.createDiscount(quickContract.value.uuid, {
            discount_date: quickDiscountForm.discount_date,
            concept: quickDiscountForm.concept,
            amount,
            observations: quickDiscountForm.observations || null,
        });
        await store.fetchItems();
        quickActionVisible.value = false;
    } catch {
        // El store ya mostró el toast de error.
    } finally {
        isSubmittingQuick.value = false;
    }
};

const accionesDe = (data) => [
    {
        key: 'quick-payment',
        label: 'Pago / Descuento',
        icon: 'far fa-money-bill-wave',
        tone: 'success',
        inline: true,
        visible: data.status === 'active' && can('rental_installments.update'),
        onClick: () => openQuickActionDialog(data, 'payment')
    },
    {
        key: 'movements',
        label: 'Movimientos',
        icon: 'far fa-list-alt',
        tone: 'info',
        inline: true,
        onClick: () => openMovementsDialog(data)
    },
    {
        key: 'detail',
        label: 'Ver Detalle',
        icon: 'far fa-eye',
        tone: 'primary',
        inline: true,
        onClick: () => goToDetail(data.uuid)
    },
    {
        key: 'pdf',
        label: 'Descargar PDF',
        icon: 'far fa-file-pdf',
        tone: 'secondary',
        inline: false,
        onClick: () => downloadPdf(data.uuid)
    },
];

onMounted(async () => {
    try {
        const sortParam = route.query.sort;
        const orderParam = route.query.order;
        if (typeof sortParam === 'string' && sortParam) {
            restore(sortParam, orderParam);
            store.sortField = sortParam;
            store.sortOrder = orderParam === 'desc' ? 'desc' : 'asc';
        }
        searchQuery.value = store.search;
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

.rental-modal-icon {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.5rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    flex-shrink: 0;
}

.rental-summary-box {
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 0.5rem;
    padding: 0.875rem 1rem;
}

.rental-contracts-table :deep(th),
.rental-contracts-table :deep(td) {
    vertical-align: middle;
    padding: 0.65rem 0.75rem;
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
