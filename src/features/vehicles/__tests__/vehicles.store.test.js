import { describe, expect, it, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('../services/vehicles.service.js', () => ({
    default: {
        list: vi.fn(),
        getFormOptions: vi.fn(),
    },
}));
vi.mock('@/utils/toast.js', () => ({ toast: vi.fn() }));

import service from '../services/vehicles.service.js';
import { useVehiclesStore } from '../store/vehicles.store.js';

// Forma real de `_request`: { success, message, data: <paginador> }.
const pagina = (data, extra = {}) => ({
    success: true,
    data: { data, total: data.length, last_page: 1, current_page: 1, per_page: 10, ...extra },
});

describe('useVehiclesStore: orden server-side', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
        service.list.mockResolvedValue(pagina([]));
    });

    it('sin orden no envía sort_by ni sort_order', async () => {
        await useVehiclesStore().fetchItems();

        expect(service.list).toHaveBeenCalledWith({
            page: 1,
            per_page: 10,
            search: undefined,
            sort_by: undefined,
            sort_order: undefined,
        });
    });

    it('envía el campo y la dirección al backend', async () => {
        const store = useVehiclesStore();
        store.sortField = 'brand.description';
        store.sortOrder = 'desc';

        await store.fetchItems();

        expect(service.list).toHaveBeenCalledWith(expect.objectContaining({
            sort_by: 'brand.description',
            sort_order: 'desc',
        }));
    });

    it('al ordenar vuelve a la primera página y conserva el orden en las siguientes cargas', async () => {
        const store = useVehiclesStore();
        store.pagination.currentPage = 4;

        await store.setSort('vehicle_license_plate', 'asc');

        expect(store.sortField).toBe('vehicle_license_plate');
        expect(store.sortOrder).toBe('asc');
        expect(store.pagination.currentPage).toBe(1);
        expect(service.list).toHaveBeenLastCalledWith(expect.objectContaining({
            page: 1,
            sort_by: 'vehicle_license_plate',
            sort_order: 'asc',
        }));

        await store.setPage(2);
        expect(service.list).toHaveBeenLastCalledWith(expect.objectContaining({
            page: 2,
            sort_by: 'vehicle_license_plate',
            sort_order: 'asc',
        }));
    });

    it('quitar el orden deja de enviar sort_by y sort_order', async () => {
        const store = useVehiclesStore();
        store.sortField = 'model';
        store.sortOrder = 'desc';

        await store.setSort(null, null);

        expect(store.sortField).toBeNull();
        expect(store.sortOrder).toBeNull();
        expect(service.list).toHaveBeenLastCalledWith(expect.objectContaining({
            sort_by: undefined,
            sort_order: undefined,
        }));
    });

    it('limpiar filtros conserva el orden activo', async () => {
        const store = useVehiclesStore();
        store.search = 'ABC';
        store.sortField = 'is_active';
        store.sortOrder = 'asc';

        await store.clearFilters();

        expect(store.search).toBe('');
        expect(store.sortField).toBe('is_active');
        expect(store.sortOrder).toBe('asc');
        expect(service.list).toHaveBeenLastCalledWith(expect.objectContaining({
            search: undefined,
            sort_by: 'is_active',
            sort_order: 'asc',
        }));
    });
});
