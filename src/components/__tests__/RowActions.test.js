// @vitest-environment jsdom
// RowActions: la columna de acciones tiene siempre la misma estructura
// [en línea] [en línea] [⋮]; solo las acciones marcadas `inline` quedan visibles y
// Eliminar va al final del menú. Sin menú se reserva el hueco para alinear los iconos.
import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import RowActions from '../RowActions.vue';

const accion = (key, extra = {}) => ({ key, label: key, icon: 'fas fa-x', onClick: () => {}, ...extra });

const montar = (actions, props = {}) =>
    mount(RowActions, { props: { actions, ...props }, global: { stubs: { Menu: true } } });

const enLinea = (w) => w.findAll('.noa-row-action:not(.noa-row-action--more):not(.noa-row-action--placeholder)');

describe('RowActions', () => {
    it('deja Ver/Editar en línea y manda Eliminar al menú', () => {
        const w = montar([accion('ver', { inline: true }), accion('editar', { inline: true }), accion('eliminar', { tone: 'danger' })]);
        expect(enLinea(w)).toHaveLength(2);
        expect(w.find('.noa-row-action--more').exists()).toBe(true);
    });

    it('sin acciones de menú reserva un hueco para alinear los iconos', () => {
        const w = montar([accion('ver'), accion('editar')]);
        expect(w.find('.noa-row-action--more').exists()).toBe(false);
        expect(w.find('.noa-row-action--placeholder').exists()).toBe(true);
    });

    it('ignora las acciones con visible=false', () => {
        const w = montar([accion('ver'), accion('editar', { visible: false })]);
        expect(enLinea(w)).toHaveLength(1);
    });

    it('con muchas acciones deja 2 en línea y el resto en el menú', () => {
        const w = montar([
            accion('ver', { inline: true }),
            accion('editar', { inline: true }),
            accion('licencias'),
            accion('proyectos'),
            accion('eliminar', { tone: 'danger' }),
        ]);
        expect(enLinea(w)).toHaveLength(2);
        expect(w.find('.noa-row-action--more').exists()).toBe(true);
        expect(w.find('.noa-row-action--danger').exists()).toBe(false);
    });

    it('sin acciones marcadas toma las 2 primeras no destructivas', () => {
        const w = montar([accion('a'), accion('b'), accion('c'), accion('eliminar', { tone: 'danger' })]);
        expect(enLinea(w).map((b) => b.attributes('title'))).toEqual(['a', 'b']);
    });

    it('ejecuta onClick y nombra el botón de más acciones con la fila', async () => {
        const onClick = vi.fn();
        const w = montar([accion('ver', { inline: true, onClick }), accion('b'), accion('c'), accion('d')], { rowLabel: 'ACME' });
        await w.find('.noa-row-action').trigger('click');
        expect(onClick).toHaveBeenCalledOnce();
        expect(w.find('.noa-row-action--more').attributes('aria-label')).toBe('Más acciones de ACME');
        expect(w.find('[role="group"]').attributes('aria-label')).toBe('Acciones de ACME');
    });
});
