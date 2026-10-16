import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('../services/radicacion.service.js', () => ({
  default: { expedientes: vi.fn() },
}));
vi.mock('@/utils/logger.js', () => ({ logger: { warn: vi.fn() } }));

import service from '../services/radicacion.service.js';
import { useRadicacionStore } from '../store/radicacion.store.js';

// Forma real de `_request`: el cuerpo de la API { success, message, data: <paginador> }.
const respuesta = (data, extra = {}) => ({ success: true, data: { data, total: data.length, last_page: 1, current_page: 1, ...extra } });

describe('useRadicacionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('carga la página con el filtro y la paginación del servidor', async () => {
    service.expedientes.mockResolvedValue(respuesta([{ uuid: 'a' }, { uuid: 'b' }], { total: 40, last_page: 3 }));
    const store = useRadicacionStore();

    await store.fetchItems();

    expect(service.expedientes).toHaveBeenCalledWith({ per_page: 10, page: 1, search: '' });
    expect(store.items).toHaveLength(2);
    expect(store.pagination.totalItems).toBe(40);
    expect(store.pagination.totalPages).toBe(3);
  });

  it('muestra un solo paso en proceso aunque el servidor traiga dos', async () => {
    const linea_tiempo = [
      { paso: 'A', estado: 'COMPLETADO' },
      { paso: 'B', estado: 'EN_PROCESO' },
      { paso: 'C', estado: 'EN_PROCESO' },
    ];
    service.expedientes.mockResolvedValue(respuesta([{ uuid: 'a', linea_tiempo }]));
    const store = useRadicacionStore();

    await store.fetchItems();

    expect(store.items[0].linea_tiempo.map((p) => p.estado)).toEqual(['COMPLETADO', 'EN_PROCESO', 'PENDIENTE']);
  });

  it('al buscar vuelve a la primera página', async () => {
    service.expedientes.mockResolvedValue(respuesta([]));
    const store = useRadicacionStore();
    store.pagination.currentPage = 3;

    await store.setGlobalFilter('  54326 ');

    expect(service.expedientes).toHaveBeenCalledWith({ per_page: 10, page: 1, search: '54326' });
  });

  it('si la petición falla deja la lista vacía y apaga la carga', async () => {
    service.expedientes.mockRejectedValue(new Error('x'));
    const store = useRadicacionStore();
    store.items = [{ uuid: 'a' }];

    await store.fetchItems();

    expect(store.items).toEqual([]);
    expect(store.loading).toBe(false);
  });
});
