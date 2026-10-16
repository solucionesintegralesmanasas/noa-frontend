<template>
  <div class="sigpad">
    <label v-if="label" class="sigpad-label" :for="inputId">{{ label }}</label>

    <div class="sigpad-box" :class="{ 'has-error': error }">
      <canvas
        :id="inputId"
        ref="canvasRef"
        class="sigpad-canvas"
        :style="{ height: `${height}px` }"
        role="img"
        :aria-label="ariaLabel"
        @mousedown="startDraw"
        @mousemove="draw"
        @mouseup="stopDraw"
        @mouseleave="stopDraw"
        @touchstart.prevent="startDraw"
        @touchmove.prevent="draw"
        @touchend="stopDraw"
        @touchcancel="stopDraw"
      ></canvas>
      <div v-show="isEmpty" class="sigpad-placeholder" aria-hidden="true">{{ placeholder }}</div>
    </div>

    <div class="sigpad-actions">
      <button type="button" class="sigpad-btn sigpad-btn-clear" :disabled="loading" @click="limpiar">
        Limpiar
      </button>
    </div>

    <p v-if="error" class="sigpad-error" role="alert">{{ error }}</p>

    <!-- Alternativa accesible: el canvas no se puede operar con teclado. -->
    <div class="sigpad-alt">
      <button
        type="button"
        class="sigpad-alt-toggle"
        :aria-expanded="mostrarAlternativa"
        aria-controls="sigpad-alt-campo"
        @click="alternativaVisible = !alternativaVisible"
      >
        ¿No puede firmar con el dedo o el mouse? Escriba su nombre
      </button>
      <div v-if="alternativaVisible" id="sigpad-alt-campo" class="mt-2">
        <label class="sigpad-label" for="sigpad-nombre">Nombre completo</label>
        <input
          id="sigpad-nombre"
          class="form-control form-control-lg"
          type="text"
          autocomplete="name"
          :value="nombre"
          placeholder="Escriba su nombre tal como aparece en el documento"
          :aria-describedby="'sigpad-nombre-hint'"
          @input="onNombre($event.target.value)"
        />
        <div id="sigpad-nombre-hint" class="form-text">
          Se usará como firma en cursiva en lugar del trazo.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Lienzo de firma digital reutilizable.
 *
 * Solo dibuja y expone el trazo como PNG en base64; no guarda nada. Quien lo usa
 * decide adónde enviarlo. Incluye una alternativa escrita porque un canvas no se
 * puede operar con teclado ni con lector de pantalla.
 */
import { nextTick, onMounted, onUnmounted, ref } from 'vue';

const props = defineProps({
  label: { type: String, default: '' },
  placeholder: { type: String, default: 'Firme aquí' },
  height: { type: Number, default: 190 },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  inputId: { type: String, default: 'sigpad-canvas' },
});

const emit = defineEmits(['change']);

const canvasRef = ref(null);
const isEmpty = ref(true);
const nombre = ref('');
const alternativaVisible = ref(false);

const emitChange = (vacio) => emit('change', { vacio });

let ctx = null;
let dibujando = false;
let ultimoX = 0;
let ultimoY = 0;
let observer = null;

const ariaLabel = 'Área de firma. Dibuje su firma con el dedo, el mouse o un lápiz.';

/** Mapea coordenadas de pantalla a píxeles del canvas (soporta zoom y HiDPI). */
function posicion(evento) {
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const origen = evento.touches?.length ? evento.touches[0]
    : evento.changedTouches?.length ? evento.changedTouches[0]
      : evento;

  const escalaX = rect.width > 0 ? canvas.width / rect.width : 1;
  const escalaY = rect.height > 0 ? canvas.height / rect.height : 1;

  return {
    x: (origen.clientX - rect.left) * escalaX,
    y: (origen.clientY - rect.top) * escalaY,
  };
}

function pintar() {
  ctx = canvasRef.value.getContext('2d');
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function iniciar() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const ancho = Math.max(1, Math.round(rect.width || canvas.offsetWidth || 480));
  const alto = Math.max(1, Math.round(rect.height || props.height));

  if (canvas.width === ancho && canvas.height === alto && ctx) return;

  // Al redimensionar se conserva lo ya dibujado.
  let respaldo = null;
  if (!isEmpty.value && canvas.width > 0 && canvas.height > 0) {
    respaldo = canvas.toDataURL('image/png');
  }

  canvas.width = ancho;
  canvas.height = alto;
  pintar();

  if (respaldo) {
    const imagen = new Image();
    imagen.onload = () => ctx.drawImage(imagen, 0, 0, ancho, alto);
    imagen.src = respaldo;
  }
}

function startDraw(evento) {
  if (!ctx) iniciar();
  dibujando = true;
  const { x, y } = posicion(evento);
  ultimoX = x;
  ultimoY = y;
}

function draw(evento) {
  if (!dibujando || !ctx) return;
  const { x, y } = posicion(evento);
  ctx.beginPath();
  ctx.moveTo(ultimoX, ultimoY);
  ctx.lineTo(x, y);
  ctx.stroke();
  ultimoX = x;
  ultimoY = y;

  if (isEmpty.value) {
    isEmpty.value = false;
    emitChange(false);
  }
}

function stopDraw() {
  dibujando = false;
}

function limpiar() {
  if (!canvasRef.value || !ctx) return;
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  if (!isEmpty.value) {
    isEmpty.value = true;
    emitChange(true);
  }
}

/** Trazo como PNG en base64 (data URL), o cadena vacía si no se dibujó nada. */
function toPng() {
  if (!canvasRef.value || isEmpty.value) return '';
  return canvasRef.value.toDataURL('image/png');
}

function onNombre(valor) {
  nombre.value = valor;
  emitChange(!valor.trim() && isEmpty.value);
}

onMounted(() => {
  nextTick(() => {
    iniciar();
    if (window.ResizeObserver && canvasRef.value) {
      observer = new ResizeObserver(() => iniciar());
      observer.observe(canvasRef.value);
    }
    window.addEventListener('resize', iniciar);
  });
});

onUnmounted(() => {
  observer?.disconnect();
  window.removeEventListener('resize', iniciar);
});

defineExpose({ toPng, limpiar, isEmpty, nombre });
</script>

<style scoped>
.sigpad {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
}

.sigpad-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--p-text-color, #4b5563);
}

.sigpad-box {
    position: relative;
    border: 2px dashed var(--p-content-border-color, #e5e7eb);
    border-radius: 8px;
    background-color: #ffffff;
    overflow: hidden;
    touch-action: none;
}

.sigpad-box:focus-within {
    border-color: var(--p-primary-color, #3b82f6);
}

.sigpad-box.has-error {
    border-color: #ef4444;
}

.sigpad-canvas {
    display: block;
    width: 100%;
    cursor: crosshair;
    touch-action: none;
}

.sigpad-placeholder {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1rem;
    color: #9ca3af;
    pointer-events: none;
    user-select: none;
    font-style: italic;
}

.sigpad-actions {
    display: flex;
    justify-content: flex-end;
}

.sigpad-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.4rem 0.9rem;
    font-size: 0.8rem;
    font-weight: 500;
    border: 1px solid var(--p-content-border-color, #e5e7eb);
    border-radius: 6px;
    background-color: transparent;
    color: var(--p-text-color, #4b5563);
    cursor: pointer;
}

.sigpad-btn:hover:not(:disabled) {
    background-color: var(--p-content-hover-background, #f3f4f6);
}

.sigpad-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.sigpad-error {
    font-size: 0.78rem;
    color: #ef4444;
    margin: 0;
}

.sigpad-alt-toggle {
    background: none;
    border: none;
    padding: 0;
    font-size: 0.78rem;
    color: var(--p-primary-color, #3b82f6);
    text-decoration: underline;
    cursor: pointer;
}
</style>