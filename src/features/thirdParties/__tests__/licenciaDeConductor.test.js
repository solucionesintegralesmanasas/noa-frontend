import { describe, expect, it } from 'vitest';
import { licenciaDesdeDocumento } from '../utils/licenciaDeConductor.js';

// Espejo de una sola vía: documento → licencia, nunca licencia → documento.
describe('licenciaDesdeDocumento (autollenado documento → licencia)', () => {
    it('licencia vacía toma el documento', () => {
        expect(licenciaDesdeDocumento({ documento: '94483254', licenciaActual: null, documentoAnterior: '' })).toBe('94483254');
        expect(licenciaDesdeDocumento({ documento: '94483254', licenciaActual: '', documentoAnterior: '944' })).toBe('94483254');
    });

    it('sigue escribiendo a mano: la licencia espejada acompañe el documento carácter a carácter', () => {
        // licencia = doc anterior (espejada) → con cada tecleado sigue el documento.
        expect(licenciaDesdeDocumento({ documento: '944', licenciaActual: '94', documentoAnterior: '94' })).toBe('944');
        expect(licenciaDesdeDocumento({ documento: '94483', licenciaActual: '944', documentoAnterior: '944' })).toBe('94483');
    });

    it('NO toca una licencia que el usuario tecleó distinta del documento (no viceversa)', () => {
        expect(licenciaDesdeDocumento({ documento: '123456', licenciaActual: '999999', documentoAnterior: '' })).toBe(null);
        expect(licenciaDesdeDocumento({ documento: '123456', licenciaActual: '94483254', documentoAnterior: '94483000' })).toBe(null);
    });

    it('borrar el documento no borra la licencia', () => {
        expect(licenciaDesdeDocumento({ documento: '', licenciaActual: '94483254', documentoAnterior: '9448' })).toBe(null);
        expect(licenciaDesdeDocumento({ documento: '   ', licenciaActual: '', documentoAnterior: '' })).toBe(null);
    });

    it('en la carga de edición la licencia existente se conserva aunque el documento difiera', () => {
        // Al montar el formulario el documento pasa de '' a su valor: el valor previo es ''.
        expect(licenciaDesdeDocumento({ documento: '1090654321', licenciaActual: 'LIB-019283746', documentoAnterior: '' })).toBe(null);
        // Sin licencia en el registro y al cargar el documento sí se autollena.
        expect(licenciaDesdeDocumento({ documento: '1090654321', licenciaActual: null, documentoAnterior: '' })).toBe('1090654321');
    });
});
