/**
 * Ejecutor único de acciones de stores Pinia (carga + error + control de concurrencia).
 * Ubicación: src/store/helpers/runStoreAction.js
 */

import { toast } from '@utils/toast.js';
import { logger } from '@utils/logger.js';

export const VALIDATION_STATUS = 422;
export const FALLBACK_ERROR_MESSAGE = 'Error inesperado. Inténtalo de nuevo.';

/** Extrae el mensaje más útil: backend → error → respaldo. Nunca vacío. */
export function extractStoreErrorMessage(error, fallback = FALLBACK_ERROR_MESSAGE) {
    const backend = error?.response?.data?.message;
    if (typeof backend === 'string' && backend.trim()) return backend;
    const direct = typeof error === 'string' ? error : error?.message;
    if (typeof direct === 'string' && direct.trim()) return direct;
    if (typeof fallback === 'string' && fallback.trim()) return fallback;
    return FALLBACK_ERROR_MESSAGE;
}

function isValidationError(error) {
    return error?.response?.status === VALIDATION_STATUS;
}

/**
 * Determina si un error corresponde a una petición cancelada en vuelo.
 */
export function isCanceledActionError(error) {
    return Boolean(
        error &&
        (error.__isCanceled === true ||
            error.code === 'ERR_CANCELED' ||
            error.name === 'CanceledError' ||
            error.name === 'AbortError')
    );
}

/**
 * @param {object} store estado con `loading` y `error` (p. ej. `this` del store)
 * @param {Function} action trabajo asíncrono a ejecutar
 * @param {string} [errorMsg] mensaje de respaldo si el error no trae ninguno
 * @param {object} [deps] puntos de sustitución (solo pruebas): `{ notify, logger }`
 */
export async function runStoreAction(store, action, errorMsg, deps = {}) {
    const notify = deps.notify || toast;
    const log = deps.logger || logger;
    if (!Object.prototype.hasOwnProperty.call(store, '_activeRequests')) {
        Object.defineProperty(store, '_activeRequests', {
            value: 0,
            writable: true,
            enumerable: false,
            configurable: true,
        });
    }
    store._activeRequests += 1;
    store.loading = true;
    store.error = null;
    try {
        return await action();
    } catch (error) {
        if (isCanceledActionError(error)) {
            return undefined;
        }
        store.error = extractStoreErrorMessage(error, errorMsg);
        if (!isValidationError(error)) {
            try {
                await notify('Error', store.error, 'error');
            } catch (avisoError) {
                try {
                    log.warn('Store: no se pudo mostrar el aviso de error', { error: avisoError?.message });
                } catch {
                    /* el registro nunca rompe el flujo */
                }
            }
        }
        try {
            log.error('Store: acción fallida', { message: store.error });
        } catch {
            /* el registro nunca rompe el flujo */
        }
        throw error;
    } finally {
        store._activeRequests = Math.max(0, (store._activeRequests || 1) - 1);
        if (store._activeRequests === 0) {
            store.loading = false;
        }
    }
}

export default runStoreAction;
