/**
 * Autollenado del número de licencia de conducción con el número de documento
 * (en Colombia ambos coinciden para conductores). Es un espejo de UNA vía:
 * documento → licencia, nunca licencia → documento, y si el usuario tecleó
 * una licencia distinta del documento, se respeta.
 *
 * Devuelve el nuevo valor de la licencia, o null cuando no se debe cambiar.
 *
 * - Sin documento: no toca nada (borrar el documento no borra la licencia).
 * - Licencia vacía: toma el documento.
 * - Licencia igual al documento anterior: sigue espejada (se escribe a mano
 *   en el documento y la licencia lo acompañe).
 * - Licencia distinta del documento anterior (la tecleó el usuario): no se toca.
 */
export function licenciaDesdeDocumento({ documento, licenciaActual, documentoAnterior }) {
    const docNuevo = String(documento ?? '').trim();
    if (!docNuevo) return null;

    const licencia = licenciaActual == null ? '' : String(licenciaActual);
    const docPrevio = documentoAnterior == null ? '' : String(documentoAnterior);

    if (!licencia) return docNuevo;
    if (licencia === docPrevio) return docNuevo;
    return null;
}
