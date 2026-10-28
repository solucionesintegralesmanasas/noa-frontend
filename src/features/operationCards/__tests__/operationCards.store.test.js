import { describe, expect, it, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('../services/operationCards.service.js', () => ({
    default: {
        list: vi.fn(),
        getFormOptions: vi.fn(),
    },
}));
vi.mock('@/utils/toast.js', () => ({ toast: vi.fn() }));

import service from '../services/operationCards.service.js';
import { useOperationCardsStore } from '../store/operationCards.store.js';

const pagina = (data, extra = {}) => ({
    success: true,
    data: { data, total: data.length, last_page: 1, current_page: 1, per_page: 10, ...extra },
});

describe('useOperationCardsStore: orden server-side', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
        service.list.mockResolvedValue(pagina([]));
    });

    it('sin orden no envía sort_by ni sort_order', async () => {
        await useOperationCardsStore().fetchItems();

        expect(service.list).toHaveBeenCalledWith({
            page: 1,
            per_page: 10,
            search: undefined,
            sort_by: undefined,
            sort_order: undefined,
        });
    });

    it('envía el campo y la dirección al backend', async () => {
        const store = useOperationCardsStore();
        store.sortField = 'operating_card_number';
        store.sortOrder = 'desc';

        await store.fetchItems();

        expect(service.list).toHaveBeenCalledWith(expect.objectContaining({
            sort_by: 'operating_card_number',
            sort_order: 'desc',
        }));
    });

    it('al ordenar vuelve a la primera página y conserva el orden en las siguientes cargas', async () => {
        const store = useOperationCardsStore();
        store.pagination.currentPage = 4;

        await store.setSort('expiration_date', 'asc');

        expect(store.sortField).toBe('expiration_date');
        expect(store.sortOrder).toBe('asc');
        expect(store.pagination.currentPage).toBe(1);
        expect(service.list).toHaveBeenCalledWith(expect.objectContaining({
            page: 1,
            sort_by: 'expiration_date',
            sort_order: 'asc',
        }));
    });

    it('al limpiar el orden vuelve a null', async () => {
        const store = useOperationCardsStore();
        store.sortField = 'status';
        store.sortOrder = 'asc';

        await store.setSort(null, null);

        expect(store.sortField).toBeNull();
        expect(store.sortOrder).toBeNull();
        expect(service.list).toHaveBeenCalledWith(expect.objectContaining({
            sort_by: undefined,
            sort_order: undefined,
        }));
    });

    it('clearFilters limpia la búsqueda pero preserva el orden para no alterar la UI', async () => {
        const store = useOperationCardsStore();
        store.search = '12345';
        store.sortField = 'vehicle.vehicle_license_plate';
        store.sortOrder = 'desc';

        await store.clearFilters();

        expect(store.search).toBe('');
        expect(store.sortField).toBe('vehicle.vehicle_license_plate');
        expect(store.sortOrder).toBe('desc');
    });
});
