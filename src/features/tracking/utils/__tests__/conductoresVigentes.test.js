// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
    conductorVigente,
    conductoresVigentes,
    textoUltimoReporte,
    UMBRAL_SIN_REPORTAR_MS,
} from '../conductoresVigentes';

const AHORA = new Date('2026-10-26T12:00:00.000Z').getTime();

function driver(extra = {}) {
    return {
        third_party_uuid: 'drv-1',
        latitude: 4.61,
        longitude: -74.07,
        created_at: new Date(AHORA - 60_000).toISOString(),
        ...extra,
    };
}

describe('conductoresVigentes', () => {
    it('mantiene al conductor con un punto reciente', () => {
        expect(conductorVigente(driver(), AHORA)).toBe(true);
    });

    it('oculta al conductor que supera el umbral', () => {
        const viejo = driver({ created_at: new Date(AHORA - UMBRAL_SIN_REPORTAR_MS - 1).toISOString() });
        expect(conductorVigente(viejo, AHORA)).toBe(false);
    });

    it('acepta la marca de tiempo anidada en last_location', () => {
        const anidado = {
            latitude: 4.61,
            longitude: -74.07,
            last_location: { created_at: new Date(AHORA - 1_000).toISOString() },
        };
        expect(conductorVigente(anidado, AHORA)).toBe(true);
    });

    it('mantiene visible al conductor sin fecha (compatibilidad)', () => {
        expect(conductorVigente(driver({ created_at: undefined }), AHORA)).toBe(true);
    });

    it('descarta al conductor sin coordenadas', () => {
        expect(conductorVigente(driver({ latitude: null, longitude: null }), AHORA)).toBe(false);
    });

    it('no oculta por un reloj de servidor adelantado', () => {
        const futuro = driver({ created_at: new Date(AHORA + 60_000).toISOString() });
        expect(conductorVigente(futuro, AHORA)).toBe(true);
    });

    it('filtra la lista completa', () => {
        const lista = [
            driver(),
            driver({ third_party_uuid: 'drv-2', created_at: new Date(AHORA - UMBRAL_SIN_REPORTAR_MS - 1).toISOString() }),
        ];
        expect(conductoresVigentes(lista, AHORA).map((d) => d.third_party_uuid)).toEqual(['drv-1']);
    });

    it('devuelve lista vacía ante una entrada inválida', () => {
        expect(conductoresVigentes(null, AHORA)).toEqual([]);
        expect(conductoresVigentes(undefined, AHORA)).toEqual([]);
    });
});

describe('textoUltimoReporte', () => {
    it('describe el último reporte en minutos', () => {
        expect(textoUltimoReporte(driver({ created_at: new Date(AHORA - 180_000).toISOString() }), AHORA)).toBe('hace 3 min');
    });

    it('dice ahora para menos de un minuto', () => {
        expect(textoUltimoReporte(driver({ created_at: new Date(AHORA - 20_000).toISOString() }), AHORA)).toBe('ahora');
    });

    it('avisa cuando no hay hora', () => {
        expect(textoUltimoReporte(driver({ created_at: undefined }), AHORA)).toBe('sin hora');
    });
});
