// @vitest-environment jsdom
// PrimeMultiSelect del proyecto: fija el comportamiento sin tocar plantillas.
import { afterEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import MultiSelectReal from 'primevue/multiselect';
import PrimeMultiSelect from '../PrimeMultiSelect.vue';

// jsdom no implementa matchMedia (PrimeVue lo usa al montar).
window.matchMedia ??= () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });

const MultiSimulado = {
    name: 'MultiSelect',
    props: ['modelValue', 'options', 'focusOnHover', 'autoFilterFocus'],
    emits: ['update:modelValue'],
    template: '<div data-test="multi"></div>',
};

describe('PrimeMultiSelect (wrapper del proyecto)', () => {
    it('fija focusOnHover en falso y ata filtro y autoFilterFocus (apagados en lista corta)', () => {
        const wrapper = mount(PrimeMultiSelect, {
            props: { modelValue: [], options: [{ value: 'a', label: 'A' }] },
            global: { stubs: { MultiSelect: MultiSimulado } },
        });
        const interno = wrapper.findComponent(MultiSimulado);
        expect(interno.props('focusOnHover')).toBe(false);
        expect(interno.props('autoFilterFocus')).toBe(false);
    });

    it('activa filtro y autoFilterFocus en listas largas (>7), como PrimeSelect', () => {
        const opciones = Array.from({ length: 8 }, (_, i) => ({ value: `v${i}`, label: `L${i}` }));
        const wrapper = mount(PrimeMultiSelect, {
            props: { modelValue: [], options: opciones },
            global: { stubs: { MultiSelect: MultiSimulado } },
        });
        const interno = wrapper.findComponent(MultiSimulado);
        expect(interno.props('autoFilterFocus')).toBe(true);
    });

    it('reenvía modelo y opciones al interior', () => {
        const wrapper = mount(PrimeMultiSelect, {
            props: { modelValue: ['a'], options: [{ value: 'a', label: 'A' }] },
            global: { stubs: { MultiSelect: MultiSimulado } },
        });
        const interno = wrapper.findComponent(MultiSimulado);
        expect(interno.props('modelValue')).toEqual(['a']);
        expect(interno.props('options')).toHaveLength(1);
    });
});

// Regresión: el formulario de afiliados abre los MultiSelect sin `filter` y
// PrimeVue revienta en onOverlayEnter (this.$refs.filterInput.$el) cuando
// autoFilterFocus es true sin filtro. El wrapper solo lo activa con filtro.
describe('PrimeMultiSelect: sin filtro no rompe al abrir (afiliados)', () => {
    function montarReal(props = {}) {
        return mount(PrimeMultiSelect, {
            props: { modelValue: [], options: [{ value: 'a', label: 'A' }], ...props },
            global: { plugins: [PrimeVue] },
        });
    }

    it('no activa autoFilterFocus sin filtro', () => {
        const interno = montarReal().findComponent(MultiSelectReal);
        expect(interno.props('autoFilterFocus')).toBe(false);
    });

    it('activa autoFilterFocus cuando hay filtro explícito', () => {
        const interno = montarReal({ filter: true }).findComponent(MultiSelectReal);
        expect(interno.props('filter')).toBe(true);
        expect(interno.props('autoFilterFocus')).toBe(true);
    });

    it('el MultiSelect real abre el panel sin filtro sin lanzar TypeError', () => {
        const interno = montarReal().findComponent(MultiSelectReal);
        const vm = interno.vm;
        vm.overlay = document.createElement('div');
        document.body.appendChild(vm.overlay);
        expect(() => vm.onOverlayEnter(vm.overlay)).not.toThrow();
        vm.overlay.remove();
    });

    // PrimeVue 4 dibuja la casilla "marcar todo" de la cabecera sin texto y se
    // ve como un cuadro mudo que igual selecciona todo. El wrapper la etiqueta.
    it('el panel abierto muestra el control con su etiqueta "Seleccionar todos"', async () => {
        const wrapper = montarReal();
        await wrapper.find('.p-multiselect').trigger('click');
        expect(document.body.textContent).toContain('Seleccionar todos');
        expect(document.querySelector('.seleccionar-todos input')).not.toBeNull();
    });

    it('la casilla nativa de marcar todo queda desactivada (showToggleAll=false)', () => {
        const interno = montarReal().findComponent(MultiSelectReal);
        expect(interno.props('showToggleAll')).toBe(false);
    });
});

// El control propio marca todas las opciones: debe actualizar el v-model.
describe('PrimeMultiSelect: el control seleccionar todos marca todas las opciones', () => {
    const Arnes = {
        components: { PrimeMultiSelect },
        template: '<PrimeMultiSelect v-model="seleccionados" :options="opciones" option-value="value" option-label="label" />',
        data() {
            return {
                seleccionados: [],
                opciones: [
                    { value: 'a', label: 'Cliente' },
                    { value: 'b', label: 'Proveedor' },
                    { value: 'c', label: 'Empleado' },
                ],
            };
        },
    };

    // Los paneles de PrimeVue se teletransportan al body y las pruebas anteriores
    // dejan los suyos: se toma siempre el último control abierto.
    function ultimoControl() {
        const controles = document.querySelectorAll('.seleccionar-todos input');
        return controles[controles.length - 1];
    }

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('al marcarlo quedan seleccionadas todas las opciones', async () => {
        const wrapper = mount(Arnes, { global: { plugins: [PrimeVue] } });
        await wrapper.find('.p-multiselect').trigger('click');
        const casilla = ultimoControl();
        expect(casilla).not.toBeUndefined();
        casilla.click();
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.seleccionados).toEqual(['a', 'b', 'c']);
    });

    it('al marcarlo de nuevo las deselecciona todas', async () => {
        const wrapper = mount(Arnes, { global: { plugins: [PrimeVue] } });
        await wrapper.find('.p-multiselect').trigger('click');
        const casilla = ultimoControl();
        casilla.click();
        await wrapper.vm.$nextTick();
        casilla.click();
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.seleccionados).toEqual([]);
    });
});

// El control debe REFLEJAR el estado real: marcada cuando ya están todas las
// opciones visibles (el filtro reduce lo visibles), sin marcar si falta alguna.
describe('PrimeMultiSelect: la casilla seleccionar todos refleja el estado de lo visible', () => {
    const ArnesEstado = {
        components: { PrimeMultiSelect },
        template: '<PrimeMultiSelect v-model="seleccionados" :options="opciones" filter option-value="value" option-label="label" />',
        data() {
            return {
                seleccionados: [],
                opciones: [
                    { value: 'a', label: 'Cliente' },
                    { value: 'b', label: 'Proveedor' },
                    { value: 'c', label: 'Empleado' },
                ],
            };
        },
    };

    afterEach(() => {
        document.body.innerHTML = '';
    });

    function ultimoControl() {
        const controles = document.querySelectorAll('.seleccionar-todos input');
        return controles[controles.length - 1];
    }

    it('está marcada cuando todas las opciones visibles ya están seleccionadas', async () => {
        const wrapper = mount(ArnesEstado, { global: { plugins: [PrimeVue] } });
        wrapper.vm.seleccionados = ['a', 'b', 'c'];
        await wrapper.vm.$nextTick();
        await wrapper.find('.p-multiselect').trigger('click');
        await wrapper.vm.$nextTick();
        expect(ultimoControl().checked).toBe(true);
    });

    it('el filtro manda: si la visible única no está elegida, no está marcada; si llega, sí', async () => {
        const wrapper = mount(ArnesEstado, { global: { plugins: [PrimeVue] } });
        wrapper.vm.seleccionados = ['b', 'c'];
        await wrapper.vm.$nextTick();
        await wrapper.find('.p-multiselect').trigger('click');
        const filtro = wrapper.findComponent(MultiSelectReal).vm;
        filtro.filterValue = 'clie';
        await wrapper.vm.$nextTick();
        expect(ultimoControl().checked).toBe(false);
        // Se elige la opción visible (Cliente): con ella cubiertas las visibles, se refleja.
        wrapper.vm.seleccionados = ['a', 'b', 'c'];
        await wrapper.vm.$nextTick();
        expect(ultimoControl().checked).toBe(true);
    });
});
