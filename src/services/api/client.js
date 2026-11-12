/**
 * Cliente API centralizado (Axios)
 * Ubicación: src/services/api/client.js
 */

import axios from "axios";
import env from "@utils/env.js";
import { Capacitor } from "@capacitor/core";
import { requestInterceptor, responseInterceptor } from "@services/api/interceptors.js";

const getBaseUrl = () => {
    if (Capacitor.isNativePlatform()) {
        if (env.API_NATIVE_URL) return env.API_NATIVE_URL;
        if (env.API_BASE_URL && /^https?:\/\//i.test(env.API_BASE_URL)) {
            return env.API_BASE_URL;
        }
        return "https://api.transportessinbarreras.local/api/v1/";
    }
    // En desarrollo, .env define /api/v1/ (proxy de Vite); en producción,
    // .env.production define la URL absoluta del backend.
    return env.API_BASE_URL;
};

const DEFAULT_CONFIG = {
    baseURL: getBaseUrl(),
    timeout: env.API_TIMEOUT || 30000,
    // Necesario para que el login guarde la cookie HTTP-only del refresh token
    // y para enviarla al renovar el access token.
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-App-Version": env.APP_VERSION || "1.0.0",
    }
};

let globalInstance = null;

const apiClient = {
    /**
     * Instancia canónica única. La cabecera X-Company-UUID la resuelve
     * dinámicamente el interceptor de solicitudes desde auth.currentTenant.id.
     */
    get global() {
        if (!globalInstance) globalInstance = this._createInstance();
        return globalInstance;
    },
    /**
     * Factoría de instancias con interceptores unificados
     */
    _createInstance(extraConfig = {}) {
        const instance = axios.create({
            ...DEFAULT_CONFIG,
            ...extraConfig,
            headers: { ...DEFAULT_CONFIG.headers, ...extraConfig.headers }
        });

        // Aplicar interceptores unificados (Request/Auth + Response/Error)
        instance.interceptors.request.use(requestInterceptor);
        instance.interceptors.response.use(
            responseInterceptor.success,
            responseInterceptor.error
        );

        return instance;
    }
};

export default apiClient;
