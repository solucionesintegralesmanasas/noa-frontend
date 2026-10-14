import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('../services/billing.service.js', () => ({
  default: {
    list: vi.fn(),
    crearCotizacion: vi.fn(),
    crearFactura: vi.fn(),
    cambiarEstado: vi.fn(),
    convertir: vi.fn(),
    registrarPago: vi.fn(),
    get: vi.fn(),
    getFormOptions: vi.fn(),
  },
}));
vi.mock('@/utils/toast.js', () => ({ toast: vi.fn() }));

import service from '../services/billing.service.js';
import { useBillingStore } from '../store/billing.store.js';

// Forma real de `_request`: { success, message, data: <paginador> }.
const pagina = (data, extra = {}) => ({
  success: true,
  data: { data, total: data.length, last_page: 1, current_page: 1, per_page: 10, ...extra },
});

describe('useBillingStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('carga el listado con el tipo de documento como filtro', async () => {
    service.list.mockResolvedValue(pagina([{ uuid: 'a' }, { uuid: 'b' }], { total: 40, last_page: 4 }));
    const store = useBillingStore();

    await store.fetchItems();

    expect(service.list).toHaveBeenCalledWith({ page: 1, per_page: 10, search: undefined, invoice_type: 'COTIZACION' });
    expect(store.items).toHaveLength(2);
    expect(store.pagination.totalItems).toBe(40);
    expect(store.pagination.totalPages).toBe(4);
  });

  it('al cambiar de pestaña filtra facturas y vuelve a la primera página', async () => {
    service.list.mockResolvedValue(pagina([]));
    const store = useBillingStore();
    store.pagination.currentPage = 3;

    await store.setTipo('FACTURA_VENTA');

    expect(store.tipoFiltro).toBe('FACTURA_VENTA');
    expect(store.pagination.currentPage).toBe(1);
    expect(service.list).toHaveBeenCalledWith(expect.objectContaining({ invoice_type: 'FACTURA_VENTA' }));
  });

  it('convierte la cotización y notifica el éxito', async () => {
    const factura = { uuid: 'f1', invoice_type: 'FACTURA_VENTA' };
    service.convertir.mockResolvedValue({ success: true, data: factura });
    const store = useBillingStore();

    const resultado = await store.convertir('c1', { billing_resolution_uuid: 'r1', issue_date: '2026-10-05' });

    expect(service.convertir).toHaveBeenCalledWith('c1', { billing_resolution_uuid: 'r1', issue_date: '2026-10-05' });
    expect(resultado.uuid).toBe('f1');
  });
});
