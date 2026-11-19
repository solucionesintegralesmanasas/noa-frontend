/**
 * Configuración de presentación por documento PDF (hoja membretada, fondo o limpio).
 * Claves alineadas con PdfService::PDF_CLAVES del backend.
 */
export const PDF_DOCUMENTOS = Object.freeze([
    { clave: 'fuec', etiqueta: 'FUEC' },
    { clave: 'hoja_vida_vehicular', etiqueta: 'Hoja de vida vehicular' },
    { clave: 'ficha_tecnica_vehiculo', etiqueta: 'Ficha técnica del vehículo' },
    { clave: 'acta_entrega', etiqueta: 'Acta de entrega' },
    { clave: 'mantenimiento', etiqueta: 'Hoja de vida de mantenimiento' },
    { clave: 'inspeccion_preoperacional', etiqueta: 'Inspección preoperacional' },
    { clave: 'planilla_diaria', etiqueta: 'Planilla diaria' },
    { clave: 'planilla_mensual', etiqueta: 'Planilla mensual / historial' },
    { clave: 'planilla_filtrada', etiqueta: 'Reporte de planillas filtradas' },
    { clave: 'convenio_colaboracion', etiqueta: 'Convenio de colaboración' },
    { clave: 'recibo_administracion', etiqueta: 'Recibo de administración' },
    { clave: 'reporte_vehiculos', etiqueta: 'Reporte de vehículos' },
    { clave: 'reporte_actividad_vehicular', etiqueta: 'Reporte de actividad vehicular' },
    { clave: 'ficha_tecnica_tercero', etiqueta: 'Ficha técnica del tercero' },
]);

export const PDF_MODOS = Object.freeze([
    { valor: 'membrete', etiqueta: 'Hoja membretada' },
    { valor: 'limpio', etiqueta: 'Sin nada (limpio)' },
]);

const MODOS_PDF_VALIDOS = PDF_MODOS.map((m) => m.valor);

/**
 * Filtra el mapa `pdf_branding` dejando únicamente documentos soportados y modos válidos.
 * Los documentos sin entrada o con valor por defecto ('fondo') se omiten para usar el defecto del backend.
 *
 * @param {unknown} valor
 * @returns {Record<string, string>}
 */
export const normalizarPdfBranding = (valor) => {
    const limpio = {};
    if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
        for (const doc of PDF_DOCUMENTOS) {
            if (MODOS_PDF_VALIDOS.includes(valor[doc.clave])) {
                limpio[doc.clave] = valor[doc.clave];
            }
        }
    }
    return limpio;
};
