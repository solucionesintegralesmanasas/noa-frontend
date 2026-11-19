import { describe, it, expect } from 'vitest';
import { PDF_DOCUMENTOS, PDF_MODOS, normalizarPdfBranding } from '../pdfBranding.js';

describe('pdfBranding', () => {
    it('incluye reporte_actividad_vehicular y las demás claves operativas en PDF_DOCUMENTOS', () => {
        const claves = PDF_DOCUMENTOS.map((doc) => doc.clave);

        expect(claves).toContain('reporte_actividad_vehicular');
        expect(claves).toContain('reporte_vehiculos');
        expect(new Set(claves).size).toBe(claves.length);
    });

    it('ofrece únicamente los modos configurables distintos al defecto', () => {
        expect(PDF_MODOS.map((m) => m.valor)).toEqual(['membrete', 'limpio']);
    });

    it('normaliza pdf_branding preservando modos válidos incluido reporte_actividad_vehicular', () => {
        const resultado = normalizarPdfBranding({
            reporte_actividad_vehicular: 'membrete',
            fuec: 'limpio',
            mantenimiento: 'fondo',
            planilla_diaria: 'invalido',
            clave_desconocida: 'membrete',
        });

        expect(resultado).toEqual({
            reporte_actividad_vehicular: 'membrete',
            fuec: 'limpio',
        });
    });

    it('devuelve objeto vacío ante entradas nulas, primitivas o arreglos', () => {
        expect(normalizarPdfBranding(null)).toEqual({});
        expect(normalizarPdfBranding(undefined)).toEqual({});
        expect(normalizarPdfBranding([])).toEqual({});
        expect(normalizarPdfBranding('membrete')).toEqual({});
    });
});
