// notifications.store: el listado del módulo debe pedir (y recordar) el per_page
// que el paginador muestra. Regresión del lector «Filas:» en blanco.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('@/services/api/client.js', () => {
    const get = vi.fn();
    return { default: { global: { get }, forTenant: () => ({ get }) } };
});
vi.mock('@/utils/toast.js', () => ({ toast: vi.fn() }));
vi.mock('@/utils/logger.js', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@store/modules/user.js', () => ({ useUserStore: () => ({ company_uuid: null }) }));
vi.mock('@/services/security/token-manager.js', () => ({ tokenManager: { getAccessToken: vi.fn(async () => null) } }));
vi.mock('@capacitor/preferences', () => ({
    Preferences: { get: vi.fn(async () => ({ value: null })), keys: vi.fn(async () => ({ keys: [] })), set: vi.fn(), remove: vi.fn() },
}));

import apiClient from '@/services/api/client.js';
import { useNotificationsStore } from '../store/notifications.store.js';

const respuesta = (per_page) => ({
    data: {
        success: true,
        data: { data: [], total: 0, current_page: 1, last_page: 1, per_page },
    },
});

describe('useNotificationsStore · per_page del listado', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
        apiClient.global.get.mockResolvedValue(respuesta(10));
    });

    it('por defecto pide 10 filas por página y las recuerda', async () => {
        const store = useNotificationsStore();

        await store.fetchNotifications();

        expect(apiClient.global.get).toHaveBeenCalledWith('/notifications', expect.objectContaining({
            params: expect.objectContaining({ per_page: 10 }),
        }));
        expect(store.perPage).toBe(10);
    });

    it('respeta el per_page que le pasa la vista', async () => {
        const store = useNotificationsStore();
        apiClient.global.get.mockResolvedValue(respuesta(25));

        await store.fetchNotifications(1, {}, 25);

        expect(apiClient.global.get).toHaveBeenCalledWith('/notifications', expect.objectContaining({
            params: expect.objectContaining({ page: 1, per_page: 25 }),
        }));
        expect(store.perPage).toBe(25);
    });

    it('se alinea con el per_page del servidor si este lo acota', async () => {
        const store = useNotificationsStore();
        apiClient.global.get.mockResolvedValue(respuesta(15));

        await store.fetchNotifications(1, {}, 25);

        expect(apiClient.global.get).toHaveBeenCalledWith('/notifications', expect.objectContaining({
            params: expect.objectContaining({ per_page: 25 }),
        }));
        expect(store.perPage).toBe(15, 'Si el servidor acota (o cambia) el per_page, el lector de filas debe seguirlo');
    });
});
