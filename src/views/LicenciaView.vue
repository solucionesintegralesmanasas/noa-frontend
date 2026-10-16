<!--
  @file LicenciaView.vue
  @description Vista "Licencia de uso": información de la licencia activa de la empresa,
  y soporte. Usa el mismo patrón visual que VehiclesDetailView
  (BasePageHeader, tarjetas Falcon/Bootstrap y tipografía unificada).
  @author Darwin Montes
-->
<script setup>
/**
 * Vista "Licencia de uso".
 *
 * Recibe los datos de la API de licencia por la prop `licencia` con las claves:
 * estado, codigo, empresa_uuid, vence_en, modo, verificaciones_online,
 * verificaciones_offline, activada_en, ultima_verificacion, titular, plan.
 * Los valores nulos se muestran como "—".
 *
 * @author Darwin Montes
 */
import { computed, ref, onBeforeUnmount, onMounted } from 'vue'
import BasePageHeader from '@/components/BasePageHeader.vue'
import { useLicencia } from '@/hooks/useLicencia.js'

const props = defineProps({
  /** Correo de soporte. */
  correoSoporte: { type: String, default: 'soporte@transportessinbarreras.com' },
  /** Teléfono / WhatsApp de soporte (solo dígitos con indicativo). */
  telefonoSoporte: { type: String, default: '573000000000' }
})

const { licencia, cargando, error, cargar } = useLicencia()
onMounted(cargar)

const VACIO = '—'
const DIA_MS = 86400000

const datos = computed(() => licencia.value || {})

/** Vuelve a consultar la licencia en el servidor. */
const verificar = cargar

/** Abre un correo a soporte para solicitar la renovación. */
function renovar() {
  const asunto = encodeURIComponent(`Renovación de licencia ${datos.value.codigo || ''}`.trim())
  window.location.href = `mailto:${props.correoSoporte}?subject=${asunto}`
}

/** Convierte "YYYY-MM-DD" en fecha local (evita el desfase por zona horaria). */
function aFecha(valor) {
  if (!valor) return null
  const solo = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(valor))
  const f = solo ? new Date(+solo[1], +solo[2] - 1, +solo[3]) : new Date(valor)
  return Number.isNaN(f.getTime()) ? null : f
}

function formatoFecha(valor) {
  const f = aFecha(valor)
  return f ? f.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : VACIO
}

function formatoFechaHora(valor) {
  const f = aFecha(valor)
  return f
    ? f.toLocaleString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : VACIO
}

const texto = (v) => (v === null || v === undefined || v === '' ? VACIO : v)

/* ---------- Vigencia ---------- */
const diasRestantes = computed(() => {
  const vence = aFecha(datos.value.vence_en)
  if (!vence) return null
  return Math.ceil((vence.getTime() - Date.now()) / DIA_MS)
})

const porcentajeVigencia = computed(() => {
  const ini = aFecha(datos.value.activada_en)
  const fin = aFecha(datos.value.vence_en)
  if (!ini || !fin || fin <= ini) return 0
  const transcurrido = (Date.now() - ini.getTime()) / (fin.getTime() - ini.getTime())
  return Math.round(Math.min(1, Math.max(0, 1 - transcurrido)) * 100)
})

const estado = computed(() => {
  if (datos.value.estado === 'Vencida' || (diasRestantes.value !== null && diasRestantes.value < 0)) return 'Vencida'
  if (diasRestantes.value !== null && diasRestantes.value < 30) return 'Por vencer'
  return 'Activa'
})

const claseEstado = computed(() => ({ Activa: 'badge-subtle-success', 'Por vencer': 'badge-subtle-warning', Vencida: 'badge-subtle-danger' })[estado.value])
const textoClaseEstado = computed(() => ({ Activa: 'text-primary', 'Por vencer': 'text-warning', Vencida: 'text-danger' })[estado.value])
const barraEstado = computed(() => ({ Activa: 'bg-primary', 'Por vencer': 'bg-warning', Vencida: 'bg-danger' })[estado.value])

const textoDias = computed(() => {
  const d = diasRestantes.value
  if (d === null) return VACIO
  if (d < 0) return `Venció hace ${Math.abs(d)} días`
  if (d === 1) return '1 día restante'
  return `${d} días restantes`
})

/* ---------- Modo de verificación ---------- */
const MODOS = {
  online_verified: 'Verificada en línea',
  online: 'Verificada en línea',
  offline: 'Modo sin conexión',
  offline_grace: 'Periodo de gracia sin conexión'
}
const modoLegible = computed(() => MODOS[datos.value.modo] || texto(datos.value.modo))

/* ---------- Copiar al portapapeles ---------- */
const copiado = ref('')
let temporizador = null

async function copiar(valor, etiqueta) {
  if (!valor) return
  try {
    await navigator.clipboard.writeText(valor)
  } catch {
    const area = document.createElement('textarea')
    area.value = valor
    document.body.appendChild(area)
    area.select()
    document.execCommand('copy')
    area.remove()
  }
  copiado.value = `${etiqueta} copiado`
  clearTimeout(temporizador)
  temporizador = setTimeout(() => { copiado.value = '' }, 2000)
}

onBeforeUnmount(() => clearTimeout(temporizador))
</script>


<template>
    <BasePageHeader
        title="Licencia de uso"
        subtitle="Información de la licencia activa de la empresa"
        :breadcrumbs="[{ label: 'Licencia' }]"
        :loading="cargando"
        icon="fad fa-shield-check"
        show-bg
    >
        <template #title-after>
            <span v-if="!cargando && datos.codigo" class="badge rounded-pill" :class="claseEstado" style="font-size: 0.65rem;">
                {{ estado }}
            </span>
        </template>

        <template #actions>
            <button type="button" class="btn btn-falcon-default btn-sm px-3" :disabled="cargando" :aria-busy="cargando"
                title="Verificar licencia ahora" @click="verificar">
                <i class="fas fa-rotate me-1" style="font-size: 12px;" aria-hidden="true"></i>
                <span class="d-none d-sm-inline" style="font-size: 0.8rem;">Verificar ahora</span>
            </button>
            <button type="button" class="btn btn-primary btn-sm px-3" title="Solicitar renovación" @click="renovar">
                <i class="fas fa-key me-1" style="font-size: 12px;" aria-hidden="true"></i>
                <span class="d-none d-sm-inline" style="font-size: 0.8rem;">Renovar licencia</span>
            </button>
        </template>
    </BasePageHeader>

    <!-- Aviso accesible de copiado -->
    <div class="visually-hidden" role="status" aria-live="polite">{{ copiado }}</div>
    <div v-if="copiado" class="lic-toast" aria-hidden="true">{{ copiado }}</div>

    <div v-if="cargando" class="alert alert-info" role="status">Cargando información de la licencia...</div>
    <div v-else-if="error" class="alert alert-danger d-flex flex-wrap align-items-center justify-content-between gap-2" role="alert">
        <span>{{ error }}</span>
        <button type="button" class="btn btn-falcon-default btn-sm" @click="cargar">Reintentar</button>
    </div>

    <div v-else class="row g-3 mb-3 fade-in-up" style="animation-delay: 0.1s;">
        <!-- COLUMNA IZQUIERDA -->
        <div class="col-12 col-lg-7 d-flex flex-column gap-3">
            <!-- PLAN -->
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center justify-content-between gap-2">
                    <div class="d-flex align-items-center gap-2">
                        <i class="fad fa-shield-check text-primary" style="font-size: 14px;" aria-hidden="true"></i>
                        <h6 class="mb-0 vd-titulo">{{ datos.plan?.nombre || 'Licencia de uso' }}</h6>
                    </div>
                    <span class="badge rounded-pill" :class="claseEstado" style="font-size: 0.7rem; padding: 0.25em 0.6em;">
                        {{ estado }}
                    </span>
                </div>
                <div class="card-body py-3">
                    <dl class="row mb-0 small g-2 g-md-3">
                        <dt class="col-5 text-muted fw-medium">Código de licencia:</dt>
                        <dd class="col-7 text-dark fw-semibold font-monospace d-flex align-items-center gap-2 mb-0">
                            <span class="text-break">{{ texto(datos.codigo) }}</span>
                            <button v-if="datos.codigo" type="button" class="btn btn-link btn-sm p-0" aria-label="Copiar código de licencia"
                                @click="copiar(datos.codigo, 'Código')">
                                <i class="far fa-copy" aria-hidden="true"></i>
                            </button>
                        </dd>

                        <dt class="col-5 text-muted fw-medium mt-1">Empresa (UUID):</dt>
                        <dd class="col-7 text-dark font-monospace mt-1 d-flex align-items-center gap-2 mb-0">
                            <span class="text-break">{{ texto(datos.empresa_uuid) }}</span>
                            <button v-if="datos.empresa_uuid" type="button" class="btn btn-link btn-sm p-0" aria-label="Copiar UUID de la empresa"
                                @click="copiar(datos.empresa_uuid, 'UUID')">
                                <i class="far fa-copy" aria-hidden="true"></i>
                            </button>
                        </dd>

                        <dt class="col-5 text-muted fw-medium mt-1">Modo de verificación:</dt>
                        <dd class="col-7 text-dark mt-1 mb-0">
                            <span class="badge badge-subtle-primary" style="font-size: 0.7rem;">{{ modoLegible }}</span>
                            <small class="text-muted d-block font-monospace mt-1">{{ texto(datos.modo) }}</small>
                        </dd>

                        <dt class="col-5 text-muted fw-medium mt-1">Activación:</dt>
                        <dd class="col-7 text-dark mt-1 mb-0">{{ formatoFecha(datos.activada_en) }}</dd>

                        <dt class="col-5 text-muted fw-medium mt-1">Última verificación:</dt>
                        <dd class="col-7 text-dark mt-1 mb-0">{{ formatoFechaHora(datos.ultima_verificacion) }}</dd>

                        <dt class="col-5 text-muted fw-medium mt-1">Titular:</dt>
                        <dd class="col-7 text-dark mt-1 mb-0">{{ texto(datos.titular) }}</dd>
                    </dl>

                    <!-- Vigencia -->
                    <div class="border-top mt-3 pt-3">
                        <div class="d-flex flex-wrap justify-content-between align-items-baseline gap-2 mb-2">
                            <span class="fw-semibold text-dark">Vigencia · vence el {{ formatoFecha(datos.vence_en) }}</span>
                            <span class="fw-semibold" :class="textoClaseEstado">{{ textoDias }}</span>
                        </div>
                        <div class="progress" style="height: 10px;" role="progressbar" aria-label="Vigencia restante de la licencia"
                            aria-valuemin="0" aria-valuemax="100" :aria-valuenow="porcentajeVigencia">
                            <div class="progress-bar" :class="barraEstado" :style="{ width: porcentajeVigencia + '%' }"></div>
                        </div>
                        <div class="d-flex justify-content-between mt-2 small text-muted">
                            <span>Activada: {{ formatoFecha(datos.activada_en) }}</span>
                            <span>Vence: {{ formatoFecha(datos.vence_en) }}</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <!-- COLUMNA DERECHA -->
        <div class="col-12 col-lg-5 d-flex flex-column gap-3">
            <!-- VERIFICACIONES -->
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center gap-2">
                    <i class="fad fa-check-double text-primary" style="font-size: 14px;" aria-hidden="true"></i>
                    <h6 class="mb-0 vd-titulo">Verificaciones</h6>
                </div>
                <div class="card-body py-3">
                    <div class="row g-2">
                        <div class="col-6">
                            <div class="p-2 bg-primary bg-opacity-10 rounded text-center">
                                <small class="text-primary d-block">En línea</small>
                                <span class="fw-semibold text-primary">{{ texto(datos.verificaciones_online) }}</span>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="p-2 bg-success bg-opacity-10 rounded text-center">
                                <small class="text-success d-block">Sin conexión</small>
                                <span class="fw-semibold text-success">{{ texto(datos.verificaciones_offline) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SOPORTE -->
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center gap-2">
                    <i class="fad fa-headset text-primary" style="font-size: 14px;" aria-hidden="true"></i>
                    <h6 class="mb-0 vd-titulo">Soporte</h6>
                </div>
                <div class="card-body py-3">
                    <p class="text-muted small mb-2">¿Dudas con tu licencia o necesitas ampliar el plan? Escríbenos.</p>
                    <div class="list-group list-group-flush small">
                        <a :href="`mailto:${correoSoporte}`" class="list-group-item list-group-item-action px-0 text-break">
                            <i class="far fa-envelope me-2 text-primary" aria-hidden="true"></i>{{ correoSoporte }}
                        </a>
                        <a :href="`https://wa.me/${telefonoSoporte}`" target="_blank" rel="noopener noreferrer"
                            class="list-group-item list-group-item-action px-0">
                            <i class="fab fa-whatsapp me-2 text-success" aria-hidden="true"></i>WhatsApp: +{{ telefonoSoporte }}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Tipografía unificada con VehiclesDetailView (Poppins títulos, Open Sans texto, monoespaciada para códigos) */
.vd-titulo {
    font-family: var(--falcon-font-sans-serif);
    font-weight: 600;
    font-size: 1rem;
}
dl > dt {
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #5b6678 !important;
}
dl > dd {
    font-size: 0.875rem;
}
dl > dd.font-monospace,
.font-monospace {
    font-family: var(--falcon-font-monospace);
    font-size: 0.8125rem;
}

.lic-toast {
    position: fixed;
    right: 1.5rem;
    bottom: 1.5rem;
    z-index: 1080;
    background: #1b2433;
    color: #fff;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.875rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
</style>
