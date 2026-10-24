import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTable } from '../useTable.js';

describe('useTable (búsqueda con debounce y paginación)', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('espera 400 ms por defecto antes de ejecutar fetchCallback', () => {
        const fetchCallback = vi.fn();
        const { debouncedSearch, page } = useTable({ page: 3 }, fetchCallback);

        debouncedSearch();
        expect(fetchCallback).not.toHaveBeenCalled();

        vi.advanceTimersByTime(399);
        expect(fetchCallback).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(fetchCallback).toHaveBeenCalledTimes(1);
        expect(page.value).toBe(1);
    });

    it('ignora InputEvent cuando se enlaza como @input="debouncedSearch" (no ejecuta en 0 ms)', () => {
        const fetchCallback = vi.fn();
        const { debouncedSearch } = useTable({}, fetchCallback);

        // Simula el objeto de evento que pasa Vue en @input="debouncedSearch"
        const fakeInputEvent = { type: 'input', target: { value: 'perez' } };
        debouncedSearch(fakeInputEvent);

        vi.advanceTimersByTime(50);
        expect(fetchCallback).not.toHaveBeenCalled();

        vi.advanceTimersByTime(350);
        expect(fetchCallback).toHaveBeenCalledTimes(1);
    });

    it('agrupa múltiples pulsaciones rápidas en una sola llamada al terminar de escribir', () => {
        const fetchCallback = vi.fn();
        const { debouncedSearch } = useTable({}, fetchCallback);

        debouncedSearch({ type: 'input' });
        vi.advanceTimersByTime(150);
        debouncedSearch({ type: 'input' });
        vi.advanceTimersByTime(150);
        debouncedSearch({ type: 'input' });

        vi.advanceTimersByTime(399);
        expect(fetchCallback).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(fetchCallback).toHaveBeenCalledTimes(1);
    });

    it('cancela una búsqueda pendiente si se ejecuta clearFilters u onPage', () => {
        const fetchCallback = vi.fn();
        const { debouncedSearch, clearFilters } = useTable({}, fetchCallback);

        debouncedSearch({ type: 'input' });
        vi.advanceTimersByTime(200);

        clearFilters();
        expect(fetchCallback).toHaveBeenCalledTimes(1);

        // Al cumplirse los 400 ms originales no debe disparar una segunda búsqueda rezagada
        vi.advanceTimersByTime(300);
        expect(fetchCallback).toHaveBeenCalledTimes(1);
    });
});
