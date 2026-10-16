<!-- Wrapper del proyecto sobre PrimeVue MultiSelect.
     Se importa localmente con el mismo nombre (PrimeMultiSelect).
     - focusOnHover=false: la lista no salta al mover el mouse.
     - Filtro: el explícito manda; si no, se activa solo en listas de más
       de 7 opciones (misma convención que PrimeSelect).
     - autoFilterFocus solo con filtro activo: sin filtro PrimeVue revienta
       en onOverlayEnter (this.$refs.filterInput es undefined). -->
<script setup>
import { computed } from 'vue';
import PrimeVueMultiSelect from 'primevue/multiselect';

defineOptions({ inheritAttrs: false });

const props = defineProps({
    options: { type: Array, default: () => [] },
    // Sin valor explícito, el filtro se activa solo en listas largas para no
    // ensuciar los combos cortos; con filtro hay búsqueda y Ctrl+V funciona.
    filter: { type: Boolean, default: undefined },
});

// Filtro efectivo: el explícito manda; si no, listas de más de 7 opciones.
// autoFilterFocus va atado a él: activarlo sin filtro rompe PrimeVue.
const filtroActivo = computed(() => props.filter ?? ((props.options?.length ?? 0) > 7));
</script>

<template>
    <PrimeVueMultiSelect
        v-bind="$attrs"
        :options="props.options"
        :filter="filtroActivo"
        :focusOnHover="false"
        :autoFilterFocus="filtroActivo"
    />
</template>
