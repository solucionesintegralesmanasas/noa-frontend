// @vitest-environment jsdom
// Línea de tiempo de radicación: en trámite completado arranca cerrada pero
// expandible, y al expandir muestra los documentos de cada paso.
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import RadicacionTimeline from '../components/RadicacionTimeline.vue';

const linea = [
  { paso: 'CAPACIDAD_TRANSPORTADORA', estado: 'COMPLETADO' },
  { paso: 'TARJETA_DE_OPERACION', estado: 'COMPLETADO' },
];

const documentos = {
  CAPACIDAD_TRANSPORTADORA: [{ clave: 'CARTA_CAPACIDAD', etiqueta: 'Carta capacidad', disponible: true, motivo_bloqueo: null }],
  TARJETA_DE_OPERACION: [{ clave: 'CONTRATO_VINCULACION', etiqueta: 'Contrato vinculación', disponible: true, motivo_bloqueo: null }],
};

function montar(estadoGlobal) {
  return mount(RadicacionTimeline, {
    props: { linea, documentos, expedienteUuid: 'exp-1', estadoGlobal },
  });
}

describe('RadicacionTimeline en trámite completado', () => {
  it('oculta la lista al inicio y el propio aviso es expandible', () => {
    const vista = montar('COMPLETADO');
    expect(vista.find('ol.timeline-list').exists()).toBe(false);
    const boton = vista.find('button.timeline-completed-toggle');
    expect(boton.exists()).toBe(true);
    expect(boton.attributes('aria-expanded')).toBe('false');
    expect(boton.attributes('aria-controls')).toBe('linea-tiempo-detalle');
  });

  it('al expandir desde el aviso muestra los pasos y sus documentos', async () => {
    const vista = montar('COMPLETADO');
    await vista.find('button.timeline-completed-toggle').trigger('click');
    expect(vista.find('ol.timeline-list').exists()).toBe(true);
    expect(vista.find('button.timeline-completed-toggle').attributes('aria-expanded')).toBe('true');
    expect(vista.text()).toContain('Carta capacidad');
    expect(vista.text()).toContain('Contrato vinculación');
  });

  it('en trámite en proceso no muestra el aviso y la lista siempre visible', () => {
    const vista = montar('EN_PROCESO');
    expect(vista.find('button.timeline-completed-toggle').exists()).toBe(false);
    expect(vista.find('ol.timeline-list').exists()).toBe(true);
  });
});
