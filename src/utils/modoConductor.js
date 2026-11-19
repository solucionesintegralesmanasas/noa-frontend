/**
 * Regla única de "modo conductor": decide qué vista y qué shell se muestran.
 * Ubicación: src/utils/modoConductor.js
 *
 * Funciones puras: reciben ruta, rol y plataforma, y no tocan DOM, Pinia
 * ni Capacitor. El hook `useModoConductor` las conecta con la app.
 *
 * `?view=conductor` previsualiza el modo conductor; `?view=admin` lo anula.
 */

/** Anchura (px) hasta la que un conductor en web recibe el shell móvil. */
export const ANCHO_MOVIL_MAX = 768;

/** Rutas operativas donde el conductor usa el shell móvil. */
export const RUTAS_OPERATIVAS_CONDUCTOR = [
    '/dashboard',
    '/inspeccion-vehiculos',
    '/planillas-de-control-de-servicios',
    '/planilla-de-control-de-prestacion-servicios',
    '/extracto-de-contrato',
    '/vehiculos',
    '/profile',
    '/notificaciones',
    '/flota/solicitudes-tanqueo',
];

export function esRutaOperativaConductor(path = '') {
    if (!path || typeof path !== 'string') return false;
    const cleanPath = path.trim();
    if (cleanPath.includes('..')) return false;
    return RUTAS_OPERATIVAS_CONDUCTOR.some((r) => cleanPath === r || cleanPath.startsWith(`${r}/`));
}

/** ¿Se trata la sesión como conductor? (rol, o previsualización; `view=admin` lo anula). */
export function esModoConductor(opts = {}) {
    const { view = null, esConductor = false } = opts || {};
    if (view === 'admin') return false;
    if (view === 'conductor') return true;
    return !!esConductor;
}

/** ¿El layout oculta el sidebar por estar en el dashboard del conductor? */
export function esDashboardDeConductor(opts = {}) {
    const { path = '', view = null, esConductor = false } = opts || {};
    if (view === 'admin') return false;
    const safePath = typeof path === 'string' ? path : '';
    if (safePath.includes('/dashboard/conductor')) return true;
    // `?view=conductor` es previsualización: solo rige en rutas operativas,
    // para no dejar sin navegación las pantallas de administración.
    if (view === 'conductor') return esRutaOperativaConductor(safePath);
    return safePath === '/dashboard' && !!esConductor;
}

/** ¿Se usa el shell/vista móvil del conductor en esta ruta? */
export function esMovilConductor(opts = {}) {
    const { path = '', view = null, esConductor = false } = opts || {};
    if (!esModoConductor({ view, esConductor })) return false;
    // Web: el conductor usa siempre las vistas móviles de Android, sin importar
    // el ancho ni la plataforma.
    return esRutaOperativaConductor(path);
}
