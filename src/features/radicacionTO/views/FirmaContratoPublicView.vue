<template>
  <div class="min-vh-100 bg-light d-flex align-items-center py-5">
    <div class="container" style="max-width: 520px;">
      <div class="card border-0 shadow">
        <!-- Encabezado de la tarjeta -->
        <div class="card-header bg-primary text-white py-4 px-4 border-0 rounded-top-3">
          <div class="d-flex align-items-center gap-3">
            <span class="rounded-circle bg-white bg-opacity-25 d-flex align-items-center justify-content-center" style="width:44px;height:44px;">
              <i class="fad fa-file-signature fa-lg" aria-hidden="true"></i>
            </span>
            <div>
              <h1 class="h5 mb-0 fw-semibold">Firma de contrato</h1>
              <p class="mb-0 opacity-75 card-subtitle-sm">Revisión y firma electrónica</p>
            </div>
          </div>
        </div>

        <div class="card-body px-4 py-4">
          <!-- Cargando los datos del contrato -->
          <div v-if="cargandoDetalle" class="text-center py-4" role="status">
            <i class="fas fa-spinner fa-spin fa-2x text-primary mb-3 d-block" aria-hidden="true"></i>
            <p class="text-muted mb-0">Cargando el contrato…</p>
          </div>

          <!-- Datos del contrato -->
          <template v-else>
          <dl v-if="datos" class="row small mb-3 border-bottom pb-3">
            <dt class="col-5 text-muted fw-normal">Contrato</dt>
            <dd class="col-7 mb-1">{{ etiquetaContrato }}<span v-if="datos.numero_contrato"> N.° {{ datos.numero_contrato }}</span></dd>
            <dt class="col-5 text-muted fw-normal">Vehículo</dt>
            <dd class="col-7 mb-1">{{ datos.vehiculo || '—' }}</dd>
            <dt class="col-5 text-muted fw-normal">Firmante</dt>
            <dd class="col-7 mb-1">{{ datos.firmante }}</dd>
            <dt class="col-5 text-muted fw-normal">Documento</dt>
            <dd class="col-7 mb-0">{{ datos.documento }}</dd>
          </dl>

          <!-- Enlace no utilizable -->
          <div v-if="bloqueado" class="alert alert-warning mb-0" role="alert">
            <i class="fas fa-triangle-exclamation me-1" aria-hidden="true"></i>
            {{ bloqueado }}
          </div>

          <!-- Enlace ya utilizado -->
          <div v-else-if="datos?.estado === 'FIRMADO'" class="text-center py-2">
            <i class="fas fa-circle-check fa-3x text-success mb-3 d-block" aria-hidden="true"></i>
            <h2 class="h5 fw-semibold mb-2">Este enlace ya se usó</h2>
            <p class="text-muted">El contrato ya fue firmado. Si necesita un enlace nuevo, comuníquese con la oficina de la empresa.</p>
          </div>

          <!-- Firma correcta -->
          <div v-else-if="ok" class="text-center py-2">
            <i class="fas fa-circle-check fa-3x text-success mb-3 d-block" aria-hidden="true"></i>
            <h2 class="h5 fw-semibold mb-2">¡Contrato firmado!</h2>
            <p class="text-muted mb-3">Su firma quedó registrada. Descargue una copia del contrato firmado.</p>
            <a
              v-if="datos?.url_documento_descarga"
              :href="datos.url_documento_descarga"
              class="btn btn-outline-primary w-100 d-inline-flex align-items-center justify-content-center gap-2"
            >
              <i class="fas fa-file-arrow-down" aria-hidden="true"></i>
              Descargar contrato firmado
            </a>
          </div>

          <!-- Formulario de firma -->
          <template v-else>
            <div v-if="datos?.url_documento" class="mb-4">
              <a
                :href="datos.url_documento"
                target="_blank"
                rel="noopener"
                class="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
              >
                <i class="fas fa-file-pdf" aria-hidden="true"></i>
                Ver el contrato antes de firmar
              </a>
              <p class="form-text text-center mt-2 mb-0">Descárguelo si lo necesita para revisarlo con calma.</p>
            </div>

            <div class="alert alert-info d-flex align-items-start gap-2 mb-4" role="note">
              <i class="fas fa-circle-info mt-1 flex-shrink-0" aria-hidden="true"></i>
              <div>
                <strong>Enlace de un solo uso.</strong>
                Revise el documento antes de firmar. Este enlace vence el
                <strong>{{ vigencia }}</strong>.
              </div>
            </div>

            <form @submit.prevent="firmar" novalidate>
              <div class="mb-3">
                <SignatureCanvas
                  ref="canvas"
                  label="Firme aquí con el dedo, el mouse o un lápiz"
                  :loading="cargando"
                  :error="error"
                  input-id="f-firma"
                  @change="onFirmaCambiada"
                />
              </div>

              <div class="mb-4 form-check">
                <input id="f-acepto" v-model="aceptado" type="checkbox" class="form-check-input" />
                <label class="form-check-label" for="f-acepto">
                  He leído y acepto el contenido del contrato
                </label>
              </div>

              <button
                type="submit"
                class="btn btn-success btn-lg w-100 d-flex align-items-center justify-content-center gap-2"
                :disabled="cargando || !aceptado || !tieneFirma"
              >
                <i class="fas" :class="cargando ? 'fa-spinner fa-spin' : 'fa-signature'" aria-hidden="true"></i>
                {{ cargando ? 'Firmando…' : 'Firmar contrato' }}
              </button>
            </form>
          </template>
          </template>
        </div>

        <div class="card-footer bg-white text-center py-3 border-top">
          <small class="text-muted">
            <i class="fas fa-lock me-1" aria-hidden="true"></i>
            Documento seguro · {{ datos?.empresa || 'Transportes Sin Barreras' }}
          </small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import env from '@/utils/env.js';
import SignatureCanvas from '@/components/SignatureCanvas.vue';
import { logger } from '@/utils/logger.js';

const route = useRoute();
const canvas = ref(null);
const aceptado = ref(false);
const error = ref('');
const ok = ref(false);
const cargando = ref(false);
const cargandoDetalle = ref(true);
const datos = ref(null);
const bloqueado = ref('');

/**
 * Instancia sin autenticación para las rutas públicas de firma. La URL base ya
 * incluye el prefijo `/api/v1/`, así que aquí solo va la ruta relativa
 * (`public/...`); anteponer `/v1` otra vez produce un 404.
 */
const publicApi = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: env.API_TIMEOUT || 30000,
  headers: { 'Content-Type': 'application/json' },
});

const token = route.params.token;
/** Parámetros de la firma temporal que Lalveravel app valida. */
const paramsFirma = () => ({
  signature: route.query.signature ?? '',
  expires: route.query.expires ?? '',
});

/** Consulta los datos del contrato; valida el mismo enlace temporal que la firma. */
async function cargarDetalle() {
  cargandoDetalle.value = true;
  try {
    const r = await publicApi.get(`public/contracts/sign/${token}`, { params: paramsFirma() });
    datos.value = r.data?.data ?? r.data;
  } catch (e) {
    logger.warn('No se pudo validar el enlace de firma', { estado: e?.response?.status });
    bloqueado.value = e?.response?.status === 403
      ? 'El enlace no es válido o ya venció. Solicite uno nuevo a la empresa.'
      : 'No se pudo cargar el contrato. Verifique el enlace e intente nuevamente.';
  } finally {
    cargandoDetalle.value = false;
  }
}

const etiquetaContrato = computed(() =>
  datos.value?.contrato === 'CONTRATO_VINCULACION'
    ? 'Vinculación por administración de flota'
    : 'Prestación de servicios');

const vigencia = computed(() => {
  if (!datos.value?.expira_en) return '—';
  return new Date(datos.value.expira_en).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
});

/** El botón se habilita cuando hay trazo dibujado o nombre escrito como alternativa. */
const tieneFirma = ref(false);

function onFirmaCambiada({ vacio }) {
  tieneFirma.value = !vacio;
}

/**
 * La firma viaja como PNG en base64 del lienzo; si el firmante usó la alternativa
 * escrita, se manda el nombre y el backend lo compone en cursiva en el PDF.
 */
function valorFirma() {
  const png = canvas.value?.toPng?.();
  if (png) return png;
  return (canvas.value?.nombre ?? '').trim();
}

async function firmar() {
  error.value = '';

  const firma = valorFirma();
  if (!firma) {
    error.value = 'Debe firmar en el recuadro antes de continuar.';
    return;
  }

  cargando.value = true;
  try {
    await publicApi.post(`public/contracts/sign/${token}`, { signature_data: firma }, { params: paramsFirma() });
    ok.value = true;
    // Recarga para obtener el PDF ya con la firma registrada.
    const r = await publicApi.get(`public/contracts/sign/${token}`, { params: paramsFirma() });
    datos.value = r.data?.data ?? r.data;
  } catch (e) {
    logger.warn('No se pudo completar la firma del contrato', { estado: e?.response?.status });
    error.value = e?.response?.status === 422
      ? (e.response.data?.message ?? 'El enlace expiró o ya fue utilizado.')
      : 'No se pudo registrar la firma. Intente nuevamente.';
  } finally {
    cargando.value = false;
  }
}

onMounted(cargarDetalle);
</script>

<style scoped>
.required::after { content: " *"; color: #dc3545; }

/* ── Tipografía unificada ── */
.noa-label        { font-size: 0.85rem; font-weight: 600; }
.card-subtitle-sm { font-size: 0.8rem; }
</style>