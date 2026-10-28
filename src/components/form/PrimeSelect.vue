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

// ── Opción «Todas…» con value '' ─────────────────────────────────────────────
// PrimeVue evalúa "¿hay algo seleccionado?" con isNotEmpty(modelValue) y un ''
// se toma como vacío: aunque el modelo coincida con una opción de valor '',
// el combobox pinta el estado vacío (sin etiqueta) en vez de la opción
// predeterminada. Si alguna opción trae value '', la respuesta interna viaja
// con un centinela y el wrapper lo traduce a '' en los dos sentidos.
const OPCION_VACIA = '__noa_opcion_vacia__';

const valorDe = (o) => (typeof props.optionValue === 'function'
    ? props.optionValue(o)
    : String(props.optionValue).split('.').reduce((acc, k) => acc?.[k], o));

const usaSentinela = computed(() => props.optionValue != null
    && !props.optionGroupLabel
    && (props.options ?? []).some((o) => o && typeof o === 'object' && valorDe(o) === ''));

const opcionesInternas = computed(() => {
    if (!usaSentinela.value) return props.options;
    return (props.options ?? []).map((o) => (valorDe(o) === '' ? { ...o, [props.optionValue]: OPCION_VACIA } : o));
});

const modeloInterno = computed({
    get: () => (usaSentinela.value && modelo.value === '' ? OPCION_VACIA : modelo.value),
    set: (valor) => { modelo.value = usaSentinela.value && valor === OPCION_VACIA ? '' : valor; },
});

const CAMPOS_CATALOGO_CONOCIDOS = [
    'search_text',
    'display_label',
    'display_name',
    'full_name',
    'company_name',
    'trade_name',
    'first_name',
    'last_name',
    'document_number',
    'vehicle_license_plate',
    'internal_number',
    'display_plate',
];

// Si el consumidor no fijó filterFields y las opciones son registros de terceros o vehículos,
// ampliamos automáticamente los campos de búsqueda para permitir buscar por documento,
// apellido, nombre compuesto, razón social, placa o número interno.
const camposFiltroEfectivos = computed(() => {
    if (props.filterFields !== undefined) return props.filterFields;
    if (props.optionGroupLabel || !Array.isArray(props.options) || props.options.length === 0) {
        return undefined;
    }
    const muestra = props.options.find((o) => o && typeof o === 'object');
    if (!muestra) return undefined;

    const tieneCamposRicos = [
        'search_text',
        'document_number',
        'first_name',
        'last_name',
        'trade_name',
        'internal_number',
    ].some((k) => muestra[k] !== undefined && muestra[k] !== null && muestra[k] !== '');

    if (!tieneCamposRicos) return undefined;

    const campos = [];
    if (props.optionLabel) campos.push(props.optionLabel);
    for (const campo of CAMPOS_CATALOGO_CONOCIDOS) {
        if (campo !== props.optionLabel) campos.push(campo);
    }
    campos.push((o) => [
        o?.first_name,
        o?.last_name,
        o?.last_name,
        o?.first_name,
        o?.company_name,
        o?.trade_name,
        o?.document_number,
        o?.vehicle_license_plate,
        o?.internal_number,
    ].filter(Boolean).join(' '));
    return campos;
});

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
        v-model="modeloInterno"
        v-bind="attrsLimpios"
        :options="opcionesInternas"
        :optionLabel="props.optionLabel"
        :optionValue="props.optionValue"
        :optionGroupLabel="props.optionGroupLabel"
        :optionGroupChildren="props.optionGroupChildren"
        :filterFields="camposFiltroEfectivos"
        :filter="filtroActivo"
        :focusOnHover="false"
        :autoFilterFocus="true"
        @filter="alFiltrar"
        @show="alMostrar"
        @hide="alOcultar"
    />
</template>
