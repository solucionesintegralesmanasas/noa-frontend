import { describe, expect, it, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('../services/affiliateCharges.service.js', () => ({
    default: {
        list: vi.fn(),
        getFormOptions: vi.fn(),
    },
}));
vi.mock('@/utils/toast.js', () => ({ toast: vi.fn() }));

import service from '../services/affiliateCharges.service.js';
import { useAffiliateAdminChargesStore } from '../store/affiliateCharges.store.js';

const pagina = (data, extra = {}) => ({
    success: true,
    data: { data, total: data.length, last_page: 1, current_page: 1, per_page: 10, ...extra },
});

describe('useAffiliateAdminChargesStore: orden server-side', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
        service.list.mockResolvedValue(pagina([]));
    });

    it('sin orden no envía sort_by ni sort_order', async () => {
        await useAffiliateAdminChargesStore().fetchItems();

        expect(service.list).toHaveBeenCalledWith({
            page: 1,
            per_page: 10,
            search: undefined,
            sort_by: undefined,
            sort_order: undefined,
        });
    });

    it('envía el campo y la dirección al backend', async () => {
        const store = useAffiliateAdminChargesStore();
        store.sortField = 'amount';
        store.sortOrder = 'desc';

        await store.fetchItems();

        expect(service.list).toHaveBeenCalledWith(expect.objectContaining({
            sort_by: 'amount',
            sort_order: 'desc',
        }));
    });

    it('al ordenar vuelve a la primera página y conserva el orden en las siguientes cargas', async () => {
        const store = useAffiliateAdminChargesStore();
        store.pagination.currentPage = 4;

        await store.setSort('vehicle.vehicle_license_plate', 'asc');

        expect(store.sortField).toBe('vehicle.vehicle_license_plate');
        expect(store.sortOrder).toBe('asc');
        expect(store.pagination.currentPage).toBe(1);
        expect(service.list).toHaveBeenCalledWith(expect.objectContaining({
            page: 1,
            sort_by: 'vehicle.vehicle_license_plate',
            sort_order: 'asc',
        }));
    });

    it('al limpiar el orden vuelve a null', async () => {
        const store = useAffiliateAdminChargesStore();
        store.sortField = 'due_date';
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
        const store = useAffiliateAdminChargesStore();
        store.search = 'REF-123';
        store.sortField = 'period_date';
        store.sortOrder = 'desc';

        await store.clearFilters();

        expect(store.search).toBe('');
        expect(store.sortField).toBe('period_date');
        expect(store.sortOrder).toBe('desc');
    });
});
