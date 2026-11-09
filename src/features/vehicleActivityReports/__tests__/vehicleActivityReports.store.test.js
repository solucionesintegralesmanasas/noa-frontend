import { describe, expect, it, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('../services/vehicleActivityReports.service.js', () => ({
    default: {
        report: vi.fn(),
        downloadExcel: vi.fn(),
        downloadPdf: vi.fn(),
        getCatalogos: vi.fn(),
    },
}));
vi.mock('@/utils/toast.js', () => ({ toast: vi.fn() }));

import service from '../services/vehicleActivityReports.service.js';
import { useVehicleActivityReportsStore } from '../store/vehicleActivityReports.store.js';

const pagina = (data, extra = {}) => ({
    success: true,
    data: { data, total: data.length, last_page: 1, current_page: 1, per_page: 10, ...extra },
});

describe('useVehicleActivityReportsStore: parámetros del reporte', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
        // El backend devuelve la página que se le pidió.
        service.report.mockImplementation(async (params = {}) => pagina([], { current_page: params.page ?? 1 }));
    });

    it('currentParams siempre incluye fechas, página y tamaño de página', async () => {
        const store = useVehicleActivityReportsStore();
        store.fechaDesde = '2026-11-01';
        store.fechaHasta = '2026-11-30';

        expect(store.currentParams).toEqual({
            fecha_desde: '2026-11-01',
            fecha_hasta: '2026-11-30',
            page: 1,
            per_page: 10,
        });

        await store.fetchItems();
        expect(service.report).toHaveBeenCalledWith({
            fecha_desde: '2026-11-01',
            fecha_hasta: '2026-11-30',
            page: 1,
            per_page: 10,
        });
    });

    it('los uuids solo viajan cuando tienen valor', () => {
        const store = useVehicleActivityReportsStore();
        store.fechaDesde = '2026-11-01';
        store.fechaHasta = '2026-11-30';
        store.vehicleUuid = '';
        store.projectUuid = '';

        expect(store.currentParams.vehicle_uuid).toBeUndefined();
        expect(store.currentParams.project_uuid).toBeUndefined();

        store.vehicleUuid = 'veh-1';
        store.projectUuid = 'proy-1';
        expect(store.currentParams.vehicle_uuid).toBe('veh-1');
        expect(store.currentParams.project_uuid).toBe('proy-1');
    });

    it('setFiltros resetea a la primera página antes de consultar', async () => {
        const store = useVehicleActivityReportsStore();
        store.pagination.currentPage = 3;

        await store.setFiltros({ fecha_desde: '2026-11-01', fecha_hasta: '2026-11-30' });

        expect(store.fechaDesde).toBe('2026-11-01');
        expect(store.pagination.currentPage).toBe(1);
        expect(service.report).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
    });

    it('clearFilters limpia filtros y resetea a página 1 sin consultar sin fechas', async () => {
        const store = useVehicleActivityReportsStore();
        store.fechaDesde = '2026-11-01';
        store.fechaHasta = '2026-11-30';
        store.vehicleUuid = 'veh-1';
        store.projectUuid = 'proy-1';
        store.pagination.currentPage = 5;

        await store.clearFilters();

        expect(store.fechaDesde).toBe('');
        expect(store.fechaHasta).toBe('');
        expect(store.vehicleUuid).toBe('');
        expect(store.projectUuid).toBe('');
        expect(store.pagination.currentPage).toBe(1);
        // Sin fechas no hay consulta (el backend exige el rango).
        expect(service.report).not.toHaveBeenCalled();
    });

    it('setPage(2) actualiza la página y vuelve a consultar', async () => {
        const store = useVehicleActivityReportsStore();
        store.fechaDesde = '2026-11-01';
        store.fechaHasta = '2026-11-30';

        await store.setPage(2);

        expect(store.pagination.currentPage).toBe(2);
        expect(service.report).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
    });

    it('fetchItems rellena items y paginación desde el paginator', async () => {
        service.report.mockResolvedValue(pagina([{ event_uuid: 'e1' }], { total: 42, last_page: 5, current_page: 3, per_page: 10 }));

        const store = useVehicleActivityReportsStore();
        store.fechaDesde = '2026-11-01';
        store.fechaHasta = '2026-11-30';
        await store.fetchItems();

        expect(store.items).toHaveLength(1);
        expect(store.pagination.totalItems).toBe(42);
        expect(store.pagination.totalPages).toBe(5);
        expect(store.pagination.currentPage).toBe(3);
    });
});
