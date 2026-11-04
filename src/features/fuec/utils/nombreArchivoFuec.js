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
    const placa = (
        detalle?.vehicle?.vehicle_license_plate
        || detalle?.vehicle_license_plate
        || detalle?.placa
        || ''
    ).trim();
    const origen = (detalle?.origin_route || detalle?.origin || '').trim();
    const destino = (detalle?.destination_route || detalle?.destination || '').trim();
    const recorrido = [origen, destino].filter(Boolean).join(' - ');

    let base = ['FUEC', placa || 'SINPLACA', recorrido]
        .filter(Boolean)
        .join(' - ')
        .replace(/[/\\:*?"<>|]/g, '-')
        .replace(/\s+/g, ' ')
        .trim();

    if (base.length > 180) base = base.slice(0, 180);
    base = base.replace(/[-.\s]+$/, '');

    return base ? `${base}.pdf` : `FUEC-${uuid || 'documento'}.pdf`;
}

export default nombreArchivoFuec;
