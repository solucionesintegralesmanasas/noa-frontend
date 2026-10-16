// Parseo flexible de fechas pegadas desde páginas del gobierno.
import { describe, expect, it } from 'vitest';
import { parsearFechaFlexible } from '../../utils/date.js';

describe('parsearFechaFlexible', () => {
    it('acepta dd/mm/aaaa', () => {
        expect(parsearFechaFlexible('14/09/2026')).toBe('2026-09-14');
    });

    it('acepta variantes de separador y dígitos', () => {
        expect(parsearFechaFlexible('14-09-2026')).toBe('2026-09-14');
        expect(parsearFechaFlexible('14.09.2026')).toBe('2026-09-14');
        expect(parsearFechaFlexible('4/9/2026')).toBe('2026-09-04');
    });

    it('acepta ISO y recorta espacios', () => {
        expect(parsearFechaFlexible('2026-09-14')).toBe('2026-09-14');
        expect(parsearFechaFlexible('  14/09/2026  ')).toBe('2026-09-14');
    });

    it('acepta año/mes/día (formato RUNT con barras o puntos)', () => {
        expect(parsearFechaFlexible('2026/09/14')).toBe('2026-09-14');
        expect(parsearFechaFlexible('2026.09.14')).toBe('2026-09-14');
    });

    it('acepta año de dos dígitos y fecha compacta', () => {
        expect(parsearFechaFlexible('14/09/26')).toBe('2026-09-14');
        expect(parsearFechaFlexible('20260914')).toBe('2026-09-14');
    });

    it('tolera hora al final (copiados con timestamp)', () => {
        expect(parsearFechaFlexible('2026-09-14 00:00:00')).toBe('2026-09-14');
        expect(parsearFechaFlexible('14/09/2026 00:00')).toBe('2026-09-14');
    });

    it('día/mes conserva prioridad sobre mes/día', () => {
        expect(parsearFechaFlexible('01/02/2026')).toBe('2026-02-01');
        expect(parsearFechaFlexible('01/02/26')).toBe('2026-02-01');
    });

    it('rechaza fechas imposibles y vacíos', () => {
        expect(parsearFechaFlexible('32/13/2026')).toBeNull();
        expect(parsearFechaFlexible('no-fecha')).toBeNull();
        expect(parsearFechaFlexible('')).toBeNull();
        expect(parsearFechaFlexible(null)).toBeNull();
    });
});
