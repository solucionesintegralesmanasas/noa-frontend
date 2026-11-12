// @vitest-environment jsdom
// El 401 debe intentar renovar el access token con el refresh de 30 días y
// reintentar una sola vez; sin refresh válido, cierra la sesión como antes.
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('axios', () => ({
    default: { post: vi.fn(), request: vi.fn() },
}));
vi.mock('@services/security/token-manager.js', () => ({
    tokenManager: { getAccessToken: vi.fn(), setToken: vi.fn(), clearTokens: vi.fn() },
}));
vi.mock('@utils/logger.js', () => ({
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('@utils/mask.js', () => ({
    maskRequestData: (data) => data,
    maskResponseData: (data) => data,
}));
vi.mock('@utils/error-handler.js', () => ({
    handleGlobalError: vi.fn(),
    isCancelError: () => false,
}));

import axios from 'axios';
import { tokenManager } from '@services/security/token-manager.js';
import { responseInterceptor, storeRegistry } from '../interceptors.js';

const error401 = () => {
    const error = new Error('Request failed with status code 401');
    error.config = { url: '/me', baseURL: '/api/v1/', headers: {} };
    error.response = { status: 401, data: {} };
    return error;
};

describe('responseInterceptor: renovación de sesión', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        storeRegistry.authStore = null;
    });

    it('renueva el token y reintenta la petición original', async () => {
        axios.post.mockResolvedValue({ data: { data: { access_token: 'nuevo' } } });
        axios.request.mockResolvedValue({ data: { ok: true } });

        const resultado = await responseInterceptor.error(error401());

        expect(axios.post).toHaveBeenCalledWith('/api/v1/refresh-token', null, { withCredentials: true });
        expect(tokenManager.setToken).toHaveBeenCalledWith('nuevo');
        expect(axios.request).toHaveBeenCalledWith(expect.objectContaining({
            url: '/me',
            _reintentado: true,
            headers: { Authorization: 'Bearer nuevo' },
        }));
        expect(resultado).toEqual({ data: { ok: true } });
    });

    it('varios 401 simultáneos comparten una sola renovación', async () => {
        axios.post.mockResolvedValue({ data: { data: { access_token: 'nuevo' } } });
        axios.request.mockResolvedValue({ data: { ok: true } });

        await Promise.all([
            responseInterceptor.error(error401()),
            responseInterceptor.error(error401()),
        ]);

        expect(axios.post).toHaveBeenCalledTimes(1);
    });

    it('sin refresh válido limpia la sesión y avisa a la app', async () => {
        axios.post.mockRejectedValue(new Error('401'));
        const evento = vi.spyOn(window, 'dispatchEvent');

        await expect(responseInterceptor.error(error401())).rejects.toThrow('401');

        expect(tokenManager.clearTokens).toHaveBeenCalled();
        expect(evento).toHaveBeenCalledWith(expect.objectContaining({ type: 'auth:unauthorized' }));
    });
});
