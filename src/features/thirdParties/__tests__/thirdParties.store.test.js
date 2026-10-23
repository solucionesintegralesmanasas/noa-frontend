import { describe, expect, it, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('../services/thirdParties.service.js', () => ({
    default: {
        list: vi.fn(),
        getFormOptions: vi.fn(),
    },
}));
vi.mock('@/utils/toast.js', () => ({ toast: vi.fn() }));

import service from '../services/thirdParties.service.js';
import { useThirdPartiesStore } from '../store/thirdParties.store.js';

const pagina = (data, extra = {}) => ({
    success: true,
    data: { data, total: data.length, last_page: 1, current_page: 1, per_page: 10, ...extra },
});

describe('useThirdPartiesStore: orden server-side', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
        service.list.mockResolvedValue(pagina([]));
    });

    it('sin orden no envía sort_by ni sort_order', async () => {
        await useThirdPartiesStore().fetchItems();

        expect(service.list).toHaveBeenCalledWith({
            page: 1,
            per_page: 10,
            search: undefined,
            type: undefined,
            is_active: undefined,
            sort_by: undefined,
            sort_order: undefined,
        });
    });

    it('envía el campo y la dirección al backend', async () => {
        const store = useThirdPartiesStore();
        store.sortField = 'trade_name';
        store.sortOrder = 'desc';

        await store.fetchItems();

        expect(service.list).toHaveBeenCalledWith(expect.objectContaining({
            sort_by: 'trade_name',
            sort_order: 'desc',
        }));
    });

    it('al ordenar vuelve a la primera página y conserva el orden en las siguientes cargas', async () => {
        const store = useThirdPartiesStore();
        store.pagination.currentPage = 3;

        await store.setSort('document_number', 'asc');

        expect(store.sortField).toBe('document_number');
        expect(store.sortOrder).toBe('asc');
        expect(store.pagination.currentPage).toBe(1);
        expect(service.list).toHaveBeenCalledWith(expect.objectContaining({
            page: 1,
            sort_by: 'document_number',
            sort_order: 'asc',
        }));
    });

    it('al limpiar el orden vuelve a null', async () => {
        const store = useThirdPartiesStore();
        store.sortField = 'email';
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
        const store = useThirdPartiesStore();
        store.search = 'juan';
        store.sortField = 'document_number';
        store.sortOrder = 'desc';

        await store.clearFilters();

        expect(store.search).toBe('');
        expect(store.sortField).toBe('document_number');
        expect(store.sortOrder).toBe('desc');
    });
});
