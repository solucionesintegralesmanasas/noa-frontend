<!-- Entrada de fecha del proyecto: un input type="date" nativo que además
     acepta pegar fechas (dd/mm/aaaa, aaaa/mm/dd y variantes RUNT) y las
     normaliza a ISO. Escribir a mano no es interceptable (el nativo no expone
     el texto inválido), así que sin placeholder del padre sugiere pegar.
     Es reemplazo directo del nativo: id, class, aria, required, placeholder
     y title del padre se reenvían tal cual (el padre manda). -->
<script setup>
import { ref } from 'vue';
import { parsearFechaFlexible } from '@/utils/date.js';

const modelo = defineModel();
const props = defineProps({
    id: { type: String, default: undefined },
});
const inputRef = ref(null);

// Pista cuando el padre no trae su propio placeholder. Va ANTES de $attrs
// para que un placeholder/title explícito del padre lo pise.
const PISTA_PLACEHOLDER = 'Pega dd/mm/aaaa';
const PISTA_TITLE = 'Puedes pegar la fecha (dd/mm/aaaa o aaaa/mm/dd)';

function alEscribir(evento) {
    // Se conserva el valor nativo tal cual (cadena vacía al limpiar), para no
    // cambiar la semántica que ya tenían los formularios con input type="date".
    modelo.value = evento.target.value;
}

function alPegar(evento) {
    const texto = evento.clipboardData?.getData('text') ?? '';
    const iso = parsearFechaFlexible(texto);
    if (!iso) return;
    // Fecha válida pegada desde otro formato (p. ej. páginas del gobierno):
    // se fija el ISO y se avisa como escritura + cambio para que las
    // validaciones (@input/@change/@blur del padre) reaccionen igual.
    evento.preventDefault();
    modelo.value = iso;
    if (inputRef.value) {
        inputRef.value.value = iso;
        inputRef.value.dispatchEvent(new Event('input', { bubbles: true }));
        inputRef.value.dispatchEvent(new Event('change', { bubbles: true }));
    }
}
</script>

<template>
    <input
        ref="inputRef"
        type="date"
        :id="props.id"
        :value="modelo ?? ''"
        :placeholder="PISTA_PLACEHOLDER"
        :title="PISTA_TITLE"
        v-bind="$attrs"
        @input="alEscribir"
        @paste="alPegar"
    />
</template>
