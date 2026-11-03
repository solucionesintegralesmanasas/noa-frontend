// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import DriverFollowPanel from '../DriverFollowPanel.vue';

function driver(extra = {}) {
    return {
        third_party_uuid: 'drv-1',
        latitude: 4.65,
        longitude: -74.05,
        speed: 42,
        is_moving: true,
        recorded_at: '2026-10-26T10:00:00.000Z',
        driver: { first_name: 'María', last_name: 'Gómez', document_number: '52123456' },
        vehicle: { vehicle_license_plate: 'ABC123' },
        ...extra,
    };
}

function montar(props = {}) {
    return mount(DriverFollowPanel, {
        props: {
            drivers: [driver(), driver({ third_party_uuid: 'drv-2', driver: { first_name: 'Luis', last_name: 'Pérez', document_number: '80123' }, vehicle: { vehicle_license_plate: 'XYZ789' }, speed: 0, is_moving: false })],
            selected: null,
            loading: false,
            follow: false,
            trailLoading: false,
            ...props,
        },
    });
}

describe('DriverFollowPanel', () => {
    it('lista los conductores con nombre, placa y velocidad', () => {
        const wrapper = montar();
        const items = wrapper.findAll('.noa-follow-item');
        expect(items).toHaveLength(2);
        expect(items[0].text()).toContain('María Gómez');
        expect(items[0].text()).toContain('ABC123');
        expect(items[0].text()).toContain('42 km/h');
    });

    it('filtra por nombre, placa o documento', async () => {
        const wrapper = montar();
        await wrapper.find('#f-seguimiento-busqueda').setValue('xyz');
        expect(wrapper.findAll('.noa-follow-item')).toHaveLength(1);
        expect(wrapper.text()).toContain('Luis Pérez');

        await wrapper.find('#f-seguimiento-busqueda').setValue('80123');
        expect(wrapper.findAll('.noa-follow-item')).toHaveLength(1);
    });

    it('emite select al elegir un conductor', async () => {
        const wrapper = montar();
        await wrapper.findAll('.noa-follow-item')[1].trigger('click');
        expect(wrapper.emitted('select')).toHaveLength(1);
        expect(wrapper.emitted('select')[0][0].third_party_uuid).toBe('drv-2');
    });

    it('muestra la ficha del conductor elegido con su estado', () => {
        const wrapper = montar({ selected: driver() });
        expect(wrapper.find('.noa-follow-name').text()).toBe('María Gómez');
        expect(wrapper.text()).toContain('En movimiento');
        expect(wrapper.text()).toContain('42');
        expect(wrapper.find('.noa-follow-empty').exists()).toBe(false);
    });

    it('marca el conductor elegido en la lista', () => {
        const wrapper = montar({ selected: driver() });
        const activos = wrapper.findAll('.noa-follow-item--active');
        expect(activos).toHaveLength(1);
        expect(activos[0].text()).toContain('María Gómez');
    });

    it('el botón seguir emite toggle-follow y refleja el estado', async () => {
        const wrapper = montar({ selected: driver(), follow: true });
        const boton = wrapper.find('.noa-follow-sheet button');
        expect(boton.text()).toContain('Dejar de seguir');
        expect(boton.attributes('aria-pressed')).toBe('true');
        await boton.trigger('click');
        expect(wrapper.emitted('toggle-follow')).toHaveLength(1);
    });

    it('sin conductores muestra el estado vacío', () => {
        const wrapper = montar({ drivers: [] });
        expect(wrapper.findAll('.noa-follow-item')).toHaveLength(0);
        expect(wrapper.text()).toContain('No hay conductores reportando ubicación');
    });

    it('el buscador tiene id y etiqueta asociada (accesibilidad)', () => {
        const wrapper = montar();
        const input = wrapper.find('#f-seguimiento-busqueda');
        expect(input.exists()).toBe(true);
        expect(wrapper.find('label[for="f-seguimiento-busqueda"]').exists()).toBe(true);
    });
});
