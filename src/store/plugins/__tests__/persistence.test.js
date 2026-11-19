// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia, defineStore } from 'pinia';

const setItemMock = vi.fn(async () => {});
const getItemMock = vi.fn(async () => null);
const hasStoredDataMock = vi.fn(async () => false);
const warmKeyMock = vi.fn(async () => {});

vi.mock('@services/security/secure-storage.js', () => ({
    secureStorage: {
        setItem: (...args) => setItemMock(...args),
        getItem: (...args) => getItemMock(...args),
        hasStoredData: (...args) => hasStoredDataMock(...args),
        warmKey: (...args) => warmKeyMock(...args),
    },
}));

vi.mock('@services/security/token-manager.js', () => ({
    tokenManager: {
        getAccessToken: vi.fn(async () => null),
    },
}));

vi.mock('@utils/logger.js', () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    },
}));

import {
    permissionsPersistencePlugin,
    uiPersistencePlugin,
    flushAllPersistence,
    cancelPendingPersistence,
} from '../persistence.js';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

describe('Plugin de persistencia Pinia con debounce y filtrado (SPEC-016)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cancelPendingPersistence();
    });

    it('hidrata el estado desde secureStorage y activa isHydrated', async () => {
        getItemMock.mockResolvedValueOnce({ tema: 'dark' });

        const pinia = createPinia();
        pinia.use(uiPersistencePlugin);
        setActivePinia(pinia);

        const useTestUiStore = defineStore('ui', {
            state: () => ({ tema: 'light', isHydrated: false }),
        });

        const store = useTestUiStore();
        uiPersistencePlugin({ store });
        await wait(50);

        expect(getItemMock).toHaveBeenCalledWith('ui');
        expect(store.tema).toBe('dark');
        expect(store.isHydrated).toBe(true);
    });

    it('persiste cambios en secureStorage filtrando isHydrated y campos volátiles', async () => {
        getItemMock.mockResolvedValueOnce(null);

        const pinia = createPinia();
        pinia.use(permissionsPersistencePlugin);
        setActivePinia(pinia);

        const useTestPermStore = defineStore('permissions', {
            state: () => ({ roles: ['ADMIN'], isLoaded: true, isHydrated: false }),
        });

        const store = useTestPermStore();
        permissionsPersistencePlugin({ store });
        await wait(50);

        store.roles = ['SUPERADMIN'];
        // Esperar debounce (300 ms + margen)
        await wait(350);

        expect(setItemMock).toHaveBeenCalledWith('permissions', expect.objectContaining({
            roles: ['SUPERADMIN'],
        }));
        const lastCall = setItemMock.mock.calls[setItemMock.mock.calls.length - 1];
        expect(lastCall[1].isHydrated).toBeUndefined();
        expect(lastCall[1].isLoaded).toBeUndefined();
    });

    it('consolida múltiples mutaciones consecutivas en una única escritura tras debounce', async () => {
        getItemMock.mockResolvedValueOnce(null);

        const pinia = createPinia();
        setActivePinia(pinia);

        const useMultiStore = defineStore('permissions', {
            state: () => ({ contador: 0, isHydrated: false }),
        });

        const store = useMultiStore();
        permissionsPersistencePlugin({ store });
        await wait(50);

        setItemMock.mockClear();

        // 5 mutaciones rápidas consecutivas
        store.contador = 1;
        await wait(50);
        store.contador = 2;
        await wait(50);
        store.contador = 3;
        await wait(50);
        store.contador = 4;
        await wait(50);
        store.contador = 5;

        // Aún no ha transcurrido el debounce completo de 300 ms desde la última mutación
        expect(setItemMock).toHaveBeenCalledTimes(0);

        // Esperar que transcurra el debounce
        await wait(350);

        // Solo se ejecutó 1 vez con el valor final consolidado
        expect(setItemMock).toHaveBeenCalledTimes(1);
        expect(setItemMock).toHaveBeenCalledWith('permissions', expect.objectContaining({
            contador: 5,
        }));
    });

    it('flushAllPersistence fuerza la escritura inmediata antes del vencimiento del temporizador', async () => {
        getItemMock.mockResolvedValueOnce(null);

        const pinia = createPinia();
        setActivePinia(pinia);

        const useFlushStore = defineStore('permissions', {
            state: () => ({ estado: 'inicial', isHydrated: false }),
        });

        const store = useFlushStore();
        permissionsPersistencePlugin({ store });
        await wait(50);
        setItemMock.mockClear();

        store.estado = 'critico';
        await Promise.resolve();
        // En lugar de esperar 300ms, forzar flush de inmediato
        await flushAllPersistence();

        expect(setItemMock).toHaveBeenCalledTimes(1);
        expect(setItemMock).toHaveBeenCalledWith('permissions', expect.objectContaining({
            estado: 'critico',
        }));
    });

    it('cancelPendingPersistence descarta escrituras pendientes sin persistir a disco', async () => {
        getItemMock.mockResolvedValueOnce(null);

        const pinia = createPinia();
        setActivePinia(pinia);

        const useCancelStore = defineStore('permissions', {
            state: () => ({ dato: 'a', isHydrated: false }),
        });

        const store = useCancelStore();
        permissionsPersistencePlugin({ store });
        await wait(50);
        setItemMock.mockClear();

        store.dato = 'cancelable';
        await Promise.resolve();
        // Cancelar inmediatamente (ej. logout)
        cancelPendingPersistence();

        // Esperar más de 300ms
        await wait(350);

        expect(setItemMock).not.toHaveBeenCalled();
    });

    it('hidrata permissions reconstruyendo abilities y fijando isLoaded a true (SPEC-016 P0)', async () => {
        getItemMock.mockResolvedValueOnce({
            roles: ['ADMIN_EMPRESA'],
            permissions: ['users.view'],
            user: { id: 1, name: 'Admin' },
        });

        const pinia = createPinia();
        setActivePinia(pinia);

        const buildAbilitiesMock = vi.fn();
        const usePermStore = defineStore('permissions', {
            state: () => ({
                roles: [],
                permissions: [],
                user: null,
                isLoaded: false,
                isHydrated: false,
            }),
            actions: {
                buildAbilities() {
                    this.isLoaded = true;
                    buildAbilitiesMock();
                },
            },
        });

        const store = usePermStore();
        permissionsPersistencePlugin({ store });
        await wait(50);

        expect(store.roles).toEqual(['ADMIN_EMPRESA']);
        expect(store.isLoaded).toBe(true);
        expect(buildAbilitiesMock).toHaveBeenCalledTimes(1);
    });

    it('cancela timeout si el estado revierte al valor ya persistido (A -> B -> A)', async () => {
        getItemMock.mockResolvedValueOnce(null);

        const pinia = createPinia();
        setActivePinia(pinia);

        const useRevertStore = defineStore('ui', {
            state: () => ({ valor: 'A', isHydrated: false }),
        });

        const store = useRevertStore();
        uiPersistencePlugin({ store });
        await wait(50);
        setItemMock.mockClear();

        // Primera persistencia
        store.valor = 'B';
        await wait(350);
        expect(setItemMock).toHaveBeenCalledTimes(1);
        expect(setItemMock).toHaveBeenCalledWith('ui', expect.objectContaining({ valor: 'B' }));
        setItemMock.mockClear();

        // Mutar B -> C y antes de que expire el debounce revertir a B
        store.valor = 'C';
        await wait(50);
        store.valor = 'B'; // revierte a lo que ya está en lastSerialized
        await wait(350);

        // No debe haberse ejecutado una escritura redundante
        expect(setItemMock).not.toHaveBeenCalled();
    });
});
