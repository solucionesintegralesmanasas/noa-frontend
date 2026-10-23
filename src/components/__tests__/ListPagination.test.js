// @vitest-environment jsdom
// ListPagination: texto "Mostrando X a Y de Z", ventana de páginas con elipsis y eventos
// compatibles con el handler `@page` del DataTable de PrimeVue (`first` y `rows`).
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ListPagination from '../ListPagination.vue';

const montar = (props) => mount(ListPagination, { props: { page: 1, perPage: 10, total: 57, ...props } });
const paginas = (w) => w.findAll('.noa-pager__btn--page, .noa-pager__gap').map((n) => n.text());

describe('ListPagination', () => {
    it('muestra el rango visible', () => {
        const w = montar({ page: 6 });
        expect(w.find('.noa-pager__info').text()).toContain('Mostrando 51 a 57 de 57 registros');
    });

    it('sin registros no muestra rango', () => {
        expect(montar({ total: 0 }).find('.noa-pager__info').text()).toContain('Sin registros');
    });

    it('usa elipsis cuando hay muchas páginas', () => {
        expect(paginas(montar({ page: 1, total: 120 }))).toEqual(['1', '2', '3', '4', '…', '12']);
        expect(paginas(montar({ page: 5, total: 200 }))).toEqual(['1', '…', '4', '5', '6', '…', '20']);
    });

    it('muestra todas si son 7 o menos', () => {
        expect(paginas(montar({ total: 30 }))).toEqual(['1', '2', '3']);
    });

    it('emite first/rows al cambiar de página y deshabilita los extremos', async () => {
        const w = montar({ page: 1 });
        const [primera, anterior] = w.findAll('.noa-pager__btn');
        expect(primera.attributes('disabled')).toBeDefined();
        expect(anterior.attributes('disabled')).toBeDefined();
        await w.findAll('.noa-pager__btn--page')[2].trigger('click');
        expect(w.emitted('change')[0][0]).toEqual({ page: 3, rows: 10, first: 20 });
    });

    it('al cambiar las filas vuelve a la primera página', async () => {
        const w = montar({ page: 3 });
        await w.find('select').setValue('25');
        expect(w.emitted('change')[0][0]).toEqual({ page: 1, rows: 25, first: 0 });
    });
});
