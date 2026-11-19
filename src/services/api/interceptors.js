/**
 * Interceptores unificados para reducir sobrecarga de importación
 * Ubicación: src/services/api/interceptors.js
 */
import { logger } from "@utils/logger.js";
import { tokenManager } from "@services/security/token-manager.js";
import { maskRequestData, maskResponseData } from "@utils/mask.js";
import { handleGlobalError, isCancelError } from "@utils/error-handler.js";
import { flushAllPersistence } from "@/store/plugins/persistence.js";
import axios from "axios";

/**
 * Registry de stores para romper dependencia circular sin dynamic import.
 * Los stores se registran en plugins.js tras la hidratación inicial.
 * @type {{ authStore: Object|null, userStore: Object|null, permissionsStore: Object|null }}
 */
export const storeRegistry = { authStore: null, userStore: null, permissionsStore: null };

// Flag para evitar cascada de 401 → logout → /logout → 401
let _isHandling401 = false;

// Renovación en vuelo compartida: varios 401 simultáneos esperan el mismo
// refresh en lugar de pedir un token por cada petición.
let _refreshPromise = null;

/**
 * Pide un access token nuevo usando la cookie HTTP-only del refresh token.
 * Devuelve el token renovado o rechaza si el refresh no es válido.
 */
function refreshAccessToken(baseURL) {
    if (!_refreshPromise) {
        _refreshPromise = axios
            .post(`${baseURL || ""}refresh-token`, null, { withCredentials: true })
            .then(async (response) => {
                const token = response.data?.data?.access_token ?? response.data?.access_token;
                if (!token) throw new Error("La renovación no devolvió access token");
                await tokenManager.setToken(token);
                if (storeRegistry.authStore) {
                    storeRegistry.authStore.accessToken = token;
                    await flushAllPersistence();
                }
                return token;
            })
            .finally(() => { _refreshPromise = null; });
    }
    return _refreshPromise;
}

// Interceptor de Request
export const requestInterceptor = async (config) => {
    config = config || {};
    config.headers = config.headers || {};
    config.metadata = { startTime: Date.now() };

    // Inyección automática de token (Sanctum PAT)
    const token = await tokenManager.getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // Multi-tenant: la empresa activa se resuelve en cada petición desde el store
    // (sin instancias cacheadas). authStore.currentTenant.id tiene prioridad, con
    // fallback a userStore.company_uuid si no está definido. Una cabecera explícita prevalece.
    if (!config.headers["X-Company-UUID"]) {
        const tenantId = storeRegistry.authStore?.currentTenant?.id || storeRegistry.userStore?.company_uuid;
        if (tenantId) config.headers["X-Company-UUID"] = tenantId;
    }

    logger.debug("📡 Request", { url: config.url, data: maskRequestData(config.data) });
    return config;
};

// Interceptor de Response
export const responseInterceptor = {
    success: (response) => {
        const duration = Date.now() - (response?.config?.metadata?.startTime || Date.now());
        logger.info(`✅ ${response?.config?.method?.toUpperCase() || 'HTTP'} ${response?.config?.url || ''} (${duration}ms)`);
        return response;
    },
    error: async (error) => {
        if (!error) return Promise.reject(error);
        // Las cancelaciones propias (AbortController/axios) son esperadas al anular peticiones
        // en vuelo (búsqueda, paginación, etc.): no son errores reales y no deben registrarse
        // como `API Error`, disparar toasts ni limpiar sesión.
        if (isCancelError(error)) return Promise.reject(error);

        const { response, config } = error || {};

        // Las rutas públicas de autenticación gestionan su propio error en la vista
        // de login (mensaje inline). No deben limpiar la sesión ni emitir
        // `auth:unauthorized`, o un 401 por credenciales se convierte en logout global.
        const url = String(config?.url || '');
        const esRutaAuthPublica = url.includes('/login') || url.includes('/refresh-token');
        if (esRutaAuthPublica) return Promise.reject(error);

        if (response?.status === 401) {
            if (_isHandling401) return Promise.reject(error);

            // Token de acceso vencido: se renueva con el refresh token de 30 días
            // y se reintenta la petición original una sola vez. El logout y los desafíos
            // de 2FA no se renuevan: deben tratarse por sus propios flujos.
            const original = error.config || {};
            const esExcluidaDeRefresh = url.includes('/logout')
                || url.includes('/refresh-token')
                || url.includes('/2fa/');

            if (!original._reintentado && !esExcluidaDeRefresh) {
                original._reintentado = true;
                try {
                    const token = await refreshAccessToken(original.baseURL);
                    original.headers = {
                        ...(original.headers?.toJSON?.() ?? original.headers ?? {}),
                        Authorization: `Bearer ${token}`,
                    };
                    return axios.request(original);
                } catch {
                    // Sin refresh válido: se cierra la sesión como antes.
                }
            }

            _isHandling401 = true;

            try {
                const { authStore, userStore, permissionsStore } = storeRegistry;
                if (authStore?.isAuthenticated && authStore?.accessToken) {
                    authStore.$reset();
                    userStore?.clear();
                    permissionsStore?.clear();
                }
                await tokenManager.clearTokens();
            } catch {
                await tokenManager.clearTokens();
            }
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            setTimeout(() => { _isHandling401 = false; }, 3000);
            return Promise.reject(error);
        }

        if (response?.status === 422) {
            logger.warn(`⚠️ Validación de formulario 422 en ${config?.url}`, { data: maskResponseData(response?.data) });
            return Promise.reject(error);
        }

        const estado = response?.status ?? error?.code ?? 'sin-respuesta';
        logger.error(`💥 API Error ${estado} | ${config?.method?.toUpperCase() || ''} ${config?.url || ''} | ${error?.message || ''}`, { url: config?.url, data: maskResponseData(response?.data) });
        await handleGlobalError(error, "api", { redirectToErrorView: false });
        return Promise.reject(error);
    }
};