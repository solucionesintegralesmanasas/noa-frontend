// @vitest-environment jsdom
// Comportamiento fijado del combobox del proyecto: v-model conectado al Select
// interno, sin salto por hover, foco automático del filtro (pegar funciona) y
// Enter que toma la opción única mientras el panel está abierto.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { FilterService } from '@primevue/core/api';
import PrimeVue from 'primevue/config';
import Select from 'primevue/select';
import PrimeSelect from '../PrimeSelect.vue';

const resolverCampo = (opcion, campo) => (typeof campo === 'function'
    ? campo(opcion)
    : String(campo).split('.').reduce((o, k) => o?.[k], opcion));

// Doble del Select de PrimeVue: misma API interna que usa el wrapper
// (filterValue, visibleOptions, isValidOption, onOptionSelect) con el
// FilterService real, para que el filtro coincida con el de PrimeVue.
const SelectSimulado = {
    name: 'Select',
    props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'optionGroupLabel', 'optionGroupChildren', 'optionDisabled', 'filterFields', 'focusOnHover', 'autoFilterFocus', 'filter'],
    emits: ['update:modelValue', 'change', 'filter', 'show', 'hide', 'keydown'],
    data: () => ({ filterValue: null }),
    computed: {
        visibleOptions() {
            const opciones = this.optionGroupLabel
                ? (this.options ?? []).flatMap((g) => g[this.optionGroupChildren ?? 'items'])
                : (this.options ?? []);
            if (!this.filterValue) return opciones;
            const campos = this.filterFields ?? [this.optionLabel ?? 'label'];
            return opciones.filter((o) => campos.some((c) => FilterService.filters.contains(resolverCampo(o, c), this.filterValue)));
        },
    },
    methods: {
        isValidOption(opcion) {
            return opcion != null && !(this.optionDisabled && resolverCampo(opcion, this.optionDisabled));
        },
        onOptionSelect(evento, opcion) {
            const valor = this.optionValue ? resolverCampo(opcion, this.optionValue) : opcion;
            this.$emit('update:modelValue', valor);
            this.$emit('change', { originalEvent: evento, value: valor });
        },
    },
    render() {
        return h('input', {
            'data-test': 'filtro',
            onInput: (e) => { this.filterValue = e.target.value; this.$emit('filter', { value: e.target.value }); },
            onKeydown: (e) => this.$emit('keydown', e),
        });
    },
};

const opciones = [
    { uuid: 'a1', description: 'Toyota' },
    { uuid: 'b2', description: 'Chevrolet' },
    { uuid: 'c3', description: 'Mazda' },
];

function montar(props = {}, attrs = {}) {
    return mount(PrimeSelect, {
        attrs,
        props: {
            modelValue: null,
            options: opciones,
            optionLabel: 'description',
            optionValue: 'uuid',
            filter: true,
            ...props,
        },
        global: { stubs: { Select: SelectSimulado } },
    });
}

const interno = (wrapper) => wrapper.findComponent(SelectSimulado);

async function abrir(wrapper) {
    interno(wrapper).vm.$emit('show');
    await wrapper.vm.$nextTick();
}

async function filtrar(wrapper, texto) {
    await interno(wrapper).find('[data-test="filtro"]').setValue(texto);
}

function enterEnDocumento() {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
}

afterEach(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
});

describe('PrimeSelect (wrapper del proyecto)', () => {
    it('fija focusOnHover en falso y autoFilterFocus en verdadero', () => {
        const wrapper = montar();
        expect(interno(wrapper).props('focusOnHover')).toBe(false);
        expect(interno(wrapper).props('autoFilterFocus')).toBe(true);
    });

    it('conecta el v-model del padre con el Select interno', async () => {
        const wrapper = montar({ modelValue: 'b2' });
        expect(interno(wrapper).props('modelValue')).toBe('b2');

        // La selección del interior sube al padre a través del wrapper.
        interno(wrapper).vm.$emit('update:modelValue', 'c3');
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue').at(-1)[0]).toBe('c3');
    });

    it('Enter selecciona cuando el filtro deja una sola opción', async () => {
        const wrapper = montar();
        await abrir(wrapper);
        await filtrar(wrapper, 'mazd');
        enterEnDocumento();
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue').at(-1)[0]).toBe('c3');
    });

    it('Enter no cambia nada con varias opciones', async () => {
        const wrapper = montar();
        await abrir(wrapper);
        await filtrar(wrapper, 'o');
        enterEnDocumento();
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('Enter no cambia nada sin filtrar', async () => {
        const wrapper = montar();
        await abrir(wrapper);
        enterEnDocumento();
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('en listas agrupadas también toma la opción única', async () => {
        const wrapper = montar({
            options: [{ grupo: 'G', items: opciones }],
            optionGroupLabel: 'grupo',
            optionGroupChildren: 'items',
        });
        await abrir(wrapper);
        await filtrar(wrapper, 'mazd');
        enterEnDocumento();
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue').at(-1)[0]).toBe('c3');
    });

    it('funciona con optionLabel función (catálogos de vehículos, terceros, FUEC...)', async () => {
        const wrapper = montar({
            optionLabel: (v) => `${v.description} (${v.uuid})`,
        });
        await abrir(wrapper);
        await filtrar(wrapper, 'chevro');
        enterEnDocumento();
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue').at(-1)[0]).toBe('b2');
    });

    it('ignora tildes como PrimeVue (bogota encuentra Bogotá)', async () => {
        const wrapper = montar({ options: [{ uuid: 'x', description: 'Bogotá' }, { uuid: 'y', description: 'Cali' }] });
        await abrir(wrapper);
        await filtrar(wrapper, 'bogota');
        enterEnDocumento();
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue').at(-1)[0]).toBe('x');
    });

    it('emite change al seleccionar con Enter (vistas con @change)', async () => {
        const alCambiar = vi.fn();
        const wrapper = montar({}, { onChange: alCambiar });
        await abrir(wrapper);
        await filtrar(wrapper, 'mazd');
        enterEnDocumento();
        await wrapper.vm.$nextTick();
        expect(alCambiar).toHaveBeenCalledOnce();
        expect(alCambiar.mock.calls[0][0].value).toBe('c3');
    });

    it('no toma opciones deshabilitadas', async () => {
        const wrapper = montar({
            options: [{ uuid: 'a1', description: 'Toyota', off: true }, { uuid: 'b2', description: 'Toyota Hilux' }],
            optionDisabled: 'off',
        });
        await abrir(wrapper);
        await filtrar(wrapper, 'toyota');
        enterEnDocumento();
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue').at(-1)[0]).toBe('b2');
    });

    it('usa `label` como etiqueta por defecto en objetos', async () => {
        const wrapper = montar({
            optionLabel: undefined,
            optionValue: undefined,
            options: [{ label: 'Única', value: 'x' }],
        });
        await abrir(wrapper);
        await filtrar(wrapper, 'únic');
        enterEnDocumento();
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue').at(-1)[0]).toEqual({ label: 'Única', value: 'x' });
    });

    it('al cerrar deja de escuchar Enter', async () => {
        const wrapper = montar();
        await abrir(wrapper);
        await filtrar(wrapper, 'mazd');
        interno(wrapper).vm.$emit('hide');
        await wrapper.vm.$nextTick();
        enterEnDocumento();
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('reemite el evento filter al padre', async () => {
        const wrapper = montar();
        await filtrar(wrapper, 'toy');
        expect(wrapper.emitted('filter')[0][0]).toEqual({ value: 'toy' });
    });

    it('activa el filtro solo en listas largas sin valor explícito', () => {
        const larga = Array.from({ length: 8 }, (_, i) => ({ uuid: `u${i}`, description: `Opción ${i}` }));
        const conFiltro = montar({ options: larga, filter: undefined });
        expect(conFiltro.findComponent(SelectSimulado).props('filter')).toBe(true);

        const corta = montar({ filter: undefined });
        expect(corta.findComponent(SelectSimulado).props('filter')).toBe(false);
    });

    it('respeta el filtro explícito aunque la lista sea larga', () => {
        const larga = Array.from({ length: 20 }, (_, i) => ({ uuid: `u${i}`, description: `Opción ${i}` }));
        const wrapper = montar({ options: larga, filter: false });
        expect(wrapper.findComponent(SelectSimulado).props('filter')).toBe(false);
    });
});

// Contrato con el Select real: si una actualización de PrimeVue renombra estos
// miembros internos, el Enter del wrapper dejaría de funcionar en silencio.
describe('PrimeSelect: contrato con el Select real de PrimeVue', () => {
    it('expone filterValue, visibleOptions, isValidOption y onOptionSelect', async () => {
        // jsdom no implementa matchMedia (el Select lo usa al montar).
        window.matchMedia ??= () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
        const wrapper = mount(Select, {
            props: { options: opciones, optionLabel: (o) => o.description, optionValue: 'uuid', filter: true },
            global: { plugins: [PrimeVue] },
        });
        const vm = wrapper.vm;
        expect(typeof vm.onOptionSelect).toBe('function');
        expect(typeof vm.isValidOption).toBe('function');
        vm.filterValue = 'mazd';
        await wrapper.vm.$nextTick();
        const validas = vm.visibleOptions.filter((o) => vm.isValidOption(o));
        expect(validas.map((o) => o.uuid)).toEqual(['c3']);
    });
});
