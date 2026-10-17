// @vitest-environment jsdom
// El encabezado de página debe renderizar el slot title-after junto al título:
// es donde el formulario de FUEC muestra la etiqueta del vehículo en uso.
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import BasePageHeader from '../BasePageHeader.vue';

describe('BasePageHeader slot title-after', () => {
  it('renderiza la etiqueta pasada junto al título', () => {
    const vista = mount(BasePageHeader, {
      props: { title: 'Registrar Fuec' },
      slots: {
        'title-after': '<span class="badge">Vehículo: sin seleccionar</span>',
      },
      global: {
        stubs: { 'router-link': true },
      },
    });

    expect(vista.text()).toContain('Registrar Fuec');
    expect(vista.text()).toContain('Vehículo: sin seleccionar');
  });
});
