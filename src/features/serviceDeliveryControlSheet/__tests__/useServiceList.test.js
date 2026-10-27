import { describe, expect, it } from 'vitest';
import {
    formatRango,
    esCerrado,
    resumenDiasInfo,
    formatKm,
    paginaDestino
} from '../hooks/useServiceList.js';

describe('useServiceList helpers', () => {
    it('formatea fechas ISO a dd/mm/aaaa', () => {
        expect(formatRango('2026-10-16')).toBe('16/10/2026');
        expect(formatRango('')).toBe('');
    });

    it('identifica correctamente si un servicio está cerrado', () => {
        expect(esCerrado({ is_active: false })).toBe(true);
        expect(esCerrado({ is_active: 0 })).toBe(true);
        expect(esCerrado({ is_active: true })).toBe(false);
        expect(esCerrado({ is_active: 1 })).toBe(false);
    });

    it('resumenDiasInfo escala para planillas de un solo día', () => {
        const item = {
            service_date: '2026-10-16',
            is_active: false,
            dias_evidencia_incompleta: 0
        };
        const info = resumenDiasInfo(item);
        expect(info.total).toBe(1);
        expect(info.cerrados).toBe(1);
        expect(info.texto).toBe('1 de 1 cerrado');
        expect(info.clase).toBe('badge-subtle-success');
    });

    it('resumenDiasInfo escala para planillas de 2 días', () => {
        const item = {
            children: [
                { uuid: 'd1', service_date: '2026-10-16', estado: 'CERTIFICADA', is_active: false },
                { uuid: 'd2', service_date: '2026-10-17', estado: 'BORRADOR', is_active: true }
            ]
        };
        const info = resumenDiasInfo(item);
        expect(info.total).toBe(2);
        expect(info.cerrados).toBe(1);
        expect(info.pendientes).toBe(1);
        expect(info.texto).toBe('1 de 2 cerrados');
        expect(info.clase).toBe('badge-subtle-warning');
    });

    it('resumenDiasInfo escala limpiamente para rangos largos de 30 días', () => {
        const dias = Array.from({ length: 30 }, (_, i) => ({
            uuid: `d-${i}`,
            service_date: `2026-10-${String(i + 1).padStart(2, '0')}`,
            estado: i < 20 ? 'CERTIFICADA' : 'EN_CURSO',
            is_active: i >= 20
        }));
        const item = { children: dias };
        const info = resumenDiasInfo(item);
        expect(info.total).toBe(30);
        expect(info.cerrados).toBe(20);
        expect(info.pendientes).toBe(10);
        expect(info.texto).toBe('20 de 30 cerrados');
    });

    it('formatKm formatea números y maneja pendientes', () => {
        expect(formatKm(142500, 142500)).toContain('142.500 km — 142.500 km');
        expect(formatKm(142500, null)).toContain('142.500 km — Pendiente');
        expect(formatKm(null, null)).toBe('-');
    });

    it('paginaDestino calcula correctamente la página base 1', () => {
        expect(paginaDestino({ page: 0, rows: 10 })).toBe(1);
        expect(paginaDestino({ page: 2, rows: 10 })).toBe(3);
        expect(paginaDestino({ first: 20, rows: 10 })).toBe(3);
    });
});
