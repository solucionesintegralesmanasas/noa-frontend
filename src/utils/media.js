import env from './env.js';

/**
 * Retorna la URL completa para un recurso de media.
 * @param {string|null} path - Ruta relativa del archivo.
 * @param {string|null} fallback - URL/Ruta de respaldo si el path es nulo.
 * @returns {string} - URL absoluta del recurso.
 */
export function getMediaUrl(path, fallback = null) {
    const defaultFallback = typeof fallback === 'string' && fallback.trim() !== ''
        ? fallback
        : '/assets/img/favicons/favicon-32x32.png';

    if (!path || typeof path !== 'string') {
        return defaultFallback;
    }

    const trimmedPath = path.trim();
    if (!trimmedPath) {
        return defaultFallback;
    }

    // Bloquear esquemas peligrosos para evitar inyecciones XSS en href/src
    const lower = trimmedPath.toLowerCase();
    if (lower.startsWith('javascript:') || lower.startsWith('vbscript:') || lower.startsWith('data:text/html')) {
        return defaultFallback;
    }

    if (trimmedPath.startsWith('data:image/')) {
        return trimmedPath;
    }

    // Obtener la URL base del servidor (quitando la parte de /api/v1 si existe)
    const baseApiUrl = env.API_BASE_URL || 'https://api.transportessinbarreras.com/api/v1';
    const baseUrl = baseApiUrl.replace(/\/api\/v1\/?$/, '');

    // Si el backend devuelve una URL absoluta
    if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
        try {
            const urlObj = new URL(trimmedPath);
            if (urlObj.pathname.startsWith('/storage') || urlObj.pathname.startsWith('/assets')) {
                return `${baseUrl}${urlObj.pathname}${urlObj.search}`;
            }
        } catch {
            return defaultFallback;
        }
        return trimmedPath;
    }

    const safePath = trimmedPath.replace(/(\.\.[\/\\])+/g, '');
    const cleanPath = safePath.startsWith('/') ? safePath : `/${safePath}`;

    if (cleanPath.startsWith('/storage') || cleanPath.startsWith('/assets')) {
        return `${baseUrl}${cleanPath}`;
    }

    return `${baseUrl}/storage${cleanPath}`;
}

export default getMediaUrl;
