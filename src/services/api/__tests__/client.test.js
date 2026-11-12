import { describe, expect, it, vi, beforeEach } from 'vitest';
import { requestInterceptor, storeRegistry } from '../interceptors.js';
import apiClient from '../client.js';

vi.mock('@services/security/token-manager.js', () => ({
    tokenManager: {
        getAccessToken: vi.fn(async () => 'fake-token'),
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

describe('Cliente API e Interceptor Dinámico Multi-tenant (SPEC-016)', () => {
    beforeEach(() => {
        storeRegistry.authStore = { currentTenant: { id: 'empresa-auth-1' } };
        storeRegistry.userStore = { company_uuid: 'empresa-user-fallback' };
    });

    it('apiClient.global retorna una única instancia canónica', () => {
        const inst1 = apiClient.global;
        const inst2 = apiClient.global;
        expect(inst1).toBeDefined();
        expect(inst1).toBe(inst2);
    });

    it('inyecta dinámicamente X-Company-UUID desde authStore.currentTenant.id', async () => {
        const config = { headers: {} };
        const result = await requestInterceptor(config);

        expect(result.headers['X-Company-UUID']).toBe('empresa-auth-1');
        expect(result.headers.Authorization).toBe('Bearer fake-token');
    });

    it('si authStore.currentTenant.id es null, usa userStore.company_uuid como respaldo', async () => {
        storeRegistry.authStore = { currentTenant: { id: null } };
        const config = { headers: {} };
        const result = await requestInterceptor(config);

        expect(result.headers['X-Company-UUID']).toBe('empresa-user-fallback');
    });

    it('respeta una cabecera X-Company-UUID explícita enviada en la llamada', async () => {
        const config = { headers: { 'X-Company-UUID': 'empresa-explicita' } };
        const result = await requestInterceptor(config);

        expect(result.headers['X-Company-UUID']).toBe('empresa-explicita');
    });

    it('no inyecta cabecera si ningún store tiene tenant', async () => {
        storeRegistry.authStore = { currentTenant: null };
        storeRegistry.userStore = { company_uuid: null };
        const config = { headers: {} };
        const result = await requestInterceptor(config);

        expect(result.headers['X-Company-UUID']).toBeUndefined();
    });

    it('refleja cambios dinámicos de empresa entre peticiones consecutivas', async () => {
        storeRegistry.authStore = { currentTenant: { id: 'empresa-A' } };
        const req1 = await requestInterceptor({ headers: {} });
        expect(req1.headers['X-Company-UUID']).toBe('empresa-A');

        // Usuario cambia de empresa en el selector superior
        storeRegistry.authStore.currentTenant.id = 'empresa-B';
        const req2 = await requestInterceptor({ headers: {} });
        expect(req2.headers['X-Company-UUID']).toBe('empresa-B');
    });
});
