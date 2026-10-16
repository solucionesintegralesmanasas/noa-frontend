// Compatibilidad de display del estado de documentos vehiculares.
// El vocabulario vigente es VIGENTE / NO VIGENTE; los registros históricos
// con SI / NO se muestran con el mismo significado.
import { describe, expect, it } from 'vitest';
import { normalizarEstadoDocumento, claseEstadoDocumento } from '../../utils/documentStatus.js';

describe('normalizarEstadoDocumento', () => {
    it('conserva el vocabulario vigente', () => {
        expect(normalizarEstadoDocumento('VIGENTE')).toBe('VIGENTE');
        expect(normalizarEstadoDocumento('NO VIGENTE')).toBe('NO VIGENTE');
    });

    it('traduce el vocabulario histórico SI/NO', () => {
        expect(normalizarEstadoDocumento('SI')).toBe('VIGENTE');
        expect(normalizarEstadoDocumento('NO')).toBe('NO VIGENTE');
    });

    it('no inventa valor ante nulos o desconocidos', () => {
        expect(normalizarEstadoDocumento(null)).toBe('');
        expect(normalizarEstadoDocumento(undefined)).toBe('');
        expect(normalizarEstadoDocumento('INACTIVA')).toBe('INACTIVA');
    });
});

describe('claseEstadoDocumento', () => {
    it('pinta en verde lo vigente, histórico o actual', () => {
        expect(claseEstadoDocumento('VIGENTE')).toBe('badge-subtle-success');
        expect(claseEstadoDocumento('SI')).toBe('badge-subtle-success');
    });

    it('pinta en advertencia lo no vigente', () => {
        expect(claseEstadoDocumento('NO VIGENTE')).toBe('badge-subtle-warning');
        expect(claseEstadoDocumento('NO')).toBe('badge-subtle-warning');
    });
});
