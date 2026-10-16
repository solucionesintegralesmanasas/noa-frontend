/**
 * Estado de documentos vehiculares.
 * Ubicación: src/utils/documentStatus.js
 *
 * El vocabulario vigente es VIGENTE / NO VIGENTE. Los registros históricos
 * usan SI / NO y se muestran con el mismo significado para no romper
 * listados ni badges con datos anteriores a la unificación.
 */

const NORMALIZADO = { SI: 'VIGENTE', NO: 'NO VIGENTE' };

/**
 * Normaliza un estado histórico al vocabulario vigente.
 * @param {string|null|undefined} estado
 * @returns {string}
 */
export function normalizarEstadoDocumento(estado) {
    if (estado === null || estado === undefined) return '';
    return NORMALIZADO[estado] ?? estado;
}

/**
 * Clase de badge para el estado normalizado.
 * @param {string|null|undefined} estado
 * @returns {'badge-subtle-success'|'badge-subtle-warning'}
 */
export function claseEstadoDocumento(estado) {
    return normalizarEstadoDocumento(estado) === 'VIGENTE'
        ? 'badge-subtle-success'
        : 'badge-subtle-warning';
}
