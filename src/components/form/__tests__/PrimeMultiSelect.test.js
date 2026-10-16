// @vitest-environment jsdom
// PrimeMultiSelect del proyecto: fija el comportamiento sin tocar plantillas.
import { describe, expect, it } from 'vitest';
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
});
