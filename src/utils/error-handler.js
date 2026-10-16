/**
 * Manejador de Errores Globales
 * Ubicación: src/utils/error-handler.js
 */

import { logger } from "@utils/logger.js";

const AUTH_ERROR_CODES = new Set([401, 403]);
const RETRYABLE_HTTP_CODES = new Set([408, 429, 500, 502, 503, 504]);

// Cuando el servidor no responde no llega un mensaje de negocio: axios solo deja
// "Request failed with status code 502". Estos textos explican el motivo en español.
const MENSAJES_SERVIDOR = {
    500: "El servidor encontró un error al procesar la solicitud. Inténtalo de nuevo.",
    502: "El servidor no está respondiendo. Es posible que se haya reiniciado: espera unos segundos e inténtalo de nuevo.",
    503: "El servidor está ocupado o en mantenimiento. Inténtalo de nuevo en unos minutos.",
    504: "El servidor tardó demasiado en responder. Inténtalo de nuevo."
};

const ErrorType = { HTTP: "http", NETWORK: "network", JS: "js", UNKNOWN: "unknown" };

/** Detecta cancelaciones propias (AbortController/axios): siempre son silencio. */
export const isCancelError = (err) =>
    !!err && (err.code === "ERR_CANCELED" || err.name === "CanceledError" || err.name === "AbortError");

/** Router inyectado desde plugins.js para evitar dependencia circular */
let _router = null;
export const setErrorRouter = (r) => { _router = r; };

/** Clasificación de errores */
function classifyError(error) {
    if (error?.response) {
        const status = error.response.status;
        return {
            type: ErrorType.HTTP,
            httpStatus: status,
            isAuthError: AUTH_ERROR_CODES.has(status),
            shouldRedirect: AUTH_ERROR_CODES.has(status),
            shouldRetry: RETRYABLE_HTTP_CODES.has(status)
        };
    }
    if (!error?.response && error?.request) return { type: ErrorType.NETWORK, shouldRetry: true };
    return { type: error instanceof Error ? ErrorType.JS : ErrorType.UNKNOWN };
}

/** Redirección profesional a vistas de error */
function redirectError(status) {
    if (!_router) return;
    const routes = { 403: "/403", 404: "/404", 500: "/500" };
    if (routes[status]) _router.push(routes[status]);
}

/** Notificador visual (integra con tu sistema de Toasts) */
function notifyUser(message, type = "error") {
    window.dispatchEvent(new CustomEvent("app:toast", { detail: { type, message } }));
}

/** Manejador principal */
export async function handleGlobalError(error, source = "global", options = {}) {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    const classification = classifyError(normalizedError);

    // Los objetos Error no tienen propiedades enumerables: se reportan como {}.
    // Se envía un objeto plano con componente, contexto y stack para poder localizar el fallo.
    const report = {
        classification,
        ...(options.meta || {}),
        stack: normalizedError?.stack ? String(normalizedError.stack).split('\n').slice(0, 8).join('\n') : null,
    };
    logger.error(`[${source}] ${normalizedError.message}`, report, { classification });

    if (options.notifyUser !== false) {
        const mensajeNegocio = typeof error?.response?.data?.message === "string" && error.response.data.message.trim()
            ? error.response.data.message
            : null;
        const backendMsg = mensajeNegocio
            || MENSAJES_SERVIDOR[error?.response?.status]
            || normalizedError.message
            || "Ha ocurrido un error inesperado";
        notifyUser(backendMsg, classification.isAuthError ? "warning" : "error");
    }

    // Solo redirigir a vista completa de error si se solicita explícitamente (ej: en router guards), no en peticiones AJAX normales
    if (options.redirectToErrorView === true && classification.type === ErrorType.HTTP) {
        await redirectError(classification.httpStatus);
    }
}

/** Registro global */
export function setupGlobalErrorHandlers() {
    if (typeof window === "undefined") return;

    window.addEventListener("error", (e) => handleGlobalError(e.error, "window-error"));
    window.addEventListener("unhandledrejection", (e) => handleGlobalError(e.reason, "promise-rejection"));
}