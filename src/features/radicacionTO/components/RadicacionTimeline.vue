<template>
  <div class="mb-4">
    <h3 class="timeline-section-title">Línea de tiempo del trámite</h3>

    <button
      v-if="oculta"
      type="button"
      class="alert alert-success timeline-completed-toggle"
      :aria-expanded="mostrarLinea ? 'true' : 'false'"
      aria-controls="linea-tiempo-detalle"
      @click="mostrarLinea = !mostrarLinea"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" class="timeline-check"><path d="M4.5 12.5l5 5L19.5 7"/></svg>
      <span class="timeline-completed-text">Trámite completado. Todos los pasos han sido cerrados exitosamente.</span>
      <i class="fas fa-chevron-down timeline-chevron" aria-hidden="true"></i>
      <span class="visually-hidden">{{ mostrarLinea ? 'Ocultar línea de tiempo y documentos' : 'Ver línea de tiempo y documentos' }}</span>
    </button>

    <Transition
      name="timeline-expand"
      @enter="alExpandir"
      @after-enter="limpiarAltura"
      @leave="alColapsar"
      @after-leave="limpiarAltura"
    >
      <ol v-if="lineaVisible" id="linea-tiempo-detalle" class="timeline-list">
      <li
        v-for="(p, i) in linea"
        :key="p.paso"
        class="timeline-item"
        :class="{
          'is-completed': p.estado === 'COMPLETADO',
          'is-active':    p.estado === 'EN_PROCESO',
          'is-pending':   !['COMPLETADO','EN_PROCESO'].includes(p.estado),
        }"
      >
        <!-- Rail vertical -->
        <div v-if="i < linea.length - 1" class="timeline-rail" aria-hidden="true"></div>

        <!-- Nodo -->
        <div class="timeline-node" :aria-label="`Paso ${i + 1}: ${estadoLabel(p.estado)}`">
          <!-- Completado: check SVG -->
          <svg v-if="p.estado === 'COMPLETADO'" width="14" height="14" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M2.5 7.5l3.5 3.5L11.5 3"/>
          </svg>
          <!-- En proceso: número -->
          <span v-else-if="p.estado === 'EN_PROCESO'" aria-hidden="true">{{ i + 1 }}</span>
          <!-- Pendiente: número tenue -->
          <span v-else class="node-number" aria-hidden="true">{{ i + 1 }}</span>
        </div>

        <!-- Contenido -->
        <div class="timeline-content" :class="{ 'active-card': p.estado === 'EN_PROCESO' }">
          <div class="timeline-row">
            <h4 class="timeline-title" :class="{ 'is-done': p.estado === 'COMPLETADO' }">
              {{ etiquetaPaso(p.paso) }}
            </h4>
            <span class="status-badge" :class="`status-${p.estado.toLowerCase().replace('_','-')}`">
              {{ estadoLabel(p.estado) }}
            </span>
          </div>

          <!-- Documentos del paso -->
          <div v-if="documentosDe(p.paso).length" class="docs-grid">
            <button
              v-for="d in documentosDe(p.paso)"
              :key="d.clave"
              type="button"
              class="doc-btn"
              :disabled="!d.disponible || generando === d.clave"
              :title="d.motivo_bloqueo ?? `Descargar ${d.etiqueta} en PDF`"
              :aria-label="`Descargar ${d.etiqueta} en PDF`"
              @click="descargar(d)"
            >
              <!-- Ícono documento -->
              <svg v-if="generando !== d.clave" width="18" height="18" fill="none" stroke="#2563eb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M13 2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V6z"/>
                <path d="M13 2v5h5"/>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke-dasharray="56.5" stroke-dashoffset="14" style="animation:spin .8s linear infinite;transform-origin:center"/>
              </svg>
              <span class="doc-name">{{ d.etiqueta }}</span>
              <span class="doc-action">{{ generando === d.clave ? 'Generando…' : 'Ver PDF' }}</span>
            </button>
          </div>
        </div>
      </li>
      </ol>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import service from '../services/radicacion.service.js';
import { toast } from '@/utils/toast.js';
import { etiquetaPaso } from '../utils/pasosRadicacion.js';

const props = defineProps({
  linea: { type: Array, default: () => [] },
  documentos: { type: Object, default: () => ({}) },
  expedienteUuid: { type: String, default: '' },
  estadoGlobal: { type: String, default: '' },
});

const generando = ref('');
const mostrarLinea = ref(false);

const documentosDe = (paso) => props.documentos?.[paso] ?? [];

const oculta = computed(() => props.estadoGlobal === 'COMPLETADO');

const lineaVisible = computed(() => !oculta.value || mostrarLinea.value);

const indiceActual = computed(() => {
  const i = props.linea.findIndex((p) => p.estado === 'EN_PROCESO');
  return i === -1 ? props.linea.length - 1 : i;
});

const estadoLabel = (estado) => {
  if (estado === 'COMPLETADO') return 'Completado';
  if (estado === 'EN_PROCESO') return 'En proceso';
  return 'Pendiente';
};

async function descargar(documento) {
  generando.value = documento.clave;
  try {
    await service.descargarDocumento(props.expedienteUuid, documento.clave);
  } catch (e) {
    toast('No se pudo generar el documento', e?.message ?? 'Intente nuevamente.', 'error');
  } finally {
    generando.value = '';
  }
}

const respetaMovimientoReducido = () =>
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function alExpandir(el) {
  if (respetaMovimientoReducido()) return;
  el.style.overflow = 'hidden';
  el.style.height = '0px';
  el.style.opacity = '0';
  void el.offsetHeight;
  el.style.transition = 'height .55s cubic-bezier(.4, 0, .2, 1), opacity .45s ease';
  el.style.height = `${el.scrollHeight}px`;
  el.style.opacity = '1';
}

function alColapsar(el) {
  if (respetaMovimientoReducido()) return;
  el.style.overflow = 'hidden';
  el.style.height = `${el.scrollHeight}px`;
  el.style.opacity = '1';
  void el.offsetHeight;
  el.style.transition = 'height .45s cubic-bezier(.4, 0, .2, 1), opacity .35s ease';
  el.style.height = '0px';
  el.style.opacity = '0';
}

function limpiarAltura(el) {
  el.style.height = '';
  el.style.opacity = '';
  el.style.transition = '';
  el.style.overflow = '';
}

defineExpose({ indiceActual, oculta, mostrarLinea, lineaVisible });
</script>

<style scoped>
/* ── Sección título ── */
.timeline-section-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #6b7686;
  margin: 0 0 18px;
}

/* ── Lista ── */
.timeline-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* ── Item: grid 28px + 1fr con gap 16px ── */
.timeline-item {
  position: relative;
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 0 16px;
  padding-bottom: 22px;
}

/* ── Rail vertical ── */
.timeline-rail {
  position: absolute;
  left: 13px;
  top: 28px;
  bottom: 0;
  width: 2px;
  background: #e3e8ef;
}
.timeline-item.is-completed .timeline-rail { background: #0fa968; }
.timeline-item.is-active    .timeline-rail { background: linear-gradient(180deg, #2563eb 0%, #e3e8ef 100%); }

/* ── Nodo ── */
.timeline-node {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #e3e8ef;
  font-size: 0.75rem;
  font-weight: 700;
  color: #6b7686;
  background: #fff;
  box-sizing: border-box;
}
.timeline-item.is-completed .timeline-node {
  background: #0fa968;
  border-color: #0fa968;
  color: #fff;
}
.timeline-item.is-active .timeline-node {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
  box-shadow: 0 0 0 5px #e8f0fe;
}
.node-number { color: #adb5bd; }

/* ── Contenido ── */
.timeline-content {
  min-width: 0;
  padding-top: 3px;
}

/* Card del paso activo */
.active-card {
  margin-top: -6px;
  padding: 9px 14px 14px;
  border: 1px solid #bfd3fb;
  border-radius: 12px;
  background: #f5f9ff;
}

/* ── Fila título + badge ── */
.timeline-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.timeline-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2a37;
}
.timeline-title.is-done {
  color: #6b7686;
  font-weight: 500;
}

/* ── Badges de estado ── */
.status-badge {
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}
.status-completado   { background: #e4f7ee; color: #0b7a4b; }
.status-en-proceso   { background: #e8f0fe; color: #1d4ed8; }
.status-pendiente    { background: #f1f3f5; color: #6b7686; }

/* ── Grid de documentos 1fr 1fr ── */
.docs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 12px;
}

/* ── Botón de documento ── */
.doc-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #e3e8ef;
  border-radius: 10px;
  background: #fff;
  font: inherit;
  font-size: 0.85rem;
  color: #1f2a37;
  text-align: left;
  cursor: pointer;
  transition: border-color .15s, box-shadow .15s;
}
.doc-btn:hover:not(:disabled) {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37,99,235,.08);
}
.doc-btn:disabled {
  opacity: .45;
  cursor: not-allowed;
}
.doc-name {
  flex: 1;
  font-weight: 500;
}
.doc-action {
  font-size: 0.75rem;
  font-weight: 700;
  color: #2563eb;
  white-space: nowrap;
}

/* ── Aviso expandible de trámite completado ── */
.timeline-completed-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.timeline-completed-toggle:hover {
  border-color: #0fa968;
  box-shadow: 0 0 0 3px rgba(15,169,104,.12);
}
.timeline-completed-toggle:focus-visible {
  outline: 2px solid #0b7a4b;
  outline-offset: 2px;
}
.timeline-check {
  flex-shrink: 0;
}
.timeline-completed-text {
  flex: 1;
}
.timeline-chevron {
  flex-shrink: 0;
  transition: transform .35s ease;
}
.timeline-completed-toggle[aria-expanded="true"] .timeline-chevron {
  transform: rotate(180deg);
}

/* ── Animación del expandible (el JS fija la altura real) ── */
.timeline-expand-enter-active,
.timeline-expand-leave-active {
  overflow: hidden;
  will-change: height, opacity;
}

@media (max-width: 576px) {
  .docs-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .timeline-expand-enter-active,
  .timeline-expand-leave-active,
  .timeline-chevron {
    transition: none;
  }
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>