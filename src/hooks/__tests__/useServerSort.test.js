import { describe, expect, it, vi } from 'vitest';
import { useServerSort } from '../useServerSort.js';

describe('useServerSort', () => {
    it('traduce el evento de PrimeVue al contrato de la API y avisa al consumidor', () => {
        const onChange = vi.fn();
        const { sortField, sortOrder, onSort } = useServerSort({ onChange });

        onSort({ sortField: 'brand.description', sortOrder: 1 });
        expect(sortField.value).toBe('brand.description');
        expect(sortOrder.value).toBe('asc');
        expect(onChange).toHaveBeenLastCalledWith({ field: 'brand.description', order: 'asc' });

        onSort({ sortField: 'brand.description', sortOrder: -1 });
        expect(sortOrder.value).toBe('desc');
        expect(onChange).toHaveBeenLastCalledWith({ field: 'brand.description', order: 'desc' });
    });

    it('el tercer clic (sin orden) limpia campo y dirección', () => {
        const onChange = vi.fn();
        const { sortField, sortOrder, onSort } = useServerSort({
            field: 'model',
            order: 'desc',
            onChange,
        });

        onSort({ sortField: 'model', sortOrder: 0 });

        expect(sortField.value).toBeNull();
        expect(sortOrder.value).toBeNull();
        expect(onChange).toHaveBeenLastCalledWith({ field: null, order: null });
    });

    it('expone la dirección en el formato de PrimeVue (1/-1) y null sin orden', () => {
        const { sortOrdenPrimeVue, onSort, restore } = useServerSort();

        expect(sortOrdenPrimeVue.value).toBeNull();

        onSort({ sortField: 'line', sortOrder: 1 });
        expect(sortOrdenPrimeVue.value).toBe(1);

        onSort({ sortField: 'line', sortOrder: -1 });
        expect(sortOrdenPrimeVue.value).toBe(-1);

        restore(null, null);
        expect(sortOrdenPrimeVue.value).toBeNull();
    });

    it('restaurar desde la URL no dispara la recarga', () => {
        const onChange = vi.fn();
        const { sortField, sortOrder, restore } = useServerSort({ onChange });

        restore('is_active', 'desc');

        expect(sortField.value).toBe('is_active');
        expect(sortOrder.value).toBe('desc');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('restaurar una dirección inválida deja el orden sin efecto', () => {
        const { sortField, sortOrder, restore } = useServerSort();

        restore('line', 'lateral');

        expect(sortField.value).toBeNull();
        expect(sortOrder.value).toBeNull();
    });
});
