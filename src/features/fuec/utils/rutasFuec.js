/**
 * Constantes y helpers de navegación para el módulo de FUEC.
 */
export const RUTA_FUEC_LISTADO = '/extracto-de-contrato';
export const RUTA_FUEC_CREAR = '/extracto-de-contrato/crear';

/**
 * Genera el descriptor de ruta para iniciar la renovación de un FUEC existente.
 *
 * @param {string} uuid - UUID del FUEC a renovar.
 * @returns {{ path: string, query: { renovar: string } }}
 */
export function rutaRenovarFuec(uuid) {
    return {
        path: RUTA_FUEC_CREAR,
        query: { renovar: uuid }
    };
}

