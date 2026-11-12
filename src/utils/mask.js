/**
 * Enmascaramiento eficiente de datos.
 * Ubicación: src/utils/mask.js
 */

const SENSITIVE = new Set(['token', 'password', 'secret', 'authorization', 'otp']);

export function maskSensitiveFields(obj, vistos = new WeakSet()) {
    if (!obj || typeof obj !== 'object') return obj;

    if (obj instanceof Date || obj instanceof RegExp || obj instanceof Error) return obj;
    if (typeof Blob !== 'undefined' && obj instanceof Blob) return obj;

    if (vistos.has(obj)) return '[Circular]';
    vistos.add(obj);

    if (Array.isArray(obj)) return obj.map((item) => maskSensitiveFields(item, vistos));

    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        result[key] = SENSITIVE.has(String(key).toLowerCase())
            ? '***'
            : (typeof value === 'object' && value !== null ? maskSensitiveFields(value, vistos) : value);
    }
    return result;
}

export const maskRequestData = maskSensitiveFields;
export const maskResponseData = maskSensitiveFields;