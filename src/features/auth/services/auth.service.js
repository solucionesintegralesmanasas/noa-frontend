import apiClient from "@services/api/client.js";
import { tokenManager } from "@services/security/token-manager.js";
import { logger } from "@utils/logger.js";

export const authService = {
    /**
     * Procesa el inicio de sesión con Laravel Sanctum.
     * @param {Object} credentials - Email y contraseña del usuario.
     * @returns {Promise<Object>} - Datos del usuario autenticado y token.
     */
    async login(credentials) {
        const response = await apiClient.global.post("/login", credentials);
        
        // Manejo flexible de la estructura de respuesta
        const payload = response.data?.data || response.data || {};

        // Doble factor requerido: se guarda el token de desafío (solo 2fa:challenge)
        // para poder llamar a /2fa/verify y se devuelve la señal al store.
        if (payload.status === "two_factor_required") {
            if (payload.access_token) {
                await tokenManager.setToken(payload.access_token);
            }
            return { twoFactorRequired: true, user: payload.user };
        }

        const { user, access_token: token } = payload;

        if (!user) {
            throw new Error("Estructura de respuesta no válida: 'user' indefinido");
        }

        // Persistir usando el manager de Sanctum
        if (token) {
            await tokenManager.setToken(token);
        }

        logger.info("Login exitoso", { userId: user.id });
        return { user, token };
    },

    /**
     * Canjea el código 2FA (TOTP o de recuperación) y obtiene el token definitivo.
     * @param {string} code - Código de 6 dígitos o de recuperación.
     * @returns {Promise<Object>} - { user, token }
     */
    async verifyTwoFactor(code) {
        const response = await apiClient.global.post("/2fa/verify", { code });
        const payload = response.data?.data || response.data || {};
        const { user, token } = payload;

        if (!user || !token) {
            throw new Error("Estructura de respuesta no válida en la verificación 2FA");
        }

        await tokenManager.setToken(token);
        return { user, token };
    },

    /**
     * Procesa el cierre de sesión.
     */
    async logout() {
        try {
            await apiClient.global.post("/logout");
        } finally {
            await tokenManager.clearTokens();
        }
    },

    /**
     * Obtiene el perfil del usuario autenticado.
     */
    async getProfile() {
        const response = await apiClient.global.get("/me");
        const payload = response.data?.data || response.data;
        // El endpoint /me devuelve { user: {...}, roles: [...], ... }
        // Para mantener compatibilidad con lo que espera setProfile, extraemos el objeto user:
        return payload.user || payload;
    }
};

export default authService;