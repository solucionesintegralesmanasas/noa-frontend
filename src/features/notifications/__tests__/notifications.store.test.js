// notifications.store: el listado del módulo debe pedir (y recordar) el per_page
// que el paginador muestra. Regresión del lector «Filas:» en blanco.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('@/services/api/client.js', () => {
    const get = vi.fn();
    return { default: { global: { get } } };
});
vi.mock('@/utils/toast.js', () => ({ toast: vi.fn() }));
vi.mock('@/utils/logger.js', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@store/modules/user.js', () => ({ useUserStore: () => ({ company_uuid: null }) }));
vi.mock('@/services/security/token-manager.js', () => ({ tokenManager: { getAccessToken: vi.fn(async () => null) } }));
vi.mock('@capacitor/preferences', () => ({
    Preferences: { get: vi.fn(async () => ({ value: null })), keys: vi.fn(async () => ({ keys: [] })), set: vi.fn(), remove: vi.fn() },
}));

import apiClient from '@/services/api/client.js';
import { useNotificationsStore, expiryAlertsShown } from '../store/notifications.store.js';

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

describe('useNotificationsStore · alertas de vencimiento en memoria (SPEC-016)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    it('no realiza consultas repetidas a Preferences por cada toast disparado', async () => {
        const { Preferences } = await import('@capacitor/preferences');
        const store = useNotificationsStore();

        const notif1 = { uuid: 'notif-1', title: 'SOAT por vencer', message: 'Vence hoy' };
        const notif2 = { uuid: 'notif-2', title: 'RCE por vencer', message: 'Vence hoy' };

        await store.triggerExpiryToast(notif1);
        await store.triggerExpiryToast(notif2);

        // No debe llamar Preferences.get con claves individuales expiry_alert_shown_*
        const llamadasIndividuales = Preferences.get.mock.calls.filter(
            ([arg]) => arg?.key?.startsWith('expiry_alert_shown_')
        );
        expect(llamadasIndividuales.length).toBe(0);
        expect(store.activeExpiryToasts.length).toBe(2);
    });

    it('no repite la misma alerta si no han transcurrido 55 minutos', async () => {
        const store = useNotificationsStore();
        const notif = { uuid: 'notif-repetida', title: 'Alerta', message: 'Mensaje' };

        await store.triggerExpiryToast(notif);
        expect(store.activeExpiryToasts.length).toBe(1);

        // Intento inmediato de disparar la misma alerta
        await store.triggerExpiryToast(notif);
        expect(store.activeExpiryToasts.length).toBe(1);
    });

    it('permite la repetición de la alerta si han transcurrido más de 55 minutos (SPEC-016)', async () => {
        const store = useNotificationsStore();
        const notif = { uuid: 'notif-repite-55', title: 'Alerta 55m', message: 'Mensaje' };

        await store.triggerExpiryToast(notif);
        expect(store.activeExpiryToasts.length).toBe(1);

        // Simular que pasaron 56 minutos modificando el timestamp registrado
        const hace56Min = Date.now() - (56 * 60 * 1000);
        expiryAlertsShown.set('notif-repite-55', hace56Min);
        store.activeExpiryToasts = [];

        await store.triggerExpiryToast(notif);
        expect(store.activeExpiryToasts.length).toBe(1);
    });

    it('purga automáticamente registros de alertas mostradas mayores a 24 horas (SPEC-016)', async () => {
        const store = useNotificationsStore();
        const hace25Horas = Date.now() - (25 * 60 * 60 * 1000);
        expiryAlertsShown.set('notif-antigua-24h', hace25Horas);

        store.latestNotifications = [];
        await store.checkAndTriggerExpiryAlerts();

        expect(expiryAlertsShown.has('notif-antigua-24h')).toBe(false);
    });
});
