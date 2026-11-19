/**
 * Construye el nombre de archivo de un FUEC con la misma fórmula que el backend
 * (`PdfService::nombreArchivo`): "FUEC - placa - recorrido.pdf".
 *
 * Sirve de respaldo cuando el navegador no puede leer el encabezado
 * `Content-Disposition` (p. ej. descargas cross-origin sin exponer la cabecera
 * vía CORS) y como nombre explícito al descargar desde el listado o al crear.
 *
 * @param {Object|null} detalle - FUEC con vehículo y rutas.
 * @param {string} uuid - UUID del FUEC, usado solo si no hay datos.
 * @returns {string} Nombre terminado en `.pdf`.
 */
export function nombreArchivoFuec(detalle, uuid = '') {
    const safeStr = (v) => (v == null || typeof v === 'symbol' || (typeof v === 'object' && !(v instanceof Date)) ? '' : String(v).trim());

    const placa = safeStr(
        detalle?.vehicle?.vehicle_license_plate
        || detalle?.vehicle_license_plate
        || detalle?.placa
    );
    const origen = safeStr(detalle?.origin_route || detalle?.origin);
    const destino = safeStr(detalle?.destination_route || detalle?.destination);
    const recorrido = [origen, destino].filter(Boolean).join(' - ');

    let base = ['FUEC', placa || 'SINPLACA', recorrido]
        .filter(Boolean)
        .join(' - ')
        .replace(/[\x00-\x1f\x7f/\\:*?"<>|]/g, '-')
        .replace(/\s+/g, ' ')
        .trim();

    if (base.length > 180) base = base.slice(0, 180);
    base = base.replace(/[-.\s]+$/, '');

    const safeUuid = safeStr(uuid);
    return base ? `${base}.pdf` : `FUEC-${safeUuid || 'documento'}.pdf`;
}

export default nombreArchivoFuec;
