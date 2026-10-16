<!-- Wrapper del proyecto sobre PrimeVue Select.
     Se importa localmente con el mismo nombre (PrimeSelect) para no tocar
     las plantillas; fija el comportamiento de todos los combobox:
     - focusOnHover=false: la lista no salta al mover el mouse.
     - autoFilterFocus=true: al abrir, el filtro recibe foco (Ctrl+V pega).
     - Enter selecciona cuando el filtro deja una sola opción.
     No usa slots: ningún uso actual los necesita. -->
<script setup>
import { computed, onBeforeUnmount, ref, useAttrs } from 'vue';
import PrimeVueSelect from 'primevue/select';

defineOptions({ inheritAttrs: false });

const modelo = defineModel();
const emitir = defineEmits(['filter']);
const attrs = useAttrs();
const selectRef = ref(null);

const props = defineProps({
    options: { type: Array, default: () => [] },
    optionLabel: { type: [String, Function], default: undefined },
    optionValue: { type: [String, Function], default: undefined },
    optionGroupLabel: { type: [String, Function], default: undefined },
    optionGroupChildren: { type: [String, Function], default: undefined },
    filterFields: { type: Array, default: undefined },
    // Sin valor explícito, el filtro se activa solo en listas largas para no
    // ensuciar los combos cortos; con filtro hay búsqueda y Ctrl+V funciona.
    filter: { type: Boolean, default: undefined },
});

// Filtro efectivo: el explícito manda; si no, listas de más de 7 opciones.
const filtroActivo = computed(() => props.filter ?? ((props.options?.length ?? 0) > 7));

// Se reenvía todo salvo el filtro, que se reemite desde el wrapper para que el
// padre lo reciba una sola vez.
const attrsLimpios = computed(() => {
    const resto = { ...attrs };
    delete resto.onFilter;
    return resto;
});

function alFiltrar(evento) {
    emitir('filter', evento);
}

// El panel de PrimeVue se teletransporta fuera del wrapper, así que un keydown
// sobre la raíz no lo alcanza: mientras el panel está abierto se escucha en
// documento (fase de captura) para interceptar el Enter antes que PrimeVue.
// Se usan las opciones visibles del propio Select (mismo filtro: sin tildes,
// filterFields, optionLabel función o con puntos, grupos, deshabilitadas) y su
// onOptionSelect, que actualiza el modelo, emite `change` y cierra el panel.
function alTecla(evento) {
    if (evento.key !== 'Enter') return;
    const select = selectRef.value;
    if (!select?.filterValue) return;
    const validas = (select.visibleOptions ?? []).filter((opcion) => select.isValidOption(opcion));
    if (validas.length !== 1) return;
    select.onOptionSelect(evento, validas[0]);
    evento.preventDefault();
    evento.stopPropagation();
}

function alMostrar() {
    document.addEventListener('keydown', alTecla, true);
}

function alOcultar() {
    document.removeEventListener('keydown', alTecla, true);
}

onBeforeUnmount(() => document.removeEventListener('keydown', alTecla, true));
</script>

<template>
    <PrimeVueSelect
        ref="selectRef"
        v-model="modelo"
        v-bind="attrsLimpios"
        :options="props.options"
        :optionLabel="props.optionLabel"
        :optionValue="props.optionValue"
        :optionGroupLabel="props.optionGroupLabel"
        :optionGroupChildren="props.optionGroupChildren"
        :filterFields="props.filterFields"
        :filter="filtroActivo"
        :focusOnHover="false"
        :autoFilterFocus="true"
        @filter="alFiltrar"
        @show="alMostrar"
        @hide="alOcultar"
    />
</template>
