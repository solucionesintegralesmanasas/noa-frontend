// @vitest-environment jsdom
// DateInput: pega dd/mm/aaaa y normaliza a ISO; el tipeo nativo se sincroniza.
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import DateInput from '../DateInput.vue';

function pegar(wrapper, texto) {
    const input = wrapper.find('input');
    const evento = new Event('paste', { bubbles: true, cancelable: true });
    evento.clipboardData = { getData: () => texto };
    input.element.dispatchEvent(evento);
    return evento;
}

describe('DateInput', () => {
    it('pega dd/mm/aaaa como ISO y previene el pegado nativo', async () => {
        const wrapper = mount(DateInput, { props: { modelValue: null, id: 'f-fecha' } });
        const evento = pegar(wrapper, '14/09/2026');
        expect(evento.defaultPrevented).toBe(true);
        expect(wrapper.emitted('update:modelValue').at(-1)[0]).toBe('2026-09-14');
    });

    it('pega año/mes/día del RUNT como ISO', async () => {
        const wrapper = mount(DateInput, { props: { modelValue: null, id: 'f-fecha' } });
        const evento = pegar(wrapper, '2026/09/14');
        expect(evento.defaultPrevented).toBe(true);
        expect(wrapper.emitted('update:modelValue').at(-1)[0]).toBe('2026-09-14');
    });

    it('sugiere pegar la fecha cuando el padre no da placeholder', async () => {
        const wrapper = mount(DateInput, { props: { modelValue: null, id: 'f-fecha' } });
        const input = wrapper.find('input');
        expect(input.attributes('placeholder')).toContain('Pega');
        expect(input.attributes('title')).toContain('dd/mm/aaaa');
    });

    it('respeta el placeholder del padre si lo trae', async () => {
        const wrapper = mount(DateInput, {
            props: { modelValue: null, id: 'f-fecha' },
            attrs: { placeholder: 'YYYY-MM-DD' },
        });
        expect(wrapper.find('input').attributes('placeholder')).toBe('YYYY-MM-DD');
    });

    it('ignora un pegado inválido sin tocar el modelo', async () => {
        const wrapper = mount(DateInput, { props: { modelValue: '2026-01-01', id: 'f-fecha' } });
        const evento = pegar(wrapper, 'no-fecha');
        expect(evento.defaultPrevented).toBe(false);
        expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('sincroniza lo escrito en el input nativo', async () => {
        const wrapper = mount(DateInput, { props: { modelValue: null, id: 'f-fecha' } });
        await wrapper.find('input').setValue('2026-09-14');
        expect(wrapper.emitted('update:modelValue').at(-1)[0]).toBe('2026-09-14');
    });

    it('al limpiar conserva la cadena vacía del input nativo', async () => {
        const wrapper = mount(DateInput, { props: { modelValue: '2026-09-14', id: 'f-fecha' } });
        await wrapper.find('input').setValue('');
        expect(wrapper.emitted('update:modelValue').at(-1)[0]).toBe('');
    });

    it('conserva id y atributos del padre', () => {
        const wrapper = mount(DateInput, {
            props: { modelValue: null, id: 'f-fecha' },
            attrs: { class: 'form-control', 'aria-invalid': 'true' },
        });
        const input = wrapper.find('input');
        expect(input.attributes('id')).toBe('f-fecha');
        expect(input.attributes('type')).toBe('date');
        expect(input.classes()).toContain('form-control');
        expect(input.attributes('aria-invalid')).toBe('true');
    });
});
