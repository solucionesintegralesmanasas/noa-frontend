<!-- Wrapper del proyecto sobre PrimeVue MultiSelect.
     Se importa localmente con el mismo nombre (PrimeMultiSelect).
     - focusOnHover=false: la lista no salta al mover el mouse.
     - Filtro: el explícito manda; si no, se activa solo en listas de más
       de 7 opciones (misma convención que PrimeSelect).
     - autoFilterFocus solo con filtro activo: sin filtro PrimeVue reventa
       en onOverlayEnter (this.$refs.filterInput es undefined).
     - Control "Seleccionar todos" propio: PrimeVue 4 dibuja la casilla de
       marcar todo de la cabecera sin texto (un cuadro mudo que igual marca
       todo), así que se desactiva la suya (showToggleAll=false) y se pone un
       checkbox con su etiqueta, que reutiliza el comportamiento nativo
       (marca o desmarca las opciones visibles, respetando el filtro). -->
<script setup>
import { computed, ref, useAttrs, useId } from 'vue';
import PrimeVueMultiSelect from 'primevue/multiselect';

defineOptions({ inheritAttrs: false });

const props = defineProps({
    options: { type: Array, default: () => [] },
    // Sin valor explícito, el filtro se activa solo en listas largas para no
    // ensuciar los combos cortos; con filtro hay búsqueda y Ctrl+V funciona.
    filter: { type: Boolean, default: undefined },
});

const attrs = useAttrs();
const interno = ref(null);
const idControl = useId();

// Filtro efectivo: el explícito manda; si no, listas de más de 7 opciones.
// autoFilterFocus va atado a él: activarlo sin filtro rompe PrimeVue.
const filtroActivo = computed(() => props.filter ?? ((props.options?.length ?? 0) > 7));

// Estado real de PrimeVue (respeta el filtro: solo cuenta las opciones visibles).
const todosMarcados = computed(() => Boolean(interno.value?.allSelected));

// Marca o desmarca todas las opciones visibles reutilizando la lógica de
// PrimeVue. Si la versión instalada no expone el método, se marca todo.
function alternarTodos() {
    const vm = interno.value;
    if (vm && typeof vm.onToggleAll === 'function') {
        vm.onToggleAll();
        return;
    }
    const emitir = attrs['onUpdate:modelValue'];
    if (typeof emitir === 'function') {
        emitir((props.options ?? []).map((opcion) => (opcion && typeof opcion === 'object' && 'value' in opcion ? opcion.value : opcion)));
    }
}
</script>

<template>
    <PrimeVueMultiSelect
        ref="interno"
        v-bind="$attrs"
        :options="props.options"
        :filter="filtroActivo"
        :focusOnHover="false"
        :autoFilterFocus="filtroActivo"
        :showToggleAll="false"
        :selectAll="null"
    >
        <template #header>
            <div v-if="(props.options?.length ?? 0) > 0" class="seleccionar-todos">
                <input :id="idControl" type="checkbox" :checked="todosMarcados" @change="alternarTodos" />
                <label :for="idControl">Seleccionar todos</label>
            </div>
        </template>
    </PrimeVueMultiSelect>
</template>

<style scoped>
/* El panel se teletransporta al body, pero el label se compila aquí y conserva
   su data-v, así que el selector scoped sigue aplicando. */
.seleccionar-todos {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 0.75rem;
    font-size: 0.82rem;
    color: var(--p-text-color, inherit);
    cursor: pointer;
    user-select: none;
}

.seleccionar-todos label {
    margin: 0;
    cursor: pointer;
}

.seleccionar-todos input {
    width: 1rem;
    height: 1rem;
    margin: 0;
    accent-color: var(--p-primary-color, #10b981);
    cursor: pointer;
}
</style>
