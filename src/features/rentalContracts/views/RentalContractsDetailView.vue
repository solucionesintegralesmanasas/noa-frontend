<template>
    <div class="row gx-3">
        <div class="col-12 col-xxl-10 offset-xxl-1 col-xl-12">

            <!-- Encabezado con navegación -->
            <BasePageHeader
                :title="contract ? `Contrato ${contract.vehicle?.vehicle_license_plate || 'Sin título'}` : 'Cargando...'"
                subtitle="Detalle completo del contrato de alquiler y sus cuotas"
                icon="fad fa-car-side text-primary"
                :breadcrumbs="breadcrumbs"
                :show-back="true"
                :show-refresh="true"
                :loading="isLoading"
                @back="goBack"
                @refresh="loadContract"
            />

            <!-- Mensaje de error si no se encontró el contrato -->
            <div v-if="errorMessage" class="alert alert-danger fade-in-up" role="alert">
                <i class="fad fa-exclamation-triangle me-2" aria-hidden="true"></i>
                {{ errorMessage }}
            </div>

            <!-- Contenido principal -->
            <template v-if="contract">

                <!-- Tarjeta: Información General -->
                <div class="card border-0 shadow-sm fade-in-up mb-4" style="animation-delay: 0.1s;">
                    <div class="card-header bg-light py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center gap-2">
                            <i class="fad fa-file-contract text-primary" aria-hidden="true"></i>
                            <h6 class="mb-0 fw-medium">Información General del Contrato</h6>
                        </div>
                        <span class="noa-status" :class="{
                            'noa-status--success': contract.status === 'active',
                            'noa-status--muted': contract.status === 'finished',
                            'noa-status--danger': contract.status === 'cancelled'
                        }">
                            {{ formatStatus(contract.status) }}
                        </span>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-12 col-sm-6 col-md-4">
                                <div class="info-label">Número de Contrato</div>
                                <div class="info-value font-monospace fw-bold">{{ contract.contract_number || contract.uuid }}</div>
                            </div>
                            <div class="col-12 col-sm-6 col-md-4">
                                <div class="info-label">Fecha de Inicio</div>
                                <div class="info-value">{{ formatDate(contract.start_date) }}</div>
                            </div>
                            <div class="col-12 col-sm-6 col-md-4">
                                <div class="info-label">Fecha de Fin</div>
                                <div class="info-value">{{ formatDate(contract.end_date) }}</div>
                            </div>
                            <div class="col-12 col-sm-6 col-md-4">
                                <div class="info-label">Plazo</div>
                                <div class="info-value">{{ contract.monthly_term }} meses</div>
                            </div>
                            <div class="col-12 col-sm-6 col-md-4">
                                <div class="info-label">Canon Mensual</div>
                                <div class="info-value text-primary fw-bold">{{ formatCurrency(contract.monthly_fee) }}</div>
                            </div>
                            <div class="col-12 col-sm-6 col-md-4">
                                <div class="info-label">Valor Total</div>
                                <div class="info-value text-primary fw-bold">{{ formatCurrency(contract.monthly_fee * contract.monthly_term) }}</div>
                            </div>
                            <div class="col-12" v-if="contract.observations">
                                <div class="info-label">Observaciones</div>
                                <div class="info-value">{{ contract.observations }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tarjeta: Información del Vehículo -->
                <div class="card border-0 shadow-sm fade-in-up mb-4" style="animation-delay: 0.15s;">
                    <div class="card-header bg-light py-2 px-3 border-bottom">
                        <div class="d-flex align-items-center gap-2">
                            <i class="fad fa-car text-secondary" aria-hidden="true"></i>
                            <h6 class="mb-0 fw-medium">Datos del Vehículo</h6>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-12 col-sm-6 col-md-4">
                                <div class="info-label">Placa</div>
                                <div class="info-value fw-bold">{{ contract.vehicle?.vehicle_license_plate || 'N/A' }}</div>
                            </div>
                            <div class="col-12 col-sm-6 col-md-4">
                                <div class="info-label">Marca</div>
                                <div class="info-value">{{ contract.vehicle?.brand?.description || 'N/A' }}</div>
                            </div>
                            <div class="col-12 col-sm-6 col-md-4">
                                <div class="info-label">Clase de Vehículo</div>
                                <div class="info-value">{{ contract.vehicle?.vehicle_class?.description || 'N/A' }}</div>
                            </div>
                            <div class="col-12 col-sm-6 col-md-4">
                                <div class="info-label">Modelo</div>
                                <div class="info-value">{{ contract.vehicle?.model || 'N/A' }}</div>
                            </div>
                            <div class="col-12 col-sm-6 col-md-4">
                                <div class="info-label">Capacidad de Pasajeros</div>
                                <div class="info-value">{{ contract.vehicle?.passenger_capacity ?? 'N/A' }}</div>
                            </div>
                            <div class="col-12 col-sm-6 col-md-4">
                                <div class="info-label">Tipo de Servicio</div>
                                <div class="info-value">{{ contract.vehicle?.type_of_service || 'N/A' }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tarjeta: Información del Propietario -->
                <div class="card border-0 shadow-sm fade-in-up mb-4" style="animation-delay: 0.2s;">
                    <div class="card-header bg-light py-2 px-3 border-bottom">
                        <div class="d-flex align-items-center gap-2">
                            <i class="fad fa-user text-secondary" aria-hidden="true"></i>
                            <h6 class="mb-0 fw-medium">Datos del Propietario</h6>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-12 col-sm-6 col-md-4">
                                <div class="info-label">Nombre</div>
                                <div class="info-value fw-bold">{{ contract.owner?.owner_name || 'N/A' }}</div>
                            </div>
                            <div class="col-12 col-sm-6 col-md-4">
                                <div class="info-label">Documento de Identidad</div>
                                <div class="info-value font-monospace">{{ contract.owner?.document_number || 'N/A' }}</div>
                            </div>
                            <div class="col-12 col-sm-6 col-md-4">
                                <div class="info-label">Dígito de Verificación</div>
                                <div class="info-value">{{ contract.owner?.verification_digit || 'N/A' }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tarjeta: Cuotas del Contrato -->
                <div class="card border-0 shadow-sm fade-in-up mb-4" style="animation-delay: 0.25s;">
                    <div class="card-header bg-light py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center gap-2">
                            <i class="fad fa-calendar-alt text-warning" aria-hidden="true"></i>
                            <h6 class="mb-0 fw-medium">Cronograma de Cuotas</h6>
                        </div>
                        <div class="d-flex gap-2">
                            <button type="button" class="btn btn-sm btn-outline-primary" @click="downloadPdf">
                                <i class="fad fa-file-pdf me-1" aria-hidden="true"></i>Descargar PDF
                            </button>
                        </div>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive scrollbar">
                            <table class="table table-sm mb-0 professional-table noa-table-fixed">
                                <thead>
                                    <tr>
                                        <th class="text-center" style="width: 7%;">N°</th>
                                        <th style="width: 17%;">Vencimiento</th>
                                        <th style="width: 21%;">Valor a Pagar</th>
                                        <th style="width: 16%;">Pagado</th>
                                        <th style="width: 16%;">Saldo Pendiente</th>
                                        <th style="width: 12%;">Estado</th>
                                        <th class="text-center" style="width: 11%;">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <template v-for="installment in installmentsSorted" :key="installment.uuid">
                                        <tr :class="{
                                            'table-danger': installment.status === 'overdue',
                                            'table-success': installment.status === 'paid',
                                            'table-warning': installment.status === 'partial'
                                        }">
                                            <td class="text-center fw-bold">
                                                <span>{{ installment.installment_number }}</span>
                                                <span v-if="currentInstallment?.uuid === installment.uuid"
                                                    class="badge bg-primary bg-opacity-10 text-primary d-block mt-1"
                                                    style="font-size: 0.65rem;">
                                                    Vigente
                                                </span>
                                            </td>
                                            <td>
                                                <div>{{ formatDate(installment.due_date) }}</div>
                                                <small v-if="installment.payment_date" class="text-muted d-block">
                                                    Pago: {{ formatDate(installment.payment_date) }}
                                                </small>
                                                <small v-if="installment.notes" class="text-muted fst-italic d-block text-truncate" style="max-width: 180px;" :title="installment.notes">
                                                    {{ installment.notes }}
                                                </small>
                                            </td>
                                            <td>
                                                <div class="fw-semibold">${{ formatCurrency(installment.net_amount) }}</div>
                                                <small v-if="Number(installment.previous_balance) > 0" class="text-muted d-block">
                                                    Saldo ant: +${{ formatCurrency(installment.previous_balance) }}
                                                </small>
                                                <small v-if="Number(installment.discount_amount) > 0" class="text-info d-block">
                                                    Desc: -${{ formatCurrency(installment.discount_amount) }}
                                                </small>
                                            </td>
                                            <td class="text-success fw-medium">${{ formatCurrency(installment.paid_amount) }}</td>
                                            <td :class="Number(installment.pending_balance) > 0 ? 'fw-bold text-danger' : 'text-muted'">
                                                ${{ formatCurrency(installment.pending_balance) }}
                                            </td>
                                            <td>
                                                <span class="badge rounded-pill" :class="{
                                                    'bg-success': installment.status === 'paid',
                                                    'bg-warning text-dark': installment.status === 'partial',
                                                    'bg-danger': installment.status === 'overdue',
                                                    'bg-secondary': installment.status === 'pending' || installment.status === 'cancelled'
                                                }">
                                                    {{ formatInstallmentStatus(installment.status) }}
                                                </span>
                                            </td>
                                            <td class="text-center">
                                                <button v-if="canPayInstallment(installment)"
                                                    type="button"
                                                    class="btn btn-sm btn-outline-primary"
                                                    title="Registrar pago"
                                                    @click="openPaymentDialog(installment)">
                                                    <i class="fad fa-money-bill-wave" aria-hidden="true"></i>
                                                </button>
                                                <span v-else-if="installment.status === 'paid'" class="text-success small">
                                                    <i class="fad fa-check-circle" aria-hidden="true"></i> Pagado
                                                </span>
                                                <span v-else-if="installment.status === 'partial'" class="text-muted small">
                                                    Trasladado
                                                </span>
                                                <span v-else class="text-muted small">-</span>
                                            </td>
                                        </tr>
                                    </template>
                                    <tr v-if="!contract.installments || contract.installments.length === 0">
                                        <td colspan="7" class="text-center text-muted py-4">
                                            No hay cuotas registradas
                                        </td>
                                    </tr>
                                </tbody>
                                <tfoot v-if="contract.installments && contract.installments.length > 0">
                                    <tr class="table-light fw-bold">
                                        <td colspan="2" class="text-end">TOTAL CONTRATO:</td>
                                        <td>${{ formatCurrency(totalContractAmount) }}</td>
                                        <td class="text-success">
                                            <div>${{ formatCurrency(totalPaidWithDiscounts) }}</div>
                                            <small v-if="totalDiscountsApplied > 0" class="text-muted fw-normal d-block" style="font-size: 0.7rem;">
                                                Efectivo: ${{ formatCurrency(totalPaid) }} + Desc: ${{ formatCurrency(totalDiscountsApplied) }}
                                            </small>
                                        </td>
                                        <td :class="totalPending > 0 ? 'text-danger' : 'text-success'">${{ formatCurrency(totalPending) }}</td>
                                        <td colspan="2"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Tarjeta: Registro de Descuentos -->
                <div class="card border-0 shadow-sm fade-in-up mb-4" style="animation-delay: 0.3s;">
                    <div class="card-header bg-light py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center gap-2">
                            <i class="fad fa-tags text-info" aria-hidden="true"></i>
                            <h6 class="mb-0 fw-medium">Registro de Descuentos</h6>
                            <span v-if="currentInstallment" class="badge bg-info bg-opacity-10 text-info">
                                Cuota vigente: #{{ currentInstallment.installment_number }} ({{ formatMonthYear(currentInstallment.due_date) }})
                            </span>
                        </div>
                        <button v-if="currentInstallment && contract.status === 'active' && can('rental_installments.update')"
                            type="button"
                            class="btn btn-sm btn-outline-info"
                            @click="openDiscountDialog">
                            <i class="fad fa-plus me-1" aria-hidden="true"></i>Registrar Descuento
                        </button>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive scrollbar">
                            <table class="table table-sm mb-0 professional-table noa-table-fixed">
                                <thead>
                                    <tr>
                                        <th style="width: 17%;">Mes / Cuota</th>
                                        <th style="width: 14%;">Fecha Descuento</th>
                                        <th style="width: 26%;">Concepto / Detalle</th>
                                        <th style="width: 15%;">Valor Descuento</th>
                                        <th style="width: 20%;">Observaciones</th>
                                        <th class="text-center" style="width: 8%;">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="discount in discountsList" :key="discount.uuid">
                                        <td>
                                            <span class="fw-medium">{{ formatMonthYear(discount.installment?.due_date) }}</span>
                                            <small v-if="discount.installment?.installment_number" class="text-muted d-block">
                                                Cuota #{{ discount.installment.installment_number }}
                                            </small>
                                        </td>
                                        <td>{{ formatDate(discount.discount_date) }}</td>
                                        <td class="fw-medium">{{ discount.concept }}</td>
                                        <td class="text-info fw-semibold">-${{ formatCurrency(discount.amount) }}</td>
                                        <td class="text-muted small">{{ discount.observations || '-' }}</td>
                                        <td class="text-center">
                                            <button v-if="canDeleteDiscount(discount)"
                                                type="button"
                                                class="btn btn-sm btn-outline-danger"
                                                title="Eliminar descuento"
                                                :disabled="isDeletingDiscount === discount.uuid"
                                                @click="handleDeleteDiscount(discount)">
                                                <i class="fad fa-trash-alt" aria-hidden="true"></i>
                                            </button>
                                            <span v-else class="text-muted small">-</span>
                                        </td>
                                    </tr>
                                    <tr v-if="discountsList.length === 0">
                                        <td colspan="6" class="text-center text-muted py-4">
                                            No hay descuentos registrados en este contrato
                                        </td>
                                    </tr>
                                </tbody>
                                <tfoot v-if="discountsList.length > 0">
                                    <tr class="table-light fw-bold">
                                        <td colspan="3" class="text-end">TOTAL DESCUENTOS:</td>
                                        <td class="text-info">-${{ formatCurrency(totalDiscounts) }}</td>
                                        <td colspan="2"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </template>

            <!-- Skeleton loader -->
            <div v-else-if="isLoading" class="card border-0 shadow-sm fade-in-up">
                <div class="card-body p-5 text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="mt-3 text-muted">Cargando detalles del contrato...</p>
                </div>
            </div>

        </div>
    </div>

    <!-- Diálogo para registrar abono -->
    <Dialog v-model:visible="paymentDialogVisible" modal :style="{ width: '540px' }" :breakpoints="{ '640px': '95vw' }">
        <template #header>
            <div class="d-flex align-items-center gap-2">
                <span class="rental-modal-icon bg-primary bg-opacity-10 text-primary">
                    <i class="fad fa-money-bill-wave" aria-hidden="true"></i>
                </span>
                <div>
                    <div class="fw-semibold lh-sm">Registrar Abono</div>
                    <small class="text-muted" v-if="selectedInstallment">
                        Cuota #{{ selectedInstallment.installment_number }} · {{ formatMonthYear(selectedInstallment.due_date) }}
                    </small>
                </div>
            </div>
        </template>

        <form id="rental-payment-form" @submit.prevent="submitPayment" novalidate>
            <!-- Resumen financiero de la cuota -->
            <div class="rental-summary-box mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                    <span class="text-muted small">Vencimiento</span>
                    <span class="fw-medium small">{{ formatDate(selectedInstallment?.due_date) }}</span>
                </div>
                <div class="d-flex justify-content-between small mb-1">
                    <span class="text-muted">
                        Valor cuota{{ Number(selectedInstallment?.previous_balance) > 0 ? ' (incluye saldo ant.)' : '' }}
                    </span>
                    <span class="font-monospace">${{ formatCurrency(paymentBaseAmount) }}</span>
                </div>
                <div class="d-flex justify-content-between small mb-1" v-if="Number(selectedInstallment?.discount_amount) > 0">
                    <span class="text-muted">Descuentos aplicados</span>
                    <span class="font-monospace text-info">-${{ formatCurrency(selectedInstallment?.discount_amount) }}</span>
                </div>
                <div class="d-flex justify-content-between small mb-1" v-if="paymentAlreadyPaid > 0">
                    <span class="text-muted">Ya pagado</span>
                    <span class="font-monospace text-success">${{ formatCurrency(paymentAlreadyPaid) }}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
                    <span class="fw-semibold small">Valor neto a pagar</span>
                    <span class="fs-6 fw-bold font-monospace text-dark">${{ formatCurrency(paymentCurrentRemaining) }}</span>
                </div>
            </div>

            <!-- Campos del formulario -->
            <div class="row g-3">
                <div class="col-12 col-sm-7">
                    <label class="form-label required" for="payment_amount">Abono a Registrar</label>
                    <div class="input-group">
                        <span class="input-group-text">$</span>
                        <input id="payment_amount" v-model.number="paymentForm.payment_amount" type="number"
                            class="form-control font-monospace" :class="{ 'is-invalid': paymentErrors.payment_amount }"
                            min="0" :max="paymentMaxAllowed" step="0.01" placeholder="0.00"
                            :aria-invalid="!!paymentErrors.payment_amount" />
                        <button type="button" class="btn btn-outline-secondary" title="Llenar con el saldo completo"
                            @click="paymentForm.payment_amount = paymentCurrentRemaining">
                            Total
                        </button>
                    </div>
                    <div v-if="paymentErrors.payment_amount" class="invalid-feedback d-block" role="alert">
                        {{ paymentErrors.payment_amount }}
                    </div>
                </div>
                <div class="col-12 col-sm-5">
                    <label class="form-label" for="payment_date">Fecha de Pago</label>
                    <DateInput id="payment_date" v-model="paymentForm.payment_date"
                        class="form-control" :class="{ 'is-invalid': paymentErrors.payment_date }"
                        placeholder="YYYY-MM-DD" />
                    <div v-if="paymentErrors.payment_date" class="invalid-feedback d-block" role="alert">
                        {{ paymentErrors.payment_date }}
                    </div>
                </div>
                <div class="col-12">
                    <label class="form-label" for="payment_notes">Notas / Referencia</label>
                    <textarea id="payment_notes" v-model="paymentForm.notes" class="form-control" rows="2" maxlength="500"
                        placeholder="Ej: Transferencia Bancolombia #1234, pago en efectivo..."></textarea>
                    <div class="text-end text-muted" style="font-size: 0.72rem;">
                        {{ (paymentForm.notes || '').length }} / 500
                    </div>
                </div>
            </div>

            <!-- Resultado en vivo del pago -->
            <div v-if="paymentExcess > 0" class="alert alert-info d-flex align-items-start gap-2 py-2 px-3 mt-3 mb-0 small" role="status">
                <i class="fad fa-forward mt-1" aria-hidden="true"></i>
                <div>
                    <div class="fw-semibold">
                        Saldo a favor de <span class="font-monospace">${{ formatCurrency(paymentExcess) }}</span>.
                    </div>
                    <div>
                        Liquidará la cuota #{{ selectedInstallment?.installment_number }} como <strong>Pagado</strong> y el saldo a favor se aplicará automáticamente como abono adelantado a la(s) cuota(s) siguiente(s).
                    </div>
                </div>
            </div>
            <div v-else-if="paymentPreviewPending <= 0" class="alert alert-success d-flex align-items-start gap-2 py-2 px-3 mt-3 mb-0 small" role="status">
                <i class="fad fa-check-circle mt-1" aria-hidden="true"></i>
                <div>
                    <div class="fw-semibold">La cuota #{{ selectedInstallment?.installment_number }} quedará en estado Pagado.</div>
                    <div v-if="hasPreviousPartialInstallment" class="text-success-emphasis">
                        También se marcará como <strong>Pagado</strong> la cuota anterior cuyo saldo venía trasladado.
                    </div>
                </div>
            </div>
            <div v-else class="alert alert-warning d-flex align-items-start gap-2 py-2 px-3 mt-3 mb-0 small" role="status">
                <i class="fad fa-exclamation-triangle mt-1" aria-hidden="true"></i>
                <div>
                    <div class="fw-semibold">
                        Abono parcial: quedará un saldo de <span class="font-monospace">${{ formatCurrency(paymentPreviewPending) }}</span>.
                    </div>
                    <div v-if="selectedInstallment && selectedInstallment.installment_number < lastInstallmentNumber">
                        Esta cuota se cerrará como <strong>Parcial</strong> y el saldo pasará automáticamente a la cuota #{{ selectedInstallment.installment_number + 1 }}.
                    </div>
                </div>
            </div>
        </form>

        <template #footer>
            <button type="button" class="btn btn-light border" @click="paymentDialogVisible = false" :disabled="isProcessingPayment">
                Cancelar
            </button>
            <button type="submit" form="rental-payment-form" class="btn btn-primary" :disabled="isProcessingPayment">
                <span v-if="isProcessingPayment" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                <i v-else class="fad fa-check me-1" aria-hidden="true"></i>
                {{ isProcessingPayment ? 'Procesando...' : 'Confirmar Abono' }}
            </button>
        </template>
    </Dialog>

    <!-- Diálogo para registrar descuento -->
    <Dialog v-model:visible="discountDialogVisible" modal :style="{ width: '540px' }" :breakpoints="{ '640px': '95vw' }">
        <template #header>
            <div class="d-flex align-items-center gap-2">
                <span class="rental-modal-icon bg-info bg-opacity-10 text-info">
                    <i class="fad fa-tags" aria-hidden="true"></i>
                </span>
                <div>
                    <div class="fw-semibold lh-sm">Registrar Descuento</div>
                    <small class="text-muted" v-if="currentInstallment">
                        Se aplicará a la cuota vigente #{{ currentInstallment.installment_number }} · {{ formatMonthYear(currentInstallment.due_date) }}
                    </small>
                </div>
            </div>
        </template>

        <form id="rental-discount-form" @submit.prevent="submitDiscount" novalidate>
            <!-- Resumen en vivo de la cuota vigente -->
            <div class="rental-summary-box mb-3" v-if="currentInstallment">
                <div class="d-flex justify-content-between small mb-1">
                    <span class="text-muted">Cuota vigente</span>
                    <span class="fw-semibold">#{{ currentInstallment.installment_number }} ({{ formatMonthYear(currentInstallment.due_date) }})</span>
                </div>
                <div class="d-flex justify-content-between small mb-1">
                    <span class="text-muted">Valor neto actual</span>
                    <span class="font-monospace">${{ formatCurrency(currentInstallment.net_amount) }}</span>
                </div>
                <div class="d-flex justify-content-between small mb-1" v-if="Number(discountForm.amount) > 0">
                    <span class="text-muted">Este descuento</span>
                    <span class="font-monospace text-info">-${{ formatCurrency(discountForm.amount) }}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
                    <span class="fw-semibold small">Nuevo valor neto de la cuota</span>
                    <span class="fs-6 fw-bold font-monospace text-primary">${{ formatCurrency(discountPreviewNet) }}</span>
                </div>
            </div>

            <!-- Campos del formulario -->
            <div class="row g-3">
                <div class="col-12 col-sm-7">
                    <label class="form-label" for="discount_month">Mes (Cuota vigente)</label>
                    <input id="discount_month" type="text" class="form-control bg-light"
                        :value="currentInstallment ? `${formatMonthYear(currentInstallment.due_date)} — Cuota #${currentInstallment.installment_number}` : ''"
                        readonly disabled />
                </div>
                <div class="col-12 col-sm-5">
                    <label class="form-label required" for="discount_date">Fecha Descuento</label>
                    <DateInput id="discount_date" v-model="discountForm.discount_date"
                        class="form-control" :class="{ 'is-invalid': discountErrors.discount_date }"
                        placeholder="YYYY-MM-DD" />
                    <div v-if="discountErrors.discount_date" class="invalid-feedback d-block" role="alert">
                        {{ discountErrors.discount_date }}
                    </div>
                </div>
                <div class="col-12">
                    <label class="form-label required" for="discount_concept">Concepto / Detalle</label>
                    <input id="discount_concept" v-model.trim="discountForm.concept" type="text"
                        class="form-control" :class="{ 'is-invalid': discountErrors.concept }"
                        maxlength="255" placeholder="Ej: Mantenimiento preventivo, cambio de llantas, repuestos..." />
                    <div v-if="discountErrors.concept" class="invalid-feedback d-block" role="alert">
                        {{ discountErrors.concept }}
                    </div>
                </div>
                <div class="col-12">
                    <label class="form-label required" for="discount_amount">Valor Descuento</label>
                    <div class="input-group">
                        <span class="input-group-text">$</span>
                        <input id="discount_amount" v-model.number="discountForm.amount" type="number"
                            class="form-control font-monospace" :class="{ 'is-invalid': discountErrors.amount }"
                            min="0.01" :max="discountMaxAllowed" step="0.01" placeholder="0.00" />
                    </div>
                    <small class="form-text text-muted d-block mt-1">
                        Máximo disponible en cuota vigente: <span class="font-monospace">${{ formatCurrency(discountMaxAllowed) }}</span>
                    </small>
                    <div v-if="discountErrors.amount" class="invalid-feedback d-block" role="alert">
                        {{ discountErrors.amount }}
                    </div>
                </div>
                <div class="col-12">
                    <label class="form-label" for="discount_observations">Observaciones</label>
                    <textarea id="discount_observations" v-model="discountForm.observations" class="form-control"
                        rows="2" maxlength="1000" placeholder="Número de factura, taller, soporte o nota adicional..."></textarea>
                    <div class="text-end text-muted" style="font-size: 0.72rem;">
                        {{ (discountForm.observations || '').length }} / 1000
                    </div>
                </div>
            </div>
        </form>

        <template #footer>
            <button type="button" class="btn btn-light border" @click="discountDialogVisible = false" :disabled="isProcessingDiscount">
                Cancelar
            </button>
            <button type="submit" form="rental-discount-form" class="btn btn-primary" :disabled="isProcessingDiscount">
                <span v-if="isProcessingDiscount" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                <i v-else class="fad fa-check me-1" aria-hidden="true"></i>
                {{ isProcessingDiscount ? 'Guardando...' : 'Guardar Descuento' }}
            </button>
        </template>
    </Dialog>

</template>

<script setup>
import { logger } from '@/utils/logger.js';
import { confirmar } from '@/utils/toast.js';
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { usePermissionsStore } from '@store';
import { useRentalContractsStore } from '../store/rentalContracts.store.js';
import Dialog from 'primevue/dialog';
import BasePageHeader from '@/components/BasePageHeader.vue';
import DateInput from '@/components/form/DateInput.vue';

const router = useRouter();
const route = useRoute();
const store = useRentalContractsStore();
const permissionsStore = usePermissionsStore();
const can = (action) => permissionsStore.can(action);

const isLoading = ref(true);
const errorMessage = ref('');
const contract = ref(null);
const paymentDialogVisible = ref(false);
const selectedInstallment = ref(null);
const isProcessingPayment = ref(false);
const paymentErrors = reactive({});

const discountDialogVisible = ref(false);
const isProcessingDiscount = ref(false);
const isDeletingDiscount = ref(null);
const discountErrors = reactive({});

// Formulario de pago
const paymentForm = reactive({
    payment_amount: 0,
    payment_date: '',
    notes: ''
});

// Formulario de descuento
const discountForm = reactive({
    discount_date: '',
    concept: '',
    amount: null,
    observations: ''
});

// Propiedades computadas
const installmentsSorted = computed(() => {
    return [...(contract.value?.installments ?? [])].sort((a, b) => a.installment_number - b.installment_number);
});

const totalContractAmount = computed(() => {
    return contract.value?.installments?.reduce((sum, i) => sum + Number(i.gross_amount || 0), 0) || 0;
});

const totalDiscountsApplied = computed(() => {
    return contract.value?.installments?.reduce((sum, i) => sum + Number(i.discount_amount || 0), 0) || 0;
});

const totalPaid = computed(() => {
    return contract.value?.installments?.reduce((sum, i) => sum + Number(i.paid_amount || 0), 0) || 0;
});

const totalPaidWithDiscounts = computed(() => {
    return totalPaid.value + totalDiscountsApplied.value;
});

const totalPending = computed(() => {
    return Math.max(0, totalContractAmount.value - totalPaidWithDiscounts.value);
});

const paymentBaseAmount = computed(() => {
    if (!selectedInstallment.value) return 0;
    return Number(selectedInstallment.value.gross_amount || 0) + Number(selectedInstallment.value.previous_balance || 0);
});

const paymentPreviewNet = computed(() => {
    const existingDiscount = Number(selectedInstallment.value?.discount_amount || 0);
    return Math.max(0, paymentBaseAmount.value - existingDiscount);
});

const paymentAlreadyPaid = computed(() => {
    return Number(selectedInstallment.value?.paid_amount || 0);
});

const paymentCurrentRemaining = computed(() => {
    return Math.max(0, paymentPreviewNet.value - paymentAlreadyPaid.value);
});

const paymentPreviewPending = computed(() => {
    return Math.max(0, paymentCurrentRemaining.value - (Number(paymentForm.payment_amount) || 0));
});

const paymentExcess = computed(() => {
    return Math.max(0, (Number(paymentForm.payment_amount) || 0) - paymentCurrentRemaining.value);
});

const paymentMaxAllowed = computed(() => {
    if (!selectedInstallment.value) return 0;
    const currentNum = selectedInstallment.value.installment_number;
    const nextRemaining = installmentsSorted.value
        .filter((i) => i.installment_number > currentNum)
        .reduce((sum, i) => sum + Math.max(0, (Number(i.gross_amount) - Number(i.discount_amount)) - Number(i.paid_amount)), 0);
    return paymentCurrentRemaining.value + nextRemaining;
});

const hasPreviousPartialInstallment = computed(() => {
    if (!selectedInstallment.value) return false;
    return installmentsSorted.value.some(
        (i) => i.installment_number < selectedInstallment.value.installment_number && i.status === 'partial'
    );
});

const lastInstallmentNumber = computed(() => {
    const list = installmentsSorted.value;
    return list.length > 0 ? list[list.length - 1].installment_number : 0;
});

const isPartialClosed = (installment) => {
    if (installment.status !== 'partial') return false;
    const next = installmentsSorted.value.find((i) => i.installment_number === installment.installment_number + 1);
    return !!next && Number(next.previous_balance || 0) > 0;
};

const currentInstallment = computed(() => {
    return installmentsSorted.value.find((inst) => (
        inst.status === 'pending'
        || inst.status === 'overdue'
        || (inst.status === 'partial' && !isPartialClosed(inst))
    )) || null;
});

const discountsList = computed(() => contract.value?.discounts ?? []);

const totalDiscounts = computed(() => {
    return discountsList.value.reduce((sum, d) => sum + Number(d.amount || 0), 0);
});

const discountMaxAllowed = computed(() => {
    if (!currentInstallment.value) return 0;
    return Math.max(0, Number(currentInstallment.value.pending_balance || 0));
});

const discountPreviewNet = computed(() => {
    if (!currentInstallment.value) return 0;
    return Math.max(0, Number(currentInstallment.value.net_amount || 0) - (Number(discountForm.amount) || 0));
});

const canDeleteDiscount = (discount) => {
    if (!can('rental_installments.update') || contract.value?.status !== 'active') return false;
    return !!currentInstallment.value && discount.rental_installment_uuid === currentInstallment.value.uuid;
};

const canPayInstallment = (installment) => {
    if (!can('rental_installments.update') || contract.value?.status === 'cancelled') return false;
    if (installment.status === 'paid') return false;
    // Una cuota parcial con saldo ya trasladado al mes siguiente queda cerrada
    if (isPartialClosed(installment)) {
        return false;
    }
    return true;
};

// Breadcrumbs dinámicas
const breadcrumbs = computed(() => [
    { label: 'Vehículos', to: { name: 'rentalContracts.list' } },
    { label: 'Alquiler', to: { name: 'rentalContracts.list' } },
    { label: contract.value?.vehicle?.vehicle_license_plate || 'Contrato' }
]);

// Métodos
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
    const label = date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long' });
    return label.charAt(0).toUpperCase() + label.slice(1);
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
};

const formatStatus = (status) => {
    const statuses = {
        'active': 'Activo',
        'finished': 'Finalizado',
        'cancelled': 'Cancelado'
    };
    return statuses[status] || status;
};

const formatInstallmentStatus = (status) => {
    const statuses = {
        'pending': 'Pendiente',
        'partial': 'Parcial',
        'paid': 'Pagado',
        'overdue': 'Vencido',
        'cancelled': 'Cancelado'
    };
    return statuses[status] || status;
};

const loadContract = async () => {
    isLoading.value = true;
    errorMessage.value = '';

    try {
        const uuid = route.params.id;
        await store.fetchProfileById(uuid);
        contract.value = store.selectedItem;

        if (!contract.value) {
            errorMessage.value = 'No se encontró el contrato seleccionado';
        }
    } catch (error) {
        logger.error('Error al cargar el contrato:', error);
        errorMessage.value = 'Error al cargar los datos del contrato';
    } finally {
        isLoading.value = false;
    }
};

const clearErrors = (obj) => {
    Object.keys(obj).forEach((k) => delete obj[k]);
};

const openPaymentDialog = (installment) => {
    selectedInstallment.value = installment;
    clearErrors(paymentErrors);
    const base = Number(installment.gross_amount || 0) + Number(installment.previous_balance || 0);
    const remaining = Math.max(0, (base - Number(installment.discount_amount || 0)) - Number(installment.paid_amount || 0));
    paymentForm.payment_amount = remaining;
    paymentForm.payment_date = new Date().toISOString().split('T')[0];
    paymentForm.notes = installment.notes || '';
    paymentDialogVisible.value = true;
};

const submitPayment = async () => {
    if (!selectedInstallment.value) return;

    clearErrors(paymentErrors);
    const abono = Number(paymentForm.payment_amount);

    if (Number.isNaN(abono) || abono < 0) {
        paymentErrors.payment_amount = 'Ingrese un monto válido mayor o igual a cero.';
        return;
    }

    if (abono > paymentMaxAllowed.value + 0.001) {
        paymentErrors.payment_amount = 'El monto pagado supera el saldo pendiente total del contrato.';
        return;
    }

    isProcessingPayment.value = true;

    try {
        const payload = {
            payment_amount: abono,
            payment_date: paymentForm.payment_date || null,
            notes: paymentForm.notes || null
        };

        await store.updateInstallment(selectedInstallment.value.uuid, payload);

        // Recargar el contrato completo
        await loadContract();

        paymentDialogVisible.value = false;
    } catch {
        // El store ya mostró el toast de error.
    } finally {
        isProcessingPayment.value = false;
    }
};

const openDiscountDialog = () => {
    if (!currentInstallment.value) return;
    clearErrors(discountErrors);
    discountForm.discount_date = new Date().toISOString().split('T')[0];
    discountForm.concept = '';
    discountForm.amount = null;
    discountForm.observations = '';
    discountDialogVisible.value = true;
};

const submitDiscount = async () => {
    if (!currentInstallment.value) return;

    clearErrors(discountErrors);
    const amount = Number(discountForm.amount) || 0;

    if (!discountForm.discount_date) {
        discountErrors.discount_date = 'Seleccione la fecha del descuento.';
    }

    if (!discountForm.concept) {
        discountErrors.concept = 'Ingrese el concepto o detalle del descuento.';
    }

    if (amount <= 0) {
        discountErrors.amount = 'El valor del descuento debe ser mayor a cero.';
    } else if (amount > discountMaxAllowed.value + 0.001) {
        discountErrors.amount = 'El valor del descuento supera el saldo disponible de la cuota vigente.';
    }

    if (Object.keys(discountErrors).length > 0) return;

    isProcessingDiscount.value = true;

    try {
        await store.createDiscount(contract.value.uuid, {
            discount_date: discountForm.discount_date,
            concept: discountForm.concept,
            amount,
            observations: discountForm.observations || null
        });

        await loadContract();
        discountDialogVisible.value = false;
    } catch {
        // El store ya mostró el toast de error.
    } finally {
        isProcessingDiscount.value = false;
    }
};

const escapeHtml = (str) => String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const handleDeleteDiscount = async (discount) => {
    const ok = await confirmar({
        title: '¿Eliminar descuento?',
        html: `Se eliminará <strong>${escapeHtml(discount.concept)}</strong> por <strong>$${formatCurrency(discount.amount)}</strong> y se recalculará la cuota vigente.`,
        icon: 'warning',
        confirmText: 'Sí, eliminar',
        cancelText: 'Cancelar',
        confirmColor: '#dc3545',
    });

    if (!ok) return;

    isDeletingDiscount.value = discount.uuid;
    try {
        await store.deleteDiscount(discount.uuid);
        await loadContract();
    } catch {
        // El store ya mostró el toast de error.
    } finally {
        isDeletingDiscount.value = null;
    }
};

const downloadPdf = () => store.downloadPdf(route.params.id);

const goBack = () => {
    router.back();
};

// Watcher para recargar cuando cambie el ID en la URL
watch(() => route.params.id, (newId, oldId) => {
    if (newId !== oldId) {
        loadContract();
    }
});

onMounted(() => {
    loadContract();
});
</script>

<style scoped>
.fade-in-up {
    animation: fadeInUp 0.4s ease-out forwards;
}

.info-label {
    font-size: 0.8rem;
    color: #6c757d;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.25rem;
}

.info-value {
    font-size: 0.95rem;
    color: #212529;
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
