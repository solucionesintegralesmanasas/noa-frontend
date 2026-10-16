<template>
  <div class="row gx-3">
    <div class="col-12 col-xxl-10 offset-xxl-1 col-xl-12">
      <BasePageHeader
        title="Nuevo trámite de radicación"
        subtitle="Cree el expediente para iniciar la ruta de radicación de tarjeta de operación"
        icon="fad fa-id-card text-primary"
        :breadcrumbs="[{ label: 'Radicación de tarjeta de operación', to: '/radicacion' }, { label: 'Nuevo' }]"
        :show-back="true"
        @back="volver"
      />

      <!-- ══════════════ Formulario: Nuevo trámite ══════════════ -->
      <div class="card border-0 shadow-sm mt-3">
        <div class="card-header bg-white py-3 px-4 border-bottom">
          <div class="d-flex align-items-center gap-2">
            <span class="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center" style="width:32px;height:32px;" aria-hidden="true">
              <i class="fad fa-plus text-success"></i>
            </span>
            <h2 class="h6 mb-0 fw-semibold">Nuevo trámite</h2>
            <span class="badge bg-secondary bg-opacity-10 text-secondary ms-2 fw-normal rounded-pill">
              <i class="fas fa-asterisk me-1 obligatorio-icon" aria-hidden="true"></i>
              Campos obligatorios
            </span>
          </div>
        </div>

        <div class="card-body px-4 py-4">
          <form ref="formRef" @submit.prevent="guardar" novalidate>
            <!-- Sección 1: Identificación -->
            <div class="mb-4">
              <p class="noa-section-label text-muted mb-3 border-bottom pb-2">
                <i class="fas fa-tag me-1" aria-hidden="true"></i>Identificación del trámite
              </p>
              <div class="row g-3">
                <div class="col-12 col-sm-6 col-md-4">
                  <label class="form-label required noa-label" for="f-link_type">Tipo de trámite</label>
                  <PrimeSelect
                    :input-id="'f-link_type'"
                    v-model="formData.link_type"
                    :options="tipos"
                    option-label="label"
                    option-value="value"
                    placeholder="Seleccione el tipo"
                    class="w-100"
                    :invalid="!!errors.link_type"
                  />
                  <div v-if="errors.link_type" class="invalid-feedback d-block" id="f-link_type-error" role="alert">
                    {{ errors.link_type }}
                  </div>
                </div>

                <div class="col-12 col-sm-6 col-md-4">
                  <label class="form-label required noa-label" for="f-procedure_code">Código del trámite</label>
                  <input
                    id="f-procedure_code"
                    type="text"
                    autocomplete="off"
                    class="form-control"
                    v-model="formData.procedure_code"
                    placeholder="Ej. TO-2026-001"
                    :class="{ 'is-invalid': errors.procedure_code }"
                    :aria-invalid="!!errors.procedure_code"
                    :aria-describedby="errors.procedure_code ? 'f-codigo-error' : undefined"
                  />
                  <div v-if="errors.procedure_code" class="invalid-feedback d-block" id="f-procedure_code-error" role="alert">
                    {{ errors.procedure_code }}
                  </div>
                </div>

                <div class="col-12 col-sm-6 col-md-4">
                  <label class="form-label required noa-label" for="f-date_of_creation">Fecha de creación</label>
                  <DateInput
                    id="f-date_of_creation"
                    v-model="formData.date_of_creation"
                    class="form-control"
                    placeholder="dd/mm/aaaa"
                    autocomplete="off"
                    :class="{ 'is-invalid': errors.date_of_creation }"
                    :aria-invalid="!!errors.date_of_creation"
                    :aria-describedby="errors.date_of_creation ? 'f-fecha-error' : undefined"
                  />
                  <div v-if="errors.date_of_creation" class="invalid-feedback d-block" id="f-date_of_creation-error" role="alert">
                    {{ errors.date_of_creation }}
                  </div>
                </div>

                <div class="col-12 col-sm-6">
                  <label class="form-label noa-label" for="f-subject">Asunto</label>
                  <input
                    id="f-subject"
                    type="text"
                    autocomplete="off"
                    class="form-control"
                    v-model="formData.subject"
                    placeholder="Radicación de tarjeta de operación"
                  />
                  <div class="form-text">Opcional. Se usa como referencia interna del expediente.</div>
                </div>
              </div>
            </div>

            <!-- Sección 2: Vehículo y ubicación -->
            <div class="mb-4">
              <p class="noa-section-label text-muted mb-3 border-bottom pb-2">
                <i class="fas fa-truck me-1" aria-hidden="true"></i>Vehículo y ubicación
              </p>
              <div class="row g-3">
                <div class="col-12 col-sm-6">
                  <label class="form-label required noa-label" for="f-vehicle_uuid">Vehículo</label>
                  <PrimeSelect
                    :input-id="'f-vehicle_uuid'"
                    v-model="formData.vehicle_uuid"
                    :options="vehiculos"
                    option-label="label"
                    option-value="value"
                    placeholder="Buscar por placa"
                    showClear
                    filter
                    :loading="cargandoListas"
                    class="w-100"
                    :invalid="!!errors.vehicle_uuid"
                  />
                  <div v-if="errors.vehicle_uuid" class="invalid-feedback d-block" id="f-vehicle_uuid-error" role="alert">
                    {{ errors.vehicle_uuid }}
                  </div>
                </div>

                <div class="col-12 col-sm-6">
                  <label class="form-label required noa-label" for="f-city_uuid">Ciudad de radicación</label>
                  <PrimeSelect
                    :input-id="'f-city_uuid'"
                    v-model="formData.city_uuid"
                    :options="ciudades"
                    option-label="label"
                    option-value="value"
                    placeholder="Seleccione la ciudad"
                    showClear
                    filter
                    :loading="cargandoListas"
                    class="w-100"
                    :invalid="!!errors.city_uuid"
                  />
                  <div v-if="errors.city_uuid" class="invalid-feedback d-block" id="f-city_uuid-error" role="alert">
                    {{ errors.city_uuid }}
                  </div>
                </div>

                <div class="col-12">
                  <label class="form-label required noa-label" for="f-territorial_director_uuid">Dirección territorial</label>
                  <PrimeSelect
                    :input-id="'f-territorial_director_uuid'"
                    v-model="formData.territorial_director_uuid"
                    :options="directores"
                    option-label="label"
                    option-value="value"
                    placeholder="Seleccione la dirección territorial"
                    showClear
                    filter
                    :loading="cargandoListas"
                    class="w-100"
                    :invalid="!!errors.territorial_director_uuid"
                  />
                  <div v-if="errors.territorial_director_uuid" class="invalid-feedback d-block" id="f-territorial_director_uuid-error" role="alert">
                    {{ errors.territorial_director_uuid }}
                  </div>
                  <div v-if="directorSugerido" class="form-text">
                    <i class="fas fa-circle-info me-1" aria-hidden="true"></i>
                    Dirección por defecto de la empresa: <strong>{{ directorSugerido }}</strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- Acciones -->
            <div class="pt-3">
              <BaseFormActions
                :submitting="isSubmitting"
                :is-edit-mode="false"
                submit-label="Crear expediente e iniciar trámite"
                cancel-label="Cancelar"
                @cancel="volver"
              />
            </div>
          </form>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import BasePageHeader from '@/components/BasePageHeader.vue';
import BaseFormActions from '@/components/BaseFormActions.vue';
import PrimeSelect from '@/components/form/PrimeSelect.vue';
import DateInput from '@/components/form/DateInput.vue';
import { useAccessibleForm } from '@/hooks/useAccessibleForm.js';
import service, { mensajeDeError } from '../services/radicacion.service.js';
import vehiclesService from '@/features/vehicles/services/vehicles.service.js';
import systemConfigurationService from '@/features/systemConfiguration/services/systemConfiguration.service.js';
import { useUserStore } from '@store';
import { toast } from '@/utils/toast.js';
import { dateUtils } from '@/utils/date.js';
import { logger } from '@/utils/logger.js';
import { tiposDeTramite as tipos } from '../utils/pasosRadicacion.js';

const router = useRouter();
const formRef = ref(null);

const { formData, errors, isSubmitting, validateAndFocus, submit } = useAccessibleForm(
  {
    link_type: 'CAMBIO_DE_EMPRESA',
    vehicle_uuid: '',
    procedure_code: '',
    date_of_creation: dateUtils.now('YYYY-MM-DD'),
    subject: 'Radicación de tarjeta de operación',
    city_uuid: '',
    territorial_director_uuid: '',
  },
  {
    link_type: { required: true, label: 'Tipo de trámite' },
    vehicle_uuid: { required: true, label: 'Vehículo' },
    procedure_code: { required: true, label: 'Código del trámite', maxLength: 50 },
    date_of_creation: { required: true, label: 'Fecha de creación' },
    city_uuid: { required: true, label: 'Ciudad de radicación' },
    territorial_director_uuid: { required: true, label: 'Dirección territorial' },
  },
);

const cargandoListas = ref(true);
const vehiculos = ref([]);
const ciudades = ref([]);
const directores = ref([]);
const directorSugerido = ref('');

async function cargarListas() {
  cargandoListas.value = true;
  try {
    const v = await vehiclesService.list({ per_page: 100 });
    const items = v.data?.data?.data ?? v.data?.data ?? v.data ?? [];
    const vistos = new Set();
    vehiculos.value = (Array.isArray(items) ? items : []).filter((x) => {
      const k = x?.uuid ?? x?.vehicle_license_plate;
      if (!k || vistos.has(k)) return false;
      vistos.add(k);
      return true;
    }).map((x) => ({ label: `${x.vehicle_license_plate ?? 'Sin placa'} — ${x.line ?? ''}`, value: x.uuid }));
  } catch (e) { logger.warn('No se cargaron vehículos'); }
  try { ciudades.value = await service.listarCiudades(); } catch { ciudades.value = []; }
  try { directores.value = await service.listarDirectores(); } catch { directores.value = []; }
  try {
    const userStore = useUserStore();
    if (userStore.company_uuid) {
      const cfg = await systemConfigurationService.getByCompany(userStore.company_uuid);
      const data = cfg.data?.data ?? cfg.data ?? {};
      if (data.default_territorial_director_uuid && !formData.territorial_director_uuid) formData.territorial_director_uuid = data.default_territorial_director_uuid;
      directorSugerido.value = data.default_territorial_director_name || '';
    }
  } catch (e) { logger.warn('No se cargó la dirección territorial por defecto'); }
  finally { cargandoListas.value = false; }
}

const volver = () => router.push('/radicacion');

async function guardar() {
  if (!(await validateAndFocus(formRef.value ?? document))) {
    toast('Revise los datos del formulario', '', 'warning');
    return;
  }
  await submit(async () => {
    try {
      const r = await service.crearExpediente({ ...formData });
      const creado = r.data?.data ?? r.data;
      toast('Expediente creado', '', 'success');
      router.push(`/radicacion/${creado.expediente.uuid}`);
    } catch (e) {
      const detalles = e.response?.data?.errors ?? e.response?.data?.error?.details ?? {};
      if (Array.isArray(detalles)) detalles.forEach((d) => { if (d?.field) errors[d.field] = (d.messages ?? []).join(' '); });
      else Object.assign(errors, detalles);
      toast('Revise los datos del formulario', mensajeDeError(e), 'error');
    }
  });
}

onMounted(cargarListas);
</script>

<style scoped>
.required::after { content: " *"; color: #dc3545; }
.noa-label         { font-size: 0.85rem; font-weight: 600; }
.noa-section-label { font-size: 0.85rem; font-weight: 600; }
.obligatorio-icon  { font-size: 0.55rem; }
</style>
