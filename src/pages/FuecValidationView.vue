<template>
    <div class="fuec-detail-wrapper fade-in-up" :class="{ 'qr-access': accessedViaQR }">
        <div class="container-xxl px-3 px-md-4 py-3 py-md-4">

            <!-- ===== HERO BANNER ===== -->
            <div class="card hero-card border-0 shadow-lg mb-4 overflow-hidden bg-primary bg-gradient text-white">
                <div class="card-body position-relative p-3 p-sm-4">
                    <div class="bg-holder opacity-10"
                        style="background-image: url(/assets/img/icons/spot-illustrations/corner-4.png);"></div>

                    <div class="row align-items-center g-3 position-relative">
                        <!-- Icono + Título -->
                        <div class="col-12 col-md">
                            <div class="d-flex align-items-center gap-3">
                                <div class="hero-icon bg-white text-primary rounded-circle d-flex align-items-center justify-content-center shadow flex-shrink-0">
                                    <i class="fad fa-file-contract" aria-hidden="true"></i>
                                </div>
                                <div class="min-w-0 flex-grow-1">
                                    <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
                                        <span class="badge bg-white bg-opacity-25 text-white fw-normal px-2 py-1 rounded-pill" style="font-size: 0.7rem;">
                                            EXTRACTO DE CONTRATO (FUEC)
                                        </span>
                                        <span v-if="accessedViaQR"
                                            class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill shadow-sm badge-qr-verified"
                                            style="font-size: 0.7rem;">
                                            <i class="fad fa-qrcode me-1" aria-hidden="true"></i>Verificado por QR
                                        </span>
                                    </div>
                                    <h2 class="hero-title mb-1 fw-bold text-break">N.º {{ currentFuecData?.number_fuec || '---' }}</h2>
                                    <p class="mb-0 opacity-75 small text-break">
                                        <i class="fad fa-hashtag me-1" aria-hidden="true"></i>Solicitud: {{ currentFuecData?.request_number || '-' }}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Estado + Código de verificación -->
                        <div class="col-12 col-md-auto">
                            <div class="hero-meta d-flex flex-wrap flex-md-column align-items-center align-items-md-end justify-content-between gap-2 pt-2 pt-md-0 border-top border-white border-opacity-25 border-md-0">
                                <div class="d-flex align-items-center gap-2">
                                    <span class="badge bg-white text-primary fs-6 px-3 py-2 rounded-pill shadow-sm">
                                        <i :class="currentFuecData?.status === 'ACTIVO' ? 'fad fa-check-circle text-success me-1' : 'fad fa-circle me-1'" aria-hidden="true"></i>
                                        {{ currentFuecData?.status || '---' }}
                                    </span>
                                </div>
                                <div class="text-white-50 small">
                                    <i class="fad fa-calendar-alt me-1" aria-hidden="true"></i>Emitido: {{ formatDate(currentFuecData?.created_at) }}
                                </div>
                                <div class="verification-code">
                                    <small class="text-white-50 d-block" style="font-size: 0.68rem;">Código de Verificación</small>
                                    <span class="fw-bold font-monospace">{{ currentFuecData?.verification_code || '-' }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ===== ALERTA DE ERROR ===== -->
            <div v-if="errorMsg" class="alert alert-danger border-0 shadow-sm mb-4 d-flex align-items-center gap-3">
                <i class="fad fa-exclamation-triangle fs-4" aria-hidden="true"></i>
                <div>
                    <h6 class="mb-0 fw-semibold">Error de Validación</h6>
                    <small>{{ errorMsg }}</small>
                </div>
            </div>

            <!-- ===== SKELETON LOADING ===== -->
            <div v-if="loading" class="row g-4">
                <div class="col-lg-8">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body py-4">
                            <div class="skeleton-text" style="height: 24px; width: 50%; margin-bottom: 1.5rem;"></div>
                            <div class="row g-3">
                                <div class="col-12 col-sm-6" v-for="i in 8" :key="i">
                                    <div class="skeleton-text" style="height: 14px; width: 70%;"></div>
                                    <div class="skeleton-text mt-1" style="height: 18px; width: 85%;"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body py-4">
                            <div class="skeleton-text" style="height: 24px; width: 60%; margin-bottom: 1rem;"></div>
                            <div class="skeleton-text" style="height: 120px; width: 100%;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ===== CONTENIDO PRINCIPAL ===== -->
            <div v-else class="row g-3 g-lg-4">

                <!-- COLUMNA IZQUIERDA (Principal) -->
                <div class="col-12 col-lg-8 d-flex flex-column gap-3 gap-lg-4">

                    <!-- VIGENCIA Y RECORRIDO -->
                    <div class="card border-0 shadow-sm">
                        <div class="card-header bg-white border-bottom py-3 px-3 px-sm-4">
                            <div class="d-flex align-items-center gap-2">
                                <div class="section-icon bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                                    <i class="fad fa-route text-primary" aria-hidden="true"></i>
                                </div>
                                <h6 class="mb-0 fw-semibold">Vigencia y Recorrido</h6>
                            </div>
                        </div>
                        <div class="card-body p-3 p-sm-4">
                            <div class="row g-3">
                                <div class="col-12 col-sm-6">
                                    <div class="info-tile p-3 rounded-3 bg-light h-100">
                                        <div class="form-label text-muted small mb-1 d-block">Fecha Inicial</div>
                                        <div class="d-flex align-items-center gap-2 fs-7">
                                            <i class="fad fa-play-circle text-success flex-shrink-0" aria-hidden="true"></i>
                                            <span class="fw-semibold text-dark">{{ formatDate(currentFuecData?.effective_date) }}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 col-sm-6">
                                    <div class="info-tile p-3 rounded-3 bg-light h-100">
                                        <div class="form-label text-muted small mb-1 d-block">Fecha Final</div>
                                        <div class="d-flex flex-wrap align-items-center gap-2 fs-7">
                                            <span class="d-inline-flex align-items-center gap-2">
                                                <i class="fad fa-stop-circle text-danger flex-shrink-0" aria-hidden="true"></i>
                                                <span class="fw-semibold text-dark">{{ formatDate(currentFuecData?.expiration_date) }}</span>
                                            </span>
                                            <span v-if="isExpiringSoon(currentFuecData?.expiration_date)"
                                                class="badge bg-warning-subtle text-warning border border-warning-subtle"
                                                style="font-size: 0.65rem;">
                                                <i class="fad fa-exclamation-triangle me-1" aria-hidden="true"></i>Próximo a vencer
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-label text-muted small mb-2 d-block">Ruta del Servicio</div>
                                    <div class="route-box p-3 bg-light rounded-3">
                                        <div class="route-endpoint">
                                            <div class="route-pin bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                                                <i class="fad fa-map-marker-alt" aria-hidden="true"></i>
                                            </div>
                                            <div class="min-w-0">
                                                <span class="form-label text-muted d-block mb-0">Origen</span>
                                                <div class="fw-semibold fs-7 text-dark text-break">{{ currentFuecData?.origin_route || '-' }}</div>
                                            </div>
                                        </div>
                                        <div class="route-connector" aria-hidden="true">
                                            <i class="fad fa-long-arrow-right text-muted" aria-hidden="true"></i>
                                        </div>
                                        <div class="route-endpoint route-endpoint-end">
                                            <div class="route-pin bg-success text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                                                <i class="fad fa-flag-checkered" aria-hidden="true"></i>
                                            </div>
                                            <div class="min-w-0">
                                                <span class="form-label text-muted d-block mb-0">Destino</span>
                                                <div class="fw-semibold fs-7 text-dark text-break">{{ currentFuecData?.destination_route || '-' }}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- EMPRESA DE TRANSPORTE -->
                    <div class="card border-0 shadow-sm">
                        <div class="card-header bg-white border-bottom py-3 px-3 px-sm-4">
                            <div class="d-flex align-items-center gap-2">
                                <div class="section-icon bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                                    <i class="fad fa-building text-primary" aria-hidden="true"></i>
                                </div>
                                <h6 class="mb-0 fw-semibold">Empresa de Transporte</h6>
                            </div>
                        </div>
                        <div class="card-body p-3 p-sm-4">
                            <div class="row g-3 g-md-4 align-items-center">
                                <div class="col-12 col-sm-4 text-center">
                                    <div v-if="currentFuecData?.company?.logo_url && !logoFailed" class="p-2 bg-light rounded-3 border d-inline-flex align-items-center justify-content-center w-100" style="min-height: 88px;">
                                        <img :src="getMediaUrl(currentFuecData.company.logo_url)" @error="logoFailed = true"
                                            :alt="currentFuecData.company.business_name"
                                            class="img-fluid rounded-2"
                                            style="max-height: 76px; object-fit: contain;">
                                    </div>
                                    <div v-else
                                        class="bg-light rounded-3 d-flex align-items-center justify-content-center"
                                        style="height: 88px;">
                                        <i class="fad fa-building fs-2 text-muted opacity-50" aria-hidden="true"></i>
                                    </div>
                                </div>
                                <div class="col-12 col-sm-8">
                                    <div class="small fw-semibold text-dark mb-2 text-break">{{ currentFuecData?.company?.business_name || '-' }}</div>
                                    <div class="row g-2 fs-7">
                                        <div class="col-12 col-sm-6">
                                            <div class="form-label text-muted d-block">NIT</div>
                                            <span class="font-monospace fw-medium text-dark">{{ currentFuecData?.company?.document_number }}-{{ currentFuecData?.company?.verification_digit }}</span>
                                        </div>
                                        <div class="col-12 col-sm-6">
                                            <div class="form-label text-muted d-block">Teléfono</div>
                                            <a v-if="currentFuecData?.company?.phone" :href="`tel:${currentFuecData.company.phone}`"
                                                class="text-decoration-none font-monospace">{{ currentFuecData.company.phone }}</a>
                                            <span v-else>-</span>
                                        </div>
                                        <div class="col-12 col-sm-6">
                                            <div class="form-label text-muted d-block">Dirección</div>
                                            <span class="text-dark text-break">{{ currentFuecData?.company?.address || '-' }}</span>
                                        </div>
                                        <div class="col-12 col-sm-6">
                                            <div class="form-label text-muted d-block">Email</div>
                                            <a v-if="currentFuecData?.company?.email" :href="`mailto:${currentFuecData.company.email}`"
                                                class="text-decoration-none text-break">{{ currentFuecData.company.email }}</a>
                                            <span v-else>-</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- CONTRATANTE -->
                    <div class="card border-0 shadow-sm">
                        <div class="card-header bg-white border-bottom py-3 px-3 px-sm-4">
                            <div class="d-flex align-items-center gap-2">
                                <div class="section-icon bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                                    <i class="fad fa-user-tie text-primary" aria-hidden="true"></i>
                                </div>
                                <h6 class="mb-0 fw-semibold">Contratante</h6>
                            </div>
                        </div>
                        <div class="card-body p-3 p-sm-4">
                            <div class="row g-3">
                                <div class="col-12 col-sm-6">
                                    <div class="form-label text-muted small mb-1 d-block">Nombre / Razón Social</div>
                                    <div class="fs-7 fw-semibold text-dark text-break">{{ currentFuecData?.contractor?.company_name || '-' }}</div>
                                </div>
                                <div class="col-12 col-sm-6">
                                    <div class="form-label text-muted small mb-1 d-block">Documento (NIT / CC)</div>
                                    <div class="font-monospace fs-7 text-dark">{{ currentFuecData?.contractor?.document_number || '-' }}</div>
                                </div>
                                <div class="col-12 col-sm-6">
                                    <div class="form-label text-muted small mb-1 d-block">Responsable del Contratante</div>
                                    <div class="fs-7 text-dark text-break">{{ currentFuecData?.contractor?.responsible_name || '-' }}</div>
                                </div>
                                <div class="col-12 col-sm-6">
                                    <div class="form-label text-muted small mb-1 d-block">Documento del Responsable</div>
                                    <div class="font-monospace fs-7 text-dark">{{ currentFuecData?.contractor?.responsible_document || '-' }}</div>
                                </div>
                                <div class="col-12 col-sm-6">
                                    <div class="form-label text-muted small mb-1 d-block">Teléfono</div>
                                    <div class="fs-7">
                                        <a v-if="currentFuecData?.contractor?.responsible_phone"
                                            :href="`tel:${currentFuecData.contractor.responsible_phone}`"
                                            class="text-decoration-none font-monospace">{{ currentFuecData.contractor.responsible_phone }}</a>
                                        <span v-else>-</span>
                                    </div>
                                </div>
                                <div class="col-12 col-sm-6">
                                    <div class="form-label text-muted small mb-1 d-block">Dirección</div>
                                    <div class="fs-7 text-dark text-break">{{ currentFuecData?.contractor?.responsible_address || '-' }}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- VEHÍCULO ASIGNADO -->
                    <div class="card border-0 shadow-sm">
                        <div class="card-header bg-white border-bottom py-3 px-3 px-sm-4">
                            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                                <div class="d-flex align-items-center gap-2">
                                    <div class="section-icon bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                                        <i class="fad fa-car text-primary" aria-hidden="true"></i>
                                    </div>
                                    <h6 class="mb-0 fw-semibold">Vehículo Asignado</h6>
                                </div>
                                <span class="badge bg-info-subtle text-info border border-info-subtle rounded-pill px-2 py-1 fs-7">
                                    <i class="fad fa-id-card me-1" aria-hidden="true"></i>
                                    Tarjeta Op.: <span class="font-monospace">{{ currentFuecData?.vehicle?.operation_cards?.[0]?.operating_card_number || '-' }}</span>
                                </span>
                            </div>
                        </div>
                        <div class="card-body p-3 p-sm-4">
                            <div class="d-flex flex-wrap align-items-center gap-3 gap-sm-4">
                                <div class="colombian-plate flex-shrink-0" role="img" :aria-label="`Placa ${currentFuecData?.vehicle?.vehicle_license_plate || 'sin registrar'}`">
                                    <div class="plate-inner">
                                        <span class="plate-bolt plate-bolt-tl" aria-hidden="true"></span>
                                        <span class="plate-bolt plate-bolt-tr" aria-hidden="true"></span>
                                        <div class="plate-number">{{ formatPlate(currentFuecData?.vehicle?.vehicle_license_plate) }}</div>
                                        <div class="plate-country">COLOMBIA</div>
                                        <span class="plate-bolt plate-bolt-bl" aria-hidden="true"></span>
                                        <span class="plate-bolt plate-bolt-br" aria-hidden="true"></span>
                                    </div>
                                </div>
                                <div class="flex-grow-1 min-w-0">
                                    <div class="row g-3">
                                        <div class="col-6 col-sm-3">
                                            <div class="form-label text-muted d-block">Marca / Línea</div>
                                            <span class="fw-semibold text-dark fs-7">{{ currentFuecData?.vehicle?.brand?.description || '-' }} {{ currentFuecData?.vehicle?.line || '' }}</span>
                                        </div>
                                        <div class="col-6 col-sm-3">
                                            <div class="form-label text-muted d-block">Modelo</div>
                                            <span class="fw-semibold text-dark font-monospace fs-7">{{ currentFuecData?.vehicle?.model || '-' }}</span>
                                        </div>
                                        <div class="col-6 col-sm-3">
                                            <div class="form-label text-muted d-block">Clase</div>
                                            <span class="fw-semibold text-dark fs-7">{{ currentFuecData?.vehicle?.vehicle_class?.description || '-' }}</span>
                                        </div>
                                        <div class="col-6 col-sm-3">
                                            <div class="form-label text-muted d-block">N.º Interno</div>
                                            <span class="fw-semibold text-dark font-monospace fs-7">{{ currentFuecData?.vehicle?.internal_number || '-' }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- CONVENIO DE COLABORACIÓN EMPRESARIAL -->
                    <div v-if="convenios.length" class="card border-0 shadow-sm">
                        <div class="card-header bg-white border-bottom py-3 px-3 px-sm-4">
                            <div class="d-flex align-items-center gap-2">
                                <div class="section-icon bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                                    <i class="fad fa-handshake text-primary" aria-hidden="true"></i>
                                </div>
                                <h6 class="mb-0 fw-semibold">Convenio de Colaboración Empresarial</h6>
                            </div>
                        </div>
                        <div class="card-body p-3 p-sm-4">
                            <div v-for="(convenio, i) in convenios" :key="convenio.uuid || i"
                                class="row g-3" :class="{ 'mb-3 pb-3 border-bottom': i < convenios.length - 1 }">
                                <div class="col-12 col-sm-6">
                                    <div class="form-label text-muted small mb-1 d-block">Entidad</div>
                                    <div class="fs-7 fw-medium text-dark text-break">{{ convenio.contracting_entity_name || '-' }}</div>
                                </div>
                                <div class="col-12 col-sm-6">
                                    <div class="form-label text-muted small mb-1 d-block">NIT</div>
                                    <div class="font-monospace fs-7 text-dark">{{ convenio.contracting_entity_nit || '-' }}</div>
                                </div>
                                <div class="col-12 col-sm-6">
                                    <div class="form-label text-muted small mb-1 d-block">N.º de Resolución / Convenio</div>
                                    <div class="font-monospace fs-7 text-dark">{{ convenio.resolution_number || convenio.agreement_internal_id || '-' }}</div>
                                </div>
                                <div class="col-12 col-sm-6">
                                    <div class="form-label text-muted small mb-1 d-block">Vigencia</div>
                                    <div class="fs-7 text-dark">{{ formatDateShort(convenio.effective_date) }} - {{ formatDateShort(convenio.expiry_date) }}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- OBJETO DEL CONTRATO -->
                    <div class="card border-0 shadow-sm">
                        <div class="card-header bg-white border-bottom py-3 px-3 px-sm-4">
                            <div class="d-flex align-items-center gap-2">
                                <div class="section-icon bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                                    <i class="fad fa-file-alt text-primary" aria-hidden="true"></i>
                                </div>
                                <h6 class="mb-0 fw-semibold">Objeto del Contrato</h6>
                            </div>
                        </div>
                        <div class="card-body p-3 p-sm-4">
                            <div class="mb-3">
                                <div class="form-label text-muted small mb-1 d-block">Nombre del Objeto</div>
                                <div class="fs-7 fw-semibold text-dark text-break">{{ currentFuecData?.objects_contract?.name || '-' }}</div>
                            </div>
                            <div>
                                <div class="form-label text-muted small mb-1 d-block">Descripción</div>
                                <p class="fs-7 text-muted mb-0 text-break" style="line-height: 1.6;">
                                    {{ currentFuecData?.objects_contract?.description || '-' }}
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

                <!-- COLUMNA DERECHA (Sidebar) -->
                <div class="col-12 col-lg-4">
                    <div class="sidebar-wrapper d-flex flex-column gap-3 gap-lg-4">

                        <!-- RESUMEN DEL FUEC -->
                        <div class="card border-0 shadow-sm">
                            <div class="card-header bg-white border-bottom py-3 px-3 px-sm-4">
                                <h6 class="mb-0 fw-semibold">Resumen del FUEC</h6>
                            </div>
                            <div class="card-body p-3 p-sm-4">
                                <div class="text-center mb-3 pb-3 border-bottom">
                                    <img v-if="currentFuecData?.company?.logo_url && !logoFailed" @error="logoFailed = true" :src="getMediaUrl(currentFuecData.company.logo_url)"
                                        :alt="currentFuecData.company.business_name" class="img-fluid rounded-3 mb-2"
                                        style="max-height: 52px; object-fit: contain;">
                                    <div class="fw-semibold small text-dark text-break">{{ currentFuecData?.company?.business_name }}</div>
                                </div>

                                <div class="summary-list mb-3">
                                    <div class="summary-row">
                                        <span class="text-muted">Número FUEC</span>
                                        <span class="font-monospace fw-medium text-dark text-end text-break">{{ currentFuecData?.number_fuec || '-' }}</span>
                                    </div>
                                    <div class="summary-row">
                                        <span class="text-muted">N.º de Contrato</span>
                                        <span class="font-monospace fw-medium text-dark text-end">{{ currentFuecData?.contract_number_display || currentFuecData?.contractor?.contract_number || '-' }}</span>
                                    </div>
                                    <div class="summary-row">
                                        <span class="text-muted">N.º Solicitud</span>
                                        <span class="font-monospace text-dark text-break text-end">{{ currentFuecData?.request_number || '-' }}</span>
                                    </div>
                                    <div class="summary-row">
                                        <span class="text-muted">Estado</span>
                                        <span :class="currentFuecData?.status === 'ACTIVO' ? 'text-success' : 'text-warning'"
                                            class="fw-semibold">{{ currentFuecData?.status || '-' }}</span>
                                    </div>
                                    <div class="summary-row">
                                        <span class="text-muted">Vigencia</span>
                                        <span class="fw-medium text-dark text-end">{{ formatDateShort(currentFuecData?.effective_date) }} - {{ formatDateShort(currentFuecData?.expiration_date) }}</span>
                                    </div>
                                </div>

                                <div class="mb-4">
                                    <div class="d-flex justify-content-between align-items-center mb-1 fs-7">
                                        <span class="text-muted">Progreso de vigencia</span>
                                        <span class="fw-medium text-dark">{{ getValidityProgress }}%</span>
                                    </div>
                                    <div class="progress" style="height: 6px;">
                                        <div class="progress-bar" :class="getValidityProgressClass" role="progressbar"
                                            :style="{ width: getValidityProgress + '%' }"
                                            :aria-valuenow="getValidityProgress" aria-valuemin="0" aria-valuemax="100">
                                        </div>
                                    </div>
                                </div>

                                <div class="d-grid gap-2">
                                    <button class="btn btn-outline-primary btn-sm" @click="printFUEC"><i
                                            class="fad fa-print me-1" aria-hidden="true"></i>Imprimir FUEC</button>
                                    <button class="btn btn-outline-secondary btn-sm" @click="downloadPDF"><i
                                            class="fad fa-file-pdf me-1" aria-hidden="true"></i>Descargar PDF</button>
                                    <button v-if="isLoggedIn" class="btn btn-primary btn-sm" @click="editFUEC"><i
                                            class="fad fa-edit me-1" aria-hidden="true"></i>Editar FUEC</button>
                                </div>
                            </div>
                        </div>

                        <!-- AUTENTICIDAD DEL DOCUMENTO -->
                        <div class="card border-0 shadow-sm">
                            <div class="card-header bg-white border-bottom py-3 px-3 px-sm-4">
                                <div class="d-flex align-items-center gap-2">
                                    <div class="section-icon bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                                        <i class="fad fa-shield-check text-success" aria-hidden="true"></i>
                                    </div>
                                    <h6 class="mb-0 fw-semibold">Autenticidad del Documento</h6>
                                </div>
                            </div>
                            <div class="card-body p-3 p-sm-4">
                                <div class="summary-list mb-3">
                                    <div class="summary-row">
                                        <span class="text-muted">Código de Verificación</span>
                                        <span class="font-monospace fw-medium text-dark text-end text-break">{{ currentFuecData?.verification_code || '-' }}</span>
                                    </div>
                                    <div class="summary-row">
                                        <span class="text-muted">Fecha de Emisión</span>
                                        <span class="fw-medium text-dark text-end">{{ formatDateShort(currentFuecData?.created_at) }}</span>
                                    </div>
                                    <div class="summary-row">
                                        <span class="text-muted">Última Actualización</span>
                                        <span class="fw-medium text-dark text-end">{{ formatDateShort(currentFuecData?.updated_at) }}</span>
                                    </div>
                                </div>

                                <div class="d-grid gap-2 mb-3">
                                    <button type="button" @click="verifyAuthenticity"
                                        class="btn btn-outline-success btn-sm">
                                        <i class="fad fa-check-circle me-1" aria-hidden="true"></i>Verificar Autenticidad
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm" @click="copyVerificationCode">
                                        <i class="fad fa-copy me-1" aria-hidden="true"></i>Copiar Código de Verificación
                                    </button>
                                </div>

                                <div class="legal-notice p-2 rounded">
                                    <small class="text-muted d-block">
                                        <i class="fad fa-info-circle me-1" aria-hidden="true"></i>
                                        Este documento tiene validez jurídica según Resolución {{ ministryResolution }} del
                                        Ministerio de Transporte de Colombia.
                                    </small>
                                </div>
                            </div>
                        </div>

                        <!-- CONDUCTORES ASIGNADOS (Encima de Pasajeros) -->
                        <div class="card border-0 shadow-sm">
                            <div class="card-header bg-white border-bottom py-3 px-3 px-sm-4">
                                <div class="d-flex align-items-center gap-2">
                                    <div class="section-icon bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                                        <i class="fad fa-user-circle text-primary" aria-hidden="true"></i>
                                    </div>
                                    <h6 class="mb-0 fw-semibold">Conductores Asignados</h6>
                                </div>
                            </div>
                            <div class="card-body p-3 p-sm-4">
                                <div v-if="currentFuecData?.main_conductor"
                                    :class="{ 'pb-3 mb-3 border-bottom': currentFuecData?.secondary_conductor || currentFuecData?.tertiary_conductor }">
                                    <div class="d-flex flex-wrap align-items-center gap-1 mb-1">
                                        <span class="fw-semibold small text-dark text-break">{{ currentFuecData.main_conductor.first_name }} {{
                                            currentFuecData.main_conductor.last_name }}</span>
                                        <span class="badge bg-primary text-white rounded-pill px-2 py-0"
                                            style="font-size: 0.6rem;">Principal</span>
                                    </div>
                                    <div class="fs-7 text-muted">
                                        <span>C.C.</span>
                                        <span class="font-monospace fw-medium text-dark ms-1">{{
                                            currentFuecData.main_conductor.document_number }}</span>
                                    </div>
                                    <div v-if="currentFuecData.main_conductor.driver_licenses?.length" class="mt-1">
                                        <div v-for="license in currentFuecData.main_conductor.driver_licenses"
                                            :key="license.number"
                                            class="fs-7 text-muted text-break">
                                            <i class="fad fa-id-card-alt me-1 text-primary" aria-hidden="true"></i>
                                            <span>Licencia <strong class="text-dark">{{ license.category }}</strong></span>
                                            <span class="mx-1">•</span>
                                            <span>Vence: <span class="font-monospace text-dark">{{ formatDateShort(license.expiration_date) }}</span></span>
                                        </div>
                                    </div>
                                </div>

                                <div v-if="currentFuecData?.secondary_conductor"
                                    :class="{ 'pb-3 mb-3 border-bottom': currentFuecData?.tertiary_conductor }">
                                    <div class="d-flex flex-wrap align-items-center gap-1 mb-1">
                                        <span class="fw-semibold small text-dark text-break">{{ currentFuecData.secondary_conductor.first_name }}
                                            {{ currentFuecData.secondary_conductor.last_name }}</span>
                                        <span class="badge bg-secondary text-white rounded-pill px-2 py-0"
                                            style="font-size: 0.6rem;">Secundario</span>
                                    </div>
                                    <div class="fs-7 text-muted">
                                        <span>C.C.</span>
                                        <span class="font-monospace fw-medium text-dark ms-1">{{
                                            currentFuecData.secondary_conductor.document_number }}</span>
                                    </div>
                                    <div v-if="currentFuecData.secondary_conductor.driver_licenses?.length" class="mt-1">
                                        <div v-for="license in currentFuecData.secondary_conductor.driver_licenses"
                                            :key="license.number"
                                            class="fs-7 text-muted text-break">
                                            <i class="fad fa-id-card-alt me-1 text-primary" aria-hidden="true"></i>
                                            <span>Licencia <strong class="text-dark">{{ license.category }}</strong></span>
                                            <span class="mx-1">•</span>
                                            <span>Vence: <span class="font-monospace text-dark">{{ formatDateShort(license.expiration_date) }}</span></span>
                                        </div>
                                    </div>
                                </div>

                                <div v-if="currentFuecData?.tertiary_conductor">
                                    <div class="d-flex flex-wrap align-items-center gap-1 mb-1">
                                        <span class="fw-semibold small text-dark text-break">{{ currentFuecData.tertiary_conductor.first_name }}
                                            {{ currentFuecData.tertiary_conductor.last_name }}</span>
                                        <span class="badge bg-info text-white rounded-pill px-2 py-0"
                                            style="font-size: 0.6rem;">Terciario</span>
                                    </div>
                                    <div class="fs-7 text-muted">
                                        <span>C.C.</span>
                                        <span class="font-monospace fw-medium text-dark ms-1">{{
                                            currentFuecData.tertiary_conductor.document_number }}</span>
                                    </div>
                                    <div v-if="currentFuecData.tertiary_conductor.driver_licenses?.length" class="mt-1">
                                        <div v-for="license in currentFuecData.tertiary_conductor.driver_licenses"
                                            :key="license.number"
                                            class="fs-7 text-muted text-break">
                                            <i class="fad fa-id-card-alt me-1 text-primary" aria-hidden="true"></i>
                                            <span>Licencia <strong class="text-dark">{{ license.category }}</strong></span>
                                            <span class="mx-1">•</span>
                                            <span>Vence: <span class="font-monospace text-dark">{{ formatDateShort(license.expiration_date) }}</span></span>
                                        </div>
                                    </div>
                                </div>

                                <div v-if="!currentFuecData?.main_conductor && !currentFuecData?.secondary_conductor && !currentFuecData?.tertiary_conductor"
                                    class="text-center text-muted py-3">
                                    <i class="fad fa-user-slash fs-4 d-block mb-2 opacity-50" aria-hidden="true"></i>
                                    <p class="mb-0 fs-7">No hay conductores asignados a este FUEC</p>
                                </div>
                            </div>
                        </div>

                        <!-- PASAJEROS (Solo si existen) -->
                        <div v-if="currentFuecData?.passengers?.length" class="card border-0 shadow-sm">
                            <div class="card-header bg-white border-bottom py-3 px-3 px-sm-4">
                                <div class="d-flex align-items-center justify-content-between">
                                    <div class="d-flex align-items-center gap-2">
                                        <div class="section-icon bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                                            <i class="fad fa-users text-primary" aria-hidden="true"></i>
                                        </div>
                                        <h6 class="mb-0 fw-semibold">Pasajeros</h6>
                                    </div>
                                    <span class="badge bg-light text-dark border fs-7">{{ currentFuecData.passengers.length }}</span>
                                </div>
                            </div>
                            <div class="card-body p-3 p-sm-4">
                                <div class="list-group list-group-flush">
                                    <div v-for="(passenger, index) in currentFuecData.passengers"
                                        :key="passenger.uuid || index"
                                        class="list-group-item px-0 py-2 d-flex align-items-center gap-2">
                                        <div class="bg-light rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                            style="width: 28px; height: 28px; font-size: 0.75rem; font-weight: 600;">{{ index + 1 }}</div>
                                        <div class="flex-grow-1 min-w-0">
                                            <div class="fw-semibold small text-dark text-break">{{ passenger.full_name || `Pasajero ${index + 1}` }}</div>
                                            <div class="text-muted fs-7 font-monospace">{{ passenger.document_number || 'Documento no registrado' }}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- FIRMA DIGITAL -->
                        <div class="card border-0 shadow-sm" v-if="currentFuecData?.company?.signature_url && !signatureFailed">
                            <div class="card-header bg-white border-bottom py-3 px-3 px-sm-4">
                                <div class="d-flex align-items-center gap-2">
                                    <div class="section-icon bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                                        <i class="fad fa-signature text-primary" aria-hidden="true"></i>
                                    </div>
                                    <h6 class="mb-0 fw-semibold">Firma Digital</h6>
                                </div>
                            </div>
                            <div class="card-body p-3 p-sm-4 text-center">
                                <div class="p-3 bg-light rounded-3 d-inline-block mb-2">
                                    <img :src="getMediaUrl(currentFuecData.company.signature_url)" alt="Firma digital" class="img-fluid" @error="signatureFailed = true"
                                        style="max-height: 72px; max-width: 200px; object-fit: contain;">
                                </div>
                                <p class="text-muted fs-7 mb-0 text-break">Firma autorizada de {{ currentFuecData?.company?.business_name }}</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <!-- ===== PIE DE PÁGINA ===== -->
            <div class="mt-4 pt-3 border-top border-primary border-opacity-25">
                <div class="text-muted text-center px-2"
                    style="font-size: 0.78rem; line-height: 1.6; max-width: 780px; margin: 0 auto;">
                    <p class="mb-0">
                        <i class="fad fa-info-circle me-1" aria-hidden="true"></i>
                        Este documento ha sido generado electrónicamente por
                        <strong>{{ appName }}</strong>, conforme a las disposiciones de la
                        Resolución {{ ministryResolution }} del Ministerio de Transporte de Colombia.
                    </p>
                </div>
            </div>

            <div class="print-footer d-none">
                <div class="print-line">
                    {{ appName }} - {{ companyName }} |
                    FUEC N {{ currentFuecData?.number_fuec }} |
                    Verificacion: {{ verificationCode }} |
                    Resolucion {{ ministryResolution }} MTC
                </div>
                <div class="print-line">
                    Documento generado electronicamente - ID: {{ currentFuecData?.request_number }}
                </div>
            </div>

        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import dateUtils from '@/utils/date.js';
import { showSwalModal } from '@/utils/confirm.js';
import { logger } from '@/utils/logger.js';
import FuecService from '@/features/fuec/services/fuec.service.js';
import getMediaUrl from '@/utils/media.js';
import { useAuthStore } from '@store/modules/auth.js';

// ===== CONFIGURACIÓN MTC =====
// Resolución 6652 de 2019 del Ministerio de Transporte (contenido del FUEC)
const ministryResolution = ref(import.meta.env.VITE_MTC_RESOLUTION || '6652 de 2019');

// Las acciones internas (editar) solo se muestran con sesión iniciada
const authStore = useAuthStore();
const isLoggedIn = computed(() => !!(authStore.isAuthenticated && authStore.accessToken));

// ===== PROPS =====
const props = defineProps({
    currentFuecData: { type: Object, required: false, default: null },
    loading: { type: Boolean, default: false }
});

const router = useRouter();
const route = useRoute();

const internalFuecData = ref(null);
const internalLoading = ref(false);
const errorMsg = ref(null);
const accessedViaQR = ref(false);
const verificationCode = ref('');
// Imágenes (logo/firma) que el servidor no pudo entregar: se ocultan en lugar de mostrarse rotas
const logoFailed = ref(false);
const signatureFailed = ref(false);

const currentFuecData = computed(() => props.currentFuecData || internalFuecData.value);
const loading = computed(() => props.loading || internalLoading.value);

// ===== VARIABLES DE IDENTIDAD (Añadidas para el nuevo Footer) =====
const appName = ref(import.meta.env.VITE_APP_NAME || 'Sistema FUEC');
const companyName = computed(() => currentFuecData.value?.company?.business_name || 'Empresa de Transporte');

// ===== URLS DE VERIFICACIÓN =====
const verifyAuthenticity = () => {
    if (!currentFuecData.value) return;

    const currentDate = dateUtils.dayjs();
    const effectiveDate = dateUtils.dayjs(currentFuecData.value.effective_date).startOf('day');
    const expirationDate = dateUtils.dayjs(currentFuecData.value.expiration_date).endOf('day');

    if (currentDate.isBefore(effectiveDate)) {
        showSwalModal({
            title: 'No Vigente',
            html: `
                <p class="mb-2">El FUEC <strong>#${currentFuecData.value.number_fuec || ''}</strong> aún no está en periodo de vigencia.</p>
                <div class="alert alert-warning small mb-0 mt-2 text-start">
                    <i class="fad fa-exclamation-triangle me-1" aria-hidden="true"></i>
                    La vigencia iniciará el <strong>${formatDateShort(currentFuecData.value.effective_date)}</strong>.
                </div>
            `,
            icon: 'warning',
            confirmButtonText: '<i class="fad fa-check me-1" aria-hidden="true"></i>Aceptar',
            confirmButtonColor: '#ffc107',
            customClass: { popup: 'rounded-3 shadow', confirmButton: 'btn btn-warning px-4 mx-1 text-dark' },
            buttonsStyling: false
        });
        return;
    }

    if (currentDate.isAfter(expirationDate)) {
        showSwalModal({
            title: 'FUEC Vencido',
            html: `
                <p class="mb-2">El FUEC <strong>#${currentFuecData.value.number_fuec || ''}</strong> se encuentra expirado.</p>
                <div class="alert alert-danger small mb-0 mt-2 text-start">
                    <i class="fad fa-times-circle me-1" aria-hidden="true"></i>
                    La validez del documento terminó el <strong>${formatDateShort(currentFuecData.value.expiration_date)}</strong>.
                </div>
            `,
            icon: 'error',
            confirmButtonText: '<i class="fad fa-check me-1" aria-hidden="true"></i>Aceptar',
            confirmButtonColor: '#dc3545',
            customClass: { popup: 'rounded-3 shadow', confirmButton: 'btn btn-danger px-4 mx-1' },
            buttonsStyling: false
        });
        return;
    }

    showSwalModal({
        title: 'Documento Validado',
        html: `
            <p class="mb-2">El FUEC <strong>#${currentFuecData.value.number_fuec || ''}</strong> es válido y está vigente.</p>
            <div class="alert alert-success small mb-0 mt-2 text-start">
                <i class="fad fa-shield-check me-1" aria-hidden="true"></i>
                Este documento es auténtico y cumple con la normativa de fechas.
            </div>
        `,
        icon: 'success',
        confirmButtonText: '<i class="fad fa-check me-1" aria-hidden="true"></i>Aceptar',
        confirmButtonColor: '#198754',
        customClass: {
            popup: 'rounded-3 shadow',
            confirmButton: 'btn btn-success px-4 mx-1'
        },
        buttonsStyling: false
    });
};

// ===== UTILIDADES DE FORMATO =====
const formatDate = (dateStr, withTime = false) => {
    if (!dateStr) return '-';
    const format = withTime ? 'DD [de] MMMM [de] YYYY [a las] HH:mm' : 'DD [de] MMMM [de] YYYY';
    return dateUtils.dayjs(dateStr).locale('es').format(format);
};

const formatDateShort = (dateStr) => {
    if (!dateStr) return '-';
    return dateUtils.dayjs(dateStr).locale('es').format('DD/MM/YYYY');
};

// ===== UTILIDADES VISUALES =====
const formatPlate = (plate) => {
    if (!plate) return '--- ---';
    const clean = String(plate).replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (clean.length === 6) {
        return `${clean.slice(0, 3)} ${clean.slice(3)}`;
    }
    return clean;
};

// ===== CÁLCULOS DERIVADOS =====
const isExpiringSoon = (dateStr) => {
    if (!dateStr) return false;
    const expiry = dateUtils.dayjs(dateStr);
    const today = dateUtils.dayjs();
    const daysDiff = expiry.diff(today, 'days');
    return daysDiff >= 0 && daysDiff <= 5;
};

const convenios = computed(() => {
    const v = currentFuecData.value?.vehicle;
    return v?.business_collaboration_agreements || v?.businessCollaborationAgreements || [];
});

const getValidityProgress = computed(() => {
    if (!currentFuecData.value?.effective_date || !currentFuecData.value?.expiration_date) return 0;
    const start = dateUtils.dayjs(currentFuecData.value.effective_date);
    const end = dateUtils.dayjs(currentFuecData.value.expiration_date);
    const now = dateUtils.dayjs();
    const totalDays = end.diff(start, 'days');
    const elapsedDays = now.diff(start, 'days');
    if (totalDays <= 0) return 100;
    if (elapsedDays < 0) return 0;
    if (elapsedDays > totalDays) return 100;
    return Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
});

const getValidityProgressClass = computed(() => {
    const progress = getValidityProgress.value;
    if (progress >= 80) return 'bg-danger';
    if (progress >= 60) return 'bg-warning';
    return 'bg-success';
});

// ===== ACCIONES =====
const printFUEC = () => {
    document.body.classList.add('printing-fuec');
    setTimeout(() => {
        window.print();
        document.body.classList.remove('printing-fuec');
    }, 100);
};

const downloadPDF = async () => {
    try {
        if (!currentFuecData.value?.uuid) throw new Error('UUID no disponible');
        await FuecService.generatePDF(currentFuecData.value.uuid, {
            includeVerificationQR: true,
            ministryCompliant: true,
            verificationCode: verificationCode.value
        });
    } catch (error) {
        logger.error('Error generando PDF:', error);
        alert('No se pudo generar el PDF. Intente nuevamente o contacte al administrador.');
    }
};

const editFUEC = () => {
    if (currentFuecData.value?.uuid) {
        router.push(`/operations/fuec/editar/${currentFuecData.value.uuid}`);
    }
};

const copyVerificationCode = async (event) => {
    try {
        await navigator.clipboard.writeText(currentFuecData.value?.verification_code || '-');
        // Mostrar feedback visual simple
        const btn = event?.currentTarget;
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fad fa-check me-1" aria-hidden="true"></i>Copiado';
            btn.classList.add('btn-success');
            btn.classList.remove('btn-outline-secondary');
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('btn-success');
                btn.classList.add('btn-outline-secondary');
            }, 2000);
        }
    } catch (err) {
        logger.error('Error al copiar:', err);
        alert('No se pudo copiar el código. Selecciónelo manualmente.');
    }
};

// ===== INICIALIZACIÓN DE TOOLTIPS =====
const initTooltips = () => {
    if (typeof window?.bootstrap?.Tooltip !== 'undefined') {
        setTimeout(() => {
            document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
                try {
                    const instance = window.bootstrap.Tooltip.getInstance(el);
                    if (instance) instance.dispose();
                    new window.bootstrap.Tooltip(el, { trigger: 'hover', delay: { show: 150, hide: 80 } });
                } catch (e) { /* Ignorar */ }
            });
        }, 100);
    }
};

// ===== CARGA DE DATOS CON VALIDACIÓN QR =====
const loadFuecData = async (id, code) => {
    try {
        internalLoading.value = true;
        errorMsg.value = null;

        // Usamos el endpoint público de validación para cualquier identificador provisto
        const response = await FuecService.validate(id);

        const data = response.data?.data ?? response.data;
        if (!data) {
            throw new Error('No se encontró información para el código proporcionado o ya ha expirado.');
        }

        internalFuecData.value = data;
        verificationCode.value = data?.verification_code || '-';

        // Registrar evento de verificación por QR para auditoría MTC
        if (accessedViaQR.value) {
            await FuecService.logVerification?.(data.uuid, 'QR_SCAN', {
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                source: 'mobile_qr'
            });
        }

        return data;
    } catch (error) {
        logger.error('Error al cargar/validar el FUEC:', error);
        errorMsg.value = error.response?.data?.message || 'No se pudo cargar la información del FUEC.';
        throw error;
    } finally {
        internalLoading.value = false;
    }
};

// ===== ON MOUNTED =====
onMounted(async () => {
    initTooltips();

    // Detectar acceso por QR desde parámetros de URL
    const urlParams = new URLSearchParams(window.location.search);
    accessedViaQR.value = urlParams.has('qr') || urlParams.has('scan') || route.query.source === 'qr' || !!route.params.code;

    // Cargar datos si no se recibieron por props
    if (!props.currentFuecData && route.params.id) {
        const code = route.params.code || urlParams.get('code');
        await loadFuecData(route.params.id, code);
    } else if (!props.currentFuecData && !route.params.id) {
        const result = await showSwalModal({
            title: 'Consultar FUEC',
            text: 'Ingrese el código de verificación del FUEC a consultar:',
            input: 'text',
            inputPlaceholder: 'Ej: AB1234',
            showCancelButton: true,
            confirmButtonText: '<i class="fad fa-search me-1" aria-hidden="true"></i>Consultar',
            cancelButtonText: 'Regresar',
            confirmButtonColor: '#0d6efd',
            cancelButtonColor: '#6c757d',
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: {
                popup: 'rounded-3 shadow',
                confirmButton: 'btn btn-primary px-4 mx-1',
                cancelButton: 'btn btn-secondary px-4 mx-1'
            },
            buttonsStyling: false,
            inputValidator: (value) => {
                if (!value || value.trim() === '') {
                    return 'Debe ingresar un identificador válido';
                }
            }
        });

        if (result.isConfirmed) {
            const enteredId = result.value.trim();
            router.replace(`/validacion-de-fuec/${enteredId}`);
        } else {
            router.push('/');
        }
    } else if (props.currentFuecData) {
        // Generar código de verificación para datos ya cargados
        verificationCode.value = props.currentFuecData?.verification_code || '-';
    }
});

// ===== WATCHERS =====
watch(() => props.currentFuecData, (newData) => {
    if (newData) {
        verificationCode.value = newData?.verification_code || '-';
    }
}, { immediate: true });

watch(() => route.params.id, async (newId) => {
    if (newId && !props.currentFuecData) {
        const urlParams = new URLSearchParams(window.location.search);
        const code = route.params.code || urlParams.get('code');
        await loadFuecData(newId, code);
    }
});
</script>

<style scoped>
/* ===== ANIMACIONES ===== */
.fade-in-up {
    animation: fadeInUp 0.4s ease-out forwards;
    opacity: 0;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* ===== WRAPPER ===== */
.fuec-detail-wrapper {
    --bs-body-bg: #f4f6f9;
    background-color: var(--bs-body-bg);
    min-height: 100vh;
}

.fuec-detail-wrapper.qr-access::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #198754, #0d6efd, #198754);
    z-index: 1000;
    animation: scanLine 3s linear infinite;
}

@keyframes scanLine {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
}

/* ===== HERO BANNER ===== */
.hero-icon {
    width: 64px;
    height: 64px;
    font-size: 1.75rem;
}

.hero-title {
    font-size: clamp(1.15rem, 2.2vw, 1.65rem);
    line-height: 1.25;
}

@media (min-width: 768px) {
    .border-md-0 {
        border-top: 0 !important;
    }
}

/* ===== CARDS E ICONOS DE SECCIÓN ===== */
.card {
    border-radius: 0.875rem !important;
    transition: box-shadow 150ms ease-in-out, transform 150ms ease-in-out;
    border: none !important;
}

.card-header {
    background: linear-gradient(135deg, #fff, #f8f9fa) !important;
    border-radius: 0.875rem 0.875rem 0 0 !important;
}

.section-icon {
    width: 32px;
    height: 32px;
    font-size: 0.85rem;
}

/* ===== PLACA VEHICULAR COLOMBIANA (SERVICIO PÚBLICO) ===== */
.colombian-plate {
    display: inline-block;
    background: #ffffff;
    border: 2px solid #1e293b;
    border-radius: 0.5rem;
    padding: 3px;
    box-shadow: 0 3px 10px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8);
    user-select: none;
}

.plate-inner {
    position: relative;
    border: 2px solid #0f172a;
    border-radius: 0.35rem;
    padding: 0.35rem 1rem 0.25rem;
    min-width: 148px;
    text-align: center;
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.plate-number {
    font-family: "FE-Schrift", "Arial Black", "Impact", SFMono-Regular, Consolas, monospace;
    font-size: 1.45rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    line-height: 1.05;
    color: #0f172a;
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.9);
}

.plate-country {
    font-size: 0.58rem;
    font-weight: 800;
    letter-spacing: 0.28em;
    color: #0f172a;
    margin-top: 2px;
    padding-left: 0.28em;
    line-height: 1;
}

.plate-bolt {
    position: absolute;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #94a3b8;
    border: 1px solid #475569;
}

.plate-bolt-tl { top: 4px; left: 6px; }
.plate-bolt-tr { top: 4px; right: 6px; }
.plate-bolt-bl { bottom: 4px; left: 6px; }
.plate-bolt-br { bottom: 4px; right: 6px; }

/* ===== RUTA ORIGEN - DESTINO ===== */
.route-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.route-endpoint {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex: 1 1 0;
    min-width: 0;
}

.route-pin {
    width: 32px;
    height: 32px;
    font-size: 0.85rem;
}

.route-connector {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    padding: 0 0.5rem;
    font-size: 1rem;
}

@media (max-width: 575.98px) {
    .route-box {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
    }

    .route-connector {
        justify-content: flex-start;
        padding: 0 0 0 0.5rem;
        transform: rotate(90deg);
        width: 32px;
    }
}

/* ===== LISTAS DE RESUMEN (SIDEBAR) ===== */
.summary-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.summary-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
    font-size: 0.8rem;
}

/* ===== LICENCIAS DE CONDUCTOR ===== */
.license-pill {
    line-height: 1.4;
    word-break: break-word;
}

/* ===== TIPOGRAFÍA Y BADGES ===== */
.fw-semibold {
    font-weight: 600 !important;
}

.fw-bold {
    font-weight: 700 !important;
}

.fs-7 {
    font-size: 0.8rem !important;
}

.fs-6 {
    font-size: 0.9rem !important;
}

.fs-5 {
    font-size: 1rem !important;
}

.text-muted {
    color: #6c757d !important;
}

.text-primary {
    color: #0d6efd !important;
}

.font-monospace {
    font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.badge {
    font-weight: 500;
    letter-spacing: 0.02em;
}

.badge-qr-verified {
    animation: pulse-verify 2s infinite;
    box-shadow: 0 0 0 2px rgba(25, 135, 84, 0.3);
}

@keyframes pulse-verify {
    0%, 100% { box-shadow: 0 0 0 2px rgba(25, 135, 84, 0.3); }
    50% { box-shadow: 0 0 0 4px rgba(25, 135, 84, 0.1); }
}

.bg-success-subtle {
    background-color: rgba(25, 135, 84, 0.12) !important;
}

.text-success {
    color: #198754 !important;
}

.border-success-subtle {
    border-color: rgba(25, 135, 84, 0.25) !important;
}

.bg-warning-subtle {
    background-color: rgba(255, 193, 7, 0.12) !important;
}

.text-warning {
    color: #997404 !important;
}

.border-warning-subtle {
    border-color: rgba(255, 193, 7, 0.25) !important;
}

.bg-info-subtle {
    background-color: rgba(13, 110, 253, 0.1) !important;
}

.text-info {
    color: #0d6efd !important;
}

.border-info-subtle {
    border-color: rgba(13, 110, 253, 0.2) !important;
}

/* ===== CAMPOS DE FORMULARIO ===== */
.form-label {
    margin-bottom: 0.2rem !important;
    font-size: 0.72rem !important;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 600 !important;
}

/* ===== BOTONES ===== */
.btn {
    transition: all 150ms ease-in-out;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    font-weight: 500;
}

.btn-primary {
    background: linear-gradient(135deg, var(--bs-primary), var(--bs-primary-dark, #0a58ca));
    border: none;
}

.btn-outline-secondary {
    border-color: #dee2e6;
    color: #495057;
}

.btn-outline-secondary:hover {
    background-color: #f8f9fa;
    border-color: #adb5bd;
}

/* ===== LISTA DE PASAJEROS ===== */
.list-group-item {
    background: transparent !important;
    border: none !important;
}

/* ===== SKELETON ===== */
.skeleton-text {
    background: linear-gradient(90deg, #e9ecef 25%, #f8f9fa 50%, #e9ecef 75%);
    background-size: 200% 100%;
    animation: skeleton-pulse 1.5s infinite ease-in-out;
    border-radius: 0.5rem;
}

@keyframes skeleton-pulse {
    0%, 100% { background-position: 200% 0; opacity: 1; }
    50% { background-position: -200% 0; opacity: 0.6; }
}

/* ===== CÓDIGO DE VERIFICACIÓN ===== */
.verification-code {
    font-family: 'Courier New', monospace;
    letter-spacing: 0.5px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.06));
    padding: 0.35rem 0.75rem;
    border-radius: 0.4rem;
    border: 1px dashed rgba(255, 255, 255, 0.35);
}

/* ===== NOTA LEGAL ===== */
.legal-notice {
    font-size: 0.72rem;
    color: #6c757d;
    border-left: 3px solid #0d6efd;
    padding-left: 0.75rem;
    background: rgba(13, 110, 253, 0.04);
    border-radius: 0 0.25rem 0.25rem 0;
}

/* ===== AJUSTES PARA MÓVIL PEQUEÑO ===== */
@media (max-width: 575.98px) {
    .hero-icon {
        width: 50px;
        height: 50px;
        font-size: 1.35rem;
    }

    .vehicle-avatar {
        width: 56px;
        height: 56px;
        font-size: 1.05rem;
    }

    .conductor-item {
        padding: 0.75rem !important;
        gap: 0.65rem !important;
    }

    .verification-code {
        font-size: 0.78rem;
        padding: 0.3rem 0.6rem;
    }
}

/* ===== ESTILOS DE IMPRESIÓN ===== */
@media print {
    body {
        font-size: 10pt !important;
        color: #000 !important;
        background: #fff !important;
    }

    body.printing-fuec .fuec-detail-wrapper {
        padding: 0 !important;
        background: #fff !important;
    }

    .card {
        box-shadow: none !important;
        border: 1px solid #dee2e6 !important;
        break-inside: avoid;
        page-break-inside: avoid;
    }

    .card-header {
        background: #fff !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    .no-print,
    .btn,
    .badge-qr-verified {
        display: none !important;
    }

    .bg-gradient {
        background: #0d6efd !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    .text-white,
    .text-white-50 {
        color: #000 !important;
    }

    .verification-code {
        border: 1px solid #000 !important;
        background: #fff !important;
        color: #000 !important;
    }

    .badge {
        border: 1px solid #000 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    .print-footer {
        display: block !important;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 8pt;
        color: #666;
        border-top: 1px solid #ddd;
        padding: 8px 0;
        background: #fff;
        font-family: monospace;
    }

    .vehicle-avatar {
        background: #0d6efd !important;
        color: #fff !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    a {
        text-decoration: none;
        color: #000 !important;
    }
}

/* ===== ACCESIBILIDAD ===== */
:focus-visible {
    outline: 2px solid #0d6efd !important;
    outline-offset: 2px !important;
}

[title]:not(button, a, input, select, textarea, [role="button"]),
[data-bs-toggle="tooltip"]:not(button, a, input, select, textarea, [role="button"]) {
    cursor: help;
}

button[title],
a[title],
button[data-bs-toggle="tooltip"],
a[data-bs-toggle="tooltip"] {
    cursor: pointer;
}

/* ===== UTILIDADES ===== */
.bg-opacity-10 {
    --bs-bg-opacity: 0.1;
}

.rounded-4 {
    border-radius: 1rem !important;
}

.rounded-3 {
    border-radius: 0.75rem !important;
}
</style>